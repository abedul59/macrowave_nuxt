<template>
  <div class="journal-dashboard">
    <!-- 頂部標題與匯出功能 -->
    <div class="header">
      <h2 class="title m-0">📖 選擇權貸方交易日誌</h2>
      <div class="export-actions">
        <button class="export-btn csv" @click="exportCSV">📥 匯出 CSV</button>
        <button class="export-btn json" @click="exportJSON">📥 匯出 JSON</button>
        <button class="export-btn import" @click="triggerImport">📤 匯入 JSON</button>
        <input type="file" ref="fileInput" accept=".json" style="display: none" @change="handleImport" />
      </div>
    </div>
      
    <!-- 雙模式切換按鈕 -->
    <div class="view-toggles mt-3 mb-2">
      <button class="view-btn" :class="{ active: viewMode === 'calendar' }" @click="viewMode = 'calendar'">
        📅 交易日曆與編輯
      </button>
      <button class="view-btn" :class="{ active: viewMode === 'summary' }" @click="viewMode = 'summary'">
        🎯 到期結算總覽
      </button>
    </div>

    <!-- ========================================== -->
    <!-- 模式一：交易日曆與編輯 -->
    <!-- ========================================== -->
    <div class="journal-layout mt-3" v-if="viewMode === 'calendar'">
      
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
            <div class="trade-card-header flex-wrap gap-2">
              <span class="fw-bold text-white fs-5">{{ trade.ticker }}</span>
              <span class="strategy-badge">{{ getStrategyName(trade.strategy) }}</span>
            </div>
            <div class="trade-card-body">
              <div class="trade-detail d-flex flex-wrap gap-3 mb-2">
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
            <!-- 手機版按鈕會自動折行堆疊 -->
            <div class="trade-card-actions mt-3 flex-wrap">
              <button class="action-btn view-btn flex-fill" @click="openPayoffChart(trade)">📊 預覽到期圖</button>
              <button class="action-btn edit-btn flex-fill" @click="editTrade(trade)">編輯 / 登錄平倉</button>
              <button class="action-btn delete-btn flex-fill" @click="deleteTrade(trade.id)">刪除</button>
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
          <div class="d-flex flex-wrap gap-3 mb-3">
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
              <option value="bullPut">📉 賣權多頭 (Bull Put Spread)</option>
              <option value="bearCall">📈 買權空頭 (Bear Call Spread)</option>
              <option value="ironCondor">🦅 鐵鷹 (Iron Condor)</option>
            </select>
          </div>

          <div class="form-group">
            <label>到期日 (Expiration)</label>
            <input type="date" v-model="form.expiry" required class="dark-input" />
          </div>

          <!-- 手機版自動切換單列或雙列 -->
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

          <div class="d-flex flex-wrap gap-3">
            <div class="form-group flex-fill">
              <label>口數 (Contracts)</label>
              <input type="number" min="1" v-model.number="form.contracts" required class="dark-input" />
            </div>
            <div class="form-group flex-fill">
              <label class="text-success">每口建倉收租 (Credit)</label>
              <input type="number" step="0.01" v-model.number="form.entryPrice" required class="dark-input" />
            </div>
          </div>

          <div class="border-top border-secondary pt-3 mt-2">
            <h5 class="text-warning mb-3">🚪 平倉紀錄區 (未平倉請留空)</h5>
            
            <div class="form-group">
              <label class="text-warning">平倉日期 (Close Date)</label>
              <input type="date" v-model="form.exitDate" class="dark-input" />
            </div>

            <div class="form-group" v-if="form.strategy !== 'ironCondor'">
              <label class="text-warning">每口平倉支出成本 (Exit Debit)</label>
              <input type="number" step="0.01" v-model.number="form.exitPrice" class="dark-input" placeholder="歸零請填 0" />
            </div>

            <div class="strikes-grid" v-if="form.strategy === 'ironCondor'">
              <div class="form-group">
                <label class="text-warning">Put 邊每口平倉支出</label>
                <input type="number" step="0.01" v-model.number="form.strikes.exitPut" class="dark-input" placeholder="歸零請填 0" />
              </div>
              <div class="form-group">
                <label class="text-warning">Call 邊每口平倉支出</label>
                <input type="number" step="0.01" v-model.number="form.strikes.exitCall" class="dark-input" placeholder="歸零請填 0" />
              </div>
            </div>
          </div>

          <div class="calc-preview mt-3" v-if="formStats">
            <h5 class="calc-title mb-3">💡 交易試算預覽</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">到期最大收益:</span>
              <span class="text-success fw-bold">${{ formStats.maxProfit.toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">到期最大虧損:</span>
              <span class="text-danger fw-bold">${{ formStats.maxLoss.toFixed(2) }}</span>
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

    <!-- ========================================== -->
    <!-- 模式二：到期結算總覽介面 -->
    <!-- ========================================== -->
    <div v-else-if="viewMode === 'summary'" class="summary-layout mt-3">
      <div v-if="expirySummary.length === 0" class="text-muted text-center p-5 fs-5">
        目前沒有任何交易紀錄
      </div>

      <div v-for="group in expirySummary" :key="group.expiry" class="expiry-group-card mb-4">
        <div class="expiry-header">
          <h3 class="m-0 text-white mb-3">⌛ <span class="text-warning">到期日:</span> {{ group.expiry }}</h3>
          <div class="summary-stats d-flex flex-wrap gap-2">
            <div class="stat-item text-success flex-fill">
              <div class="fs-7 opacity-75">✅ 該群組建倉總收租</div>
              <div>${{ group.totalCredit.toFixed(2) }}</div>
            </div>
            <div class="stat-item text-info flex-fill">
              <div class="fs-7 opacity-75">⏳ 未平倉剩餘價值</div>
              <div>${{ group.openCredit.toFixed(2) }}</div>
            </div>
            <div class="stat-item flex-fill" :class="group.realizedPnL >= 0 ? 'text-success' : 'text-danger'">
              <div class="fs-7 opacity-75">🚪 已提前平倉實際損益</div>
              <div>{{ group.realizedPnL >= 0 ? '+' : '' }}${{ group.realizedPnL.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <div class="table-responsive mt-3">
          <table class="summary-table w-100">
            <thead>
              <tr>
                <th>狀態</th>
                <th>代號</th>
                <th>策略</th>
                <th>履約價細節</th>
                <th>口數</th>
                <th>每口收租</th>
                <th>該筆總收租</th>
                <th>提前平倉損益</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trade in group.trades" :key="trade.id" :class="trade.status === 'closed' ? 'dimmed-row' : ''">
                <td>
                  <span class="badge" :class="trade.status === 'closed' ? 'bg-secondary' : 'bg-primary'">
                    {{ trade.status === 'closed' ? '已平倉' : '持倉中' }}
                  </span>
                </td>
                <td class="fw-bold text-white">{{ trade.ticker }}</td>
                <td class="text-muted">{{ getStrategyName(trade.strategy) }}</td>
                <td class="fs-7">
                  <span v-if="trade.strategy === 'bullPut'">P(賣:{{trade.strikes.shortPut}}, 買:{{trade.strikes.longPut}})</span>
                  <span v-else-if="trade.strategy === 'bearCall'">C(賣:{{trade.strikes.shortCall}}, 買:{{trade.strikes.longCall}})</span>
                  <span v-else-if="trade.strategy === 'ironCondor'">P(買:{{trade.strikes.longPut}}, 賣:{{trade.strikes.shortPut}}) / C(賣:{{trade.strikes.shortCall}}, 買:{{trade.strikes.longCall}})</span>
                  <span v-else>S:{{trade.strikes.short}}, L:{{trade.strikes.long}}</span>
                </td>
                <td>{{ trade.contracts }}</td>
                <td class="text-success">${{ Number(trade.entry_price).toFixed(2) }}</td>
                <td class="text-success fw-bold">${{ (trade.entry_price * 100 * trade.contracts).toFixed(2) }}</td>
                <td>
                  <span v-if="trade.status === 'closed'" class="fw-bold" :class="trade.pnl >= 0 ? 'text-success' : 'text-danger'">
                    {{ trade.pnl >= 0 ? '+' : '' }}${{ trade.pnl.toFixed(2) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 到期損益圖 Modal -->
    <div v-if="isChartModalOpen" class="chart-modal-overlay" @click.self="closePayoffChart">
      <div class="chart-modal-content">
        <div class="chart-modal-header border-bottom border-secondary pb-3 mb-3 d-flex justify-content-between align-items-center">
          <h4 class="m-0 fw-bold text-white fs-5">📊 {{ chartTradeData?.ticker }} 到期損益圖</h4>
          <button class="close-btn" @click="closePayoffChart">✖</button>
        </div>
        <div class="chart-modal-body">
          <div id="payoff-chart" style="width: 100%; height: 400px;"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import * as echarts from 'echarts';

const supabase = useSupabaseClient();
const viewMode = ref('calendar');

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

const expirySummary = computed(() => {
  const groups = {};
  allTrades.value.forEach(trade => {
    const exp = trade.expiry;
    if (!groups[exp]) {
      groups[exp] = { expiry: exp, trades: [], totalCredit: 0, realizedPnL: 0, openCredit: 0 };
    }
    groups[exp].trades.push(trade);
    const credit = (trade.entry_price || 0) * 100 * trade.contracts;
    groups[exp].totalCredit += credit;
    if (trade.status === 'closed') {
      groups[exp].realizedPnL += (trade.pnl || 0);
    } else {
      groups[exp].openCredit += credit;
    }
  });
  return Object.values(groups).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
});

const getStrategyName = (val) => {
  if (val === 'bullPut') return '賣權多頭 (Bull Put)';
  if (val === 'bearCall') return '買權空頭 (Bear Call)';
  if (val === 'ironCondor') return '鐵鷹 (Iron Condor)';
  return '垂直價差';
};

const isEditing = ref(false);
const editingId = ref(null);

const initialForm = {
  date: '', ticker: '', strategy: 'bullPut', expiry: '',
  strikes: { shortPut: null, longPut: null, shortCall: null, longCall: null, exitPut: null, exitCall: null },
  contracts: 1, entryPrice: null, exitPrice: null, exitDate: ''
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
    const min = Math.min(sP, lP), max = Math.max(sP, lP);
    lP = min; sP = max;
  }
  if (strategy === 'bearCall' || strategy === 'ironCondor') {
    const min = Math.min(sC, lC), max = Math.max(sC, lC);
    sC = min; lC = max;
  }
  let s = Number(strikes.short) || 0, l = Number(strikes.long) || 0;
  return { sP, lP, sC, lC, s, l };
};

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
    perContractProfit, perContractLoss
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

  if (width > 0 && width < c.entryPrice) return null; 
  return { width, maxProfit, maxLoss, perContractProfit, perContractLoss, exitDetails };
});

const saveTrade = async () => {
  let isClosed = false, totalExitPrice = null, pnl = 0;

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
  viewMode.value = 'calendar'; 
  
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
      pnl = (entry_price - Math.max(sP - p, 0) + Math.max(lP - p, 0) - Math.max(p - sC, 0) + Math.max(p - lC, 0)) * multiplier;
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
      textStyle: { color: '#b2b5be', fontSize: 11, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        const price = params[0].name;
        const pnl = Number(params[0].value);
        const color = pnl >= 0 ? '#26a69a' : '#ef5350';
        const status = pnl >= 0 ? '獲利' : '虧損';
        return `如果到期時股價為: <b>$${price}</b><br/>這筆交易將會: <span style="color:${color};font-weight:bold;font-size:14px;">${status} $${Math.abs(pnl).toFixed(2)}</span>`;
      }
    },
    xAxis: {
      type: 'category', 
      name: '到期時股價',
      nameLocation: 'middle',
      nameGap: 25,
      data: xData,
      axisLine: { lineStyle: { color: '#8c8f98' } },
      axisLabel: { formatter: (value, index) => { return index % 50 === 0 ? value : ''; } }
    },
    yAxis: {
      type: 'value',
      name: '總賺賠',
      axisLine: { lineStyle: { color: '#8c8f98' } },
      splitLine: { lineStyle: { color: '#2b2b43' } }
    },
    series: [
      {
        data: yData,
        type: 'line',
        symbol: 'none',
        itemStyle: { color: '#e0ac00' }, 
        lineStyle: { width: 3 },
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
          data: [ { yAxis: 0, lineStyle: { color: '#d1d4dc', type: 'solid', width: 2 }, name: '0' } ]
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 45,
          label: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
          data: [
            { type: 'max', name: 'Max', itemStyle: { color: '#26a69a' } },
            { type: 'min', name: 'Min', itemStyle: { color: '#ef5350' } }
          ]
        }
      }
    ]
  };

  payoffChartInstance.setOption(option);
};
</script>

