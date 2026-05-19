<template>
  <div class="container pb-5 mt-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-light">
      <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
            <h5 class="fw-bold text-primary mb-2">🔥 微台指散戶多空比 ╳ 價格 戰情室</h5>
            <p class="text-muted small mb-0">
              支援雲端自動同步與本機手動上傳，打造最彈性的量化看盤環境。
            </p>
        </div>
        <div v-if="hasCachedData" class="badge bg-success p-2 fs-6">
            🟢 已載入本機記憶資料
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0 mb-4 border-primary">
      <div class="card-body bg-white">
        <div class="mb-4 pb-3 border-bottom border-light">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
             <div>
                <h6 class="fw-bold mb-1">☁️ 雲端自動同步 (推薦)</h6>
                <p class="text-muted small mb-0">透過 Hugging Face API 於背景自動抓取最新資料並更新至資料庫。</p>
             </div>
             <button class="btn btn-primary fw-bold" @click="triggerHuggingFaceSync" :disabled="isSyncing">
                <span v-if="isSyncing" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isSyncing ? '同步指令已發送...' : '🔄 一鍵同步最新數據' }}
              </button>
          </div>
        </div>

        <div class="row align-items-end g-3">
          <div class="col-12">
            <h6 class="fw-bold mb-1">📁 本機手動上傳 (備用)</h6>
            <p class="text-muted small mb-0">若雲端同步失敗，可上傳 CSV 檔案，資料將安全儲存於瀏覽器中。</p>
          </div>
          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted">📊 選擇商品</label>
            <select class="form-select" v-model="selectedSymbol">
              <option value="TMF">微台指 (TMF)</option>
            </select>
          </div>
          <div class="col-md-5">
            <label class="form-label fw-bold small text-muted">選擇歷史數據 (CSV)</label>
            <input class="form-control" type="file" accept=".csv" @change="onFileChange" ref="fileInput">
          </div>
          <div class="col-md-2">
            <button class="btn btn-secondary w-100 fw-bold" @click="processCSV" :disabled="!selectedFile">
              🚀 載入新檔
            </button>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-danger w-100 fw-bold" @click="clearCache" :disabled="!hasCachedData">
              🗑️ 清除記憶
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="alert alert-danger fw-bold text-center">
      ❌ {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="alert alert-success fw-bold text-center">
      ✅ {{ successMsg }}
    </div>

    <div v-if="historyList.length > 0">
        
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                <span>📈 價格走勢與散戶籌碼對照圖</span>
                <span class="badge bg-primary">滑鼠滾輪可縮放區間</span>
            </div>
            <div class="card-body p-2">
                <div id="chart-tmf" style="width: 100%; height: 600px;"></div>
            </div>
        </div>

        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-secondary text-white fw-bold">
                <span>📜 解析數據明細 ({{ historyList.length }} 筆)</span>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                    <table class="table table-hover table-striped mb-0 text-center align-middle" style="font-size: 0.9rem;">
                        <thead class="table-light sticky-top">
                            <tr>
                                <th>交易日期</th>
                                <th>收盤價</th>
                                <th>散戶多空比</th>
                                <th>散戶淨未平倉 (OI)</th>
                                <th>全市場總 OI</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in historyList" :key="item.date">
                                <td class="text-muted fw-bold">{{ item.date }}</td>
                                <td class="text-dark fw-bold">{{ item.close.toLocaleString() }}</td>
                                <td :class="['fw-bold', item.retailRatio < 0 ? 'text-success' : 'text-danger']">
                                    {{ (item.retailRatio * 100).toFixed(2) }}%
                                </td>
                                <td :class="item.retailNetOI > 0 ? 'text-danger' : 'text-success'">
                                    {{ item.retailNetOI.toLocaleString() }} 口
                                </td>
                                <td class="text-muted font-monospace">{{ item.totalOI.toLocaleString() }} 口</td>
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
import { ref, onMounted, nextTick } from 'vue'

const errorMsg = ref('');
const successMsg = ref('');
const historyList = ref([]);
const selectedSymbol = ref('TMF');
const selectedFile = ref(null);
const fileInput = ref(null);
const hasCachedData = ref(false);
const isSyncing = ref(false);

let chartInstance = null;
const CACHE_KEY = 'macrowave_tmf_cache_v1';

// 🚀 網頁一打開，立刻去 localStorage 尋找記憶
onMounted(async () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        try {
            const parsedData = JSON.parse(cachedData);
            if (parsedData && parsedData.length > 0) {
                historyList.value = parsedData;
                hasCachedData.value = true;
                
                // 圖表需要由舊到新
                const chartData = [...parsedData].reverse();
                await nextTick();
                renderChart(chartData);
            }
        } catch (err) {
            console.error("記憶體資料損毀，自動清除", err);
            localStorage.removeItem(CACHE_KEY);
        }
    }
});

