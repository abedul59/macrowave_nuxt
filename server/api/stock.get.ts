import yahooFinance from 'yahoo-finance2';

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

  // Calculate start date based on range
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
    
    const result = await yahooFinance.historical(ticker, queryOptions);
    
    // Format data for lightweight-charts
    const formattedData = result.map((item) => {
      // Lightweight charts requires dates in YYYY-MM-DD format (string)
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
