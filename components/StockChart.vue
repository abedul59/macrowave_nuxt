<template>
  <div class="stock-dashboard">
    <div class="header">
      <h2 class="title">美股 K 線圖與漲跌紀錄</h2>
      <div class="controls">
        <input 
          v-model="ticker" 
          type="text" 
          placeholder="輸入美股代號 (例: AAPL)" 
          class="ticker-input"
          @keyup.enter="fetchData"
        />
        <div class="range-buttons">
          <button 
            v-for="r in ranges" 
            :key="r.value"
            :class="{ active: range === r.value }"
            @click="setRange(r.value)"
          >
            {{ r.label }}
          </button>
        </div>
        <button class="search-btn" @click="fetchData" :disabled="loading">
          {{ loading ? '載入中...' : '查詢' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="stats-container" v-if="stats && !loading && !error">
      <div class="stat-box rise">
        <div class="stat-label">區間單日最大漲幅</div>
        <div class="stat-value">+{{ stats.maxRise.toFixed(2) }}%</div>
        <div class="stat-date">{{ stats.maxRiseDate }}</div>
      </div>
      <div class="stat-box fall">
        <div class="stat-label">區間單日最大跌幅</div>
        <div class="stat-value">{{ stats.maxFall.toFixed(2) }}%</div>
        <div class="stat-date">{{ stats.maxFallDate }}</div>
      </div>
    </div>

    <div class="chart-wrapper">
      <div ref="chartContainer" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef, nextTick } from 'vue';
import { createChart } from 'lightweight-charts';

const ticker = ref('AAPL');
const range = ref('1y');
const ranges = [
  { label: '1 年', value: '1y' },
  { label: '2 年', value: '2y' },
  { label: '3 年', value: '3y' },
  { label: '5 年', value: '5y' }
];

const loading = ref(false);
const error = ref('');
const stats = ref(null);

const chartContainer = ref(null);
const chart = shallowRef(null);
const candlestickSeries = shallowRef(null);

const setRange = (newRange) => {
  range.value = newRange;
  fetchData();
};

// 🔥 強化 1：加入 async / await nextTick，強迫等待容器渲染完畢
const initChart = async () => {
  await nextTick(); 
  
  if (!chartContainer.value) return;
  if (chart.value) return; // 如果已經初始化過，就不要重複建立

  chart.value = createChart(chartContainer.value, {
    // 給予預設寬度防呆，避免隱藏分頁時寬度為 0 導致崩潰
    width: chartContainer.value.clientWidth || 800, 
    height: 500,
    layout: {
      background: { type: 'solid', color: '#1E222D' },
      textColor: '#D9D9D9',
    },
    grid: {
      vertLines: { color: '#2B2B43' },
      horzLines: { color: '#2B2B43' },
    },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: '#2B2B43' },
    timeScale: { borderColor: '#2B2B43', timeVisible: true },
  });

  candlestickSeries.value = chart.value.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderDownColor: '#ef5350',
    borderUpColor: '#26a69a',
    wickDownColor: '#ef5350',
    wickUpColor: '#26a69a',
  });

  const resizeObserver = new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target !== chartContainer.value) return;
    const newRect = entries[0].contentRect;
    // 確保容器有尺寸才重繪，避免分頁切換時報錯
    if (newRect.width > 0 && newRect.height > 0 && chart.value) {
      chart.value.applyOptions({ width: newRect.width, height: newRect.height });
    }
  });

  resizeObserver.observe(chartContainer.value);

  onUnmounted(() => {
    resizeObserver.disconnect();
    if (chart.value) {
      chart.value.remove();
      chart.value = null;
      candlestickSeries.value = null;
    }
  });
};

const calculateStats = (data) => {
  let maxRise = 0;
  let maxFall = 0;
  let maxRiseDate = '';
  let maxFallDate = '';

  for (let i = 1; i < data.length; i++) {
    const prevClose = data[i - 1].close;
    const currentClose = data[i].close;
    const changePercent = ((currentClose - prevClose) / prevClose) * 100;

    if (changePercent > maxRise) {
      maxRise = changePercent;
      maxRiseDate = data[i].time;
    }
    if (changePercent < maxFall) {
      maxFall = changePercent;
      maxFallDate = data[i].time;
    }
  }

  stats.value = { maxRise, maxFall, maxRiseDate, maxFallDate };
};

const fetchData = async () => {
  if (!ticker.value) {
    error.value = '請輸入股票代號';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`/api/stock?ticker=${ticker.value.toUpperCase()}&range=${range.value}`);
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.statusMessage || errData.message || '取得資料失敗');
    }
    
    const data = await response.json();
    
    if (data.error) throw new Error(data.message);
    if (!data || data.length === 0) throw new Error('找不到該股票資料');

    // 🔥 強化 2：在塞入資料前，強制確認圖表與資料列都已準備好
    await nextTick();
    if (!chart.value || !candlestickSeries.value) {
      await initChart();
    }
    
    // 🔥 強化 3：最後防呆，真的有這個實例才執行 setData
    if (candlestickSeries.value) {
      candlestickSeries.value.setData(data);
      chart.value.timeScale().fitContent();
      calculateStats(data);
    } else {
      throw new Error('圖表容器初始化失敗，請重新載入網頁');
    }
    
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initChart();
});
</script>

<style scoped>
.stock-dashboard {
  background-color: #131722;
  color: #d1d4dc;
  padding: 24px;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.ticker-input {
  background-color: #2a2e39;
  border: 1px solid #434651;
  color: #fff;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  width: 150px;
}

.ticker-input:focus {
  border-color: #2962ff;
}

.range-buttons {
  display: flex;
  background-color: #2a2e39;
  border-radius: 6px;
  overflow: hidden;
}

.range-buttons button {
  background: none;
  border: none;
  color: #b2b5be;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.range-buttons button:hover {
  background-color: #363a45;
  color: #fff;
}

.range-buttons button.active {
  background-color: #2962ff;
  color: #fff;
  font-weight: 500;
}

.search-btn {
  background-color: #2962ff;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-btn:hover {
  background-color: #1e4bd8;
}

.search-btn:disabled {
  background-color: #434651;
  color: #8c8f98;
  cursor: not-allowed;
}

.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-box {
  flex: 1;
  background-color: #1e222d;
  border: 1px solid #2b2b43;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: transform 0.2s;
}

.stat-box:hover {
  transform: translateY(-2px);
}

.stat-box.rise {
  border-left: 4px solid #26a69a;
}

.stat-box.fall {
  border-left: 4px solid #ef5350;
}

.stat-label {
  color: #8c8f98;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.rise .stat-value {
  color: #26a69a;
}

.fall .stat-value {
  color: #ef5350;
}

.stat-date {
  color: #b2b5be;
  font-size: 0.85rem;
}

.error-message {
  background-color: rgba(239, 83, 80, 0.1);
  color: #ef5350;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 83, 80, 0.2);
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 500px;
  border: 1px solid #2b2b43;
  border-radius: 8px;
  overflow: hidden;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>