// 🔥 新增：呼叫 Hugging Face API 進行雲端同步
const triggerHuggingFaceSync = async () => {
  try {
    isSyncing.value = true;
    errorMsg.value = '';
    successMsg.value = '';
    
    // ⚠️ 請替換為您真實的 Hugging Face Space 網址與 Token
    const hfUrl = 'https://您的帳號-您的專案名.hf.space/api/trigger-sync?token=my_secret_token_123';
    
    const response = await fetch(hfUrl, { method: 'POST' });
    
    if (!response.ok) {
        throw new Error(`HTTP 錯誤狀態碼: ${response.status}`);
    }

    const result = await response.json();
    console.log("Hugging Face 回應:", result);
    
    successMsg.value = '✅ 已成功發送同步指令！系統正在雲端抓取資料，請於 15~30 秒後重新整理網頁（注意：若您有使用本機上傳資料，請先點擊「清除記憶」才能看到雲端最新數據）。';
    
  } catch (error) {
    console.error('觸發失敗:', error);
    errorMsg.value = '觸發同步失敗，請檢查網路連線或 API 網址設定。';
  } finally {
    isSyncing.value = false;
  }
}

// 當使用者選取檔案時
const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
        selectedFile.value = file;
        errorMsg.value = '';
        successMsg.value = '';
    } else {
        selectedFile.value = null;
        errorMsg.value = '請選擇有效的 CSV 檔案！';
    }
};

// 點擊送出按鈕，開始解析 CSV 並寫入記憶體
const processCSV = () => {
    if (!selectedFile.value) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const parsedData = parseCSVText(text);
            
            if (parsedData.length === 0) {
                throw new Error("CSV 解析為空，請檢查檔案內容。");
            }

            // 依日期由新到舊排序
            parsedData.sort((a, b) => new Date(b.date) - new Date(a.date));
            historyList.value = parsedData;
            hasCachedData.value = true;

            // 寫入瀏覽器永久記憶體
            localStorage.setItem(CACHE_KEY, JSON.stringify(parsedData));

            // 繪圖
            const chartData = [...parsedData].reverse();
            await nextTick();
            renderChart(chartData);
            
            errorMsg.value = '';
            successMsg.value = '✅ CSV 解析成功，資料已儲存於本機記憶體。';
        } catch (err) {
            errorMsg.value = "解析失敗：" + err.message;
            successMsg.value = '';
        }
    };
    reader.readAsText(selectedFile.value);
};

// 🗑️ 清除記憶體功能
const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    historyList.value = [];
    hasCachedData.value = false;
    errorMsg.value = '';
    successMsg.value = '🗑️ 本機記憶資料已清除。此網頁現在將預設顯示雲端 (Vercel) 資料庫內容。';
    
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
    
    if (fileInput.value) {
        fileInput.value.value = '';
    }
    selectedFile.value = null;
};

// CSV 解析邏輯
const parseCSVText = (csvText) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("CSV 缺乏標題或數據。");

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 5) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });

        data.push({
            date: row['日期'],
            totalOI: parseInt(row['Total_OI'] || 0),
            open: parseFloat(row['開盤價'] || 0),
            high: parseFloat(row['最高價'] || 0),
            low: parseFloat(row['最低價'] || 0),
            close: parseFloat(row['收盤價'] || 0),
            instNetOI: parseInt(row['Inst_Net_OI'] || 0),
            retailNetOI: parseInt(row['Retail_Net_OI'] || 0),
            retailRatio: parseFloat(row['Retail_Ratio'] || 0)
        });
    }
    return data;
};

// ECharts 繪圖邏輯
const renderChart = (data) => {
    const dom = document.getElementById('chart-tmf');
    if (!dom || !window.echarts) {
        errorMsg.value = "找不到 ECharts 圖表元件，請確認您的 Nuxt 專案有正確引入 ECharts。";
        return;
    }

    if (chartInstance) chartInstance.dispose();
    chartInstance = window.echarts.init(dom);

    const categoryData = data.map(item => item.date);
    const candleValues = data.map(item => [item.open, item.close, item.low, item.high]);
    
    const ratioData = data.map(item => {
        const val = item.retailRatio * 100;
        return {
            value: val.toFixed(2),
            itemStyle: { color: val < 0 ? '#198754' : '#dc3545' } 
        };
    });

    chartInstance.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        legend: { data: ['價格 K 線', '散戶多空比'], top: 5 },
        grid: [
            { left: '8%', right: '5%', top: '8%', height: '50%' },
            { left: '8%', right: '5%', top: '65%', height: '25%' }
        ],
        xAxis: [
            { type: 'category', data: categoryData, gridIndex: 0, axisLabel: { show: false } },
            { type: 'category', data: categoryData, gridIndex: 1 }
        ],
        yAxis: [
            { scale: true, gridIndex: 0 },
            { type: 'value', gridIndex: 1, name: '多空比(%)', splitLine: { show: true, lineStyle: { type: 'dashed' } } }
        ],
        dataZoom: [
            { type: 'inside', xAxisIndex: [0, 1], start: 70, end: 100 }, 
            { show: true, xAxisIndex: [0, 1], top: '92%', height: 15 }
        ], 
        series: [
            { 
                name: '價格 K 線', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0, data: candleValues, 
                itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' } 
            },
            {
                name: '散戶多空比', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: ratioData,
                markLine: {
                    symbol: 'none',
                    label: { position: 'insideEndTop', formatter: '{b}' },
                    data: [
                        { yAxis: -10, name: '買進', lineStyle: { color: '#dc3545', type: 'solid', width: 2 } },
                        { yAxis: 15, name: '賣出', lineStyle: { color: '#198754', type: 'solid', width: 2 } }
                    ]
                }
            }
        ]
    });
};
</script>
