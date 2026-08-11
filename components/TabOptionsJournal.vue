<template>
  <div class="journal-dashboard">
    <div class="header">
      <h2 class="title">📖 選擇權貸方交易日誌 (Credit Spreads Journal)</h2>
    </div>

    <div class="journal-layout">
      <!-- 左側：月曆區塊 -->
      <div class="calendar-section">
        <div class="calendar-header">
          <button @click="changeMonth(-1)" class="btn-icon">◀</button>
          <h3 class="current-month">{{ currentYear }} 年 {{ currentMonth + 1 }} 月</h3>
          <button @click="changeMonth(1)" class="btn-icon">▶</button>
        </div>
        
        <div class="calendar-grid">
          <div class="weekday">日</div><div class="weekday">一</div><div class="weekday">二</div>
          <div class="weekday">三</div><div class="weekday">四</div><div class="weekday">五</div><div class="weekday">六</div>
          
          <div v-for="blank in firstDayOffset" :key="'blank-' + blank" class="calendar-day empty"></div>
          
          <div 
            v-for="day in daysInMonth" 
            :key="'day-' + day" 
            class="calendar-day"
            :class="{ 
              'active': isSelectedDate(day), 
              'has-trade': hasTradeOnDate(day),
              'today': isToday(day)
            }"
            @click="selectDate(day)"
          >
            <span class="day-number">{{ day }}</span>
            <div class="trade-dots" v-if="hasTradeOnDate(day)">
              <span class="dot"></span>
            </div>
          </div>
        </div>

        <div class="daily-trades-list mt-4">
          <h4 class="text-white mb-3">📅 {{ selectedDateStr }} 交易紀錄</h4>
          <div v-if="dailyTrades.length === 0" class="text-muted text-center p-3">
            本日無交易紀錄
          </div>
          <div 
            v-for="trade in dailyTrades" 
            :key="trade.id" 
            class="trade-card"
            :class="trade.status === 'closed' ? (trade.pnl > 0 ? 'win' : 'loss') : 'open'"
          >
            <div class="trade-card-header">
              <span class="fw-bold text-white">{{ trade.ticker }}</span>
              <span class="strategy-badge">{{ getStrategyName(trade.strategy) }}</span>
            </div>
            <div class="trade-card-body">
              <div class="trade-detail">到期日: {{ trade.expiry }}</div>
              <div class="trade-detail strikes-detail">
                履約價: 
                <span v-if="trade.strategy === 'vertical'">
                  S:{{ trade.strikes.short }}, L:{{ trade.strikes.long }}
                </span>
                <span v-if="trade.strategy === 'ironCondor'">
                  P(L:{{ trade.strikes.longPut }}, S:{{ trade.strikes.shortPut }}) / 
                  C(S:{{ trade.strikes.shortCall }}, L:{{ trade.strikes.longCall }})
                </span>
              </div>
              <div class="trade-detail">口數: {{ trade.contracts }}</div>
              <div class="trade-detail text-success" v-if="trade.entry_price !== null">
                收租 (Credit): ${{ Number(trade.entry_price).toFixed(2) }}
              </div>
              <div class="trade-detail text-danger" v-if="trade.exit_price !== null">
                平倉 (Debit): ${{ Number(trade.exit_price).toFixed(2) }}
              </div>
              <div class="trade-pnl mt-2 fw-bold" v-if="trade.status === 'closed'">
                實現損益: <span :class="trade.pnl > 0 ? 'text-success' : 'text-danger'">${{ trade.pnl }}</span>
              </div>
            </div>
            <div class="trade-card-actions mt-3">
              <!-- 🔥 新增：看圖按鈕 -->
              <button class="action-btn view-btn" @click="openPayoffChart(trade)">📊 損益圖</button>
              <button class="action-btn edit-btn" @click="editTrade(trade)">編輯</button>
              <button class="action-btn delete-btn" @click="deleteTrade(trade.id)">刪除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：新增/編輯表單 -->
      <div class="form-section">
        <h3 class="text-white mb-4 border-bottom border-secondary pb-2">
          {{ isEditing ? '✏️ 編輯交易' : '📝 新增交易' }} ({{ selectedDateStr }})
        </h3>
        
        <form @submit.prevent="saveTrade" class="trade-form">
          <div class="form-group">
            <label>股票代號 (Ticker)</label>
            <input type="text" v-model="form.ticker" required placeholder="例: SPY" class="dark-input" />
          </div>

          <div class="form-group">
            <label>策略類型</label>
            <select v-model="form.strategy" class="dark-input" @change="resetStrikes">
              <option value="vertical">垂直價差 (Credit Vertical Spread)</option>
              <option value="ironCondor">鐵鷹 (Iron Condor)</option>
            </select>
          </div>

          <div class="form-group">
            <label>到期日 (Expiration)</label>
            <input type="date" v-model="form.expiry" required class="dark-input" />
          </div>

          <div v-if="form.strategy === 'vertical'" class="strikes-grid">
            <div class="form-group">
              <label class="text-danger">賣出 (Short) 履約價</label>
              <input type="number" step="0.5" v-model="form.strikes.short" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-success">買入 (Long) 履約價</label>
              <input type="number" step="0.5" v-model="form.strikes.long" required class="dark-input" />
            </div>
          </div>

          <div v-if="form.strategy === 'ironCondor'" class="strikes-grid-4">
            <div class="form-group">
              <label class="text-success">買入 Put (Long)</label>
              <input type="number" step="0.5" v-model="form.strikes.longPut" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-danger">賣出 Put (Short)</label>
              <input type="number" step="0.5" v-model="form.strikes.shortPut" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-danger">賣出 Call (Short)</label>
              <input type="number" step="0.5" v-model="form.strikes.shortCall" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-success">買入 Call (Long)</label>
              <input type="number" step="0.5" v-model="form.strikes.longCall" required class="dark-input" />
            </div>
          </div>

          <div class="form-group">
            <label>交易口數 (Contracts)</label>
            <input type="number" min="1" v-model="form.contracts" required class="dark-input" />
          </div>

          <div class="form-group">
            <label class="text-success">建倉收租 (Entry Credit / 點數)</label>
            <input type="number" step="0.01" v-model="form.entryPrice" required class="dark-input" />
          </div>

          <div class="form-group border-top border-secondary pt-3 mt-2">
            <label class="text-warning">平倉成本 (Exit Debit / 點數) - 可留空</label>
            <input type="number" step="0.01" v-model="form.exitPrice" class="dark-input" />
          </div>

          <div class="form-actions mt-4">
            <button type="submit" class="submit-btn w-100">
              {{ isEditing ? '儲存修改' : '新增紀錄' }}
            </button>
            <button type="button" v-if="isEditing" @click="cancelEdit" class="cancel-btn w-100 mt-2">
              取消編輯
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 🔥 新增：到期損益圖 Modal -->
    <div v-if="isChartModalOpen" class="chart-modal-overlay" @click.self="closePayoffChart">
      <div class="chart-modal-content">
        <div class="chart-modal-header border-bottom border-secondary pb-3 mb-3 d-flex justify-content-between align-items-center">
          <h4 class="m-0 fw-bold text-white">📊 {{ chartTradeData?.ticker }} 到期損益圖 (Payoff Diagram)</h4>
          <button class="close-btn" @click="closePayoffChart">✖</button>
        </div>
        <div class="chart-modal-body">
          <div id="payoff-chart" style="width: 100%; height: 450px;"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
