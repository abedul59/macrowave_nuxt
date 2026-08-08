<template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室 Nuxt.js</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

    <div class="container mb-4">
      <ul class="nav nav-tabs nav-fill fw-bold fs-6 shadow-sm bg-white rounded-top flex-column flex-md-row">
        <li class="nav-item">
          <button :class="['nav-link py-3', { active: activeTab === 'macro' }]" @click="activeTab = 'macro'">
            🌍 總經戰情
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3', { active: activeTab === 'taiex' }]" @click="activeTab = 'taiex'">
            📈 傳統極值
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3', { active: activeTab === 'dynamic' }]" @click="activeTab = 'dynamic'">
            🚀 動態極值與十年週期
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3 text-success', { active: activeTab === 'history' }]" @click="activeTab = 'history'">
            ⏳ 週KD 歷史回測
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3 text-danger', { active: activeTab === 'historyMonthly' }]" @click="activeTab = 'historyMonthly'">
            ⏳ 月KD 歷史回測
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3 text-primary', { active: activeTab === 'tmf' }]" @click="activeTab = 'tmf'">
            🔥 散戶多空比 (00631L)
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3 text-primary', { active: activeTab === 'lead' }]" @click="activeTab = 'lead'">
            🔥 領先指標 (0050)
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3 text-warning text-darken', { active: activeTab === 'usstock' }]" @click="activeTab = 'usstock'">
            🇺🇸 美股 K 線查詢
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3 text-info text-darken', { active: activeTab === 'options' }]" @click="activeTab = 'options'">
            🇺🇸 選擇權籌碼
          </button>
        </li>
      </ul>
    </div>

    <div class="tab-content">
      <KeepAlive>
        <component :is="currentTabComponent" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHead } from '#imports'

// 強制手動匯入所有分頁檔案
import TabDashboard from '../components/TabDashboard.vue'
import TabTaiexTraditional from '../components/TabTaiexTraditional.vue'
import TabTaiexDynamic from '../components/TabTaiexDynamic.vue'
import TabTaiexHistory from '../components/TabTaiexHistory.vue'
import TabTaiexHistoryMonthly from '../components/TabTaiexHistoryMonthly.vue'
import TabTmfRetailRatio from '../components/TabTmfRetailRatio.vue'
import TabLeadIndicator from '../components/TabLeadIndicator.vue'
import StockChart from '../components/StockChart.vue'
import TabOptionsChain from '../components/TabOptionsChain.vue'

// 全局引入 ECharts 套件
useHead({ script: [{ src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js' }] })

// 控制目前顯示的分頁
const activeTab = ref('macro')

// 動態回傳對應的組件
const currentTabComponent = computed(() => {
  switch (activeTab.value) {
    case 'macro': return TabDashboard
    case 'taiex': return TabTaiexTraditional
    case 'dynamic': return TabTaiexDynamic
    case 'history': return TabTaiexHistory
    case 'historyMonthly': return TabTaiexHistoryMonthly
    case 'tmf': return TabTmfRetailRatio
    case 'lead': return TabLeadIndicator
    case 'usstock': return StockChart
    case 'options': return TabOptionsChain
    default: return TabDashboard
  }
})
</script>

<style>
/* 全域共用樣式 */
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; }
.nav-tabs .nav-link { border: none; color: #6c757d; transition: all 0.3s; background-color: transparent; }
.nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 4px solid #0d6efd; }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; }
.advice-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 1.1rem; }
.status-Safe { color: #198754; font-weight: bold; }
.status-Danger { color: #dc3545; font-weight: bold; }
/* 微調美股標籤顏色使其更醒目 */
.text-darken { filter: brightness(0.85); font-weight: 700; }
</style>
