<template>
  <div class="container pb-5 mt-4">
    
    <div v-if="errorMsg" class="alert alert-danger text-center shadow-sm fw-bold my-4">
        ❌ 系統錯誤：{{ errorMsg }}
    </div>

    <div class="card shadow-sm border-0 mb-4 overflow-hidden">
      <div class="card-header bg-primary text-white py-3">
        <h5 class="fw-bold mb-0">📜 台股十年週期理論 (120個月長線模型)</h5>
      </div>
      <div class="card-body bg-light">
        <div class="row align-items-center">
          <div class="col-lg-5">
            <div class="small p-3 bg-white rounded border" style="line-height: 1.6; color: #444;">
              <p class="mb-2"><strong>1. 結構與浪數：</strong> 每週期約 120 個月，內含大多頭 5 浪及空頭修正波。</p>
              <p class="mb-2"><strong>2. 月 KD 定波：</strong> 月 KD 的交叉是判斷長波段起點的最佳夥伴。極值約為起點 <strong>25%</strong>。</p>
              <p class="mb-0"><strong>3. 週 KD 節奏：</strong> 每年交叉 6~8 次，每次存續約 <strong>2 個月 (8週)</strong>。極值約為 <strong>7.5%~10%</strong>。</p>
            </div>
          </div>
          <div class="col-lg-7 mt-3 mt-lg-0">
            <div id="theoryDiagram" style="width: 100%; height: 180px;"></div>
            <div class="text-center small text-muted">台股 120 個月循環示意圖</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-4" v-if="analysis">
      <div class="col-md-6 mb-3">
          <div class="card h-100 border-danger shadow-sm">
              <div class="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center">
                  <span>🚀 長線動態極值 (25%)</span><span class="badge bg-white text-danger">月 KD 次數: {{ analysis.monthly.crossCount }}</span>
              </div>
              <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2"><span class="text-muted">最新月 KD</span><span class="fw-bold fs-5">K: <span :class="analysis.monthly.k > 80 ? 'text-danger' : ''">{{ analysis.monthly.k.toFixed(2) }}</span> / D: {{ analysis.monthly.d.toFixed(2) }}</span></div>
                  <div class="d-flex justify-content-between mb-3"><span class="text-muted">季線 (60MA) 狀態</span><span class="fw-bold fs-5">{{ analysis.daily.ma60.toFixed(2) }} <span v-html="analysis.daily.ma60_trend"></span></span></div>

                  <div class="bg-light p-3 rounded border border-danger mb-3">
                      <div class="fw-bold text-danger mb-2 border-bottom border-danger pb-1">🎯 25% 動態極值追蹤</div>
                      <div v-if="analysis.monthly.basePrice > 0">
                          <div class="d-flex justify-content-between small mb-1"><span>轉折日期</span><span>{{ analysis.monthly.baseDate }}</span></div>
                          <div class="d-flex justify-content-between small mb-1"><span>轉折類型</span><span :class="analysis.monthly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ analysis.monthly.crossType }}</span></div>
                          <div class="d-flex justify-content-between mb-1"><span>基準點位</span><span class="fw-bold">{{ analysis.monthly.basePrice.toFixed(0) }} 點</span></div>
                          <div class="d-flex justify-content-between mb-1"><span>動態極值目標</span><span class="fw-bold text-dark">{{ analysis.monthly.targetPrice.toFixed(0) }} 點</span></div>
                          <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                              <span class="small fw-bold">波段推進進度：</span><span class="badge bg-danger fs-6">{{ analysis.monthly.currentDiff.toFixed(0) }} 點 ({{ analysis.monthly.percentDiff.toFixed(1) }}%)</span>
                          </div>
                      </div>
                      <div v-else class="text-center text-muted py-3">歷史數據不足</div>
                  </div>

                  <div class="bg-white p-2 rounded border mb-3 small shadow-sm">
                      <div class="d-flex justify-content-between mb-1"><span class="text-muted">季線(60MA) 防守價</span><span class="fw-bold text-dark">{{ analysis.daily.deduction60.price.toFixed(0) }}</span></div>
                      <div class="d-flex justify-content-between"><span>防禦狀態</span>
                          <span v-if="analysis.daily.deduction60.isSafe" class="text-success fw-bold">安全 (+{{ analysis.daily.deduction60.diff.toFixed(0) }})</span>
                          <span v-else class="text-danger fw-bold">跌破 ({{ analysis.daily.deduction60.diff.toFixed(0) }})</span>
                      </div>
                  </div>
                  <hr class="mt-auto">
                  <div class="alert mb-0 py-2 fw-bold text-center" :class="analysis.monthly.alertClass">{{ analysis.monthly.alertText }}</div>
              </div>
          </div>
      </div>

      <div class="col-md-6 mb-3">
          <div class="card h-100 border-warning shadow-sm">
              <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                  <span>🚀 中線動態極值 (10%)</span><span :class="['badge', analysis.weekly.crossCount > 8 ? 'bg-danger' : 'bg-dark']">今年週 KD: {{ analysis.weekly.crossCount }} 次</span>
              </div>
              <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2"><span class="text-muted">最新週 KD</span><span class="fw-bold fs-5">K: <span :class="analysis.weekly.k > 80 ? 'text-danger' : ''">{{ analysis.weekly.k.toFixed(2) }}</span> / D: {{ analysis.weekly.d.toFixed(2) }}</span></div>
                  <div class="d-flex justify-content-between mb-3"><span class="text-muted">月線 (20MA) 狀態</span><span class="fw-bold fs-5">{{ analysis.daily.ma20.toFixed(2) }} <span v-html="analysis.daily.ma20_trend"></span></span></div>

                  <div class="bg-light p-3 rounded border border-warning mb-3">
                      <div class="fw-bold text-dark mb-2 border-bottom border-warning pb-1">🎯 10% 動態極值追蹤</div>
                      <div v-if="analysis.weekly.basePrice > 0">
                          <div class="d-flex justify-content-between small mb-1"><span>轉折日期</span><span>{{ analysis.weekly.baseDate }}</span></div>
                          <div class="d-flex justify-content-between small mb-1"><span>轉折類型</span><span :class="analysis.weekly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ analysis.weekly.crossType }}</span></div>
                          <div class="d-flex justify-content-between mb-1"><span>基準點位</span><span class="fw-bold">{{ analysis.weekly.basePrice.toFixed(0) }} 點</span></div>
                          <div class="d-flex justify-content-between mb-1"><span>極值區間</span><span class="fw-bold text-dark">{{ analysis.weekly.targetMin.toFixed(0) }} ~ {{ analysis.weekly.targetMax.toFixed(0) }} 點</span></div>
                          <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                              <span class="small fw-bold">波段推進進度：</span><span class="badge bg-warning text-dark fs-6">{{ analysis.weekly.currentDiff.toFixed(0) }} 點 ({{ analysis.weekly.percentDiff.toFixed(1) }}%)</span>
                          </div>
                      </div>
                      <div v-else class="text-center text-muted py-3">歷史數據不足</div>
                  </div>

                  <div class="bg-white p-2 rounded border mb-3 small shadow-sm">
                      <div class="d-flex justify-content-between mb-1"><span class="text-muted">月線(20MA) 防守價</span><span class="fw-bold text-dark">{{ analysis.daily.deduction20.price.toFixed(0) }}</span></div>
                      <div class="d-flex justify-content-between"><span>防禦狀態</span>
                          <span v-if="analysis.daily.deduction20.isSafe" class="text-success fw-bold">安全 (+{{ analysis.daily.deduction20.diff.toFixed(0) }})</span>
                          <span v-else class="text-danger fw-bold">跌破 ({{ analysis.daily.deduction20.diff.toFixed(0) }})</span>
                      </div>
                  </div>

                  <div v-if="analysis.weekly.crossCount > 8" class="alert alert-danger py-1 mb-2 text-center small fw-bold">⚠️ 注意：今年交叉頻率過高，波動劇烈</div>
                  <hr class="mt-auto">
                  <div class="alert mb-0 py-2 fw-bold text-center" :class="analysis.weekly.alertClass">{{ analysis.weekly.alertText }}</div>
              </div>
          </div>
      </div>
    </div>

    <div v-if="isLoading && !errorMsg" class="text-center my-5">
      <div class="spinner-border text-danger"></div><p class="mt-2 fw-bold">動態極值運算中...</p>
    </div>

    <div class="card shadow-sm mb-4" v-show="!isLoading && taiexData && !errorMsg">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <h5 class="fw-bold text-secondary mb-0">台股加權指數 - 動態極值對照</h5>
          <div class="btn-group mt-2 mt-md-0">
            <button v-for="p in ['daily', 'weekly', 'monthly']" :key="p" @click="currentPeriod = p; renderChart()" :class="['btn fw-bold', currentPeriod === p ? 'btn-danger' : 'btn-outline-danger']">{{ p === 'daily' ? '日 K' : p === 'weekly' ? '週 K' : '月 K' }}</button>
          </div>
        </div>
        <div id="taiexChartDyn" style="width: 100%; height: 75vh; min-height: 550px;"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isLoading = ref(true);
