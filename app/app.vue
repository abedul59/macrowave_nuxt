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
          <button class="nav-link py-3" data-bs-toggle="tab" data-bs-target="#taiex" type="button" @click="initTaiexChart">📈 台股分析 (傳統固定極值)</button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-3 text-primary" data-bs-toggle="tab" data-bs-target="#taiex-dynamic" type="button" @click="initTaiexDynamicChart">
            🚀 台股分析 (新時空動態極值)
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

      <div class="tab-pane fade" id="taiex" role="tabpanel">
        <div class="container pb-5 mt-4">
          <div class="row mb-4" v-if="taiexAnalysis">
            <div class="col-12 mb-3">
                <div class="alert alert-secondary border-secondary shadow-sm">
                    ℹ️ <strong>傳統極值標準 (適用於大盤萬點以下)：</strong> 月線極值看 2,000 點；週線極值看 600~800 點。
                </div>
            </div>
            
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
                  <hr class="mt-auto">
                  <p class="fw-bold text-dark mb-1">極值空間分析：</p>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.weekly.analysis }}</p>
                  <div class="alert mt-3 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.weekly.alertClass">{{ taiexAnalysis.weekly.alertText }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isChartLoading" class="text-center my-5"><div class="spinner-border text-primary"></div><p>運算中...</p></div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoading && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII) 多週期分析</h5>
                <div class="btn-group shadow-sm mt-2 mt-md-0" role="group">
                  <input type="radio" class="btn-check" name="period" id="btn-daily" value="daily" v-model="currentPeriod" @change="renderEChart('taiexChart', currentPeriod.value)">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-daily">日 K</label>
                  <input type="radio" class="btn-check" name="period" id="btn-weekly" value="weekly" v-model="currentPeriod" @change="renderEChart('taiexChart', currentPeriod.value)">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-weekly">週 K</label>
                  <input type="radio" class="btn-check" name="period" id="btn-monthly" value="monthly" v-model="currentPeriod" @change="renderEChart('taiexChart', currentPeriod.value)">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-monthly">月 K</label>
                </div>
              </div>
              <div id="taiexChart" style="width: 100%; height: 80vh; min-height: 600px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-pane fade" id="taiex-dynamic" role="tabpanel">
        <div class="container pb-5 mt-4">
          <div class="row mb-4" v-if="taiexAnalysisDynamic">
            
            <div class="col-12 mb-3">
                <div class="alert border-primary shadow-sm" style="background-color: #f0f7ff;">
                    <h5 class="fw-bold text-primary mb-2">🚀 十年週期與動態極值理論 (大航海時代適用)</h5>
                    <ul class="mb-0 text-dark small" style="line-height: 1.6;">
                        <li><strong>長波段 (月KD判定)：</strong> 一個大週期約為 10 年 (120 個月)。月 KD 的黃金/死亡交叉是確認長波起點的最佳夥伴。統計極值空間約為起漲/跌點的 <strong>25%</strong>。</li>
                        <li><strong>中波段 (週KD判定)：</strong> 每年週 KD 約會交叉 6~8 次，每次波段行情約延續 <strong>2個月 (8週)</strong>。統計極值空間約為起漲/跌點的 <strong>7.5% ~ 10%</strong>。</li>
                        <li><strong>無懼高低檔：</strong> 不再死守 20/80 的高低檔鈍化盲點，只要發生明確交叉即視為波段啟動，並搭配均線扣抵作防守判定。</li>
                    </ul>
                </div>
            </div>

            <div class="col-md-6 mb-3">
              <div class="card h-100 border-danger shadow-sm">
                <div class="card-header bg-danger text-white fw-bold d-flex justify-content-between">
                    <span>長線循環 (等比極值)：月KD ╳ 季線</span>
                    <span>最新收盤: {{ taiexAnalysisDynamic.daily.current.toFixed(2) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新月 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysisDynamic.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysisDynamic.monthly.k.toFixed(2) }}</span> / D: {{ taiexAnalysisDynamic.monthly.d.toFixed(2) }}</span>
                  </div>
                  
                  <div class="bg-light p-3 rounded border border-danger mb-3">
                    <div class="fw-bold text-dark mb-2 border-bottom border-danger pb-1">🎯 月線轉折追蹤 (極值 25%)</div>
                    <div v-if="taiexAnalysisDynamic.monthly.basePrice > 0">
                        <div class="d-flex justify-content-between text-muted small mb-1">
                          <span>前次轉折時間</span><span>{{ taiexAnalysisDynamic.monthly.baseDate }} (<span :class="taiexAnalysisDynamic.monthly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ taiexAnalysisDynamic.monthly.crossType }}</span>)</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                          <span>轉折基準點位</span><span class="fw-bold fs-5 text-dark">{{ taiexAnalysisDynamic.monthly.basePrice.toFixed(0) }} 點</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                          <span class="text-secondary small">波段已運行：</span>
                          <span class="badge bg-primary fs-6">{{ taiexAnalysisDynamic.monthly.currentDiff.toFixed(0) }} 點 (約 {{ taiexAnalysisDynamic.monthly.percentDiff.toFixed(1) }}%)</span>
                        </div>
                    </div>
                    <div v-else class="text-center text-muted py-3">歷史數據不足，無法判定轉折點。</div>
                  </div>

                  <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-3">
                      <span class="text-muted fw-bold">季線(60MA) 防守價: <span class="text-dark">{{ taiexAnalysisDynamic.daily.deduction60.price.toFixed(0) }}</span></span>
                      <span v-if="taiexAnalysisDynamic.daily.deduction60.isSafe" class="text-success fw-bold">安全 (+{{ taiexAnalysisDynamic.daily.deduction60.diff.toFixed(0) }})</span>
                      <span v-else class="text-danger fw-bold">跌破 ({{ taiexAnalysisDynamic.daily.deduction60.diff.toFixed(0) }})</span>
                  </div>

                  <hr class="mt-auto">
                  <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.monthly.alertClass">{{ taiexAnalysisDynamic.monthly.alertText }}</div>
                </div>
              </div>
            </div>

            <div class="col-md-6 mb-3">
              <div class="card h-100 border-warning shadow-sm">
                <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between">
                    <span>中線行情 (等比極值)：週KD ╳ 月線</span>
                    <span>最新收盤: {{ taiexAnalysisDynamic.daily.current.toFixed(2) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新週 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysisDynamic.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysisDynamic.weekly.k.toFixed(2) }}</span> / D: {{ taiexAnalysisDynamic.weekly.d.toFixed(2) }}</span>
                  </div>

                  <div class="bg-light p-3 rounded border border-warning mb-3">
                    <div class="fw-bold text-dark mb-2 border-bottom border-warning pb-1">🎯 週線轉折追蹤 (極值 7.5%~10%)</div>
                    <div v-if="taiexAnalysisDynamic.weekly.basePrice > 0">
                        <div class="d-flex justify-content-between text-muted small mb-1">
                          <span>前次轉折時間</span><span>{{ taiexAnalysisDynamic.weekly.baseDate }} (<span :class="taiexAnalysisDynamic.weekly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ taiexAnalysisDynamic.weekly.crossType }}</span>)</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                          <span>轉折基準點位</span><span class="fw-bold fs-5 text-dark">{{ taiexAnalysisDynamic.weekly.basePrice.toFixed(0) }} 點</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                          <span class="text-secondary small">波段已運行：</span>
                          <span class="badge bg-primary fs-6">{{ taiexAnalysisDynamic.weekly.currentDiff.toFixed(0) }} 點 (約 {{ taiexAnalysisDynamic.weekly.percentDiff.toFixed(1) }}%)</span>
                        </div>
                    </div>
                    <div v-else class="text-center text-muted py-3">歷史數據不足，無法判定轉折點。</div>
                  </div>

                  <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-3">
                      <span class="text-muted fw-bold">月線(20MA) 防守價: <span class="text-dark">{{ taiexAnalysisDynamic.daily.deduction20.price.toFixed(0) }}</span></span>
                      <span v-if="taiexAnalysisDynamic.daily.deduction20.isSafe" class="text-success fw-bold">安全 (+{{ taiexAnalysisDynamic.daily.deduction20.diff.toFixed(0) }})</span>
                      <span v-else class="text-danger fw-bold">跌破 ({{ taiexAnalysisDynamic.daily.deduction20.diff.toFixed(0) }})</span>
                  </div>

                  <hr class="mt-auto">
                  <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.weekly.alertClass">{{ taiexAnalysisDynamic.weekly.alertText }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isChartLoadingDynamic" class="text-center my-5"><div class="spinner-border text-danger"></div><p>動態運算中...</p></div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoadingDynamic && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII) 動態極值對照圖</h5>
                <div class="btn-group shadow-sm mt-2 mt-md-0" role="group">
                  <input type="radio" class="btn-check" name="periodDyn" id="btn-dyn-daily" value="daily" v-model="currentPeriodDynamic" @change="renderEChart('taiexChartDynamic', currentPeriodDynamic.value)">
                  <label class="btn btn-outline-danger fw-bold px-4" for="btn-dyn-daily">日 K</label>
                  <input type="radio" class="btn-check" name="periodDyn" id="btn-dyn-weekly" value="weekly" v-model="currentPeriodDynamic" @change="renderEChart('taiexChartDynamic', currentPeriodDynamic.value)">
                  <label class="btn btn-outline-danger fw-bold px-4" for="btn-dyn-weekly">週 K</label>
                  <input type="radio" class="btn-check" name="periodDyn" id="btn-dyn-monthly" value="monthly" v-model="currentPeriodDynamic" @change="renderEChart('taiexChartDynamic', currentPeriodDynamic.value)">
                  <label class="btn btn-outline-danger fw-bold px-4" for="btn-dyn-monthly">月 K</label>
                </div>
              </div>
              <div id="taiexChartDynamic" style="width: 100%; height: 80vh; min-height: 600px;"></div>
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

// =====================================
// 總經資料抓取與同步 (保持原本邏輯)
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
    const { data: response } = await useFetch('/api/latest')
    if (response.value && response.value.data) rawResponseData.value = response.value.data
  } catch (error) { } finally { isLoading.value = false }
}
await fetchDashboardData()