<style scoped>
/* =====================================
   行動端優先 (Mobile-First) CSS 設計
   ===================================== */
.journal-dashboard {
  background-color: #131722; color: #d1d4dc; padding: 16px;
  border-radius: 12px; font-family: -apple-system, sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); margin: 0 auto;
}
.header { display: flex; flex-direction: column; gap: 12px; }
.title { font-size: 1.3rem; font-weight: 600; color: #fff; margin: 0; }

/* 匯出按鈕區塊 (滿版自適應) */
.export-actions { display: flex; gap: 8px; flex-wrap: wrap; width: 100%; }
.export-btn { 
  flex: 1; min-width: 100px; text-align: center;
  background: transparent; border: 1px solid #434651; color: #d1d4dc; 
  padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: bold; 
  cursor: pointer; transition: all 0.2s; 
}
.export-btn:hover { background: #2a2e39; color: #fff; }
.export-btn.csv:hover { border-color: #00bcd4; color: #00bcd4; }
.export-btn.json:hover { border-color: #26a69a; color: #26a69a; }
.export-btn.import:hover { border-color: #e0ac00; color: #e0ac00; }

/* 雙模式切換按鈕 (滿版切換) */
.view-toggles { display: flex; flex-direction: column; gap: 8px; width: 100%; border-bottom: 1px solid #2b2b43; padding-bottom: 16px; }
.view-btn { 
  width: 100%; padding: 12px; background-color: #1e222d; border: 1px solid #434651; 
  color: #8c8f98; border-radius: 6px; cursor: pointer; transition: 0.2s; font-weight: bold; font-size: 1rem;
}
.view-btn.active { background-color: #2962ff; color: #fff; border-color: #2962ff; }

/* 佈局切換：手機單行，電腦雙列 */
.journal-layout { display: grid; grid-template-columns: 1fr; gap: 24px; }

/* 左側：日曆與卡片 */
.calendar-section { background-color: #1e222d; padding: 16px; border-radius: 8px; border: 1px solid #2b2b43; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.current-month { color: #fff; font-size: 1.1rem; margin: 0; }
.btn-icon { background: #2a2e39; border: 1px solid #434651; color: #d1d4dc; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.weekday { color: #8c8f98; font-size: 0.8rem; margin-bottom: 4px; }
.calendar-day { 
  aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background-color: #2a2e39; border-radius: 6px; cursor: pointer; border: 1px solid transparent; 
}
.calendar-day.empty { background-color: transparent; cursor: default; }
.calendar-day.active { background-color: rgba(41, 98, 255, 0.2); border-color: #2962ff; color: #fff; font-weight: bold; }
.calendar-day.today .day-number { color: #26a69a; font-weight: bold; text-decoration: underline; }
.trade-dots { display: flex; gap: 2px; margin-top: 2px; }
.dot { width: 4px; height: 4px; background-color: #e0ac00; border-radius: 50%; }

/* 交易卡片 */
.trade-card { background-color: #2a2e39; border-left: 4px solid #8c8f98; padding: 16px; border-radius: 6px; margin-bottom: 12px; }
.trade-card.open { border-color: #e0ac00; }
.trade-card.win { border-color: #26a69a; }
.trade-card.loss { border-color: #ef5350; }
.trade-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.strategy-badge { background-color: #1e222d; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; color: #8c8f98; }
.trade-detail { font-size: 0.9rem; color: #b2b5be; margin-bottom: 6px; word-break: break-all; }
.strikes-detail { background-color: #131722; padding: 8px; border-radius: 4px; margin: 8px 0; border-left: 3px solid #2962ff; }

/* 風險面板 */
.risk-box { background: rgba(0,0,0,0.25); padding: 10px; border-radius: 4px; border: 1px solid #434651; }
.fs-7 { font-size: 0.8rem; }

/* 卡片操作按鈕 (手機折行滿版) */
.trade-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.action-btn { flex: 1; min-width: 80px; border: none; padding: 10px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; cursor: pointer; }
.view-btn { background-color: #e0ac00; color: #131722; } 
.edit-btn { background-color: #2962ff; color: #fff; }
.delete-btn { background-color: rgba(239, 83, 80, 0.2); color: #ef5350; }

/* 表單區塊 */
.form-section { background-color: #1e222d; padding: 16px; border-radius: 8px; border: 1px solid #2b2b43; }
.form-group { margin-bottom: 14px; display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 0.85rem; color: #8c8f98; }
.dark-input { background-color: #2a2e39; border: 1px solid #434651; color: #fff; padding: 12px 10px; border-radius: 6px; outline: none; font-size: 1rem; }
.dark-input:focus { border-color: #2962ff; }

/* 🔥 履約價網格：預設手機版採用 1 列或 2列 (2x2)，大螢幕再轉 4 列 */
.strikes-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.strikes-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.calc-preview { background-color: #131722; border: 1px dashed #434651; padding: 12px; border-radius: 8px; }
.calc-title { color: #e0ac00; margin-top: 0; font-size: 1.1rem; }

.submit-btn { background-color: #2962ff; color: #fff; border: none; padding: 14px; border-radius: 6px; font-weight: bold; font-size: 1rem; }
.cancel-btn { background-color: transparent; border: 1px solid #434651; color: #d1d4dc; padding: 14px; border-radius: 6px; font-size: 1rem; }

/* 模式二：結算總覽樣式 */
.summary-layout { display: flex; flex-direction: column; gap: 16px; }
.expiry-group-card { background-color: #1e222d; border: 1px solid #2b2b43; border-radius: 8px; padding: 16px; }
.expiry-header { border-bottom: 1px solid #2b2b43; padding-bottom: 12px; }
.summary-stats { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.stat-item { background-color: #131722; padding: 12px; border-radius: 6px; border: 1px solid #434651; font-size: 1.1rem; font-weight: bold; }
.table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.summary-table { width: 100%; min-width: 600px; border-collapse: collapse; text-align: left; }
.summary-table th { color: #8c8f98; border-bottom: 1px solid #2b2b43; padding: 12px 8px; font-size: 0.85rem; }
.summary-table td { padding: 12px 8px; border-bottom: 1px solid #2b2b43; color: #d1d4dc; font-size: 0.9rem; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
.bg-primary { background-color: rgba(41, 98, 255, 0.2); color: #2962ff; border: 1px solid #2962ff; }
.bg-secondary { background-color: rgba(140, 143, 152, 0.2); color: #8c8f98; border: 1px solid #8c8f98; }

/* Modal 樣式 */
.chart-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.9); z-index: 9999;
  display: flex; align-items: center; justify-content: center; padding: 10px;
}
.chart-modal-content {
  background-color: #131722; border: 1px solid #2b2b43; border-radius: 10px;
  width: 100%; max-width: 900px; padding: 16px;
}
.close-btn { background: none; border: none; color: #8c8f98; font-size: 1.5rem; }

/* =====================================
   大螢幕 (Desktop) CSS 設計覆蓋
   ===================================== */
@media (min-width: 768px) {
  .journal-dashboard { padding: 24px; }
  .header { flex-direction: row; }
  .title { font-size: 1.5rem; }
  .export-actions { width: auto; flex-wrap: nowrap; }
  .export-btn { flex: initial; }
  .view-toggles { flex-direction: row; }
  .view-btn { width: auto; }
  .journal-layout { grid-template-columns: 1fr 1fr; }
  .strikes-grid { grid-template-columns: 1fr 1fr; }
  .strikes-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .summary-stats { flex-direction: row; }
  .stat-item { flex: 1; }
  .chart-modal-content { padding: 24px; }
}
</style>