const errorMsg = ref('');
const taiexData = ref(null);
const analysis = ref(null);
const currentPeriod = ref('daily');
let chartInstance = null;

// 防呆：去除空值或 NaN 的髒數據
const sanitize = (q) => {
    if (!q || !Array.isArray(q)) return [];
    return q.filter(x => x.open != null && x.close != null && !isNaN(x.close));
};

const calcKD = (q) => {
    let k=50, d=50;
    return q.map((x, i, a) => {
        if(i<8) return {...x, k:50, d:50};
        const r = a.slice(i-8, i+1), h = Math.max(...r.map(v=>v.high)), l = Math.min(...r.map(v=>v.low));
        let rsv = h===l ? 0 : ((x.close-l)/(h-l))*100;
        k = (rsv+k*2)/3; d = (k+d*2)/3;
        return {...x, k, d};
    });
};

const calcMA = (n, q) => q.map((_, i, a) => i < n-1 ? null : a.slice(i-n+1, i+1).reduce((s, x)=>s+x.close,0)/n);

const findCross = (kd) => {
    if (!kd || kd.length < 2) return null;
    for(let i = kd.length-1; i>0; i--) {
        const p=kd[i-1], c=kd[i];
        if(p.k != null && p.d != null && c.k != null && c.d != null) {
            if(p.k<=p.d && c.k>c.d) return {...c, type:'golden', crossType:'黃金交叉'};
            if(p.k>=p.d && c.k<c.d) return {...c, type:'death', crossType:'死亡交叉'};
        }
    } return null;
};