const isSyncing = ref(false)
const triggerSync = async () => { /* 保留邏輯 */ }
const isSyncingTwstock = ref(false)
const triggerTwstockSync = async () => { /* 保留邏輯 */ }
const selectedFile = ref(null)
const isUploading = ref(false)
const handleFileSelect = (event) => selectedFile.value = event.target.files[0]
const uploadToServer = async () => { /* 保留邏輯 */ }


// =====================================
// 共用技術指標計算函數
// =====================================
const taiexAllData = ref(null)    
let chartInstanceMap = {} // 儲存多個圖表實例

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
    let sum = 0, valid = true;
    for (let j = 0; j < dayCount; j++) { if (quotes[i - j].close == null) valid = false; sum += quotes[i - j].close; }
    result.push(valid ? sum / dayCount : null);
  }
  return result;
}

// 🔥 全新升級：只要發生交叉就算波段起點 (無視高中低檔限制)
function findLastCrossWave(kdData) {
  if (!kdData || kdData.length < 2) return null;
  // 倒著找，找最近一次明確交叉點
  for (let i = kdData.length - 1; i > 0; i--) {
    const prev = kdData[i - 1], curr = kdData[i];
    if (prev && curr && prev.k !== null && prev.d !== null && curr.k !== null && curr.d !== null) {
      // 黃金交叉 (多方波段起點)
      if (prev.k <= prev.d && curr.k > curr.d) {
        return { date: curr.date, close: curr.close, type: 'golden' }
      }
      // 死亡交叉 (空方波段起點)
      if (prev.k >= prev.d && curr.k < curr.d) {
        return { date: curr.date, close: curr.close, type: 'death' }
      }
    }
  }
  return null;
}

