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
      <!-- 統一 ECharts 的容器 -->
      <div id="us-stock-chart" ref="chartContainer" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
// 🔥 統一改用 ECharts
import * as echarts from 'echarts';

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
let chartInstance = null;
let resizeObserver = null;

const setRange = (newRange) => {
  range.value = newRange;
  fetchData();
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

// 🔥 使用 ECharts 的渲染引擎
const renderChart = (data) => {
  const dom = chartContainer.value;
  if (!dom) return;

  if (chartInstance) {
    chartInstance.dispose();
  }
  chartInstance = echarts.init(dom);

  // ECharts K 線圖要求的資料格式: [開盤, 收盤, 最低, 最高]
  const dates = [];
  const kLineValues = [];

  data.forEach(item => {
    dates.push(item.time);
    // 確保順序正確：open, close, low, high
    kLineValues.push([item.open, item.close, item.low, item.high]);
  });

  const option = {
    backgroundColor: 'transparent', // 讓背景吃 CSS 的顏色
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%', // 留空間給底部的縮放條
      top: '5%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      scale: true,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#434651' } },
      axisLabel: { color: '#8c8f98' },
      splitLine: { show: false }
    },
    yAxis: {
      scale: true,
      position: 'right', // 美股習慣把價格放右邊
      axisLine: { lineStyle: { color: '#434651' } },
      axisLabel: { color: '#8c8f98' },
      splitLine: { lineStyle: { color: '#2B2B43' } }
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { show: true, type: 'slider', top: '90%', bottom: '2%', borderColor: '#2B2B43', textStyle: { color: '#8c8f98' } }
    ],
    series: [
      {
        name: '美股 K 線',
        type: 'candlestick',
        data: kLineValues,
        itemStyle: {
          color: '#26a69a',       // 漲: 實心綠
          color0: '#ef5350',      // 跌: 實心紅
          borderColor: '#26a69a', // 漲邊框
          borderColor0: '#ef5350' // 跌邊框
        }
      }
    ]
  };

  chartInstance.setOption(option);

  // 加入 RWD 自動縮放監聽
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (chartInstance) chartInstance.resize();
    });
    resizeObserver.observe(dom);
  }
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

    // 確保 DOM 已更新才畫圖
    await nextTick();
    renderChart(data);
    calculateStats(data);
    
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // 元件初次掛載時可以選擇預設載入 AAPL
  // fetchData();
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
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
  background-color: #1E222D;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>
