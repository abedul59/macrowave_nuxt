import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    try {
        // 💡 讀取放置於 public 資料夾下的 tmf_historical_data.csv
        const filePath = path.join(process.cwd(), 'public', 'tmf_historical_data.csv');

        // 防呆：檢查檔案是否存在
        if (!fs.existsSync(filePath)) {
            return { 
                success: false, 
                message: '找不到 tmf_historical_data.csv，請確定已將檔案放入 public 資料夾中！' 
            };
        }

        const csvText = fs.readFileSync(filePath, 'utf-8');
        
        // 簡易 CSV 解析 (相容各種換行符號)
        const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        if (lines.length < 2) throw new Error('CSV 格式錯誤或無資料');

        const headers = lines[0].split(',').map(h => h.trim());
        const historyData: any[] = [];

        // 遍歷所有歷史資料
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length < headers.length) continue;

            const row: any = {};
            headers.forEach((h, idx) => row[h] = values[idx].trim());

            historyData.push({
                date: row['日期'],
                totalOI: parseFloat(row['Total_OI']) || 0,
                instNetOI: parseFloat(row['Inst_Net_OI']) || 0,
                retailNetOI: parseFloat(row['Retail_Net_OI']) || 0,
                retailRatio: parseFloat(row['Retail_Ratio']) || 0
            });
        }

        // 依照日期由新到舊排序
        historyData.sort((a, b) => b.date.localeCompare(a.date));

        return {
            success: true,
            latest: historyData[0], // 取最新的一筆當作儀表板主數據
            history: historyData.slice(0, 30) // 擷取近 30 個交易日顯示於前端歷史表格
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
});
