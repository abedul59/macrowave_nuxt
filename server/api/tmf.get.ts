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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30); // 抓取過去 30 天包含例假日的資料

        const startDateStr = formatDate(thirtyDaysAgo);
        const endDateStr = formatDate(today);

        // 1. 抓取三大法人 TMF 區間歷史資料
        const instParams = new URLSearchParams({ queryStartDate: startDateStr, queryEndDate: endDateStr, commodityId: 'TMF' });
        const instRes = await fetch('https://www.taifex.com.tw/cht/3/futContractsDateDown', { method: 'POST', body: instParams });
        const instBuffer = await instRes.arrayBuffer();
        const instText = new TextDecoder('big5').decode(instBuffer);
        
        // 2. 抓取全市場 TMF 區間歷史資料
        const marketParams = new URLSearchParams({ down_type: '1', queryStartDate: startDateStr, queryEndDate: endDateStr, commodity_id: 'TMF' });
        const marketRes = await fetch('https://www.taifex.com.tw/cht/3/futDataDown', { method: 'POST', body: marketParams });
        const marketBuffer = await marketRes.arrayBuffer();
        const marketText = new TextDecoder('big5').decode(marketBuffer);

        // CSV 解析函數
        const parseCSV = (text: string) => {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
            if (lines.length < 2) return [];
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            return lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const obj: any = {};
                headers.forEach((h, i) => obj[h] = values[i] || '');
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
            return { success: false, message: '期交所歷史區間內查無交易數據' };
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
