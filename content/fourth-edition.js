const fourthEdition = {
  edition: 4,
  year: 2015,
  title: "The Essentials of Computer Organization and Architecture",
  authors: ["Linda Null", "Julia Lobur"],
  isbn: "9781284033144",
  sources: {
    chapters: "https://samples.jblearning.com/9781284123036/Transition_Guide_FinalforPubHub.pdf",
    catalog: "https://search.worldcat.org/title/946586580"
  },
  chapters: [
    {
      chapter: 1,
      title: "Introduction",
      zh: "導論",
      summary: "從主要硬體元件、計算機層次結構與歷史發展建立全貌，再以 von Neumann 模型說明程式與資料如何共用記憶體，以及平行處理為何需要不同的執行模型。",
      courseUse: "第 1 週的抽象層次、ISA 與微架構分工、von Neumann 狀態模型。"
    },
    {
      chapter: 2,
      title: "Data Representation in Computer Systems",
      zh: "計算機系統的資料表示",
      summary: "涵蓋進位系統、補數、整數算術、浮點數、字元編碼與錯誤偵測。共同核心是：位元本身沒有型別，解讀規則決定數值、字元與錯誤檢查的意義。",
      courseUse: "第 3、7 週的 two's complement、carry/overflow、IEEE 754 與位元解讀。"
    },
    {
      chapter: 3,
      title: "Boolean Algebra and Digital Logic",
      zh: "布林代數與數位邏輯",
      summary: "由布林函數、邏輯閘與化簡進入組合電路和循序電路。資料路徑中的加法器與多工器屬於組合邏輯，暫存器與狀態機則依時脈保存狀態。",
      courseUse: "第 7、10 週理解 ALU、控制訊號、暫存器與 clocked state 的先備概念。"
    },
    {
      chapter: 4,
      title: "MARIE: An Introduction to a Simple Computer",
      zh: "MARIE：簡易計算機導論",
      summary: "以精簡累加器架構呈現 CPU、匯流排、記憶體、I/O、指令週期、組譯器與控制單元。MARIE 的價值是讓每一個 register transfer 都能被完整追蹤。",
      courseUse: "第 4、6、8、10 週以 MARIE 建立 CPU 基本模型，再以 MIPS 延伸到 register file 與 load-store ISA。"
    },
    {
      chapter: 5,
      title: "A Closer Look at Instruction Set Architectures",
      zh: "深入指令集架構",
      summary: "比較指令格式、operand 數量、指令類型、addressing mode、pipeline 與不同真實 ISA。ISA 的每個編碼決策都會影響程式表達能力與硬體解碼成本。",
      courseUse: "第 4 至 8 週的 MIPS，以及第 11、12 週的 instruction pipelining。"
    },
    {
      chapter: 6,
      title: "Memory",
      zh: "記憶體",
      summary: "由記憶體種類與階層進入 locality、cache mapping、replacement、effective access time、write policy，再延伸到 virtual memory、paging 與 segmentation。",
      courseUse: "第 13 至 16 週的 memory hierarchy、cache、mapping、replacement 與 AMAT。"
    },
    {
      chapter: 7,
      title: "Input/Output and Storage Systems",
      zh: "輸出入與儲存系統",
      summary: "從 I/O 對效能的影響出發，比較控制方式、傳輸模式、磁碟、SSD、光碟、磁帶與 RAID。I/O 延遲與可平行比例也能用 Amdahl's Law 分析。",
      courseUse: "第 2、17 週用來連結 Amdahl's Law、system bottleneck 與非 CPU 成本。"
    },
    {
      chapter: 8,
      title: "System Software",
      zh: "系統軟體",
      summary: "說明作業系統、保護環境、虛擬機、組譯器、linker、compiler 與 interpreter 如何把程式轉換成硬體可執行的狀態變化。",
      courseUse: "第 1、6、17 週的抽象層次、組譯流程、函式連結與 hardware/software interface。"
    },
    {
      chapter: 9,
      title: "Alternative Architectures",
      zh: "替代型計算機架構",
      summary: "由 RISC、Flynn taxonomy、superscalar、VLIW、vector 與 multiprocessor 比較不同平行方式，並延伸到 dataflow、neural network、systolic array 與 quantum computing。",
      courseUse: "第 1、11、17 週用來區分 pipeline throughput、instruction-level parallelism 與多處理器平行。"
    },
    {
      chapter: 10,
      title: "Topics in Embedded Systems",
      zh: "嵌入式系統專題",
      summary: "比較現成、可組態與客製硬體，並討論受限記憶體、嵌入式作業系統與軟體開發。資源限制會讓效能、功耗與容量成為同時存在的設計條件。",
      courseUse: "第 17 週的跨層案例可用來辨認硬體資源、軟體需求與效能限制。"
    },
    {
      chapter: 11,
      title: "Performance Measurement and Analysis",
      zh: "效能量測與分析",
      summary: "以效能方程式、平均值、benchmark、MIPS/FLOPS 指標與 CPU 最佳化建立量測方法。正確比較必須固定 workload，並區分 latency、throughput 與局部改善比例。",
      courseUse: "第 2 週的 CPU Time、CPI、Amdahl's Law，以及第 11 至 18 週的整合效能分析。"
    },
    {
      chapter: 12,
      title: "Network Organization and Architecture",
      zh: "網路組織與架構",
      summary: "從 OSI 與 TCP/IP 分層進入傳輸媒介、switch、bridge、gateway 與 router。網路分層再次呈現 interface 隱藏實作細節的抽象方法。",
      courseUse: "可與第 1 週的層次抽象對照；不列入本課 18 週硬體主線。"
    },
    {
      chapter: 13,
      title: "Selected Storage Systems and Interfaces",
      zh: "儲存系統與介面選論",
      summary: "比較 SCSI、iSCSI、SAN、SATA、SAS、PCI、USB 與 cloud storage，重點是介面如何規範命令、資料傳輸與裝置互通。",
      courseUse: "可延伸第 7 章的 I/O 與儲存觀念；不列入本課 18 週硬體主線。"
    }
  ],
  weekMap: [
    { week: 1, chapters: [1, 8], sections: "1.6、1.8–1.10；8.4", focus: "層次結構、von Neumann 模型，以及程式從系統軟體到 ISA 的界面。" },
    { week: 2, chapters: [11, 7], sections: "11.2–11.5；7.2–7.3", focus: "CPU performance equation、benchmark 限制與 Amdahl's Law。" },
    { week: 3, chapters: [2, 5], sections: "2.2–2.6；5.2.2", focus: "進位、補數、字元編碼與 big/little endian。" },
    { week: 4, chapters: [4, 5], sections: "4.8、4.14.2；5.3、5.6.2", focus: "先由 MARIE 的累加器模型看見狀態，再進入 MIPS register file 與 load-store。" },
    { week: 5, chapters: [5], sections: "5.3–5.4、5.6.2", focus: "資料移動、控制轉移、addressing mode 與 MIPS memory operand。" },
    { week: 6, chapters: [4, 8], sections: "4.9–4.11；8.4.1–8.4.4", focus: "instruction cycle、assembler、compiler 與函式呼叫狀態。" },
    { week: 7, chapters: [2, 3], sections: "2.4–2.5；3.5", focus: "整數算術、carry/overflow、IEEE 754 與 arithmetic circuit。" },
    { week: 8, chapters: [4, 5], sections: "4.13–4.14；5.2、5.6.2", focus: "instruction format、decode、hardwired control 與 MIPS 編碼。" },
    { week: 9, chapters: [1, 2, 4, 5, 11], sections: "前八週整合", focus: "由抽象層、資料表示、指令週期、ISA 到效能方程式建立完整證據鏈。" },
    { week: 10, chapters: [3, 4], sections: "3.5–3.6；4.2–4.3、4.9、4.13", focus: "組合邏輯、clocked state、bus、register transfer 與控制單元。" },
    { week: 11, chapters: [5, 9], sections: "5.5；9.2–9.4", focus: "instruction pipelining 與更廣義的 instruction-level parallelism。" },
    { week: 12, chapters: [5, 11], sections: "5.5；11.5.1", focus: "pipeline hazard、branch penalty 與 branch optimization。" },
    { week: 13, chapters: [6], sections: "6.2–6.3", focus: "memory type、hierarchy 與 temporal/spatial locality。" },
    { week: 14, chapters: [6], sections: "6.4、6.4.5–6.4.7", focus: "cache line 狀態、write policy、instruction/data cache 與多層 cache。" },
    { week: 15, chapters: [6], sections: "6.4.1–6.4.3", focus: "mapping、tag/index/offset、hit ratio 與 effective access time。" },
    { week: 16, chapters: [6], sections: "6.4.2–6.5.4", focus: "replacement、多層 AMAT，以及 cache、TLB、paging 的成本分解。" },
    { week: 17, chapters: [8, 9, 10, 11], sections: "8.4；9.2–9.4；10.2–10.3；11.2–11.5", focus: "從 compiler、ISA、pipeline、memory 到 workload 的跨層效能分析。" },
    { week: 18, chapters: [2, 4, 5, 6, 11], sections: "全課整合", focus: "以 correctness、state、cycle、memory traffic 與 CPU Time 五種證據交叉檢查。" }
  ],
  marie: {
    overview: "MARIE 是第 4 版用來呈現基本計算機組織的累加器架構。它不是 MIPS 的縮小版，而是一個刻意簡化的模型：運算主要透過 AC，讓 register transfer 與指令週期容易逐步追蹤。",
    format: {
      totalBits: 16,
      fields: [
        { label: "Opcode", bits: 4, detail: "選擇操作" },
        { label: "Address", bits: 12, detail: "最多定位 4096 個 memory words" }
      ]
    },
    registers: [
      ["AC", "16 bits", "累加器，保存算術與邏輯運算的主要 operand/result"],
      ["MAR", "12 bits", "Memory Address Register，指出要存取的 word"],
      ["MBR", "16 bits", "Memory Buffer Register，暫存從 memory 讀出或準備寫入的 word"],
      ["PC", "12 bits", "Program Counter，指出下一個 instruction word"],
      ["IR", "16 bits", "Instruction Register，保存目前正在 decode/execute 的指令"],
      ["InREG / OutREG", "8 bits", "輸入與輸出資料暫存器"]
    ],
    fetch: [
      "MAR ← PC",
      "MBR ← M[MAR]",
      "IR ← MBR",
      "PC ← PC + 1",
      "Decode IR[15:12]，並視指令使用 IR[11:0]"
    ],
    comparison: [
      ["主要運算狀態", "AC 累加器", "32 個 general-purpose registers"],
      ["基本指令長度", "16 bits", "32 bits"],
      ["算術 operand", "通常隱含 AC", "通常明確指定 rs、rt、rd"],
      ["記憶體模式", "word-addressed 教學模型", "byte-addressed load-store architecture"],
      ["下一指令", "PC + 1 word", "PC + 4 bytes"],
      ["核心用途", "追蹤完整 register transfer", "分析實際 RISC 編碼、datapath 與 pipeline"]
    ],
    worked: {
      prompt: "計算 Z = X + Y。比較 MARIE 與 MIPS 需要顯式表示的狀態。",
      marie: ["Load X", "Add Y", "Store Z"],
      mips: ["lw $t0, 0($s0)   # X", "lw $t1, 4($s0)   # Y", "add $t2, $t0, $t1", "sw $t2, 8($s0)   # Z"],
      conclusion: "MARIE 把第一個 operand 與 result 隱含在 AC；MIPS 把來源與目的暫存器寫在指令中。兩者都需要 memory read、ALU add 與 memory write，但 ISA 顯露的狀態不同。"
    },
    checks: [
      ["為何 MARIE 的 PC 加 1，而 MIPS 的 PC 通常加 4？", "MARIE 以 16-bit word 為指令位址單位；MIPS memory 為 byte-addressed，固定指令長 4 bytes。"],
      ["MAR 與 MBR 的角色有何不同？", "MAR 指定位址；MBR 保存該位址讀出或準備寫入的資料。"],
      ["MARIE 的 Add 為何不需要三個 register 欄位？", "其中一個來源與目的都隱含為 AC，另一個 operand 由 address 欄位指定。"]
    ]
  }
};