// 載入所有資料並放入共用變數
async function fetchAndPrepareData() {
    if (taiexAllData.value) return true;
    const res = await $fetch('/api/taiex')
    if (!res.success) throw new Error(res.message)
    const safeDaily = sanitizeData(res.data.daily)
    taiexAllData.value = {
      daily: calculateKD(safeDaily),
      weekly: calculateKD(sanitizeData(res.data.weekly)),
      monthly: calculateKD(sanitizeData(res.data.monthly))
    }
    return true;
}

// =====================================
// 分頁二：傳統固定極值邏輯
// =====================================
const isChartLoading = ref(false)
const taiexAnalysis = ref(null)
const currentPeriod = ref('daily') 

async function initTaiexChart() {
  if (taiexAnalysis.value) return 
  isChartLoading.value = true
  try {
    await fetchAndPrepareData()
    const latestClose = taiexAllData.value.daily[taiexAllData.value.daily.length - 1].close
    
    // 傳統邏輯 (沿用新版找交叉函數，但不計算百分比)
    const lastWeeklyWave = findLastCrossWave(taiexAllData.value.weekly)
    let wAnalysis = '', wAlert = '', wClass = ''
    if (lastWeeklyWave) {
      const isUp = lastWeeklyWave.type === 'golden'
      const pDiff = isUp ? (latestClose - lastWeeklyWave.close) : (lastWeeklyWave.close - latestClose)
      const action = isUp ? '上漲' : '下跌'
      wAnalysis = `前次 ${isUp ? '黃金' : '死亡'}交叉在 ${lastWeeklyWave.date}。波段已${action} ${Math.round(pDiff)} 點。`
      if (pDiff >= 800) { wAlert = `⚠️ 傳統週線波段${action} ${Math.round(pDiff)} 點超越 800 極值！`; wClass = 'alert-danger' }
      else if (pDiff >= 600) { wAlert = `⚡ 達 600 極值下緣，留意月線 (20MA) 扣抵值支撐。`; wClass = 'alert-warning' }
      else if (pDiff > 0) { wAlert = `✅ 傳統中線極值未滿足，若防守住 20MA 仍有空間。`; wClass = 'alert-success' }
      else { wAlert = `📉 逆勢震盪或整理中，留意均線方向。`; wClass = 'alert-secondary' }
    }

    const lastMonthlyWave = findLastCrossWave(taiexAllData.value.monthly)
    let mAnalysis = '', mAlert = '', mClass = ''
    if (lastMonthlyWave) {
      const isUp = lastMonthlyWave.type === 'golden'
      const pDiff = isUp ? (latestClose - lastMonthlyWave.close) : (lastMonthlyWave.close - latestClose)
      const action = isUp ? '上漲' : '下跌'
      mAnalysis = `前次 ${isUp ? '黃金' : '死亡'}交叉在 ${lastMonthlyWave.date}。長波段已${action} ${Math.round(pDiff)} 點。`
      if (pDiff >= 2000) {
        mAlert = `⚠️ 長波段${action} ${Math.round(pDiff)} 點滿足 2000 點要求！緊盯季線(60MA)防守。`; mClass = 'alert-danger'
      } else if (pDiff > 0) { mAlert = `✅ 長波段 2000 點極值尚未滿足。`; mClass = 'alert-success' }
      else { mAlert = `📉 逆勢震盪或整理中，留意均線方向。`; mClass = 'alert-secondary' }
    }

    taiexAnalysis.value = {
      daily: getDailyInfo(taiexAllData.value.daily, latestClose),
      weekly: { k: taiexAllData.value.weekly[taiexAllData.value.weekly.length - 1].k, d: taiexAllData.value.weekly[taiexAllData.value.weekly.length - 1].d, analysis: wAnalysis, alertText: wAlert, alertClass: wClass },
      monthly: { k: taiexAllData.value.monthly[taiexAllData.value.monthly.length - 1].k, d: taiexAllData.value.monthly[taiexAllData.value.monthly.length - 1].d, analysis: mAnalysis, alertText: mAlert, alertClass: mClass }
    }
    renderEChart('taiexChart', currentPeriod.value)
  } catch (err) { alert(err) } finally { isChartLoading.value = false }
}

