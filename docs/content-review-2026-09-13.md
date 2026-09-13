# 全站教材審查紀錄（2026-09-13）

審查涵蓋首頁、版本對照頁及第 1–13 章，共 15 個頁面。檢查主文、例題與練習的計算及適用條件，並同步核對受修正內容影響的圖表、術語、來源與產生器。完成後共 167 個概念單元、138 個逐步例題、235 題練習。

## 主要修正

| 位置 | 審查結果與處理 |
| --- | --- |
| 首頁／書目 | 加入本學期選讀章節與進度表連結，標明第 2、3 章的先備角色；區分英文第 4 版 ISBN 與中文章名。 |
| 第 1 章 | 核對抽象、狀態、pipeline、precise exception、功耗與效能例題；保留既定課程進度。 |
| 第 2 章 | 補正 unsigned 與 signed 縮窄時不同的數值保留條件。 |
| 第 3 章 | reset 同步器在 30 ns edge 後釋放，功能暫存器於 40 ns 首次更新；同步修正圖表、例題及練習。區分最高 sum bit 與 carry-out 的 timing endpoint。 |
| 第 4 章 | 審查後整合先前保留草稿：memory transaction 計數、overflow、軟體 stack、loop invariant。補充 signed subtraction 比較的 overflow 限制、重入所需保存的額外狀態，加入可執行且會保存 Sum 的 MARIE 程式。 |
| 第 5 章 | non-leaf 範例改為 24-byte o32 frame，保留 16-byte outgoing argument area；補充 overflow-trapping 與 non-trapping arithmetic、addiu/sltiu 的 sign extension。 |
| 第 6 章 | 修正 replacement trace 初始狀態；補充 VIPT 的容量／ways／page-size 條件及計算例題、Sv32 的 34-bit PA 與 superpage，以及不需 storage I/O 的 page faults。 |
| 第 7 章 | 區分六路 RAID 1（4 TB）與三組雙路鏡像的 RAID 10（12 TB），更新容錯表；補充 S-mode interrupt enable 對目前 privilege 的依賴。 |
| 第 8 章 | 區分 ecall 的正常返回 PC+4 與可修復 page fault 的原 PC 重試；補充 write 的部分完成、raw syscall／libc 錯誤表示及 durability 邊界。 |
| 第 9 章 | RVV 最後兩輪可有不同合法 VL；題目明示最大 VL 假設，補充 6+5 與 8+3 的合法差異。修正 VL、C/C++ data race、FENCE 與 issue 下界的語意。 |
| 第 10 章 | 補充 RX DMA 前後 ownership/cache 同步；明示 response-time test 的假設與自身 jitter；六類 IoT 技術能力正確歸於 NISTIR 8259A。 |
| 第 11 章 | 核對量測、CPI、PMU、Roofline、Amdahl、能源與統計例題；保留已核實的 SPEC CPU 2026 資料。 |
| 第 12 章 | 修正 Stanford CS144 連結；明示 Shannon 的 AWGN 模型、MAC／PHY rate、next-hop routing 與 RFC 6298 建議下限。 |
| 第 13 章 | 區分平均在途數與設定最大 QD，補充 NVMe queue 可用空間假設；保留已核實的 NVMe Base 2.4 資料。 |

## 驗證方式

執行 `node tools/build-pages.js` 與 `node tools/validate-content.js`。後者會自動執行新增的 `tools/validate-review-examples.js`，驗證：

- 組譯並執行教材內實際顯示的 MARIE source，確認終止、輸出 9、Sum／Ptr／Ctr 最終狀態。
- 逐 edge 依舊 state 取樣，驗證 reset 釋放與首次功能更新相差一個 edge。
- 模擬被呼叫函式覆寫四個 argument slots，確認 MIPS saved registers 未遭破壞。
- 以最大與平衡 VL 兩種合法策略完成 RVV strip mining。
- 列舉六顆磁碟全部 64 種失效集合，驗證單一六路鏡像與 RAID 10 的保證容錯差異。
- 檢查 localStorage 正常與丟出錯誤時，主題切換及列印 callback 仍可運作。
- 檢查全部本機連結與 fragment anchors、圖表欄位、既有數值例題，以及 18 個週次的日期和類型。

瀏覽器實際查看首頁及新增程式碼的展開效果，並以 390 px viewport 逐頁量測 15 頁的文件寬度：全部無整頁橫向溢出。大型表格與導覽列保留各自的橫向捲動。檢查到的 `undefined` 均為教材中的 `undefined behavior`／`undefined symbol` 等術語，非缺值輸出。

## 來源與限制

本次對外部連結進行 HTTP 可達性檢查。原 Stanford GitHub Pages 入口的 404 已替換為 [CS144 官方網域](https://cs144.stanford.edu/)；草稿中的 UT Tyler 課綱 PDF 也回傳 404，因其用途已被其他來源涵蓋而移除。ACM、SNIA 的部分連結有防自動化限制，Penn State 與 SEI 的部分主機未能完成連線；不能把這些結果等同於內容不存在。HTTP 200 也只表示可達，不表示對整份來源或所有技術敘述的形式化證明。

最終保留的 260 個不同外部 URL 中，250 個回傳 200、2 個回傳 202、4 個回傳 403、4 個未能完成連線；已無本次檢查確認的 404。全部 15 頁的本機檔案連結、fragment anchors 與重複 ID 檢查通過。

關鍵修正依據包括 [MIPS calling convention](https://www.cs.cornell.edu/courses/cs314/2003fa/handouts/procs2.html)、[MARIE.js v2.3.0 原始碼](https://github.com/MARIE-js/MARIE.js/blob/v2.3.0/src/marie.ts)、[RISC-V V](https://docs.riscv.org/reference/isa/unpriv/v-st-ext)、[RISC-V supervisor ISA](https://docs.riscv.org/reference/isa/priv/supervisor.html)、[VIPT／VESPA](https://arxiv.org/abs/1701.03499)、[Linux DMA guide](https://docs.kernel.org/core-api/dma-api-howto.html)、[write(2)](https://man7.org/linux/man-pages/man2/write.2.html) 及 [NISTIR 8259A](https://doi.org/10.6028/NIST.IR.8259A)。

本次沒有改動 `content/course-schedule.js`：2026/09/07 開始、09/28 與 10/26 放假、期中及期末日期、期末僅含期中之後內容等安排均保留。
