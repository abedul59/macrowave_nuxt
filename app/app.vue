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
                            <div v-if="dashboardData?.content?.date" class="mt-2 text-muted" style="font-size: 0.85rem;">
                                資料基準日: <strong>{{ dashboardData.content.date }}</strong>
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-3 mb-md-0 border-start border-end">
                            <button class="btn btn-outline-danger w-100 fw-bold" type="button" @click="triggerSync" :disabled="isSyncing">
                                <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                {{ isSyncing ? '尋找伺服器並執行...' : '🔄 啟動雲端爬蟲 (API)' }}
                            </button>
                            <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">分散使用 3 個 HF 帳號備援 (約需 3 分鐘)</small>
                        </div>

                        <div class="col-md-4">
                            <button class="btn btn-outline-success w-100 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#uploadBox">
                                📤 手動上傳 JSON
                            </button>
                            <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">資料將永久保存</small>
                        </div>
                    </div>

                    <div class="collapse mt-3" id="uploadBox">
                        <div class="card card-body bg-light border-0">
                            <div class="d-flex gap-2 align-items-center justify-content-center">
                                <input type="file" @change="handleFileSelect" class="form-control w-75" accept=".json">
                                <button @click="uploadToServer" class="btn btn-success fw-bold" :disabled="!selectedFile || isUploading">
                                    <span v-if="isUploading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    {{ isUploading ? '上傳中...' : '確認上傳' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <hr class="my-4 text-muted">
                    <div class="row align-items-center">
                        <div class="col-md-4 text-md-end mb-2 mb-md-0">
                            <span class="fw-bold text-secondary">🔗 外部系統聯動：</span>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-dark w-100 fw-bold shadow-sm" type="button" @click="triggerTwstockSync" :disabled="isSyncingTwstock">
                                <span v-if="isSyncingTwstock" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                {{ isSyncingTwstock ? 'Twstock168 更新中...' : '🚀 獨立更新 Twstock168' }}
                            </button>
                        </div>
                        <div class="col-md-4 text-start">
                            <small class="text-muted d-block" style="font-size: 0.75rem;">喚醒 Render 並自動爬蟲寫入 (約 2.5 分鐘)</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container" v-if="dashboardData">
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card text-center p-4 bg-white">
                        <h5 class="text-muted mb-3 text-uppercase ls-1">Mark 17 總經風險評分</h5>
                        <div class="d-flex justify-content-center align-items-center gap-4 flex-wrap">
                            <div class="d-flex align-items-baseline">
                                <span class="display-3 fw-bold text-dark">{{ dashboardData.content.total_score }}</span>
                                <span class="text-muted fs-4 ms-2">/ 15</span>
                            </div>
                            <div :class="['advice-badge', 'advice-' + dashboardData.content.advice]">
                                策略建議: {{ dashboardData.content.advice }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4" v-if="dashboardData.content.us_jp_spread">
                    <div class="card h-100">
                        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                            <span>📉 美日債券利差</span>
                            <small class="opacity-75">門檻: 2.0%</small>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted">🇺🇸 美債 10Y</span>
                                <span class="fw-bold">{{ dashboardData.content.us_jp_spread.us }}%</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted">🇯🇵 日債 10Y</span>
                                <span class="fw-bold">{{ dashboardData.content.us_jp_spread.jp }}%</span>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold fs-5">利差 (Spread)</span>
                                <span :class="['fs-4', 'status-' + dashboardData.content.us_jp_spread.status]">{{ dashboardData.content.us_jp_spread.spread }}%</span>
                            </div>
                            <div v-if="dashboardData.content.us_jp_spread.spread < 2.0" class="alert alert-danger mt-3 mb-0 py-2 text-center fw-bold">
                                ⚠️ 警告：利差跌破 2%
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                            <span>🥇 貴金屬重挫偵測</span>
                            <small>跌幅 > 50%</small>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped mb-0 align-middle text-center" style="font-size: 0.9rem;">
                                    <thead class="table-light">
                                        <tr><th>商品</th><th>現價</th><th>跌幅</th><th>狀態</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="metal in dashboardData.content.metals" :key="metal.name">
                                            <td class="fw-bold">{{ metal.name }}</td>
                                            <td>{{ Math.round(metal.current) }}</td>
                                            <td class="text-muted">{{ metal.drop ? metal.drop.toFixed(1) : 0 }}%</td>
                                            <td :class="'status-' + metal.status">{{ metal.status === 'Danger' ? '⚠️' : 'OK' }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center bg-gradient">
                            <span>💱 關鍵匯率監控</span>
                            <small>半年位階</small>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0 align-middle text-center" style="font-size: 0.9rem;">
                                    <thead class="table-light">
                                        <tr><th>貨幣</th><th>現價</th><th>距高點</th><th>距低點</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="curr in dashboardData.content.currencies" :key="curr.name">
                                            <td class="fw-bold text-start ps-3">{{ curr.name }}</td>
                                            <td class="fw-bold">{{ curr.current }}</td>
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

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-light text-dark fw-bold d-flex justify-content-between" data-bs-toggle="collapse" href="#mark17Details" role="button">
                            <span>📋 Mark 17 詳細計分表</span>
                            <small>▼ 點擊展開/收合</small>
                        </div>
                        <div class="collapse show" id="mark17Details">
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0 align-middle">
                                        <thead class="table-light">
                                            <tr><th>監測項目</th><th class="text-center">數值 / 狀態</th><th class="text-center">風險得分</th></tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="item in dashboardData.content.mark17" :key="item.item">
                                                <td>{{ item.item }}</td>
                                                <td :class="['text-center fw-bold', 'status-' + item.status]">{{ item.value }}</td>
                                                <td class="text-center">
                                                    <span v-if="item.score !== 0 && item.score !== '-'" class="badge bg-danger rounded-pill">
                                                        {{ typeof item.score === 'number' && item.score > 0 ? '+' + item.score : item.score }}
                                                    </span>
                                                    <span v-else class="text-muted text-opacity-50">-</span>
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
        </div>
        
        <div v-else class="text-center mt-5">
          <div class="spinner-border text-primary" role="status" v-if="isLoading"></div>
          <p class="mt-2 text-muted fw-bold" v-if="isLoading">載入最新戰情數據中...</p>
        </div>
      </div>

      <div class="tab-pane fade" id="taiex" role="tabpanel" aria-labelledby="taiex-tab">
        <div class="container pb-5">
          
          <div class="row mb-4" v-if="taiexAnalysis">
            
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-primary shadow-sm">
                <div class="card-header bg-primary text-white fw-bold">長線循環：月KD 與 季線 (60MA)</div>
                <div class="card-body">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新月 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.monthly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.monthly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">季線 (60MA) 狀態</span>
                    <span class="fw-bold">{{ taiexAnalysis.daily.ma60.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma60_trend"></span></span>
                  </div>
                  <hr>
                  <p class="fw-bold text-dark mb-1">極值空間分析：</p>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.monthly.analysis }}</p>
                  <div class="alert mt-3 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.monthly.alertClass">
                    {{ taiexAnalysis.monthly.alertText }}
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 mb-3">
              <div class="card h-100 border-info shadow-sm">
                <div class="card-header bg-info text-dark fw-bold">中線行情：週KD 與 月線 (20MA)</div>
                <div class="card-body">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新週 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.weekly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.weekly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">月線 (20MA) 狀態</span>
                    <span class="fw-bold">{{ taiexAnalysis.daily.ma20.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma20_trend"></span></span>
                  </div>
                  <hr>
                  <p class="fw-bold text-dark mb-1">極值空間分析：</p>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.weekly.analysis }}</p>
                  <div class="alert mt-3 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.weekly.alertClass">
                    {{ taiexAnalysis.weekly.alertText }}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div v-if="isChartLoading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted fw-bold">運算台股指標中...</p>
          </div>

          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="fw-bold mb-3 text-secondary">台股加權指數 (^TWII) 日線圖 + 均線化身</h5>
              <div id="taiexChart" style="width: 100%; height: 500px;"></div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <footer class="text-center py-4 mt-5 text-muted border-top bg-white">
        <small>&copy; 2026 MacroWave System | Powered by Nuxt & Vercel</small>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHead } from '#imports'

// 引入 ECharts CDN
useHead({
  script: [
    { src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js' }
  ]
})

// =====================================
// 原有總經戰情室邏輯
// =====================================
const rawResponseData = ref(null)
const isLoading = ref(true)
const selectedFile = ref(null)
const isUploading = ref(false)

const { data: response } = await useFetch('/api/latest')
if (response.value && response.value.data) {
  rawResponseData.value = response.value.data
}
isLoading.value = false 

const dashboardData = computed(() => rawResponseData.value)
const dataSourceDisplay = computed(() => {
  if (!dashboardData.value) return '無數據'
  const content = dashboardData.value.content
  const source = dashboardData.value.source_type || '未知來源'
  const timeStr = content.update_time || new Date(dashboardData.value.created_at).toLocaleString('zh-TW')
  return `${source} (時間: ${timeStr})`
})

// 爬蟲同步邏輯
const isSyncing = ref(false)
const triggerSync = async () => {
  if (!confirm('確定要啟動雲端爬蟲嗎？')) return
  isSyncing.value = true
  const hfBaseUrls = [
    'https://pyfbsdk59-macrowave-scrape-api.hf.space',
    'https://lawxstudents168-macrowave-scrape-api.hf.space',
    'https://igveri59-macrowave-scrape-api.hf.space'
  ]
  const shuffledUrls = [...hfBaseUrls].sort(() => 0.5 - Math.random())

  for (let i = 0; i < shuffledUrls.length; i++) {
    const currentUrl = `${shuffledUrls[i]}/api/trigger-sync`
    try {
      const apiResponse = await $fetch(currentUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 15000 })
      alert(`✅ 已成功發送爬蟲指令！\n系統將在 3 分鐘後自動重整網頁。`)
      setTimeout(() => window.location.reload(), 180000)
      break
    } catch (err) {
      if (i === shuffledUrls.length - 1) {
        alert('❌ 觸發爬蟲失敗！HF 伺服器無回應，請稍後再試。')
        isSyncing.value = false
      }
    }
  }
}

const isSyncingTwstock = ref(false)
const triggerTwstockSync = async () => {
  if (!confirm('確定要獨立更新 Twstock168 網站嗎？')) return
  isSyncingTwstock.value = true
  try {
    const newHfApiUrl = 'https://lawxstudents168-twstock168-scrape-api.hf.space/api/trigger-twstock-sync'
    await $fetch(newHfApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    alert(`✅ 已成功發送指令！`)
    setTimeout(() => { isSyncingTwstock.value = false }, 150000)
  } catch (err) {
    alert('❌ 觸發更新失敗')
    isSyncingTwstock.value = false
  }
}

const handleFileSelect = (event) => selectedFile.value = event.target.files[0]
const uploadToServer = async () => {
  if (!selectedFile.value) return
  isUploading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      await $fetch('/api/upload', { method: 'POST', headers: { 'X-Api-Key': 'macrowave168' }, body: JSON.parse(e.target.result) })
      alert('上傳成功！'); window.location.reload()
    } catch (err) { alert('上傳失敗') } finally { isUploading.value = false }
  }
  reader.readAsText(selectedFile.value)
}


