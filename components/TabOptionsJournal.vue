<template>
  <div class="journal-dashboard">
    <div class="header">
      <h2 class="title">📖 選擇權貸方交易日誌 (Credit Spreads Journal)</h2>
      <div class="export-actions">
        <button class="export-btn csv" @click="exportCSV">📥 匯出 CSV (Excel用)</button>
        <button class="export-btn json" @click="exportJSON">📥 匯出 JSON (備份用)</button>
        <button class="export-btn import" @click="triggerImport">📤 匯入 JSON (還原)</button>
        <input type="file" ref="fileInput" accept=".json" style="display: none" @change="handleImport" />
      </div>
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
              <div class="trade-detail d-flex gap-3 mb-2">
                <span class="text-success">🟢 建倉: {{ trade.date }}</span>
                <span class="text-danger" v-if="trade.exit_date">🔴 平倉: {{ trade.exit_date }}</span>
                <span class="text-info">⏳ 到期: {{ trade.expiry }}</span>
              </div>
              
              <div class="trade-detail strikes-detail">
                履約價: 
                <span v-if="trade.strategy === 'bullPut'" class="fw-bold text-white">
                  Put (賣: {{ trade.strikes.shortPut }}, 買: {{ trade.strikes.longPut }})
                </span>
                <span v-if="trade.strategy === 'bearCall'" class="fw-bold text-white">
                  Call (賣: {{ trade.strikes.shortCall }}, 買: {{ trade.strikes.longCall }})
                </span>
                <span v-if="trade.strategy === 'ironCondor'" class="fw-bold text-white">
                  P(買:{{ trade.strikes.longPut }}, 賣:{{ trade.strikes.shortPut }}) / 
                  C(賣:{{ trade.strikes.shortCall }}, 買:{{ trade.strikes.longCall }})
                </span>
                <span v-if="trade.strategy === 'vertical'" class="fw-bold text-muted">
                  舊版紀錄 (S:{{ trade.strikes.short }}, L:{{ trade.strikes.long }})
                </span>
              </div>

              <div class="trade-detail">口數: {{ trade.contracts }}</div>
              <div class="trade-detail text-success" v-if="trade.entry_price !== null">
                建倉總收租 (Credit): ${{ Number(trade.entry_price).toFixed(2) }}
              </div>
              
              <!-- 🔥 新增：每口最大損益標示面板 -->
              <div class="risk-box mt-2 mb-2" v-if="trade.entry_price !== null">
                <div class="d-flex justify-content-between mb-1 text-success fs-7">
                  <span>✅ 最大收益 (總計 / 每口):</span>
                  <span class="fw-bold">
                    ${{ getTradeStats(trade).maxProfit.toFixed(2) }} 
                    <span class="text-muted opacity-75">(${{ getTradeStats(trade).perContractProfit.toFixed(2) }})</span>
                  </span>
                </div>
                <div class="d-flex justify-content-between text-danger fs-7">
                  <span>❌ 最大虧損 (總計 / 每口):</span>
                  <span class="fw-bold">
                    ${{ getTradeStats(trade).maxLoss.toFixed(2) }} 
                    <span class="text-muted opacity-75">(${{ getTradeStats(trade).perContractLoss.toFixed(2) }})</span>
                  </span>
                </div>
              </div>

              <!-- 平倉支出顯示 -->
              <div class="trade-detail text-warning" v-if="trade.strategy === 'ironCondor' && (trade.strikes.exitPut !== null || trade.strikes.exitCall !== null)">
                平倉支出 (Debit): 
                <span v-if="trade.strikes.exitPut !== null">Put端 ${{ Number(trade.strikes.exitPut).toFixed(2) }}</span>
                <span v-if="trade.strikes.exitPut !== null && trade.strikes.exitCall !== null"> | </span>
                <span v-if="trade.strikes.exitCall !== null">Call端 ${{ Number(trade.strikes.exitCall).toFixed(2) }}</span>
              </div>
              <div class="trade-detail text-warning" v-else-if="trade.strategy !== 'ironCondor' && trade.exit_price !== null">
                平倉成本 (Debit): ${{ Number(trade.exit_price).toFixed(2) }}
              </div>
              
              <div class="trade-pnl mt-3 pt-2 border-top border-secondary fw-bold fs-6" v-if="trade.status === 'closed' || trade.pnl !== 0">
                {{ trade.status === 'closed' ? '平倉最終損益' : '未平倉暫時損益' }}: 
                <span :class="trade.pnl >= 0 ? 'text-success' : 'text-danger'">
                  {{ trade.pnl >= 0 ? '+' : '' }}${{ trade.pnl }}
                </span>
              </div>
            </div>
            <div class="trade-card-actions mt-3">
              <button class="action-btn view-btn" @click="openPayoffChart(trade)">📊 預覽到期圖</button>
              <button class="action-btn edit-btn" @click="editTrade(trade)">編輯 / 登錄平倉</button>
              <button class="action-btn delete-btn" @click="deleteTrade(trade.id)">刪除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：新增/編輯表單 -->
      <div class="form-section">
        <h3 class="text-white mb-4 border-bottom border-secondary pb-2">
          {{ isEditing ? '✏️ 編輯交易' : '📝 新增交易' }} 
        </h3>
        
        <form @submit.prevent="saveTrade" class="trade-form">
          <div class="d-flex gap-3 mb-3">
            <div class="form-group flex-fill mb-0">
              <label>股票代號 (Ticker)</label>
              <input type="text" v-model="form.ticker" required placeholder="例: SPY" class="dark-input" />
            </div>
            <div class="form-group flex-fill mb-0">
              <label>建倉日期 (Open Date)</label>
              <input type="date" v-model="form.date" required class="dark-input" />
            </div>
          </div>

          <div class="form-group">
            <label>策略類型</label>
            <select v-model="form.strategy" class="dark-input" @change="resetStrikes">
              <option value="bullPut">📉 賣權多頭 (Bull Put Spread) - 看漲/盤整</option>
              <option value="bearCall">📈 買權空頭 (Bear Call Spread) - 看跌/盤整</option>
              <option value="ironCondor">🦅 鐵鷹 (Iron Condor) - 區間盤整</option>
            </select>
          </div>

          <div class="form-group">
            <label>到期日 (Expiration)</label>
            <input type="date" v-model="form.expiry" required class="dark-input" />
          </div>

          <div v-if="form.strategy === 'bullPut'" class="strikes-grid">
            <div class="form-group">
              <label class="text-danger">賣出 (Short) Put</label>
              <input type="number" step="0.5" v-model.number="form.strikes.shortPut" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-success">買入 (Long) Put</label>
              <input type="number" step="0.5" v-model.number="form.strikes.longPut" required class="dark-input" />
            </div>
          </div>

          <div v-if="form.strategy === 'bearCall'" class="strikes-grid">
            <div class="form-group">
              <label class="text-danger">賣出 (Short) Call</label>
              <input type="number" step="0.5" v-model.number="form.strikes.shortCall" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-success">買入 (Long) Call</label>
              <input type="number" step="0.5" v-model.number="form.strikes.longCall" required class="dark-input" />
            </div>
          </div>

          <div v-if="form.strategy === 'ironCondor'" class="strikes-grid-4">
            <div class="form-group">
              <label class="text-success">買入 Put</label>
              <input type="number" step="0.5" v-model.number="form.strikes.longPut" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-danger">賣出 Put</label>
              <input type="number" step="0.5" v-model.number="form.strikes.shortPut" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-danger">賣出 Call</label>
              <input type="number" step="0.5" v-model.number="form.strikes.shortCall" required class="dark-input" />
            </div>
            <div class="form-group">
              <label class="text-success">買入 Call</label>
              <input type="number" step="0.5" v-model.number="form.strikes.longCall" required class="dark-input" />
            </div>
          </div>

          <div class="form-group">
            <label>交易口數 (Contracts)</label>
            <input type="number" min="1" v-model.number="form.contracts" required class="dark-input" />
          </div>

          <div class="form-group">
            <label class="text-success">建倉總收租 (Total Credit / 點數)</label>
            <input type="number" step="0.01" v-model.number="form.entryPrice" required class="dark-input" />
          </div>

          <div class="border-top border-secondary pt-3 mt-2">
            <h5 class="text-warning mb-3">🚪 平倉紀錄區 (未平倉請留空)</h5>
            
            <div class="form-group">
              <label class="text-warning">平倉日期 (Close Date)</label>
              <input type="date" v-model="form.exitDate" class="dark-input" />
            </div>

            <div class="form-group" v-if="form.strategy !== 'ironCondor'">
              <label class="text-warning">平倉支出成本 (Exit Debit)</label>
              <input type="number" step="0.01" v-model.number="form.exitPrice" class="dark-input" placeholder="若到期歸零請填 0" />
            </div>

            <div class="strikes-grid" v-if="form.strategy === 'ironCondor'">
              <div class="form-group">
                <label class="text-warning">Put 邊平倉支出 (Debit)</label>
                <input type="number" step="0.01" v-model.number="form.strikes.exitPut" class="dark-input" placeholder="若到期歸零請填 0" />
              </div>
              <div class="form-group">
                <label class="text-warning">Call 邊平倉支出 (Debit)</label>
                <input type="number" step="0.01" v-model.number="form.strikes.exitCall" class="dark-input" placeholder="若到期歸零請填 0" />
              </div>
            </div>
          </div>

          <!-- 試算預覽面板 -->
          <div class="calc-preview mt-3" v-if="formStats">
            <h5 class="calc-title mb-3">💡 交易試算預覽</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">到期最大收益 (總計 / 每口):</span>
              <span class="text-success fw-bold">
                ${{ formStats.maxProfit.toFixed(2) }} 
                <span class="fs-7 text-muted">(${{ formStats.perContractProfit.toFixed(2) }})</span>
              </span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">到期最大虧損 (總計 / 每口):</span>
              <span class="text-danger fw-bold">
                ${{ formStats.maxLoss.toFixed(2) }} 
                <span class="fs-7 text-muted">(${{ formStats.perContractLoss.toFixed(2) }})</span>
              </span>
            </div>
            
            <div v-if="formStats.exitDetails" class="pt-2 mt-2 border-top border-secondary">
              <div class="text-white mb-2 fw-bold">👉 平倉實際損益拆解：</div>
              <div class="d-flex justify-content-between fs-7 mb-1 text-success">
                <span>➕ 建倉總收租:</span>
                <span>${{ formStats.maxProfit.toFixed(2) }}</span>
              </div>
              
              <template v-if="form.strategy === 'ironCondor'">
                <div class="d-flex justify-content-between fs-7 mb-1 text-danger" v-if="form.strikes.exitPut !== null && form.strikes.exitPut !== ''">
                  <span>➖ Put 邊支出:</span>
                  <span>-${{ (form.strikes.exitPut * 100 * form.contracts).toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between fs-7 mb-1 text-danger" v-if="form.strikes.exitCall !== null && form.strikes.exitCall !== ''">
                  <span>➖ Call 邊支出:</span>
                  <span>-${{ (form.strikes.exitCall * 100 * form.contracts).toFixed(2) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="d-flex justify-content-between fs-7 mb-1 text-danger">
                  <span>➖ 平倉總支出:</span>
                  <span>-${{ (form.exitPrice * 100 * form.contracts).toFixed(2) }}</span>
                </div>
              </template>

              <div class="d-flex justify-content-between mt-2 pt-2 border-top border-secondary">
                <span class="text-white">{{ formStats.exitDetails.statusText }}</span>
                <span class="fw-bold fs-5" :class="formStats.exitDetails.pnl >= 0 ? 'text-success' : 'text-danger'">
                  {{ formStats.exitDetails.pnl >= 0 ? '+' : '' }}${{ formStats.exitDetails.pnl.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <div class="form-actions mt-4">
            <button type="submit" class="submit-btn w-100">
              {{ isEditing ? '儲存紀錄' : '新增紀錄' }}
            </button>
            <button type="button" v-if="isEditing" @click="cancelEdit" class="cancel-btn w-100 mt-2">
              取消編輯
            </button>
          </div>
        </form>
      </div>
    </div>

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
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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

onMounted(() => { fetchTrades(); });

const dailyTrades = computed(() => { return allTrades.value.filter(t => t.date === selectedDateStr.value); });
const hasTradeOnDate = (day) => {
  const checkDate = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return allTrades.value.some(t => t.date === checkDate);
};

const getStrategyName = (val) => {
  if (val === 'bullPut') return '賣權多頭 (Bull Put)';
  if (val === 'bearCall') return '買權空頭 (Bear Call)';
  if (val === 'ironCondor') return '鐵鷹 (Iron Condor)';
  return '垂直價差 (舊版)';
};

const isEditing = ref(false);
const editingId = ref(null);

const initialForm = {
  date: '',
  ticker: '',
  strategy: 'bullPut',
  expiry: '',
  strikes: { shortPut: null, longPut: null, shortCall: null, longCall: null, exitPut: null, exitCall: null },
  contracts: 1,
  entryPrice: null,
  exitPrice: null,
  exitDate: ''
};
const form = ref(JSON.parse(JSON.stringify(initialForm)));

watch(selectedDateStr, (newVal) => {
  if (!isEditing.value) form.value.date = newVal;
}, { immediate: true });

const resetStrikes = () => {
  form.value.strikes = { shortPut: null, longPut: null, shortCall: null, longCall: null, exitPut: null, exitCall: null };
};

const getSafeStrikes = (strategy, strikes) => {
  let sP = Number(strikes.shortPut) || 0;
  let lP = Number(strikes.longPut) || 0;
  let sC = Number(strikes.shortCall) || 0;
  let lC = Number(strikes.longCall) || 0;

  if (strategy === 'bullPut' || strategy === 'ironCondor') {
    const min = Math.min(sP, lP);
    const max = Math.max(sP, lP);
    lP = min; sP = max;
  }
  if (strategy === 'bearCall' || strategy === 'ironCondor') {
    const min = Math.min(sC, lC);
    const max = Math.max(sC, lC);
    sC = min; lC = max;
  }
  let s = Number(strikes.short) || 0;
  let l = Number(strikes.long) || 0;

  return { sP, lP, sC, lC, s, l };
};

// 🔥 計算已存檔交易紀錄的最大損益 (用於卡片顯示)
const getTradeStats = (trade) => {
  if (trade.entry_price === null) return { maxProfit: 0, maxLoss: 0, perContractProfit: 0, perContractLoss: 0 };
  
  const { sP, lP, sC, lC, s, l } = getSafeStrikes(trade.strategy, trade.strikes);
  let width = 0;

  if (trade.strategy === 'bullPut') width = sP - lP;
  else if (trade.strategy === 'bearCall') width = lC - sC;
  else if (trade.strategy === 'ironCondor') width = Math.max(sP - lP, lC - sC);
  else if (trade.strategy === 'vertical') width = Math.abs(s - l);

  const perContractProfit = trade.entry_price * 100;
  const perContractLoss = Math.max(0, width - trade.entry_price) * 100;
  
  return {
    maxProfit: perContractProfit * trade.contracts,
    maxLoss: perContractLoss * trade.contracts,
    perContractProfit,
    perContractLoss
  };
};

const formStats = computed(() => {
  const c = form.value;
  if (!c.entryPrice || !c.contracts) return null;

  const { sP, lP, sC, lC, s, l } = getSafeStrikes(c.strategy, c.strikes);
  let width = 0;

  if (c.strategy === 'bullPut') width = sP - lP;
  else if (c.strategy === 'bearCall') width = lC - sC;
  else if (c.strategy === 'ironCondor') width = Math.max(sP - lP, lC - sC);
  else if (c.strategy === 'vertical') width = Math.abs(s - l);

  const perContractProfit = c.entryPrice * 100;
  const perContractLoss = Math.max(0, width - c.entryPrice) * 100;
  
  const maxProfit = perContractProfit * c.contracts;
  const maxLoss = perContractLoss * c.contracts;
  
  let exitDetails = null;

  if (c.strategy === 'ironCondor') {
    const hasPutExit = c.strikes.exitPut !== null && c.strikes.exitPut !== '';
    const hasCallExit = c.strikes.exitCall !== null && c.strikes.exitCall !== '';
    
    if (hasPutExit || hasCallExit) {
      const putCost = hasPutExit ? Number(c.strikes.exitPut) : 0;
      const callCost = hasCallExit ? Number(c.strikes.exitCall) : 0;
      const pnl = (c.entryPrice - putCost - callCost) * 100 * c.contracts;
      
      let statusText = '總計淨損益:';
      if (hasPutExit && !hasCallExit) statusText = '單邊平倉 (Put) 暫時損益:';
      if (!hasPutExit && hasCallExit) statusText = '單邊平倉 (Call) 暫時損益:';
      
      exitDetails = { pnl, statusText };
    }
  } else {
    if (c.exitPrice !== null && c.exitPrice !== '') {
      const pnl = (c.entryPrice - c.exitPrice) * 100 * c.contracts;
      exitDetails = { pnl, statusText: '平倉總淨損益:' };
    }
  }

  // 防止虧損算出負數 (防呆)
  if (width > 0 && width < c.entryPrice) return null; 

  return { width, maxProfit, maxLoss, perContractProfit, perContractLoss, exitDetails };
});

const saveTrade = async () => {
  let isClosed = false;
  let totalExitPrice = null;
  let pnl = 0;

  if (form.value.strategy === 'ironCondor') {
    const hasPut = form.value.strikes.exitPut !== null && form.value.strikes.exitPut !== '';
    const hasCall = form.value.strikes.exitCall !== null && form.value.strikes.exitCall !== '';
    if (hasPut || hasCall) {
      totalExitPrice = Number(form.value.strikes.exitPut || 0) + Number(form.value.strikes.exitCall || 0);
      pnl = (form.value.entryPrice - totalExitPrice) * 100 * form.value.contracts;
    }
    if (hasPut && hasCall) isClosed = true;
  } else {
    if (form.value.exitPrice !== null && form.value.exitPrice !== '') {
      totalExitPrice = Number(form.value.exitPrice);
      pnl = (form.value.entryPrice - totalExitPrice) * 100 * form.value.contracts;
      isClosed = true;
    }
  }

  const tradeData = {
    date: form.value.date, 
    ticker: form.value.ticker.toUpperCase(),
    strategy: form.value.strategy,
    expiry: form.value.expiry,
    strikes: form.value.strikes, 
    contracts: form.value.contracts,
    entry_price: form.value.entryPrice,
    exit_price: totalExitPrice,
    exit_date: form.value.exitDate ? form.value.exitDate : null, 
    status: isClosed ? 'closed' : 'open',
    pnl: Number(pnl.toFixed(2))
  };

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
    date: trade.date,
    ticker: trade.ticker,
    strategy: trade.strategy,
    expiry: trade.expiry,
    strikes: {
      ...trade.strikes,
      exitPut: trade.strikes.exitPut ?? null,
      exitCall: trade.strikes.exitCall ?? null
    },
    contracts: trade.contracts,
    entryPrice: trade.entry_price,
    exitPrice: trade.exit_price !== null ? trade.exit_price : '',
    exitDate: trade.exit_date || ''
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
  form.value.date = selectedDateStr.value; 
};

// ==========================================
// 匯出 / 匯入功能邏輯
// ==========================================
const fileInput = ref(null);

const exportJSON = () => {
  if (allTrades.value.length === 0) return alert('目前沒有紀錄可以匯出！');
  const dataStr = JSON.stringify(allTrades.value, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MacroWave_Options_Journal_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportCSV = () => {
  if (allTrades.value.length === 0) return alert('目前沒有紀錄可以匯出！');
  const headers = ['id', 'date', 'ticker', 'strategy', 'expiry', 'strikes', 'contracts', 'entry_price', 'exit_price', 'exit_date', 'status', 'pnl'];
  
  const rows = allTrades.value.map(t => {
    return headers.map(h => {
      let val = t[h];
      if (h === 'strikes') val = JSON.stringify(val); 
      if (val === null || val === undefined) val = '';
      val = `"${String(val).replace(/"/g, '""')}"`;
      return val;
    }).join(',');
  });

  const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n'); 
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MacroWave_Options_Journal_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const triggerImport = () => {
  if (confirm('⚠️ 警告：匯入功能將會覆蓋/更新您現有的資料庫紀錄。請確認您上傳的是之前匯出的 JSON 備份檔。是否繼續？')) {
    fileInput.value.click();
  }
};

const handleImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target.result;
      const importedData = JSON.parse(content);

      if (!Array.isArray(importedData)) throw new Error("資料格式錯誤，必須為陣列結構。");

      const { error } = await supabase.from('options_journal').upsert(importedData);
      if (error) throw error;

      alert(`✅ 成功匯入並同步了 ${importedData.length} 筆交易紀錄至資料庫！`);
      await fetchTrades(); 
    } catch (err) {
      alert("❌ 匯入失敗，請確認檔案格式是否正確。\n錯誤訊息：" + err.message);
    }
    event.target.value = ''; 
  };
  reader.readAsText(file);
};

// ==========================================
// 📊 到期損益圖 (Payoff Diagram)
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
  
  const { sP, lP, sC, lC, s, l } = getSafeStrikes(strategy, strikes);
  
  let minStrike = Infinity, maxStrike = -Infinity;

  if (strategy === 'bullPut') {
    minStrike = lP; maxStrike = sP;
  } else if (strategy === 'bearCall') {
    minStrike = sC; maxStrike = lC;
  } else if (strategy === 'ironCondor') {
    minStrike = lP; maxStrike = lC;
  } else if (strategy === 'vertical') { 
    minStrike = Math.min(s, l); maxStrike = Math.max(s, l);
  }

  const xData = [];
  const yData = [];
  
  const startPrice = minStrike * 0.85; 
  const endPrice = maxStrike * 1.15;   
  const step = (endPrice - startPrice) / 400; 

  for (let p = startPrice; p <= endPrice; p += step) {
    let pnl = 0;
    
    if (strategy === 'bullPut') {
      pnl = (entry_price - Math.max(sP - p, 0) + Math.max(lP - p, 0)) * multiplier;
    } else if (strategy === 'bearCall') {
      pnl = (entry_price - Math.max(p - sC, 0) + Math.max(p - lC, 0)) * multiplier;
    } else if (strategy === 'ironCondor') {
      pnl = (entry_price 
             - Math.max(sP - p, 0) 
             + Math.max(lP - p, 0) 
             - Math.max(p - sC, 0) 
             + Math.max(p - lC, 0)) * multiplier;
    } else if (strategy === 'vertical') {
      const isCallSpread = s < l;
      if (isCallSpread) pnl = (entry_price - Math.max(p - s, 0) + Math.max(p - l, 0)) * multiplier;
      else pnl = (entry_price - Math.max(s - p, 0) + Math.max(l - p, 0)) * multiplier;
    }
    
    xData.push(p.toFixed(2));
    yData.push(Number(pnl.toFixed(2)));
  }

  const option = {
    backgroundColor: '#1e222d',
    title: {
      text: '背景 🟩 亮綠色 = 獲利區間   │   背景 🟥 淡紅色 = 虧損區間',
      left: 'center',
      top: 10,
      textStyle: { color: '#b2b5be', fontSize: 13, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        const price = params[0].name;
        const pnl = Number(params[0].value);
        const color = pnl >= 0 ? '#26a69a' : '#ef5350';
        const status = pnl >= 0 ? '獲利' : '虧損';
        return `如果到期時股價為: <b>$${price}</b><br/>這筆交易將會: <span style="color:${color};font-weight:bold;font-size:16px;">${status} $${Math.abs(pnl).toFixed(2)}</span>`;
      }
    },
    xAxis: {
      type: 'category', 
      name: '到期時的股票價格',
      nameLocation: 'middle',
      nameGap: 30,
      data: xData,
      axisLine: { lineStyle: { color: '#8c8f98' } },
      axisLabel: {
        formatter: (value, index) => {
          return index % 40 === 0 ? value : ''; 
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '您的總賺賠 (USD)',
      axisLine: { lineStyle: { color: '#8c8f98' } },
      splitLine: { lineStyle: { color: '#2b2b43' } }
    },
    series: [
      {
        data: yData,
        type: 'line',
        symbol: 'none',
        itemStyle: { color: '#e0ac00' }, 
        lineStyle: { width: 4 },
        markArea: {
          silent: true,
          data: [
            [ { yAxis: 0, itemStyle: { color: 'rgba(38, 166, 154, 0.15)' } }, { yAxis: 'max' } ],
            [ { yAxis: 'min', itemStyle: { color: 'rgba(239, 83, 80, 0.15)' } }, { yAxis: 0 } ]
          ]
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { position: 'end', formatter: '{b}', color: '#fff' },
          data: [
            { yAxis: 0, lineStyle: { color: '#d1d4dc', type: 'solid', width: 2 }, name: '不賺不賠線 (0元)' }
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
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.title { font-size: 1.5rem; font-weight: 600; color: #fff; margin: 0; }

.export-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.export-btn { 
  background: transparent; border: 1px solid #434651; color: #d1d4dc; 
  padding: 8px 16px; border-radius: 6px; font-size: 0.9rem; font-weight: bold; 
  cursor: pointer; transition: all 0.2s; 
}
.export-btn:hover { background: #2a2e39; color: #fff; }
.export-btn.csv:hover { border-color: #00bcd4; color: #00bcd4; }
.export-btn.json:hover { border-color: #26a69a; color: #26a69a; }
.export-btn.import:hover { border-color: #e0ac00; color: #e0ac00; }

.journal-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
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
.trade-detail { font-size: 0.95rem; color: #b2b5be; margin-bottom: 6px; }
.strikes-detail { background-color: #131722; padding: 8px; border-radius: 4px; margin: 8px 0; border-left: 3px solid #2962ff; }
/* 🔥 風險面板樣式 */
.risk-box { background: rgba(0,0,0,0.25); padding: 10px; border-radius: 4px; border: 1px solid #434651; }
.fs-7 { font-size: 0.8rem; }
.trade-card-actions { display: flex; gap: 8px; }
.action-btn { flex: 1; border: none; padding: 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: opacity 0.2s; }
.action-btn:hover { opacity: 0.8; }
.view-btn { background-color: #e0ac00; color: #131722; } 
.edit-btn { background-color: #2962ff; color: #fff; }
.delete-btn { background-color: rgba(239, 83, 80, 0.2); color: #ef5350; }

.form-section { background-color: #1e222d; padding: 20px; border-radius: 8px; border: 1px solid #2b2b43; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.9rem; color: #8c8f98; }
.dark-input { background-color: #2a2e39; border: 1px solid #434651; color: #fff; padding: 10px; border-radius: 6px; outline: none; }
.dark-input:focus { border-color: #2962ff; }
.strikes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.strikes-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.calc-preview { background-color: #131722; border: 1px dashed #434651; padding: 16px; border-radius: 8px; }
.calc-title { color: #e0ac00; margin-top: 0; }

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
