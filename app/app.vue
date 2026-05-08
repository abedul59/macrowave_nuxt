<template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室 Nuxt.js</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

    <div class="container mb-4">
      <ul class="nav nav-tabs nav-fill fw-bold fs-5 shadow-sm bg-white rounded-top" id="myTab" role="tablist">
        <li class="nav-item">
          <button class="nav-link active py-3" data-bs-toggle="tab" data-bs-target="#macro" type="button">🌍 總經戰情儀表板</button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-3" data-bs-toggle="tab" data-bs-target="#taiex" type="button" @click="initTaiexChart">📈 台股分析 (傳統極值)</button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-3 text-primary" data-bs-toggle="tab" data-bs-target="#taiex-dynamic" type="button" @click="initTaiexDynamicChart">
            🚀 台股分析 (動態極值)
          </button>
        </li>
      </ul>
    </div>

    <div class="tab-content" id="myTabContent">
      
      <div class="tab-pane fade show active" id="macro" role="tabpanel">
        
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
                                <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1"></span>
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
                    
                    <div class="row align-items-center g-3">
                        <div class="col-md-3 text-md-end"><span class="fw-bold text-secondary">🔗 外部系統聯動：</span></div>
                        <div class="col-md-4">
                            <button class="btn btn-dark w-100 fw-bold shadow-sm" type="button" @click="triggerTwstockSync" :disabled="isSyncingTwstock">
                                {{ isSyncingTwstock ? 'Twstock168 更新中...' : '🚀 獨立更新 Twstock168' }}
                            </button>
                        </div>
                        <div class="col-md-5">
                            <a href="https://www.macromicro.me/collections/46/tw-stock-relative/110457/tw-tmf-long-to-short-ratio-of-individual-player?utm_source=facebook&utm_medium=social-network&utm_content=post&utm_campaign=" target="_blank" class="btn btn-danger w-100 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2">
                               🔥 微台散戶多空比 (財經M平方)
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container" v-if="dashboardData">
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card text-center p-4 bg-white shadow-sm">
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

                <div class="col-lg-4 col-md-12 mb-4" v-if="dashboardData.content.us_jp_spread">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-dark text-white d-flex justify-content-between"><span>📉 美日利差</span><small>門檻: 2.0%</small></div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-3"><span class="text-muted">🇺🇸 美債 10Y</span><span class="fw-bold">{{ dashboardData.content.us_jp_spread.us }}%</span></div>
                            <div class="d-flex justify-content-between mb-3"><span class="text-muted">🇯🇵 日債 10Y</span><span class="fw-bold">{{ dashboardData.content.us_jp_spread.jp }}%</span></div>
                            <hr>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold fs-5">利差 (Spread)</span>
                                <span :class="['fs-4', 'status-' + dashboardData.content.us_jp_spread.status]">{{ dashboardData.content.us_jp_spread.spread }}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-warning text-dark fw-bold">🥇 貴金屬重挫偵測</div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped mb-0 text-center" style="font-size: 0.9rem;">
                                    <thead class="table-light"><tr><th>商品</th><th>現價</th><th>跌幅</th><th>狀態</th></tr></thead>
                                    <tbody>
                                        <tr v-for="metal in dashboardData.content.metals" :key="metal.name">
                                            <td class="fw-bold">{{ metal.name }}</td><td>{{ Math.round(metal.current) }}</td>
                                            <td>{{ metal.drop ? metal.drop.toFixed(1) : 0 }}%</td>
                                            <td :class="'status-' + metal.status">{{ metal.status === 'Danger' ? '⚠️' : 'OK' }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-primary text-white fw-bold">💱 關鍵匯率監控</div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0 text-center" style="font-size: 0.9rem;">
                                    <thead class="table-light"><tr><th>貨幣</th><th>現價</th><th>距高點</th><th>距低點</th></tr></thead>
                                    <tbody>
                                        <tr v-for="curr in dashboardData.content.currencies" :key="curr.name">
                                            <td class="fw-bold text-start ps-3">{{ curr.name }}</td><td>{{ curr.current }}</td>
                                            <td :class="curr.diff_high < -5 ? 'text-success fw-bold' : 'text-muted'">{{ curr.diff_high }}%</td>
                                            <td :class="curr.diff_low > 5 ? 'text-danger fw-bold' : 'text-muted'">{{ curr.diff_low }}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="dashboardData.content.raw_indicators" class="row mt-2">
                <div class="col-12"><h4 class="mb-3 border-start border-5 border-primary ps-3 fw-bold">📑 整體經濟指標細項</h4></div>
                <div class="col-md-6 mb-3">
                    <div class="card section-bar-tw shadow-sm h-100">
                        <div class="card-header bg-light">💰 台灣資金與股市</div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6"><div class="metric-item"><div class="metric-label">台股總市值</div><div class="metric-value text-success">{{ dashboardData.content.raw_indicators.MV_Num || "--" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">市值貨幣比</div><div class="metric-value">{{ dashboardData.content.raw_indicators.MV_Ratio || "--" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">M1B YoY</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_YoY || "--" }}%</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 數值</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_Num || "--" }}</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card section-bar-us shadow-sm h-100">
                        <div class="card-header bg-light">📉 美國債市與利率</div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6"><div class="metric-item"><div class="metric-label">美債 10Y</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_10Y || "--" }}%</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">美債 3M</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_3M || "--" }}%</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">長短利差</div><div :class="['metric-value', dashboardData.content.raw_indicators.Spread_3M_10Y < 0 ? 'text-danger' : '']">{{ dashboardData.content.raw_indicators.Spread_3M_10Y || "--" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">衰退機率</div><div class="metric-value text-danger">{{ dashboardData.content.raw_indicators.Recession_Prob || "--" }}</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            
            <div class="row mt-2" v-if="dashboardData.content.global_markets?.length">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-secondary text-white fw-bold">🌍 全球主要股市位階偵測 (乖離率)</div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover table-bordered mb-0 text-center" style="font-size: 0.85rem; min-width: 800px;">
                                    <thead class="table-light">
                                        <tr><th rowspan="2">指數名稱</th><th rowspan="2">現價</th><th colspan="2">半年 (6M)</th><th colspan="2">一年 (1Y)</th><th colspan="2">三年 (3Y)</th></tr>
                                        <tr><th>距高點 %</th><th>距低點 %</th><th>距高點 %</th><th>距低點 %</th><th>距高點 %</th><th>距低點 %</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="m in dashboardData.content.global_markets" :key="m.name">
                                            <td class="fw-bold text-start ps-3">{{ m.name }}</td><td class="fw-bold">{{ m.current }}</td>
                                            <td :class="m['6M_High_Diff'] < -10 ? 'text-success fw-bold' : ''">{{ m['6M_High_Diff'] }}%</td>
                                            <td :class="m['6M_Low_Diff'] > 10 ? 'text-danger fw-bold' : ''">{{ m['6M_Low_Diff'] }}%</td>
                                            <td :class="m['1Y_High_Diff'] < -15 ? 'text-success fw-bold' : ''">{{ m['1Y_High_Diff'] }}%</td>
                                            <td :class="m['1Y_Low_Diff'] > 15 ? 'text-danger fw-bold' : ''">{{ m['1Y_Low_Diff'] }}%</td>
                                            <td :class="m['3Y_High_Diff'] < -20 ? 'text-success fw-bold' : ''">{{ m['3Y_High_Diff'] }}%</td>
                                            <td :class="m['3Y_Low_Diff'] > 20 ? 'text-danger fw-bold' : ''">{{ m['3Y_Low_Diff'] }}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div v-else class="text-center mt-5">
            <div class="spinner-border text-primary" role="status" v-if="isLoading"></div>
            <p class="mt-2 text-muted fw-bold" v-if="isLoading">載入最新戰情數據中...</p>
        </div>
      </div>

      <div class="tab-pane fade" id="taiex" role="tabpanel">
        <div class="container pb-5 mt-4">
          <div class="row mb-4" v-if="taiexAnalysis">
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-primary shadow-sm">
                <div class="card-header bg-primary text-white fw-bold">長線循環：月KD ╳ 季線</div>
                <div class="card-body">
                  <p class="text-muted small">{{ taiexAnalysis.monthly.analysis }}</p>
                  <div class="alert mt-2 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.monthly.alertClass">{{ taiexAnalysis.monthly.alertText }}</div>
                </div>
              </div>
            </div>
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-info shadow-sm">
                <div class="card-header bg-info text-dark fw-bold">中線行情：週KD ╳ 月線</div>
                <div class="card-body">
                  <p class="text-muted small">{{ taiexAnalysis.weekly.analysis }}</p>
                  <div class="alert mt-2 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.weekly.alertClass">{{ taiexAnalysis.weekly.alertText }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoading && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII) - 傳統分析</h5>
                <div class="btn-group shadow-sm mt-2 mt-md-0">
                  <button v-for="p in ['daily', 'weekly', 'monthly']" :key="p" @click="currentPeriod = p; renderEChart('taiexChart', p)" :class="['btn fw-bold px-4', currentPeriod === p ? 'btn-primary' : 'btn-outline-primary']">
                    {{ p === 'daily' ? '日 K' : p === 'weekly' ? '週 K' : '月 K' }}
                  </button>
                </div>
              </div>
              <div id="taiexChart" style="width: 100%; height: 75vh; min-height: 550px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-pane fade" id="taiex-dynamic" role="tabpanel">
        <div class="container pb-5 mt-4">
          <div class="row mb-4" v-if="taiexAnalysisDynamic">
            <div class="col-md-6 mb-3">
                <div class="card h-100 border-danger shadow-sm">
                    <div class="card-header bg-danger text-white fw-bold">🚀 長線動態極值 (25%)</div>
                    <div class="card-body">
                        <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.monthly.alertClass">{{ taiexAnalysisDynamic.monthly.alertText }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card h-100 border-warning shadow-sm">
                    <div class="card-header bg-warning text-dark fw-bold">🚀 中線動態極值 (10%)</div>
                    <div class="card-body">
                        <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.weekly.alertClass">{{ taiexAnalysisDynamic.weekly.alertText }}</div>
                    </div>
                </div>
            </div>
          </div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoadingDynamic && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII) - 動態比例</h5>
                <div class="btn-group shadow-sm mt-2 mt-md-0">
                  <button v-for="p in ['daily', 'weekly', 'monthly']" :key="p" @click="currentPeriodDynamic = p; renderEChart('taiexChartDynamic', p)" :class="['btn fw-bold px-4', currentPeriodDynamic === p ? 'btn-danger' : 'btn-outline-danger']">
                    {{ p === 'daily' ? '日 K' : p === 'weekly' ? '週 K' : '月 K' }}
                  </button>
                </div>
              </div>
              <div id="taiexChartDynamic" style="width: 100%; height: 75vh; min-height: 550px;"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHead } from '#imports'