// =====================================
// 新增：台股 K 線與 KD 極值分析邏輯
// =====================================
const isChartLoading = ref(false)
const taiexAnalysis = ref(null)
let chartInstance = null

// 計算 KD 值的共用函式 (參數週期預設為 9)
function calculateKD(quotes, period = 9) {
  let k = 50, d = 50;
  return quotes.map((q, i, arr) => {
    if (i < period - 1) return { ...q, k: 50, d: 50 }
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
    // 條件：在低檔區 (K < 30) 發生 K 向上突破 D (金叉)
    if (prev.k <= prev.d && curr.k > curr.d && curr.k < 30) {
      return { date: curr.date, close: curr.close }
    }
  }
  return null;
}

// 點擊頁籤時觸發抓取資料與繪圖
async function initTaiexChart() {
  if (taiexAnalysis.value) return // 已經載入過就不重抓
  isChartLoading.value = true

  try {
    const res = await $fetch('/api/taiex')
    if (!res.success) throw new Error(res.message)

    const dailyData = res.data.daily
    const weeklyData = res.data.weekly
    const monthlyData = res.data.monthly

    // 計算 KD
    const weeklyKD = calculateKD(weeklyData)
    const monthlyKD = calculateKD(monthlyData)
    const latestClose = dailyData[dailyData.length - 1].close

    // 取得均線資料
    const ma20Data = calculateMA(20, dailyData)
    const ma60Data = calculateMA(60, dailyData)
    const latestMA20 = ma20Data[ma20Data.length - 1]
    const latestMA60 = ma60Data[ma60Data.length - 1]
    
    // 均線趨勢判斷
    const prevMA20 = ma20Data[ma20Data.length - 2]
    const ma20Trend = latestMA20 > prevMA20 ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>'
    const prevMA60 = ma60Data[ma60Data.length - 2]
    const ma60Trend = latestMA60 > prevMA60 ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>'

    // 分析週 KD 極值 (起漲點至現價需滿足 600-800 點)
    const lastWeeklyWave = findLastGoldenCrossWave(weeklyKD)
    let weeklyAnalysis = '', weeklyAlert = '', wAlertClass = ''
    if (lastWeeklyWave) {
      const pointDiff = latestClose - lastWeeklyWave.close
      weeklyAnalysis = `前次週KD低檔金叉發生在 ${lastWeeklyWave.date} (點位: ${Math.round(lastWeeklyWave.close)})。目前指數已 ${pointDiff >= 0 ? '上漲' : '下跌'} ${Math.round(Math.abs(pointDiff))} 點。`
      if (pointDiff >= 800) {
        weeklyAlert = `⚠️ 週線波段已漲 ${Math.round(pointDiff)} 點，滿足並超越 600~800 點極值空間，中線行情隨時有回檔修正乖離之風險！`
        wAlertClass = 'alert-danger'
      } else if (pointDiff >= 600) {
        weeklyAlert = `⚡ 週線波段已達極值下緣 (${Math.round(pointDiff)} 點)，請勿盲目追高，留意月線 (20MA) 支撐。`
        wAlertClass = 'alert-warning'
      } else {
        weeklyAlert = `✅ 中線極值空間尚未滿足，若股價站穩 20MA，中線行情仍有發揮空間。`
        wAlertClass = 'alert-success'
      }
    }

    // 分析月 KD 極值 (起漲點至現價最少漲 2000 點)
    const lastMonthlyWave = findLastGoldenCrossWave(monthlyKD)
    let monthlyAnalysis = '', monthlyAlert = '', mAlertClass = ''
    if (lastMonthlyWave) {
      const pointDiff = latestClose - lastMonthlyWave.close
      monthlyAnalysis = `前次月KD低檔金叉發生在 ${lastMonthlyWave.date} (點位: ${Math.round(lastMonthlyWave.close)})。目前長波段已上漲 ${Math.round(pointDiff)} 點。`
      if (pointDiff >= 2000) {
        if (monthlyKD[monthlyKD.length-1].k > 80) {
          monthlyAlert = `⚠️ 長線波段已漲 ${Math.round(pointDiff)} 點，完全滿足 2000 點極值要求！且月 KD 處於高檔 (>80)，若季線(60MA)下彎將確認長波段結束，強烈警示風險！`
          mAlertClass = 'alert-danger'
        } else {
          monthlyAlert = `⚡ 長線漲點已達極值 (${Math.round(pointDiff)} 點)，進入長線高檔風險區。`
          mAlertClass = 'alert-warning'
        }
      } else {
        monthlyAlert = `✅ 長波段 2000 點極值尚未滿足，大趨勢依然偏多，留意季線(60MA)防守。`
        mAlertClass = 'alert-success'
      }
    }

    // 將分析結果綁定至 UI
    taiexAnalysis.value = {
      daily: { current: latestClose, ma20: latestMA20, ma20_trend: ma20Trend, ma60: latestMA60, ma60_trend: ma60Trend },
      weekly: { k: weeklyKD[weeklyKD.length - 1].k, d: weeklyKD[weeklyKD.length - 1].d, analysis: weeklyAnalysis, alertText: weeklyAlert, alertClass: wAlertClass },
      monthly: { k: monthlyKD[monthlyKD.length - 1].k, d: monthlyKD[monthlyKD.length - 1].d, analysis: monthlyAnalysis, alertText: monthlyAlert, alertClass: mAlertClass }
    }

    // 繪製 ECharts K線圖 (將每日資料準備給 Echarts)
    const categoryData = dailyData.map(item => item.date)
    const values = dailyData.map(item => [item.open, item.close, item.low, item.high])

    setTimeout(() => {
      const chartDom = document.getElementById('taiexChart')
      if (chartDom && window.echarts) {
        chartInstance = window.echarts.init(chartDom)
        chartInstance.setOption({
          tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
          legend: { data: ['日K線', '月線化身 (20MA)', '季線化身 (60MA)'] },
          grid: { left: '10%', right: '5%', bottom: '15%' },
          xAxis: { type: 'category', data: categoryData, boundaryGap: false },
          yAxis: { scale: true, splitArea: { show: true } },
          dataZoom: [
            { type: 'inside', start: 50, end: 100 },
            { show: true, type: 'slider', top: '90%', start: 50, end: 100 }
          ],
          series: [
            {
              name: '日K線', type: 'candlestick', data: values,
              itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' }
            },
            {
              name: '月線化身 (20MA)', type: 'line', data: ma20Data, smooth: true,
              lineStyle: { opacity: 0.8, color: '#0dcaf0', width: 2 }, symbol: 'none'
            },
            {
              name: '季線化身 (60MA)', type: 'line', data: ma60Data, smooth: true,
              lineStyle: { opacity: 0.8, color: '#ffc107', width: 2 }, symbol: 'none'
            }
          ]
        })
      }
    }, 100)

  } catch (error) {
    alert('無法取得台股資料：' + error.message)
  } finally {
    isChartLoading.value = false
  }
}
</script>

<style>
/* 包含原本的所有樣式 */
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; transition: transform 0.2s; overflow: hidden; }
.card:hover { transform: translateY(-3px); }
.card-header { font-weight: bold; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); }

/* 分頁 (Nav Tabs) 樣式美化 */
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