function getDailyInfo(dailyData, latestClose) {
    const ma20Data = calculateMA(20, dailyData)
    const ma60Data = calculateMA(60, dailyData)
    const latestMA20 = ma20Data[ma20Data.length - 1] || 0
    const latestMA60 = ma60Data[ma60Data.length - 1] || 0
    const d20_index = Math.max(0, dailyData.length - 20)
    const d60_index = Math.max(0, dailyData.length - 60)
    return {
        current: latestClose, ma20: latestMA20, ma60: latestMA60,
        ma20_trend: latestMA20 > (ma20Data[ma20Data.length-2]||0) ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>',
        ma60_trend: latestMA60 > (ma60Data[ma60Data.length-2]||0) ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>',
        deduction20: { date: dailyData[d20_index].date, price: dailyData[d20_index].close, diff: latestClose - dailyData[d20_index].close, isSafe: latestClose >= dailyData[d20_index].close },
        deduction60: { date: dailyData[d60_index].date, price: dailyData[d60_index].close, diff: latestClose - dailyData[d60_index].close, isSafe: latestClose >= dailyData[d60_index].close }
    }
}

// =====================================
// 🔥 分頁三：新時空動態比例邏輯
// =====================================
const isChartLoadingDynamic = ref(false)
const taiexAnalysisDynamic = ref(null)
const currentPeriodDynamic = ref('daily') 

