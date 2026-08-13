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

    <!-- 四宮格統計數據 -->
    <div class="stats-container" v-if="stats && !loading && !error">
      <div class="stat-box rise">
        <div class="stat-label">區間單日最大漲幅</div>
        <div class="stat-value">+{{ stats.maxRise.toFixed(2) }}%</div>
        <div class="stat-date">{{ stats.maxRiseDate }} ( +{{ stats.maxRisePoint.toFixed(2) }} 點 )</div>
      </div>
      <div class="stat-box rise">
        <div class="stat-label">平均單日上漲幅度</div>
        <div class="stat-value">+{{ stats.avgRise.toFixed(2) }}%</div>
        <div class="stat-date">發生次數: {{ stats.countRise }} 次</div>
      </div>
      <div class="stat-box fall">
        <div class="stat-label">區間單日最大跌幅</div>
        <div class="stat-value">{{ stats.maxFall.toFixed(2) }}%</div>
        <div class="stat-date">{{ stats.maxFallDate }} ( {{ stats.maxFallPoint.toFixed(2) }} 點 )</div>
      </div>
      <div class="stat-box fall">
        <div class="stat-label">平均單日下跌幅度</div>
        <div class="stat-value">{{ stats.avgFall.toFixed(2) }}%</div>
        <div class="stat-date">發生次數: {{ stats.countFall }} 次</div>
      </div>
    </div>

    <!-- 漲跌幅分佈統計塊 -->
    <div class="distribution-wrapper" v-if="stats && !loading && !error">
      <div class="dist-card rise-dist">
        <div class="dist-header">🚀 單日漲幅超過 (發生次數)</div>
        <div class="dist-body">
          <div class="dist-item" v-for="i in 6" :key="'r'+i">
            <span class="dist-label">> {{ i }}%</span>
            <span class="dist-value text-success">{{ stats.distribution.rise[i] }}</span>
          </div>
        </div>
      </div>
      <div class="dist-card fall-dist">
        <div class="dist-header">⚠️ 單日跌幅超過 (發生次數)</div>
        <div class="dist-body">
          <div class="dist-item" v-for="i in 6" :key="'f'+i">
            <span class="dist-label">< -{{ i }}%</span>
            <span class="dist-value text-danger">{{ stats.distribution.fall[i] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 波段目標觸及機率 (滾動回測) -->
    <div class="prob-wrapper" v-if="probStats && !loading && !error">
      <h3 class="prob-title">🎯 歷史波段目標觸及機率 (基於目前查詢區間)</h3>
      
      <!-- 白話文解說面板 -->
      <div class="prob-explanation">
        <h5 class="fw-bold text-info mb-2">💡 我該如何解讀這張表？</h5>
        <p class="mb-2">這張表是量化交易的<strong>「歷史回測勝率」</strong>。系統將所選歷史區間內的<strong>每一天</strong>都當作買進點，統計在接下來的 1 到 5 週內，最高價或最低價是否曾經碰到對應的漲跌幅。</p>
        <div class="highlight-text">
          <strong>實戰應用 (若您在今日或昨日收盤買入)：</strong><br>
          請把下方的機率當作您<strong>「現在進場的預期勝率」</strong>。例如：若「一週內 +5%」的機率為 22%，代表歷史數據告訴您，現在買進後能在一週內快速獲利 5% 的機會約為兩成。<br>
          👉 <strong>用途：</strong> 幫助您評估設定的停利/停損目標，是否符合這檔股票的真實股性，避免過度樂觀。
        </div>
      </div>
      
      <div class="prob-tables mt-3">
        <!-- 上漲機率表 -->
        <div class="prob-card">
          <div class="prob-header text-success">📈 多方目標 (上漲)</div>
          <table class="prob-table">
            <thead>
              <tr>
                <th>目標幅度</th>
                <th>一週內 (5T)</th>
                <th>兩週內 (10T)</th>
                <th>三週內 (15T)</th>
                <th>四週內 (20T)</th>
                <th>五週內 (25T)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in probStats.thresholds" :key="'rise_'+t">
                <td class="fw-bold text-success">+{{ t }}%</td>
                <td>{{ probStats.results.rise[t][0] }}%</td>
                <td>{{ probStats.results.rise[t][1] }}%</td>
                <td>{{ probStats.results.rise[t][2] }}%</td>
                <td>{{ probStats.results.rise[t][3] }}%</td>
                <td>{{ probStats.results.rise[t][4] }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 下跌機率表 -->
        <div class="prob-card">
          <div class="prob-header text-danger">📉 空方目標 (下跌)</div>
          <table class="prob-table">
            <thead>
              <tr>
                <th>目標幅度</th>
                <th>一週內 (5T)</th>
                <th>兩週內 (10T)</th>
                <th>三週內 (15T)</th>
                <th>四週內 (20T)</th>
                <th>五週內 (25T)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in probStats.thresholds" :key="'fall_'+t">
                <td class="fw-bold text-danger">-{{ t }}%</td>
                <td>{{ probStats.results.fall[t][0] }}%</td>
                <td>{{ probStats.results.fall[t][1] }}%</td>
                <td>{{ probStats.results.fall[t][2] }}%</td>
                <td>{{ probStats.results.fall[t][3] }}%</td>
                <td>{{ probStats.results.fall[t][4] }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
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
const probStats = ref(null); 
const rawData = ref([]); 
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

const calculateStats = (dates, kLineValues) => {
  let maxRise = 0, maxFall = 0;
  let maxRiseDate = '', maxFallDate = '';
  let maxRisePoint = 0, maxFallPoint = 0;
  let sumRise = 0, countRise = 0;
  let sumFall = 0, countFall = 0;

  let distribution = {
    rise: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    fall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  };

  for (let i = 1; i < kLineValues.length; i++) {
    const prevClose = kLineValues[i - 1][1]; 
    const currClose = kLineValues[i][1];
    const changePercent = ((currClose - prevClose) / prevClose) * 100;
    const changePoint = currClose - prevClose;

    if (changePercent > 0) {
      sumRise += changePercent;
      countRise++;
      if (changePercent > maxRise) { 
        maxRise = changePercent; 
        maxRiseDate = dates[i]; 
        maxRisePoint = changePoint; 
      }
      if (changePercent >= 1) distribution.rise[1]++;
      if (changePercent >= 2) distribution.rise[2]++;
      if (changePercent >= 3) distribution.rise[3]++;
      if (changePercent >= 4) distribution.rise[4]++;
      if (changePercent >= 5) distribution.rise[5]++;
      if (changePercent >= 6) distribution.rise[6]++;
    } else if (changePercent < 0) {
      sumFall += changePercent;
      countFall++;
      if (changePercent < maxFall) { 
        maxFall = changePercent; 
        maxFallDate = dates[i]; 
        maxFallPoint = changePoint; 
      }
      if (changePercent <= -1) distribution.fall[1]++;
      if (changePercent <= -2) distribution.fall[2]++;
      if (changePercent <= -3) distribution.fall[3]++;
      if (changePercent <= -4) distribution.fall[4]++;
      if (changePercent <= -5) distribution.fall[5]++;
      if (changePercent <= -6) distribution.fall[6]++;
    }
  }

  const avgRise = countRise > 0 ? sumRise / countRise : 0;
  const avgFall = countFall > 0 ? sumFall / countFall : 0;

  stats.value = { 
    maxRise, maxFall, maxRiseDate, maxFallDate, 
    maxRisePoint, maxFallPoint,
    avgRise, avgFall, countRise, countFall,
    distribution 
  };
};

const calculateProbabilities = (kLineValues) => {
  // 🔥 新增：四週(20)、五週(25)
  const horizons = [5, 10, 15, 20, 25]; 
  // 🔥 新增：1%, 3%, 7%
  const thresholds = [1, 3, 5, 7, 10, 15, 20, 25, 30];

  let results = { rise: {}, fall: {} };
  thresholds.forEach(t => {
    results.rise[t] = [0, 0, 0, 0, 0];
    results.fall[t] = [0, 0, 0, 0, 0];
  });

  let totalCounts = [0, 0, 0, 0, 0];

  for (let i = 0; i < kLineValues.length; i++) {
    const currentClose = kLineValues[i][1]; 

    horizons.forEach((days, hIndex) => {
      if (i + days < kLineValues.length) {
        totalCounts[hIndex]++;
        let maxHigh = -Infinity;
        let minLow = Infinity;

        for (let j = 1; j <= days; j++) {
           const high = kLineValues[i + j][3]; 
           const low = kLineValues[i + j][2];  
           if (high > maxHigh) maxHigh = high;
           if (low < minLow) minLow = low;
        }

        const maxRisePct = ((maxHigh - currentClose) / currentClose) * 100;
        const maxFallPct = ((minLow - currentClose) / currentClose) * 100;

        thresholds.forEach(t => {
          if (maxRisePct >= t) results.rise[t][hIndex]++;
          if (maxFallPct <= -t) results.fall[t][hIndex]++; 
        });
      }
    });
  }

  thresholds.forEach(t => {
    // 配合時間軸數量擴增為 5
    for (let hIndex = 0; hIndex < 5; hIndex++) {
       const total = totalCounts[hIndex];
       results.rise[t][hIndex] = total > 0 ? ((results.rise[t][hIndex] / total) * 100).toFixed(1) : 0;
       results.fall[t][hIndex] = total > 0 ? ((results.fall[t][hIndex] / total) * 100).toFixed(1) : 0;
    }
  });

  probStats.value = { results, thresholds, horizons, totalCounts };
};

const renderChart = (data) => {
  const dom = chartContainer.value;
  if (!dom) return;

  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(dom);

  const dates = [];
  const kLineValues = [];

  data.forEach(item => {
    dates.push(item.time);
    
    if (isAdjusted.value && item.adjclose && item.close) {
      const ratio = item.adjclose / item.close;
      kLineValues.push([
        item.open * ratio,
        item.close * ratio, 
        item.low * ratio,
        item.high * ratio
      ]);
    } else {
      kLineValues.push([item.open, item.close, item.low, item.high]);
    }
  });

  calculateStats(dates, kLineValues);
  calculateProbabilities(kLineValues); 

  const existingDatesSet = new Set(dates); 
  const markLineData = [];

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
        markLine: {
          symbol: ['none', 'none'], 
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

    rawData.value = data; 
    
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

.stats-container {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
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
.stat-date { color: #b2b5be; font-size: 0.85rem; }

.distribution-wrapper { display: flex; gap: 16px; margin-bottom: 16px; }
@media (max-width: 992px) { .distribution-wrapper { flex-direction: column; } }
.dist-card { flex: 1; background-color: #1e222d; border: 1px solid #2b2b43; border-radius: 8px; padding: 16px; }
.dist-card.rise-dist { border-top: 3px solid #26a69a; }
.dist-card.fall-dist { border-top: 3px solid #ef5350; }
.dist-header { font-weight: 600; margin-bottom: 12px; font-size: 1rem; color: #d1d4dc; }
.dist-body { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.dist-item {
  display: flex; flex-direction: column; align-items: center; background-color: #2a2e39;
  padding: 10px; border-radius: 6px; flex: 1; min-width: 50px;
}
.dist-label { font-size: 0.85rem; color: #8c8f98; margin-bottom: 4px; }
.dist-value { font-size: 1.2rem; font-weight: 700; }
.text-success { color: #26a69a; }
.text-danger { color: #ef5350; }

/* 機率統計區域樣式 */
.prob-wrapper {
  background-color: #1e222d; border: 1px solid #2b2b43; border-radius: 8px;
  padding: 20px; margin-bottom: 24px;
}
.prob-title { margin-top: 0; margin-bottom: 12px; font-size: 1.2rem; color: #fff; }

/* 說明面板樣式 */
.prob-explanation {
  background-color: rgba(38, 166, 154, 0.05);
  border-left: 4px solid #26a69a;
  padding: 16px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 20px;
  color: #d1d4dc;
  font-size: 0.95rem;
  line-height: 1.5;
}
.highlight-text {
  background-color: #2a2e39;
  padding: 12px;
  border-radius: 6px;
  margin-top: 8px;
  border: 1px solid #434651;
}

.prob-tables { display: flex; gap: 16px; }
@media (max-width: 992px) { .prob-tables { flex-direction: column; } }
/* 加入 overflow-x: auto 確保五欄數據在小螢幕上可以滾動 */
.prob-card { flex: 1; background-color: #2a2e39; border-radius: 6px; overflow-x: auto; }
.prob-header { padding: 12px 16px; font-weight: bold; background-color: rgba(0,0,0,0.2); }
/* 加入 white-space: nowrap 防止表格內容被過度擠壓換行 */
.prob-table { width: 100%; border-collapse: collapse; text-align: right; white-space: nowrap; }
.prob-table th, .prob-table td { padding: 10px 16px; border-bottom: 1px solid #1e222d; }
.prob-table th { color: #8c8f98; font-weight: 500; text-align: right; }
.prob-table tbody tr:last-child td { border-bottom: none; }
.prob-table tbody tr:hover { background-color: rgba(255,255,255,0.02); }

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
