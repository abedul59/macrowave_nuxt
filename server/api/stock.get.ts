// 🔥 關鍵修正 1：改用解構賦值的方式引入類別
import { YahooFinance } from 'yahoo-finance2';

// 🔥 關鍵修正 2：手動建立一個實例 (Instance)
const yahooFinance = new YahooFinance();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const ticker = query.ticker as string;
  const range = (query.range as string) || '1y'; // '1y', '2y', '3y', '5y'

  if (!ticker) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ticker symbol is required',
    });
  }

  // 計算時間區間
  const now = new Date();
  let startDate = new Date();
  
  if (range === '1y') {
    startDate.setFullYear(now.getFullYear() - 1);
  } else if (range === '2y') {
    startDate.setFullYear(now.getFullYear() - 2);
  } else if (range === '3y') {
    startDate.setFullYear(now.getFullYear() - 3);
  } else if (range === '5y') {
    startDate.setFullYear(now.getFullYear() - 5);
  } else {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  try {
    const queryOptions = {
      period1: startDate,
      period2: now,
      interval: '1d' as const,
    };
    
    // 使用剛才建立的實例來呼叫 historical 函數
    const result = await yahooFinance.historical(ticker, queryOptions);
    
    // 將資料格式化為 lightweight-charts 規定的結構
    const formattedData = result.map((item) => {
      const dateString = item.date.toISOString().split('T')[0];
      return {
        time: dateString,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      };
    });

    return formattedData;
  } catch (error: any) {
    console.error('Error fetching stock data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch data for ${ticker}: ${error.message}`,
    });
  }
});