async function initTaiexDynamicChart() {
  if (taiexAnalysisDynamic.value) return 
  isChartLoadingDynamic.value = true
  try {
    await fetchAndPrepareData()
    const latestClose = taiexAllData.value.daily[taiexAllData.value.daily.length - 1].close

    // 動態週線邏輯 (7.5% ~ 10%)
    const lastWeeklyWave = findLastCrossWave(taiexAllData.value.weekly)
    let dwAlert = '', dwClass = '', wBase = 0, wMin = 0, wMax = 0, wDiff = 0, wPct = 0
    let wDate = '', wType = '', wCrossTxt = ''
    if (lastWeeklyWave) {
      wBase = lastWeeklyWave.close; wDate = lastWeeklyWave.date; wType = lastWeeklyWave.type
      wCrossTxt = wType === 'golden' ? '黃金交叉(偏多)' : '死亡交叉(偏空)'
      wMin = wBase * 0.075; wMax = wBase * 0.10; 
      
      // 計算順勢推進了多少點 (做多看漲，做空看跌)
      wDiff = wType === 'golden' ? (latestClose - wBase) : (wBase - latestClose)
      wPct = (wDiff / wBase) * 100

      if (wDiff >= wMax) { dwAlert = `⚠️ 嚴重警戒！中波段已順勢推進 ${wPct.toFixed(1)}%，突破等比極值 (10%)，面臨極大反轉風險！`; dwClass = 'alert-danger' }
      else if (wDiff >= wMin) { dwAlert = `⚡ 進入極值滿足區 (${wPct.toFixed(1)}%)，強烈建議留意 20MA 均線扣抵是否反轉。`; dwClass = 'alert-warning' }
      else if (wDiff > 0) { dwAlert = `✅ 波段行進中 (${wPct.toFixed(1)}%)，動態空間尚未滿足，沿均線順勢操作。`; dwClass = 'alert-success' }
      else { dwAlert = `📉 目前大盤走勢與週KD指標背離或處於震盪洗盤，請嚴守均線紀律。`; dwClass = 'alert-secondary' }
    }

    // 動態月線邏輯 (25%)
    const lastMonthlyWave = findLastCrossWave(taiexAllData.value.monthly)
    let dmAlert = '', dmClass = '', mBase = 0, mTarget = 0, mDiff = 0, mPct = 0
    let mDate = '', mType = '', mCrossTxt = ''
    if (lastMonthlyWave) {
      mBase = lastMonthlyWave.close; mDate = lastMonthlyWave.date; mType = lastMonthlyWave.type
      mCrossTxt = mType === 'golden' ? '黃金交叉(偏多)' : '死亡交叉(偏空)'
      mTarget = mBase * 0.25; 
      
      mDiff = mType === 'golden' ? (latestClose - mBase) : (mBase - latestClose)
      mPct = (mDiff / mBase) * 100

      if (mDiff >= mTarget) {
        dmAlert = `⚠️ 長波段已順勢推進 ${mPct.toFixed(1)}%，完美滿足動態極值 (25%)！一旦季線(60MA)跌破扣抵並下彎，長線趨勢宣告結束。`; dmClass = 'alert-danger'
      } else if (mDiff > 0) { dmAlert = `✅ 長波段順勢推進中 (${mPct.toFixed(1)}%)，距離動態極值 (25%) 仍有空間。`; dmClass = 'alert-success' }
      else { dmAlert = `📉 長線目前處於背離震盪區，請以季線防守為依歸。`; dmClass = 'alert-secondary' }
    }

    taiexAnalysisDynamic.value = {
      daily: getDailyInfo(taiexAllData.value.daily, latestClose),
      weekly: { k: taiexAllData.value.weekly[taiexAllData.value.weekly.length - 1].k, d: taiexAllData.value.weekly[taiexAllData.value.weekly.length - 1].d, alertText: dwAlert, alertClass: dwClass, basePrice: wBase, baseDate: wDate, type: wType, crossType: wCrossTxt, targetMin: wMin, targetMax: wMax, currentDiff: wDiff, percentDiff: wPct },
      monthly: { k: taiexAllData.value.monthly[taiexAllData.value.monthly.length - 1].k, d: taiexAllData.value.monthly[taiexAllData.value.monthly.length - 1].d, alertText: dmAlert, alertClass: dmClass, basePrice: mBase, baseDate: mDate, type: mType, crossType: mCrossTxt, targetPts: mTarget, currentDiff: mDiff, percentDiff: mPct }
    }
    renderEChart('taiexChartDynamic', currentPeriodDynamic.value)
  } catch (err) { alert(err) } finally { isChartLoadingDynamic.value = false }
}

