<template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室 Nuxt.js</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

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
                            {{ isSyncing ? '爬蟲執行中...' : '🔄 啟動雲端爬蟲 (API)' }}
                        </button>
                        <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">Hugging Face 伺服器 (約需2分鐘)</small>
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
                                    <tr v-if="!dashboardData.content.metals?.length"><td colspan="4" class="text-muted py-3">暫無數據</td></tr>
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
                                    <tr v-if="!dashboardData.content.currencies?.length"><td colspan="4" class="text-muted py-3">暫無匯率數據</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="dashboardData.content.raw_indicators" class="row mt-2">
            <div class="col-12"><h4 class="mb-3 border-start border-5 border-primary ps-3 fw-bold">📑 整體經濟指標細項</h4></div>
            
            <div class="col-12 mb-3">
                <div class="card section-bar-tw">
                    <div class="card-header bg-light">📌 核心概況 & 時間</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">資料日期</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Date || "--" }}</div></div></div>
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">Mark 17 得分</div><div class="metric-value text-primary">{{ dashboardData.content.raw_indicators.Mark17_Score || "--" }}</div></div></div>
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">CRB 指數</div><div class="metric-value">{{ dashboardData.content.raw_indicators.CRB_Index || "--" }}</div></div></div>
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">美元指數 (DXY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Currency_DXY || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-tw">
                    <div class="card-header bg-light">💰 台灣資金與股市</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">台股總市值 (百萬)</div><div class="metric-value text-success">{{ dashboardData.content.raw_indicators.MV_Num || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.MV_Date || "" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">市值貨幣比</div><div class="metric-value">{{ dashboardData.content.raw_indicators.MV_Ratio || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 年增率 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_YoY || "--" }}%</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 數值 (億)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_Num || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.M1b_Date || "" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-us">
                    <div class="card-header bg-light">📉 美國債市與利率</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">美債 10年殖利率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_10Y || "--" }}%</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">美債 3個月殖利率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_3M || "--" }}%</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">長短利差 (10Y-3M)</div><div :class="['metric-value', dashboardData.content.raw_indicators.Spread_3M_10Y < 0 ? 'text-danger' : '']">{{ dashboardData.content.raw_indicators.Spread_3M_10Y || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">衰退機率</div><div class="metric-value text-danger">{{ dashboardData.content.raw_indicators.Recession_Prob || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.Recession_Date || "" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-cycle">
                    <div class="card-header bg-light">🏭 景氣循環與製造業</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">中國 PMI</div><div class="metric-value">{{ dashboardData.content.raw_indicators.China_PMI || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.China_PMI_Date || "" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">美國失業率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Unemployment || "--" }}%</div></div></div>
                            <div class="col-12"><div class="metric-item"><div class="metric-label">美國領先指標 (LEI)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Leading_Index || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-sentiment">
                    <div class="card-header bg-light">🛍️ 消費信心與訂單</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">密大消費者信心</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Michigan_Index || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.Michigan_Date || "" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">耐久財新訂單 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_New || "--" }}</div></div></div>
                            <div class="col-12"><div class="metric-item"><div class="metric-label">扣除國防耐久財 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_Old || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-2" v-if="dashboardData.content.global_markets?.length">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-secondary text-white fw-bold d-flex justify-content-between align-items-center">
                        <span>🌍 全球主要股市位階偵測 (乖離率監控)</span>
                        <small>負值代表回檔幅度，正值代表反彈幅度</small>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover table-bordered mb-0 align-middle text-center" style="font-size: 0.85rem;">
                                <thead class="table-light">
                                    <tr>
                                        <th rowspan="2" class="align-middle">指數名稱</th>
                                        <th rowspan="2" class="align-middle bg-light">現價</th>
                                        <th colspan="2">半年 (6M)</th>
                                        <th colspan="2">一年 (1Y)</th>
                                        <th colspan="2">三年 (3Y)</th>
                                    </tr>
                                    <tr>
                                        <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                        <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                        <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in dashboardData.content.global_markets" :key="m.name">
                                        <td class="fw-bold text-start ps-3">{{ m.name }}</td>
                                        <td class="fw-bold bg-light">{{ m.current }}</td>
                                        
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

        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light text-dark fw-bold d-flex justify-content-between" data-bs-toggle="collapse" href="#mark17Details" role="button" aria-expanded="true">
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
                                        <tr v-if="!dashboardData.content.mark17?.length"><td colspan="3" class="text-center text-muted py-3">暫無數據</td></tr>
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
      <div v-else>
          <p class="text-muted fw-bold">目前資料庫尚無數據 📭</p>
          <p class="text-small">請等待 Python 爬蟲將最新數據推播至 API，或點擊上方按鈕手動上傳 JSON。</p>
      </div>
    </div>

    <footer class="text-center py-4 mt-5 text-muted border-top bg-white">
        <small>&copy; 2026 MacroWave System | Powered by Nuxt & Vercel</small>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const rawResponseData = ref(null)
