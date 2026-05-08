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
            🚀 台股分析 (動態極值強化版)
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
                            <span class="badge bg-primary fs-6 text-wrap">{{ dataSourceDisplay }}</span>
                        </div>
                        <div class="col-md-4 mb-3 mb-md-0 border-start border-end">
                            <button class="btn btn-outline-danger w-100 fw-bold" @click="triggerSync" :disabled="isSyncing">
                                <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1"></span>
                                {{ isSyncing ? '執行中...' : '🔄 啟動雲端爬蟲 (API)' }}
                            </button>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-outline-success w-100 fw-bold" data-bs-toggle="collapse" data-bs-target="#uploadBox">📤 手動上傳 JSON</button>
                        </div>
                    </div>
                    <hr class="my-4 text-muted">
                    <div class="row align-items-center g-3 text-center">
                        <div class="col-md-3 text-md-end"><span class="fw-bold text-secondary">🔗 外部系統聯動：</span></div>
                        <div class="col-md-4">
                            <button class="btn btn-dark w-100 fw-bold shadow-sm" @click="triggerTwstockSync" :disabled="isSyncingTwstock">🚀 獨立更新 Twstock168</button>
                        </div>
                        <div class="col-md-5">
                            <a href="https://www.macromicro.me/collections/46/tw-stock-relative/110457/tw-tmf-long-to-short-ratio-of-individual-player" target="_blank" class="btn btn-danger w-100 fw-bold shadow-sm">🔥 微台散戶多空比 (M平方)</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container" v-if="dashboardData">
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card text-center p-4 bg-white shadow-sm">
                        <h5 class="text-muted mb-3 text-uppercase">Mark 17 總經風險評分</h5>
                        <div class="d-flex justify-content-center align-items-center gap-4 flex-wrap">
                            <div class="d-flex align-items-baseline"><span class="display-3 fw-bold">{{ dashboardData.content.total_score }}</span><span class="text-muted fs-4 ms-2">/ 15</span></div>
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
                            <div class="d-flex justify-content-between align-items-center"><span class="fw-bold fs-5">利差 (Spread)</span><span :class="['fs-4', 'status-' + dashboardData.content.us_jp_spread.status]">{{ dashboardData.content.us_jp_spread.spread }}%</span></div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-warning text-dark fw-bold">🥇 貴金屬重挫偵測</div>
                        <div class="card-body p-0">
                            <table class="table table-striped mb-0 text-center">
                                <thead class="table-light"><tr><th>商品</th><th>現價</th><th>跌幅</th></tr></thead>
                                <tbody>
                                    <tr v-for="metal in dashboardData.content.metals" :key="metal.name">
                                        <td class="fw-bold">{{ metal.name }}</td><td>{{ Math.round(metal.current) }}</td>
                                        <td>{{ metal.drop ? metal.drop.toFixed(1) : 0 }}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-primary text-white fw-bold">💱 關鍵匯率監控</div>
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0 text-center">
                                <thead class="table-light"><tr><th>貨幣</th><th>現價</th><th>位階</th></tr></thead>
                                <tbody>
                                    <tr v-for="curr in dashboardData.content.currencies" :key="curr.name">
                                        <td class="fw-bold text-start ps-3">{{ curr.name }}</td><td>{{ curr.current }}</td>
                                        <td :class="curr.diff_high < -5 ? 'text-success fw-bold' : ''">{{ curr.diff_high }}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center mt-5"><div class="spinner-border text-primary" role="status" v-if="isLoading"></div></div>
      </div>

      <div class="tab-pane fade" id="taiex" role="tabpanel">
        <div class="container pb-5 mt-4">
          <div class="row mb-4" v-if="taiexAnalysis">
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-primary shadow-sm">
                <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between">
                    <span>長線循環：月KD ╳ 季線</span>
                    <span>最新: {{ taiexAnalysis.daily.current.toFixed(0) }}</span>
                </div>
                <div class="card-body">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新月 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.monthly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.monthly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">季線 (60MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma60.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma60_trend"></span></span>
                  </div>
                  <div class="bg-light p-3 rounded border border-warning mb-3">
                    <div class="fw-bold text-dark mb-1">🎯 季線 (60MA) 扣抵預測</div>
                    <div class="d-flex justify-content-between small"><span>明日均線防守價</span><span class="fw-bold">{{ taiexAnalysis.daily.deduction60.price.toFixed(2) }}</span></div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="small">多空判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction60.isSafe" class="badge bg-success">安全 (+{{ taiexAnalysis.daily.deduction60.diff.toFixed(0) }})</span>
                      <span v-else class="badge bg-danger">警戒 ({{ taiexAnalysis.daily.deduction60.diff.toFixed(0) }})</span>
                    </div>
                  </div>
                  <hr>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.monthly.analysis }}</p>
                  <div class="alert mt-2 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.monthly.alertClass">{{ taiexAnalysis.monthly.alertText }}</div>
                </div>
              </div>
            </div>
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-info shadow-sm">
                <div class="card-header bg-info text-dark fw-bold d-flex justify-content-between">
                    <span>中線行情：週KD ╳ 月線</span>
                    <span>最新: {{ taiexAnalysis.daily.current.toFixed(0) }}</span>
                </div>
                <div class="card-body">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新週 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.weekly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.weekly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">月線 (20MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma20.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma20_trend"></span></span>
                  </div>
                  <div class="bg-light p-3 rounded border border-primary mb-3">
                    <div class="fw-bold text-dark mb-1">🎯 月線 (20MA) 扣抵預測</div>
                    <div class="d-flex justify-content-between small"><span>明日均線防守價</span><span class="fw-bold">{{ taiexAnalysis.daily.deduction20.price.toFixed(2) }}</span></div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="small">多空判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction20.isSafe" class="badge bg-success">安全 (+{{ taiexAnalysis.daily.deduction20.diff.toFixed(0) }})</span>
                      <span v-else class="badge bg-danger">警戒 ({{ taiexAnalysis.daily.deduction20.diff.toFixed(0) }})</span>
                    </div>
                  </div>
                  <hr>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.weekly.analysis }}</p>
                  <div class="alert mt-2 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.weekly.alertClass">{{ taiexAnalysis.weekly.alertText }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card shadow-sm mb-4" v-show="!isChartLoading && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII)</h5>
                <div class="btn-group">
                  <button v-for="p in ['daily', 'weekly', 'monthly']" :key="p" @click="currentPeriod = p; renderEChart('taiexChart', p)" :class="['btn fw-bold', currentPeriod === p ? 'btn-primary' : 'btn-outline-primary']">{{ p === 'daily' ? '日 K' : p === 'weekly' ? '週 K' : '月 K' }}</button>
                </div>
              </div>
              <div id="taiexChart" style="width: 100%; height: 70vh; min-height: 550px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-pane fade" id="taiex-dynamic" role="tabpanel">
        <div class="container pb-5 mt-4">
          <div class="row mb-4" v-if="taiexAnalysisDynamic">
            
            <div class="col-md-6 mb-3">
                <div class="card h-100 border-danger shadow-sm">
                    <div class="card-header bg-danger text-white fw-bold d-flex justify-content-between">
                        <span>🚀 長線動態極值 (25%)</span>
                        <span>最新: {{ taiexAnalysisDynamic.daily.current.toFixed(0) }}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">最新月 KD</span>
                            <span class="fw-bold fs-5">K: <span :class="taiexAnalysisDynamic.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysisDynamic.monthly.k.toFixed(2) }}</span> / D: {{ taiexAnalysisDynamic.monthly.d.toFixed(2) }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-muted">季線 (60MA) 狀態</span>
                            <span class="fw-bold fs-5">{{ taiexAnalysisDynamic.daily.ma60.toFixed(2) }} <span v-html="taiexAnalysisDynamic.daily.ma60_trend"></span></span>
                        </div>

                        <div class="bg-light p-3 rounded border border-danger mb-3">
                            <div class="fw-bold text-danger mb-2 border-bottom border-danger pb-1">🎯 25% 動態週期追蹤</div>
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>轉折起點日期</span><span>{{ taiexAnalysisDynamic.monthly.baseDate }}</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>轉折類型</span><span :class="taiexAnalysisDynamic.monthly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ taiexAnalysisDynamic.monthly.crossType }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>基準點位</span><span class="fw-bold">{{ taiexAnalysisDynamic.monthly.basePrice.toFixed(0) }} 點</span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>動態極值目標</span><span class="fw-bold text-dark">{{ taiexAnalysisDynamic.monthly.targetPrice.toFixed(0) }} 點</span>
                            </div>
                            <div class="mt-2 pt-2 border-top">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold">波段推進進度：</span>
                                    <span class="badge bg-danger fs-6">{{ taiexAnalysisDynamic.monthly.currentDiff.toFixed(0) }} 點 ({{ taiexAnalysisDynamic.monthly.percentDiff.toFixed(1) }}%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-2 rounded border mb-3 small shadow-sm">
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">季線(60MA) 防守價</span>
                                <span class="fw-bold text-dark">{{ taiexAnalysisDynamic.daily.deduction60.price.toFixed(0) }}</span>
                            </div>
                            <div class="d-flex justify-content-between mt-1">
                                <span>防禦狀態</span>
                                <span v-if="taiexAnalysisDynamic.daily.deduction60.isSafe" class="text-success fw-bold">安全 (+{{ taiexAnalysisDynamic.daily.deduction60.diff.toFixed(0) }})</span>
                                <span v-else class="text-danger fw-bold">跌破 ({{ taiexAnalysisDynamic.daily.deduction60.diff.toFixed(0) }})</span>
                            </div>
                        </div>

                        <hr class="mt-auto">
                        <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.monthly.alertClass">{{ taiexAnalysisDynamic.monthly.alertText }}</div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card h-100 border-warning shadow-sm">
                    <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between">
                        <span>🚀 中線動態極值 (7.5%-10%)</span>
                        <span>最新: {{ taiexAnalysisDynamic.daily.current.toFixed(0) }}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">最新週 KD</span>
                            <span class="fw-bold fs-5">K: <span :class="taiexAnalysisDynamic.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysisDynamic.weekly.k.toFixed(2) }}</span> / D: {{ taiexAnalysisDynamic.weekly.d.toFixed(2) }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-muted">月線 (20MA) 狀態</span>
                            <span class="fw-bold fs-5">{{ taiexAnalysisDynamic.daily.ma20.toFixed(2) }} <span v-html="taiexAnalysisDynamic.daily.ma20_trend"></span></span>
                        </div>

                        <div class="bg-light p-3 rounded border border-warning mb-3">
                            <div class="fw-bold text-dark mb-2 border-bottom border-warning pb-1">🎯 10% 動態中線追蹤</div>
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>轉折起點日期</span><span>{{ taiexAnalysisDynamic.weekly.baseDate }}</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>轉折類型</span><span :class="taiexAnalysisDynamic.weekly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ taiexAnalysisDynamic.weekly.crossType }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>基準點位</span><span class="fw-bold">{{ taiexAnalysisDynamic.weekly.basePrice.toFixed(0) }} 點</span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>動態極值區間</span><span class="fw-bold text-dark">{{ taiexAnalysisDynamic.weekly.targetPriceMin.toFixed(0) }} ~ {{ taiexAnalysisDynamic.weekly.targetPriceMax.toFixed(0) }} 點</span>
                            </div>
                            <div class="mt-2 pt-2 border-top">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small fw-bold">波段推進進度：</span>
                                    <span class="badge bg-warning text-dark fs-6">{{ taiexAnalysisDynamic.weekly.currentDiff.toFixed(0) }} 點 ({{ taiexAnalysisDynamic.weekly.percentDiff.toFixed(1) }}%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-2 rounded border mb-3 small shadow-sm">
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">月線(20MA) 防守價</span>
                                <span class="fw-bold text-dark">{{ taiexAnalysisDynamic.daily.deduction20.price.toFixed(0) }}</span>
                            </div>
                            <div class="d-flex justify-content-between mt-1">
                                <span>防禦狀態</span>
                                <span v-if="taiexAnalysisDynamic.daily.deduction20.isSafe" class="text-success fw-bold">安全 (+{{ taiexAnalysisDynamic.daily.deduction20.diff.toFixed(0) }})</span>
                                <span v-else class="text-danger fw-bold">跌破 ({{ taiexAnalysisDynamic.daily.deduction20.diff.toFixed(0) }})</span>
                            </div>
                        </div>

                        <hr class="mt-auto">
                        <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.weekly.alertClass">{{ taiexAnalysisDynamic.weekly.alertText }}</div>
                    </div>
                </div>
            </div>
          </div>

          <div v-if="isChartLoadingDynamic" class="text-center my-5">
            <div class="spinner-border text-danger" role="status"></div>
            <p class="mt-2 text-muted fw-bold">動態運算分析中...</p>
          </div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoadingDynamic && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 - 動態極值對照</h5>
                <div class="btn-group">
                  <button v-for="p in ['daily', 'weekly', 'monthly']" :key="p" @click="currentPeriodDynamic = p; renderEChart('taiexChartDynamic', p)" :class="['btn fw-bold', currentPeriodDynamic === p ? 'btn-danger' : 'btn-outline-danger']">{{ p === 'daily' ? '日 K' : p === 'weekly' ? '週 K' : '月 K' }}</button>
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
// 1. 總經資料抓取與同步 (保持原本邏輯)
// =====================================
const rawResponseData = ref(null);
const isLoading = ref(true);
const dashboardData = computed(() => rawResponseData.value);
const dataSourceDisplay = computed(() => {
    if (!dashboardData.value) return '無數據';
    const timeStr = dashboardData.value.content.update_time || new Date(dashboardData.value.created_at).toLocaleString('zh-TW');
    return `${dashboardData.value.source_type || '未知'} (時間: ${timeStr})`;
});

const fetchDashboardData = async () => {
    try {
        isLoading.value = true;
        const { data: response } = await useFetch('/api/latest');
        if (response.value && response.value.data) rawResponseData.value = response.value.data;
    } finally { isLoading.value = false; }
};

const isSyncing = ref(false);
const triggerSync = async () => {
    if (!confirm('確定啟動雲端爬蟲？')) return
    isSyncing.value = true
    const hfBaseUrls = ['https://pyfbsdk59-macrowave-scrape-api.hf.space','https://lawxstudents168-macrowave-scrape-api.hf.space','https://igveri59-macrowave-scrape-api.hf.space'];
    const shuffled = [...hfBaseUrls].sort(() => 0.5 - Math.random());
    for (let url of shuffled) {
        try {
            await $fetch(`${url}/api/trigger-sync`, { method: 'POST', timeout: 15000 });
            alert('指令發送成功，約3分鐘後自動更新。');
            setTimeout(() => window.location.reload(), 180000);
            break;
        } catch (e) { console.error(e); }
    }
    isSyncing.value = false;
};

const isSyncingTwstock = ref(false);
const triggerTwstockSync = async () => {
    isSyncingTwstock.value = true;
    try {
        await $fetch('https://lawxstudents168-twstock168-scrape-api.hf.space/api/trigger-twstock-sync', { method: 'POST' });
        alert('指令發送成功。');
        setTimeout(() => isSyncingTwstock.value = false, 150000);
    } catch (e) { isSyncingTwstock.value = false; }
};

const selectedFile = ref(null);
const isUploading = ref(false);
const handleFileSelect = (e) => selectedFile.value = e.target.files[0];
const uploadToServer = async () => {
    if (!selectedFile.value) return;
    isUploading.value = true;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            await $fetch('/api/upload', { method: 'POST', headers: { 'X-Api-Key': 'macrowave168' }, body: JSON.parse(e.target.result) });
            alert('上傳成功'); window.location.reload();
        } finally { isUploading.value = false; }
    };
    reader.readAsText(selectedFile.value);
};