// 共用圖表渲染函數
function renderEChart(containerId, activePeriod) {
  if (!taiexAllData.value) return;
  const targetData = taiexAllData.value[activePeriod]
  if (!targetData || targetData.length === 0) return;
  
  const categoryData = targetData.map(item => item.date)
  const candleValues = targetData.map(item => [item.open, item.close, item.low, item.high])
  const ma20Data = calculateMA(20, targetData)
  const ma60Data = calculateMA(60, targetData)
  const kData = targetData.map(item => item.k)
  const dData = targetData.map(item => item.d)
  const volumeData = targetData.map((item) => ({ value: item.volume, itemStyle: { color: item.close >= item.open ? '#dc3545' : '#198754' } }))

  const kdMarks = []; const candleMarks = []
  for (let i = 1; i < targetData.length; i++) {
    const prev = targetData[i - 1], curr = targetData[i]
    if (prev.k === null || curr.k === null) continue;
    if (prev.k <= prev.d && curr.k > curr.d) kdMarks.push({ coord: [i, curr.k], symbol: 'arrow', symbolSize: 12, itemStyle: { color: '#dc3545' }, value: '金叉' })
    if (prev.k >= prev.d && curr.k < curr.d) kdMarks.push({ coord: [i, curr.k], symbol: 'arrow', symbolRotate: 180, symbolSize: 12, itemStyle: { color: '#198754' }, value: '死叉' })
  }

  if (activePeriod === 'daily' && targetData.length >= 60) {
    const d20_idx = targetData.length - 20; const d60_idx = targetData.length - 60
    candleMarks.push({ coord: [d20_idx, candleValues[d20_idx][1]], value: '20MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#0dcaf0' }})
    candleMarks.push({ coord: [d60_idx, candleValues[d60_idx][1]], value: '60MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#ffc107' }})
  }

  setTimeout(() => {
    const chartDom = document.getElementById(containerId)
    if (!chartDom || !window.echarts) return;
    
    let chartInst = chartInstanceMap[containerId]
    if (!chartInst) { chartInst = window.echarts.init(chartDom); chartInstanceMap[containerId] = chartInst }
    
    chartInst.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] }, 
      legend: { data: ['K線', '20MA', '60MA', '成交量', 'K值', 'D值'] },
      grid: [{ left: '8%', right: '5%', top: '5%', height: '50%' }, { left: '8%', right: '5%', top: '58%', height: '15%' }, { left: '8%', right: '5%', top: '76%', height: '15%' }],
      xAxis: [{ type: 'category', data: categoryData, gridIndex: 0, boundaryGap: true, axisLabel: { show: false } }, { type: 'category', data: categoryData, gridIndex: 1, boundaryGap: true, axisLabel: { show: false } }, { type: 'category', data: categoryData, gridIndex: 2, boundaryGap: true }],
      yAxis: [{ scale: true, gridIndex: 0, splitArea: { show: true } }, { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, splitLine: { show: false } }, { min: 0, max: 100, gridIndex: 2, splitLine: { show: true, lineStyle: { type: 'dashed'} }, splitNumber: 2 }],
      dataZoom: [{ type: 'inside', xAxisIndex: [0, 1, 2], start: 50, end: 100 }, { show: true, type: 'slider', xAxisIndex: [0, 1, 2], top: '94%', start: 50, end: 100 }],
      series: [
        { name: 'K線', type: 'candlestick', data: candleValues, xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' }, markPoint: { data: candleMarks, label: { color: '#000', fontWeight: 'bold' } } },
        { name: '20MA', type: 'line', data: ma20Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
        { name: '60MA', type: 'line', data: ma60Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
        { name: '成交量', type: 'bar', data: volumeData, xAxisIndex: 1, yAxisIndex: 1 },
        { name: 'K值', type: 'line', data: kData, xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#dc3545' }, markPoint: { data: kdMarks, label: { show: false } } },
        { name: 'D值', type: 'line', data: dData, xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#0d6efd' } }
      ]
    }, true)
  }, 100)
}
</script>