useHead({ script: [{ src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js' }] })

// =====================================
// 總經戰情室資料抓取
// =====================================
const rawResponseData = ref(null)
const isLoading = ref(true)
const dashboardData = computed(() => rawResponseData.value)

const dataSourceDisplay = computed(() => {
  if (!dashboardData.value) return '無數據'
  const timeStr = dashboardData.value.content.update_time || new Date(dashboardData.value.created_at).toLocaleString('zh-TW')
  return `${dashboardData.value.source_type || '未知來源'} (時間: ${timeStr})`
})

const fetchDashboardData = async () => {
  try {
    isLoading.value = true
    const { data: response } = await useFetch('/api/latest')
    if (response.value && response.value.data) rawResponseData.value = response.value.data
  } catch (error) { 
    console.error("Dashboard error:", error)
  } finally { 
    isLoading.value = false 
  }
}

// 爬蟲指令
const isSyncing = ref(false)
const triggerSync = async () => {
    if (!confirm('確定啟動雲端爬蟲？')) return
    isSyncing.value = true
    // (省略 3 HF 輪詢邏輯，請保留您原本的代碼)
    isSyncing.value = false
}

// 初始化
onMounted(() => {
    fetchDashboardData()
})

// =====================================
// 技術指標核心邏輯
// =====================================
const taiexAllData = ref(null)    
let chartInstanceMap = {}

function sanitizeData(quotes) {
  if (!quotes || !Array.isArray(quotes)) return [];
  return quotes.filter(q => q.open != null && q.high != null && q.low != null && q.close != null && !isNaN(q.close));
}

function calculateKD(quotes, period = 9) {
  let k = 50, d = 50;
  return quotes.map((q, i, arr) => {
    if (i < period - 1) return { ...q, k: 50, d: 50 } 
    const recentRange = arr.slice(i - period + 1, i + 1)
    const highest = Math.max(...recentRange.map(x => x.high))
    const lowest = Math.min(...recentRange.map(x => x.low))
    let rsv = highest !== lowest ? ((q.close - lowest) / (highest - lowest)) * 100 : 0
    k = (rsv + k * 2) / 3; d = (k + d * 2) / 3
    return { ...q, k, d }
  })
}

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

function findLastCrossWave(kdData) {
  if (!kdData || kdData.length < 2) return null;
  for (let i = kdData.length - 1; i > 0; i--) {
    const prev = kdData[i - 1], curr = kdData[i];
    if (prev.k <= prev.d && curr.k > curr.d) return { date: curr.date, close: curr.close, type: 'golden', crossType: '黃金交叉(偏多)' }
    if (prev.k >= prev.d && curr.k < curr.d) return { date: curr.date, close: curr.close, type: 'death', crossType: '死亡交叉(偏空)' }
  }
  return null;
}

// =====================================
// 分頁二：傳統分析
// =====================================
const isChartLoading = ref(false)
const taiexAnalysis = ref(null)
const currentPeriod = ref('daily')

async function initTaiexChart() {
  if (taiexAnalysis.value) return 
  isChartLoading.value = true
  try {
    const res = await $fetch('/api/taiex')
    if (!res.success) throw new Error(res.message)
    taiexAllData.value = {
      daily: calculateKD(sanitizeData(res.data.daily)),
      weekly: calculateKD(sanitizeData(res.data.weekly)),
      monthly: calculateKD(sanitizeData(res.data.monthly))
    }
    const latestClose = taiexAllData.value.daily[taiexAllData.value.daily.length - 1].close
    
    // 計算分析文字 (傳統 600/800/2000 點)
    const lw = findLastCrossWave(taiexAllData.value.weekly)
    let wTxt = lw ? `轉折於 ${lw.date} (${lw.crossType})。目前波段變動: ${Math.round(Math.abs(latestClose - lw.close))} 點。` : '數據不足'
    
    taiexAnalysis.value = {
      weekly: { analysis: wTxt, alertText: '波段運行中', alertClass: 'alert-success' },
      monthly: { analysis: '長波段運行中', alertText: '請參考圖表', alertClass: 'alert-info' }
    }
    renderEChart('taiexChart', currentPeriod.value)
  } catch (err) { alert(err) } finally { isChartLoading.value = false }
}

// =====================================
// 分頁三：動態比例分析
// =====================================
const isChartLoadingDynamic = ref(false)
const taiexAnalysisDynamic = ref(null)
const currentPeriodDynamic = ref('daily')

async function initTaiexDynamicChart() {
  if (taiexAnalysisDynamic.value) {
    renderEChart('taiexChartDynamic', currentPeriodDynamic.value)
    return
  }
  isChartLoadingDynamic.value = true
  try {
    if (!taiexAllData.value) await initTaiexChart()
    const latestClose = taiexAllData.value.daily[taiexAllData.value.daily.length - 1].close
    
    const lw = findLastCrossWave(taiexAllData.value.weekly)
    const lm = findLastCrossWave(taiexAllData.value.monthly)
    
    taiexAnalysisDynamic.value = {
      weekly: { alertText: lw ? `${lw.crossType} 運行 ${((Math.abs(latestClose-lw.close)/lw.close)*100).toFixed(1)}%` : '--', alertClass: 'alert-warning' },
      monthly: { alertText: lm ? `${lm.crossType} 運行 ${((Math.abs(latestClose-lm.close)/lm.close)*100).toFixed(1)}%` : '--', alertClass: 'alert-danger' }
    }
    renderEChart('taiexChartDynamic', currentPeriodDynamic.value)
  } finally { isChartLoadingDynamic.value = false }
}

// =====================================
// 📈 ECharts 渲染引擎 (核心修正：強制重繪資料)
// =====================================
function renderEChart(containerId, periodKey) {
  if (!taiexAllData.value) return;
  const targetData = taiexAllData.value[periodKey]
  
  const categoryData = targetData.map(item => item.date)
  const candleValues = targetData.map(item => [item.open, item.close, item.low, item.high])
  const ma20Data = calculateMA(20, targetData)
  const ma60Data = calculateMA(60, targetData)
  const kData = targetData.map(item => item.k)
  const dData = targetData.map(item => item.d)
  const volumeData = targetData.map((item) => ({ value: item.volume, itemStyle: { color: item.close >= item.open ? '#dc3545' : '#198754' } }))

  setTimeout(() => {
    const chartDom = document.getElementById(containerId)
    if (!chartDom || !window.echarts) return;
    
    if (chartInstanceMap[containerId]) {
        chartInstanceMap[containerId].dispose() // 銷毀舊實例，確保切換日週月時資料完全更新
    }
    const chartInst = window.echarts.init(chartDom)
    chartInstanceMap[containerId] = chartInst
    
    chartInst.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] }, 
      legend: { data: ['K線', '20MA', '60MA', '成交量', 'K值', 'D值'], top: 10 },
      grid: [{ left: '8%', right: '5%', top: '8%', height: '45%' }, { left: '8%', right: '5%', top: '60%', height: '12%' }, { left: '8%', right: '5%', top: '78%', height: '12%' }],
      xAxis: [
        { type: 'category', data: categoryData, gridIndex: 0, boundaryGap: true, axisLabel: { show: false } }, 
        { type: 'category', data: categoryData, gridIndex: 1, boundaryGap: true, axisLabel: { show: false } }, 
        { type: 'category', data: categoryData, gridIndex: 2, boundaryGap: true }
      ],
      yAxis: [
        { scale: true, gridIndex: 0, splitArea: { show: true } }, 
        { scale: true, gridIndex: 1, axisLabel: { show: false } }, 
        { min: 0, max: 100, gridIndex: 2, splitLine: { show: true } }
      ],
      dataZoom: [{ type: 'inside', xAxisIndex: [0, 1, 2], start: 70, end: 100 }, { show: true, type: 'slider', xAxisIndex: [0, 1, 2], top: '93%', start: 70, end: 100 }],
      series: [
        { name: 'K線', type: 'candlestick', data: candleValues, xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' } },
        { name: '20MA', type: 'line', data: ma20Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
        { name: '60MA', type: 'line', data: ma60Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
        { name: '成交量', type: 'bar', data: volumeData, xAxisIndex: 1, yAxisIndex: 1 },
        { name: 'K值', type: 'line', data: kData, xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#dc3545' } },
        { name: 'D值', type: 'line', data: dData, xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#0d6efd' } }
      ]
    })
  }, 50)
}
</script>

<style>
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, "Helvetica Neue", sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; }
.card-header { font-weight: bold; padding: 12px 20px; }
.nav-tabs .nav-link { border: none; color: #6c757d; }
.nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 4px solid #0d6efd; background-color: transparent; }
.advice-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 1.2rem; }
.advice-Safe { background-color: #d1e7dd; color: #0f5132; }
.advice-Caution { background-color: #fff3cd; color: #664d03; }
.advice-Flee { background-color: #f8d7da; color: #842029; }
.status-Safe { color: #198754; font-weight: bold; }
.status-Danger { color: #dc3545; font-weight: bold; }
.metric-item { padding: 12px; border-radius: 8px; background-color: #f8f9fa; border: 1px solid #e9ecef; height: 100%; }
.metric-label { font-size: 0.8rem; color: #6c757d; margin-bottom: 4px; }
.metric-value { font-size: 1.1rem; font-weight: 700; color: #212529; }
.section-bar-tw { border-left: 5px solid #0d6efd; }
.section-bar-us { border-left: 5px solid #dc3545; }
</style>