onMounted(() => fetchDashboardData());

// =====================================
// 2. 技術指標計算核心
// =====================================
const taiexAllData = ref(null);
const isChartLoading = ref(false);
const isChartLoadingDynamic = ref(false);
const taiexAnalysis = ref(null);
const taiexAnalysisDynamic = ref(null);
const currentPeriod = ref('daily');
const currentPeriodDynamic = ref('daily');
let chartInstanceMap = {};

function sanitizeData(quotes) { return quotes.filter(q => q.open != null && q.high != null && q.low != null && q.close != null && !isNaN(q.close)); }

function calculateKD(quotes) {
    let k = 50, d = 50;
    return quotes.map((q, i, arr) => {
        if (i < 8) return { ...q, k: 50, d: 50 };
        const range = arr.slice(i - 8, i + 1);
        const hi = Math.max(...range.map(x => x.high)), lo = Math.min(...range.map(x => x.low));
        let rsv = hi === lo ? 0 : ((q.close - lo) / (hi - lo)) * 100;
        k = (rsv + k * 2) / 3; d = (k + d * 2) / 3;
        return { ...q, k, d };
    });
}

function calculateMA(n, q) {
    return q.map((_, i, arr) => {
        if (i < n - 1) return null;
        return arr.slice(i - n + 1, i + 1).reduce((s, x) => s + x.close, 0) / n;
    });
}

