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
        
        <!-- 🔥 新增：還權 / 非還權 切換開關 -->
        <div class="toggle-switch" @click="toggleAdjusted">
          <div class="slider" :class="{ 'adjusted': isAdjusted }"></div>
          <span :class="{ 'active': !isAdjusted }">非還權</span>
          <span :class="{ 'active': isAdjusted }">還權息</span>
        </div>

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

    <!-- 🔥 升級：四宮格統計數據 -->
    <div class="stats-container" v-if="stats && !loading && !error">
      <div class="stat-box rise">
        <div class="stat-label">區間單日最大漲幅</div>
        <div class="stat-value">+{{ stats.maxRise.toFixed(2) }}%</div>
        <div class="stat-date">{{ stats.maxRiseDate }}</div>
      </div>
      <div class="stat-box rise">
        <div class="stat-label">平均單日上漲幅度</div>
        <div class="stat-value">+{{ stats.avgRise.toFixed(2) }}%</div>
        <div class="stat-date">發生次數: {{ stats.countRise }} 次</div>
      </div>
      <div class="stat-box fall">
        <div class="stat-label">區間單日最大跌幅</div>
        <div class="stat-value">{{ stats.maxFall.toFixed(2) }}%</div>
        <div class="stat-date">{{ stats.maxFallDate }}</div>
      </div>
      <div class="stat-box fall">
        <div class="stat-label">平均單日下跌幅度</div>
        <div class="stat-value">{{ stats.avgFall.toFixed(2) }}%</div>
        <div class="stat-date">發生次數: {{ stats.countFall }} 次</div>
      </div>
    </div>

    <div class="chart-wrapper">
      <div id="us-stock-chart" ref="chartContainer" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
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
const rawData = ref([]); // 暫存伺服器抓回來的原始資料，切換還權時不用重新 Fetch
const isAdjusted = ref(false);

const chartContainer = ref(null);
let chartInstance = null;
let resizeObserver = null;

const setRange = (newRange) => {
  range.value = newRange;
  fetchData();
};

const toggleAdjusted = () => {
  isAdjusted.value = !isAdjusted.value;
  if (rawData.value.length > 0) {
    renderChart(rawData.value);
  }
};

// 🔥 升級：計算平均漲跌幅
const calculateStats = (dates, kLineValues) => {
  let maxRise = 0, maxFall = 0;
  let maxRiseDate = '', maxFallDate = '';
  let sumRise = 0, countRise = 0;
  let sumFall = 0, countFall = 0;

  // i=1 開始，因為要跟前一天比
  for (let i = 1; i < kLineValues.length; i++) {
    const prevClose = kLineValues[i - 1][1]; // index 1 是收盤價
    const currClose = kLineValues[i][1];
    const change = ((currClose - prevClose) / prevClose) * 100;

    if (change > 0) {
      sumRise += change;
      countRise++;
      if (change > maxRise) { maxRise = change; maxRiseDate = dates[i]; }
    } else if (change < 0) {
      sumFall += change;
      countFall++;
      if (change < maxFall) { maxFall = change; maxFallDate = dates[i]; }
    }
  }

  const avgRise = countRise > 0 ? sumRise / countRise : 0;
  const avgFall = countFall > 0 ? sumFall / countFall : 0;

  stats.value = { 
    maxRise, maxFall, maxRiseDate, maxFallDate, 
    avgRise, avgFall, countRise, countFall 
  };
};

