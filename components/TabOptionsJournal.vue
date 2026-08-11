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
              <span class="fw-bold text-white fs-5">{{ trade.ticker }}</span>
              <span class="strategy-badge">{{ getStrategyName(trade.strategy) }}</span>
            </div>
            <div class="trade-card-body">
              <div class="trade-detail">到期日: {{ trade.expiry }}</div>
              <div class="trade-detail strikes-detail">
                履約價: 
                <span v-if="trade.strategy === 'vertical'" class="fw-bold text-white">
                  S:{{ trade.strikes.short }}, L:{{ trade.strikes.long }}
                </span>
                <span v-if="trade.strategy === 'ironCondor'" class="fw-bold text-white">
                  P(L:{{ trade.strikes.longPut }}, S:{{ trade.strikes.shortPut }}) / 
                  C(S:{{ trade.strikes.shortCall }}, L:{{ trade.strikes.longCall }})
                </span>
              </div>
              <div class="trade-detail">口數: {{ trade.contracts }}</div>
              <div class="trade-detail text-success" v-if="trade.entry_price !== null">
                建倉收租 (Credit): ${{ Number(trade.entry_price).toFixed(2) }}
              </div>
              <div class="trade-detail text-warning" v-if="trade.exit_price !== null">
                平倉成本 (Debit): ${{ Number(trade.exit_price).toFixed(2) }}
              </div>
              
              <div class="trade-pnl mt-3 pt-2 border-top border-secondary fw-bold fs-6" v-if="trade.status === 'closed'">
                平倉實際損益: 
                <span :class="trade.pnl > 0 ? 'text-success' : 'text-danger'">
                  {{ trade.pnl > 0 ? '+' : '' }}${{ trade.pnl }}
                </span>
              </div>
            </div>
            <div class="trade-card-actions mt-3">
              <!-- 🔥 白話文按鈕 -->
              <button class="action-btn view-btn" @click="openPayoffChart(trade)">📊 預覽到期賺賠圖</button>
              <button class="action-btn edit-btn" @click="editTrade(trade)">編輯 / 平倉</button>
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
            <label class="text-warning">
              提早平倉成本 (Exit Debit / 點數) 
              <span class="text-muted fs-7 ml-2">※ 若不幸需停損，或提早獲利了結時填寫</span>
            </label>
            <input type="number" step="0.01" v-model="form.exitPrice" class="dark-input" placeholder="未平倉請留空" />
          </div>

          <div class="calc-preview mt-3" v-if="formStats">
            <h5 class="calc-title mb-3">💡 交易試算預覽</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">到期最多能賺 (Max Profit):</span>
              <span class="text-success fw-bold">${{ formStats.maxProfit.toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">到期最多會賠 (Max Loss):</span>
              <span class="text-danger fw-bold">${{ formStats.maxLoss.toFixed(2) }}</span>
            </div>
            
            <div v-if="formStats.exitPnL !== null" class="d-flex justify-content-between pt-2 mt-2 border-top border-secondary">
              <span class="text-white">👉 提早平倉實際損益:</span>
              <span class="fw-bold fs-5" :class="formStats.exitPnL > 0 ? 'text-success' : 'text-danger'">
                {{ formStats.exitPnL > 0 ? '+' : '' }}${{ formStats.exitPnL.toFixed(2) }}
              </span>
            </div>
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

    <!-- 🔥 修正版：到期損益圖 Modal -->
    <div v-if="isChartModalOpen" class="chart-modal-overlay" @click.self="closePayoffChart">
      <div class="chart-modal-content">
        <div class="chart-modal-header border-bottom border-secondary pb-3 mb-3 d-flex justify-content-between align-items-center">
          <h4 class="m-0 fw-bold text-white">📊 {{ chartTradeData?.ticker }} 到期損益預測圖</h4>
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

const formStats = computed(() => {
  const c = form.value;
  if (!c.entryPrice || !c.contracts) return null;

  let width = 0;
  if (c.strategy === 'vertical') {
    if (!c.strikes.short || !c.strikes.long) return null;
    width = Math.abs(c.strikes.short - c.strikes.long);
  } else if (c.strategy === 'ironCondor') {
    if (!c.strikes.longPut || !c.strikes.shortPut || !c.strikes.shortCall || !c.strikes.longCall) return null;
    const putWidth = Math.abs(c.strikes.shortPut - c.strikes.longPut);
    const callWidth = Math.abs(c.strikes.longCall - c.strikes.shortCall);
    width = Math.max(putWidth, callWidth);
  }

  const maxProfit = c.entryPrice * 100 * c.contracts;
  const maxLoss = (width - c.entryPrice) * 100 * c.contracts;
  
  let exitPnL = null;
  if (c.exitPrice !== null && c.exitPrice !== '') {
    exitPnL = (c.entryPrice - c.exitPrice) * 100 * c.contracts;
  }

  if (maxLoss < 0 && width !== 0) return null; 

  return { width, maxProfit, maxLoss: -maxLoss, exitPnL };
});

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
// 🔥 徹底修復且更好懂的到期損益圖
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
  
  let minStrike = Infinity, maxStrike = -Infinity;

  if (strategy === 'vertical') {
    minStrike = Math.min(strikes.short, strikes.long);
    maxStrike = Math.max(strikes.short, strikes.long);
  } else {
    minStrike = Math.min(strikes.longPut, strikes.shortPut, strikes.shortCall, strikes.longCall);
    maxStrike = Math.max(strikes.longPut, strikes.shortPut, strikes.shortCall, strikes.longCall);
  }

  // 產生 [x, y] 的二維數據陣列 (這是確保連續折線圖畫得出來的唯一正解)
  const chartData = [];
  
  const startPrice = minStrike * 0.90; // 往左延伸 10%
  const endPrice = maxStrike * 1.10;   // 往右延伸 10%
  const step = (endPrice - startPrice) / 200; // 切 200 個點來畫線

  for (let p = startPrice; p <= endPrice; p += step) {
    let pnl = 0;
    if (strategy === 'vertical') {
      const isCallSpread = strikes.short < strikes.long;
      if (isCallSpread) {
        pnl = (entry_price - Math.max(p - strikes.short, 0) + Math.max(p - strikes.long, 0)) * multiplier;
      } else {
        pnl = (entry_price - Math.max(strikes.short - p, 0) + Math.max(strikes.long - p, 0)) * multiplier;
      }
    } else if (strategy === 'ironCondor') {
      pnl = (entry_price 
             - Math.max(strikes.shortPut - p, 0) 
             + Math.max(strikes.longPut - p, 0) 
             - Math.max(p - strikes.shortCall, 0) 
             + Math.max(p - strikes.longCall, 0)) * multiplier;
    }
    
    chartData.push([Number(p.toFixed(2)), Number(pnl.toFixed(2))]);
  }

  const option = {
    backgroundColor: '#1e222d',
    title: {
      text: '🟩 綠色 = 到期能賺錢的股價區間   │   🟥 紅色 = 到期會賠錢的股價區間',
      left: 'center',
      top: 10,
      textStyle: { color: '#b2b5be', fontSize: 13, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        // 白話文 Tooltip
        const price = params[0].value[0];
        const pnl = params[0].value[1];
        const isWin = pnl >= 0;
        const color = isWin ? '#26a69a' : '#ef5350';
        const status = isWin ? '獲利' : '虧損';
        return `如果到期時股價為: <b>$${price.toFixed(2)}</b><br/>這筆交易將會: <span style="color:${color};font-weight:bold;font-size:16px;">${status} $${Math.abs(pnl).toFixed(2)}</span>`;
      }
    },
    xAxis: {
      type: 'value',
      name: '到期時的股票價格',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#d1d4dc', fontSize: 14 },
      min: 'dataMin', 
      max: 'dataMax',
      axisLine: { lineStyle: { color: '#8c8f98' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '您的總賺賠 (USD)',
      nameTextStyle: { color: '#d1d4dc', fontSize: 14 },
      axisLine: { lineStyle: { color: '#8c8f98' } },
      splitLine: { lineStyle: { color: '#2b2b43' } }
    },
    // 🔥 利用 visualMap 正確為線條與面積上色
    visualMap: {
      show: false,
      dimension: 1, // 根據 Y 軸資料判斷
      pieces: [
        { min: 0, color: '#26a69a' }, // 大於等於 0 為綠色
        { max: 0, color: '#ef5350' }  // 小於 0 為紅色
      ]
    },
    series: [
      {
        data: chartData,
        type: 'line',
        symbol: 'none',
        lineStyle: { width: 4 },
        areaStyle: { opacity: 0.2 }, // 填充顏色，讓獲利/虧損區間一目了然
        markLine: {
          silent: true,
          symbol: 'none',
          label: { position: 'end', formatter: '{b}', color: '#fff' },
          data: [
            { yAxis: 0, lineStyle: { color: '#8c8f98', type: 'solid', width: 2 }, name: '不賺不賠線 (0元)' }
          ]
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 60,
          label: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
          data: [
            { type: 'max', name: '最多能賺', itemStyle: { color: '#26a69a' } },
            { type: 'min', name: '最多會賠', itemStyle: { color: '#ef5350' } }
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

/* 月曆區塊 */
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

/* 列表區塊 */
.trade-card { background-color: #2a2e39; border-left: 4px solid #8c8f98; padding: 16px; border-radius: 6px; margin-bottom: 12px; }
.trade-card.open { border-color: #e0ac00; }
.trade-card.win { border-color: #26a69a; }
.trade-card.loss { border-color: #ef5350; }
.trade-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.strategy-badge { background-color: #1e222d; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; color: #8c8f98; }
.trade-detail { font-size: 0.95rem; color: #b2b5be; margin-bottom: 6px; }
.strikes-detail { background-color: #131722; padding: 8px; border-radius: 4px; margin: 8px 0; }
.trade-card-actions { display: flex; gap: 8px; }
.action-btn { flex: 1; border: none; padding: 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: opacity 0.2s; }
.action-btn:hover { opacity: 0.8; }
.view-btn { background-color: #e0ac00; color: #131722; } 
.edit-btn { background-color: #2962ff; color: #fff; }
.delete-btn { background-color: rgba(239, 83, 80, 0.2); color: #ef5350; }

/* 表單區塊 */
.form-section { background-color: #1e222d; padding: 20px; border-radius: 8px; border: 1px solid #2b2b43; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.9rem; color: #8c8f98; }
.dark-input { background-color: #2a2e39; border: 1px solid #434651; color: #fff; padding: 10px; border-radius: 6px; outline: none; }
.dark-input:focus { border-color: #2962ff; }
.strikes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.strikes-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* 試算面板樣式 */
.calc-preview { background-color: #131722; border: 1px dashed #434651; padding: 16px; border-radius: 8px; }
.calc-title { color: #e0ac00; margin-top: 0; }
.fs-7 { font-size: 0.8rem; }

.submit-btn { background-color: #2962ff; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.submit-btn:hover { background-color: #1e4bd8; }
.cancel-btn { background-color: transparent; border: 1px solid #434651; color: #d1d4dc; padding: 12px; border-radius: 6px; cursor: pointer; }

/* Modal 樣式 */
.chart-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.8); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.chart-modal-content {
  background-color: #131722; border: 1px solid #2b2b43; border-radius: 12px;
  width: 90%; max-width: 900px; padding: 24px; box-shadow: 0 12px 48px rgba(0,0,0,0.5);
}
.close-btn { background: none; border: none; color: #8c8f98; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: #fff; }
</style>
