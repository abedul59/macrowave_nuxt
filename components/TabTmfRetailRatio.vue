<template>
  <div class="container pb-5 mt-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-light">
      <div class="card-body">
        <h5 class="fw-bold text-primary mb-2">🔥 微台指散戶多空比 ╳ 00631L 策略觀測</h5>
        <p class="text-muted small mb-0">
          利用「微台指 (TMF) 散戶多空比」作為反市場指標。下方圖表已將 00631L 走勢與散戶籌碼對齊，幫助您肉眼驗證「散戶做多即高點、散戶做空即低點」的逆向現象。
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary"></div><p class="mt-2 fw-bold text-primary">籌碼大數據調閱與對齊圖表構建中...</p>
    </div>

    <div v-if="errorMsg" class="alert alert-danger fw-bold text-center">
      ❌ 錯誤：{{ errorMsg }}
    </div>

    <div v-if="!isLoading && tmfLatest && historyList && etfData">
        
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="card shadow-sm h-100 border-0">
                    <div class="card-header bg-dark text-white fw-bold text-center">📊 最新籌碼結算 ({{ tmfLatest.date }})</div>
                    <div class="card-body text-center d-flex flex-column justify-content-center">
                        <div class="mb-3">
                            <span class="text-muted fw-bold">微台指散戶多空比</span><br>
                            <span :class="['display-4 fw-bold', tmfLatest.retailRatio < 0 ? 'text-success' : 'text-danger']">
                                {{ (tmfLatest.retailRatio * 100).toFixed(2) }}%
                            </span>
                        </div>
                        <div class="d-flex justify-content-around text-muted small mt-2 border-top pt-3">
                            <div>全市場 OI<br><strong class="text-dark">{{ tmfLatest.totalOI.toLocaleString() }}</strong></div>
                            <div>散戶淨 OI<br><strong :class="tmfLatest.retailNetOI > 0 ? 'text-danger' : 'text-success'">{{ tmfLatest.retailNetOI.toLocaleString() }}</strong></div>
                            <div>00631L 現價<br><strong class="text-dark">{{ latestEtfPrice.toFixed(2) }}</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card shadow-sm h-100 border-0 border-primary">
                    <div class="card-header bg-primary text-white fw-bold text-center">🤖 演算法策略判定</div>
                    <div class="card-body d-flex flex-column">
                        <div class="row mb-3 text-center">
                            <div class="col-6">
                                <label class="form-label text-muted small fw-bold mb-1">買進閾值 (Buy)</label>
                                <div class="input-group input-group-sm justify-content-center">
                                    <input type="number" step="1" v-model="buyThreshold" class="form-control text-center fw-bold text-success">
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label text-muted small fw-bold mb-1">賣出閾值 (Sell)</label>
                                <div class="input-group input-group-sm justify-content-center">
                                    <input type="number" step="1" v-model="sellThreshold" class="form-control text-center fw-bold text-danger">
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-auto text-center p-3 rounded" :class="signalBgClass">
                            <h6 class="fw-bold mb-1 text-uppercase" :class="signalTextClass">當前操作建議</h6>
                            <h3 class="fw-bold mb-0" :class="signalTextClass">{{ currentSignal }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                <span>📈 00631L 走勢與散戶籌碼對照圖</span>
                <span class="badge bg-primary">滑鼠滾輪可縮放區間</span>
            </div>
            <div class="card-body p-2">
                <div id="chart-etf" style="width: 100%; height: 600px;"></div>
            </div>
        </div>

        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-secondary text-white fw-bold">
                <span>📜 微台指散戶多空比歷史明細</span>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover table-striped mb-0 text-center align-middle" style="font-size: 0.9rem;">
                        <thead class="table-light">
                            <tr>
                                <th>交易日期</th>
                                <th>散戶多空比</th>
                                <th>散戶未平倉淨額 (OI)</th>
                                <th>全市場總未平倉 (OI)</th>
                                <th>策略對照</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in historyList" :key="item.date">
                                <td class="text-muted fw-bold">{{ item.date }}</td>
                                <td :class="['fw-bold', item.retailRatio < 0 ? 'text-success' : 'text-danger']">
                                    {{ (item.retailRatio * 100).toFixed(2) }}%
                                </td>
                                <td :class="item.retailNetOI > 0 ? 'text-danger' : 'text-success'">
                                    {{ item.retailNetOI.toLocaleString() }} 口
                                </td>
                                <td class="text-dark font-monospace">{{ item.totalOI.toLocaleString() }} 口</td>
                                <td>
                                    <span v-if="(item.retailRatio * 100) <= buyThreshold" class="badge bg-danger">買進訊號</span>
                                    <span v-else-if="(item.retailRatio * 100) >= sellThreshold" class="badge bg-success">賣出訊號</span>
                                    <span v-else class="text-muted small">--</span>
                                </td>
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
import { ref, onMounted, computed, nextTick, watch } from 'vue'

const isLoading = ref(true);
const errorMsg = ref('');

const tmfLatest = ref(null);
const historyList = ref([]);
const etfData = ref(null);

const buyThreshold = ref(-10);
const sellThreshold = ref(15);

const latestEtfPrice = computed(() => {
    if (!etfData.value || etfData.value.length === 0) return 0;
    return etfData.value[etfData.value.length - 1].close;
});

const currentSignal = computed(() => {
    if (!tmfLatest.value) return '無資料';
    const ratioPercent = tmfLatest.value.retailRatio * 100;
    if (ratioPercent <= buyThreshold.value) return '🔥 強勢作多 (BUY)';
    if (ratioPercent >= sellThreshold.value) return '❄️ 空手觀望 / 賣出 (SELL)';
    return '⚖️ 持有中 / 等待訊號 (HOLD)';
});

const signalBgClass = computed(() => {
    if (!tmfLatest.value) return 'bg-light';
    const ratioPercent = tmfLatest.value.retailRatio * 100;
    if (ratioPercent <= buyThreshold.value) return 'bg-danger bg-opacity-10 border border-danger';
    if (ratioPercent >= sellThreshold.value) return 'bg-success bg-opacity-10 border border-success';
    return 'bg-warning bg-opacity-10 border border-warning';
});

const signalTextClass = computed(() => {
    if (!tmfLatest.value) return 'text-muted';
    const ratioPercent = tmfLatest.value.retailRatio * 100;
    if (ratioPercent <= buyThreshold.value) return 'text-danger';
    if (ratioPercent >= sellThreshold.value) return 'text-success';
    return 'text-dark';
});

const calcMA = (n, q) => q.map((_, i, a) => i < n-1 ? null : a.slice(i-n+1, i+1).reduce((s, x)=>s+x.close,0)/n);

// 🔥 當使用者調整 Buy/Sell 閾值時，即時重繪圖表更新標示線
watch([buyThreshold, sellThreshold], () => {
    renderChart();
});

onMounted(async () => {
    try {
        const [resTmf, resEtf] = await Promise.all([
            $fetch('/api/tmf'),
            $fetch('/api/etf')
        ]);

        if (!resTmf.success) throw new Error(resTmf.message || '期交所籌碼獲取失敗');
        if (!resEtf.success) throw new Error(resEtf.message || '00631L 報價獲取失敗');

        tmfLatest.value = resTmf.latest;
        historyList.value = resTmf.history;
        etfData.value = resEtf.data;

        await nextTick();
        let checkCount = 0;
        const checkEcharts = setInterval(() => {
            if (window.echarts) {
                clearInterval(checkEcharts);
                renderChart();
            } else if (checkCount > 50) {
                clearInterval(checkEcharts);
                errorMsg.value = '圖表元件載入逾時，請重新整理頁面。';
            }
            checkCount++;
        }, 200);

    } catch (err) {
        errorMsg.value = err.message || '系統發生錯誤';
    } finally {
        isLoading.value = false;
    }
});

let chartInstance = null;

const renderChart = () => {
    const dom = document.getElementById('chart-etf');
    if (!dom || !window.echarts || !etfData.value) return;

    if (chartInstance) {
        chartInstance.dispose();
    }
    chartInstance = window.echarts.init(dom);

    const data = etfData.value;
    
    // 建立統一的時間軸 (以 ETF 報價時間為主)
    const categoryData = data.map(item => item.date);
    
    // ETF K線與量能數據
    const candleValues = data.map(item => [item.open, item.close, item.low, item.high]);
    const volumeData = data.map(item => ({
        value: item.volume || 0,
        itemStyle: { color: item.close >= item.open ? '#dc3545' : '#198754' }
    }));
    
    // 建立多空比快速對照表
    const ratioMap = {};
    historyList.value.forEach(item => {
        // 將期交所格式 2026/05/18 轉為 YYYY-MM-DD，若格式已相同則免
        const formattedDate = item.date.replace(/\//g, '-'); 
        ratioMap[formattedDate] = item.retailRatio * 100; // 轉為 %
        ratioMap[item.date] = item.retailRatio * 100; 
    });

    // 將多空比對應到 ETF 的時間軸
    const ratioData = categoryData.map(date => {
        const val = ratioMap[date];
        if (val === undefined) return null; // 該日無籌碼數據
        return {
            value: val.toFixed(2),
            itemStyle: { color: val < 0 ? '#198754' : '#dc3545' } // 台灣習慣：做空(綠)、做多(紅)
        };
    });

    const ma20 = calcMA(20, data);
    const ma60 = calcMA(60, data);

    chartInstance.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        legend: { data: ['00631L K線', '20MA', '60MA', '成交量', '散戶多空比'], top: 5 },
        grid: [
            { left: '8%', right: '5%', top: '8%', height: '45%' },     // K線區塊
            { left: '8%', right: '5%', top: '56%', height: '15%' },    // 量能區塊
            { left: '8%', right: '5%', top: '75%', height: '20%' }     // 籌碼對齊區塊
        ],
        xAxis: [
            { type: 'category', data: categoryData, gridIndex: 0, axisLabel: { show: false } },
            { type: 'category', data: categoryData, gridIndex: 1, axisLabel: { show: false } },
            { type: 'category', data: categoryData, gridIndex: 2 }
        ],
        yAxis: [
            { scale: true, gridIndex: 0 },
            { scale: true, gridIndex: 1, axisLabel: { show: false } },
            { type: 'value', gridIndex: 2, name: '多空比(%)', splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.5 } } }
        ],
        // 預設放大至最後 50 根 K 棒
        dataZoom: [
            { type: 'inside', xAxisIndex: [0, 1, 2], start: 70, end: 100 }, 
            { show: true, xAxisIndex: [0, 1, 2], top: '96%', height: 15 }
        ], 
        series: [
            { 
                name: '00631L K線', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0, data: candleValues, 
                itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' } 
            },
            { name: '20MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: ma20, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
            { name: '60MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: ma60, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
            { name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: volumeData },
            // 🔥 新增的多空比序列
            {
                name: '散戶多空比', type: 'bar', xAxisIndex: 2, yAxisIndex: 2, data: ratioData,
                markLine: {
                    symbol: 'none',
                    label: { position: 'insideEndTop', formatter: '{b}: {c}%' },
                    data: [
                        { yAxis: buyThreshold.value, name: '買進', lineStyle: { color: '#dc3545', type: 'solid', width: 2 } },
                        { yAxis: sellThreshold.value, name: '賣出', lineStyle: { color: '#198754', type: 'solid', width: 2 } }
                    ]
                }
            }
        ]
    });
};
</script>
