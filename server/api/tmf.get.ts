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
        // 🔥 縮短為近 15 天，避免觸發期交所跨月或天數過長的查詢限制
        pastDate.setDate(today.getDate() - 15); 

        const startDateStr = formatDate(pastDate);
        const endDateStr = formatDate(today);

        // 🔥 核心修正：加入完整的瀏覽器偽裝 Header，突破期交所防爬蟲機制
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        // 1. 抓取三大法人 TMF 區間歷史資料
        const instParams = new URLSearchParams({ queryStartDate: startDateStr, queryEndDate: endDateStr, commodityId: 'TMF' });
        const instRes = await fetch('https://www.taifex.com.tw/cht/3/futContractsDateDown', { method: 'POST', body: instParams, headers });
        const instBuffer = await instRes.arrayBuffer();
        const instText = new TextDecoder('big5').decode(instBuffer);
        
        // 2. 抓取全市場 TMF 區間歷史資料
        const marketParams = new URLSearchParams({ down_type: '1', queryStartDate: startDateStr, queryEndDate: endDateStr, commodity_id: 'TMF' });
        const marketRes = await fetch('https://www.taifex.com.tw/cht/3/futDataDown', { method: 'POST', body: marketParams, headers });
        const marketBuffer = await marketRes.arrayBuffer();
        const marketText = new TextDecoder('big5').decode(marketBuffer);

        // CSV 解析函數 (強化換行符號容錯率)
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

        // 依日期聚合三大法人未平倉量
        const instMap: any = {};
        instRows.forEach(row => {
            const date = row['日期'];
            if (!date) return;
            const netOI = parseInt(row['多空未平倉口數淨額'], 10) || 0;
            instMap[date] = (instMap[date] || 0) + netOI;
        });

        // 依日期聚合全市場一般交易時段未平倉量
        const marketMap: any = {};
        marketRows.forEach(row => {
            const date = row['日期'];
            const session = row['交易時段'];
            if (!date || session !== '一般') return;
            const oi = parseInt(row['未沖銷契約數'], 10) || 0;
            marketMap[date] = (marketMap[date] || 0) + oi;
        });

        // 合併與計算多空比
        const historyData: any[] = [];
        Object.keys(marketMap).forEach(date => {
            const totalOI = marketMap[date];
            if (totalOI <= 0) return;
            const instNetOI = instMap[date] || 0;
            const retailNetOI = -instNetOI;
            const retailRatio = retailNetOI / totalOI;

            historyData.push({ date, totalOI, instNetOI, retailNetOI, retailRatio });
        });

        // 排序：由新到舊
        historyData.sort((a, b) => b.date.localeCompare(a.date));

        if (historyData.length === 0) {
            return { 
                success: false, 
                message: '期交所歷史區間內查無交易數據。可能原因：目前為連續假日，或期交所伺服器阻擋存取。' 
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
