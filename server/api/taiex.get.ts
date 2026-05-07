export default defineEventHandler(async (event) => {
  try {
    // 透過 Yahoo Finance Query2 API 獲取台股加權指數 (^TWII) 資料
    // 抓取日線(用來算 20MA, 60MA)、週線(算週KD)、月線(算月KD)
    const fetchYahoo = async (interval: string, range: string) => {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/^TWII?range=${range}&interval=${interval}`;
      const res = await fetch(url);
      const data = await res.json();
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      
      // 整理成陣列格式 { date, open, high, low, close }
      return timestamps.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split('T')[0],
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i]
      })).filter((q: any) => q.close !== null); // 過濾無效資料
    };

    const [daily, weekly, monthly] = await Promise.all([
      fetchYahoo('1d', '2y'),  // 日線抓2年 (足夠算60MA與K線圖)
      fetchYahoo('1wk', '5y'), // 週線抓5年 (尋找週KD極值週期)
      fetchYahoo('1mo', '10y') // 月線抓10年 (尋找月KD極值週期)
    ]);

    return { success: true, data: { daily, weekly, monthly } };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
