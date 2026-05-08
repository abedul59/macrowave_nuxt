<template>
  <div class="container pb-5 mt-4">
    
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

    <div v-if="isLoading" class="text-center my-5"><div class="spinner-border text-danger"></div><p>動態運算中...</p></div>

    <div class="card shadow-sm mb-4" v-show="!isLoading && taiexData">
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
const taiexData = ref(null);
const analysis = ref(null);
const currentPeriod = ref('daily');
let chartInstance = null;

// 共用函數
const sanitize = (q) => q.filter(x => x.open != null && x.close != null && !isNaN(x.close));
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
    for(let i = kd.length-1; i>0; i--) {
        const p=kd[i-1], c=kd[i];
        if(p.k<=p.d && c.k>c.d) return {...c, type:'golden', crossType:'黃金交叉'};
        if(p.k>=p.d && c.k<c.d) return {...c, type:'death', crossType:'死亡交叉'};
    } return null;
};
const countCross = (kd, yearOnly) => {
    let cnt = 0, currentYr = new Date().getFullYear();
    for(let i=1; i<kd.length; i++) {
        if(yearOnly && new Date(kd[i].date).getFullYear() !== currentYr) continue;
        if((kd[i-1].k<=kd[i-1].d && kd[i].k>kd[i].d) || (kd[i-1].k>=kd[i-1].d && kd[i].k<kd[i].d)) cnt++;
    } return cnt;
};

onMounted(async () => {
    try {
        const res = await $fetch('/api/taiex');
        taiexData.value = {
            daily: calcKD(sanitize(res.data.daily)),
            weekly: calcKD(sanitize(res.data.weekly)),
            monthly: calcKD(sanitize(res.data.monthly))
        };
        const daily = taiexData.value.daily, latest = daily[daily.length-1].close;
        const ma20 = calcMA(20, daily), ma60 = calcMA(60, daily);
        const lw = findCross(taiexData.value.weekly), lm = findCross(taiexData.value.monthly);

        analysis.value = {
            daily: {
                current: latest, ma20: ma20[ma20.length-1], ma60: ma60[ma60.length-1],
                ma20_trend: ma20[ma20.length-1]>ma20[ma20.length-2]?'<span class="text-danger">↗</span>':'<span class="text-success">↘</span>',
                ma60_trend: ma60[ma60.length-1]>ma60[ma60.length-2]?'<span class="text-danger">↗</span>':'<span class="text-success">↘</span>',
                deduction20: { price: daily[Math.max(0, daily.length-20)].close, diff: latest-daily[Math.max(0, daily.length-20)].close, isSafe: latest>=daily[Math.max(0, daily.length-20)].close },
                deduction60: { price: daily[Math.max(0, daily.length-60)].close, diff: latest-daily[Math.max(0, daily.length-60)].close, isSafe: latest>=daily[Math.max(0, daily.length-60)].close }
            },
            weekly: { 
                k: taiexData.value.weekly.slice(-1)[0].k, d: taiexData.value.weekly.slice(-1)[0].d,
                basePrice: lw?.close||0, baseDate: lw?.date||'--', type: lw?.type||'', crossType: lw?.crossType||'--',
                currentDiff: Math.abs(lw ? latest-lw.close : 0), percentDiff: lw ? (Math.abs(latest-lw.close)/lw.close)*100 : 0,
                targetMin: lw ? lw.close * (lw.type==='golden'?1.075:0.925) : 0,
                targetMax: lw ? lw.close * (lw.type==='golden'?1.1:0.9) : 0,
                crossCount: countCross(taiexData.value.weekly, true),
                alertText: lw && (Math.abs(latest-lw.close)/lw.close)>0.1 ? '⚠️ 突破 10% 動態極值' : '✅ 順勢推進中', alertClass: lw && (Math.abs(latest-lw.close)/lw.close)>0.1?'alert-danger':'alert-success'
            },
            monthly: {
                k: taiexAllData.value.monthly.slice(-1)[0].k, d: taiexAllData.value.monthly.slice(-1)[0].d,
                basePrice: lm?.close||0, baseDate: lm?.date||'--', type: lm?.type||'', crossType: lm?.crossType||'--',
                currentDiff: Math.abs(lm ? latest-lm.close : 0), percentDiff: lm ? (Math.abs(latest-lm.close)/lm.close)*100 : 0,
                targetPrice: lm ? lm.close * (lm.type==='golden'?1.25:0.75) : 0,
                crossCount: countCross(taiexData.value.monthly, false),
                alertText: lm && (Math.abs(latest-lm.close)/lm.close)>0.25 ? '⚠️ 突破 25% 動態極值' : '✅ 長線空間未滿', alertClass: lm && (Math.abs(latest-lm.close)/lm.close)>0.25?'alert-danger':'alert-success'
            }
        };
        renderChart();
        
        // 繪製示意圖
        setTimeout(() => {
            const dom = document.getElementById('theoryDiagram');
            if(dom && window.echarts) {
                window.echarts.init(dom).setOption({
                    grid: { top: 20, bottom: 20, left: 40, right: 20 }, xAxis: { type: 'category', data: ['起','浪1','浪2','浪3','浪4','浪5','空A','空B','空C','空修','終'], axisLine: { show: false } }, yAxis: { show: false },
                    series: [{ type: 'line', smooth: true, lineStyle: { width: 4, color: '#0d6efd' }, data: [10, 40, 25, 70, 50, 100, 60, 80, 20, 10, 15], markPoint: { data: [{ name: '起', coord: [0, 10], itemStyle: {color: 'red'} }, { name: '高', coord: [5, 100], itemStyle: {color: 'orange'} }] } }]
                });
            }
        }, 100);
    } finally { isLoading.value = false; }
});

