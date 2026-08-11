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
          
          <!-- 空白填充 -->
          <div v-for="blank in firstDayOffset" :key="'blank-' + blank" class="calendar-day empty"></div>
          
          <!-- 日期格子 -->
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

        <!-- 該日交易紀錄列表 -->
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
              <!-- 注意：資料庫欄位為 snake_case (entry_price) -->
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

          <!-- 垂直價差履約價 -->
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

          <!-- 鐵鷹履約價 -->
          <div v-if="form.strategy === 'ironCondor'" class="strikes-grid-4">
            <div class="form-group">
              <label class="text-success">買入 Put</label>
              <input type="number" step="0.5" v-model="form.strikes.longPut" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-danger">賣出 Put</label>
              <input type="number" step="0.5" v-model="form.strikes.shortPut" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-danger">賣出 Call</label>
              <input type="number" step="0.5" v-model="form.strikes.shortCall" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-success">買入 Call</label>
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
            <label class="text-warning">平倉成本 (Exit Debit / 點數) - 可留空表示未平倉</label>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// 匯入 Nuxt 3 的 Supabase 客戶端
const supabase = useSupabaseClient();

// --- 日曆狀態 ---
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

// --- 交易紀錄狀態 (改為串接 Supabase) ---
const allTrades = ref([]);

// 非同步抓取資料庫紀錄
const fetchTrades = async () => {
  const { data, error } = await supabase
    .from('options_journal')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('抓取資料庫失敗:', error);
  } else {
    allTrades.value = data || [];
  }
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

// --- 表單狀態 ---
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

// 新增與更新資料庫
const saveTrade = async () => {
  const tradeData = {
    date: selectedDateStr.value,
    ticker: form.value.ticker.toUpperCase(),
    strategy: form.value.strategy,
    expiry: form.value.expiry,
    strikes: form.value.strikes, // Supabase 會自動轉為 JSONB
    contracts: form.value.contracts,
    entry_price: form.value.entryPrice,
    exit_price: form.value.exitPrice !== '' && form.value.exitPrice !== null ? form.value.exitPrice : null,
  };

  // 結算狀態與損益計算: (收租 - 平倉) * 100 * 口數
  if (tradeData.exit_price !== null) {
    tradeData.status = 'closed';
    tradeData.pnl = ((tradeData.entry_price - tradeData.exit_price) * 100 * tradeData.contracts).toFixed(2);
  } else {
    tradeData.status = 'open';
    tradeData.pnl = 0;
  }

  if (isEditing.value) {
    // 更新既有紀錄
    const { error } = await supabase
      .from('options_journal')
      .update(tradeData)
      .eq('id', editingId.value);
      
    if (error) console.error('更新失敗:', error);
  } else {
    // 新增紀錄
    const { error } = await supabase
      .from('options_journal')
      .insert([tradeData]);
      
    if (error) console.error('新增失敗:', error);
  }

  await fetchTrades(); // 操作完成後重新抓取最新資料
  cancelEdit();
};

const editTrade = (trade) => {
  isEditing.value = true;
  editingId.value = trade.id;
  // 將資料庫的 snake_case 轉換回表單的 camelCase
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

// 從資料庫刪除
const deleteTrade = async (id) => {
  if (confirm('確定要刪除這筆交易紀錄嗎？')) {
    const { error } = await supabase
      .from('options_journal')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('刪除失敗:', error);
    } else {
      await fetchTrades();
      if (isEditing.value && editingId.value === id) cancelEdit();
    }
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = JSON.parse(JSON.stringify(initialForm));
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
.trade-detail { font-size: 0.9rem; color: #b2b5be; margin-bottom: 4px; }
.strikes-detail { background-color: #131722; padding: 6px; border-radius: 4px; margin: 6px 0; }
.trade-card-actions { display: flex; gap: 8px; }
.action-btn { flex: 1; border: none; padding: 6px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; }
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

.submit-btn { background-color: #2962ff; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.submit-btn:hover { background-color: #1e4bd8; }
.cancel-btn { background-color: transparent; border: 1px solid #434651; color: #d1d4dc; padding: 12px; border-radius: 6px; cursor: pointer; }
</style>
