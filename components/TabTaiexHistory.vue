<template>
  <div class="container pb-5 mt-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-light">
      <div class="card-body">
        <h5 class="fw-bold text-success mb-3">⏳ 台股歷史週 KD 轉折大數據回測</h5>
        <p class="text-muted small mb-3">
          本系統自動掃描從歷史最遠端至 2026 年 5 月的每一次週 KD 交叉。當發生「死亡交叉」時，結算前一波多頭上漲空間；發生「黃金交叉」時，結算前一波空頭下跌空間。藉此驗證每年是否平均發生 6-8 次交叉。<br>
          <span class="text-danger">※ 註：歷史數據起點依 API 實際提供年份為準 (通常為 1997 或 2000 年起算)。</span>
        </p>
        
        <div class="d-flex flex-wrap gap-2">
            <button v-for="decade in availableDecades" :key="decade.id" 
                    @click="activeDecade = decade.id"
                    :class="['btn fw-bold px-4', activeDecade === decade.id ? 'btn-success' : 'btn-outline-success']">
                {{ decade.label }}
            </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-success"></div><p class="mt-2 fw-bold text-success">歷史數據解析與波段結算中...</p>
    </div>

    <div v-if="errorMsg" class="alert alert-danger fw-bold text-center">
      ❌ 錯誤：{{ errorMsg }}
    </div>

    <div v-if="!isLoading && groupedData[activeDecade]">
      
      <div class="row mb-4">
        <div class="col-md-4 mb-2">
            <div class="card border-success h-100 shadow-sm text-center p-3">
                <h6 class="text-muted fw-bold">本年代平均年交叉次數</h6>
                <div class="fs-3 fw-bold text-success">{{ getDecadeAvgCrosses(activeDecade) }} <span class="fs-6">次/年</span></div>
            </div>
        </div>
        <div class="col-md-4 mb-2">
            <div class="card border-danger h-100 shadow-sm text-center p-3">
                <h6 class="text-muted fw-bold">本年代最大多頭波段</h6>
                <div class="fs-3 fw-bold text-danger">+{{ getDecadeBestWave(activeDecade) }} <span class="fs-6">點</span></div>
            </div>
        </div>
        <div class="col-md-4 mb-2">
            <div class="card border-primary h-100 shadow-sm text-center p-3">
                <h6 class="text-muted fw-bold">本年代最大空頭波段</h6>
                <div class="fs-3 fw-bold text-primary">{{ getDecadeWorstWave(activeDecade) }} <span class="fs-6">點</span></div>
            </div>
        </div>
      </div>

      <div class="accordion shadow-sm" id="historyAccordion">
        <div class="accordion-item" v-for="yearData in groupedData[activeDecade]" :key="yearData.year">
          <h2 class="accordion-header" :id="'heading' + yearData.year">
            <button class="accordion-button collapsed fw-bold fs-5 d-flex justify-content-between" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse' + yearData.year">
              <span>📅 {{ yearData.year }} 年</span>
              <span class="badge ms-3 me-3" :class="yearData.crosses.length > 8 ? 'bg-danger' : 'bg-success'">總交叉: {{ yearData.crosses.length }} 次</span>
            </button>
          </h2>
          <div :id="'collapse' + yearData.year" class="accordion-collapse collapse" data-bs-parent="#historyAccordion">
            <div class="accordion-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover table-striped mb-0 text-center align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>交叉日期</th>
                                <th>轉折類型</th>
                                <th>當時指數</th>
                                <th>前波段空間結算</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(cross, idx) in yearData.crosses" :key="idx">
                                <td class="text-muted">{{ cross.date }}</td>
                                <td>
                                    <span v-if="cross.type === 'golden'" class="badge bg-danger rounded-pill px-3 py-2">🔥 黃金交叉 (起漲)</span>
                                    <span v-else class="badge bg-success rounded-pill px-3 py-2">❄️ 死亡交叉 (起跌)</span>
                                </td>
                                <td class="fw-bold">{{ cross.price.toFixed(0) }}</td>
                                <td>
                                    <span v-if="cross.change > 0" class="fw-bold text-danger">📈 上漲 {{ cross.change.toFixed(0) }} 點</span>
                                    <span v-else-if="cross.change < 0" class="fw-bold text-success">📉 下跌 {{ Math.abs(cross.change).toFixed(0) }} 點</span>
                                    <span v-else class="text-muted">--</span>
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
    
    <div v-if="!isLoading && !groupedData[activeDecade]" class="text-center my-5 text-muted fw-bold">
        該年代無 API 歷史數據。
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const isLoading = ref(true);
const errorMsg = ref('');
const rawCrosses = ref([]);
const activeDecade = ref('2020');

// 定義可選的年代
const availableDecades = [
    { id: '1980', label: '1980 - 1989' },
    { id: '1990', label: '1990 - 1999' },
    { id: '2000', label: '2000 - 2009' },
    { id: '2010', label: '2010 - 2019' },
    { id: '2020', label: '2020 - 2026' }
];

