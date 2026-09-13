const semesterSchedule = {
  term: "115 學年度第 1 學期",
  chapters: [1, 4, 5, 6, 7, 8],
  weeks: [
    { week: 1, date: "2026-09-07", type: "class", chapters: [1], title: "計算機系統導論與抽象層次", outcome: "辨認 CPU、記憶體、I/O 與互連的分工，區分 ISA 與微架構，說明 stored-program 與 von Neumann 模型。" },
    { week: 2, date: "2026-09-14", type: "class", chapters: [1], title: "指令生命週期與系統效能觀念", outcome: "追蹤程式由軟體到硬體的執行路徑，區分 latency 與 throughput，運用 CPU time 與 Amdahl's Law 分析基本效能。" },
    { week: 3, date: "2026-09-21", type: "class", chapters: [4], title: "MARIE 架構、暫存器與指令週期", outcome: "辨認 MARIE 暫存器與匯流排，解讀 16-bit 指令格式，追蹤 fetch、decode、execute 的 register transfers。" },
    { week: 4, date: "2026-09-28", type: "holiday", chapters: [], title: "放假", outcome: "" },
    { week: 5, date: "2026-10-05", type: "class", chapters: [4], title: "MARIE 指令與組合語言程式", outcome: "以 Load、Store、Add、Input、Output、Skipcond 與 Jump 完成算術、條件判斷與迴圈，逐步追蹤 PC、AC 與記憶體。" },
    { week: 6, date: "2026-10-12", type: "class", chapters: [4], title: "MARIE 定址、副程式與控制單元", outcome: "追蹤間接定址與 JnS／JumpI 呼叫返回，說明兩趟組譯、符號解析，以及硬接線與微程式控制的差異。" },
    { week: 7, date: "2026-10-19", type: "class", chapters: [5], title: "ISA 指令格式與定址模式", outcome: "比較累加器與 load-store 架構，解讀 MIPS R／I／J 格式、立即值擴展、有效位址與分支目標。" },
    { week: 8, date: "2026-10-26", type: "holiday", chapters: [], title: "放假", outcome: "" },
    { week: 9, date: "2026-11-02", type: "midterm", chapters: [1, 4, 5], title: "期中考試週", outcome: "範圍為第 1、4 章及第 5 章已完成的指令格式與定址模式；不含期中考後的函式呼叫與管線內容。" },
    { week: 10, date: "2026-11-09", type: "class", chapters: [5], title: "函式呼叫、指令管線與 Hazard", outcome: "區分 ISA 機制與 ABI 慣例，追蹤五階段 pipeline，分析 structural、data、control hazards，以及 forwarding、stall 與 branch penalty。" },
    { week: 11, date: "2026-11-16", type: "class", chapters: [6], title: "記憶體階層、區域性與 Cache Mapping", outcome: "比較 SRAM 與 DRAM，說明 temporal／spatial locality，計算 tag、index、offset，追蹤 direct、associative 與 set-associative mapping。" },
    { week: 12, date: "2026-11-23", type: "class", chapters: [6], title: "Cache 替換、寫入策略與效能", outcome: "比較 replacement、write-through／write-back 與 write-allocate 策略，計算命中率及多層 AMAT，分析存取順序的影響。" },
    { week: 13, date: "2026-11-30", type: "class", chapters: [6], title: "虛擬記憶體、Page Table 與 TLB", outcome: "拆解虛擬與實體位址，追蹤 paging、page-table walk 與 TLB，區分 TLB miss、page fault 與 protection fault。" },
    { week: 14, date: "2026-12-07", type: "class", chapters: [7], title: "I/O 介面、Interrupt 與 DMA", outcome: "說明裝置暫存器與 I/O 交易，比較 polling、interrupt、DMA 的 CPU 成本，追蹤中斷處理及 buffer ownership。" },
    { week: 15, date: "2026-12-14", type: "class", chapters: [7], title: "儲存系統與 I/O 效能", outcome: "比較 HDD、SSD 與 NVMe，分析 RAID 容量與容錯，計算 latency、IOPS、throughput 與 queue depth 的關係。" },
    { week: 16, date: "2026-12-21", type: "class", chapters: [8], title: "組譯、編譯、連結與載入", outcome: "追蹤原始碼到執行映像的流程，說明 symbols、relocation、靜態／動態連結，並比較 compiler、interpreter 與 JIT。" },
    { week: 17, date: "2026-12-28", type: "class", chapters: [8], title: "作業系統、保護與虛擬化整合", outcome: "區分 privilege、system call 與 context switch，比較虛擬機與 container，整合程式執行、位址轉譯及 I/O 的端到端路徑。" },
    { week: 18, date: "2027-01-04", type: "final", chapters: [1, 4, 5, 6, 7, 8], title: "期末測驗", outcome: "整合本學期第 1、4、5、6、7、8 章，串連 ISA、指令執行、記憶體、I/O 與系統軟體。" }
  ]
};
