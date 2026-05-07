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
        volume: quote.volume[i] || 0 // 🔥 新增抓取成交量 (若無資料補 0)
      })).filter((q: any) => q.close !== null);
    };

    const [daily, weekly, monthly] = await Promise.all([
      fetchYahoo('1d', '2y'),
      fetchYahoo('1wk', '5y'),
      fetchYahoo('1mo', '10y')
    ]);

    return { success: true, data: { daily, weekly, monthly } };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
