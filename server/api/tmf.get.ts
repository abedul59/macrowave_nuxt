export default defineEventHandler(async (event) => {
    try {
        // 取得 YYYY/MM/DD 格式字串的輔助函數
        const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}/${month}/${day}`;
        };

        const today = new Date();
        const pastDate = new Date();
        // 抓取近 15 天資料
        pastDate.setDate(today.getDate() - 15); 

        const startDateStr = formatDate(pastDate);
        const endDateStr = formatDate(today);

        // 🔥 終極偽裝：加上 Referer 騙定期交所我們是從它的官方網頁點擊下載的
        const baseHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'max-age=0',
            'Origin': 'https://www.taifex.com.tw'
        };

        // ==========================================
        // 1. 抓取三大法人 TMF 區間歷史資料
        // ==========================================
        const instParams = new URLSearchParams();
        instParams.append('queryStartDate', startDateStr);
        instParams.append('queryEndDate', endDateStr);
        instParams.append('commodityId', 'TMF');

        const instHeaders = { ...baseHeaders, 'Referer': 'https://www.taifex.com.tw/cht/3/futContractsDate' };
        
        const instRes = await fetch('https://www.taifex.com.tw/cht/3/futContractsDateDown', { 
            method: 'POST', 
            body: instParams.toString(), // 🔥 強制轉為標準 form-urlencoded 字串
            headers: instHeaders 
        });

        if (!instRes.ok) throw new Error(`法人資料 API 請求失敗，狀態碼: ${instRes.status}`);
        const instBuffer = await instRes.arrayBuffer();
        const instText = new TextDecoder('big5').decode(instBuffer);

        if (instText.includes('<html') || instText.includes('請稍後再試')) {
            throw new Error('被期交所防火牆阻擋 (回傳了網頁而非 CSV，請稍後再試)');
        }

        // ==========================================
        // 2. 抓取全市場 TMF 區間歷史資料
        // ==========================================
        const marketParams = new URLSearchParams();
        marketParams.append('down_type', '1');
        marketParams.append('queryStartDate', startDateStr);
        marketParams.append('queryEndDate', endDateStr);
        marketParams.append('commodity_id', 'TMF');

        const marketHeaders = { ...baseHeaders, 'Referer': 'https://www.taifex.com.tw/cht/3/futDataDown' };

        const marketRes = await fetch('https://www.taifex.com.tw/cht/3/futDataDown', { 
            method: 'POST', 
            body: marketParams.toString(), 
            headers: marketHeaders 
        });

        if (!marketRes.ok) throw new Error(`全市場資料 API 請求失敗，狀態碼: ${marketRes.status}`);
        const marketBuffer = await marketRes.arrayBuffer();
        const marketText = new TextDecoder('big5').decode(marketBuffer);

        if (marketText.includes('<html') || marketText.includes('請稍後再試')) {
            throw new Error('全市場資料被期交所防火牆阻擋');
        }

        // ==========================================
        // CSV 解析與聚合邏輯
        // ==========================================
        const parseCSV = (text: string) => {
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
            if (lines.length < 2) return [];
            const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            return lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const obj: any = {};
                csvHeaders.forEach((h, i) => obj[h] = values[i] || '');
                return obj;
            });
        };

        const instRows = parseCSV(instText);
        const marketRows = parseCSV(marketText);

        const instMap: any = {};
        instRows.forEach(row => {
            // 期交所的日期格式為 YYYY/MM/DD
            const date = row['日期'];
            if (!date) return;
            const netOI = parseInt(row['多空未平倉口數淨額'], 10) || 0;
            instMap[date] = (instMap[date] || 0) + netOI;
        });

        const marketMap: any = {};
        marketRows.forEach(row => {
            const date = row['日期'];
            const session = row['交易時段'];
            if (!date || session !== '一般') return;
            const oi = parseInt(row['未沖銷契約數'], 10) || 0;
            marketMap[date] = (marketMap[date] || 0) + oi;
        });

        const historyData: any[] = [];
        Object.keys(marketMap).forEach(date => {
            const totalOI = marketMap[date];
            if (totalOI <= 0) return;
            const instNetOI = instMap[date] || 0;
            const retailNetOI = -instNetOI;
            const retailRatio = retailNetOI / totalOI;

            historyData.push({ date, totalOI, instNetOI, retailNetOI, retailRatio });
        });

        historyData.sort((a, b) => b.date.localeCompare(a.date));

        if (historyData.length === 0) {
            return { 
                success: false, 
                message: `成功連線期交所，但查無 ${startDateStr} 至 ${endDateStr} 的交易數據 (可能為連假)` 
            };
        }

        return {
            success: true,
            latest: historyData[0],
            history: historyData
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
});