// 清洗資料
const sanitize = (q) => {
    if (!q || !Array.isArray(q)) return [];
    return q.filter(x => x.open != null && x.close != null && !isNaN(x.close));
};

// 計算 KD
const calcKD = (q) => {
    let k=50, d=50;
    return q.map((x, i, a) => {
        if(i<8) return {...x, k:50, d:50};
        const r = a.slice(i-8, i+1);
        const h = Math.max(...r.map(v=>v.high));
        const l = Math.min(...r.map(v=>v.low));
        let rsv = h===l ? 0 : ((x.close-l)/(h-l))*100;
        k = (rsv+k*2)/3; d = (k+d*2)/3;
        return {...x, k, d};
    });
};

onMounted(async () => {
    try {
        const res = await $fetch('/api/taiex');
        if (!res || !res.success) throw new Error(res?.message || '資料獲取失敗');
        
        const safeWeekly = sanitize(res.data.weekly);
        if (safeWeekly.length === 0) throw new Error('API 傳回的週線數據為空');

        const weeklyKD = calcKD(safeWeekly);
        const crosses = [];
        let lastCrossPrice = null;
        let lastCrossType = null;

        // 從最舊的資料開始往最新找，才能計算每次結算的漲跌幅
        for (let i = 1; i < weeklyKD.length; i++) {
            const p = weeklyKD[i-1], c = weeklyKD[i];
            if (p.k == null || p.d == null || c.k == null || c.d == null) continue;

            let crossType = null;
            if (p.k <= p.d && c.k > c.d) crossType = 'golden';
            if (p.k >= p.d && c.k < c.d) crossType = 'death';

            if (crossType) {
                const year = new Date(c.date).getFullYear();
                // 計算漲跌空間：
                // 如果現在是死亡交叉，代表前面的波段是黃金交叉以來的多頭，計算這段多頭漲了多少。
                // 如果現在是黃金交叉，代表前面的波段是死亡交叉以來的空頭，計算這段空頭跌了多少。
                let pointChange = 0;
                if (lastCrossPrice !== null) {
                    pointChange = c.close - lastCrossPrice;
                }

                crosses.push({
                    date: c.date,
                    year: year,
                    type: crossType,
                    price: c.close,
                    change: pointChange
                });

                lastCrossPrice = c.close;
                lastCrossType = crossType;
            }
        }
        
        // 反轉陣列，讓最新的交叉在最上面
        rawCrosses.value = crosses.reverse();

        // 自動判斷第一筆資料落在哪個年代，並將 activeDecade 切換過去
        if (rawCrosses.value.length > 0) {
            const latestYear = rawCrosses.value[0].year;
            const decadeFloor = Math.floor(latestYear / 10) * 10;
            activeDecade.value = decadeFloor.toString();
        }

    } catch (err) {
        errorMsg.value = err.message || '回測運算發生錯誤';
    } finally {
        isLoading.value = false;
    }
});

// 將所有交叉事件分門別類 (依照 10 年為單位，再依照年份群組)
const groupedData = computed(() => {
    const groups = { '1980': [], '1990': [], '2000': [], '2010': [], '2020': [] };
    
    // 初始化空結構
    Object.keys(groups).forEach(dec => {
        const start = parseInt(dec);
        for(let y = start + 9; y >= start; y--) {
            if(y > 2026) continue; // 不超過 2026
            groups[dec].push({ year: y, crosses: [] });
        }
    });

    // 填入資料
    rawCrosses.value.forEach(cross => {
        const decadeKey = (Math.floor(cross.year / 10) * 10).toString();
        if (groups[decadeKey]) {
            const yearGroup = groups[decadeKey].find(g => g.year === cross.year);
            if (yearGroup) yearGroup.crosses.push(cross);
        }
    });

    // 移除沒有交叉事件的空年份
    Object.keys(groups).forEach(dec => {
        groups[dec] = groups[dec].filter(g => g.crosses.length > 0);
        if (groups[dec].length === 0) delete groups[dec];
    });

    return groups;
});

// 統計工具函數
const getDecadeAvgCrosses = (decade) => {
    const data = groupedData.value[decade];
    if (!data || data.length === 0) return 0;
    const totalCrosses = data.reduce((sum, yData) => sum + yData.crosses.length, 0);
    return (totalCrosses / data.length).toFixed(1);
};

const getDecadeBestWave = (decade) => {
    const data = groupedData.value[decade];
    if (!data) return 0;
    let max = 0;
    data.forEach(y => y.crosses.forEach(c => {
        if (c.change > max) max = c.change;
    }));
    return max.toFixed(0);
};

const getDecadeWorstWave = (decade) => {
    const data = groupedData.value[decade];
    if (!data) return 0;
    let min = 0;
    data.forEach(y => y.crosses.forEach(c => {
        if (c.change < min) min = c.change;
    }));
    return min.toFixed(0);
};

</script>

<style scoped>
.accordion-button:not(.collapsed) {
    background-color: #d1e7dd;
    color: #0f5132;
    box-shadow: none;
}
.accordion-button:focus {
    border-color: #198754;
    box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
}
</style>