const isLoading = ref(true)
const selectedFile = ref(null)
const isUploading = ref(false)

// 1. 取得資料庫最新資料
const { data: response } = await useFetch('/api/latest')
if (response.value && response.value.data) {
  rawResponseData.value = response.value.data
}
isLoading.value = false 

// 整理供畫面綁定的 Computed 變數
const dashboardData = computed(() => rawResponseData.value)

const dataSourceDisplay = computed(() => {
  if (!dashboardData.value) return '無數據'
  const content = dashboardData.value.content
  const source = dashboardData.value.source_type || '未知來源'
  // 優先使用 JSON 裡的更新時間，否則使用資料庫寫入時間
  const timeStr = content.update_time || new Date(dashboardData.value.created_at).toLocaleString('zh-TW')
  return `${source} (時間: ${timeStr})`
})

// =====================================
// 新增：Hugging Face API 雲端爬蟲觸發邏輯
// =====================================
const isSyncing = ref(false)

const triggerSync = async () => {
  if (!confirm('確定要啟動雲端爬蟲嗎？\n資料將在背景抓取，約需 90~120 秒後自動更新至本站。')) return
  
  isSyncing.value = true
  try {
    // ⚠️ 務必將這裡替換成您實際佈署在 Hugging Face Space 的網址
    const hfApiUrl = 'https://lawxstudents168-macrowave-scrape-api.hf.space/api/trigger-sync'
    
    const response = await $fetch(hfApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    alert(`✅ 已成功發送指令！\n伺服器回應：${response.message}\n\n系統將在 2 分鐘後自動重整網頁。`)
    
    // 設定 120 秒 (120,000 毫秒) 後自動重整網頁，顯示推播回來的新資料
    setTimeout(() => {
      window.location.reload()
    }, 120000)

  } catch (err) {
    alert('❌ 觸發爬蟲失敗，請檢查 Hugging Face 網址或伺服器狀態：\n' + err.message)
    isSyncing.value = false
  }
}

// =====================================
// 原有：手動上傳 JSON 邏輯
// =====================================
const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
}

const uploadToServer = async () => {
  if (!selectedFile.value) return
  isUploading.value = true

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const parsedData = JSON.parse(e.target.result)
      
      // 發送 POST 請求到我們建立的 API (/api/upload.post.ts)
      await $fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-Api-Key': 'macrowave168' // 需與後端 API 及環境變數 API_UPLOAD_KEY 吻合
        },
        body: parsedData
      })

      alert('上傳成功！資料已永久儲存至 Supabase。')
      
      // 上傳成功後，重新整理網頁以拉取最新資料庫數據
      window.location.reload()

    } catch (err) {
      alert('上傳失敗，請確認資料庫與 API 設定：\n' + err.message)
    } finally {
      isUploading.value = false
    }
  }
  
  reader.onerror = () => {
    alert('讀取檔案失敗')
    isUploading.value = false
  }
  
  reader.readAsText(selectedFile.value)
}
</script>

