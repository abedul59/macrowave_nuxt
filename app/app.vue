<template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

    <div class="container mb-4">
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="row align-items-center text-center">
                    <div class="col-md-6 mb-3 mb-md-0">
                        <h6 class="text-uppercase text-muted fw-bold" style="font-size: 0.8rem;">目前數據來源</h6>
                        <span class="badge bg-primary fs-6 text-wrap" style="line-height: 1.5;">{{ dataSourceDisplay }}</span>
                        <div v-if="dashboardData?.content?.date" class="mt-2 text-muted" style="font-size: 0.85rem;">
                            資料基準日: <strong>{{ dashboardData.content.date }}</strong>
                        </div>
                    </div>
                    <div class="col-md-6 border-start">
                        <button class="btn btn-outline-success w-100 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#uploadBox">
                            📤 手動預覽本地 JSON
                        </button>
                        <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">不寫入資料庫，僅供即時查看</small>
                    </div>
                </div>
                <div class="collapse mt-3" id="uploadBox">
                    <div class="card card-body bg-light border-0">
                        <input type="file" @change="handleFileUpload" class="form-control" accept=".json">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container" v-if="dashboardData">
        <div class="row">
           </div>
    
    <div v-else class="text-center mt-5">
      <div class="spinner-border text-primary" role="status" v-if="isLoading"></div>
      <p class="mt-2 text-muted fw-bold" v-if="isLoading">載入最新戰情數據中...</p>
      <div v-else>
          <p class="text-muted fw-bold">目前資料庫尚無數據 📭</p>
          <p class="text-small">請等待 Python 爬蟲將最新數據推播至 API，或點擊上方按鈕預覽本地 JSON。</p>
      </div>
    </div>

    <footer class="text-center py-4 mt-5 text-muted border-top bg-white">
        <small>&copy; 2026 MacroWave System | Powered by Nuxt & Vercel</small>
    </footer>
  </div>
</template>