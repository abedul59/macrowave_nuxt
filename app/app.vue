<template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室 Nuxt.js</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

    <div class="container mb-4">
      <ul class="nav nav-tabs nav-fill fw-bold fs-5 shadow-sm bg-white rounded-top">
        <li class="nav-item">
          <button :class="['nav-link py-3', { active: activeTab === 'macro' }]" @click="activeTab = 'macro'">
            🌍 總經戰情儀表板
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3', { active: activeTab === 'taiex' }]" @click="activeTab = 'taiex'">
            📈 台股分析 (傳統極值)
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link py-3 text-primary', { active: activeTab === 'dynamic' }]" @click="activeTab = 'dynamic'">
            🚀 台股分析 (十年週期動態極值)
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

// 🔥 核心修復：強制手動匯入三個分頁檔案，徹底避開 Nuxt 找不到檔案的問題
import TabDashboard from '../components/TabDashboard.vue'
import TabTaiexTraditional from '../components/TabTaiexTraditional.vue'
import TabTaiexDynamic from '../components/TabTaiexDynamic.vue'

// 全局引入 ECharts 套件
useHead({ script: [{ src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js' }] })

// 控制目前顯示的分頁 (預設顯示總經儀表板)
const activeTab = ref('macro')

// 根據點擊的分頁，動態回傳對應的組件
const currentTabComponent = computed(() => {
  switch (activeTab.value) {
    case 'macro': return TabDashboard
    case 'taiex': return TabTaiexTraditional
    case 'dynamic': return TabTaiexDynamic
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
</style>
