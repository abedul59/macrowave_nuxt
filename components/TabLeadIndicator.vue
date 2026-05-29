<template>
  <div class="container pb-5 mt-4">
    <div class="card shadow-sm border-0 mb-4 bg-light">
      <div class="card-body">
        <h5 class="fw-bold text-primary mb-2">📊 台灣領先指標 ╳ 0050 交易策略</h5>
        <p class="text-muted small mb-0">
          策略邏輯：當 (景氣分數 ≤ 22 且 領先指標回升) 或 (領先指標 > 100) 時買進；當 (領先指標 < 100 且 領先指標下滑) 時賣出。
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3 fw-bold text-primary">載入回測數據與籌碼資料中...</p>
    </div>

    <div v-if="errorMsg" class="alert alert-danger fw-bold text-center">
      ❌ 讀取失敗：{{ errorMsg }}
    </div>

    <div v-if="!isLoading && chartDataList.length > 0">
      
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
          <span>📈 0050 K線走勢與領先指標對照圖</span>
          <span class="badge bg-primary">滑鼠滾輪可縮放區間</span>
        </div>
        <div class="card-body p-2">
          <div id="chart-lead-0050" style="width: 100%; height: 800px;"></div>
        </div>
      </div>

      <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-secondary text-white fw-bold d-flex justify-content-between">
          <span>📜 歷史交易信號明細</span>
          <span class="badge bg-light text-dark">共 {{ trades.length }} 筆交易</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
            <table class="table table-hover table-striped mb-0 text-center align-middle" style="font-size: 0.9rem;">
              <thead class="table-light sticky-top">
                <tr>
                  <th>交易日期</th>
                  <th>動作</th>
                  <th>觸發價格 (0050)</th>
                  <th>當時領先指標</th>
                  <th>當時景氣分數</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, index) in trades.slice().reverse()" :key="index">
                  <td class="text-muted fw-bold">{{ t.date }}</td>
                  <td>
                    <span :class="t.type === 'BUY' ? 'badge bg-success' : 'badge bg-danger'">
                      {{ t.type === 'BUY' ? '買進 (BUY)' : '賣出 (SELL)' }}
                    </span>
                  </td>
                  <td class="text-dark fw-bold">{{ t.price.toFixed(2) }}</td>
                  <td>{{ t.lead.toFixed(2) }}</td>
                  <td>{{ t.score }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const isLoading = ref(true);
const errorMsg = ref('');
const chartDataList = ref([]);
const trades = ref([]);
let chartInstance = null;

// 使用 Nuxt 3 內建的 Supabase Client (需確保專案已安裝 @nuxtjs/supabase)
const supabase = useSupabaseClient();

onMounted(async () => {
  try {
    isLoading.value = true;
    
    // 從 Supabase 讀取資料表，並依照日期舊到新排序
    const { data, error } = await supabase
      .from('macro_lead_0050')
      .select('*')
      .order('date', { ascending: true }); 

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('資料庫中目前無數據，請先上傳整合好的資料。');

    // 1. 在前端重現 Python 策略邏輯
    let currentPosition = 1; // 預設持有
    const processedData = [];
    const tradeRecords = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // 🔥 關鍵修復：強制將 Supabase 傳來的「字串」轉換為純「數字 (Float)」
      const openPrice = parseFloat(row.open);
      const closePrice = parseFloat(row.close);
      const lowPrice = parseFloat(row.low);
      const highPrice = parseFloat(row.high);
      const leadValue = parseFloat(row.lead);
      const scoreValue = parseInt(row.score);

      const prevRow = i > 0 ? data[i - 1] : row;
      const prevLeadValue = i > 0 ? parseFloat(prevRow.lead) : leadValue;
      
      const leadDiff = leadValue - prevLeadValue;
      
      let signal = null;
      
      // 買進條件
      if ((scoreValue <= 22 && leadDiff > 0) || leadValue > 100) {
        signal = 1;
      } 
      // 賣出條件
      else if (leadValue < 100 && leadDiff < 0) {
        signal = 0;
      }

      if (signal !== null) {
        currentPosition = signal;
      }

      // 紀錄買賣點
      if (i > 0) {
        const prevPosition = processedData[i - 1].position;
        if (currentPosition === 1 && prevPosition === 0) {
          tradeRecords.push({ date: row.date, type: 'BUY', price: closePrice, lead: leadValue, score: scoreValue });
        } else if (currentPosition === 0 && prevPosition === 1) {
          tradeRecords.push({ date: row.date, type: 'SELL', price: closePrice, lead: leadValue, score: scoreValue });
        }
      }

      // 存入轉型後的乾淨資料
      processedData.push({
        date: row.date,
        open: openPrice,
        close: closePrice,
        low: lowPrice,
        high: highPrice,
        lead: leadValue,
        score: scoreValue,
        position: currentPosition
      });
    }

    chartDataList.value = processedData;
    trades.value = tradeRecords;

    // 確保 DOM 渲染完畢後再畫圖
    await nextTick();
    renderChart(processedData, tradeRecords);
    
    // 綁定視窗縮放事件
    window.addEventListener('resize', handleResize);

  } catch (err) {
    console.error('資料讀取錯誤:', err);
    errorMsg.value = err.message || '無法連線至資料庫';
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance) chartInstance.dispose();
});

