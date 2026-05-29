<template>
  <div class="container-fluid pb-5 mt-4">
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm border-0 bg-dark text-white">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <h4 class="fw-bold mb-1">📊 台灣領先指標 ╳ 0050 總經戰情室</h4>
              <p class="text-secondary mb-0 small">
                自動化量化策略：景氣分數 ≤ 22 且回升 (或指標 > 100) 買進；指標 < 100 且下滑賣出。
              </p>
            </div>
            <div class="text-end" v-if="!isLoading && trades.length > 0">
              <span class="badge bg-secondary fs-6 me-2">回測筆數：{{ chartDataList.length }} 個月</span>
              <span class="badge bg-primary fs-6">觸發交易：{{ trades.length }} 次</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center my-5 py-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
      <h5 class="mt-4 fw-bold text-primary">系統正在載入並清洗回測數據...</h5>
    </div>

    <div v-if="errorMsg" class="alert alert-danger shadow-sm fw-bold text-center fs-5">
      ❌ 讀取失敗：{{ errorMsg }}
    </div>

    <div v-show="!isLoading && chartDataList.length > 0" class="row">
      <div class="col-lg-12 mb-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white fw-bold py-3 d-flex justify-content-between">
            <span class="text-dark">📈 策略回測圖表 (支援滾輪縮放)</span>
            <span class="badge bg-success">🟢 買進標記</span>
            <span class="badge bg-danger">🔴 賣出標記</span>
          </div>
          <div class="card-body p-2">
            <div id="chart-lead-0050" style="width: 100%; height: 800px;"></div>
          </div>
        </div>
      </div>

      <div class="col-lg-12">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white fw-bold py-3">
            <span class="text-dark">📜 歷史交易信號明細 (由新到舊)</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
              <table class="table table-hover table-striped mb-0 text-center align-middle">
                <thead class="table-dark sticky-top">
                  <tr>
                    <th>交易年月</th>
                    <th>信號動作</th>
                    <th>觸發價格 (0050)</th>
                    <th>領先指標</th>
                    <th>景氣分數</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(t, index) in trades.slice().reverse()" :key="index">
                    <td class="fw-bold">{{ t.date }}</td>
                    <td>
                      <span :class="t.type === 'BUY' ? 'badge bg-success fs-6' : 'badge bg-danger fs-6'">
                        {{ t.type === 'BUY' ? '買進 (BUY)' : '賣出 (SELL)' }}
                      </span>
                    </td>
                    <td class="fw-bold text-primary">{{ t.price.toFixed(2) }}</td>
                    <td>{{ t.lead.toFixed(2) }}</td>
                    <td>
                      <span :class="t.score <= 22 ? 'text-primary fw-bold' : 'text-dark'">
                        {{ t.score }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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

const supabase = useSupabaseClient();

onMounted(async () => {
  try {
    isLoading.value = true;
    
    const { data, error } = await supabase
      .from('macro_lead_0050')
      .select('*')
      .order('date', { ascending: true }); 

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('資料庫目前無數據。');

    const cleanData = [];
    data.forEach(item => {
      const d = item.date ? String(item.date).split('T')[0] : '';
      if (!d) return;

      const c = Number(item.close);
      if (isNaN(c)) return; 

      let o = Number(item.open); if (isNaN(o)) o = c;
      let h = Number(item.high); if (isNaN(h)) h = c;
      let l = Number(item.low);  if (isNaN(l)) l = c;

      const realHigh = Math.max(o, c, h, l);
      const realLow = Math.min(o, c, h, l);

      let lead = Number(item.lead); if (isNaN(lead)) lead = 0;
      let score = Number(item.score); if (isNaN(score)) score = 0;

      cleanData.push({
        date: d,
        open: o,
        close: c,
        low: realLow,
        high: realHigh,
        lead: lead,
        score: score
      });
    });

    let currentPosition = 1; 
    const processedData = [];
    const tradeRecords = [];

    for (let i = 0; i < cleanData.length; i++) {
      const row = cleanData[i];
      const prevRow = i > 0 ? cleanData[i - 1] : row;
      const leadDiff = row.lead - prevRow.lead;
      
      let signal = null;
      if ((row.score <= 22 && leadDiff > 0) || row.lead > 100) {
        signal = 1;
      } else if (row.lead < 100 && leadDiff < 0) {
        signal = 0;
      }

      if (signal !== null) {
        currentPosition = signal;
      }

      if (i > 0) {
        const prevPosition = processedData[i - 1].position;
        if (currentPosition === 1 && prevPosition === 0) {
          tradeRecords.push({ date: row.date, type: 'BUY', price: row.close, lead: row.lead, score: row.score });
        } else if (currentPosition === 0 && prevPosition === 1) {
          tradeRecords.push({ date: row.date, type: 'SELL', price: row.close, lead: row.lead, score: row.score });
        }
      }

      processedData.push({ ...row, position: currentPosition });
    }

    chartDataList.value = processedData;
    trades.value = tradeRecords;

    await nextTick();
    renderChart(processedData, tradeRecords);
    window.addEventListener('resize', handleResize);

  } catch (err) {
    console.error('資料讀取錯誤:', err);
    errorMsg.value = err.message;
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
  const kLineData = data.map(item => [item.open, item.close, item.low, item.high]);
  const leadData = data.map(item => item.lead);

  // 🔥 修正 1：持倉區間 (背景橘色塊) 強制使用 Index
  const holdingAreas = [];
  let startHoldDate = null;
  for (let i = 0; i < data.length; i++) {
    if (data[i].position === 1 && startHoldDate === null) {
      startHoldDate = data[i].date;
    } else if (data[i].position === 0 && startHoldDate !== null) {
      const sIdx = dates.indexOf(startHoldDate);
      const eIdx = dates.indexOf(data[i - 1].date);
      if (sIdx !== -1 && eIdx !== -1) {
        holdingAreas.push([{ xAxis: sIdx }, { xAxis: eIdx }]);
      }
      startHoldDate = null;
    }
  }
  if (startHoldDate !== null) {
    const sIdx = dates.indexOf(startHoldDate);
    if (sIdx !== -1) {
      holdingAreas.push([{ xAxis: sIdx }, { xAxis: dates.length - 1 }]);
    }
  }

  // 🔥 修正 2：K線圖買賣箭頭 強制使用 Index
  const klineMarks = tradeRecords.map(t => {
    const xIndex = dates.indexOf(t.date);
    return {
      coord: [xIndex, t.price],
      value: t.type,
      symbol: t.type === 'BUY' ? 'arrow' : 'pin',
      symbolSize: 15,
      symbolRotate: t.type === 'BUY' ? 0 : 180,
      itemStyle: { color: t.type === 'BUY' ? '#198754' : '#dc3545' },
      label: { show: false }
    };
  }).filter(m => m.coord[0] !== -1); // 過濾掉找不到位置的例外

  // 🔥 修正 3：領先指標散點圖層 強制使用 Index
  const leadScatterData = tradeRecords.map(t => {
    const xIndex = dates.indexOf(t.date);
    return {
      value: [xIndex, t.lead],
      symbol: t.type === 'BUY' ? 'arrow' : 'pin',
      symbolSize: 18,
      symbolRotate: t.type === 'BUY' ? 0 : 180,
      itemStyle: { 
        color: t.type === 'BUY' ? '#198754' : '#dc3545',
        borderColor: '#fff', 
        borderWidth: 2 
      }
    };
  }).filter(m => m.value[0] !== -1);

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    legend: { data: ['0050 月K線', '領先指標', '交易信號'], top: 10 },
    grid: [
      { left: '8%', right: '5%', top: '10%', height: '50%' }, 
      { left: '8%', right: '5%', top: '68%', height: '25%' }  
    ],
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLabel: { show: false } },
      { type: 'category', data: dates, gridIndex: 1 }
    ],
    yAxis: [
      { type: 'value', scale: true, gridIndex: 0, name: '股價 (元)' },
      { type: 'value', scale: true, gridIndex: 1, name: '指標分數' }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], start: 0, end: 100 },
      { show: true, xAxisIndex: [0, 1], top: '95%', height: 15 }
    ],
    series: [
      {
        name: '0050 月K線',
        type: 'candlestick',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: kLineData,
        itemStyle: {
          color: '#dc3545', 
          color0: '#198754', 
          borderColor: '#dc3545',
          borderColor0: '#198754'
        },
        markPoint: {
          data: klineMarks
        }
      },
      {
        name: '領先指標',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: leadData,
        lineStyle: { color: '#0d6efd', width: 2 },
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#0d6efd' },
        markLine: {
          symbol: 'none',
          data: [{ yAxis: 100, name: '100 基準線', lineStyle: { color: '#dc3545', type: 'dashed' } }]
        },
        markArea: {
          itemStyle: { color: 'rgba(253, 126, 20, 0.2)' },
          data: holdingAreas
        }
      },
      {
        name: '交易信號',
        type: 'scatter',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: leadScatterData,
        zlevel: 10 
      }
    ]
  };

  chartInstance.setOption(option, true);
};
</script>

<style scoped>
/* 表格滾動條美化 */
.table-responsive::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.table-responsive::-webkit-scrollbar-thumb {
  background-color: #dee2e6;
  border-radius: 4px;
}
</style>
