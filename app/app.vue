<template>
  <div>
    <div class="header-section text-center">
        <h1 class="fw-bold">📊 MacroWave 總經戰情室 Nuxt.js</h1>
        <p class="opacity-90 mb-0">全方位總體經濟與資產配置監控中心</p>
    </div>

    <div class="container mb-4">
      <ul class="nav nav-tabs nav-fill fw-bold fs-5 shadow-sm bg-white rounded-top" id="myTab" role="tablist">
        <li class="nav-item">
          <button class="nav-link active py-3" data-bs-toggle="tab" data-bs-target="#macro" type="button">🌍 總經戰情儀表板</button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-3" data-bs-toggle="tab" data-bs-target="#taiex" type="button" @click="initTaiexChart">📈 台股分析 (傳統極值)</button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-3 text-primary" data-bs-toggle="tab" data-bs-target="#taiex-dynamic" type="button" @click="initTaiexDynamicChart">
            🚀 台股分析 (十年週期動態極值)
          </button>
        </li>
      </ul>
    </div>

    <div class="tab-content" id="myTabContent">
      
      <div class="tab-pane fade show active" id="macro" role="tabpanel">
        <div class="container mb-4">
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="row align-items-center text-center">
                        <div class="col-md-4 mb-3 mb-md-0">
                            <h6 class="text-uppercase text-muted fw-bold" style="font-size: 0.8rem;">目前數據來源</h6>
                            <span class="badge bg-primary fs-6 text-wrap" style="line-height: 1.5;">{{ dataSourceDisplay }}</span>
                        </div>
                        <div class="col-md-4 mb-3 mb-md-0 border-start border-end">
                            <button class="btn btn-outline-danger w-100 fw-bold" type="button" @click="triggerSync" :disabled="isSyncing">
                                <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1" role="status"></span>
                                {{ isSyncing ? '尋找伺服器並執行...' : '🔄 啟動雲端爬蟲 (API)' }}
                            </button>
                            <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">分散使用 3 個 HF 帳號備援</small>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-outline-success w-100 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#uploadBox">
                                📤 手動上傳 JSON
                            </button>
                        </div>
                    </div>

                    <div class="collapse mt-3" id="uploadBox">
                        <div class="card card-body bg-light border-0">
                            <div class="d-flex gap-2 align-items-center justify-content-center">
                                <input type="file" @change="handleFileSelect" class="form-control w-75" accept=".json">
                                <button @click="uploadToServer" class="btn btn-success fw-bold" :disabled="!selectedFile || isUploading">
                                    <span v-if="isUploading" class="spinner-border spinner-border-sm me-1"></span>
                                    {{ isUploading ? '上傳中...' : '確認上傳' }}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <hr class="my-4 text-muted">
                    
                    <div class="row align-items-center g-3 text-center text-md-start">
                        <div class="col-md-3 text-md-end">
                            <span class="fw-bold text-secondary">🔗 外部系統聯動：</span>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-dark w-100 fw-bold shadow-sm" type="button" @click="triggerTwstockSync" :disabled="isSyncingTwstock">
                                <span v-if="isSyncingTwstock" class="spinner-border spinner-border-sm me-1"></span>
                                {{ isSyncingTwstock ? 'Twstock168 更新中...' : '🚀 獨立更新 Twstock168' }}
                            </button>
                        </div>
                        <div class="col-md-5">
                            <a href="https://www.macromicro.me/collections/46/tw-stock-relative/110457/tw-tmf-long-to-short-ratio-of-individual-player" 
                               target="_blank" rel="noopener noreferrer" 
                               class="btn btn-danger w-100 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2">
                               🔥 微台散戶多空比 (財經M平方)
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container" v-if="dashboardData">
            
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card text-center p-4 bg-white shadow-sm">
                        <h5 class="text-muted mb-3 text-uppercase ls-1">Mark 17 總經風險評分</h5>
                        <div class="d-flex justify-content-center align-items-center gap-4 flex-wrap">
                            <div class="d-flex align-items-baseline">
                                <span class="display-3 fw-bold text-dark">{{ dashboardData.content.total_score }}</span>
                                <span class="text-muted fs-4 ms-2">/ 15</span>
                            </div>
                            <div :class="['advice-badge', 'advice-' + dashboardData.content.advice]">策略建議: {{ dashboardData.content.advice }}</div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4" v-if="dashboardData.content.us_jp_spread">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                            <span>📉 美日債券利差</span>
                            <small class="opacity-75">門檻: 2.0%</small>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted">🇺🇸 美債 10Y</span>
                                <span class="fw-bold">{{ dashboardData.content.us_jp_spread.us }}%</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted">🇯🇵 日債 10Y</span>
                                <span class="fw-bold">{{ dashboardData.content.us_jp_spread.jp }}%</span>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold fs-5">利差 (Spread)</span>
                                <span :class="['fs-4', 'status-' + dashboardData.content.us_jp_spread.status]">{{ dashboardData.content.us_jp_spread.spread }}%</span>
                            </div>
                            <div v-if="dashboardData.content.us_jp_spread.spread < 2.0" class="alert alert-danger mt-3 mb-0 py-2 text-center fw-bold">
                                ⚠️ 警告：利差跌破 2%
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                            <span>🥇 貴金屬重挫偵測</span>
                            <small>跌幅 > 50%</small>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped mb-0 align-middle text-center" style="font-size: 0.9rem;">
                                    <thead class="table-light">
                                        <tr><th>商品</th><th>現價</th><th>跌幅</th><th>狀態</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="metal in dashboardData.content.metals" :key="metal.name">
                                            <td class="fw-bold">{{ metal.name }}</td>
                                            <td>{{ Math.round(metal.current) }}</td>
                                            <td class="text-muted">{{ metal.drop ? metal.drop.toFixed(1) : 0 }}%</td>
                                            <td :class="'status-' + metal.status">{{ metal.status === 'Danger' ? '⚠️' : 'OK' }}</td>
                                        </tr>
                                        <tr v-if="!dashboardData.content.metals?.length"><td colspan="4" class="text-muted py-3">暫無數據</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-12 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center bg-gradient">
                            <span>💱 關鍵匯率監控</span>
                            <small>半年位階</small>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0 align-middle text-center" style="font-size: 0.9rem;">
                                    <thead class="table-light">
                                        <tr><th>貨幣</th><th>現價</th><th>距高點</th><th>距低點</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="curr in dashboardData.content.currencies" :key="curr.name">
                                            <td class="fw-bold text-start ps-3">{{ curr.name }}</td>
                                            <td class="fw-bold">{{ curr.current }}</td>
                                            <td :class="curr.diff_high < -5 ? 'text-success fw-bold' : 'text-muted'">{{ curr.diff_high }}%</td>
                                            <td :class="curr.diff_low > 5 ? 'text-danger fw-bold' : 'text-muted'">{{ curr.diff_low }}%</td>
                                        </tr>
                                        <tr v-if="!dashboardData.content.currencies?.length"><td colspan="4" class="text-muted py-3">暫無數據</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="dashboardData.content.raw_indicators" class="row mt-2">
                <div class="col-12"><h4 class="mb-3 border-start border-5 border-primary ps-3 fw-bold">📑 整體經濟指標細項</h4></div>
                
                <div class="col-12 mb-3">
                    <div class="card section-bar-tw shadow-sm">
                        <div class="card-header bg-light">📌 核心概況 & 時間</div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">資料日期</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Date || "--" }}</div></div></div>
                                <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">Mark 17 得分</div><div class="metric-value text-primary">{{ dashboardData.content.raw_indicators.Mark17_Score || "--" }}</div></div></div>
                                <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">CRB 指數</div><div class="metric-value">{{ dashboardData.content.raw_indicators.CRB_Index || "--" }}</div></div></div>
                                <div class="col-6 col-md-3"><div class="metric-item"><div class="metric-label">美元指數 (DXY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Currency_DXY || "--" }}</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <div class="card section-bar-tw shadow-sm h-100">
                        <div class="card-header bg-light">💰 台灣資金與股市</div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6"><div class="metric-item"><div class="metric-label">台股總市值 (百萬)</div><div class="metric-value text-success">{{ dashboardData.content.raw_indicators.MV_Num || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.MV_Date || "" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">市值貨幣比</div><div class="metric-value">{{ dashboardData.content.raw_indicators.MV_Ratio || "--" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 年增率 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_YoY || "--" }}%</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">M1B 數值 (億)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.M1b_Num || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.M1b_Date || "" }}</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <div class="card section-bar-us shadow-sm h-100">
                        <div class="card-header bg-light">📉 美國債市與利率</div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6"><div class="metric-item"><div class="metric-label">美債 10年殖利率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_10Y || "--" }}%</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">美債 3個月殖利率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.US_3M || "--" }}%</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">長短利差 (10Y-3M)</div><div :class="['metric-value', dashboardData.content.raw_indicators.Spread_3M_10Y < 0 ? 'text-danger' : '']">{{ dashboardData.content.raw_indicators.Spread_3M_10Y || "--" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">衰退機率</div><div class="metric-value text-danger">{{ dashboardData.content.raw_indicators.Recession_Prob || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.Recession_Date || "" }}</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <div class="card section-bar-cycle shadow-sm h-100">
                        <div class="card-header bg-light">🏭 景氣循環與製造業</div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6"><div class="metric-item"><div class="metric-label">中國 PMI</div><div class="metric-value">{{ dashboardData.content.raw_indicators.China_PMI || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.China_PMI_Date || "" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">美國失業率</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Unemployment || "--" }}%</div></div></div>
                                <div class="col-12"><div class="metric-item"><div class="metric-label">美國領先指標 (LEI)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Leading_Index || "--" }}</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <div class="card section-bar-sentiment shadow-sm h-100">
                        <div class="card-header bg-light">🛍️ 消費信心與訂單</div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6"><div class="metric-item"><div class="metric-label">密大消費者信心</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Michigan_Index || "--" }}</div><div class="metric-sub">{{ dashboardData.content.raw_indicators.Michigan_Date || "" }}</div></div></div>
                                <div class="col-6"><div class="metric-item"><div class="metric-label">耐久財新訂單 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_New || "--" }}</div></div></div>
                                <div class="col-12"><div class="metric-item"><div class="metric-label">扣除國防耐久財 (YoY)</div><div class="metric-value">{{ dashboardData.content.raw_indicators.Durable_YoY_Old || "--" }}</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-2" v-if="dashboardData.content.global_markets?.length">
                <div class="col-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-secondary text-white fw-bold d-flex justify-content-between align-items-center flex-wrap">
                            <span>🌍 全球主要股市位階偵測 (乖離率監控)</span>
                            <small class="mt-1 mt-md-0">負值代表回檔幅度，正值代表反彈幅度</small>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover table-bordered mb-0 align-middle text-center" style="font-size: 0.85rem; min-width: 800px;">
                                    <thead class="table-light">
                                        <tr>
                                            <th rowspan="2" class="align-middle">指數名稱</th>
                                            <th rowspan="2" class="align-middle bg-light">現價</th>
                                            <th colspan="2">半年 (6M)</th>
                                            <th colspan="2">一年 (1Y)</th>
                                            <th colspan="2">三年 (3Y)</th>
                                        </tr>
                                        <tr>
                                            <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                            <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                            <th class="text-muted">距高點 %</th><th class="text-muted">距低點 %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="m in dashboardData.content.global_markets" :key="m.name">
                                            <td class="fw-bold text-start ps-3">{{ m.name }}</td>
                                            <td class="fw-bold bg-light">{{ m.current }}</td>
                                            <td :class="m['6M_High_Diff'] < -10 ? 'text-success fw-bold' : ''">{{ m['6M_High_Diff'] }}%</td>
                                            <td :class="m['6M_Low_Diff'] > 10 ? 'text-danger fw-bold' : ''">{{ m['6M_Low_Diff'] }}%</td>
                                            <td :class="m['1Y_High_Diff'] < -15 ? 'text-success fw-bold' : ''">{{ m['1Y_High_Diff'] }}%</td>
                                            <td :class="m['1Y_Low_Diff'] > 15 ? 'text-danger fw-bold' : ''">{{ m['1Y_Low_Diff'] }}%</td>
                                            <td :class="m['3Y_High_Diff'] < -20 ? 'text-success fw-bold' : ''">{{ m['3Y_High_Diff'] }}%</td>
                                            <td :class="m['3Y_Low_Diff'] > 20 ? 'text-danger fw-bold' : ''">{{ m['3Y_Low_Diff'] }}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card shadow-sm">
                        <div class="card-header bg-light text-dark fw-bold d-flex justify-content-between cursor-pointer" data-bs-toggle="collapse" href="#mark17Details" role="button" aria-expanded="true">
                            <span>📋 Mark 17 詳細計分表</span>
                            <small>▼ 點擊展開/收合</small>
                        </div>
                        <div class="collapse show" id="mark17Details">
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0 align-middle">
                                        <thead class="table-light">
                                            <tr><th>監測項目</th><th class="text-center">數值 / 狀態</th><th class="text-center">風險得分</th></tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="item in dashboardData.content.mark17" :key="item.item">
                                                <td>{{ item.item }}</td>
                                                <td :class="['text-center fw-bold', 'status-' + item.status]">{{ item.value }}</td>
                                                <td class="text-center">
                                                    <span v-if="item.score !== 0 && item.score !== '-'" class="badge bg-danger rounded-pill">
                                                        {{ typeof item.score === 'number' && item.score > 0 ? '+' + item.score : item.score }}
                                                    </span>
                                                    <span v-else class="text-muted text-opacity-50">-</span>
                                                </td>
                                            </tr>
                                            <tr v-if="!dashboardData.content.mark17?.length"><td colspan="3" class="text-center text-muted py-3">暫無數據</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div v-else class="text-center mt-5">
            <div class="spinner-border text-primary" role="status" v-if="isLoading"></div>
            <p class="mt-2 text-muted fw-bold" v-if="isLoading">載入最新戰情數據中...</p>
            <div v-else>
                <p class="text-muted fw-bold">目前資料庫尚無數據 📭</p>
                <p class="text-small">請等待 Python 爬蟲將最新數據推播至 API，或點擊上方按鈕手動上傳 JSON。</p>
            </div>
        </div>
      </div>

      <div class="tab-pane fade" id="taiex" role="tabpanel">
        <div class="container pb-5 mt-4">
          <div class="row mb-4" v-if="taiexAnalysis">
            <div class="col-12 mb-3">
                <div class="alert alert-secondary border-secondary shadow-sm">
                    ℹ️ <strong>傳統極值標準 (適用於大盤萬點以下)：</strong> 月線極值看 2,000 點；週線極值看 600~800 點。
                </div>
            </div>
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-primary shadow-sm">
                <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between">
                    <span>長線循環：月KD ╳ 季線</span>
                    <span>最新: {{ taiexAnalysis.daily.current.toFixed(0) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新月 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.monthly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.monthly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">季線 (60MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma60.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma60_trend"></span></span>
                  </div>
                  <div class="bg-light p-3 rounded border border-warning mb-3">
                    <div class="fw-bold text-dark mb-1">🎯 季線 (60MA) 扣抵預測</div>
                    <div class="d-flex justify-content-between small"><span>明日均線防守價</span><span class="fw-bold">{{ taiexAnalysis.daily.deduction60.price.toFixed(2) }}</span></div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="small">多空判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction60.isSafe" class="badge bg-success">安全 (+{{ taiexAnalysis.daily.deduction60.diff.toFixed(0) }})</span>
                      <span v-else class="badge bg-danger">警戒 ({{ taiexAnalysis.daily.deduction60.diff.toFixed(0) }})</span>
                    </div>
                  </div>
                  <hr class="mt-auto">
                  <p class="text-muted small mb-0">{{ taiexAnalysis.monthly.analysis }}</p>
                  <div class="alert mt-2 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.monthly.alertClass">{{ taiexAnalysis.monthly.alertText }}</div>
                </div>
              </div>
            </div>
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-info shadow-sm">
                <div class="card-header bg-info text-dark fw-bold d-flex justify-content-between">
                    <span>中線行情：週KD ╳ 月線</span>
                    <span>最新: {{ taiexAnalysis.daily.current.toFixed(0) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新週 KD</span>
                    <span class="fw-bold fs-5">K: <span :class="taiexAnalysis.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.weekly.k.toFixed(2) }}</span> / D: {{ taiexAnalysis.weekly.d.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">月線 (20MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma20.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma20_trend"></span></span>
                  </div>
                  <div class="bg-light p-3 rounded border border-primary mb-3">
                    <div class="fw-bold text-dark mb-1">🎯 月線 (20MA) 扣抵預測</div>
                    <div class="d-flex justify-content-between small"><span>明日均線防守價</span><span class="fw-bold">{{ taiexAnalysis.daily.deduction20.price.toFixed(2) }}</span></div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="small">多空判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction20.isSafe" class="badge bg-success">安全 (+{{ taiexAnalysis.daily.deduction20.diff.toFixed(0) }})</span>
                      <span v-else class="badge bg-danger">警戒 ({{ taiexAnalysis.daily.deduction20.diff.toFixed(0) }})</span>
                    </div>
                  </div>
                  <hr class="mt-auto">
                  <p class="text-muted small mb-0">{{ taiexAnalysis.weekly.analysis }}</p>
                  <div class="alert mt-2 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.weekly.alertClass">{{ taiexAnalysis.weekly.alertText }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="isChartLoading" class="text-center my-5"><div class="spinner-border text-primary"></div><p>運算中...</p></div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoading && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII)</h5>
                <div class="btn-group">
                  <button v-for="p in ['daily', 'weekly', 'monthly']" :key="p" @click="currentPeriod = p; renderEChart('taiexChart', p)" :class="['btn fw-bold', currentPeriod === p ? 'btn-primary' : 'btn-outline-primary']">{{ p === 'daily' ? '日 K' : p === 'weekly' ? '週 K' : '月 K' }}</button>
                </div>
              </div>
              <div id="taiexChart" style="width: 100%; height: 75vh; min-height: 550px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-pane fade" id="taiex-dynamic" role="tabpanel">
        <div class="container pb-5 mt-4">
          
          <div class="card shadow-sm border-0 mb-4 overflow-hidden">
            <div class="card-header bg-primary text-white py-3">
              <h5 class="fw-bold mb-0">📜 台股十年週期理論 (120個月長線模型)</h5>
            </div>
            <div class="card-body bg-light">
              <div class="row align-items-center">
                <div class="col-lg-5">
                  <div class="theory-text small p-3 bg-white rounded border">
                    <p class="mb-2"><strong>1. 結構與浪數：</strong> 每週期約 120 個月，內含大多頭 5 浪（3 個強力上升浪、2 個調整浪）及空頭修正波（5 浪下跌與時間調整）。</p>
                    <p class="mb-2"><strong>2. 月 KD 定波：</strong> 月 KD 的交叉是判斷長波段起終點的最佳夥伴。轉折處即為另一個長波段的起點。</p>
                    <p class="mb-0"><strong>3. 週 KD 節奏：</strong> 每年約交叉 6~8 次，每次黃金或死亡交叉平均存續時間約為 <strong>2 個月 (8週)</strong>。</p>
                  </div>
                </div>
                <div class="col-lg-7 mt-3 mt-lg-0">
                  <div id="theoryDiagram" style="width: 100%; height: 180px;"></div>
                  <div class="text-center small text-muted">台股 120 個月循環示意圖</div>
                </div>
              </div>
            </div>
          </div>

          <div class="row mb-4" v-if="taiexAnalysisDynamic">
            
            <div class="col-md-6 mb-3">
                <div class="card h-100 border-danger shadow-sm">
                    <div class="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center">
                        <span>🚀 長線動態極值 (25%)</span>
                        <span class="badge bg-white text-danger">月 KD 次數: {{ taiexAnalysisDynamic.monthly.crossCount }}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">最新月 KD</span>
                            <span class="fw-bold fs-5">K: <span :class="taiexAnalysisDynamic.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysisDynamic.monthly.k.toFixed(2) }}</span> / D: {{ taiexAnalysisDynamic.monthly.d.toFixed(2) }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-muted">季線 (60MA) 狀態</span>
                            <span class="fw-bold fs-5">{{ taiexAnalysisDynamic.daily.ma60.toFixed(2) }} <span v-html="taiexAnalysisDynamic.daily.ma60_trend"></span></span>
                        </div>

                        <div class="bg-light p-3 rounded border border-danger mb-3">
                            <div class="fw-bold text-danger mb-2 border-bottom border-danger pb-1">🎯 25% 動態週期追蹤</div>
                            <div v-if="taiexAnalysisDynamic.monthly.basePrice > 0">
                                <div class="d-flex justify-content-between text-muted small mb-1">
                                    <span>轉折日期</span><span>{{ taiexAnalysisDynamic.monthly.baseDate }}</span>
                                </div>
                                <div class="d-flex justify-content-between text-muted small mb-1">
                                    <span>轉折類型</span><span :class="taiexAnalysisDynamic.monthly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ taiexAnalysisDynamic.monthly.crossType }}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span>基準點位</span><span class="fw-bold">{{ taiexAnalysisDynamic.monthly.basePrice.toFixed(0) }} 點</span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span>動態極值目標</span><span class="fw-bold text-dark">{{ taiexAnalysisDynamic.monthly.targetPrice.toFixed(0) }} 點</span>
                                </div>
                                <div class="mt-2 pt-2 border-top">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="small fw-bold">波段推進進度：</span>
                                        <span class="badge bg-danger fs-6">{{ taiexAnalysisDynamic.monthly.currentDiff.toFixed(0) }} 點 ({{ taiexAnalysisDynamic.monthly.percentDiff.toFixed(1) }}%)</span>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center text-muted py-3">歷史數據不足</div>
                        </div>

                        <div class="bg-white p-2 rounded border mb-3 small shadow-sm">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted">季線(60MA) 防守價</span>
                                <span class="fw-bold text-dark">{{ taiexAnalysisDynamic.daily.deduction60.price.toFixed(0) }}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>防禦狀態</span>
                                <span v-if="taiexAnalysisDynamic.daily.deduction60.isSafe" class="text-success fw-bold">安全 (+{{ taiexAnalysisDynamic.daily.deduction60.diff.toFixed(0) }})</span>
                                <span v-else class="text-danger fw-bold">跌破 ({{ taiexAnalysisDynamic.daily.deduction60.diff.toFixed(0) }})</span>
                            </div>
                        </div>

                        <hr class="mt-auto">
                        <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.monthly.alertClass">{{ taiexAnalysisDynamic.monthly.alertText }}</div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card h-100 border-warning shadow-sm">
                    <div class="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                        <span>🚀 中線動態極值 (10%)</span>
                        <span :class="['badge', taiexAnalysisDynamic.weekly.crossCount > 8 ? 'bg-danger' : 'bg-dark']">今年週 KD: {{ taiexAnalysisDynamic.weekly.crossCount }} 次</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">最新週 KD</span>
                            <span class="fw-bold fs-5">K: <span :class="taiexAnalysisDynamic.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysisDynamic.weekly.k.toFixed(2) }}</span> / D: {{ taiexAnalysisDynamic.weekly.d.toFixed(2) }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-muted">月線 (20MA) 狀態</span>
                            <span class="fw-bold fs-5">{{ taiexAnalysisDynamic.daily.ma20.toFixed(2) }} <span v-html="taiexAnalysisDynamic.daily.ma20_trend"></span></span>
                        </div>

                        <div class="bg-light p-3 rounded border border-warning mb-3">
                            <div class="fw-bold text-dark mb-2 border-bottom border-warning pb-1">🎯 10% 動態中線追蹤</div>
                            <div v-if="taiexAnalysisDynamic.weekly.basePrice > 0">
                                <div class="d-flex justify-content-between text-muted small mb-1">
                                    <span>轉折日期</span><span>{{ taiexAnalysisDynamic.weekly.baseDate }}</span>
                                </div>
                                <div class="d-flex justify-content-between text-muted small mb-1">
                                    <span>轉折類型</span><span :class="taiexAnalysisDynamic.weekly.type === 'golden' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ taiexAnalysisDynamic.weekly.crossType }}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span>基準點位</span><span class="fw-bold">{{ taiexAnalysisDynamic.weekly.basePrice.toFixed(0) }} 點</span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span>動態極值區間</span><span class="fw-bold text-dark">{{ taiexAnalysisDynamic.weekly.targetPriceMin.toFixed(0) }} ~ {{ taiexAnalysisDynamic.weekly.targetPriceMax.toFixed(0) }} 點</span>
                                </div>
                                <div class="mt-2 pt-2 border-top">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="small fw-bold">波段推進進度：</span>
                                        <span class="badge bg-warning text-dark fs-6">{{ taiexAnalysisDynamic.weekly.currentDiff.toFixed(0) }} 點 ({{ taiexAnalysisDynamic.weekly.percentDiff.toFixed(1) }}%)</span>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center text-muted py-3">歷史數據不足</div>
                        </div>

                        <div class="bg-white p-2 rounded border mb-3 small shadow-sm">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted">月線(20MA) 防守價</span>
                                <span class="fw-bold text-dark">{{ taiexAnalysisDynamic.daily.deduction20.price.toFixed(0) }}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>防禦狀態</span>
                                <span v-if="taiexAnalysisDynamic.daily.deduction20.isSafe" class="text-success fw-bold">安全 (+{{ taiexAnalysisDynamic.daily.deduction20.diff.toFixed(0) }})</span>
                                <span v-else class="text-danger fw-bold">跌破 ({{ taiexAnalysisDynamic.daily.deduction20.diff.toFixed(0) }})</span>
                            </div>
                        </div>

                        <div v-if="taiexAnalysisDynamic.weekly.crossCount > 8" class="alert alert-danger py-1 mb-2 text-center small fw-bold">⚠️ 注意：今年交叉頻率過高，波動劇烈</div>
                        <hr class="mt-auto">
                        <div class="alert mb-0 py-2 fw-bold text-center" :class="taiexAnalysisDynamic.weekly.alertClass">{{ taiexAnalysisDynamic.weekly.alertText }}</div>
                    </div>
                </div>
            </div>
          </div>

          <div v-if="isChartLoadingDynamic" class="text-center my-5"><div class="spinner-border text-danger"></div><p>動態運算中...</p></div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoadingDynamic && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 - 動態對照圖</h5>
                <div class="btn-group">
                  <button v-for="p in ['daily', 'weekly', 'monthly']" :key="p" @click="currentPeriodDynamic = p; renderEChart('taiexChartDynamic', p)" :class="['btn fw-bold', currentPeriodDynamic === p ? 'btn-danger' : 'btn-outline-danger']">{{ p === 'daily' ? '日 K' : p === 'weekly' ? '週 K' : '月 K' }}</button>
                </div>
              </div>
              <div id="taiexChartDynamic" style="width: 100%; height: 75vh; min-height: 550px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHead } from '#imports'

useHead({ script: [{ src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js' }] })

// =====================================
// 1. 總經資料與同步設定
// =====================================
const rawResponseData = ref(null);
const isLoading = ref(true);
const dashboardData = computed(() => rawResponseData.value);
const dataSourceDisplay = computed(() => {
    if (!dashboardData.value) return '無數據';
    return `${dashboardData.value.source_type || '未知'} (時間: ${dashboardData.value.content.update_time || '--'})`;
});

const fetchDashboardData = async () => {
    try {
        const { data: response } = await useFetch('/api/latest');
        if (response.value && response.value.data) rawResponseData.value = response.value.data;
    } finally { isLoading.value = false; }
};

const isSyncing = ref(false);
const triggerSync = async () => {
    if (!confirm('確定啟動雲端爬蟲？')) return;
    isSyncing.value = true;
    const hfBaseUrls = ['https://pyfbsdk59-macrowave-scrape-api.hf.space','https://lawxstudents168-macrowave-scrape-api.hf.space','https://igveri59-macrowave-scrape-api.hf.space'];
    const shuffled = [...hfBaseUrls].sort(() => 0.5 - Math.random());
    for (let url of shuffled) {
        try {
            await $fetch(`${url}/api/trigger-sync`, { method: 'POST', timeout: 15000 });
            alert('指令發送成功，約3分鐘後自動更新。');
            setTimeout(() => window.location.reload(), 180000);
            break;
        } catch (e) { console.error(e); }
    }
    isSyncing.value = false;
};

const isSyncingTwstock = ref(false);
const triggerTwstockSync = async () => {
    isSyncingTwstock.value = true;
    try {
        await $fetch('https://lawxstudents168-twstock168-scrape-api.hf.space/api/trigger-twstock-sync', { method: 'POST' });
        alert('指令發送成功。');
        setTimeout(() => isSyncingTwstock.value = false, 150000);
    } catch (e) { isSyncingTwstock.value = false; }
};

const selectedFile = ref(null);
const isUploading = ref(false);
const handleFileSelect = (e) => selectedFile.value = e.target.files[0];
const uploadToServer = async () => {
    if (!selectedFile.value) return;
    isUploading.value = true;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            await $fetch('/api/upload', { method: 'POST', headers: { 'X-Api-Key': 'macrowave168' }, body: JSON.parse(e.target.result) });
            alert('上傳成功'); window.location.reload();
        } finally { isUploading.value = false; }
    };
    reader.readAsText(selectedFile.value);
};

// =====================================
// 2. 核心技術指標與數學工具
// =====================================
const taiexAllData = ref(null);
const isChartLoading = ref(false);
const isChartLoadingDynamic = ref(false);
const taiexAnalysis = ref(null);
const taiexAnalysisDynamic = ref(null);
const currentPeriod = ref('daily');
const currentPeriodDynamic = ref('daily');
let chartInstanceMap = {};

function sanitizeData(quotes) { return quotes.filter(q => q.open != null && q.close != null && !isNaN(q.close)); }

function calculateKD(quotes) {
    let k = 50, d = 50;
    return quotes.map((q, i, arr) => {
        if (i < 8) return { ...q, k: 50, d: 50 };
        const range = arr.slice(i - 8, i + 1);
        const hi = Math.max(...range.map(x => x.high)), lo = Math.min(...range.map(x => x.low));
        let rsv = hi === lo ? 0 : ((q.close - lo) / (hi - lo)) * 100;
        k = (rsv + k * 2) / 3; d = (k + d * 2) / 3;
        return { ...q, k, d };
    });
}

function calculateMA(n, q) {
    return q.map((_, i, arr) => {
        if (i < n - 1) return null;
        return arr.slice(i - n + 1, i + 1).reduce((s, x) => s + x.close, 0) / n;
    });
}

function findLastCross(kdData) {
    if (!kdData || kdData.length < 2) return null;
    for (let i = kdData.length - 1; i > 0; i--) {
        const p = kdData[i - 1], c = kdData[i];
        if (p.k <= p.d && c.k > c.d) return { ...c, type: 'golden', crossType: '黃金交叉(偏多)' };
        if (p.k >= p.d && c.k < c.d) return { ...c, type: 'death', crossType: '死亡交叉(偏空)' };
    }
    return null;
}

function getDeduction(dailyData, latestClose, n) {
    const idx = Math.max(0, dailyData.length - n);
    const price = dailyData[idx].close;
    return { date: dailyData[idx].date, price, diff: latestClose - price, isSafe: latestClose >= price };
}

function countCrossovers(kdData, yearOnly = false) {
    let count = 0;
    const currentYear = new Date().getFullYear();
    for (let i = 1; i < kdData.length; i++) {
        const p = kdData[i - 1], c = kdData[i];
        const itemYear = new Date(c.date).getFullYear();
        if (yearOnly && itemYear !== currentYear) continue;
        if ((p.k <= p.d && c.k > c.d) || (p.k >= p.d && c.k < c.d)) count++;
    }
    return count;
}

async function prepareData() {
    if (taiexAllData.value) return;
    const res = await $fetch('/api/taiex');
    if (!res.success) throw new Error(res.message);
    taiexAllData.value = {
        daily: calculateKD(sanitizeData(res.data.daily)),
        weekly: calculateKD(sanitizeData(res.data.weekly)),
        monthly: calculateKD(sanitizeData(res.data.monthly))
    };
}

// =====================================
// 3. 圖表初始化 (傳統與動態)
// =====================================
async function initTaiexChart() {
    if (taiexAnalysis.value) return;
    isChartLoading.value = true;
    try {
        await prepareData();
        const daily = taiexAllData.value.daily, latest = daily[daily.length-1].close;
        const ma20 = calculateMA(20, daily), ma60 = calculateMA(60, daily);
        const lw = findLastCross(taiexAllData.value.weekly), lm = findLastCross(taiexAllData.value.monthly);

        taiexAnalysis.value = {
            daily: {
                current: latest, ma20: ma20[ma20.length-1], ma60: ma60[ma60.length-1],
                ma20_trend: ma20[ma20.length-1] > ma20[ma20.length-2] ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                ma60_trend: ma60[ma60.length-1] > ma60[ma60.length-2] ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                deduction20: getDeduction(daily, latest, 20), deduction60: getDeduction(daily, latest, 60)
            },
            weekly: { 
                k: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].k, d: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].d,
                analysis: lw ? `前次${lw.crossType}於 ${lw.date}。波段已變動 ${Math.round(Math.abs(latest-lw.close))} 點。` : '數據不足',
                alertText: lw && Math.abs(latest-lw.close) > 800 ? '⚠️ 超出傳統極值 800 點' : '✅ 尚有波段空間', alertClass: lw && Math.abs(latest-lw.close) > 800 ? 'alert-danger' : 'alert-success'
            },
            monthly: {
                k: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].k, d: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].d,
                analysis: lm ? `前次${lm.crossType}於 ${lm.date}。波段已變動 ${Math.round(Math.abs(latest-lm.close))} 點。` : '數據不足',
                alertText: lm && Math.abs(latest-lm.close) > 2000 ? '⚠️ 超出傳統極值 2000 點' : '✅ 長線趨勢運行中', alertClass: lm && Math.abs(latest-lm.close) > 2000 ? 'alert-danger' : 'alert-success'
            }
        };
        renderEChart('taiexChart', 'daily');
    } finally { isChartLoading.value = false; }
}

async function initTaiexDynamicChart() {
    if (taiexAnalysisDynamic.value) return;
    isChartLoadingDynamic.value = true;
    try {
        await prepareData();
        const daily = taiexAllData.value.daily, latest = daily[daily.length-1].close;
        const ma20 = calculateMA(20, daily), ma60 = calculateMA(60, daily);
        const lw = findLastCross(taiexAllData.value.weekly), lm = findLastCross(taiexAllData.value.monthly);

        const wDiff = lw ? (lw.type === 'golden' ? latest - lw.close : lw.close - latest) : 0;
        const mDiff = lm ? (lm.type === 'golden' ? latest - lm.close : lm.close - latest) : 0;

        taiexAnalysisDynamic.value = {
            daily: {
                current: latest, ma20: ma20[ma20.length-1], ma60: ma60[ma60.length-1],
                ma20_trend: ma20[ma20.length-1] > ma20[ma20.length-2] ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                ma60_trend: ma60[ma60.length-1] > ma60[ma60.length-2] ? '<span class="text-danger">↗</span>' : '<span class="text-success">↘</span>',
                deduction20: getDeduction(daily, latest, 20), deduction60: getDeduction(daily, latest, 60)
            },
            weekly: { 
                k: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].k, d: taiexAllData.value.weekly[taiexAllData.value.weekly.length-1].d,
                basePrice: lw?.close||0, baseDate: lw?.date||'--', type: lw?.type||'', crossType: lw?.crossType||'--',
                currentDiff: Math.abs(wDiff), percentDiff: lw ? (Math.abs(wDiff)/lw.close)*100 : 0,
                targetPriceMin: lw ? (lw.type === 'golden' ? lw.close * 1.075 : lw.close * 0.925) : 0,
                targetPriceMax: lw ? (lw.type === 'golden' ? lw.close * 1.1 : lw.close * 0.9) : 0,
                crossCount: countCrossovers(taiexAllData.value.weekly, true),
                alertText: lw && (Math.abs(wDiff)/lw.close) > 0.1 ? '⚠️ 嚴重警戒！突破 10% 動態極值' : '✅ 順勢推進中',
                alertClass: lw && (Math.abs(wDiff)/lw.close) > 0.1 ? 'alert-danger' : 'alert-success'
            },
            monthly: {
                k: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].k, d: taiexAllData.value.monthly[taiexAllData.value.monthly.length-1].d,
                basePrice: lm?.close||0, baseDate: lm?.date||'--', type: lm?.type||'', crossType: lm?.crossType||'--',
                currentDiff: Math.abs(mDiff), percentDiff: lm ? (Math.abs(mDiff)/lm.close)*100 : 0,
                targetPrice: lm ? (lm.type === 'golden' ? lm.close * 1.25 : lm.close * 0.75) : 0,
                crossCount: countCrossovers(taiexAllData.value.monthly, false),
                alertText: lm && (Math.abs(mDiff)/lm.close) > 0.25 ? '⚠️ 突破 25% 長波動態極值' : '✅ 長線動態空間未滿',
                alertClass: lm && (Math.abs(mDiff)/lm.close) > 0.25 ? 'alert-danger' : 'alert-success'
            }
        };
        renderEChart('taiexChartDynamic', 'daily');
        drawTheoryDiagram();
    } finally { isChartLoadingDynamic.value = false; }
}

function drawTheoryDiagram() {
    setTimeout(() => {
        const dom = document.getElementById('theoryDiagram');
        if (!dom || !window.echarts) return;
        const inst = window.echarts.init(dom);
        inst.setOption({
            grid: { top: 20, bottom: 20, left: 40, right: 20 },
            xAxis: { type: 'category', data: ['10y起','浪1','浪2','浪3','浪4','浪5','空A','空B','空C','空修','10y終'], axisLine: { show: false } },
            yAxis: { show: false },
            series: [{
                type: 'line', smooth: true, symbolSize: 10, lineStyle: { width: 4, color: '#0d6efd' },
                data: [10, 40, 25, 70, 50, 100, 60, 80, 20, 10, 15],
                markPoint: { data: [{ name: '起漲', coord: [0, 10], itemStyle: {color: 'red'} }, { name: '高位', coord: [5, 100], itemStyle: {color: 'orange'} }] }
            }]
        });
    }, 100);
}

function renderEChart(containerId, periodKey) {
    if (!taiexAllData.value) return;
    const targetData = taiexAllData.value[periodKey];
    const categoryData = targetData.map(item => item.date);
    const candleValues = targetData.map(item => [item.open, item.close, item.low, item.high]);
    const ma20 = calculateMA(20, targetData), ma60 = calculateMA(60, targetData);

    const kdMarks = []; const candleMarks = [];
    for (let i = 1; i < targetData.length; i++) {
        const p = targetData[i - 1], c = targetData[i];
        if (p.k <= p.d && c.k > c.d) kdMarks.push({ coord: [i, c.k], symbol: 'arrow', symbolSize: 12, itemStyle: { color: '#dc3545' } });
        if (p.k >= p.d && c.k < c.d) kdMarks.push({ coord: [i, c.k], symbol: 'arrow', symbolRotate: 180, symbolSize: 12, itemStyle: { color: '#198754' } });
    }
    if (periodKey === 'daily' && targetData.length >= 60) {
        candleMarks.push({ coord: [targetData.length - 20, candleValues[targetData.length - 20][1]], value: '20MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#0dcaf0' }});
        candleMarks.push({ coord: [targetData.length - 60, candleValues[targetData.length - 60][1]], value: '60MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#ffc107' }});
    }

    setTimeout(() => {
        const chartDom = document.getElementById(containerId);
        if (!chartDom || !window.echarts) return;
        if (chartInstanceMap[containerId]) chartInstanceMap[containerId].dispose();
        const inst = window.echarts.init(chartDom);
        chartInstanceMap[containerId] = inst;

        inst.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
            axisPointer: { link: [{ xAxisIndex: 'all' }] },
            legend: { data: ['K線', '20MA', '60MA', '成交量', 'K值', 'D值'], top: 5 },
            grid: [{ left: '8%', right: '5%', top: '10%', height: '45%' }, { left: '8%', right: '5%', top: '60%', height: '12%' }, { left: '8%', right: '5%', top: '78%', height: '12%' }],
            xAxis: [{ type: 'category', data: categoryData, gridIndex: 0, axisLabel: { show: false } }, { type: 'category', data: categoryData, gridIndex: 1, axisLabel: { show: false } }, { type: 'category', data: categoryData, gridIndex: 2 }],
            yAxis: [{ scale: true, gridIndex: 0 }, { scale: true, gridIndex: 1, axisLabel: { show: false } }, { min: 0, max: 100, gridIndex: 2, splitLine: { show: true, lineStyle: { type: 'dashed'} } }],
            dataZoom: [{ type: 'inside', xAxisIndex: [0, 1, 2], start: 70, end: 100 }, { show: true, xAxisIndex: [0, 1, 2], top: '94%', start: 70, end: 100 }],
            series: [
                { name: 'K線', type: 'candlestick', data: candleValues, xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#dc3545', color0: '#198754' }, markPoint: { data: candleMarks, label: { color: '#000', fontWeight: 'bold' } } },
                { name: '20MA', type: 'line', data: ma20, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
                { name: '60MA', type: 'line', data: ma60, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
                { name: '成交量', type: 'bar', data: targetData.map(i => ({ value: i.volume, itemStyle: { color: i.close>=i.open?'#dc3545':'#198754'} })), xAxisIndex: 1, yAxisIndex: 1 },
                { name: 'K值', type: 'line', data: targetData.map(i=>i.k), xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#dc3545' }, markPoint: { data: kdMarks, label: { show: false } } },
                { name: 'D值', type: 'line', data: targetData.map(i=>i.d), xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#0d6efd' } }
            ]
        });
    }, 50);
}

onMounted(() => fetchDashboardData());
</script>

<style>
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; }
.nav-tabs .nav-link { border: none; color: #6c757d; transition: all 0.3s; }
.nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 4px solid #0d6efd; background-color: transparent; }
.advice-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 1.1rem; }
.advice-Safe { background-color: #d1e7dd; color: #0f5132; }
.status-Safe { color: #198754; font-weight: bold; }
.status-Danger { color: #dc3545; font-weight: bold; }
.theory-text { line-height: 1.6; color: #444; }
.metric-item { padding: 12px; border-radius: 8px; background-color: #f8f9fa; border: 1px solid #e9ecef; height: 100%; }
.metric-label { font-size: 0.85rem; color: #6c757d; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.metric-value { font-size: 1.1rem; font-weight: 700; color: #212529; word-break: break-word; }
.metric-sub { font-size: 0.75rem; color: #adb5bd; margin-top: 2px; }
.section-bar-tw { border-left: 5px solid #0d6efd; }
.section-bar-us { border-left: 5px solid #dc3545; }
.section-bar-cycle { border-left: 5px solid #198754; }
.section-bar-sentiment { border-left: 5px solid #ffc107; }
</style>