function findLastCross(kdData) {
    if (!kdData || kdData.length < 2) return null;
    for (let i = kdData.length - 1; i > 0; i--) {
        const p = kdData[i - 1], c = kdData[i];
        if (p.k <= p.d && c.k > c.d) return { ...c, type: 'golden', crossType: '黃金交叉(偏多)' };
        if (p.k >= p.d && c.k < c.d) return { ...c, type: 'death', crossType: '死亡交叉(偏空)' };
    }
    return null;
}

function getDeduction(dailyData, latestClose, n) {
    const idx = Math.max(0, dailyData.length - n);
    const price = dailyData[idx].close;
    return { date: dailyData[idx].date, price, diff: latestClose - price, isSafe: latestClose >= price };
}

async function prepareData() {
    if (taiexAllData.value) return;
    const res = await $fetch('/api/taiex');
    if (!res.success) throw new Error(res.message);
    taiexAllData.value = {
        daily: calculateKD(sanitizeData(res.data.daily)),
        weekly: calculateKD(sanitizeData(res.data.weekly)),
        monthly: calculateKD(sanitizeData(res.data.monthly))
    };
}

// 分頁二：傳統分析
async function initTaiexChart() {
    if (taiexAnalysis.value) return;
    isChartLoading.value = true;
    try {
        await prepareData();
        const daily = taiexAllData.value.daily, latest = daily[daily.length-1].close;
        const ma20 = calculateMA(20, daily), ma60 = calculateMA(60, daily);
        const lw = findLastCross(taiexAllData.value.weekly), lm = findLastCross(taiexAllData.value.monthly);

        taiexAnalysis.value = {
            daily: {
                current: latest, ma20: ma20[ma20.length-1], ma60: ma60[ma60.length-1],
                ma20_trend: ma20[ma20.length-1] > ma20[ma20.length-2] ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                ma60_trend: ma60[ma60.length-1] > ma60[ma60.length-2] ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                deduction20: getDeduction(daily, latest, 20), deduction60: getDeduction(daily, latest, 60)
            },
            weekly: { 
                k: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].k, d: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].d,
                analysis: lw ? `前次${lw.crossType}於 ${lw.date}。波段變動 ${Math.round(Math.abs(latest-lw.close))} 點。` : '數據不足',
                alertText: lw && Math.abs(latest-lw.close) > 800 ? '⚠️ 已達極值空間' : '✅ 尚有波段空間', alertClass: lw && Math.abs(latest-lw.close) > 800 ? 'alert-danger' : 'alert-success'
            },
            monthly: {
                k: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].k, d: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].d,
                analysis: lm ? `前次${lm.crossType}於 ${lm.date}。波段變動 ${Math.round(Math.abs(latest-lm.close))} 點。` : '數據不足',
                alertText: lm && Math.abs(latest-lm.close) > 2000 ? '⚠️ 長波段已達標' : '✅ 長線趨勢運行中', alertClass: lm && Math.abs(latest-lm.close) > 2000 ? 'alert-danger' : 'alert-success'
            }
        };
        renderEChart('taiexChart', 'daily');
    } finally { isChartLoading.value = false; }
}