const countCross = (kd, yearOnly) => {
    if (!kd || kd.length < 2) return 0;
    let cnt = 0, currentYr = new Date().getFullYear();
    for(let i=1; i<kd.length; i++) {
        const p=kd[i-1], c=kd[i];
        if(p.k == null || p.d == null || c.k == null || c.d == null) continue;
        if(yearOnly && new Date(c.date).getFullYear() !== currentYr) continue;
        if((p.k<=p.d && c.k>c.d) || (p.k>=p.d && c.k<c.d)) cnt++;
    } return cnt;
};

const getDeduction = (dailyData, latestClose, n) => {
    if (!dailyData || dailyData.length === 0) return { price: 0, diff: 0, isSafe: true, date: '--' };
    const idx = Math.max(0, dailyData.length - n);
    const target = dailyData[idx];
    return { date: target.date, price: target.close || 0, diff: latestClose - (target.close || 0), isSafe: latestClose >= (target.close || 0) };
};

onMounted(async () => {
    try {
        const res = await $fetch('/api/taiex');
        if (!res || !res.success) throw new Error(res?.message || '資料獲取失敗');
        
        const safeDaily = sanitize(res.data.daily);
        if (safeDaily.length === 0) throw new Error('API 傳回的日線數據為空，請稍後再試。');

        taiexData.value = {
            daily: calcKD(safeDaily),
            weekly: calcKD(sanitize(res.data.weekly)),
            monthly: calcKD(sanitize(res.data.monthly))
        };
        
        const daily = taiexData.value.daily, latest = daily[daily.length-1].close || 0;
        const ma20 = calcMA(20, daily), ma60 = calcMA(60, daily);
        
        const lw = findCross(taiexData.value.weekly);
        const lm = findCross(taiexData.value.monthly);

        // 安全取得數值防呆
        const getPct = (wave) => wave ? (Math.abs(latest - wave.close) / wave.close) * 100 : 0;
        const getDiff = (wave) => wave ? (wave.type === 'golden' ? latest - wave.close : wave.close - latest) : 0;
        const getVal = (arr) => arr && arr.length > 0 ? arr[arr.length-1] : {k:0, d:0};
        const getMa = (arr) => arr && arr.length > 0 ? arr[arr.length-1] || 0 : 0;
        const getPrevMa = (arr) => arr && arr.length > 1 ? arr[arr.length-2] || 0 : 0;

        analysis.value = {
            daily: {
                current: latest, ma20: getMa(ma20), ma60: getMa(ma60),
                ma20_trend: getMa(ma20) > getPrevMa(ma20) ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                ma60_trend: getMa(ma60) > getPrevMa(ma60) ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                deduction20: getDeduction(daily, latest, 20),
                deduction60: getDeduction(daily, latest, 60)
            },
            weekly: { 
                k: getVal(taiexData.value.weekly).k, d: getVal(taiexData.value.weekly).d,
                basePrice: lw?.close||0, baseDate: lw?.date||'--', type: lw?.type||'', crossType: lw?.crossType||'--',
                currentDiff: Math.abs(getDiff(lw)), percentDiff: getPct(lw),
                targetMin: lw ? lw.close * (lw.type==='golden'?1.075:0.925) : 0,
                targetMax: lw ? lw.close * (lw.type==='golden'?1.1:0.9) : 0,
                crossCount: countCross(taiexData.value.weekly, true),
                alertText: lw && getPct(lw) > 10 ? '⚠️ 嚴重警戒！突破 10% 動態極值' : '✅ 順勢推進中，空間未滿',
                alertClass: lw && getPct(lw) > 10 ? 'alert-danger' : 'alert-success'
            },
            monthly: {
                k: getVal(taiexData.value.monthly).k, d: getVal(taiexData.value.monthly).d,
                basePrice: lm?.close||0, baseDate: lm?.date||'--', type: lm?.type||'', crossType: lm?.crossType||'--',
                currentDiff: Math.abs(getDiff(lm)), percentDiff: getPct(lm),
                targetPrice: lm ? lm.close * (lm.type==='golden'?1.25:0.75) : 0,
                crossCount: countCross(taiexData.value.monthly, false),
                alertText: lm && getPct(lm) > 25 ? '⚠️ 突破 25% 長波動態極值' : '✅ 長線動態空間未滿',
                alertClass: lm && getPct(lm) > 25 ? 'alert-danger' : 'alert-success'
            }
        };

        // 輪詢等待 ECharts 載入 (解決網路慢導致的報錯)
        let checkCount = 0;
        const checkEcharts = setInterval(() => {
            if (window.echarts) {
                clearInterval(checkEcharts);
                renderChart();
                drawTheoryDiagram();
            } else if (checkCount > 50) { // 10秒超時
                clearInterval(checkEcharts);
                errorMsg.value = '圖表庫 (ECharts) 載入失敗，請檢查網路連線。';
            }
            checkCount++;
        }, 200);

    } catch (err) {
        errorMsg.value = err.message || '資料解析發生未知的錯誤';
        console.error(err);
    } finally {
        isLoading.value = false;
    }
});

