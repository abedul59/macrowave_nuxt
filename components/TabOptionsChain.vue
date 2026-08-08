<template>
  <div class="options-dashboard">
    <div class="header">
      <h2 class="title">🇺🇸 美股選擇權鏈 (Options Chain)</h2>
      <div class="controls">
        <input 
          v-model="ticker" 
          type="text" 
          placeholder="輸入代號 (例: AAPL)" 
          class="ticker-input"
          @keyup.enter="fetchData()"
        />
        
        <!-- 到期日下拉選單 (有資料時才顯示) -->
        <select 
          v-if="availableDates.length > 0" 
          v-model="selectedDate" 
          class="date-select"
          @change="fetchData(selectedDate)"
        >
          <option v-for="(date, index) in availableDates" :key="index" :value="date.raw">
            {{ date.formatted }}
          </option>
        </select>

        <button class="search-btn" @click="fetchData()" :disabled="loading">
          {{ loading ? '載入中...' : '查詢' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="underlyingPrice && !loading" class="quote-info">
      現價: <span class="fw-bold text-white">${{ underlyingPrice.toFixed(2) }}</span>
    </div>

    <!-- 買權與賣權切換標籤 -->
    <div class="type-tabs" v-if="optionsData && !loading">
      <button :class="{ active: currentType === 'calls' }" @click="currentType = 'calls'" class="tab-btn call-btn">
        買權 (Calls)
      </button>
      <button :class="{ active: currentType === 'puts' }" @click="currentType = 'puts'" class="tab-btn put-btn">
        賣權 (Puts)
      </button>
    </div>

    <!-- 選擇權數據表格 -->
    <div class="table-wrapper" v-if="optionsData && !loading">
      <table class="options-table">
        <thead>
          <tr>
            <th>履約價 (Strike)</th>
            <th>最新價 (Last)</th>
            <th>買價 (Bid)</th>
            <th>賣價 (Ask)</th>
            <th>交易量 (Vol)</th>
            <th>未平倉 (OI)</th>
            <th>隱含波動率 (IV)</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="opt in currentTableData" 
            :key="opt.strike"
            :class="{ 'itm-row': opt.inTheMoney }"
          >
            <td class="fw-bold strike-cell">${{ opt.strike }}</td>
            <td>{{ opt.lastPrice ? opt.lastPrice.toFixed(2) : '-' }}</td>
            <td>{{ opt.bid ? opt.bid.toFixed(2) : '-' }}</td>
            <td>{{ opt.ask ? opt.ask.toFixed(2) : '-' }}</td>
            <td>{{ opt.volume || 0 }}</td>
            <td class="fw-bold text-white">{{ opt.openInterest || 0 }}</td>
            <td class="iv-cell">{{ opt.impliedVolatility ? (opt.impliedVolatility * 100).toFixed(2) + '%' : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const ticker = ref('AAPL');
const loading = ref(false);
const error = ref('');

const optionsData = ref(null);
const availableDates = ref([]);
const selectedDate = ref('');
const underlyingPrice = ref(0);
const currentType = ref('calls'); // 預設顯示買權

// 動態切換顯示 Calls 或 Puts
const currentTableData = computed(() => {
  if (!optionsData.value) return [];
  return currentType.value === 'calls' ? optionsData.value.calls : optionsData.value.puts;
});

const formatExpirationDate = (isoString) => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const fetchData = async (specificDate = '') => {
  if (!ticker.value) {
    error.value = '請輸入股票代號';
    return;
  }
  
  loading.value = true;
  error.value = '';
  optionsData.value = null;
  
  try {
    let url = `/api/options?ticker=${ticker.value.toUpperCase()}`;
    if (specificDate) {
      url += `&date=${specificDate}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) throw new Error(data.message);
    if (!data.options || data.options.length === 0) throw new Error('找不到該股票的選擇權資料');

    // 處理可用的到期日清單
    if (data.expirationDates && data.expirationDates.length > 0) {
      availableDates.value = data.expirationDates.map(dateStr => ({
        raw: dateStr,
        formatted: formatExpirationDate(dateStr)
      }));
      // 如果是第一次搜尋，自動將下拉選單設為最近的到期日
      if (!specificDate) {
        selectedDate.value = data.expirationDates[0];
      }
    }

    underlyingPrice.value = data.quote.regularMarketPrice;
    optionsData.value = data.options[0]; // Yahoo 回傳的結構中，目標日期的資料會放在 index 0
    
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.options-dashboard {
  background-color: #131722;
  color: #d1d4dc;
  padding: 24px;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  margin: 0 auto;
}

.header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
@media (min-width: 768px) { .header { flex-direction: row; justify-content: space-between; align-items: center; } }
.title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #fff; }
.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }

.ticker-input, .date-select {
  background-color: #2a2e39; border: 1px solid #434651; color: #fff;
  padding: 10px 16px; border-radius: 6px; font-size: 14px; outline: none;
}
.ticker-input:focus, .date-select:focus { border-color: #2962ff; }
.ticker-input { width: 150px; }

.search-btn {
  background-color: #2962ff; color: #fff; border: none; padding: 10px 24px; border-radius: 6px;
  font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
}
.search-btn:hover { background-color: #1e4bd8; }
.search-btn:disabled { background-color: #434651; color: #8c8f98; cursor: not-allowed; }

.error-message {
  background-color: rgba(239, 83, 80, 0.1); color: #ef5350; padding: 12px 16px;
  border-radius: 6px; margin-bottom: 24px; border: 1px solid rgba(239, 83, 80, 0.2);
}

.quote-info {
  margin-bottom: 20px; font-size: 1.2rem; color: #8c8f98;
}

.type-tabs {
  display: flex; gap: 10px; margin-bottom: 16px;
}
.tab-btn {
  background-color: #2a2e39; border: 1px solid #434651; color: #8c8f98;
  padding: 10px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.tab-btn.call-btn.active { background-color: rgba(38, 166, 154, 0.2); color: #26a69a; border-color: #26a69a; font-weight: bold; }
.tab-btn.put-btn.active { background-color: rgba(239, 83, 80, 0.2); color: #ef5350; border-color: #ef5350; font-weight: bold; }

.table-wrapper {
  overflow-x: auto; border: 1px solid #2b2b43; border-radius: 8px; background-color: #1e222d;
  max-height: 600px; overflow-y: auto;
}

.options-table {
  width: 100%; border-collapse: collapse; text-align: right; white-space: nowrap;
}
.options-table th, .options-table td {
  padding: 12px 16px; border-bottom: 1px solid #2b2b43;
}
.options-table th {
  background-color: #2a2e39; color: #8c8f98; font-weight: 500; position: sticky; top: 0; z-index: 10;
}
.options-table tbody tr:hover { background-color: #2a2e39; }

/* 價內 (ITM) 的標記樣式 */
.itm-row { background-color: rgba(41, 98, 255, 0.05); }

.strike-cell { color: #2962ff; }
.iv-cell { color: #e0ac00; }
</style>
