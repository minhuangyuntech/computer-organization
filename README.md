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

- 2026-08-22：完成第 8 章「系統軟體：從原始碼到受保護的執行環境」深度教材，新增 13 個概念單元、13 幅原創圖表、10 個逐步例題、18 題分級練習、30 個術語與 15 項權威來源；另加入 context-switch overhead、system-call ABI、branch displacement、ELF relocation/layout、BSS zero-fill、shared pages、compiler CPU time、JIT break-even 與 two-stage translation 可重算驗證。
- 2026-08-21：完成第 7 章「輸出入、儲存與現代裝置介面」深度教材，新增 13 個概念單元、13 幅原創圖表、10 個逐步例題、18 題分級練習、30 個術語與 15 項權威來源；另加入 polling/interrupt utilization、DMA CPU work、transaction efficiency、Little's Law、HDD latency、SSD WAF、RAID capacity 與 I/O Amdahl 可重算驗證。
- 2026-08-20：完成第 6 章「記憶體階層：Cache、虛擬記憶體與位址轉譯」深度教材，新增 13 個概念單元、13 幅原創圖表、9 個逐步例題、18 題分級練習、30 個術語與 15 項權威來源；另加入 cache address split、metadata、mapping trace、replacement、write traffic、AMAT、CPI、paging、Sv32 與 TLB 可重算驗證。
- 2026-08-19：完成第 5 章「指令集架構：編碼、定址與管線化執行」深度教材，新增 11 個概念單元、11 幅原創圖表、7 個逐步例題、16 題分級練習、24 個術語與 13 項權威來源；另加入 MIPS R/I/J encoding、immediate extension、effective address、branch/jump target、calling convention 與 pipeline timing 可重算驗證。
- 2026-08-18：完成第 4 章「MARIE：從指令位元到完整狀態追蹤」深度教材，新增 11 個概念單元、11 幅原創圖表、6 個逐步例題、15 題分級練習、21 個術語與 10 項權威來源；另加入 instruction encoding、signed arithmetic、indirect addressing、assembler 與 JnS/JumpI 可重算驗證。
- 2026-08-17：完成第 3 章「布林代數、數位邏輯與同步狀態」深度教材，新增 10 個概念單元、10 幅原創圖表、5 個逐步例題、14 題分級練習、20 個術語，以及 MIT、Berkeley、IEEE、Intel／Altera 權威來源；另加入 majority、full adder、timing 與 FSM 可重算驗證。
- 2026-08-16：完成第 2 章「位元模式、數值與文字的表示」深度教材，新增 10 個概念單元、5 個逐步例題、13 題分級練習、圖表、術語與 IEEE、Unicode、RFC、MIT、Berkeley、RISC-V、NIST 一手來源。
