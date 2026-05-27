<template>
  <div class="min-vh-100 bg-light">
    
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div class="container">
        <span class="navbar-brand fw-bold mb-0 h4 py-2">
          🔥 MacroWave 總體經濟與籌碼戰情室
        </span>
      </div>
    </nav>

    <div class="container py-4">
      
      <div class="card shadow-sm border-0 mb-4 overflow-hidden">
        <div class="card-body p-2 bg-white">
          <ul class="nav nav-pills flex-nowrap overflow-auto pb-1" style="white-space: nowrap;">
            <li class="nav-item" v-for="tab in tabs" :key="tab.id">
              <button 
                class="nav-link fw-bold px-4 py-2 rounded-3 me-2" 
                :class="{ 'active bg-primary text-white shadow-sm': currentTab === tab.id, 'text-secondary': currentTab !== tab.id }" 
                @click="currentTab = tab.id"
              >
                {{ tab.name }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="tab-content">
        
        <KeepAlive>
          <TabDashboard v-if="currentTab === 'TabDashboard'" />
          <TabTmfRetailRatio v-else-if="currentTab === 'TabTmfRetailRatio'" />
          <TabLeadIndicator v-else-if="currentTab === 'TabLeadIndicator'" />
          <TabTaiexDynamic v-else-if="currentTab === 'TabTaiexDynamic'" />
          <TabTaiexHistory v-else-if="currentTab === 'TabTaiexHistory'" />
          <TabTaiexHistoryMonthly v-else-if="currentTab === 'TabTaiexHistoryMonthly'" />
          <TabTaiexTraditional v-else-if="currentTab === 'TabTaiexTraditional'" />
        </KeepAlive>
        
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 預設首頁顯示的第一個分頁
const currentTab = ref('TabDashboard')

// 集中管理所有的分頁陣列，方便未來擴充順序或修改名稱
const tabs = ref([
  { id: 'TabDashboard', name: '🏠 總覽 (Dashboard)' },
  { id: 'TabTmfRetailRatio', name: '🔥 微台指多空比' },
  { id: 'TabLeadIndicator', name: '📊 領先指標 ╳ 0050' },  // 👈 新增的分頁就在這裡！
  { id: 'TabTaiexDynamic', name: '⚡ 大盤動態' },
  { id: 'TabTaiexHistory', name: '📈 大盤歷史 (日)' },
  { id: 'TabTaiexHistoryMonthly', name: '📅 大盤歷史 (月)' },
  { id: 'TabTaiexTraditional', name: '📉 傳統指標' }
])
</script>

<style scoped>
/* 隱藏滾動條但保持可以水平滑動 (適合手機版觀看多個頁籤) */
.nav-pills {
  scrollbar-width: none; /* 支援 Firefox */
}
.nav-pills::-webkit-scrollbar {
  display: none; /* 支援 Chrome, Safari, Opera */
}
.nav-link {
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
}
.nav-link:hover:not(.active) {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}
</style>