const renderChart = (data) => {
  const dom = chartContainer.value;
  if (!dom) return;

  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(dom);

  const dates = [];
  const kLineValues = [];

  // 🔥 處理還權息邏輯
  data.forEach(item => {
    dates.push(item.time);
    
    if (isAdjusted.value && item.adjclose && item.close) {
      // 算出還權比例，等比例調整開高低收
      const ratio = item.adjclose / item.close;
      kLineValues.push([
        item.open * ratio,
        item.close * ratio, // 這裡其實就是 adjclose
        item.low * ratio,
        item.high * ratio
      ]);
    } else {
      kLineValues.push([item.open, item.close, item.low, item.high]);
    }
  });

  // 計算並更新統計資料
  calculateStats(dates, kLineValues);

  // ==============================
  // 📅 事件標記引擎設定
  // ==============================
  const existingDatesSet = new Set(dates); // 用於快速檢查日期是否存在圖表區間內
  const markLineData = [];

  // 1. 聯準會 FOMC 會議日期 (2023 - 2026)
  const fedMeetingDates = [
    '2023-02-01', '2023-03-22', '2023-05-03', '2023-06-14', '2023-07-26', '2023-09-20', '2023-11-01', '2023-12-13',
    '2024-01-31', '2024-03-20', '2024-05-01', '2024-06-12', '2024-07-31', '2024-09-18', '2024-11-07', '2024-12-18',
    '2025-01-29', '2025-03-19', '2025-05-07', '2025-06-18', '2025-07-30', '2025-09-17', '2025-10-29', '2025-12-10',
    '2026-01-28', '2026-03-18', '2026-05-06', '2026-06-17', '2026-07-29', '2026-09-16', '2026-11-04', '2026-12-16'
  ];

  fedMeetingDates.forEach(d => {
    if (existingDatesSet.has(d)) {
      markLineData.push({
        xAxis: d,
        lineStyle: { color: '#8c8f98', type: 'dashed', opacity: 0.5 },
        label: { formatter: 'Fed', position: 'insideStartBottom', color: '#8c8f98' }
      });
    }
  });

  // 2. 財報公佈日 (此處以 AAPL 過去幾次作為示範)
  const earningsDates = ['2023-02-02', '2023-05-04', '2023-08-03', '2023-11-02', '2024-02-01', '2024-05-02', '2024-08-01', '2024-10-31'];
  
  earningsDates.forEach(d => {
    if (existingDatesSet.has(d)) {
      markLineData.push({
        xAxis: d,
        lineStyle: { color: '#e0ac00', type: 'dotted', opacity: 0.8 },
        label: { formatter: '財報', position: 'insideEndTop', color: '#e0ac00', fontWeight: 'bold' }
      });
    }
  });

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: '5%', right: '5%', bottom: '15%', top: '5%' },
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
      position: 'right',
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
        name: isAdjusted.value ? '美股 K 線 (還權息)' : '美股 K 線 (非還權)',
        type: 'candlestick',
        data: kLineValues,
        itemStyle: {
          color: '#26a69a',       
          color0: '#ef5350',      
          borderColor: '#26a69a', 
          borderColor0: '#ef5350' 
        },
        // 🔥 將事件線條綁定至圖表
        markLine: {
          symbol: ['none', 'none'], // 不顯示箭頭
          data: markLineData
        }
      }
    ]
  };

  chartInstance.setOption(option);

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

    rawData.value = data; // 暫存資料
    
    await nextTick();
    renderChart(rawData.value);
    
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
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

.header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
@media (min-width: 768px) { .header { flex-direction: row; justify-content: space-between; align-items: center; } }
.title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #fff; }
.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }

.ticker-input {
  background-color: #2a2e39; border: 1px solid #434651; color: #fff;
  padding: 10px 16px; border-radius: 6px; font-size: 14px; outline: none; width: 150px;
}
.ticker-input:focus { border-color: #2962ff; }

/* 🔥 切換按鈕樣式 */
.toggle-switch {
  display: flex; background-color: #2a2e39; border-radius: 6px;
  position: relative; cursor: pointer; padding: 4px; user-select: none; align-items: center;
}
.toggle-switch span {
  width: 70px; text-align: center; padding: 6px 0; font-size: 14px; color: #8c8f98;
  z-index: 1; transition: color 0.3s;
}
.toggle-switch span.active { color: #fff; font-weight: bold; }
.toggle-switch .slider {
  position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px);
  background-color: #2962ff; border-radius: 4px; transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}
.toggle-switch .slider.adjusted { transform: translateX(100%); }

.range-buttons { display: flex; background-color: #2a2e39; border-radius: 6px; overflow: hidden; }
.range-buttons button { background: none; border: none; color: #b2b5be; padding: 10px 16px; font-size: 14px; cursor: pointer; }
.range-buttons button:hover { background-color: #363a45; color: #fff; }
.range-buttons button.active { background-color: #2962ff; color: #fff; font-weight: 500; }

.search-btn {
  background-color: #2962ff; color: #fff; border: none; padding: 10px 24px; border-radius: 6px;
  font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
}
.search-btn:hover { background-color: #1e4bd8; }
.search-btn:disabled { background-color: #434651; color: #8c8f98; cursor: not-allowed; }

/* 🔥 四宮格統計區塊 */
.stats-container {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
}
@media (max-width: 992px) { .stats-container { grid-template-columns: repeat(2, 1fr); } }
.stat-box {
  background-color: #1e222d; border: 1px solid #2b2b43; border-radius: 8px;
  padding: 16px; text-align: center; transition: transform 0.2s;
}
.stat-box:hover { transform: translateY(-2px); }
.stat-box.rise { border-left: 4px solid #26a69a; }
.stat-box.fall { border-left: 4px solid #ef5350; }
.stat-label { color: #8c8f98; font-size: 0.9rem; margin-bottom: 8px; }
.stat-value { font-size: 1.8rem; font-weight: 700; margin-bottom: 4px; }
.rise .stat-value { color: #26a69a; }
.fall .stat-value { color: #ef5350; }
.stat-date { color: #b2b5be; font-size: 0.85rem; }

.error-message {
  background-color: rgba(239, 83, 80, 0.1); color: #ef5350; padding: 12px 16px;
  border-radius: 6px; margin-bottom: 24px; border: 1px solid rgba(239, 83, 80, 0.2);
}
.chart-wrapper {
  position: relative; width: 100%; height: 550px; border: 1px solid #2b2b43;
  border-radius: 8px; overflow: hidden; background-color: #1E222D;
}
.chart-container { width: 100%; height: 100%; }
</style>
