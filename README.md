# 計算機組織線上講義

這個資料夾是以章節為主的純靜態教材網站，可直接部署到 GitHub Pages。

## 網站結構

- `index.html`：現代 CPU 概念圖與 13 章教材索引
- `fourth-edition-map.html`：第 4 版 13 章與 MARIE–MIPS 對照
- `chapters/chapter-01.html` 到 `chapters/chapter-13.html`：各章完整教材
- `styles.css`：全站樣式與列印樣式
- `site.js`：明暗模式與列印功能
- `app.js`：目前的課程內容資料來源
- `content/supplements.js`：各主題圖表、推導例題與自我檢核
- `content/fourth-edition.js`：第 4 版書目、章節摘要、週次對照與 MARIE 資料
- `content/chapters.js`：完整章節教材、圖表、例題、練習詳解、術語與研究來源
- `tools/build-pages.js`：從內容資料產生首頁與 13 個章節頁面
- `tools/validate-content.js`：檢查圖表欄位、例題計算、頁面結構與內部連結

## 本機預覽

直接開啟 `index.html`，或在此資料夾執行：

```bash
python3 -m http.server 8000
```

再瀏覽 `http://localhost:8000`。

## 更新教材內容

1. 編輯 `app.js`、`content/supplements.js`、`content/fourth-edition.js` 或 `content/chapters.js` 中的資料。
2. 執行：

```bash
node tools/build-pages.js
node tools/validate-content.js
```

3. 檢查 `index.html` 與 `chapters/` 內頁是否更新。

## GitHub Pages 部署

Repository 根目錄就是這個 `lectures/` 資料夾。GitHub Pages 目前從 `main` branch 的 `/ (root)` 發佈。

公開網址：<https://minhuangyuntech.github.io/computer-organization/>

## 參考範圍

內容對照 Linda Null 與 Julia Lobur《The Essentials of Computer Organization and Architecture》第 4 版（2015，ISBN 9781284033144）的章節架構。網站的中文敘述、例題、推導與圖表均為獨立編寫。

## 修訂紀錄