const handleResize = () => {
  if (chartInstance) chartInstance.resize();
};

const renderChart = (data, tradeRecords) => {
  const dom = document.getElementById('chart-lead-0050');
  if (!dom) return;

  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(dom);

  const dates = data.map(item => item.date);
  // ECharts K線資料格式: [開, 收, 低, 高]
  const kLineData = data.map(item => [item.open, item.close, item.low, item.high]);
  const leadData = data.map(item => item.lead);

  // 整理標記點 (買賣信號箭頭)
  const markPointData = tradeRecords.map(t => {
    return {
      name: t.type,
      coord: [t.date, t.price],
      value: t.type,
      itemStyle: { color: t.type === 'BUY' ? '#198754' : '#dc3545' },
      symbol: t.type === 'BUY' ? 'arrow' : 'pin',
      symbolSize: t.type === 'BUY' ? 15 : 20,
      symbolRotate: t.type === 'BUY' ? 0 : 180,
      label: { show: false }
    };
  });

  // 整理背景色塊 (持有期間)
  const holdingAreas = [];
  let startHoldDate = null;
  for (let i = 0; i < data.length; i++) {
    if (data[i].position === 1 && startHoldDate === null) {
      startHoldDate = data[i].date;
    } else if (data[i].position === 0 && startHoldDate !== null) {
      holdingAreas.push([{ xAxis: startHoldDate }, { xAxis: data[i - 1].date }]);
      startHoldDate = null;
    }
  }
  
  // 如果到最後一天都還持有，補上最後一筆區間
  if (startHoldDate !== null) {
    holdingAreas.push([{ xAxis: startHoldDate }, { xAxis: data[data.length - 1].date }]);
  }

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    legend: { data: ['0050 月K線', '領先指標 (不含趨勢)'], top: 5 },
    grid: [
      { left: '8%', right: '5%', top: '8%', height: '55%' },  // 上半部 K 線圖
      { left: '8%', right: '5%', top: '70%', height: '20%' }  // 下半部領先指標圖
    ],
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLabel: { show: false } },
      { type: 'category', data: dates, gridIndex: 1 }
    ],
    yAxis: [
      { scale: true, gridIndex: 0, name: '股價 (元)' },
      { scale: true, gridIndex: 1, name: '指標' }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], start: 0, end: 100 },
      { show: true, xAxisIndex: [0, 1], top: '94%', height: 15 }
    ],
    series: [
      {
        name: '0050 月K線',
        type: 'candlestick',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: kLineData,
        itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' },
        markPoint: {
          data: markPointData
        }
      },
      {
        name: '領先指標 (不含趨勢)',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: leadData,
        lineStyle: { color: '#0d6efd', width: 2 },
        showSymbol: false,
        markLine: {
          symbol: 'none',
          data: [{ yAxis: 100, name: '100基準線', lineStyle: { color: '#dc3545', type: 'dashed' } }]
        },
        markArea: {
          itemStyle: { color: 'rgba(253, 126, 20, 0.2)' }, // 對應橘色透明背景
          data: holdingAreas
        }
      }
    ]
  });
};
</script>

<style scoped>
/* 若有需要可在此加入專屬樣式 */
</style>
