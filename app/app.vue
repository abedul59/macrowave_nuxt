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
          <button class="nav-link py-3" data-bs-toggle="tab" data-bs-target="#taiex" type="button" @click="initTaiexChart">📈 台股多週期與均線分析</button>
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
                                    {{ isUploading ? '上傳中...' : '確認上傳' }}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <hr class="my-4 text-muted">
                    
                    <div class="row align-items-center g-3">
                        <div class="col-md-3 text-md-end">
                            <span class="fw-bold text-secondary">🔗 外部系統聯動：</span>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-dark w-100 fw-bold shadow-sm" type="button" @click="triggerTwstockSync" :disabled="isSyncingTwstock">
                                {{ isSyncingTwstock ? 'Twstock168 更新中...' : '🚀 獨立更新 Twstock168' }}
                            </button>
                        </div>
                        <div class="col-md-5">
                            <a href="https://www.macromicro.me/collections/46/tw-stock-relative/110457/tw-tmf-long-to-short-ratio-of-individual-player?utm_source=facebook&utm_medium=social-network&utm_content=post&utm_campaign=" 
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
            <div class="col-12 mb-4">
                <div class="card text-center p-4 bg-white">
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
                <div class="card h-100">
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
                <div class="card h-100">
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
                <div class="card h-100">
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
                                    <tr v-if="!dashboardData.content.currencies?.length"><td colspan="4" class="text-muted py-3">暫無匯率數據</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="dashboardData.content.raw_indicators" class="row mt-2">
                <div class="col-12"><h4 class="mb-3 border-start border-5 border-primary ps-3 fw-bold">📑 整體經濟指標細項</h4></div>
                
                <div class="col-12 mb-3">
                    <div class="card section-bar-tw">
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
                    <div class="card section-bar-tw">
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
                    <div class="card section-bar-us">
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
                    <div class="card section-bar-cycle">
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
                    <div class="card section-bar-sentiment">
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
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-secondary text-white fw-bold d-flex justify-content-between align-items-center">
                            <span>🌍 全球主要股市位階偵測 (乖離率監控)</span>
                            <small>負值代表回檔幅度，正值代表反彈幅度</small>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover table-bordered mb-0 align-middle text-center" style="font-size: 0.85rem;">
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
                    <div class="card">
                        <div class="card-header bg-light text-dark fw-bold d-flex justify-content-between" data-bs-toggle="collapse" href="#mark17Details" role="button" aria-expanded="true">
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

      <div class="tab-pane fade" id="taiex" role="tabpanel" aria-labelledby="taiex-tab">
        <div class="container pb-5 mt-4">
          
          <div class="row mb-4" v-if="taiexAnalysis">
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-primary shadow-sm">
                <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between">
                    <span>長線循環：月KD 與 季線 (60MA)</span>
                    <span>最新收盤: {{ taiexAnalysis.daily.current.toFixed(2) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新月 KD</span>
                    <span class="fw-bold fs-5">
                      K: <span :class="taiexAnalysis.monthly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.monthly.k.toFixed(2) }}</span> / 
                      D: {{ taiexAnalysis.monthly.d.toFixed(2) }}
                    </span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">季線 (60MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma60.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma60_trend"></span></span>
                  </div>
                  
                  <div class="bg-light p-3 rounded border border-warning mb-3">
                    <div class="fw-bold text-dark mb-2 border-bottom border-warning pb-1">🎯 季線 (60MA) 扣抵值預測</div>
                    <div class="d-flex justify-content-between text-muted small mb-1">
                      <span>明日扣抵目標日</span><span>{{ taiexAnalysis.daily.deduction60.date }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span>明日均線防守價</span><span class="fw-bold fs-5 text-dark">{{ taiexAnalysis.daily.deduction60.price.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="text-secondary small">多空翻轉判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction60.isSafe" class="badge bg-success fs-6">緩衝空間 +{{ taiexAnalysis.daily.deduction60.diff.toFixed(0) }} 點 (看漲)</span>
                      <span v-else class="badge bg-danger fs-6">差 {{ Math.abs(taiexAnalysis.daily.deduction60.diff).toFixed(0) }} 點 (面臨下彎)</span>
                    </div>
                  </div>

                  <hr class="mt-auto">
                  <p class="fw-bold text-dark mb-1">極值空間分析：</p>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.monthly.analysis }}</p>
                  <div class="alert mt-3 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.monthly.alertClass">{{ taiexAnalysis.monthly.alertText }}</div>
                </div>
              </div>
            </div>

            <div class="col-md-6 mb-3">
              <div class="card h-100 border-info shadow-sm">
                <div class="card-header bg-info text-dark fw-bold d-flex justify-content-between">
                    <span>中線行情：週KD 與 月線 (20MA)</span>
                    <span>最新收盤: {{ taiexAnalysis.daily.current.toFixed(2) }}</span>
                </div>
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">最新週 KD</span>
                    <span class="fw-bold fs-5">
                      K: <span :class="taiexAnalysis.weekly.k > 80 ? 'text-danger' : ''">{{ taiexAnalysis.weekly.k.toFixed(2) }}</span> / 
                      D: {{ taiexAnalysis.weekly.d.toFixed(2) }}
                    </span>
                  </div>
                  <div class="d-flex justify-content-between mb-3">
                    <span class="text-muted">月線 (20MA) 現況</span>
                    <span class="fw-bold fs-5">{{ taiexAnalysis.daily.ma20.toFixed(2) }} <span v-html="taiexAnalysis.daily.ma20_trend"></span></span>
                  </div>

                  <div class="bg-light p-3 rounded border border-primary mb-3">
                    <div class="fw-bold text-dark mb-2 border-bottom border-primary pb-1">🎯 月線 (20MA) 扣抵值預測</div>
                    <div class="d-flex justify-content-between text-muted small mb-1">
                      <span>明日扣抵目標日</span><span>{{ taiexAnalysis.daily.deduction20.date }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span>明日均線防守價</span><span class="fw-bold fs-5 text-dark">{{ taiexAnalysis.daily.deduction20.price.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="text-secondary small">多空翻轉判定：</span>
                      <span v-if="taiexAnalysis.daily.deduction20.isSafe" class="badge bg-success fs-6">緩衝空間 +{{ taiexAnalysis.daily.deduction20.diff.toFixed(0) }} 點 (看漲)</span>
                      <span v-else class="badge bg-danger fs-6">差 {{ Math.abs(taiexAnalysis.daily.deduction20.diff).toFixed(0) }} 點 (面臨下彎)</span>
                    </div>
                  </div>

                  <hr class="mt-auto">
                  <p class="fw-bold text-dark mb-1">極值空間分析：</p>
                  <p class="text-muted small mb-0">{{ taiexAnalysis.weekly.analysis }}</p>
                  <div class="alert mt-3 mb-0 py-2 fw-bold text-center" :class="taiexAnalysis.weekly.alertClass">{{ taiexAnalysis.weekly.alertText }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isChartLoading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted fw-bold">運算台股指標中...</p>
          </div>

          <div class="card shadow-sm mb-4" v-show="!isChartLoading && taiexAllData">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <h5 class="fw-bold text-secondary mb-0">台股加權指數 (^TWII) 多週期分析</h5>
                
                <div class="btn-group shadow-sm" role="group">
                  <input type="radio" class="btn-check" name="period" id="btn-daily" value="daily" v-model="currentPeriod" @change="renderEChart">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-daily">日 K</label>

                  <input type="radio" class="btn-check" name="period" id="btn-weekly" value="weekly" v-model="currentPeriod" @change="renderEChart">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-weekly">週 K</label>

                  <input type="radio" class="btn-check" name="period" id="btn-monthly" value="monthly" v-model="currentPeriod" @change="renderEChart">
                  <label class="btn btn-outline-primary fw-bold px-4" for="btn-monthly">月 K</label>
                </div>
              </div>
              
              <div id="taiexChart" style="width: 100%; height: 800px;"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHead } from '#imports'

useHead({ script: [{ src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js' }] })

// =====================================
// 1. 總經看板變數與資料抓取 (🔥 已完全恢復)
// =====================================
const rawResponseData = ref(null)
const isLoading = ref(true)
const dashboardData = computed(() => rawResponseData.value)

const dataSourceDisplay = computed(() => {
  if (!dashboardData.value) return '無數據'
  const content = dashboardData.value.content
  const source = dashboardData.value.source_type || '未知來源'
  const timeStr = content.update_time || new Date(dashboardData.value.created_at).toLocaleString('zh-TW')
  return `${source} (時間: ${timeStr})`
})

// 發送 API 請求抓取最新總經資料
const fetchDashboardData = async () => {
  try {
    const { data: response } = await useFetch('/api/latest')
    if (response.value && response.value.data) {
      rawResponseData.value = response.value.data
    }
  } catch (error) {
    console.error("無法取得總經資料:", error)
  } finally {
    isLoading.value = false // 確保轉圈圈一定會停下來
  }
}
// 執行抓取
await fetchDashboardData()

// =====================================
// 2. 爬蟲同步與上傳邏輯 (🔥 已完全恢復)
// =====================================
const isSyncing = ref(false)
const triggerSync = async () => {
  if (!confirm('確定要啟動雲端爬蟲嗎？\n資料將在背景抓取，約需 3 分鐘後自動更新至本站。')) return
  
  isSyncing.value = true
  const hfBaseUrls = [
    'https://pyfbsdk59-macrowave-scrape-api.hf.space',
    'https://lawxstudents168-macrowave-scrape-api.hf.space',
    'https://igveri59-macrowave-scrape-api.hf.space'
  ]
  const shuffledUrls = [...hfBaseUrls].sort(() => 0.5 - Math.random())

  for (let i = 0; i < shuffledUrls.length; i++) {
    const currentUrl = `${shuffledUrls[i]}/api/trigger-sync`
    try {
      const apiResponse = await $fetch(currentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000 
      })
      alert(`✅ 已成功發送爬蟲指令！(由備援節點 ${i + 1} 接單)\n伺服器回應：${apiResponse.message}\n\n系統將在 3 分鐘後自動重整網頁。`)
      setTimeout(() => { window.location.reload() }, 180000)
      break 
    } catch (err) {
      if (i === shuffledUrls.length - 1) {
        alert('❌ 觸發爬蟲失敗！三台 HF 伺服器均無回應或已滿載 (Paused)，請稍後再試。')
        isSyncing.value = false
      }
    }
  }
}

const isSyncingTwstock = ref(false)
const triggerTwstockSync = async () => {
  if (!confirm('確定要獨立更新 Twstock168 網站嗎？\n這將會呼叫您專屬的第二個 Hugging Face Space。整體約需 2.5 分鐘。')) return
  isSyncingTwstock.value = true
  try {
    const newHfApiUrl = 'https://lawxstudents168-twstock168-scrape-api.hf.space/api/trigger-twstock-sync'
    const apiResponse = await $fetch(newHfApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    alert(`✅ 已成功發送指令！\n伺服器回應：${apiResponse.message}`)
    setTimeout(() => {
      isSyncingTwstock.value = false
      alert('🎯 Twstock168 網站的背景更新流程應已執行完畢！您可以前往該網站確認。')
    }, 150000)
  } catch (err) {
    alert('❌ 觸發更新失敗，請檢查新 Hugging Face 的網址或狀態：\n' + err.message)
    isSyncingTwstock.value = false
  }
}

const selectedFile = ref(null)
const isUploading = ref(false)
const handleFileSelect = (event) => selectedFile.value = event.target.files[0]
const uploadToServer = async () => {
  if (!selectedFile.value) return
  isUploading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const parsedData = JSON.parse(e.target.result)
      await $fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-Api-Key': 'macrowave168' },
        body: parsedData
      })
      alert('上傳成功！資料已永久儲存至 Supabase。')
      window.location.reload()
    } catch (err) {
      alert('上傳失敗，請確認資料庫與 API 設定：\n' + err.message)
    } finally {
      isUploading.value = false
    }
  }
  reader.onerror = () => {
    alert('讀取檔案失敗')
    isUploading.value = false
  }
  reader.readAsText(selectedFile.value)
}

// =====================================
// 3. 台股 K 線、KD 極值與預測邏輯 (保留強力數據淨化)
// =====================================
const isChartLoading = ref(false)
const taiexAnalysis = ref(null)
const taiexAllData = ref(null)    
const currentPeriod = ref('daily') 
let chartInstance = null

function sanitizeData(quotes) {
  if (!quotes || !Array.isArray(quotes)) return [];
  return quotes.filter(q => 
    q.open != null && q.high != null && q.low != null && q.close != null &&
    !isNaN(q.open) && !isNaN(q.high) && !isNaN(q.low) && !isNaN(q.close)
  );
}

function calculateKD(quotes, period = 9) {
  let k = 50, d = 50;
  return quotes.map((q, i, arr) => {
    if (i < period - 1) return { ...q, k: 50, d: 50 } 
    const recentRange = arr.slice(i - period + 1, i + 1)
    const highest = Math.max(...recentRange.map(x => x.high))
    const lowest = Math.min(...recentRange.map(x => x.low))
    let rsv = 0;
    if (highest !== lowest && !isNaN(highest) && !isNaN(lowest)) {
      rsv = ((q.close - lowest) / (highest - lowest)) * 100
    }
    k = (rsv + k * 2) / 3
    d = (k + d * 2) / 3
    return { ...q, k, d }
  })
}

function calculateMA(dayCount, quotes) {
  let result = [];
  for (let i = 0; i < quotes.length; i++) {
    if (i < dayCount - 1) { result.push(null); continue; }
    let sum = 0;
    let valid = true;
    for (let j = 0; j < dayCount; j++) {
      if (quotes[i - j].close == null) valid = false;
      sum += quotes[i - j].close;
    }
    result.push(valid ? sum / dayCount : null);
  }
  return result;
}

function findLastGoldenCrossWave(kdData) {
  if (!kdData || kdData.length < 2) return null;
  for (let i = kdData.length - 2; i > 0; i--) {
    const prev = kdData[i - 1]; const curr = kdData[i];
    if (prev && curr && prev.k !== null && prev.k <= prev.d && curr.k > curr.d && curr.k < 30) {
      return { date: curr.date, close: curr.close }
    }
  }
  return null;
}

async function initTaiexChart() {
  if (taiexAllData.value) return 
  isChartLoading.value = true

  try {
    const res = await $fetch('/api/taiex')
    if (!res.success) throw new Error(res.message)

    const safeDaily = sanitizeData(res.data.daily)
    const safeWeekly = sanitizeData(res.data.weekly)
    const safeMonthly = sanitizeData(res.data.monthly)

    if (safeDaily.length < 60) throw new Error("取得的有效 K 線資料不足，無法計算長均線")

    taiexAllData.value = {
      daily: calculateKD(safeDaily),
      weekly: calculateKD(safeWeekly),
      monthly: calculateKD(safeMonthly)
    }

    const dailyData = taiexAllData.value.daily
    const weeklyKD = taiexAllData.value.weekly
    const monthlyKD = taiexAllData.value.monthly
    const latestClose = dailyData[dailyData.length - 1].close

    const ma20Data = calculateMA(20, dailyData)
    const ma60Data = calculateMA(60, dailyData)
    
    const latestMA20 = ma20Data[ma20Data.length - 1] || 0
    const latestMA60 = ma60Data[ma60Data.length - 1] || 0
    const prevMA20 = ma20Data[ma20Data.length - 2] || 0
    const prevMA60 = ma60Data[ma60Data.length - 2] || 0
    
    const ma20Trend = latestMA20 > prevMA20 ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>'
    const ma60Trend = latestMA60 > prevMA60 ? '<span class="text-danger">↗ (上揚)</span>' : '<span class="text-success">↘ (下彎)</span>'

    const d20_index = Math.max(0, dailyData.length - 20)
    const deduction20 = { 
      date: dailyData[d20_index].date, price: dailyData[d20_index].close, 
      diff: latestClose - dailyData[d20_index].close, isSafe: latestClose >= dailyData[d20_index].close 
    }
    
    const d60_index = Math.max(0, dailyData.length - 60)
    const deduction60 = { 
      date: dailyData[d60_index].date, price: dailyData[d60_index].close, 
      diff: latestClose - dailyData[d60_index].close, isSafe: latestClose >= dailyData[d60_index].close 
    }

    const lastWeeklyWave = findLastGoldenCrossWave(weeklyKD)
    let weeklyAnalysis = '', weeklyAlert = '', wAlertClass = ''
    if (lastWeeklyWave) {
      const pointDiff = latestClose - lastWeeklyWave.close
      weeklyAnalysis = `前次週KD低檔金叉發生在 ${lastWeeklyWave.date}。目前已 ${pointDiff >= 0 ? '上漲' : '下跌'} ${Math.round(Math.abs(pointDiff))} 點。`
      if (pointDiff >= 800) { weeklyAlert = `⚠️ 週線波段漲 ${Math.round(pointDiff)} 點超越極值，隨時有回檔修正乖離之風險！`; wAlertClass = 'alert-danger' }
      else if (pointDiff >= 600) { weeklyAlert = `⚡ 週線達極值下緣，留意月線 (20MA) 扣抵值支撐。`; wAlertClass = 'alert-warning' }
      else { weeklyAlert = `✅ 中線極值未滿足，若防守住 20MA 扣抵仍有空間。`; wAlertClass = 'alert-success' }
    } else {
      weeklyAnalysis = '目前週 KD 歷史資料中尚未出現明顯的低檔起漲點。'
      weeklyAlert = '保持警惕，觀察 20MA 扣抵支撐。'; wAlertClass = 'alert-secondary'
    }

    const lastMonthlyWave = findLastGoldenCrossWave(monthlyKD)
    let monthlyAnalysis = '', monthlyAlert = '', mAlertClass = ''
    if (lastMonthlyWave) {
      const pointDiff = latestClose - lastMonthlyWave.close
      monthlyAnalysis = `前次月KD低檔金叉發生在 ${lastMonthlyWave.date}。長波段已上漲 ${Math.round(pointDiff)} 點。`
      if (pointDiff >= 2000) {
        if (monthlyKD[monthlyKD.length-1].k > 80) {
          monthlyAlert = `⚠️ 長波段漲 ${Math.round(pointDiff)} 點滿足極值要求！若最新價無法大於 60MA 扣抵值，將結束長波段。`; mAlertClass = 'alert-danger'
        } else { monthlyAlert = `⚡ 進入長線高檔風險區，緊盯季線扣抵值。`; mAlertClass = 'alert-warning' }
      } else { monthlyAlert = `✅ 長波段 2000 點極值尚未滿足。`; mAlertClass = 'alert-success' }
    } else {
      monthlyAnalysis = '目前月 KD 歷史資料中尚未出現明顯的低檔起漲點。'
      monthlyAlert = '大趨勢不明，以季線(60MA)防守為準。'; mAlertClass = 'alert-secondary'
    }

    taiexAnalysis.value = {
      daily: { current: latestClose, ma20: latestMA20, ma20_trend: ma20Trend, ma60: latestMA60, ma60_trend: ma60Trend, deduction20, deduction60 },
      weekly: { k: weeklyKD[weeklyKD.length - 1].k, d: weeklyKD[weeklyKD.length - 1].d, analysis: weeklyAnalysis, alertText: weeklyAlert, alertClass: wAlertClass },
      monthly: { k: monthlyKD[monthlyKD.length - 1].k, d: monthlyKD[monthlyKD.length - 1].d, analysis: monthlyAnalysis, alertText: monthlyAlert, alertClass: mAlertClass }
    }

    renderEChart()
  } catch (error) { 
    alert('資料讀取異常，請稍後再試：\n' + error.message) 
  } finally { 
    isChartLoading.value = false 
  }
}

function renderEChart() {
  if (!taiexAllData.value) return;
  const targetData = taiexAllData.value[currentPeriod.value]
  if (targetData.length === 0) return;
  
  const categoryData = targetData.map(item => item.date)
  const candleValues = targetData.map(item => [item.open, item.close, item.low, item.high])
  const ma20Data = calculateMA(20, targetData)
  const ma60Data = calculateMA(60, targetData)
  const kData = targetData.map(item => item.k)
  const dData = targetData.map(item => item.d)

  const volumeData = targetData.map((item) => ({
    value: item.volume,
    itemStyle: { color: item.close >= item.open ? '#dc3545' : '#198754' }
  }))

  const kdMarks = []
  for (let i = 1; i < targetData.length; i++) {
    const prev = targetData[i - 1]; const curr = targetData[i]
    if (prev.k === null || curr.k === null) continue;
    if (prev.k <= prev.d && curr.k > curr.d) { kdMarks.push({ coord: [i, curr.k], symbol: 'arrow', symbolSize: 12, itemStyle: { color: '#dc3545' }, value: '金叉' }) }
    if (prev.k >= prev.d && curr.k < curr.d) { kdMarks.push({ coord: [i, curr.k], symbol: 'arrow', symbolRotate: 180, symbolSize: 12, itemStyle: { color: '#198754' }, value: '死叉' }) }
  }

  const candleMarks = []
  if (currentPeriod.value === 'daily' && targetData.length >= 60) {
    const d20_idx = targetData.length - 20; const d60_idx = targetData.length - 60
    candleMarks.push({ coord: [d20_idx, candleValues[d20_idx][1]], value: '20MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#0dcaf0' }})
    candleMarks.push({ coord: [d60_idx, candleValues[d60_idx][1]], value: '60MA扣抵', symbol: 'pin', symbolSize: 40, itemStyle: { color: '#ffc107' }})
  }

  setTimeout(() => {
    const chartDom = document.getElementById('taiexChart')
    if (!chartDom || !window.echarts) return;
    if (!chartInstance) chartInstance = window.echarts.init(chartDom)
    
    chartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] }, 
      legend: { data: ['K線', '20MA', '60MA', '成交量', 'K值', 'D值'] },
      grid: [
        { left: '8%', right: '5%', top: '5%', height: '50%' },   
        { left: '8%', right: '5%', top: '58%', height: '15%' },  
        { left: '8%', right: '5%', top: '76%', height: '15%' }   
      ],
      xAxis: [
        { type: 'category', data: categoryData, gridIndex: 0, boundaryGap: true, axisLabel: { show: false } },
        { type: 'category', data: categoryData, gridIndex: 1, boundaryGap: true, axisLabel: { show: false } },
        { type: 'category', data: categoryData, gridIndex: 2, boundaryGap: true }
      ],
      yAxis: [
        { scale: true, gridIndex: 0, splitArea: { show: true } },
        { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, splitLine: { show: false }, axisLine: { show: false }, axisTick: { show: false } },
        { min: 0, max: 100, gridIndex: 2, splitLine: { show: true, lineStyle: { type: 'dashed'} }, splitNumber: 2 }
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1, 2], start: 50, end: 100 },
        { show: true, type: 'slider', xAxisIndex: [0, 1, 2], top: '94%', start: 50, end: 100 }
      ],
      series: [
        { name: 'K線', type: 'candlestick', data: candleValues, xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#dc3545', color0: '#198754', borderColor: '#dc3545', borderColor0: '#198754' }, markPoint: { data: candleMarks, label: { color: '#000', fontWeight: 'bold' } } },
        { name: '20MA', type: 'line', data: ma20Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#0dcaf0' } },
        { name: '60MA', type: 'line', data: ma60Data, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#ffc107' } },
        { name: '成交量', type: 'bar', data: volumeData, xAxisIndex: 1, yAxisIndex: 1 },
        { name: 'K值', type: 'line', data: kData, xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#dc3545' }, markPoint: { data: kdMarks, label: { show: false } } },
        { name: 'D值', type: 'line', data: dData, xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#0d6efd' } }
      ]
    }, true)
  }, 100)
}
</script>

<style>
body { background-color: #f4f6f9; font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; }
.header-section { background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%); color: white; padding: 40px 0; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px; transition: transform 0.2s; overflow: hidden; }
.card:hover { transform: translateY(-3px); }
.card-header { font-weight: bold; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); }

.nav-tabs .nav-link { border: none; color: #6c757d; transition: all 0.3s; }
.nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 4px solid #0d6efd; background-color: transparent; }
.nav-tabs .nav-link:hover:not(.active) { color: #0d6efd; border-bottom: 4px solid #e9ecef; }

.status-Safe { color: #198754; font-weight: bold; }
.status-Warning { color: #fd7e14; font-weight: bold; }
.status-Danger { color: #dc3545; font-weight: bold; }
.advice-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 1.2rem; }
.advice-Safe { background-color: #d1e7dd; color: #0f5132; }
.advice-Caution { background-color: #fff3cd; color: #664d03; }
.advice-Reduce { background-color: #ffecb5; color: #664d03; border: 2px solid #ffc107; }
.advice-Flee { background-color: #f8d7da; color: #842029; }
.metric-item { padding: 12px; border-radius: 8px; background-color: #f8f9fa; border: 1px solid #e9ecef; height: 100%; }
.metric-label { font-size: 0.85rem; color: #6c757d; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.metric-value { font-size: 1.1rem; font-weight: 700; color: #212529; word-break: break-word; }
.metric-sub { font-size: 0.75rem; color: #adb5bd; margin-top: 2px; }
.section-bar-tw { border-left: 5px solid #0d6efd; }
.section-bar-us { border-left: 5px solid #dc3545; }
.section-bar-cycle { border-left: 5px solid #198754; }
.section-bar-sentiment { border-left: 5px solid #ffc107; }
</style>
