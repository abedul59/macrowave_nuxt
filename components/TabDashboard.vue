<template>
  <div class="container mb-4">
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row align-items-center text-center">
            <div class="col-md-4 mb-3 mb-md-0">
                <h6 class="text-uppercase text-muted fw-bold" style="font-size: 0.8rem;">目前數據來源</h6>
                <span class="badge bg-primary fs-6 text-wrap">{{ dataSourceDisplay }}</span>
            </div>
            
            <div class="col-md-4 mb-3 mb-md-0 border-start border-end px-3">
                <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text bg-light fw-bold">伺服器</span>
                    <select class="form-select text-center fw-bold text-secondary" v-model="selectedHfAccount" :disabled="isSyncing">
                        <option v-for="acc in hfAccounts" :key="acc.value" :value="acc.value">{{ acc.label }}</option>
                    </select>
                </div>
                <button class="btn btn-outline-danger w-100 fw-bold" @click="triggerSync" :disabled="isSyncing">
                    <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1"></span>
                    {{ syncStatusText }}
                </button>
            </div>

            <div class="col-md-4">
                <button class="btn btn-outline-success w-100 fw-bold" data-bs-toggle="collapse" data-bs-target="#uploadBox">📤 手動上傳 JSON</button>
            </div>
        </div>
        <div class="collapse mt-3" id="uploadBox">
            <div class="card card-body bg-light border-0">
                <div class="d-flex gap-2 justify-content-center">
                    <input type="file" @change="handleFileSelect" class="form-control w-75" accept=".json">
                    <button @click="uploadToServer" class="btn btn-success fw-bold" :disabled="!selectedFile || isUploading">
                        <span v-if="isUploading" class="spinner-border spinner-border-sm me-1"></span>
                        {{ isUploading ? '上傳中...' : '確認上傳' }}
                    </button>
                </div>
            </div>
        </div>
        <hr class="my-4 text-muted">
        <div class="row align-items-center g-3 text-center">
            <div class="col-md-3 text-md-end"><span class="fw-bold text-secondary">🔗 外部系統聯動：</span></div>
            <div class="col-md-4">
                <button class="btn btn-dark w-100 fw-bold shadow-sm" @click="triggerTwstockSync" :disabled="isSyncingTwstock">
                    <span v-if="isSyncingTwstock" class="spinner-border spinner-border-sm me-1"></span>
                    {{ isSyncingTwstock ? '更新中...' : '🚀 獨立更新 Twstock168' }}
                </button>
            </div>
            <div class="col-md-5">
                <a href="https://www.macromicro.me/collections/46/tw-stock-relative/110457/tw-tmf-long-to-short-ratio-of-individual-player" target="_blank" class="btn btn-danger w-100 fw-bold shadow-sm">🔥 微台散戶多空比 (M平方)</a>
            </div>
        </div>
      </div>
    </div>

    <div v-if="dashboardData">
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
                            <thead class="table-light"><tr><th>貨幣</th><th>現價</th><th>距高點</th></tr></thead>
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
        
        <div class="row mt-2">
            <div class="col-12"><h4 class="mb-3 border-start border-5 border-primary ps-3 fw-bold">📑 整體經濟指標細項</h4></div>
            
            <div class="col-12 mb-3">
                <div class="card section-bar-tw shadow-sm">
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
                <div class="card section-bar-tw shadow-sm h-100">
                    <div class="card-header bg-light">💰 台灣資金與股市</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">台股總市值</div><div class="metric-value text-success">{{ dashboardData.content.raw_indicators.MV_Num || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">市值貨幣比</div><div class="metric-value">{{ dashboardData.content.raw_indicators.MV_Ratio || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">M1B YoY</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_YoY || "--" }}%</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 數值 (億)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_Num || "--" }}</div></div></div>
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

            <div class="col-md-6 mb-3">
                <div class="card section-bar-cycle shadow-sm h-100">
                    <div class="card-header bg-light">🏭 景氣循環與製造業</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">中國 PMI</div><div class="metric-value">{{ dashboardData.content.raw_indicators.China_PMI || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">美國失業率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Unemployment || "--" }}%</div></div></div>
                            <div class="col-12"><div class="metric-item"><div class="metric-label">美國領先指標 (LEI)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Leading_Index || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card section-bar-sentiment shadow-sm h-100">
                    <div class="card-header bg-light">🛍️ 消費信心與訂單</div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6"><div class="metric-item"><div class="metric-label">密大消費者信心</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Michigan_Index || "--" }}</div></div></div>
                            <div class="col-6"><div class="metric-item"><div class="metric-label">耐久財新訂單(YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_New || "--" }}</div></div></div>
                            <div class="col-12"><div class="metric-item"><div class="metric-label">扣除國防耐久財(YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_Old || "--" }}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <div class="card shadow-sm">
                    <div class="card-header bg-light text-dark fw-bold d-flex justify-content-between" data-bs-toggle="collapse" href="#mark17Details">
                        <span>📋 Mark 17 詳細計分表</span><small>▼ 點擊展開/收合</small>
                    </div>
                    <div class="collapse show" id="mark17Details">
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0 align-middle">
                                <thead class="table-light"><tr><th>監測項目</th><th class="text-center">數值/狀態</th><th class="text-center">風險得分</th></tr></thead>
                                <tbody>
                                    <tr v-for="item in dashboardData.content.mark17" :key="item.item">
                                        <td>{{ item.item }}</td>
                                        <td :class="['text-center fw-bold', 'status-' + item.status]">{{ item.value }}</td>
                                        <td class="text-center">
                                            <span v-if="item.score !== 0 && item.score !== '-'" class="badge bg-danger rounded-pill">{{ typeof item.score === 'number' && item.score > 0 ? '+' + item.score : item.score }}</span>
                                            <span v-else class="text-muted">-</span>
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
    <div v-else class="text-center mt-5">
        <div class="spinner-border text-primary" role="status" v-if="isLoading"></div>
        <p class="mt-2 text-muted fw-bold" v-if="isLoading">載入最新戰情數據中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const rawResponseData = ref(null);