function renderChart() {
    if(!taiexData.value) return;
    const data = taiexData.value[currentPeriod.value];
    const ma20 = calcMA(20, data), ma60 = calcMA(60, data);
    
    const kdMarks = [], candleMarks = [];
    for(let i=1; i<data.length; i++) {
        if(data[i-1].k<=data[i-1].d && data[i].k>data[i].d) kdMarks.push({coord:[i, data[i].k], symbol:'arrow', symbolSize:12, itemStyle:{color:'#dc3545'}});
        if(data[i-1].k>=data[i-1].d && data[i].k<data[i].d) kdMarks.push({coord:[i, data[i].k], symbol:'arrow', symbolRotate:180, symbolSize:12, itemStyle:{color:'#198754'}});
    }
    if(currentPeriod.value==='daily' && data.length>=60) {
        candleMarks.push({coord:[data.length-20, data[data.length-20].close], value:'20MA', symbol:'pin', symbolSize:40, itemStyle:{color:'#0dcaf0'}});
        candleMarks.push({coord:[data.length-60, data[data.length-60].close], value:'60MA', symbol:'pin', symbolSize:40, itemStyle:{color:'#ffc107'}});
    }

    setTimeout(() => {
        const dom = document.getElementById('taiexChartDyn');
        if(!dom || !window.echarts) return;
        if(chartInstance) chartInstance.dispose();
        chartInstance = window.echarts.init(dom);
        
        chartInstance.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } }, axisPointer: { link: [{ xAxisIndex: 'all' }] },
            legend: { data: ['K線', '20MA', '60MA', '成交量', 'K值', 'D值'], top: 5 },
            grid: [{ left: '8%', right: '5%', top: '10%', height: '45%' }, { left: '8%', right: '5%', top: '60%', height: '12%' }, { left: '8%', right: '5%', top: '78%', height: '12%' }],
            xAxis: [{ type: 'category', data: data.map(i=>i.date), gridIndex: 0, axisLabel: { show: false } }, { type: 'category', data: data.map(i=>i.date), gridIndex: 1, axisLabel: { show: false } }, { type: 'category', data: data.map(i=>i.date), gridIndex: 2 }],
            yAxis: [{ scale: true, gridIndex: 0 }, { scale: true, gridIndex: 1, axisLabel: { show: false } }, { min: 0, max: 100, gridIndex: 2 }],
            dataZoom: [{ type: 'inside', xAxisIndex: [0, 1, 2], start: 70, end: 100 }, { show: true, xAxisIndex: [0, 1, 2], top: '94%', start: 70, end: 100 }],
            series: [
                { name: 'K線', type: 'candlestick', data: data.map(i=>[i.open, i.close, i.low, i.high]), itemStyle: { color: '#dc3545', color0: '#198754' }, markPoint: { data: candleMarks, label: {color:'#000', fontWeight:'bold'} } },
                { name: '20MA', type: 'line', data: ma20, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
                { name: '60MA', type: 'line', data: ma60, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
                { name: '成交量', type: 'bar', data: data.map(i=>({value:i.volume, itemStyle:{color:i.close>=i.open?'#dc3545':'#198754'}})), xAxisIndex: 1, yAxisIndex: 1 },
                { name: 'K值', type: 'line', data: data.map(i=>i.k), xAxisIndex: 2, yAxisIndex: 2, lineStyle: { color: '#dc3545' }, markPoint: { data: kdMarks, label:{show:false} } },
                { name: 'D值', type: 'line', data: data.map(i=>i.d), xAxisIndex: 2, yAxisIndex: 2, lineStyle: { color: '#0d6efd' } }
            ]
        });
    }, 50);
}
</script>
