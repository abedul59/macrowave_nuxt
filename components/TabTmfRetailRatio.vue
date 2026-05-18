<template>
  <div class="container pb-5 mt-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-light">
      <div class="card-body">
        <h5 class="fw-bold text-primary mb-2">🔥 微台指散戶多空比 ╳ 00631L 策略觀測</h5>
        <p class="text-muted small mb-0">
          利用「微台指 (TMF) 散戶多空比」作為反市場指標。當散戶極度悲觀（做空）時，視為 00631L 買進訊號；當散戶極度樂觀（做多）時，視為賣出訊號。系統每日自動自期交所抓取最新未平倉數據。
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary"></div><p class="mt-2 fw-bold text-primary">抓取期交所籌碼與 00631L 報價中...</p>
    </div>

    <div v-if="errorMsg" class="alert alert-danger fw-bold text-center">
      ❌ 錯誤：{{ errorMsg }}
    </div>

    <div v-if="!isLoading && tmfData && etfData">
        
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="card shadow-sm h-100 border-0">
                    <div class="card-header bg-dark text-white fw-bold text-center">📊 今日籌碼結算 ({{ tmfData.date }})</div>
                    <div class="card-body text-center d-flex flex-column justify-content-center">
                        <div class="mb-3">
                            <span class="text-muted fw-bold">微台指散戶多空比</span><br>
                            <span :class="['display-4 fw-bold', tmfData.retailRatio < 0 ? 'text-success' : 'text-danger']">
                                {{ (tmfData.retailRatio * 100).toFixed(2) }}%
                            </span>
                        </div>
                        <div class="d-flex justify-content-around text-muted small mt-2 border-top pt-3">
                            <div>全市場 OI<br><strong class="text-dark">{{ tmfData.totalOI.toLocaleString() }}</strong> 口</div>
                            <div>散戶淨 OI<br><strong :class="tmfData.retailNetOI > 0 ? 'text-danger' : 'text-success'">{{ tmfData.retailNetOI.toLocaleString() }}</strong> 口</div>
                            <div>00631L 現價<br><strong class="text-dark">{{ latestEtfPrice.toFixed(2) }}</strong> 元</div>
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
                                <label class="form-label text-muted small fw-bold mb-1">賣出/觀望閾值 (Sell)</label>
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
                <span>📈 00631L (元大台灣50正2) 近一年走勢圖</span>
            </div>
            <div class="card-body p-2">
                <div id="chart-etf" style="width: 100%; height: 450px;"></div>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'

const isLoading = ref(true);
const errorMsg = ref('');

const tmfData = ref(null);
const etfData = ref(null);

// 預設策略參數 (與 Python 對齊：Buy <= -10%, Sell >= 15%)
const buyThreshold = ref(-10);
const sellThreshold = ref(15);

const latestEtfPrice = computed(() => {
    if (!etfData.value || etfData.value.length === 0) return 0;
    return etfData.value[etfData.value.length - 1].close;
});

// 計算當前訊號
const currentSignal = computed(() => {
    if (!tmfData.value) return '無資料';
    const ratioPercent = tmfData.value.retailRatio * 100;
    if (ratioPercent <= buyThreshold.value) return '🔥 強勢作多 (BUY)';
    if (ratioPercent >= sellThreshold.value) return '❄️ 空手觀望 / 賣出 (SELL)';
    return '⚖️ 持有中 / 等待訊號 (HOLD)';
});

const signalBgClass = computed(() => {
    if (!tmfData.value) return 'bg-light';
    const ratioPercent = tmfData.value.retailRatio * 100;
    if (ratioPercent <= buyThreshold.value) return 'bg-danger bg-opacity-10 border border-danger';
    if (ratioPercent >= sellThreshold.value) return 'bg-success bg-opacity-10 border border-success';
    return 'bg-warning bg-opacity-10 border border-warning';
});

const signalTextClass = computed(() => {
    if (!tmfData.value) return 'text-muted';
    const ratioPercent = tmfData.value.retailRatio * 100;
    if (ratioPercent <= buyThreshold.value) return 'text-danger';
    if (ratioPercent >= sellThreshold.value) return 'text-success'; // 股市中綠色通常代表賣出/跌
    return 'text-dark';
});

// 計算均線
const calcMA = (n, q) => q.map((_, i, a) => i < n-1 ? null : a.slice(i-n+1, i+1).reduce((s, x)=>s+x.close,0)/n);

onMounted(async () => {
    try {
        // 同時抓取兩支 API
        const [resTmf, resEtf] = await Promise.all([
            $fetch('/api/tmf'),
            $fetch('/api/etf')
        ]);

        if (!resTmf.success) throw new Error(resTmf.message || '期交所籌碼獲取失敗');
        if (!resEtf.success) throw new Error(resEtf.message || '00631L 報價獲取失敗');

        tmfData.value = resTmf.data;
        etfData.value = resEtf.data;

        await nextTick();
        renderChart();

    } catch (err) {
        errorMsg.value = err.message || '系統發生錯誤';
    } finally {
        isLoading.value = false;
    }
});

const renderChart = () => {
    const dom = document.getElementById('chart-etf');
    if (!dom || !window.echarts || !etfData.value) return;

    const data = etfData.value;
    const categoryData = data.map(item => item.date);
    const candleValues = data.map(item => [item.open, item.close, item.low, item.high]);
    const volumeData = data.map(item => ({
        value: item.volume || 0,
        itemStyle: { color: item.close >= item.open ? '#dc3545' : '#198754' }
    }));
    
    const ma20 = calcMA(20, data);
    const ma60 = calcMA(60, data);

    const inst = window.echarts.init(dom);

    inst.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        legend: { data: ['00631L K線', '20MA', '60MA', '成交量'], top: 5 },
        grid: [
            { left: '8%', right: '5%', top: '10%', height: '55%' },
            { left: '8%', right: '5%', top: '70%', height: '20%' }
        ],
        xAxis: [
            { type: 'category', data: categoryData, gridIndex: 0, axisLabel: { show: false } },
            { type: 'category', data: categoryData, gridIndex: 1 }
        ],
        yAxis: [
            { scale: true, gridIndex: 0 },
            { scale: true, gridIndex: 1, axisLabel: { show: false } }
        ],
        dataZoom: [{ type: 'inside', xAxisIndex: [0, 1], start: 50, end: 100 }, { show: true, xAxisIndex: [0, 1], top: '94%', height: 15 }], 
        series: [
            { 
                name: '00631L K線', type: 'candlestick', data: candleValues, 
                itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' } 
            },
            { name: '20MA', type: 'line', data: ma20, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
            { name: '60MA', type: 'line', data: ma60, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
            { name: '成交量', type: 'bar', data: volumeData, xAxisIndex: 1, yAxisIndex: 1 },
        ]
    });
};
</script>