function drawTheoryDiagram() {
    const dom = document.getElementById('theoryDiagram');
    if(!dom || !window.echarts) return;
    const inst = window.echarts.init(dom);
    inst.setOption({
        grid: { top: 20, bottom: 20, left: 40, right: 20 },
        xAxis: { type: 'category', data: ['起','浪1','浪2','浪3','浪4','浪5','空A','空B','空C','空修','終'], axisLine: { show: false } },
        yAxis: { show: false },
        series: [{
            type: 'line', smooth: true, symbolSize: 10, lineStyle: { width: 4, color: '#0d6efd' },
            data: [10, 40, 25, 70, 50, 100, 60, 80, 20, 10, 15],
            markPoint: { data: [{ name: '起', coord: [0, 10], itemStyle: {color: 'red'} }, { name: '高', coord: [5, 100], itemStyle: {color: 'orange'} }] }
        }]
    });
}

function renderChart() {
    if(!taiexData.value) return;
    const data = taiexData.value[currentPeriod.value];
    if(!data || data.length === 0) return;

    const ma20 = calcMA(20, data), ma60 = calcMA(60, data);
    
    const kdMarks = [], candleMarks = [];
    for(let i=1; i<data.length; i++) {
        if(data[i-1].k!=null && data[i].k!=null) {
            if(data[i-1].k<=data[i-1].d && data[i].k>data[i].d) kdMarks.push({coord:[i, data[i].k], symbol:'arrow', symbolSize:12, itemStyle:{color:'#dc3545'}});
            if(data[i-1].k>=data[i-1].d && data[i].k<data[i].d) kdMarks.push({coord:[i, data[i].k], symbol:'arrow', symbolRotate:180, symbolSize:12, itemStyle:{color:'#198754'}});
        }
    }
    if(currentPeriod.value==='daily' && data.length>=60) {
        candleMarks.push({coord:[data.length-20, data[data.length-20].close], value:'20MA扣抵', symbol:'pin', symbolSize:40, itemStyle:{color:'#0dcaf0'}});
        candleMarks.push({coord:[data.length-60, data[data.length-60].close], value:'60MA扣抵', symbol:'pin', symbolSize:40, itemStyle:{color:'#ffc107'}});
    }

    const dom = document.getElementById('taiexChartDyn');
    if(!dom || !window.echarts) return;
    if(chartInstance) chartInstance.dispose();
    chartInstance = window.echarts.init(dom);
    
    chartInstance.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        legend: { data: ['K線', '20MA', '60MA', '成交量', 'K值', 'D值'], top: 5 },
        grid: [{ left: '8%', right: '5%', top: '10%', height: '45%' }, { left: '8%', right: '5%', top: '60%', height: '12%' }, { left: '8%', right: '5%', top: '78%', height: '12%' }],
        xAxis: [{ type: 'category', data: data.map(i=>i.date), gridIndex: 0, axisLabel: { show: false } }, { type: 'category', data: data.map(i=>i.date), gridIndex: 1, axisLabel: { show: false } }, { type: 'category', data: data.map(i=>i.date), gridIndex: 2 }],
        yAxis: [{ scale: true, gridIndex: 0 }, { scale: true, gridIndex: 1, axisLabel: { show: false } }, { min: 0, max: 100, gridIndex: 2 }],
        dataZoom: [{ type: 'inside', xAxisIndex: [0, 1, 2], start: 70, end: 100 }, { show: true, xAxisIndex: [0, 1, 2], top: '94%', start: 70, end: 100 }],
        series: [
            { name: 'K線', type: 'candlestick', data: data.map(i=>[i.open, i.close, i.low, i.high]), itemStyle: { color: '#dc3545', color0: '#198754' }, markPoint: { data: candleMarks, label: {color:'#000', fontWeight:'bold'} } },
            { name: '20MA', type: 'line', data: ma20, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
            { name: '60MA', type: 'line', data: ma60, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
            { name: '成交量', type: 'bar', data: data.map(i=>({value:i.volume||0, itemStyle:{color:i.close>=i.open?'#dc3545':'#198754'}})), xAxisIndex: 1, yAxisIndex: 1 },
            { name: 'K值', type: 'line', data: data.map(i=>i.k), xAxisIndex: 2, yAxisIndex: 2, lineStyle: { color: '#dc3545' }, markPoint: { data: kdMarks, label:{show:false} } },
            { name: 'D值', type: 'line', data: data.map(i=>i.d), xAxisIndex: 2, yAxisIndex: 2, lineStyle: { color: '#0d6efd' } }
        ]
    });
}
</script>