const supabase = useSupabaseClient();

const date = new Date();
const currentYear = ref(date.getFullYear());
const currentMonth = ref(date.getMonth());
const selectedDay = ref(date.getDate());

const selectedDateStr = computed(() => {
  return `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`;
});

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate());
const firstDayOffset = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay());

const changeMonth = (delta) => {
  let newMonth = currentMonth.value + delta;
  if (newMonth > 11) { newMonth = 0; currentYear.value++; }
  else if (newMonth < 0) { newMonth = 11; currentYear.value--; }
  currentMonth.value = newMonth;
  selectedDay.value = 1; 
};

const selectDate = (day) => { selectedDay.value = day; };
const isSelectedDate = (day) => day === selectedDay.value;
const isToday = (day) => {
  const today = new Date();
  return day === today.getDate() && currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear();
};

const allTrades = ref([]);

const fetchTrades = async () => {
  const { data, error } = await supabase.from('options_journal').select('*').order('created_at', { ascending: false });
  if (!error) allTrades.value = data || [];
};

onMounted(() => {
  fetchTrades();
});

const dailyTrades = computed(() => {
  return allTrades.value.filter(t => t.date === selectedDateStr.value);
});

const hasTradeOnDate = (day) => {
  const checkDate = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return allTrades.value.some(t => t.date === checkDate);
};

const getStrategyName = (val) => {
  return val === 'vertical' ? '垂直價差' : '鐵鷹';
};

const isEditing = ref(false);
const editingId = ref(null);

const initialForm = {
  ticker: '',
  strategy: 'vertical',
  expiry: '',
  strikes: { short: null, long: null, longPut: null, shortPut: null, shortCall: null, longCall: null },
  contracts: 1,
  entryPrice: null,
  exitPrice: null
};
const form = ref(JSON.parse(JSON.stringify(initialForm)));

const resetStrikes = () => {
  form.value.strikes = { short: null, long: null, longPut: null, shortPut: null, shortCall: null, longCall: null };
};

