export default defineEventHandler(async (event) => {
    // 輔助函數：取得前 N 天的日期字串 YYYY/MM/DD
    const getDateStr = (daysAgo: number) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    };

    // 解析 CSV 的輔助函數
    const parseCSV = (csvText: string) => {
        const lines = csvText.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            let obj: any = {};
            headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
            return obj;
        });
    };

    // 往前找最近 5 天，找到有資料的交易日為止
    for (let i = 0; i < 5; i++) {
        const dateStr = getDateStr(i);
        try {
            // 1. 抓取三大法人資料
            const instParams = new URLSearchParams({ queryStartDate: dateStr, queryEndDate: dateStr, commodityId: 'TMF' });
            const instRes = await fetch('https://www.taifex.com.tw/cht/3/futContractsDateDown', { method: 'POST', body: instParams });
            const instBuffer = await instRes.arrayBuffer();
            const instText = new TextDecoder('big5').decode(instBuffer);
            
            if (instText.includes("查無資料") || instText.trim() === '') continue; // 假日無資料
            
            const instData = parseCSV(instText);
            let instNetOI = 0;
            instData.forEach(row => {
                if (row['多空未平倉口數淨額']) {
                    instNetOI += parseInt(row['多空未平倉口數淨額'], 10) || 0;
                }
            });

            // 2. 抓取全市場資料
            const marketParams = new URLSearchParams({ down_type: '1', queryStartDate: dateStr, queryEndDate: dateStr, commodity_id: 'TMF' });
            const marketRes = await fetch('https://www.taifex.com.tw/cht/3/futDataDown', { method: 'POST', body: marketParams });
            const marketBuffer = await marketRes.arrayBuffer();
            const marketText = new TextDecoder('big5').decode(marketBuffer);
            
            const marketData = parseCSV(marketText);
            let totalOI = 0;
            marketData.forEach(row => {
                // 只統計一般交易時段
                if (row['交易時段'] === '一般' && row['未沖銷契約數']) {
                    totalOI += parseInt(row['未沖銷契約數'], 10) || 0;
                }
            });

            if (totalOI > 0) {
                const retailNetOI = -instNetOI;
                const retailRatio = retailNetOI / totalOI;
                return { success: true, data: { date: dateStr, instNetOI, totalOI, retailNetOI, retailRatio } };
            }
        } catch (e) {
            console.error(`Fetch error on ${dateStr}:`, e);
        }
    }
    return { success: false, message: '無法取得近期微台指未平倉資料' };
});