const isLoading = ref(true);
const dashboardData = computed(() => rawResponseData.value);
const dataSourceDisplay = computed(() => {
    if (!dashboardData.value) return '無數據';
    return `${dashboardData.value.source_type || '未知'} (時間: ${dashboardData.value.content.update_time || '--'})`;
});

onMounted(async () => {
    try {
        const { data: response } = await useFetch('/api/latest');
        if (response.value && response.value.data) rawResponseData.value = response.value.data;
    } finally { isLoading.value = false; }
});

// =====================================
// 🔥 HF 帳號選項與同步邏輯 (新增)
// =====================================
const hfAccounts = [
    { label: '自動隨機 (備援)', value: 'auto' },
    { label: '帳號1 (pyfbsdk59)', value: 'https://pyfbsdk59-macrowave-scrape-api.hf.space' },
    { label: '帳號2 (lawxstudents)', value: 'https://lawxstudents168-macrowave-scrape-api.hf.space' },
    { label: '帳號3 (igveri59)', value: 'https://igveri59-macrowave-scrape-api.hf.space' }
];

const selectedHfAccount = ref('auto');
const syncStatusText = ref('🔄 啟動雲端爬蟲 (API)');
const isSyncing = ref(false);

const triggerSync = async () => {
    if (!confirm('確定啟動雲端爬蟲？')) return;
    isSyncing.value = true;

    // 決定要測試的網址陣列
    let urlsToTry = [];
    if (selectedHfAccount.value === 'auto') {
        // 如果是自動，提取出所有真實網址並打亂順序
        const allUrls = hfAccounts.filter(a => a.value !== 'auto').map(a => a.value);
        urlsToTry = [...allUrls].sort(() => 0.5 - Math.random());
    } else {
        // 如果有指定帳號，就只打指定的那個
        urlsToTry = [selectedHfAccount.value];
    }

    let success = false;
    for (let url of urlsToTry) {
        // 抓出正在嘗試的帳號名稱 (例如: pyfbsdk59)
        const accName = hfAccounts.find(a => a.value === url)?.label.split(' ')[1] || '伺服器';
        syncStatusText.value = `嘗試中: ${accName}...`;
        
        try {
            await $fetch(`${url}/api/trigger-sync`, { method: 'POST', timeout: 15000 });
            alert(`✅ 指令已成功發送至 ${accName}！約 3 分鐘後將自動更新頁面。`);
            setTimeout(() => window.location.reload(), 180000);
            success = true;
            break;
        } catch (e) {
            console.warn(`[${accName}] 無回應或逾時`);
        }
    }

    if (!success) {
        alert('❌ 所選的伺服器皆無回應，可能是 Hugging Face 正在休眠，請稍後再試。');
    }

    isSyncing.value = false;
    syncStatusText.value = '🔄 啟動雲端爬蟲 (API)';
};

// =====================================
// 其他功能
// =====================================
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
</script>

<style scoped>
.advice-Safe { background-color: #d1e7dd; color: #0f5132; }
.advice-Caution { background-color: #fff3cd; color: #664d03; }
.advice-Flee { background-color: #f8d7da; color: #842029; }
.metric-item { padding: 12px; border-radius: 8px; background-color: #f8f9fa; border: 1px solid #e9ecef; height: 100%; }
.metric-label { font-size: 0.85rem; color: #6c757d; margin-bottom: 4px; text-transform: uppercase; }
.metric-value { font-size: 1.1rem; font-weight: 700; color: #212529; }
.section-bar-tw { border-left: 5px solid #0d6efd; }
.section-bar-us { border-left: 5px solid #dc3545; }
.section-bar-cycle { border-left: 5px solid #198754; }
.section-bar-sentiment { border-left: 5px solid #ffc107; }
</style>