const saveTrade = async () => {
  const tradeData = {
    date: selectedDateStr.value,
    ticker: form.value.ticker.toUpperCase(),
    strategy: form.value.strategy,
    expiry: form.value.expiry,
    strikes: form.value.strikes, 
    contracts: form.value.contracts,
    entry_price: form.value.entryPrice,
    exit_price: form.value.exitPrice !== '' && form.value.exitPrice !== null ? form.value.exitPrice : null,
  };

  if (tradeData.exit_price !== null) {
    tradeData.status = 'closed';
    tradeData.pnl = ((tradeData.entry_price - tradeData.exit_price) * 100 * tradeData.contracts).toFixed(2);
  } else {
    tradeData.status = 'open';
    tradeData.pnl = 0;
  }

  if (isEditing.value) {
    await supabase.from('options_journal').update(tradeData).eq('id', editingId.value);
  } else {
    await supabase.from('options_journal').insert([tradeData]);
  }

  await fetchTrades();
  cancelEdit();
};

const editTrade = (trade) => {
  isEditing.value = true;
  editingId.value = trade.id;
  form.value = {
    ticker: trade.ticker,
    strategy: trade.strategy,
    expiry: trade.expiry,
    strikes: trade.strikes,
    contracts: trade.contracts,
    entryPrice: trade.entry_price,
    exitPrice: trade.exit_price || ''
  };
};

const deleteTrade = async (id) => {
  if (confirm('確定要刪除這筆交易紀錄嗎？')) {
    await supabase.from('options_journal').delete().eq('id', id);
    await fetchTrades();
    if (isEditing.value && editingId.value === id) cancelEdit();
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = JSON.parse(JSON.stringify(initialForm));
};

// ==========================================
// 🔥 新增：到期損益圖 (Payoff Diagram) 邏輯
// ==========================================
const isChartModalOpen = ref(false);
const chartTradeData = ref(null);
let payoffChartInstance = null;

const openPayoffChart = async (trade) => {
  chartTradeData.value = trade;
  isChartModalOpen.value = true;
  
  await nextTick();
  renderPayoffChart(trade);
};

const closePayoffChart = () => {
  isChartModalOpen.value = false;
  if (payoffChartInstance) {
    payoffChartInstance.dispose();
    payoffChartInstance = null;
  }
};

const renderPayoffChart = (trade) => {
  const chartDom = document.getElementById('payoff-chart');
  if (!chartDom) return;
  
  payoffChartInstance = echarts.init(chartDom);
  
  const { strategy, strikes, entry_price, contracts } = trade;
  const multiplier = 100 * contracts;
  
  let minStrike = Infinity;
  let maxStrike = -Infinity;

  if (strategy === 'vertical') {
    minStrike = Math.min(strikes.short, strikes.long);
    maxStrike = Math.max(strikes.short, strikes.long);
  } else {
    minStrike = strikes.longPut;
    maxStrike = strikes.longCall;
  }

  // 產生 X 軸的價格點 (稍微擴展最低與最高履約價的範圍)
  const xData = [];
  const yData = [];
  const startPrice = minStrike * 0.85;
  const endPrice = maxStrike * 1.15;
  const step = (endPrice - startPrice) / 200;

  for (let p = startPrice; p <= endPrice; p += step) {
    xData.push(p.toFixed(2));
    let pnl = 0;

    if (strategy === 'vertical') {
      const isCallSpread = strikes.short < strikes.long;
      if (isCallSpread) {
        // Bear Call Spread
        const shortLeg = -Math.max(p - strikes.short, 0);
        const longLeg = Math.max(p - strikes.long, 0);
        pnl = (entry_price + shortLeg + longLeg) * multiplier;
      } else {
        // Bull Put Spread
        const shortLeg = -Math.max(strikes.short - p, 0);
        const longLeg = Math.max(strikes.long - p, 0);
        pnl = (entry_price + shortLeg + longLeg) * multiplier;
      }
    } else if (strategy === 'ironCondor') {
      const shortPutLeg = -Math.max(strikes.shortPut - p, 0);
      const longPutLeg = Math.max(strikes.longPut - p, 0);
      const shortCallLeg = -Math.max(p - strikes.shortCall, 0);
      const longCallLeg = Math.max(p - strikes.longCall, 0);
      pnl = (entry_price + shortPutLeg + longPutLeg + shortCallLeg + longCallLeg) * multiplier;
    }
    
    yData.push(pnl.toFixed(2));
  }

  const option = {
    backgroundColor: '#1e222d',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const price = params[0].name;
        const pnl = Number(params[0].value);
        const color = pnl >= 0 ? '#26a69a' : '#ef5350';
        return `結算價: $${price}<br/>損益: <span style="color:${color};font-weight:bold;">$${pnl.toFixed(2)}</span>`;
      }
    },
    xAxis: {
      type: 'category',
      name: '到期結算價',
      data: xData,
      axisLine: { lineStyle: { color: '#8c8f98' } }
    },
    yAxis: {
      type: 'value',
      name: '總損益 (USD)',
      axisLine: { lineStyle: { color: '#8c8f98' } },
      splitLine: { lineStyle: { color: '#2b2b43' } }
    },
    // 利用 visualMap 將 0 軸以上的線條塗綠色，0 軸以下塗紅色
    visualMap: {
      show: false,
      pieces: [
        { gt: 0, color: '#26a69a' }, 
        { lte: 0, color: '#ef5350' }
      ]
    },
    series: [
      {
        data: yData,
        type: 'line',
        symbol: 'none',
        lineStyle: { width: 3 },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { position: 'end', formatter: '{b}' },
          data: [
            { yAxis: 0, lineStyle: { color: '#8c8f98', type: 'dashed' }, name: '損益兩平' }
          ]
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          label: { color: '#fff', fontSize: 10 },
          itemStyle: { color: '#e0ac00' },
          data: [
            { type: 'max', name: '最大營利' },
            { type: 'min', name: '最大虧損' }
          ]
        }
      }
    ]
  };

  payoffChartInstance.setOption(option);
};
</script>

