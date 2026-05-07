<template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室 Nuxt.js</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

    <div class="container mb-4">
      <ul class="nav nav-tabs nav-fill fw-bold fs-5 shadow-sm bg-white rounded-top" id="myTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active py-3" id="macro-tab" data-bs-toggle="tab" data-bs-target="#macro" type="button" role="tab" aria-controls="macro" aria-selected="true">
            🌍 總經戰情儀表板
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-3" id="taiex-tab" data-bs-toggle="tab" data-bs-target="#taiex" type="button" role="tab" aria-controls="taiex" aria-selected="false" @click="initTaiexChart">
            📈 台股 KD 極值與均線分析
          </button>
        </li>
      </ul>
    </div>

    <div class="tab-content" id="myTabContent">
      
      <div class="tab-pane fade show active" id="macro" role="tabpanel" aria-labelledby="macro-tab">
        <div class="container mb-4">
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="row align-items-center text-center">
                        <div class="col-md-4 mb-3 mb-md-0">
                            <h6 class="text-uppercase text-muted fw-bold" style="font-size: 0.8rem;">目前數據來源</h6>
                            <span class="badge bg-primary fs-6 text-wrap" style="line-height: 1.5;">{{ dataSourceDisplay }}</span>
                        </div>
                        <div class="col-md-4 mb-3 mb-md-0 border-start border-end">
                            <button class="btn btn-outline-danger w-100 fw-bold" type="button" @click="triggerSync" :disabled="isSyncing">
                                <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1" role="status"></span>
                                {{ isSyncing ? '尋找伺服器並執行...' : '🔄 啟動雲端爬蟲 (API)' }}
                            </button>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-outline-success w-100 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#uploadBox">
                                📤 手動上傳 JSON
                            </button>
                        </div>
                    </div>

                    <div class="collapse mt-3" id="uploadBox">
                        <div class="card card-body bg-light border-0">
                            <div class="d-flex gap-2 align-items-center justify-content-center">
                                <input type="file" @change="handleFileSelect" class="form-control w-75" accept=".json">
                                <button @click="uploadToServer" class="btn btn-success fw-bold" :disabled="!selectedFile || isUploading">
                                    {{ isUploading ? '上傳中...' : '確認上傳' }}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <hr class="my-4 text-muted">
                    <div class="row align-items-center">
                        <div class="col-md-4 text-md-end mb-2 mb-md-0"><span class="fw-bold text-secondary">🔗 外部系統聯動：</span></div>
                        <div class="col-md-4">
                            <button class="btn btn-dark w-100 fw-bold shadow-sm" type="button" @click="triggerTwstockSync" :disabled="isSyncingTwstock">
                                {{ isSyncingTwstock ? 'Twstock168 更新中...' : '🚀 獨立更新 Twstock168' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container" v-if="dashboardData">
            <div class="col-12 mb-4">
                <div class="card text-center p-4 bg-white">
                    <h5 class="text-muted mb-3 text-uppercase ls-1">Mark 17 總經風險評分</h5>
                    <div class="d-flex justify-content-center align-items-center gap-4 flex-wrap">
                        <div class="d-flex align-items-baseline">
                            <span class="display-3 fw-bold text-dark">{{ dashboardData.content.total_score }}</span>
                            <span class="text-muted fs-4 ms-2">/ 15</span>
                        </div>
                        <div :class="['advice-badge', 'advice-' + dashboardData.content.advice]">策略建議: {{ dashboardData.content.advice }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center mt-5"><div class="spinner-border text-primary" role="status" v-if="isLoading"></div></div>
      </div>

      <div class="tab-pane fade" id="taiex" role="tabpanel" aria-labelledby="taiex-tab">
        <div class="container pb-5 mt-4">
          
          <div class="row mb-4" v-if="taiexAnalysis">
            
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-primary shadow-sm">
                <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between">
                    <span>長線循環：月KD 與 季線 (60MA)</span>
                    <span>最新收盤: {{ taiexAnalysis.daily.current.toFixed(2) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新月 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.monthly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.monthly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">季線 (60MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma60.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma60_trend"></span></span>
                  </div>
                  
                  <div class="bg-light p-3 rounded border border-warning mb-3">
                    <div class="fw-bold text-dark mb-2 border-bottom border-warning pb-1">🎯 季線 (60MA) 扣抵值預測</div>
                    <div class="d-flex justify-content-between text-muted small mb-1">
                      <span>明日扣抵目標日</span>
                      <span>{{ taiexAnalysis.daily.deduction60.date }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span>明日均線防守價</span>
                      <span class="fw-bold fs-5 text-dark">{{ taiexAnalysis.daily.deduction60.price.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="text-secondary small">多空翻轉判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction60.isSafe" class="badge bg-success fs-6">
                        緩衝空間 +{{ taiexAnalysis.daily.deduction60.diff.toFixed(0) }} 點 (季線看漲)
                      </span>
                      <span v-else class="badge bg-danger fs-6">
                        差 {{ Math.abs(taiexAnalysis.daily.deduction60.diff).toFixed(0) }} 點 (季線面臨下彎)
                      </span>
                    </div>
                  </div>

                  <hr class="mt-auto">
                  <p class="fw-bold text-dark mb-1">極值空間分析：</p>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.monthly.analysis }}</p>
                  <div class="alert mt-3 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.monthly.alertClass">{{ taiexAnalysis.monthly.alertText }}</div>
                </div>
              </div>
            </div>

            <div class="col-md-6 mb-3">
              <div class="card h-100 border-info shadow-sm">
                <div class="card-header bg-info text-dark fw-bold d-flex justify-content-between">
                    <span>中線行情：週KD 與 月線 (20MA)</span>
                    <span>最新收盤: {{ taiexAnalysis.daily.current.toFixed(2) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新週 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.weekly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.weekly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">月線 (20MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma20.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma20_trend"></span></span>
                  </div>

                  <div class="bg-light p-3 rounded border border-primary mb-3">
                    <div class="fw-bold text-dark mb-2 border-bottom border-primary pb-1">🎯 月線 (20MA) 扣抵值預測</div>
                    <div class="d-flex justify-content-between text-muted small mb-1">
                      <span>明日扣抵目標日</span>
                      <span>{{ taiexAnalysis.daily.deduction20.date }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span>明日均線防守價</span>
                      <span class="fw-bold fs-5 text-dark">{{ taiexAnalysis.daily.deduction20.price.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="text-secondary small">多空翻轉判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction20.isSafe" class="badge bg-success fs-6">
                        緩衝空間 +{{ taiexAnalysis.daily.deduction20.diff.toFixed(0) }} 點 (月線看漲)
                      </span>
                      <span v-else class="badge bg-danger fs-6">
                        差 {{ Math.abs(taiexAnalysis.daily.deduction20.diff).toFixed(0) }} 點 (月線面臨下彎)
                      </span>
                    </div>
                  </div>

                  <hr class="mt-auto">
                  <p class="fw-bold text-dark mb-1">極值空間分析：</p>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.weekly.analysis }}</p>
                  <div class="alert mt-3 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.weekly.alertClass">{{ taiexAnalysis.weekly.alertText }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isChartLoading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted fw-bold">運算台股指標中...</p>
          </div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoading && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII) 多週期分析</h5>
                
                <div class="btn-group shadow-sm" role="group">
                  <input type="radio" class="btn-check" name="period" id="btn-daily" value="daily" v-model="currentPeriod" @change="renderEChart">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-daily">日 K</label>

                  <input type="radio" class="btn-check" name="period" id="btn-weekly" value="weekly" v-model="currentPeriod" @change="renderEChart">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-weekly">週 K</label>

                  <input type="radio" class="btn-check" name="period" id="btn-monthly" value="monthly" v-model="currentPeriod" @change="renderEChart">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-monthly">月 K</label>
                </div>
              </div>
              
              <div id="taiexChart" style="width: 100%; height: 700px;"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHead } from '#imports'

useHead({ script: [{ src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js' }] })

// === 總經看板變數與邏輯 ===
const rawResponseData = ref(null)
const isLoading = ref(true)
const dashboardData = computed(() => rawResponseData.value)

// (請保留您原先在此的 triggerSync / uploadToServer 邏輯，為保持精簡此處略)

// =====================================
// 台股 K 線、KD 極值與「均線扣抵」預測邏輯
// =====================================
const isChartLoading = ref(false)
const taiexAnalysis = ref(null)
const taiexAllData = ref(null)    
const currentPeriod = ref('daily') 
let chartInstance = null

// 計算 KD 值
function calculateKD(quotes, period = 9) {
  let k = 50, d = 50;
  return quotes.map((q, i, arr) => {
    if (i < period - 1) return { ...q, k: null, d: null }
    const recentRange = arr.slice(i - period + 1, i + 1)
    const highest = Math.max(...recentRange.map(x => x.high))
    const lowest = Math.min(...recentRange.map(x => x.low))
    let rsv = highest === lowest ? 0 : ((q.close - lowest) / (highest - lowest)) * 100
    k = (rsv + k * 2) / 3
    d = (k + d * 2) / 3
    return { ...q, k, d }
  })
}

// 計算均線
function calculateMA(dayCount, quotes) {
  let result = [];
  for (let i = 0; i < quotes.length; i++) {
    if (i < dayCount - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = 0; j < dayCount; j++) sum += quotes[i - j].close;
    result.push(sum / dayCount);
  }
  return result;
}

// 尋找最近一次 KD 黃金交叉起漲點
function findLastGoldenCrossWave(kdData) {
  for (let i = kdData.length - 2; i > 0; i--) {
    const prev = kdData[i - 1]; const curr = kdData[i];
    if (prev.k !== null && prev.k <= prev.d && curr.k > curr.d && curr.k < 30) {
      return { date: curr.date, close: curr.close }
    }
  }
  return null;
}

// 載入資料並進行極值與「扣抵」分析
async function initTaiexChart() {
  if (taiexAllData.value) return 
  isChartLoading.value = true

  try {
    const res = await $fetch('/api/taiex')
    if (!res.success) throw new Error(res.message)

    taiexAllData.value = {
      daily: calculateKD(res.data.daily),
      weekly: calculateKD(res.data.weekly),
      monthly: calculateKD(res.data.monthly)
    }

    const dailyData = taiexAllData.value.daily
    const weeklyKD = taiexAllData.value.weekly
    const monthlyKD = taiexAllData.value.monthly
    const latestClose = dailyData[dailyData.length - 1].close

    const ma20Data = calculateMA(20, dailyData)
    const ma60Data = calculateMA(60, dailyData)
    const latestMA20 = ma20Data[ma20Data.length - 1]
    const latestMA60 = ma60Data[ma60Data.length - 1]
    const ma20Trend = latestMA20 > ma20Data[ma20Data.length - 2] ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>'
    const ma60Trend = latestMA60 > ma60Data[ma60Data.length - 2] ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>'

    // 🔥 扣抵值精算邏輯 (Deduction Logic)
    // 20MA 的明日扣抵價，是往前推 20 天的那根 K 棒收盤價
    const d20_index = dailyData.length - 20
    const deduction20 = {
      date: dailyData[d20_index].date,
      price: dailyData[d20_index].close,
      diff: latestClose - dailyData[d20_index].close, // 計算與最新收盤價的差距
      isSafe: latestClose >= dailyData[d20_index].close // 判斷是否大於扣抵值
    }

    // 60MA 的明日扣抵價，是往前推 60 天的收盤價
    const d60_index = dailyData.length - 60
    const deduction60 = {
      date: dailyData[d60_index].date,
      price: dailyData[d60_index].close,
      diff: latestClose - dailyData[d60_index].close,
      isSafe: latestClose >= dailyData[d60_index].close
    }

    // === 極值分析 ===
    const lastWeeklyWave = findLastGoldenCrossWave(weeklyKD)
    let weeklyAnalysis = '', weeklyAlert = '', wAlertClass = ''
    if (lastWeeklyWave) {
      const pointDiff = latestClose - lastWeeklyWave.close
      weeklyAnalysis = `前次週KD低檔金叉發生在 ${lastWeeklyWave.date}。目前已 ${pointDiff >= 0 ? '上漲' : '下跌'} ${Math.round(Math.abs(pointDiff))} 點。`
      if (pointDiff >= 800) { weeklyAlert = `⚠️ 週線波段漲 ${Math.round(pointDiff)} 點超越極值，隨時有回檔修正乖離之風險！`; wAlertClass = 'alert-danger' }
      else if (pointDiff >= 600) { weeklyAlert = `⚡ 週線達極值下緣，留意月線 (20MA) 扣抵值支撐。`; wAlertClass = 'alert-warning' }
      else { weeklyAlert = `✅ 中線極值未滿足，若防守住 20MA 扣抵仍有空間。`; wAlertClass = 'alert-success' }
    }

    const lastMonthlyWave = findLastGoldenCrossWave(monthlyKD)
    let monthlyAnalysis = '', monthlyAlert = '', mAlertClass = ''
    if (lastMonthlyWave) {
      const pointDiff = latestClose - lastMonthlyWave.close
      monthlyAnalysis = `前次月KD低檔金叉發生在 ${lastMonthlyWave.date}。長波段已上漲 ${Math.round(pointDiff)} 點。`
      if (pointDiff >= 2000) {
        if (monthlyKD[monthlyKD.length-1].k > 80) {
          monthlyAlert = `⚠️ 長波段漲 ${Math.round(pointDiff)} 點滿足極值要求！若最新價無法大於 60MA 扣抵值，將結束長波段。`; mAlertClass = 'alert-danger'
        } else { monthlyAlert = `⚡ 進入長線高檔風險區，緊盯季線扣抵值。`; mAlertClass = 'alert-warning' }
      } else { monthlyAlert = `✅ 長波段 2000 點極值尚未滿足。`; mAlertClass = 'alert-success' }
    }

    taiexAnalysis.value = {
      daily: { current: latestClose, ma20: latestMA20, ma20_trend: ma20Trend, ma60: latestMA60, ma60_trend: ma60Trend, deduction20, deduction60 },
      weekly: { k: weeklyKD[weeklyKD.length - 1].k, d: weeklyKD[weeklyKD.length - 1].d, analysis: weeklyAnalysis, alertText: weeklyAlert, alertClass: wAlertClass },
      monthly: { k: monthlyKD[monthlyKD.length - 1].k, d: monthlyKD[monthlyKD.length - 1].d, analysis: monthlyAnalysis, alertText: monthlyAlert, alertClass: mAlertClass }
    }

    renderEChart()

  } catch (error) {
    alert('無法取得台股資料：' + error.message)
  } finally {
    isChartLoading.value = false
  }
}

// 渲染 ECharts
function renderEChart() {
  if (!taiexAllData.value) return;
  const targetData = taiexAllData.value[currentPeriod.value]
  
  const categoryData = targetData.map(item => item.date)
  const candleValues = targetData.map(item => [item.open, item.close, item.low, item.high])
  
  const ma20Data = calculateMA(20, targetData)
  const ma60Data = calculateMA(60, targetData)
  
  const kData = targetData.map(item => item.k)
  const dData = targetData.map(item => item.d)

  // == 1. 偵測 KD 交叉標示 ==
  const kdMarks = []
  for (let i = 1; i < targetData.length; i++) {
    const prev = targetData[i - 1]
    const curr = targetData[i]
    if (prev.k === null || curr.k === null) continue;
    if (prev.k <= prev.d && curr.k > curr.d) {
      kdMarks.push({ coord: [i, curr.k], symbol: 'arrow', symbolSize: 12, itemStyle: { color: '#dc3545' }, value: '金叉' })
    }
    if (prev.k >= prev.d && curr.k < curr.d) {
      kdMarks.push({ coord: [i, curr.k], symbol: 'arrow', symbolRotate: 180, symbolSize: 12, itemStyle: { color: '#198754' }, value: '死叉' })
    }
  }

  // == 2. 日 K 專屬：標示明日扣抵位置 ==
  const candleMarks = []
  if (currentPeriod.value === 'daily' && targetData.length >= 60) {
    const d20_idx = targetData.length - 20
    const d60_idx = targetData.length - 60
    candleMarks.push({ coord: [d20_idx, candleValues[d20_idx][1]], value: '20MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#0dcaf0' }})
    candleMarks.push({ coord: [d60_idx, candleValues[d60_idx][1]], value: '60MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#ffc107' }})
  }

  setTimeout(() => {
    const chartDom = document.getElementById('taiexChart')
    if (!chartDom || !window.echarts) return;
    
    if (!chartInstance) chartInstance = window.echarts.init(chartDom)
    
    chartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      legend: { data: ['K線', '20MA', '60MA', 'K值', 'D值'] },
      grid: [
        { left: '8%', right: '5%', top: '10%', height: '55%' },
        { left: '8%', right: '5%', top: '75%', height: '20%' } 
      ],
      xAxis: [
        { type: 'category', data: categoryData, gridIndex: 0, boundaryGap: false, axisLabel: { show: false } },
        { type: 'category', data: categoryData, gridIndex: 1, boundaryGap: false }
      ],
      yAxis: [
        { scale: true, gridIndex: 0, splitArea: { show: true } },
        { min: 0, max: 100, gridIndex: 1, splitLine: { show: false } }
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 50, end: 100 },
        { show: true, type: 'slider', xAxisIndex: [0, 1], top: '96%', start: 50, end: 100 }
      ],
      series: [
        {
          name: 'K線', type: 'candlestick', data: candleValues, xAxisIndex: 0, yAxisIndex: 0,
          itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' },
          markPoint: { data: candleMarks, label: { color: '#000', fontWeight: 'bold' } } // 扣抵大頭針標示
        },
        { name: '20MA', type: 'line', data: ma20Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
        { name: '60MA', type: 'line', data: ma60Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
        { 
          name: 'K值', type: 'line', data: kData, xAxisIndex: 1, yAxisIndex: 1, smooth: true, symbol: 'none', lineStyle: { color: '#dc3545' },
          markPoint: { data: kdMarks, label: { show: false } } 
        },
        { name: 'D值', type: 'line', data: dData, xAxisIndex: 1, yAxisIndex: 1, smooth: true, symbol: 'none', lineStyle: { color: '#0d6efd' } }
      ]
    }, true)
  }, 100)
}
</script>

<style>
/* 請保留原本所有的 CSS 樣式 */
</style>