- 2026-08-30：完成第 3 章第二輪品質審查，擴充為 13 個概念單元、13 幅原創圖表、10 個逐步例題、18 題分級練習、49 個術語與 20 項權威來源；新增 generate/propagate、block/prefix carry-lookahead、static/dynamic hazard、consensus term、glitch 取樣邊界、MTBF 指數模型、pulse/multi-bit CDC、asynchronous assert/synchronous deassert、recovery/removal、clock enable 與 reset cost，並加入 carry equation、adder delay、hazard pulse、MTBF 及 reset timeline 的可重算驗證；來源核對至 AMD Vivado 2026.1、Altera Quartus Prime Pro 25.3、IEEE 1800-2023 與 Berkeley CS61C Fall 2026。
- 2026-08-29：完成第 2 章第二輪品質審查，擴充為 13 個概念單元、13 幅原創圖表、10 個逐步例題、18 題分級練習、50 個術語與 20 項權威來源；新增 mask/shift、packed-field round-trip、widening multiply、high/low product、toward-zero signed division、binary32 ULP、ties-to-even、五類 IEEE 754 exception、FMA、浮點非結合性與 deterministic serialization，並加入欄位擷取、乘除不變式、ULP 及每步 binary32 rounding 的可重算驗證；來源核對至 RISC-V 20260120 B/M extensions、Unicode 17、IEEE 754-2019、RFC 8949 與 Berkeley CS61C Fall 2026。
- 2026-08-28：完成第 1 章第二輪品質審查，擴充為 13 個概念單元、13 幅原創圖表、10 個逐步例題、18 題分級練習、49 個術語與 20 項權威來源；新增 instruction lifecycle、single/multi-cycle 與 pipeline 對照、out-of-order retire、precise exception、privilege、dynamic/static power、DVFS、energy/EDP、Moore/Dennard scaling、power wall、dark silicon 與 heterogeneous SoC，並加入 pipeline timing、Amdahl、功耗、能量及 accelerator data-movement 的可重算驗證；來源核對至 RISC-V 20260120 privileged ISA、Intel SDM 2026-08-19 更新與 SPEC CPU 2026。
- 2026-08-27：完成第 13 章「儲存系統與介面：從 I/O 命令到雲端物件」深度教材，新增 13 個概念單元、13 幅原創圖表、13 個逐步例題、18 題分級練習、58 個術語與 34 項權威來源；涵蓋 block/file/object 語意、端到端 I/O path、LBA/4K alignment、SCSI、SATA/AHCI/NCQ、SAS、PCIe 7.0、NVMe 2.4、USB BOT/UASP、SAN/iSCSI/NVMe-oF、Little's Law、flush/FUA 與 cloud object durability，並加入 LBA、transfer rate、queue、IOPS、durable ordering 與 multipart upload 可重算驗證；來源同步核對至 NIST SP 800-209 Rev. 1 初稿與 2026-08-04 NVMe 2.4 規格組，並修正 flow 圖的標籤與細節呈現。
- 2026-08-26：完成第 12 章「網路組織與架構：從 frame 到端到端連線」深度教材，新增 13 個概念單元、13 幅原創圖表、13 個逐步例題、18 題分級練習、44 個術語與 26 項權威來源；涵蓋分層封裝、四種 delay、Shannon capacity、Ethernet、learning switch/VLAN、CIDR、IPv4/IPv6、ARP/ND、LPM、Dijkstra/OSPF/BGP、UDP/TCP、RTO、BDP、DNS/TLS/HTTP/QUIC，並加入 subnet、fragment、route、ACK/window 的可重算驗證；同時補齊第 9、10 章兩張位元圖的欄位說明，新增全站未定義值檢查。
- 2026-08-25：完成第 11 章「效能量測與分析：從時間證據到可重現的最佳化」深度教材，新增 13 個概念單元、13 幅原創圖表、13 個逐步例題、18 題分級練習、40 個術語與 29 項權威來源；涵蓋 latency/throughput/tail latency、實驗設計與信賴區間、CPU time 與 CPI stack、SPEC CPU 2026、MLPerf Inference 6.0、PMU、sampling/tracing、Roofline、PGO、Amdahl/Gustafson、energy 與 EDP，並加入對應的可重算驗證。
- 2026-08-24：完成第 10 章「嵌入式系統：從硬體邊界到可預測且可更新的裝置」深度教材，新增 13 個概念單元、13 幅原創圖表、11 個逐步例題、18 題分級練習、36 個術語與 24 項權威來源；另加入 MCU/FPGA/ASIC 成本、MMIO bit mask、SysTick、interrupt/DMA utilization、EDF/RM、response-time、Flash/SRAM、UART/I2C、平均功率與 signed A/B update 可重算驗證。
- 2026-08-23：完成第 9 章「替代型計算機架構：從 ILP 到異質平行系統」深度教材，新增 13 個概念單元、13 幅原創圖表、11 個逐步例題、18 題分級練習、34 個術語與 21 項權威來源；另加入 superscalar IPC、out-of-order critical path、VLIW slot utilization、vector strip mining、SIMT divergence、false sharing、MPI latency、Amdahl/Gustafson scaling、systolic wavefront、roofline 與 quantum measurement 可重算驗證。
- 2026-08-22：完成第 8 章「系統軟體：從原始碼到受保護的執行環境」深度教材，新增 13 個概念單元、13 幅原創圖表、10 個逐步例題、18 題分級練習、30 個術語與 15 項權威來源；另加入 context-switch overhead、system-call ABI、branch displacement、ELF relocation/layout、BSS zero-fill、shared pages、compiler CPU time、JIT break-even 與 two-stage translation 可重算驗證。
- 2026-08-21：完成第 7 章「輸出入、儲存與現代裝置介面」深度教材，新增 13 個概念單元、13 幅原創圖表、10 個逐步例題、18 題分級練習、30 個術語與 15 項權威來源；另加入 polling/interrupt utilization、DMA CPU work、transaction efficiency、Little's Law、HDD latency、SSD WAF、RAID capacity 與 I/O Amdahl 可重算驗證。
- 2026-08-20：完成第 6 章「記憶體階層：Cache、虛擬記憶體與位址轉譯」深度教材，新增 13 個概念單元、13 幅原創圖表、9 個逐步例題、18 題分級練習、30 個術語與 15 項權威來源；另加入 cache address split、metadata、mapping trace、replacement、write traffic、AMAT、CPI、paging、Sv32 與 TLB 可重算驗證。
- 2026-08-19：完成第 5 章「指令集架構：編碼、定址與管線化執行」深度教材，新增 11 個概念單元、11 幅原創圖表、7 個逐步例題、16 題分級練習、24 個術語與 13 項權威來源；另加入 MIPS R/I/J encoding、immediate extension、effective address、branch/jump target、calling convention 與 pipeline timing 可重算驗證。
- 2026-08-18：完成第 4 章「MARIE：從指令位元到完整狀態追蹤」深度教材，新增 11 個概念單元、11 幅原創圖表、6 個逐步例題、15 題分級練習、21 個術語與 10 項權威來源；另加入 instruction encoding、signed arithmetic、indirect addressing、assembler 與 JnS/JumpI 可重算驗證。
- 2026-08-17：完成第 3 章「布林代數、數位邏輯與同步狀態」深度教材，新增 10 個概念單元、10 幅原創圖表、5 個逐步例題、14 題分級練習、20 個術語，以及 MIT、Berkeley、IEEE、Intel／Altera 權威來源；另加入 majority、full adder、timing 與 FSM 可重算驗證。
- 2026-08-16：完成第 2 章「位元模式、數值與文字的表示」深度教材，新增 10 個概念單元、5 個逐步例題、13 題分級練習、圖表、術語與 IEEE、Unicode、RFC、MIT、Berkeley、RISC-V、NIST 一手來源。
