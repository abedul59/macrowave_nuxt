import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const ticker = query.ticker as string;
  const range = (query.range as string) || '1y'; 

  if (!ticker) {
    return { error: true, message: '請輸入股票代號 (Ticker symbol is required)' };
  }

  const now = new Date();
  let startDate = new Date();
  
  if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);
  else if (range === '2y') startDate.setFullYear(now.getFullYear() - 2);
  else if (range === '3y') startDate.setFullYear(now.getFullYear() - 3);
  else if (range === '5y') startDate.setFullYear(now.getFullYear() - 5);
  else startDate.setFullYear(now.getFullYear() - 1);

  try {
    const queryOptions = {
      period1: startDate,
      period2: now,
      interval: '1d' as const,
    };
    
    // 🔥 關鍵修正 1：改用 Yahoo 官方建議的 .chart() 方法
    const result = await yahooFinance.chart(ticker, queryOptions);
    
    // 🔥 關鍵修正 2：資料現在存放在 result.quotes 陣列中
    if (!result.quotes || result.quotes.length === 0) {
        return [];
    }

    const formattedData = result.quotes
      .filter(item => item.close !== null) // 過濾掉可能的空資料
      .map((item) => {
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
    console.error('Yahoo Finance API 錯誤:', error);
    return {
      error: true,
      message: `抓取失敗 [${error.name || 'Error'}]: ${error.message}`
    };
  }
});