<style>
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; transition: transform 0.2s; overflow: hidden; }
.card:hover { transform: translateY(-3px); }
.card-header { font-weight: bold; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); }
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
.text-small { font-size: 0.85rem; }
.text-diff-pos { color: #dc3545; font-weight: bold; }
.text-diff-neg { color: #198754; font-weight: bold; }
</style><template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室 Nuxt.js</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

    <div class="container mb-4">
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="row align-items-center text-center">
                    <div class="col-md-6 mb-3 mb-md-0">
                        <h6 class="text-uppercase text-muted fw-bold" style="font-size: 0.8rem;">目前數據來源</h6>
                        <span class="badge bg-primary fs-6 text-wrap" style="line-height: 1.5;">{{ dataSourceDisplay }}</span>
                        <div v-if="dashboardData?.content?.date" class="mt-2 text-muted" style="font-size: 0.85rem;">
                            資料基準日: <strong>{{ dashboardData.content.date }}</strong>
                        </div>
                    </div>
                    <div class="col-md-6 border-start">
                        <button class="btn btn-outline-success w-100 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#uploadBox">
                            📤 上傳 JSON 至雲端資料庫
                        </button>
                        <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">資料將永久保存，重整不會消失</small>
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
                                    <tr v-if="!dashboardData.content.metals?.length"><td colspan="4" class="text-muted py-3">暫無數據</td></tr>
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
                                    <tr v-if="!dashboardData.content.currencies?.length"><td colspan="4" class="text-muted py-3">暫無匯率數據</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="dashboardData.content.raw_indicators" class="row mt-2">
            <div class="col-12"><h4 class="mb-3 border-start border-5 border-primary ps-3 fw-bold">📑 整體經濟指標細項</h4></div>
            
            <div class="col-12 mb-3">
                <div class="card section-bar-tw">
                    <div class="card-header bg-light">📌 核心概況 & 時間</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">資料日期</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Date || "--" }}</div></div></div>
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">Mark 17 得分</div><div class="metric-value text-primary">{{ dashboardData.content.raw_indicators.Mark17_Score || "--" }}</div></div></div>
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">CRB 指數</div><div class="metric-value">{{ dashboardData.content.raw_indicators.CRB_Index || "--" }}</div></div></div>
                            <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">美元指數 (DXY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Currency_DXY || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-tw">
                    <div class="card-header bg-light">💰 台灣資金與股市</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">台股總市值 (百萬)</div><div class="metric-value text-success">{{ dashboardData.content.raw_indicators.MV_Num || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.MV_Date || "" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">市值貨幣比</div><div class="metric-value">{{ dashboardData.content.raw_indicators.MV_Ratio || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 年增率 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_YoY || "--" }}%</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 數值 (億)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_Num || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.M1b_Date || "" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-us">
                    <div class="card-header bg-light">📉 美國債市與利率</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">美債 10年殖利率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_10Y || "--" }}%</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">美債 3個月殖利率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_3M || "--" }}%</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">長短利差 (10Y-3M)</div><div :class="['metric-value', dashboardData.content.raw_indicators.Spread_3M_10Y < 0 ? 'text-danger' : '']">{{ dashboardData.content.raw_indicators.Spread_3M_10Y || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">衰退機率</div><div class="metric-value text-danger">{{ dashboardData.content.raw_indicators.Recession_Prob || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.Recession_Date || "" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-cycle">
                    <div class="card-header bg-light">🏭 景氣循環與製造業</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">中國 PMI</div><div class="metric-value">{{ dashboardData.content.raw_indicators.China_PMI || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.China_PMI_Date || "" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">美國失業率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Unemployment || "--" }}%</div></div></div>
                            <div class="col-12"><div class="metric-item"><div class="metric-label">美國領先指標 (LEI)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Leading_Index || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-sentiment">
                    <div class="card-header bg-light">🛍️ 消費信心與訂單</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">密大消費者信心</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Michigan_Index || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.Michigan_Date || "" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">耐久財新訂單 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_New || "--" }}</div></div></div>
                            <div class="col-12"><div class="metric-item"><div class="metric-label">扣除國防耐久財 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_Old || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-2" v-if="dashboardData.content.global_markets?.length">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-secondary text-white fw-bold d-flex justify-content-between align-items-center">
                        <span>🌍 全球主要股市位階偵測 (乖離率監控)</span>
                        <small>負值代表回檔幅度，正值代表反彈幅度</small>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover table-bordered mb-0 align-middle text-center" style="font-size: 0.85rem;">
                                <thead class="table-light">
                                    <tr>
                                        <th rowspan="2" class="align-middle">指數名稱</th>
                                        <th rowspan="2" class="align-middle bg-light">現價</th>
                                        <th colspan="2">半年 (6M)</th>
                                        <th colspan="2">一年 (1Y)</th>
                                        <th colspan="2">三年 (3Y)</th>
                                    </tr>
                                    <tr>
                                        <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                        <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                        <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in dashboardData.content.global_markets" :key="m.name">
                                        <td class="fw-bold text-start ps-3">{{ m.name }}</td>
                                        <td class="fw-bold bg-light">{{ m.current }}</td>
                                        
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

        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light text-dark fw-bold d-flex justify-content-between" data-bs-toggle="collapse" href="#mark17Details" role="button" aria-expanded="true">
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
                                        <tr v-if="!dashboardData.content.mark17?.length"><td colspan="3" class="text-center text-muted py-3">暫無數據</td></tr>
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
      <div v-else>
          <p class="text-muted fw-bold">目前資料庫尚無數據 📭</p>
          <p class="text-small">請等待 Python 爬蟲將最新數據推播至 API，或點擊上方按鈕手動上傳 JSON。</p>
      </div>
    </div>

    <footer class="text-center py-4 mt-5 text-muted border-top bg-white">
        <small>&copy; 2026 MacroWave System | Powered by Nuxt & Vercel</small>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const rawResponseData = ref(null)