// 分頁三：動態分析 (強化資料注入)
async function initTaiexDynamicChart() {
    if (taiexAnalysisDynamic.value) { renderEChart('taiexChartDynamic', currentPeriodDynamic.value); return; }
    isChartLoadingDynamic.value = true;
    try {
        await prepareData();
        const daily = taiexAllData.value.daily, latest = daily[daily.length-1].close;
        const ma20 = calculateMA(20, daily), ma60 = calculateMA(60, daily);
        const lw = findLastCross(taiexAllData.value.weekly), lm = findLastCross(taiexAllData.value.monthly);

        taiexAnalysisDynamic.value = {
            daily: {
                current: latest, ma20: ma20[ma20.length-1], ma60: ma60[ma60.length-1],
                ma20_trend: ma20[ma20.length-1] > ma20[ma20.length-2] ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>',
                ma60_trend: ma60[ma60.length-1] > ma60[ma60.length-2] ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>',
                deduction20: getDeduction(daily, latest, 20), deduction60: getDeduction(daily, latest, 60)
            },
            weekly: { 
                k: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].k, d: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].d,
                basePrice: lw.close, baseDate: lw.date, type: lw.type, crossType: lw.crossType,
                currentDiff: lw.type === 'golden' ? (latest - lw.close) : (lw.close - latest),
                percentDiff: (Math.abs(latest - lw.close) / lw.close) * 100,
                targetPriceMin: lw.type === 'golden' ? (lw.close * 1.075) : (lw.close * 0.925),
                targetPriceMax: lw.type === 'golden' ? (lw.close * 1.1) : (lw.close * 0.9),
                alertText: (Math.abs(latest - lw.close) / lw.close) > 0.1 ? '⚠️ 嚴重警戒！突破動態極值 (10%)' : '✅ 順勢推進中，空間未滿',
                alertClass: (Math.abs(latest - lw.close) / lw.close) > 0.1 ? 'alert-danger' : 'alert-success'
            },
            monthly: {
                k: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].k, d: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].d,
                basePrice: lm.close, baseDate: lm.date, type: lm.type, crossType: lm.crossType,
                currentDiff: lm.type === 'golden' ? (latest - lm.close) : (lm.close - latest),
                percentDiff: (Math.abs(latest - lm.close) / lm.close) * 100,
                targetPrice: lm.type === 'golden' ? (lm.close * 1.25) : (lm.close * 0.75),
                alertText: (Math.abs(latest - lm.close) / lm.close) > 0.25 ? '⚠️ 大波段警戒！突破動態極值 (25%)' : '✅ 長線空間尚未耗盡',
                alertClass: (Math.abs(latest - lm.close) / lm.close) > 0.25 ? 'alert-danger' : 'alert-success'
            }
        };
        renderEChart('taiexChartDynamic', 'daily');
    } finally { isChartLoadingDynamic.value = false; }
}