<style scoped>
.journal-dashboard {
  background-color: #131722; color: #d1d4dc; padding: 24px;
  border-radius: 12px; font-family: -apple-system, sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); margin: 0 auto;
}
.title { font-size: 1.5rem; font-weight: 600; color: #fff; margin-bottom: 24px; }

.journal-layout {
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
}
@media (max-width: 992px) { .journal-layout { grid-template-columns: 1fr; } }

.calendar-section { background-color: #1e222d; padding: 20px; border-radius: 8px; border: 1px solid #2b2b43; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.current-month { color: #fff; font-size: 1.2rem; margin: 0; }
.btn-icon { background: #2a2e39; border: 1px solid #434651; color: #d1d4dc; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.btn-icon:hover { background: #363a45; }

.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center; }
.weekday { color: #8c8f98; font-size: 0.9rem; margin-bottom: 8px; }
.calendar-day { 
  aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background-color: #2a2e39; border-radius: 6px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
}
.calendar-day.empty { background-color: transparent; cursor: default; }
.calendar-day:not(.empty):hover { border-color: #2962ff; }
.calendar-day.active { background-color: rgba(41, 98, 255, 0.2); border-color: #2962ff; color: #fff; font-weight: bold; }
.calendar-day.today .day-number { color: #26a69a; font-weight: bold; text-decoration: underline; }

.trade-dots { display: flex; gap: 4px; margin-top: 4px; }
.dot { width: 6px; height: 6px; background-color: #e0ac00; border-radius: 50%; }

.trade-card { background-color: #2a2e39; border-left: 4px solid #8c8f98; padding: 16px; border-radius: 6px; margin-bottom: 12px; }
.trade-card.open { border-color: #e0ac00; }
.trade-card.win { border-color: #26a69a; }
.trade-card.loss { border-color: #ef5350; }
.trade-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.strategy-badge { background-color: #1e222d; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; color: #8c8f98; }
.trade-detail { font-size: 0.9rem; color: #b2b5be; margin-bottom: 4px; }
.strikes-detail { background-color: #131722; padding: 6px; border-radius: 4px; margin: 6px 0; }
.trade-card-actions { display: flex; gap: 8px; }
.action-btn { flex: 1; border: none; padding: 6px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; }
.view-btn { background-color: #e0ac00; color: #fff; } /* 新增圖表按鈕樣式 */
.edit-btn { background-color: #2962ff; color: #fff; }
.delete-btn { background-color: rgba(239, 83, 80, 0.2); color: #ef5350; }

.form-section { background-color: #1e222d; padding: 20px; border-radius: 8px; border: 1px solid #2b2b43; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.9rem; color: #8c8f98; }
.dark-input { background-color: #2a2e39; border: 1px solid #434651; color: #fff; padding: 10px; border-radius: 6px; outline: none; }
.dark-input:focus { border-color: #2962ff; }
.strikes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.strikes-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.submit-btn { background-color: #2962ff; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.submit-btn:hover { background-color: #1e4bd8; }
.cancel-btn { background-color: transparent; border: 1px solid #434651; color: #d1d4dc; padding: 12px; border-radius: 6px; cursor: pointer; }

/* 🔥 Modal 樣式 */
.chart-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.8); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.chart-modal-content {
  background-color: #131722; border: 1px solid #2b2b43; border-radius: 12px;
  width: 90%; max-width: 800px; padding: 24px; box-shadow: 0 12px 48px rgba(0,0,0,0.5);
}
.close-btn { background: none; border: none; color: #8c8f98; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: #fff; }
</style>