const isLoading = ref(true)
const selectedFile = ref(null)
const isUploading = ref(false)

// 1. 取得資料庫最新資料
const { data: response } = await useFetch('/api/latest')
if (response.value && response.value.data) {
  rawResponseData.value = response.value.data
}
isLoading.value = false 

// 整理供畫面綁定的 Computed 變數
const dashboardData = computed(() => rawResponseData.value)

const dataSourceDisplay = computed(() => {
  if (!dashboardData.value) return '無數據'
  const content = dashboardData.value.content
  const source = dashboardData.value.source_type || '未知來源'
  // 優先使用 JSON 裡的更新時間，否則使用資料庫寫入時間
  const timeStr = content.update_time || new Date(dashboardData.value.created_at).toLocaleString('zh-TW')
  return `${source} (時間: ${timeStr})`
})

// 2. 選擇檔案 (綁定 input 標籤)
const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
}

// 3. 真正上傳至伺服器資料庫的邏輯
const uploadToServer = async () => {
  if (!selectedFile.value) return
  isUploading.value = true

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const parsedData = JSON.parse(e.target.result)
      
      // 發送 POST 請求到我們建立的 API (/api/upload.post.ts)
      await $fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-Api-Key': 'macrowave168' // 需與後端 API 及環境變數 API_UPLOAD_KEY 吻合
        },
        body: parsedData
      })

      alert('上傳成功！資料已永久儲存至 Supabase。')
      
      // 上傳成功後，重新整理網頁以拉取最新資料庫數據
      window.location.reload()

    } catch (err) {
      alert('上傳失敗，請確認資料庫與 API 設定：\n' + err.message)
    } finally {
      isUploading.value = false
    }
  }
  
  reader.onerror = () => {
    alert('讀取檔案失敗')
    isUploading.value = false
  }
  
  reader.readAsText(selectedFile.value)
}
</script>

<style>
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; transition: transform 0.2s; overflow: hidden; }
.card:hover { transform: translateY(-3px); }
.card-header { font-weight: bold; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); }
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
.text-small { font-size: 0.85rem; }
.text-diff-pos { color: #dc3545; font-weight: bold; }
.text-diff-neg { color: #198754; font-weight: bold; }
</style>