function renderEChart(containerId, periodKey) {
    if (!taiexAllData.value) return;
    const targetData = taiexAllData.value[periodKey];
    const categoryData = targetData.map(item => item.date);
    const candleValues = targetData.map(item => [item.open, item.close, item.low, item.high]);
    const ma20 = calculateMA(20, targetData), ma60 = calculateMA(60, targetData);

    setTimeout(() => {
        const chartDom = document.getElementById(containerId);
        if (!chartDom || !window.echarts) return;
        if (chartInstanceMap[containerId]) chartInstanceMap[containerId].dispose();
        const inst = window.echarts.init(chartDom);
        chartInstanceMap[containerId] = inst;

        inst.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
            axisPointer: { link: [{ xAxisIndex: 'all' }] },
            legend: { data: ['K線', '20MA', '60MA', '成交量', 'K值', 'D值'], top: 10 },
            grid: [{ left: '8%', right: '5%', top: '10%', height: '45%' }, { left: '8%', right: '5%', top: '62%', height: '12%' }, { left: '8%', right: '5%', top: '80%', height: '12%' }],
            xAxis: [{ type: 'category', data: categoryData, gridIndex: 0, axisLabel: { show: false } }, { type: 'category', data: categoryData, gridIndex: 1, axisLabel: { show: false } }, { type: 'category', data: categoryData, gridIndex: 2 }],
            yAxis: [{ scale: true, gridIndex: 0 }, { scale: true, gridIndex: 1, axisLabel: { show: false } }, { min: 0, max: 100, gridIndex: 2 }],
            dataZoom: [{ type: 'inside', xAxisIndex: [0, 1, 2], start: 70, end: 100 }, { show: true, xAxisIndex: [0, 1, 2], top: '94%', start: 70, end: 100 }],
            series: [
                { name: 'K線', type: 'candlestick', data: candleValues, itemStyle: { color: '#dc3545', color0: '#198754' } },
                { name: '20MA', type: 'line', data: ma20, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
                { name: '60MA', type: 'line', data: ma60, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
                { name: '成交量', type: 'bar', data: targetData.map(i => ({ value: i.volume, itemStyle: { color: i.close>=i.open?'#dc3545':'#198754'} })), xAxisIndex: 1, yAxisIndex: 1 },
                { name: 'K值', type: 'line', data: targetData.map(i=>i.k), xAxisIndex: 2, yAxisIndex: 2, lineStyle: { color: '#dc3545' } },
                { name: 'D值', type: 'line', data: targetData.map(i=>i.d), xAxisIndex: 2, yAxisIndex: 2, lineStyle: { color: '#0d6efd' } }
            ]
        });
    }, 50);
}
</script>

<style>
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; }
.nav-tabs .nav-link { border: none; color: #6c757d; }
.nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 4px solid #0d6efd; background-color: transparent; }
.advice-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 1.1rem; }
.advice-Safe { background-color: #d1e7dd; color: #0f5132; }
.advice-Caution { background-color: #fff3cd; color: #664d03; }
.advice-Flee { background-color: #f8d7da; color: #842029; }
.status-Safe { color: #198754; font-weight: bold; }
.status-Danger { color: #dc3545; font-weight: bold; }
.metric-item { padding: 10px; border-radius: 8px; background-color: #f8f9fa; border: 1px solid #e9ecef; }
</style>
