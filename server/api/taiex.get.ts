export default defineEventHandler(async (event) => {
  try {
    const fetchYahoo = async (interval: string, range: string) => {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/^TWII?range=${range}&interval=${interval}`;
      const res = await fetch(url);
      const data = await res.json();
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      
      return timestamps.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split('T')[0],
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i] || 0 // 抓取成交量 (若無資料補 0)
      })).filter((q: any) => q.close !== null);
    };

    // 🔥 核心修正：將 weekly 與 monthly 的 range 改為 'max'，解鎖近 30 年歷史數據
    const [daily, weekly, monthly] = await Promise.all([
      fetchYahoo('1d', '5y'),   // 日線圖保留 5 年即可，避免封包過大導致載入緩慢
      fetchYahoo('1wk', 'max'), // 週線圖解鎖最大極限 (台股從 1997 年起算)
      fetchYahoo('1mo', 'max')  // 月線圖解鎖最大極限
    ]);

    return { success: true, data: { daily, weekly, monthly } };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