<style>
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; transition: transform 0.2s; overflow: hidden; }
.card:hover { transform: translateY(-3px); }
.card-header { font-weight: bold; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.nav-tabs .nav-link { border: none; color: #6c757d; transition: all 0.3s; }
.nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 4px solid #0d6efd; background-color: transparent; }
.nav-tabs .nav-link:hover:not(.active) { color: #0d6efd; border-bottom: 4px solid #e9ecef; }
.status-Safe { color: #198754; font-weight: bold; }
.status-Warning { color: #fd7e14; font-weight: bold; }
.status-Danger { color: #dc3545; font-weight: bold; }
.advice-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 1.2rem; }
.advice-Safe { background-color: #d1e7dd; color: #0f5132; }
.advice-Caution { background-color: #fff3cd; color: #664d03; }
.advice-Reduce { background-color: #ffecb5; color: #664d03; border: 2px solid #ffc107; }
.advice-Flee { background-color: #f8d7da; color: #842029; }
.metric-item { padding: 12px; border-radius: 8px; background-color: #f8f9fa; border: 1px solid #e9ecef; height: 100%; }
.metric-label { font-size: 0.85rem; color: #6c757d; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.metric-value { font-size: 1.1rem; font-weight: 700; color: #212529; word-break: break-word; }
.metric-sub { font-size: 0.75rem; color: #adb5bd; margin-top: 2px; }
.section-bar-tw { border-left: 5px solid #0d6efd; }
.section-bar-us { border-left: 5px solid #dc3545; }
.section-bar-cycle { border-left: 5px solid #198754; }
.section-bar-sentiment { border-left: 5px solid #ffc107; }
</style>
