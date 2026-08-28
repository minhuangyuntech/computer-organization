const chapterDetails = [
  {
    chapter: 1,
    title: "從抽象層次到可執行的計算機",
    english: "From Abstraction Layers to an Executing Computer",
    revised: "2026-08-28",
    readingTime: "約 280–340 分鐘",
    intro: "一部現代計算機不是單一 CPU 方塊，而是一組跨越演算法、語言、ABI、ISA、microarchitecture、memory、I/O、interconnect 與實體電路的契約。程式執行時，architectural state 依指令逐步轉移；處理器內部則以 pipeline、speculation、cache 與平行資源加速，同時必須在 exception、interrupt 與故障邊界維持可恢復的精確狀態。本章建立可反覆使用的分析方法：先指出觀察層次與 interface，再列出可見 state，追蹤 fetch、decode、execute、memory、commit 與 exception，最後以 CPU time、throughput、energy、Amdahl's Law 及 failure domain 評估實作。內容也從 Moore 與 Dennard scaling 推導到 power wall、dark silicon、multicore 與 heterogeneous SoC，讓後續 MARIE、MIPS、pipeline、cache、I/O 與加速器都能放回同一端到端模型。",
    outcomes: [
      "能由應用程式一路說明到 transistor 的抽象層次，並指出相鄰層之間的 interface。",
      "能區分 instruction set architecture 與 microarchitecture，不再把 ISA 名稱當成某一顆 CPU 的內部結構。",
      "能用 PC、registers、memory 與 device state 描述 stored-program computer 的狀態。",
      "能逐步追蹤 fetch–decode–execute，辨認每一步讀取與更新的狀態。",
      "能區分 pipeline、SIMD/SIMT、multicore 與 distributed computing 所利用的平行層次。",
      "能以 correctness、latency、throughput 與 energy 等不同觀察指標評估實作。",
      "能沿 fetch、decode、operand read、execute、memory、write-back/retire 追蹤一條指令的資料與控制。",
      "能區分 exception、interrupt、trap 與一般 branch，並說明 precise architectural state 的必要性。",
      "能計算 CPU time、speedup、Amdahl 上限、dynamic power、energy 與 energy-delay product。",
      "能區分 Moore's Law、Dennard scaling 與 clock-frequency growth，不把三者視為同一條定律。",
      "能以 CPU、GPU/NPU、memory controller、I/O 與 NoC 的互動描述現代 heterogeneous SoC。"
    ],
    sections: [
      {
        title: "1. 抽象不是忽略細節，而是固定介面",
        paragraphs: [
          "面對複雜系統時，我們不可能同時追蹤每一個 transistor、每一條控制線與每一個程式變數。抽象的做法是先選定一個觀察邊界：邊界上方只依賴一組明確承諾，邊界下方可以自由改變實作，只要仍然履行承諾。例如高階語言規定運算式與函式呼叫的語意，compiler 負責把語意翻成特定 ISA；程式通常不需要知道 add 指令在 CPU 內部用了 ripple-carry adder、carry-lookahead adder 或其他電路。",
          "一個穩定 interface 至少要回答三件事：可以提出哪些 operation、operation 讀寫哪些 state、完成後可觀察到什麼結果。檔案 API 的 read() 是 interface；SSD 或網路檔案系統是 implementation。相同地，MIPS 的 register 名稱、instruction encoding、addressing rule 與 exception behavior 屬於 ISA interface；單週期、多週期或 pipeline datapath 屬於 implementation。",
          "抽象並不保證下層細節永遠不重要。正確性通常只需要遵守 interface，但效能、功耗與安全性常會受到隱藏細節影響。程式逐列掃描陣列與逐欄掃描陣列可能產生相同答案，卻因 cache locality 不同而有巨大時間差。學習計算機組織的核心，就是知道什麼時候可以依賴抽象、什麼時候必須向下追蹤。"
        ],
        figure: {
          type: "hierarchy",
          title: "計算系統的抽象堆疊",
          items: [
            { label: "Application / Algorithm", detail: "問題、資料結構、函式與並行工作" },
            { label: "High-level Language", detail: "型別、控制結構與語言語意" },
            { label: "Compiler / Assembler", detail: "翻譯、最佳化、符號與 machine code" },
            { label: "ISA", detail: "指令、暫存器、位址、例外與 memory model" },
            { label: "Microarchitecture", detail: "datapath、control、pipeline、cache" },
            { label: "Digital Logic", detail: "gate、mux、adder、register、state machine" },
            { label: "Circuit / Device", detail: "transistor、wire、timing、voltage" }
          ],
          caption: "每一層都以較穩定的 interface 隔開上下層。越往下越接近物理限制，越往上越接近問題語意。"
        },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "2. Architecture 與 Organization 的真正分界",
        paragraphs: [
          "Computer architecture 在不同教材中有廣義與狹義用法。為了能精確分析，本講義把 software-visible contract 稱為 ISA，把完成這份 contract 的內部安排稱為 microarchitecture 或 organization。ISA 會規定可用指令、instruction format、programmer-visible registers、資料型別、addressing mode、控制轉移、exception 與 memory interaction。",
          "Microarchitecture 決定同一份指令如何被執行：一條 add 是否在一個長 clock 內完成，或切成多個 stage；是否能同時 issue 多條指令；branch predictor 有多大；L1 cache 使用幾路 set-associative；ALU 是一份還是多份。這些選擇會改變 clock period、CPI、功耗與晶片面積，卻不應改變符合 ISA 的程式結果。",
          "因此，ISA compatibility 與 performance 是兩個不同問題。兩顆 CPU 能執行相同 binary，表示它們實作相容 ISA；其中一顆更快，則要從 dynamic instruction count、CPI、clock period、memory behavior 等 organization 證據解釋。只說『都是 MIPS』或『clock 比較高』都不足以完成效能推論。",
          "RISC-V 官方規格刻意盡量不綁定 cache、in-order、out-of-order 或特定製程，就是 interface 與 implementation 分離的現代例子。基礎 ISA 可以由教學用小核心、低功耗微控制器或高效能 superscalar CPU 實作；只要 observable behavior 符合規格，內部結構可以完全不同。"
        ],
        figure: {
          type: "matrix",
          title: "ISA 與 Microarchitecture 比較",
          columns: ["問題", "ISA / Architecture", "Microarchitecture / Organization"],
          rows: [
            ["程式看見什麼？", "instructions、registers、addresses", "pipeline stages、ports、queues、cache banks"],
            ["主要約束", "binary compatibility 與 observable behavior", "timing、area、energy、throughput"],
            ["例子", "MIPS32、RV32I、x86-64", "single-cycle、5-stage、out-of-order"],
            ["改變後是否重編譯？", "通常需要，或至少需要相容 translation", "相同 ISA 通常不需要"],
            ["驗證重點", "每條指令結果與例外是否正確", "是否在所有 hazard 與 timing 下仍履行 ISA" ]
          ],
          caption: "ISA 是軟體可觀察的合約；microarchitecture 是合約的硬體實現。相容不等於等速。"
        },
        sourceRefs: ["S2", "S3"]
      },
      {
        title: "3. 把計算機視為狀態轉移系統",
        paragraphs: [
          "要追蹤一段程式，最可靠的方法不是背硬體方塊，而是先列出 state。最小化的 architectural state 可以寫成 S = {PC, R, M, D}：PC 是下一個或目前指令的位置；R 是 programmer-visible registers；M 是可定址 memory；D 是會影響程式的 device 或 I/O state。不同 ISA 對 PC 定義與例外狀態略有不同，但分析方式相同。",
          "執行一條 instruction 可以寫成 transition function：S(t+1) = Execute(S(t), instruction)。add 可能只更新一個 register 與 PC；store 會更新 memory 與 PC；branch 依比較結果選擇新的 PC；I/O instruction 或 memory-mapped I/O 可能同時改變 device state。沒有被指令指定的 architectural state 必須保持可觀察的一致性。",
          "Microarchitecture 內部還有大量暫時 state，例如 pipeline registers、cache tags、branch predictor counters、reorder buffer entries。它們會影響何時完成與效能，但正常情況下不應讓程式看見違反 ISA 的中間結果。發生 branch misprediction 時，錯誤路徑上的暫時工作必須被取消；程式最後看見的 architectural state 應如同指令依規定順序執行。",
          "這個 state transition 觀點也提供除錯順序：先找第一個與預期不同的 state，再問是哪個 transition 寫錯。若 register 已錯，往前查產生它的 instruction；若 memory 錯，查 address、write enable 與 store data；若控制流錯，查 PC update 與 branch condition。"
        ],
        figure: {
          type: "flow",
          title: "一條指令的狀態證據鏈",
          items: ["S(t): PC / R / M", "Fetch instruction", "Decode operation", "Read operands", "Compute / access memory", "Commit S(t+1)"],
          caption: "分析時每一箭頭都要回答：讀了哪個 state、經過什麼規則、最後寫回哪個 state。"
        },
        sourceRefs: ["S2", "S3"]
      },
      {
        title: "4. Stored-program 與 von Neumann 模型",
        paragraphs: [
          "Stored-program 的關鍵不是 CPU、memory、I/O 三個方塊本身，而是 instruction 也被編碼成 bit pattern 放在可定址 memory 中。CPU 不必為每個新演算法重新接線，只要改變 memory 中的 instruction sequence，就能讓同一套 datapath 執行不同工作。程式因此成為可以載入、複製、儲存與產生的資料。",
          "概念上的 von Neumann 模型讓 instruction 與 data 共享 memory 與傳輸路徑。現代處理器常在 L1 使用分離的 instruction cache 與 data cache，再於較低層匯合，這通常稱為 modified Harvard organization。它改善同時 fetch instruction 與存取 data 的 bandwidth，但 architectural address space 仍可呈現統一模型。不能因為看見兩個 L1 cache 就直接斷言 ISA 是 Harvard architecture。",
          "共享傳輸資源帶來 von Neumann bottleneck：CPU 的運算能力可能大於 memory system 提供 instruction/data 的速度。現代系統用 cache、prefetch、wider buses、multiple channels、out-of-order execution 與 parallelism 隱藏或提高資料供應能力，但不能消除資料移動成本。後續 memory hierarchy 章會把這個現象量化為 hit time、miss rate 與 miss penalty。",
          "程式與資料同為 bits 也帶來保護問題。若系統錯誤地把可寫資料當作指令執行，可能形成 code injection。現代作業系統與 ISA 透過 page permission、privilege mode 與不可執行頁面等機制限制哪些 memory region 能被 fetch。這些保護不改變 stored-program 的核心概念，卻讓介面更完整。"
        ],
        figure: {
          type: "flow",
          title: "Stored-program 的循環",
          items: ["PC 提供位址", "Memory 回傳 instruction bits", "Control 解讀欄位", "Datapath 執行", "更新 register / memory", "選出 next PC"],
          caption: "instruction 與 data 都是 memory 中的 bits；當下的取用方式決定它被視為操作還是資料。"
        },
        sourceRefs: ["S2", "S4"]
      },
      {
        title: "5. CPU、Memory、I/O 與 Interconnect 如何合作",
        paragraphs: [
          "CPU 內部至少包含保存 state 的 registers、執行算術邏輯的 datapath，以及依 instruction 產生控制訊號的 control unit。Memory 可以抽象成由 address 選取的 word/byte 集合；I/O device 則與外界交換資料。真正讓它們合作的是 interconnect：它傳遞 address、data 與 transaction type，並處理 ready、valid、response 或 error 等狀態。",
          "一次 memory read 不是『CPU 直接拿到值』這麼簡單。CPU 先提出 read request 與 address；cache 或 memory hierarchy 判斷是否命中；資料可能在本 cycle、數個 cycles 或更久之後回應。若 datapath 必須等待，control 就要 stall；若允許其他工作先執行，則需要追蹤 outstanding operation 與 dependency。介面的 latency 與 concurrency 會塑造整個 microarchitecture。",
          "I/O 常透過 memory-mapped I/O 呈現：某些 address 不對應 DRAM，而對應 device register。CPU 使用一般 load/store 發出 request，interconnect 依 address 導向裝置。表面上都是 memory operation，但 device register 可能具有讀取即清除、寫 1 清除或異步更新等 side effect，因此不能任意 cache 或重排。",
          "Bus 是共享 interconnect 的一種，不是所有系統連線的總稱。簡單 bus 成本低，但多個 master 同時請求時需要 arbitration，且總 bandwidth 被共享。較大型 SoC 常使用階層式 crossbar 或 network-on-chip，讓多筆 transaction 並行。第 4 版以 bus 建立基礎模型，現代實作則把相同 request/response 概念擴展到更複雜互連。"
        ],
        figure: {
          type: "matrix",
          title: "一次 transaction 需要的資訊",
          columns: ["訊息", "作用", "錯誤時的現象"],
          rows: [
            ["Address", "選擇 memory location 或 device register", "讀錯資料、alignment fault"],
            ["Command", "read、write、atomic 或 I/O operation", "方向或 side effect 錯誤"],
            ["Write data / byte enable", "指定寫入內容與哪些 bytes 有效", "鄰近 bytes 被破壞"],
            ["Response data", "回傳 load 或 device 結果", "register 得到過期或錯誤值"],
            ["Handshake / status", "表示 request 接受、完成或失敗", "遺失 transaction、重複執行或永久等待"]
          ],
          caption: "方塊圖只顯示連線；transaction 表才能說明資料何時有效、由誰接收以及失敗如何呈現。"
        },
        sourceRefs: ["S2", "S5"]
      },
      {
        title: "6. ISA 這份合約到底包含什麼",
        paragraphs: [
          "初學時常把 ISA 縮成 instruction list，但完整 ISA 還要定義 programmer-visible state 與每個 operation 的 precise effect。典型內容包括 integer/floating-point registers、PC、instruction encoding、資料寬度、address space、load/store 規則、alignment、endianness、control flow、atomic operation、exception、privilege interface 與 memory ordering。",
          "RISC-V 是很清楚的現代例子：base integer ISA 提供形成 compiler target 所需的整數計算、load/store 與 control flow，再以 M、A、F、D、C、V 等 extensions 增加乘除、atomic、floating point、compressed encoding 與 vector operation。extension 名稱描述 software-visible capability，而不是 CPU 內部有幾級 pipeline。",
          "ISA 規格通常允許多個合法結果或 implementation choice。例如 misaligned access 可由硬體處理或觸發 exception，memory ordering 也可能需要 fence 才能約束。程式若依賴規格沒有保證的 timing 或內部排列，就可能在另一顆相容 CPU 上失敗。因此閱讀 ISA 時要區分 required behavior、reserved encoding、implementation-defined behavior 與 performance hint。",
          "本課以 MIPS 說明固定 32-bit encoding、register file 與 load-store datapath，並使用 MARIE 看見更小的累加器模型。兩者不是誰『比較正確』，而是 interface 設計取捨不同：MARIE 隱含 AC，MIPS 明確指定多個 registers。比較 ISA 時應問 state 是否顯式、instruction 如何編碼、memory 如何定址，而不是只數 instruction 數量。"
        ],
        figure: {
          type: "hierarchy",
          title: "ISA 合約的五個層面",
          items: [
            { label: "Visible State", detail: "registers、PC、status、address space" },
            { label: "Operations", detail: "arithmetic、logic、load/store、control flow" },
            { label: "Encoding", detail: "instruction length、opcode、operand fields" },
            { label: "Exceptional Behavior", detail: "fault、trap、privilege、interrupt interface" },
            { label: "Ordering", detail: "memory visibility、atomicity、fence" }
          ],
          caption: "只有 operation name 不足以形成 ISA；state、encoding、exception 與 ordering 都會影響 binary 的可攜性。"
        },
        sourceRefs: ["S1", "S3"]
      },
      {
        title: "7. 一行程式如何穿過所有層次",
        paragraphs: [
          "考慮 C 敘述 A[i] = B[i] + 1。語言層關心 array element 與 integer addition；compiler 要選 registers、計算 byte offset、產生 load、add 與 store；assembler 把 register name、immediate 與 opcode 編成 bits；CPU fetch 這些 bits 並產生 datapath control；cache 根據 effective address 判斷 hit/miss；DRAM 或更低層只看 address 與 data transaction。",
          "同一個語意可能產生不同 instruction sequence。compiler 可以把 i 保留在 register、把 4*i 改成 shift，也可能把 loop 展開或 vectorize。只要 observable result 與語言規則一致，翻譯就合法。這也表示 static source line 數不能直接推出 dynamic instruction count，更不能直接推出執行時間。",
          "跨層追蹤時，先建立名稱對照：A base 在哪個 register、i 的數值與寬度、element size、effective address、load destination、ALU result、store address。接著逐 instruction 更新 state。最後才分析 cache line、pipeline hazard 與 cycles。跳過 state 直接猜效能，通常會把 address 錯誤與 cache miss 混在一起。",
          "這條路徑也說明為何效能是跨層現象。演算法決定工作量，compiler 決定 instruction mix，ISA 決定可表達的 operation，microarchitecture 決定 CPI 與 clock，memory hierarchy 決定 stall。任何一層都可能是瓶頸，不能只靠 CPU 型號解釋。"
        ],
        figure: {
          type: "flow",
          title: "A[i] = B[i] + 1 的跨層證據",
          items: ["Array semantics", "Compiler chooses registers", "ISA load / add / store", "Datapath control", "Cache lookup", "Memory transaction", "Architectural result"],
          caption: "每一層都保留上一層需要的語意，但以更接近硬體的 state 與 operation 表達。"
        },
        sourceRefs: ["S1", "S3"]
      },
      {
        title: "8. Parallelism 不是單一技術",
        paragraphs: [
          "Parallelism 的共同目標是讓多個工作片段在時間上重疊，但不同層次的『工作片段』並不相同。Pipeline 重疊多條 instruction 的不同 stages；superscalar 同 cycle issue 多條 independent instructions；SIMD 對多個 data lanes 套用同一 operation；SIMT 讓一群 threads 執行相同 kernel 並保有各自 state；multicore 同時執行多個 software threads；distributed system 則讓多台機器合作。",
          "Pipeline 主要提高 throughput，不保證單一 instruction latency 等比例下降。SIMD/SIMT 需要 data-level parallelism，若各 lane/thread 在 branch 走不同路徑，部分執行資源會閒置。Multicore 需要工作可分割，還要支付 synchronization、communication 與 load imbalance 成本。使用更多 processing elements 不會自動得到線性 speedup。",
          "NVIDIA 的 SIMT model 以 warp 組織 threads。thread 保有自己的 register state 與 control flow，但同一 warp 的 threads 共同推進 instruction；若 branch divergence，硬體要分別處理不同路徑並遮罩不參與的 threads。這是 architecture/programming model 與實際 hardware scheduling 交界的例子。",
          "判斷平行類型時，問四個問題：同時進行的是 instructions、data elements、threads 還是 machines？它們共享哪些 state？需要如何同步？瓶頸是 compute、memory bandwidth 還是 communication？這四問比背 Flynn taxonomy 更能預測效能。"
        ],
        figure: {
          type: "matrix",
          title: "常見平行層次",
          columns: ["層次", "同時處理的單位", "主要限制", "例子"],
          rows: [
            ["Pipeline", "不同 instructions 的 stages", "hazard、stage balance", "IF/ID/EX/MEM/WB"],
            ["Superscalar / ILP", "同一 thread 的多條 instructions", "dependency、issue width", "多 ALU、out-of-order"],
            ["SIMD / Vector", "多個 data elements", "vector length、mask、bandwidth", "vector add"],
            ["SIMT", "同 kernel 的多個 threads", "divergence、occupancy、memory access", "GPU warp"],
            ["Multicore", "software threads / tasks", "synchronization、coherence", "多核心 CPU"],
            ["Distributed", "processes / machines", "network latency、failure", "cluster、cloud service"]
          ],
          caption: "不同平行層次可以同時存在，例如 GPU kernel 既有 SIMT，也有 pipeline、memory hierarchy 與多個 processing clusters。"
        },
        sourceRefs: ["S5", "S6"]
      },
      {
        title: "9. Correctness 與 Performance 必須分開證明",
        paragraphs: [
          "Correctness 問的是結果是否符合 interface；performance 問的是完成結果需要多少時間、資源或能量。同一份 machine code 在 single-cycle 與 pipeline processor 上應得到相同 architectural state，但 cycle 數與 clock period 不同。若結果不同，首先是 correctness bug，而不是『效能比較』。",
          "Latency 是一個工作從開始到完成的時間；throughput 是單位時間完成多少工作。Pipeline 常讓穩態 throughput 提升，但單一 instruction 仍要經過所有 stages。GPU 可提供很高 throughput，卻不一定讓單一短 request 的 latency 最小。評估前必須先指定 workload 與 metric。",
          "clock rate、CPI、instruction count 都不是單獨的答案。CPU Time = Instruction Count × CPI × Clock Period。某設計提高 clock rate，若同時增加 pipeline depth 與 branch penalty，CPI 可能上升；某 ISA 用較少 instructions，若每條工作更複雜，也不一定更快。正確比較要把所有因子放回同一時間單位。",
          "本章的結束標準不是能背出四大元件，而是能提出一條可驗證說明：指出 interface、列出 state、描述 transition、區分 architectural 與 temporary state，最後選擇合適 metric。這條推理鏈會貫穿本課所有章節。"
        ],
        figure: {
          type: "factor",
          title: "從程式到 CPU Time 的三個乘數",
          items: [
            { label: "Instruction Count", detail: "algorithm、compiler、ISA" },
            { label: "Average CPI", detail: "pipeline、hazard、cache miss" },
            { label: "Clock Period", detail: "critical path、technology" }
          ],
          caption: "比較效能時三個乘數必須屬於同一 workload；只比較其中一項可能得到相反結論。"
        },
        sourceRefs: ["S1", "S2", "S10", "S20"]
      },
      {
        title: "10. Instruction lifecycle 把資料路徑、控制與完成邊界串成一條證據鏈",
        paragraphs: [
          "教科書常把指令分成fetch、decode、execute三步，但可驗證的資料路徑需要更細。Fetch以PC形成instruction address並取得bits；decode辨認opcode、operand fields與立即數；operand read取得register或architectural source；execute由ALU、branch unit或其他functional unit產生result或effective address；memory階段執行load/store；write-back或retire才讓結果成為architecturally visible。不同microarchitecture可以合併、切分或重疊這些工作。",
          "資料與控制必須同時追蹤。以load為例，register file提供base，immediate generator做sign extension，ALU計算effective address，memory hierarchy回傳data，destination register number與write-enable則要一路保留到完成點。若只畫data arrows而未標示哪個cycle允許寫入，圖無法解釋stall、exception或錯誤路徑為何不應更新state。",
          "Single-cycle core讓一條指令的所有combinational work落在一個clock period內，clock不得短於最慢指令的critical path。Multi-cycle core重用ALU與memory port，把一條指令分成多cycles；pipeline再讓不同instructions同時占據不同stages。三者可實作相同ISA，差別是temporary state、resource sharing、clock period與steady-state throughput。",
          "Modern out-of-order core允許較晚且ready的instruction先execute，卻通常按program order retire。rename registers與reorder buffer保存speculative results；branch prediction錯誤或exception發生時，尚未retire的較年輕工作可被丟棄。這使內部順序與architectural完成順序分離，也說明為何觀察execution trace時不能把functional-unit完成直接當成程式state已更新。"
        ],
        figure: { type: "flow", title: "一條 load 指令由 PC 到 retire 的完整路徑", items: [{ label: "Fetch", detail: "PC → instruction bits" }, { label: "Decode", detail: "opcode + rd/rs + immediate" }, { label: "Read", detail: "base register + control" }, { label: "Execute", detail: "effective address" }, { label: "Memory", detail: "cache / memory response" }, { label: "Complete", detail: "data + status" }, { label: "Retire", detail: "rd and PC become visible" }], caption: "pipeline可以重疊各階段，但每條instruction的資料、destination與exception狀態仍須正確配對。" },
        sourceRefs: ["S2", "S4", "S16"]
      },
      {
        title: "11. Exception 與 privilege 讓錯誤、外部事件和系統服務成為可恢復的控制轉移",
        paragraphs: [
          "Exception是由目前instruction或其執行環境同步引發的控制轉移，例如illegal instruction、alignment fault、page fault或arithmetic trap；interrupt通常由timer、I/O或外部controller非同步提出。不同ISA對trap一詞的分類略有差異，因此分析時應明示事件來源、是否同步、保存哪個PC、是否允許restart，而不只依名詞猜測。",
          "Precise exception要求architectural state看起來像在某一條instruction邊界停下：較舊instructions已完成，faulting instruction與較新instructions尚未產生不允許的效果。處理器要保存exception PC與cause、切換到較高privilege mode、選擇handler address，並確保store或device side effect不會因replay而重複。Out-of-order execution讓這項要求更困難，reorder buffer的in-order retire正是常見解法之一。",
          "Privilege分隔application、operating system、hypervisor與machine/firmware責任。User mode不能直接任意修改page tables、interrupt state或device control registers，而是以system call instruction進入受控handler；handler驗證參數後執行服務，再以architectural return恢復較低privilege。RISC-V privileged architecture與Arm exception levels的名稱不同，但都把software stack的權限邊界納入architecture contract。",
          "Branch與exception都會改變PC，語意卻不同。Branch是program主動選擇的正常控制流；exception還要記錄cause、privilege與可恢復位置，可能改變address translation與interrupt-enable state。量測一次trap latency時也要分開入口、handler work、scheduler decision與return，不能把全部時間歸因於單一instruction。"
        ],
        figure: { type: "flow", title: "Precise exception 的 architectural state 邊界", items: [{ label: "Older instructions", detail: "retired" }, { label: "Faulting instruction", detail: "no forbidden effect" }, { label: "Save context", detail: "PC + cause + privilege" }, { label: "Handler", detail: "validate and service" }, { label: "Return or terminate", detail: "restart / resume / signal" }], caption: "精確邊界讓handler能修復page mapping後重試，或在明確state下終止process。" },
        sourceRefs: ["S7", "S8", "S9"]
      },
      {
        title: "12. Power、energy 與 thermal limit 決定多少硬體能同時工作",
        paragraphs: [
          "CMOS切換的簡化dynamic power為P_dynamic≈αCV²f，其中α是activity factor、C是有效切換capacitance、V是supply voltage、f是clock frequency。電壓以平方影響功耗，所以單純提高frequency往往也需要更高voltage，成本可能超過線性。Static/leakage power與製程、溫度、transistor state相關，不能由dynamic公式涵蓋。",
          "Energy是功率對時間的積分；固定平均功率時E=P×T。高效能設計若把時間縮短很多，即使瞬時power較高，total energy仍可能下降；反之，race-to-idle若需要大幅提高V，energy可能上升。Energy-delay product EDP=E×T會同時懲罰慢與耗能，但權重仍是設計選擇，不能取代明示的battery、thermal或latency constraint。",
          "Thermal design power不是每條instruction的能量，也不是所有時刻的精確實測power。晶片temperature由power density、package、cooling與時間常數共同決定；達到thermal或electrical limit時，hardware可降低frequency/voltage或限制simultaneous activity。Benchmark若只跑數毫秒，可能量到boost狀態而非長時間sustained performance。",
          "降低energy可在多層進行：algorithm減少work，compiler/vectorization減少instructions，clock gating降低α，power gating降低閒置leakage，DVFS調整V與f，specialized accelerator以較少data movement完成固定operation。比較方案時必須維持相同結果與workload，並同時報告time、energy、average/peak power與量測boundary。"
        ],
        figure: { type: "factor", title: "CMOS dynamic power 的四個乘數", items: [{ label: "Activity α", detail: "fraction of switching nodes" }, { label: "Capacitance C", detail: "transistors + wires" }, { label: "Voltage²", detail: "quadratic contribution" }, { label: "Frequency f", detail: "switching opportunities per second" }], caption: "P_dynamic≈αCV²f是分析模型；total chip power還包含leakage、I/O、memory與analog domains。" },
        sourceRefs: ["S12", "S15"]
      },
      {
        title: "13. Moore、Dennard 與 power wall 之後，現代系統以異質 SoC 延續效能",
        paragraphs: [
          "Moore在1965年的觀察與預測聚焦於經濟上適合整合的components數量隨時間快速成長；它不是clock frequency定律。Dennard scaling則描述理想等比例縮小MOSFET尺寸與voltage時，device delay、power與power density的縮放關係。後來voltage scaling放慢，transistor count仍能增加，卻無法讓所有transistors都以最高frequency同時切換。",
          "Frequency growth在2000年代中期受power與thermal constraint限制，設計重心轉向multicore、wider SIMD、specialized accelerators與energy efficiency。Dark silicon不是晶片上永久無功能的黑色區域，而是power budget不足以讓所有可用transistors同時全速活動的現象；不同workload可啟用不同blocks。Amdahl's Law又限制只加速部分work所能得到的全域speedup。",
          "現代SoC可整合performance/efficiency CPU cores、GPU、NPU、media engine、memory controller、security processor與I/O controllers，並由NoC或階層interconnect連接。每個engine對特定parallelism與data type效率較高，但把data搬到engine、格式轉換、同步、driver與memory bandwidth都有成本。Accelerator的峰值operations/s不等於application端到端速度。",
          "因此現代計算機的基本單位不再只是『一顆CPU執行instructions』，而是software把work映射到多種execution engines並共享memory與power budget。分析時仍沿用本章方法：先辨認每個engine的interface與visible state，再畫出data movement、synchronization與failure boundary，最後用representative workload量測time、throughput、energy與tail behavior。"
        ],
        figure: { type: "hierarchy", title: "Heterogeneous SoC 的共享資源與資料移動", items: [{ label: "Software / runtime", detail: "chooses CPU, GPU, NPU or fixed-function engine" }, { label: "Compute engines", detail: "different state, parallelism and precision" }, { label: "NoC / interconnect", detail: "address, data, coherence and QoS" }, { label: "Shared memory system", detail: "cache, DRAM bandwidth and protection" }, { label: "Power / thermal budget", detail: "limits simultaneous frequency and activity" }, { label: "I/O and storage", detail: "external data arrival and persistence" }], caption: "增加engine只增加潛在能力；端到端效能仍取決於資料位置、可平行比例與共享瓶頸。" },
        sourceRefs: ["S11", "S13", "S14", "S17", "S18", "S19"]
      }
    ],
    workedExamples: [
      {
        title: "例題一：相同 ISA，為何執行時間不同？",
        prompt: "處理器 P 與 Q 都執行同一份 MIPS binary，共 8×10^8 條 dynamic instructions。P 的 clock=2.5 GHz、CPI=1.4；Q 的 clock=2.0 GHz、CPI=1.0。判斷 compatibility 與 performance。",
        steps: [
          "兩者能執行相同 binary，表示在題目範圍內具備相容的 ISA；clock 與 CPI 屬於 microarchitecture/performance 資訊。",
          "P 的 cycles = 8×10^8 × 1.4 = 1.12×10^9 cycles。",
          "P 的 time = 1.12×10^9 / 2.5×10^9 = 0.448 s。",
          "Q 的 cycles = 8×10^8 × 1.0 = 8×10^8 cycles。",
          "Q 的 time = 8×10^8 / 2.0×10^9 = 0.400 s。",
          "Speedup(Q over P) = 0.448 / 0.400 = 1.12，因此 Q 對此 workload 快 12%。"
        ],
        result: "相同 ISA 只保證程式可執行與結果相容，不保證效能相同。P 的 clock 較高，但 CPI 劣勢更大。"
      },
      {
        title: "例題二：追蹤一條 add 的 architectural state",
        prompt: "執行 add $t0,$t1,$t2 前，PC=0x00400020、$t1=7、$t2=−3、$t0=99。假設無例外且 MIPS 指令固定 4 bytes。列出 S(t)→S(t+1)。",
        steps: [
          "Fetch 使用 PC=0x00400020 取得 instruction bits；fetch 本身不應改變 general-purpose registers。",
          "Decode 得知來源為 $t1、$t2，目的為 $t0，operation 為 signed/bitwise-equivalent 32-bit addition。",
          "Read operands 得到 7 與 −3；ALU 計算 7+(−3)=4。",
          "Write-back 將 $t0 由 99 更新為 4。",
          "Sequential next PC = 0x00400020+4 = 0x00400024。",
          "此指令不存取 data memory，因此 M 保持不變；其他 registers 保持不變。"
        ],
        result: "S(t+1) 與 S(t) 的 architectural 差異只有 $t0=4 與 PC=0x00400024。pipeline 內部可能同時改變許多 temporary registers，但不屬於此 ISA-level 答案。"
      },
      {
        title: "例題三：由 C array operation 建立跨層追蹤",
        prompt: "A 與 B 是 32-bit integer arrays，$s0=A base、$s1=B base、$t0=i=3。追蹤 A[i]=B[i]+1 的 address 與主要 state。",
        steps: [
          "每個 element 為 4 bytes，因此 byte offset = i×4 = 3×4 = 12。",
          "可用 sll $t1,$t0,2 取得 offset 12；這是乘 2^2 的位移。",
          "B[i] address = $s1+12。load 將 M[$s1+12 ... $s1+15] 組成 32-bit value 放入暫存器。",
          "addi 將 loaded value 加 1。若只分析 correctness，要確認 32-bit overflow 語意與使用的 instruction。",
          "A[i] address = $s0+12。store 把結果的四個 bytes 寫入該位置。",
          "若 B[i] 與 A[i] 所在 block 已在 cache，memory hierarchy 可能完全不存取 DRAM；architectural result 仍相同。"
        ],
        result: "source-level 的一個 array assignment 展開成 offset、兩個 effective addresses、load、ALU update 與 store。cache hit/miss 是下一層效能證據。"
      },
      {
        title: "例題四：辨認平行層次與限制",
        prompt: "某 GPU kernel 對 1,000,000 個元素各做相同公式，但公式內含依資料決定的 if/else。系統把 threads 以 32 個一組執行。這是哪種平行方式，主要風險是什麼？",
        steps: [
          "每個 element 可由一個 thread 處理，因此問題有 data parallelism。",
          "threads 以群組共同推進 instruction，符合 SIMT programming/execution model。",
          "每個 thread 保有自己的 register state 與 element index，因此不是單一 scalar state。",
          "若同一組 32 threads 對 if/else 做出不同選擇，就產生 branch divergence。",
          "硬體必須對不同路徑分別執行並遮罩未參與 threads；correctness 不變，但有效利用率下降。",
          "改善前還要檢查 memory access 是否連續，因為 bandwidth 可能比 divergence 更主要。"
        ],
        result: "此例主要是 SIMT/data parallelism；限制包括 divergence 與 memory behavior。不能只因 thread 數很多就假設 speedup 線性。"
      },
      {
        title: "例題五：由 stage delays 比較 single-cycle 與 pipeline clock",
        prompt: "五項工作延遲依序為IF=250 ps、ID=120 ps、EX=180 ps、MEM=300 ps、WB=100 ps；每個pipeline register另加20 ps。求single-cycle最短period、5-stage pipeline period與理想穩態throughput。",
        steps: [
          "Single-cycle load依序經過全部五項工作，combinational總延遲=250+120+180+300+100=950 ps。",
          "若題目不另給single-cycle register overhead，最短period以950 ps建立簡化下界。",
          "Pipeline period由最慢stage加pipeline-register overhead決定。",
          "最慢stage是MEM 300 ps，因此T_pipe=300+20=320 ps。",
          "理想填滿後每cycle完成一條instruction，throughput=1/320 ps=3.125×10^9 instructions/s。",
          "單一instruction仍需約5×320=1600 ps穿過五級，pipeline提高throughput卻未降低此load的latency。"
        ],
        result: "Single-cycle period至少950 ps；pipeline period 320 ps、理想穩態3.125 GIPS，但單條load latency約1.6 ns。"
      },
      {
        title: "例題六：建立 precise page-fault state",
        prompt: "指令I1已retire，I2是load並發生page fault，I3已speculatively execute但尚未retire。進入handler前哪些效果可保留？",
        steps: [
          "先以program order標出I1<I2<I3。",
          "I1較舊且已retire，其register/memory效果屬於architectural state，必須保留。",
          "I2是faulting instruction；若要修復mapping後restart，load destination不能先留下不完整的新值。",
          "I3雖已execute，卻比faulting instruction年輕且未retire，其speculative result必須隱藏或丟棄。",
          "hardware保存I2的exception PC、page-fault cause與必要privilege state。",
          "handler建立mapping後返回I2重試；完成後I3才能重新執行並依序retire。"
        ],
        result: "進入handler時architectural state停在I1之後、I2之前；I3的內部完成不等於architectural完成。"
      },
      {
        title: "例題七：用 Amdahl's Law 計算加速上限",
        prompt: "程式有35%時間可由新accelerator加速8倍，其餘65%不變。求overall speedup與accelerator無限快時的上限。",
        steps: [
          "將原始execution time正規化為1。",
          "未改善部分時間為1−0.35=0.65。",
          "改善部分新時間為0.35/8=0.04375。",
          "新總時間=0.65+0.04375=0.69375。",
          "overall speedup=1/0.69375≈1.44144。",
          "若accelerator無限快，改善部分趨近0，上限=1/0.65≈1.53846。"
        ],
        result: "局部8倍只讓全程約1.441倍；65%未改善部分把任何accelerator的上限鎖在約1.538倍。"
      },
      {
        title: "例題八：比較 DVFS 前後的 dynamic power",
        prompt: "activity與capacitance不變。模式A為1.0 V、2.0 GHz；模式B為0.8 V、1.5 GHz。以αCV²f求P_B/P_A。",
        steps: [
          "相同比例中α與C相消。",
          "P_B/P_A=(V_B/V_A)²×(f_B/f_A)。",
          "電壓比平方=(0.8/1.0)²=0.64。",
          "頻率比=1.5/2.0=0.75。",
          "兩者相乘0.64×0.75=0.48。",
          "此結果只涵蓋dynamic component；leakage與完成時間改變仍須另算。"
        ],
        result: "模式B的dynamic power約為模式A的48%。"
      },
      {
        title: "例題九：由 power 與 time 比較 energy 及 EDP",
        prompt: "設計A平均80 W、完成時間2.0 s；設計B平均110 W、完成時間1.2 s。比較energy與energy-delay product。",
        steps: [
          "A energy=80×2.0=160 J。",
          "B energy=110×1.2=132 J。",
          "B雖然power較高，因時間縮短而少用28 J，energy降低17.5%。",
          "A EDP=160×2.0=320 J·s。",
          "B EDP=132×1.2=158.4 J·s。",
          "EDP_B/EDP_A=158.4/320=0.495，因此B在此metric也較佳。"
        ],
        result: "B同時較快且總energy較低；只比較80 W與110 W會得到錯誤結論。"
      },
      {
        title: "例題十：加速器含資料搬移時的 break-even",
        prompt: "CPU直接處理一批資料需30 ms。Accelerator compute需6 ms，但每次另有8 ms輸入搬移、5 ms輸出搬移與3 ms啟動成本。是否值得offload？",
        steps: [
          "先列出offload完整critical path，而不是只看accelerator kernel。",
          "輸入搬移8 ms。",
          "啟動與排程3 ms。",
          "accelerator compute 6 ms。",
          "輸出搬移5 ms。",
          "總offload time=8+3+6+5=22 ms；speedup=30/22≈1.3636。",
          "若資料已在accelerator-local memory，可省搬移而更快；若batch更小，固定啟動成本可能使offload反而變慢。"
        ],
        result: "本批次offload可由30 ms降至22 ms，約1.364倍；kernel本身的5倍並不是端到端speedup。"
      }
    ],
    misconceptions: [
      ["Architecture 就是 CPU 方塊圖。", "方塊圖多半呈現 organization；ISA 才是 software-visible architecture contract。廣義用語可能涵蓋兩者，分析時仍要明確命名。"],
      ["clock rate 高的 CPU 一定比較快。", "CPU Time 同時受 instruction count、CPI 與 clock period 影響；workload 與 memory stall 也必須相同才能比較。"],
      ["von Neumann machine 只能有一條實體 bus。", "核心是 stored-program 與 instruction/data 的概念模型。現代 CPU 可有分離 L1、multiple buses 與 network-on-chip。"],
      ["Pipeline 同時做五條指令，所以單一指令快五倍。", "Pipeline 主要改善 throughput；單一 instruction latency 仍包含所有 stages 與 pipeline-register overhead。"],
      ["ISA 相同代表 cache、pipeline 與核心數相同。", "這些多半是 microarchitecture 選擇。同一 ISA 可有非常小或非常高效能的不同 implementations。"],
      ["程式與資料都是 bits，所以任何資料都能安全執行。", "stored-program 允許 bits 被解讀為 instruction，但 privilege、page permission、alignment 與 valid encoding 仍限制合法 execution。"],
      ["Fetch、decode、execute 一定是三個實體 clock stages。", "它們是理解 instruction semantics 的概念工作。實作可把工作合併、拆分成更多 stages，或讓多條 instructions 重疊進行。"],
      ["Instruction execute 完成就等於程式已看見結果。", "Out-of-order CPU 可先完成較年輕 instruction，但仍要等到安全 retire/commit 才更新 architectural state。"],
      ["Exception 只是跳到另一段程式，和 branch 沒有差別。", "Branch 是正常 control-flow operation；exception 還要保存 cause、faulting PC 與 privilege state，並建立可恢復的 architectural boundary。"],
      ["Interrupt 發生時可以留下半條 instruction 的 architectural 更新。", "支援 precise interrupt 的系統會在 instruction boundary 呈現一致狀態；較舊指令已完成，較年輕指令尚未生效。"],
      ["Power 與 energy 是同一個量。", "Power 是 energy 使用速率，單位 watt；energy 是 power 對時間的積分，固定平均功率時 E=P×T，單位 joule。"],
      ["降低 power 必然降低完成工作的 energy。", "較低 power 若使執行時間大幅拉長，energy 仍可能增加；必須同時計算 power 與 elapsed time。"],
      ["TDP 就是每個程式執行時的實測 power。", "TDP 是散熱與產品設計相關規格，不是任意 workload 的瞬時或平均耗電讀值。"],
      ["Moore's Law 預測 clock rate 每兩年加倍。", "原始觀察談的是積體電路可經濟整合的元件數；clock growth 還受 device delay、power density 與設計限制影響。"],
      ["Transistor 變多就會自動遵循 Dennard scaling 而不增加功耗。", "Dennard scaling 依賴尺寸與電壓等比例縮小；電壓縮放放緩後，更多 transistors 不代表都能同時以最高頻率啟用。"],
      ["Dark silicon 是晶片上已經故障的區域。", "它描述受 power/thermal budget 限制、不能同時以目標效能啟用的電路資源，不等於製造缺陷。"],
      ["Accelerator 的 peak throughput 就是應用程式 speedup。", "端到端結果還包含可加速比例、資料搬移、啟動、同步與未改善工作；必須用完整 critical path 或 Amdahl's Law 計算。"]
    ],
    exercises: [
      {
        level: "基礎",
        question: "將 compiler、ISA、register file、adder、transistor、C function 依抽象層次由高到低排序。",
        solution: ["C function → compiler → ISA → register file → adder → transistor。", "compiler 是翻譯系統而非執行硬體，但在這條路徑中位於語言與 ISA 之間；register file 與 adder 屬於 microarchitecture/digital logic。"]
      },
      {
        level: "基礎",
        question: "下列哪些通常屬於 ISA：L1 cache 大小、register 數量、instruction encoding、pipeline stage 數、exception behavior？",
        solution: ["通常屬於 ISA：programmer-visible register 數量、instruction encoding、exception behavior。", "L1 cache 大小與 pipeline stage 數通常屬於 microarchitecture。"]
      },
      {
        level: "基礎",
        question: "為何 instruction 與 integer 在 memory 中都只是 bits，CPU 卻能區分它們？",
        solution: ["bits 本身沒有型別；當 CPU 以 PC 作為位址進行 fetch，回傳 bits 會依 instruction encoding 解碼。", "當 load 把相同 bits 讀入 register，後續 instruction 可把它解讀為 signed、unsigned、address 或其他資料。context 與 operation 決定意義。"]
      },
      {
        level: "基礎",
        question: "某 fixed-length 32-bit ISA 使用 byte addressing。若目前 PC=0x1000 且沒有 branch，下一個 PC 是多少？",
        solution: ["32 bits = 4 bytes，因此 next PC = 0x1000 + 4 = 0x1004。", "不能寫成 +1；+1 只前進一個 byte。"]
      },
      {
        level: "理解",
        question: "兩顆處理器都能執行同一份 RV32I binary，但一顆是 3-stage pipeline，另一顆是 8-stage pipeline。這是否矛盾？",
        solution: ["不矛盾。RV32I 定義 software-visible ISA；pipeline depth 是 microarchitecture。", "只要兩者對每條 instruction、exception 與 memory behavior 產生規格允許的 observable result，就能相容。"]
      },
      {
        level: "理解",
        question: "為何分離 instruction cache 與 data cache 不一定表示程式看見兩個 address spaces？",
        solution: ["cache 是 microarchitecture 中的暫存層。instruction/data L1 可分離以提高 bandwidth，再於較低 memory hierarchy 匯合。", "ISA 仍可提供統一的 architectural address space；因此要區分 programmer-visible address model 與內部 cache organization。"]
      },
      {
        level: "理解",
        question: "對 register-register add，列出至少四個可能改變的 microarchitectural state，以及真正必須改變的 architectural state。",
        solution: ["microarchitectural state 可能包括 IF/ID、ID/EX、EX/MEM、MEM/WB pipeline registers、scoreboard、reorder buffer 或 predictor metadata。", "architectural state 至少更新 destination register 與 PC；其他 programmer-visible state 依 ISA 規定保持不變。"]
      },
      {
        level: "計算",
        question: "CPU A 執行 2×10^9 instructions，CPI=1.2，clock=3 GHz。CPU B 執行同工作需 1.5×10^9 instructions，CPI=1.8，clock=3.6 GHz。誰較快？",
        solution: ["A time = 2×10^9×1.2 / 3×10^9 = 0.8 s。", "B time = 1.5×10^9×1.8 / 3.6×10^9 = 0.75 s。", "B 較快，speedup = 0.8/0.75 ≈ 1.067，約快 6.7%。"]
      },
      {
        level: "應用",
        question: "一個 device status register 讀取後會自動清除。為何 CPU 不應把它當成一般 DRAM 任意重讀或 cache？",
        solution: ["每次 read 都有 side effect；重讀會改變 device state，cache 回傳舊值也可能隱藏新事件。", "因此 device mapping 通常需要特定 memory type、ordering 與不可 cache 規則，compiler/CPU 也不能任意移動 access。"]
      },
      {
        level: "應用",
        question: "矩陣加法每個 element 完全獨立，適合哪些平行層次？若每個 element 都有不同長度的迴圈，哪個限制會變嚴重？",
        solution: ["可用 SIMD/vector、SIMT/GPU threads，也可把區塊分給 multicore tasks。", "若同一 SIMD/SIMT group 內工作長度不同，會產生 lane underutilization 或 divergence/load imbalance；最慢工作可能決定群組完成時間。"]
      },
      {
        level: "整合",
        question: "一段程式換新 CPU 後答案相同但慢了 20%。請列出由上到下至少五項應蒐集的證據。",
        solution: ["確認 workload/input 與 compiler options 相同。", "比較 dynamic instruction count 與 instruction mix。", "比較 average CPI，分解 branch、dependency 與 cache/memory stalls。", "比較 clock period/rate。", "比較 cache miss、memory bandwidth、page fault 與 I/O wait。", "最後以 CPU Time 或 wall-clock time 的同一 metric 整合，不先假設單一原因。"]
      },
      {
        level: "整合",
        question: "用 S={PC,R,M,D} 描述 store instruction 正常完成後哪些 state 可能改變；再說明 page fault 時有何不同。",
        solution: ["正常 store 會更新指定 memory bytes M，並讓 PC 前進或依 ISA 決定 next PC；source registers 通常不變。device-mapped address 可能改變 D。", "page fault 時 store 可能尚未成為 architectural effect；control 轉入 exception handler，exception/privileged state 與 PC 保存方式依 ISA 規定更新。恢復後要確保 instruction 可被精確重試，不可重複產生已完成的 side effect。"]
      },
      {
        level: "計算",
        question: "四級 pipeline 的工作延遲為 180、240、150、210 ps，pipeline register overhead 為 25 ps。求 clock period、理想 throughput 與單條 instruction 的 pipeline latency。",
        solution: ["Clock period 由最慢工作加 register overhead 決定：T=240+25=265 ps。", "理想穩態 throughput=1/265 ps≈3.7736×10^9 instructions/s。", "單條 instruction 經四級的 latency≈4×265=1060 ps；這再次說明 throughput 與 latency 不能互換。"]
      },
      {
        level: "理解",
        question: "I1 已 retire，I2 的 divide-by-zero 會觸發 exception，I3 已算出結果但未 retire。Precise exception 進入 handler 時應呈現什麼狀態？",
        solution: ["I1 的效果保留；I2 不留下正常完成結果，系統保存 I2 的位置與 cause。", "I3 比 faulting instruction 年輕，即使 execution unit 已算完，其結果也不得進入 architectural state。handler 看見的是 I1 之後、I2 之前的一致邊界。"]
      },
      {
        level: "計算",
        question: "某最佳化可讓原本占 60% 的執行時間加速 5 倍，其餘不變。求 overall speedup 與該部分無限快時的上限。",
        solution: ["新時間比例=(1−0.60)+0.60/5=0.40+0.12=0.52。", "Overall speedup=1/0.52≈1.92308。", "若改善部分無限快，上限=1/0.40=2.5；未改善的 40% 仍是硬上限。"]
      },
      {
        level: "計算",
        question: "Activity 與 capacitance 不變，電壓由 1.0 V 降至 0.9 V，頻率由 2.0 GHz 升至 2.4 GHz。Dynamic power 比例是多少？",
        solution: ["依 P_dyn≈αCV²f，比值=(0.9/1.0)²×(2.4/2.0)。", "0.81×1.2=0.972，因此 dynamic power 約為原來 97.2%。", "頻率提高抵銷大部分降壓效益；此比例仍未包含 leakage。"]
      },
      {
        level: "計算",
        question: "處理器 X 平均 65 W、需 3.0 s；Y 平均 90 W、需 1.8 s。比較 energy 與 EDP。",
        solution: ["X energy=65×3.0=195 J；Y energy=90×1.8=162 J，所以 Y 少 33 J。", "X EDP=195×3.0=585 J·s；Y EDP=162×1.8=291.6 J·s。", "Y 的 power 較高，卻因更快完成而同時具有較低 energy 與 EDP。"]
      },
      {
        level: "整合",
        question: "一項工作在 CPU 上需 24 ms。NPU compute 只需 4 ms，但輸入、輸出、啟動分別需 7、5、3 ms。計算 offload speedup，並指出批次變小時首先要重新檢查的成本。",
        solution: ["Offload 總時間=7+3+4+5=19 ms；端到端 speedup=24/19≈1.2632。", "NPU compute 本身雖為 CPU 時間的六分之一，完整 speedup 只有約 1.263 倍。", "批次變小時，固定啟動成本與資料搬移占比會升高，應先重新量測這三項，而不是只引用 NPU peak throughput。"]
      }
    ],
    glossary: [
      ["Abstraction", "以穩定 interface 隱藏實作細節，讓上層只依賴規定的 operation 與 behavior。"],
      ["Interface", "兩層之間可使用的 operation、可見 state 與結果規則。"],
      ["ISA", "Instruction Set Architecture；software-visible 的指令、state、encoding、exception 與 memory interaction 合約。"],
      ["Microarchitecture", "實作 ISA 的內部 datapath、control、pipeline、cache、queue 與 predictor 安排。"],
      ["Architectural state", "依 ISA 可由程式觀察或影響的 state，例如 PC、registers 與 memory。"],
      ["Microarchitectural state", "用於執行與最佳化、通常不直接暴露給程式的內部 state。"],
      ["Stored-program", "把 instruction 以資料形式存入可定址 memory，CPU 依 PC fetch 並解讀。"],
      ["Datapath", "保存、搬移與運算資料的硬體路徑，包含 register、ALU、mux 等。"],
      ["Control unit", "解讀 instruction 與目前狀態，產生 datapath、memory 與 next-PC 控制訊號。"],
      ["Latency", "單一工作從開始到完成所需時間。"],
      ["Throughput", "單位時間內完成的工作數量。"],
      ["SIMT", "Single Instruction, Multiple Threads；多個 threads 執行相同 kernel 並保有各自 state 的模型。"],
      ["Branch divergence", "同一 SIMT group 中 threads 選擇不同 control paths，造成部分 lanes 暫時無法有效工作。"],
      ["Interconnect", "在 CPU、memory、I/O 或 cores 間傳遞 request、address、data 與 response 的連接結構。"],
      ["ABI", "Application Binary Interface；規定 binary 層級的 calling convention、register usage、資料配置與系統介面。"],
      ["Fetch", "以 PC 指定的位置取得 instruction bits 的工作。"],
      ["Decode", "辨認 opcode、operand fields 與該 instruction 所需 operation 的工作。"],
      ["Execute", "進行 ALU、branch decision、address calculation 或其他功能運算的工作。"],
      ["Retire / Commit", "讓已完成 instruction 的結果依架構允許的順序成為 architectural state。"],
      ["Pipeline register", "保存相鄰 pipeline stages 之間資料與控制狀態的 sequential element。"],
      ["Critical path", "決定 clock period 下限或某項工作 latency 的最長相依延遲路徑。"],
      ["CPI", "Cycles Per Instruction；完成每條 dynamic instruction 平均需要的 clock cycles。"],
      ["Clock period", "一個 clock cycle 的時間，與 clock rate 互為倒數。"],
      ["Dynamic instruction count", "程式對特定 input 實際執行的 instruction 數量。"],
      ["Speedup", "舊 execution time 除以新 execution time；大於 1 表示新系統較快。"],
      ["Amdahl's Law", "以可改善比例與局部加速倍數計算整體 speedup 及其上限。"],
      ["Exception", "由目前 instruction 或同步執行條件引發、需要轉移到 handler 的事件。"],
      ["Interrupt", "通常由 timer 或 device 等外部來源異步提出的處理請求。"],
      ["Trap", "不同 ISA 用法略異；常指刻意 instruction、system call 或 exception 造成的受控 handler transfer。"],
      ["Precise exception", "handler 所見狀態等同於某一清楚 instruction boundary：較舊者完成，faulting 與較年輕者未留下不當效果。"],
      ["Privilege mode", "限制可執行 operations 與可存取 resources 的 architectural authority level。"],
      ["System call", "user program 透過受控 trap 請求 operating system service 的介面。"],
      ["Speculation", "在結果尚未確定前先執行可能需要的工作，錯誤推測不得污染 architectural state。"],
      ["Reorder buffer", "Out-of-order CPU 中追蹤 in-flight instructions 並支援依序 retire 與 precise state 的結構。"],
      ["Dynamic power", "電路節點切換時充放電所消耗的功率，常以 αCV²f 建立一階模型。"],
      ["Static power", "即使不切換仍因 leakage 等機制消耗的功率。"],
      ["Activity factor", "α；每個 clock 週期中某等效 capacitance 發生切換的比例。"],
      ["DVFS", "Dynamic Voltage and Frequency Scaling；依需求調整 voltage 與 frequency 的功耗管理方法。"],
      ["Energy", "完成工作消耗的能量；power 對時間的積分，單位 joule。"],
      ["EDP", "Energy-Delay Product；同時懲罰 energy 與 execution time 的複合指標。"],
      ["Power wall", "Voltage scaling 放緩後，clock 與同時啟用電路受 power density 和散熱限制的現象。"],
      ["Moore's Law", "積體電路可經濟整合元件數隨時間快速成長的歷史觀察與產業目標。"],
      ["Dennard scaling", "MOSFET 尺寸與電壓等比例縮小時，維持近似 power density 的縮放模型。"],
      ["Dark silicon", "因 power/thermal budget 而不能同時以目標效能啟用的晶片資源。"],
      ["SoC", "System on Chip；把 CPU、accelerator、memory controller、I/O 與 interconnect 等整合在同一晶片或封裝系統。"],
      ["Accelerator", "為特定 operation 或 workload 提供較高 throughput 或 energy efficiency 的專用運算單元。"],
      ["NoC", "Network on Chip；以封包化 routers 與 links 連接 SoC 內多個 initiators 和 targets。"],
      ["Heterogeneous computing", "讓不同 ISA、core type 或 accelerator 依其優勢協同執行工作的計算方式。"],
      ["Failure domain", "單一故障可直接影響的一組 components 或 state 範圍。"]
    ],
    sources: [
      {
        key: "S1",
        title: "UC Berkeley CS 61C Course Notes: Great Idea of Abstraction and RISC-V Introduction",
        url: "https://notes.cs61c.org/content/rv-intro/",
        accessed: "2026-08-16",
        use: "抽象層次、ISA 作為 software/hardware interface，以及 RISC 教學脈絡。"
      },
      {
        key: "S2",
        title: "MIT OpenCourseWare 6.004: Designing an Instruction Set",
        url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c9/",
        accessed: "2026-08-16",
        use: "stored-program、von Neumann model、datapath/control 與 instruction cycle。"
      },
      {
        key: "S3",
        title: "RISC-V Instruction Set Manual, Volume I, Official Release 20260120",
        url: "https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html",
        accessed: "2026-08-16",
        use: "ISA 與 microarchitecture 分離、base ISA、extensions 與 programmer-visible state。"
      },
      {
        key: "S4",
        title: "MIT OpenCourseWare 6.004: The von Neumann Model",
        url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c9/c9s1/",
        accessed: "2026-08-16",
        use: "instruction/data stored as bits、PC fetch 與 control/datapath 分工。"
      },
      {
        key: "S5",
        title: "NVIDIA CUDA Programming Guide: Programming Model",
        url: "https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html",
        accessed: "2026-08-16",
        use: "現代 SIMT、thread state、warp execution 與 branch divergence。"
      },
      {
        key: "S6",
        title: "NVIDIA CUDA Toolkit Documentation",
        url: "https://docs.nvidia.com/cuda/",
        accessed: "2026-08-28",
        use: "目前 CUDA programming model 與工具鏈版本脈絡。"
      },
      {
        key: "S7",
        title: "Arm: Introducing the Arm Architecture",
        url: "https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Learn%20the%20Architecture/Introducing%20the%20Arm%20architecture.pdf",
        accessed: "2026-08-28",
        use: "Architecture contract、instruction processing、register、exception 與 privilege 的現代說明。"
      },
      {
        key: "S8",
        title: "RISC-V Instruction Set Manual, Volume II: Privileged Architecture, Release 20260120",
        url: "https://docs.riscv.org/reference/isa/v20260120/priv/priv-preface.html",
        accessed: "2026-08-28",
        use: "Trap、privilege mode、precise state 與 privileged architectural interface。"
      },
      {
        key: "S9",
        title: "Intel 64 and IA-32 Architectures Software Developer Manuals",
        url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html",
        accessed: "2026-08-28",
        use: "Instruction execution environment、exceptions、interrupts 與 software-visible state。"
      },
      {
        key: "S10",
        title: "SPEC CPU 2026 Overview",
        url: "https://www.spec.org/cpu2026/Docs/overview.html",
        accessed: "2026-08-28",
        use: "目前 CPU-intensive benchmark suite、speed/rate metrics 與可比較量測原則。"
      },
      {
        key: "S11",
        title: "Gene Amdahl: Validity of the Single Processor Approach to Achieving Large-Scale Computing Capabilities",
        url: "https://doi.org/10.1145/1465482.1465560",
        accessed: "2026-08-28",
        use: "不可改善工作限制整體 speedup 的原始論證。"
      },
      {
        key: "S12",
        title: "Dennard et al.: Design of Ion-Implanted MOSFET's with Very Small Physical Dimensions",
        url: "https://doi.org/10.1109/JSSC.1974.1050511",
        accessed: "2026-08-28",
        use: "Constant-field device scaling 與 power density 推導的原始研究。"
      },
      {
        key: "S13",
        title: "Gordon Moore: Cramming More Components onto Integrated Circuits",
        url: "https://ieeemilestones.ethw.org/File:Moore_1965_Electronics_Article.pdf",
        accessed: "2026-08-28",
        use: "元件整合密度歷史觀察的原始 1965 年文章。"
      },
      {
        key: "S14",
        title: "Dark Silicon and the End of Multicore Scaling",
        url: "https://cseweb.ucsd.edu/~hadi/doc/paper/2011-isca-dark_silicon.pdf",
        accessed: "2026-08-28",
        use: "Voltage scaling 放緩、power budget 與 dark silicon 的架構後果。"
      },
      {
        key: "S15",
        title: "Mark Horowitz: Computing's Energy Problem and What We Can Do About It",
        url: "https://doi.org/10.1109/ISSCC.2014.6757323",
        accessed: "2026-08-28",
        use: "Operation 與 data movement energy、energy-efficient architecture 的量化背景。"
      },
      {
        key: "S16",
        title: "UC Berkeley CS 61C Course Notes: Pipelining",
        url: "https://notes.cs61c.org/content/pipeline/",
        accessed: "2026-08-28",
        use: "Pipeline stage、clock period、latency 與 throughput 的教學模型。"
      },
      {
        key: "S17",
        title: "UC Berkeley CS 61C Course Notes: Parallelism and Amdahl's Law",
        url: "https://notes.cs61c.org/content/parallel-performance/",
        accessed: "2026-08-28",
        use: "Speedup、可平行比例與 Amdahl 計算。"
      },
      {
        key: "S18",
        title: "Arm AMBA Architecture",
        url: "https://developer.arm.com/Architectures/AMBA",
        accessed: "2026-08-28",
        use: "SoC component communication、bus 與 network-on-chip interface。"
      },
      {
        key: "S19",
        title: "UC Berkeley CS 61C, Spring 2026",
        url: "https://cs61c.org/?redirect=false",
        accessed: "2026-08-28",
        use: "目前大學部 computer architecture 課程脈絡與公開教材入口。"
      },
      {
        key: "S20",
        title: "SPEC Releases CPU 2026 Benchmark Suite",
        url: "https://www.spec.org/pressreleases/2026/20260505-spec-releases-cpu-2026-benchmark-suite/",
        accessed: "2026-08-28",
        use: "SPEC CPU 2026 的發佈日期、52 個 benchmarks 與四個 suites。"
      }
    ]
  },
  {
    chapter: 2,
    title: "位元模式、數值與文字的表示",
    english: "Representing Bits, Numbers, and Text",
    revised: "2026-08-16",
    readingTime: "約 180–240 分鐘",
    intro: "記憶體只保存位元模式，不會自行標記某一串 bits 是負整數、小數、字元、指令或錯誤檢查碼。真正賦予位元意義的是表示法與操作規則。本章從 positional notation 建立二進位與十六進位的數學模型，再推導 fixed-width unsigned、two's complement、定點與 IEEE 754；接著追蹤多位元組資料的 endian 排列、Unicode code point 如何轉成 UTF-8 bytes，以及 parity、Hamming distance 與 CRC 如何用冗餘換取錯誤偵測能力。每個結果都能回到欄位權重、模數運算或編碼規則逐位驗證。",
    outcomes: [
      "能使用 positional notation 在二進位、十六進位與十進位之間轉換整數與有限小數。",
      "能推導 n-bit unsigned 與 two's complement 的範圍，並正確完成 negation、sign extension 與 zero extension。",
      "能分開判斷 carry out、unsigned wraparound 與 signed overflow，不再以單一旗標解釋所有算術結果。",
      "能用定點格式的 scaling factor 解碼數值，並說明 range 與 resolution 的取捨。",
      "能逐欄拆解 IEEE 754 binary32 的 normal、subnormal、zero、infinity 與 NaN。",
      "能分析 endian、alignment 與 byte addressing 對 memory dump 和資料交換的影響。",
      "能區分 Unicode code point、glyph 與 UTF-8 byte sequence，並手工編碼基本範例。",
      "能用 parity、Hamming distance、syndrome 與 CRC 說明錯誤偵測或修正能力。"
    ],
    sections: [
      {
        title: "1. 位元沒有型別：解讀規則才是資料",
        paragraphs: [
          "bit 只有 0 與 1 兩種狀態；8 bits 通常組成一個 byte，較長資料再由多個 bytes 組合。位元模式 11111111 可以是 unsigned 255、8-bit two's complement 的 -1、像素的一個色彩通道、指令的一部分，或文字編碼中的一個 byte。硬體保存的 pattern 沒有改變，改變的是讀取它的 operation 與表示法。",
          "一個完整表示法必須定義 pattern 空間、每個欄位的權重、合法與保留 pattern，以及 operation 遇到範圍外結果時的規則。unsigned integer 把所有 n bits 都當正權重；two's complement 讓最高位具有負權重；IEEE 754 把 bits 分成 sign、exponent 與 fraction。只看最左邊一個 bit，無法在不知道格式的情況下判定整個值。",
          "n bits 共有 2^n 種不同 patterns。表示法只能把這些 patterns 分配給有限個 values 或 states，因此 range、precision 與特殊狀態之間必須取捨。若使用一部分 patterns 表示 NaN 與 infinity，可表示的有限浮點數就會少一些；若把一半 integer patterns 分配給負數，最大正整數便小於同寬度 unsigned。"
        ],
        figure: {
          type: "bits",
          title: "同一個 16-bit pattern 的四個 nibble",
          totalBits: 16,
          items: [
            { label: "1011", bits: 4, detail: "hex B" },
            { label: "0110", bits: 4, detail: "hex 6" },
            { label: "0001", bits: 4, detail: "hex 1" },
            { label: "1110", bits: 4, detail: "hex E" }
          ],
          caption: "pattern 可簡寫為 0xB61E；它的最終意義仍由 unsigned、signed、instruction 或其他格式決定。"
        },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "2. Positional notation 與進位轉換",
        paragraphs: [
          "在 base b 的 positional notation 中，digits d_k...d_0.d_-1... 的值為 Σ d_i b^i，其中每個 digit 必須介於 0 與 b-1。二進位的權重是 ...8、4、2、1、1/2、1/4...；十六進位的權重是 ...256、16、1。這個公式同時處理整數與 radix point 右側的分數，不需要把轉換規則分成互不相干的背誦表。",
          "由 binary 轉 decimal 時，將每個為 1 的 bit weight 相加。由 decimal integer 轉 binary 時，可反覆除以 2 並由後往前讀 remainders，或由最大 power of two 逐項扣除。binary 與 hexadecimal 的轉換最直接：從 radix point 向左右每四 bits 分組，每組映射到一個 hex digit，前後不足四 bits 時補 0。",
          "fractional decimal 轉 binary 使用反覆乘 2：每次乘積的 integer part 成為下一個 bit，留下 fractional part 繼續。若餘數回到先前狀態，binary expansion 會循環。例如 0.625×2=1.25、0.25×2=0.5、0.5×2=1.0，因此 0.625=0.101₂；0.1₁₀ 則無法以有限 binary fraction 精確結束。"
        ],
        figure: {
          type: "flow",
          title: "十進位整數轉二進位的可驗證流程",
          items: ["除以 2", "記錄 remainder", "對 quotient 重複", "由最後一個 remainder 反向讀取", "以 positional weights 回算"],
          caption: "最後一步不是多餘動作；回算可抓出 remainder 順序顛倒與漏位錯誤。"
        },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "3. Unsigned、Two's Complement 與模數圓環",
        paragraphs: [
          "n-bit unsigned 的值為 Σ(i=0 到 n-1) b_i2^i，範圍是 0 到 2^n-1。硬體只保留 n bits 時，算術等同 modulo 2^n：超過最大值會從 0 重新開始。例如 8-bit unsigned 的 250+10 產生 260 mod 256=4，最高位 carry out 表示精確結果需要第 9 bit。",
          "n-bit two's complement 讓最高位 b_(n-1) 的權重成為 -2^(n-1)，其餘 bits 保持正權重，因此範圍是 -2^(n-1) 到 2^(n-1)-1。全 0 是唯一的 zero，全 1 是 -1。負值 -x 的 pattern 可由 x 的 bits 全部反相再加 1，因為 x+(~x+1)=2^n，在 n-bit modulo arithmetic 中等於 0。",
          "two's complement 的優點不是『最左 bit 單獨表示負號』，而是 signed 與 unsigned 可以共用同一個 n-bit adder。相同 sum bits 能按不同型別解讀；是否發生 signed overflow 要由 operands 與 result 的 signs 判斷。最小值 -2^(n-1) 沒有同寬度正值，所以對它取負仍得到相同 pattern，這是重要邊界條件。"
        ],
        figure: {
          type: "matrix",
          title: "8-bit patterns 的三種解讀",
          columns: ["Pattern", "Unsigned", "Two's complement", "觀察"],
          rows: [
            ["00000000", "0", "0", "共同且唯一的 zero"],
            ["01111111", "127", "127", "最大 signed positive"],
            ["10000000", "128", "-128", "最小 signed value"],
            ["11111111", "255", "-1", "相同 bits，不同型別"],
            ["11111011", "251", "-5", "反相 00000100 再加 1"]
          ],
          caption: "型別不改變 bits；型別決定 weights、比較規則與 overflow 解讀。"
        },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "4. 加減法、Carry、Overflow 與位元延伸",
        paragraphs: [
          "subtraction A-B 可改寫為 A+(~B+1)，所以 adder-subtractor 只需在 subtract mode 反相 B 並令初始 carry-in 為 1。無論 operands 被解讀為 signed 或 unsigned，硬體產生的低 n-bit result 完全相同；差別在於程式如何判定結果是否落在目標型別範圍內。",
          "unsigned addition 的精確結果若超過 2^n-1，會出現 carry out；signed addition 則在兩個同號 operands 產生異號 result 時 overflow。兩個異號 signed values 相加不會 overflow，因為結果位於兩者之間。carry out 與 signed overflow 可以一個發生、另一個不發生，不能互相代替。",
          "把較窄值放入較寬 register 時，unsigned 使用 zero extension；two's complement signed 使用 sign extension，也就是複製原最高位。8-bit -5 為 11111011，sign-extend 到 16 bits 是 11111111 11111011，權重仍為 -5；若誤用 zero extension，會得到 251。縮窄則會捨棄高 bits，必須另外確認被捨棄部分是否只是不影響值的 sign copies。"
        ],
        figure: {
          type: "matrix",
          title: "8-bit addition 的 Carry 與 Signed Overflow",
          columns: ["Operands", "8-bit result", "Carry out", "Signed overflow"],
          rows: [
            ["250 + 10", "00000100", "1", "不適用於 unsigned 解讀"],
            ["100 + 60", "10100000", "0", "是：正 + 正得到負"],
            ["-100 + -60", "01100000", "1", "是：負 + 負得到正"],
            ["-20 + 30", "00001010", "1", "否：異號相加"]
          ],
          caption: "result bits 由同一個 adder 產生；flags 回答的是不同數學問題。"
        },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "5. 定點數：用固定 scaling factor 表示小數",
        paragraphs: [
          "fixed-point 不需要特殊浮點欄位，而是約定某個 scaling factor。例如 unsigned Q4.4 使用 8 bits，其中 4 bits 在 radix point 左側、4 bits 在右側；stored integer I 所代表的 real value 為 I×2^-4。pattern 00101010 的 I=42，因此值為 42/16=2.625。",
          "fraction bits 越多，resolution 越細；integer bits 越多，range 越大。在總位數固定時兩者互相競爭。Q4.4 的 step size 是 1/16=0.0625，無法精確表示 0.1；量化時必須選擇 truncate 或 rounding。兩個同格式 fixed-point values 相加可直接加 stored integers，但乘法會讓 scaling factor 變成 2^-8，必須移位與 rounding 才能回到 Q4.4。",
          "定點格式適合範圍可預測、需要可重現 step size 或硬體資源受限的工作，例如感測器、音訊與控制系統。它不是『沒有誤差』：輸入量化、乘法截位與 overflow 都會產生誤差。可靠設計要同時寫出 bit width、signedness、fraction bits、rounding mode 與 saturation/wrap 規則。"
        ],
        figure: {
          type: "bits",
          title: "Unsigned Q4.4 的欄位與權重",
          totalBits: 8,
          items: [
            { label: "0010", bits: 4, detail: "integer part = 2" },
            { label: "1010", bits: 4, detail: "fraction = 10/16" }
          ],
          caption: "0010.1010₂ = 2 + 1/2 + 1/8 = 2.625；最小 step 為 2^-4。"
        },
        sourceRefs: ["S10"]
      },
      {
        title: "6. IEEE 754 Binary32：範圍、精度與特殊值",
        paragraphs: [
          "IEEE 754 binary32 由 1-bit sign、8-bit biased exponent E 與 23-bit fraction F 組成。當 1≤E≤254 時，值為 (-1)^s × 1.F₂ × 2^(E-127)。normalized significand 最前面的 1 不存入 fraction，因此有效精度是 24 binary digits；這個 hidden bit 只適用於 normal numbers。",
          "E=0 時，F=0 表示 signed zero，F≠0 表示 subnormal，值為 (-1)^s × 0.F₂ × 2^-126。subnormal 讓數值在接近 0 時逐步失去 precision，而不是突然從最小 normal 跳到 zero。E=255 且 F=0 表示 infinity；E=255 且 F≠0 表示 NaN。NaN 的比較與傳播規則不能用一般實數直覺推論。",
          "浮點運算必須把無限精確結果 rounding 到目標格式；IEEE 754 定義多種 rounding directions，常見預設是 round to nearest, ties to even。precision 取決於 significand bits，不是 decimal point 後固定幾位。數值 magnitude 越大，相鄰 representable values 的間距通常越大，因此 x+1 可能在 x 很大時仍等於 x。"
        ],
        figure: {
          type: "bits",
          title: "IEEE 754 Binary32 欄位",
          totalBits: 32,
          items: [
            { label: "Sign", bits: 1, detail: "0 positive / 1 negative" },
            { label: "Exponent", bits: 8, detail: "bias 127；0 與 255 保留" },
            { label: "Fraction", bits: 23, detail: "normal value 的 hidden leading 1 之後" }
          ],
          caption: "欄位切割只能先分類；還要依 exponent 是否為 0、1–254 或 255 選擇正確公式。"
        },
        sourceRefs: ["S3", "S10"]
      },
      {
        title: "7. Byte Addressing、Alignment 與 Endianness",
        paragraphs: [
          "byte-addressed memory 為每個 byte 指定位址，多 byte object 佔用連續 addresses。32-bit word 需要 4 bytes；若起始位址為 0x1000，bytes 位於 0x1000 到 0x1003。alignment 要求通常讓 object 起始位址是其大小的倍數，簡化一次存取涵蓋的 memory boundaries，但實際例外與效能規則由 ISA 與 system interface 定義。",
          "endianness 決定 multi-byte value 的 bytes 如何放進遞增 addresses。對 32-bit value 0x12345678，big-endian 在最低位址放 0x12，little-endian 則放 0x78。它不會把每個 byte 內的 bits 反轉，也不會改變 register 中抽象的 numeric value；差異只在 serialize、memory dump 或不同寬度存取時顯現。",
          "資料交換必須指定 byte order 與 field width，不能只寫『傳一個 int』。network protocols 常明確使用 network byte order；file formats 也會固定 endian 或加入 marker。RISC-V 基礎 ISA 的自然 load/store 語意與實作支援的 endian 由規格界定；assembler 顯示的 word hex 與 memory debugger 顯示的 bytes 可能順序相反，但兩者都正確。"
        ],
        figure: {
          type: "matrix",
          title: "0x12345678 從位址 0x1000 開始的 byte 排列",
          columns: ["Byte address", "Big-endian", "Little-endian"],
          rows: [
            ["0x1000", "0x12", "0x78"],
            ["0x1001", "0x34", "0x56"],
            ["0x1002", "0x56", "0x34"],
            ["0x1003", "0x78", "0x12"]
          ],
          caption: "endian 只重新安排 bytes；每個 byte 內仍以相同 bit pattern 表示。"
        },
        sourceRefs: ["S6"]
      },
      {
        title: "8. Unicode Code Point 與 UTF-8 Bytes",
        paragraphs: [
          "Unicode 為文字元素指定 code points，例如字元 A 是 U+0041，中是 U+4E2D。code point 是抽象編號，不等於 glyph：相同 code point 可由不同 font 畫成不同形狀，多個 code points 也可能組成使用者看見的一個 grapheme cluster。字元數、code point 數與 bytes 數因此不一定相等。",
          "UTF-8 是把 Unicode scalar values 轉成 1 到 4 bytes 的 encoding。U+0000 到 U+007F 使用 0xxxxxxx；較大 code point 依序使用 110xxxxx 10xxxxxx、1110xxxx 10xxxxxx 10xxxxxx 或 11110xxx 加三個 continuation bytes。continuation byte 固定以 10 開頭，讓 decoder 能辨認 byte sequence 邊界。",
          "截至 2026-08-16，Unicode 17.0 是已發布的正式版本。UTF-8 的 ASCII 區段保持單 byte 相容，但不能因此假設一個文字字元永遠是一個 byte。處理 substring、游標移動與欄寬時，應明確區分 byte offset、code point index 與 grapheme boundary。"
        ],
        figure: {
          type: "flow",
          title: "Unicode 文字進入記憶體的三層表示",
          items: ["Character identity", "Unicode code point U+HHHH", "UTF-8 encoding rule", "1–4 bytes", "font shaping produces glyphs"],
          caption: "code point 定義文字身分，UTF-8 定義 bytes，font 與 shaping system 才決定畫面上的 glyph。"
        },
        sourceRefs: ["S4", "S5"]
      },
      {
        title: "9. Parity、Hamming Distance 與 CRC",
        paragraphs: [
          "error detection 會加入由資料計算出的 redundant bits。even parity 讓 codeword 中 1 的總數為偶數；任一單 bit 翻轉會改變奇偶性，因此必能偵測，但兩個 bits 同時翻轉可能讓 parity 恢復原狀。偵測能力取決於合法 codewords 之間的 Hamming distance，而不是單純看附加 bits 數量。",
          "兩個等長 bit strings 的 Hamming distance 是不同 bit positions 的數量。若 code 的 minimum distance 為 d_min，最多可保證偵測 d_min-1 個 bit errors，並可保證修正 floor((d_min-1)/2) 個。Hamming code 把 parity bits 放在 power-of-two positions，接收端重新計算 parity 所形成的 syndrome 可指出單一錯誤位置；加入整體 parity 可形成常見 SECDED 結構。",
          "CRC 把 message bits 視為 GF(2) polynomial coefficients，以指定 generator polynomial 做除法並附上 remainder。接收端用同一 generator 檢查 remainder；XOR 取代一般減法，因此硬體可用 shift register 與 XOR network 實作。CRC 很擅長偵測 burst errors，但不是 cryptographic integrity proof，不能抵抗刻意選擇的惡意修改。"
        ],
        figure: {
          type: "matrix",
          title: "常見冗餘機制的能力邊界",
          columns: ["機制", "核心計算", "可保證的典型能力", "限制"],
          rows: [
            ["Even parity", "所有 bits XOR", "偵測任一 single-bit error", "偶數個翻轉可能漏失"],
            ["Hamming SEC", "多組 parity + syndrome", "定位並修正一個 bit", "多錯誤需更大 distance"],
            ["SECDED", "Hamming + overall parity", "修正一個、偵測兩個", "不可任意修正多錯誤"],
            ["CRC", "GF(2) polynomial remainder", "依 polynomial 偵測多種 burst patterns", "不是防惡意竄改的 MAC"]
          ],
          caption: "冗餘不是越多就自動越可靠；能力由 code construction 與 minimum distance 決定。"
        },
        sourceRefs: ["S7", "S8", "S9"]
      },
      {
        title: "10. 從 Bits 到 Correctness：建立表示契約",
        paragraphs: [
          "分析任何 bit pattern 時，先寫出 representation contract：總寬度、field boundaries、signedness、scaling 或 bias、byte order、合法 special patterns，以及 overflow/rounding/error rules。這些條件缺一時，單一 hex value 往往沒有唯一答案。0xFFFFFFFF 可依 context 成為 unsigned 4294967295、signed -1、NaN 的一部分或四個 bytes。",
          "再把 conversion 分成可驗證步驟：切欄位、標權重、依分類選公式、執行 arithmetic、重新 encode，最後用 range 或 round-trip 檢查。IEEE 754 題先分類 exponent；UTF-8 題先確認 code point range；endian 題先列 addresses；overflow 題先決定 signed 或 unsigned。固定流程能避免只靠圖形直覺猜答案。",
          "表示法也會跨層影響效能與安全性。alignment 改變 memory transactions，浮點 precision 改變數值穩定性，signed/unsigned conversion 可能破壞 bounds check，錯誤的 UTF-8 邊界可能截斷 sequence。correctness 的起點不是『電腦只懂 0 和 1』，而是每一層都對同一串 bits 採用一致且明確的契約。"
        ],
        figure: {
          type: "flow",
          title: "解讀未知位元模式的證據鏈",
          items: ["Identify width and context", "Split fields or bytes", "Assign weights / rules", "Compute value or state", "Check range and special cases", "Round-trip to original bits"],
          caption: "能 round-trip 回原 pattern，代表欄位切割與解讀至少彼此一致；仍需確認 context 選對格式。"
        },
        sourceRefs: ["S2", "S3", "S4", "S6"]
      }
    ],
    workedExamples: [
      {
        title: "例題一：0x2D7 的二進位與十進位",
        prompt: "把 hexadecimal 0x2D7 轉成 12-bit binary 與 decimal，並用 positional weights 回算。",
        steps: [
          "每個 hex digit 對應 4 bits：2→0010、D→1101、7→0111。",
          "依原順序串接得到 0010 1101 0111₂。",
          "用 hex weights 回算：2×16² + 13×16¹ + 7×16⁰。",
          "16²=256，因此第一項為 512；13×16=208；最後一項為 7。",
          "總和 512+208+7=727。",
          "用 binary weights 檢查：2^9+2^7+2^6+2^4+2^2+2^1+2^0=727。"
        ],
        result: "0x2D7 = 0010 1101 0111₂ = 727₁₀。四 bits 一組可避免把 D 誤寫成十進位 13 的字串。"
      },
      {
        title: "例題二：8-bit Two's Complement 的 -37 + 54",
        prompt: "以 8-bit two's complement 編碼 -37 與 54，完成 addition 並判斷 signed overflow。",
        steps: [
          "37 的 8-bit pattern 是 00100101。",
          "反相得到 11011010，再加 1 得 -37 的 pattern 11011011。",
          "54 的 pattern 是 00110110。",
          "相加：11011011 + 00110110 = 1 00010001；保留低 8 bits 得 00010001。",
          "00010001₂=17，與數學結果 -37+54=17 相同。",
          "operands 異號，因此 signed addition 不會 overflow；carry out=1 也不代表 signed overflow。"
        ],
        result: "結果是 17，無 signed overflow。carry out 與 signed overflow 回答不同問題。"
      },
      {
        title: "例題三：相同 8-bit Sum 的兩種 Overflow 判斷",
        prompt: "計算 100+60 的 8-bit result，分別以 unsigned 與 two's complement 判斷。",
        steps: [
          "100=01100100₂，60=00111100₂。",
          "binary addition 得 10100000₂，沒有第 9-bit carry out。",
          "unsigned 解讀為 128+32=160，仍在 0..255 內，因此沒有 unsigned overflow。",
          "two's complement 把 10100000 解讀為 -128+32=-96。",
          "兩個正 operands 卻得到負 result，符合 signed overflow 條件。",
          "精確 signed 結果 160 超過 8-bit signed 最大值 127，與 sign-rule 判斷一致。"
        ],
        result: "同一個 result bits 對 unsigned 是合法 160，對 signed 是 overflow 後的 -96。"
      },
      {
        title: "例題四：把 13.25 編成 IEEE 754 Binary32",
        prompt: "求 13.25 的 sign、biased exponent、fraction 與 hexadecimal encoding。",
        steps: [
          "13₁₀=1101₂，0.25₁₀=0.01₂，所以 13.25=1101.01₂。",
          "normalize：1101.01₂ = 1.10101₂ × 2³。",
          "數值為正，因此 sign=0。",
          "actual exponent=3，biased exponent E=3+127=130=10000010₂。",
          "fraction 儲存 leading 1 後的 10101，再補 0 成 23 bits：10101000000000000000000。",
          "串接為 0 10000010 10101000000000000000000，四 bits 分組後是 0x41540000。"
        ],
        result: "13.25 的 binary32 encoding 是 0x41540000；exponent 不是 two's complement，而是 biased encoding。"
      },
      {
        title: "例題五：把「中」編成 UTF-8",
        prompt: "字元「中」的 code point 是 U+4E2D。求其 UTF-8 byte sequence。",
        steps: [
          "U+4E2D 位於 U+0800..U+FFFF，使用三-byte template：1110xxxx 10xxxxxx 10xxxxxx。",
          "4E2D 的 16-bit binary 是 0100 1110 0010 1101。",
          "依 4+6+6 bits 分組：0100 | 111000 | 101101。",
          "填入 templates：11100100 | 10111000 | 10101101。",
          "轉為 hexadecimal：E4 B8 AD。",
          "檢查後兩個 continuation bytes 都以 10 開頭，sequence length 與 code point range 一致。"
        ],
        result: "「中」的 UTF-8 是三個 bytes：E4 B8 AD；它不是單一 byte，也不是把 U+4E2D 直接分成 4E 2D。"
      }
    ],
    misconceptions: [
      ["最高位是 1，就一定是負數。", "只有在指定為 two's complement 等 signed format 時才成立；unsigned、float field 或 instruction bits 都可能以 1 開頭。"],
      ["carry out 就是 signed overflow。", "carry out 檢查 unsigned 精確結果是否需要第 n+1 bit；signed overflow 檢查同號 operands 是否得到異號 result。"],
      ["取反加一之後，最高位就是獨立的負號。", "two's complement 最高位具有 -2^(n-1) 權重，不能像 sign-magnitude 一樣先去掉 sign bit 再讀 magnitude。"],
      ["浮點數的 exponent 越大，精度越高。", "significand bits 決定相對精度；exponent 越大時 absolute spacing 反而通常越大。"],
      ["0.1 在 binary32 裡就是精確的十分之一。", "0.1 的 binary expansion 循環，必須 rounding 到鄰近 representable value。"],
      ["Little-endian 會把每個 byte 裡的 bits 倒過來。", "endianness 只決定 multi-byte object 的 byte order；byte 內 bit pattern 不反轉。"],
      ["一個 Unicode 字元就是兩個 bytes。", "Unicode code point 與 encoding 不同；UTF-8 使用 1–4 bytes，grapheme 還可能由多個 code points 組成。"],
      ["有 parity 就能修正任何錯誤。", "單一 parity 通常只能保證偵測奇數個 bit flips，無法定位錯誤；修正能力需要足夠 minimum distance 與結構。"]
    ],
    exercises: [
      {
        level: "基礎",
        question: "把 10110110₂ 轉成 hexadecimal 與 unsigned decimal。",
        solution: ["四 bits 分組：1011 0110，因此是 0xB6。", "unsigned value = 128+32+16+4+2 = 182。"]
      },
      {
        level: "基礎",
        question: "12-bit unsigned 與 12-bit two's complement 的範圍各是多少？",
        solution: ["unsigned：0 到 2^12-1 = 4095。", "two's complement：-2^11 到 2^11-1，也就是 -2048 到 2047。"]
      },
      {
        level: "基礎",
        question: "求 -52 的 8-bit two's complement pattern。",
        solution: ["52=00110100。", "反相得 11001011，加 1 得 11001100。", "回算權重：-128+64+8+4=-52。"]
      },
      {
        level: "理解",
        question: "將 8-bit pattern 10110111 分別 zero-extend 與 sign-extend 到 16 bits，並解釋其值。",
        solution: ["zero extension：00000000 10110111，unsigned value=183。", "sign extension：11111111 10110111；原 8-bit two's complement 是 -73，延伸後仍是 -73。"]
      },
      {
        level: "計算",
        question: "8-bit two's complement 計算 -90 + -50，列出 result bits 並判斷 overflow。",
        solution: ["-90=10100110，-50=11001110。", "相加得 1 01110100，低 8 bits 為 01110100=116。", "兩個負數得到正數，發生 signed overflow；精確結果 -140 小於 -128。"]
      },
      {
        level: "計算",
        question: "unsigned Q4.4 pattern 01101101 表示多少？最小 step size 是多少？",
        solution: ["stored integer 01101101₂=109。", "value=109×2^-4=109/16=6.8125。", "step size=2^-4=0.0625。"]
      },
      {
        level: "計算",
        question: "解碼 IEEE 754 binary32 hexadecimal 0xC1200000。",
        solution: ["sign=1，所以為負。", "exponent bits=10000010₂=130，actual exponent=3。", "fraction 開頭為 010...，significand=1.01₂=1.25。", "value=-1.25×2^3=-10。"]
      },
      {
        level: "理解",
        question: "為何 binary32 在 2^24 附近不能表示每一個相鄰整數？",
        solution: ["normal binary32 只有 24 bits precision，包含 hidden leading 1。", "當 exponent 使 unit in last place 變成 2 時，相鄰 representable values 間距為 2；奇數整數需要 rounding。"]
      },
      {
        level: "應用",
        question: "Little-endian 系統從位址 0x2000 儲存 32-bit value 0x89ABCDEF。列出四個 bytes。",
        solution: ["little-endian 把 least significant byte 放在最低位址。", "0x2000:EF、0x2001:CD、0x2002:AB、0x2003:89。"]
      },
      {
        level: "應用",
        question: "ASCII 字元 A 與字元「中」在 UTF-8 各需要幾個 bytes？列出 encoding。",
        solution: ["A 是 U+0041，位於 ASCII range，UTF-8 是單 byte 0x41。", "中是 U+4E2D，UTF-8 是三 bytes E4 B8 AD。", "字元數相同都是一個，但 byte lengths 不同。"]
      },
      {
        level: "理解",
        question: "payload 1011001 要加入 even parity bit。parity bit 是多少？單一與雙 bit errors 的偵測情況如何？",
        solution: ["payload 有四個 1，已是偶數，因此 parity bit=0。", "任一 single-bit flip 會讓 1 的總數變奇數，必被偵測。", "若恰有兩個 bits 翻轉，總 parity 仍可能為偶數，因此 simple parity 無法保證偵測。"]
      },
      {
        level: "計算",
        question: "要為 8 個 data bits 建立能定位 single-bit error 的 Hamming code，至少需要幾個 parity bits？使用 2^r ≥ m+r+1。",
        solution: ["m=8。測試 r=3：2^3=8，小於 8+3+1=12，不足。", "測試 r=4：2^4=16，大於等於 8+4+1=13。", "至少需要 4 個 Hamming parity bits；若再加 overall parity，可形成常見 SECDED 結構。"]
      },
      {
        level: "整合",
        question: "pattern 0xFFFFFFFF 有哪些可能解讀？至少列出四種，並說明還缺什麼資訊才能決定答案。",
        solution: ["可解讀為 32-bit unsigned 4294967295、32-bit two's complement -1、四個 0xFF bytes、RGBA color、instruction 或其他欄位。", "若切成 IEEE binary32，sign=1、exponent 全 1、fraction 非 0，屬於 NaN。", "必須知道 width、format/type、field boundaries、byte order 與操作 context 才能決定。"]
      }
    ],
    glossary: [
      ["Bit pattern", "固定寬度的 0/1 序列；本身不帶型別，需由表示規則解讀。"],
      ["Radix / Base", "positional notation 中相鄰 digit 權重的倍率，例如 binary 的 base 2。"],
      ["Nibble", "4 bits，恰好對應一個 hexadecimal digit。"],
      ["Unsigned integer", "所有 bit positions 都使用非負 powers-of-two 權重的整數表示。"],
      ["Two's complement", "最高位具有負權重、可與 unsigned 共用加法器的 fixed-width signed representation。"],
      ["Carry out", "addition 超出最高 bit position 產生的進位，常用於 unsigned range 判定。"],
      ["Signed overflow", "fixed-width signed 精確結果超出可表示範圍。"],
      ["Sign extension", "擴寬 two's complement value 時複製 sign bit，以保持數值。"],
      ["Fixed-point", "以固定 scaling factor 解讀 stored integer 的小數表示法。"],
      ["Resolution", "相鄰 representable values 之間的最小間距。"],
      ["Biased exponent", "把 actual exponent 加上固定 bias 後以 unsigned field 儲存。"],
      ["Subnormal", "IEEE 754 exponent field 為 0、fraction 非 0，沒有 hidden leading 1 的有限小數。"],
      ["NaN", "Not a Number；IEEE 754 用來表示無效或未定義數值結果的特殊值。"],
      ["Endianness", "multi-byte object 的 bytes 在遞增 memory addresses 中的排列順序。"],
      ["Code point", "Unicode 為抽象文字元素指定的編號，通常寫成 U+HHHH。"],
      ["UTF-8", "將 Unicode scalar value 編成 1–4 bytes 的 variable-length encoding。"],
      ["Hamming distance", "兩個等長 strings 在多少 bit positions 上不同。"],
      ["Syndrome", "由接收 codeword 重新計算 parity checks 得到、用於辨認錯誤狀態的 bit vector。"],
      ["CRC", "以 GF(2) polynomial division remainder 建立錯誤偵測碼的方法。"]
    ],
    sources: [
      {
        key: "S1",
        title: "MIT OpenCourseWare 6.004: Binary Representations",
        url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c1/c1s1/",
        accessed: "2026-08-16",
        use: "positional notation、unsigned 與 two's complement 權重、範圍與加減法推導。"
      },
      {
        key: "S2",
        title: "UC Berkeley CS61C Course Notes: Number Representation and Floating Point",
        url: "https://notes.cs61c.org/content/number-rep/summary/",
        accessed: "2026-08-16",
        use: "現行大學課程中的表示法、range、step size、two's complement 與 floating-point 教學脈絡。"
      },
      {
        key: "S3",
        title: "IEEE 754-2019: IEEE Standard for Floating-Point Arithmetic",
        url: "https://standards.ieee.org/ieee/315/6210/",
        accessed: "2026-08-16",
        use: "binary/decimal floating-point formats、operations、exceptions 與 rounding 的現行標準依據。"
      },
      {
        key: "S4",
        title: "The Unicode Standard, Version 17.0",
        url: "https://www.unicode.org/versions/Unicode17.0.0/core-spec/",
        accessed: "2026-08-16",
        use: "目前正式 Unicode 版本、code point、character 與 encoding 的標準定義。"
      },
      {
        key: "S5",
        title: "RFC 3629: UTF-8, a transformation format of ISO 10646",
        url: "https://www.rfc-editor.org/info/rfc3629/",
        accessed: "2026-08-16",
        use: "UTF-8 的 1–4 octet encoding ranges、prefix templates 與合法範圍。"
      },
      {
        key: "S6",
        title: "RISC-V Instruction Set Manual, Volume I, Official Release 20260120",
        url: "https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html",
        accessed: "2026-08-16",
        use: "現代 byte-addressed ISA、load/store、alignment 與 endian 規格脈絡。"
      },
      {
        key: "S7",
        title: "NIST Dataplot Reference: Hamming Distance",
        url: "https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/hammdist.htm",
        accessed: "2026-08-16",
        use: "Hamming distance 的正式計算定義。"
      },
      {
        key: "S8",
        title: "NIST Dictionary of Algorithms and Data Structures: Cyclic Redundancy Check",
        url: "https://xlinux.nist.gov/dads/HTML/cyclicRedundancyCheck.html",
        accessed: "2026-08-16",
        use: "CRC 的 polynomial/modulo-2 定義與錯誤偵測用途。"
      },
      {
        key: "S9",
        title: "NBS Special Publication 652: Hamming Code and Error Detection",
        url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nbsspecialpublication652.pdf",
        accessed: "2026-08-16",
        use: "Hamming parity positions、syndrome、single-error correction 與 double-error detection 概念。"
      },
      {
        key: "S10",
        title: "UC Berkeley CS61C Course Notes: Fixed Point and Floating Point",
        url: "https://notes.cs61c.org/content/floating-point/",
        accessed: "2026-08-16",
        use: "fixed-point scaling、range、step size，以及 IEEE 754 normalized representation 的公開課程推導。"
      }
    ]
  },
  {
    chapter: 3,
    title: "布林代數、數位邏輯與同步狀態",
    english: "Boolean Algebra, Digital Logic, and Synchronous State",
    revised: "2026-08-17",
    readingTime: "約 150–180 分鐘",
    intro: "處理器最終必須把指令語意化成可實作的位元運算與狀態轉移。組合邏輯回答『目前輸入決定什麼輸出』，循序邏輯回答『系統如何記住過去並在時脈邊緣更新』；布林代數、真值表與有限狀態機則是兩者之間可驗證的描述語言。本章從實際電壓的數位抽象開始，依序推導 canonical form、化簡、multiplexer、decoder、full adder、register、時序限制與 FSM，最後連到 ALU 與 RTL。每一個方程式都能回到真值表，每一條同步路徑都能回到 setup 與 hold 不等式，因此圖形、代數與時間三種證據可以互相核對。",
    outcomes: [
      "能區分實際電壓、邏輯準位與抽象 bit，並說明 noise margin 與 propagation delay 的作用。",
      "能由文字規格建立真值表，再寫出 canonical SOP 或 POS，並以布林定律或 Karnaugh map 化簡。",
      "能用 multiplexer、decoder、comparator 與 full adder 組成較大的組合電路。",
      "能由 full-adder 方程式推導 ripple-carry adder 的功能與 critical path。",
      "能區分 latch、edge-triggered register 與 combinational feedback，並追蹤同步狀態更新。",
      "能計算 setup slack、hold slack、critical-path delay 與最高時脈頻率。",
      "能把序列規格轉成 Moore 或 Mealy FSM 的狀態、轉移、輸出與編碼。",
      "能說明 clock-domain crossing 的亞穩態風險，以及 RTL、synthesis 與 timing verification 的關係。"
    ],
    sections: [
      {
        title: "1. 從連續電壓建立 0 與 1 的數位抽象",
        paragraphs: [
          "導線上的訊號是連續電壓，不是物理世界中天然存在的 0 或 1。數位電路把一段低電壓範圍解讀為邏輯 0，把一段高電壓範圍解讀為邏輯 1，中間區域則不保證解讀結果。只要前一級輸出的保證範圍比下一級輸入的判定範圍更嚴格，兩級之間就保留可容忍雜訊的空間，稱為 noise margin。",
          "數位抽象的力量在於把振幅細節壓縮成有限符號，讓後續推理只處理 Boolean value。它不是宣稱電壓永遠完美，而是訂出一份 electrical contract：合法輸入必須落在可辨識區域，合法輸出必須提供足夠的高低電位，負載與扇出也不能超過元件規格。若訊號停在未定義區，Boolean 模型便失去保證。",
          "邏輯閘也不會瞬間反應。輸入改變後，輸出要經過 propagation delay 才穩定；不同路徑延遲不一，短暫的 glitch 即使最後真值正確仍可能出現。同步系統以 register 隔開組合邏輯，要求資料在取樣邊緣前後穩定，將連續時間問題收斂成可以檢查的 timing constraints。"
        ],
        figure: {
          type: "matrix",
          title: "電壓、邏輯準位與保證",
          columns: ["觀察層次", "描述", "必須檢查的限制"],
          rows: [
            ["電路", "連續電壓、電流、電容", "threshold、load、noise、delay"],
            ["邏輯", "0、1，以及模擬中的 unknown", "合法準位與穩定時間"],
            ["系統", "word、instruction、state", "功能與 clock-to-clock 行為"]
          ],
          caption: "Boolean 值是建立在電氣保證上的抽象；延遲與未定義區域沒有消失，只是由介面規則集中管理。"
        },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "2. Gate、真值表與 Boolean function",
        paragraphs: [
          "Boolean variable 只有 0 與 1。NOT 取反單一輸入；AND 只有在所有輸入為 1 時輸出 1；OR 只要至少一個輸入為 1 就輸出 1；XOR 在輸入不同時輸出 1。NAND 與 NOR 是反相後的 AND、OR，兩者各自都是 functionally complete：只使用其中一種閘仍能表示任意 Boolean function。",
          "n 個輸入共有 2^n 種 input combinations，因此完整真值表有 2^n 列。真值表不依賴方程式寫法，是功能規格最直接的基準。例如三輸入 majority function M(A,B,C) 在至少兩個輸入為 1 時輸出 1，八列中恰有 011、101、110、111 四列為 1。",
          "Boolean 方程式要明確處理優先順序。常用慣例是 NOT 先於 AND，AND 先於 OR；但複雜式子應加括號。XOR 不是一般 OR：當 A=B=1 時，A+B 為 1，而 A XOR B 為 0。硬體中的加號、乘號常分別代表 OR、AND，不是整數算術。"
        ],
        figure: {
          type: "matrix",
          title: "基本二輸入邏輯閘真值表",
          columns: ["A", "B", "A AND B", "A OR B", "A XOR B", "A NAND B"],
          rows: [
            ["0", "0", "0", "0", "0", "1"],
            ["0", "1", "0", "1", "1", "1"],
            ["1", "0", "0", "1", "1", "1"],
            ["1", "1", "1", "1", "0", "0"]
          ],
          caption: "逐列比較可看出 OR 與 XOR 只在 A=B=1 時不同；NAND 是 AND 的逐列反相。"
        },
        sourceRefs: ["S1", "S3"]
      },
      {
        title: "3. 布林代數：等價變形必須保持每列輸出",
        paragraphs: [
          "布林代數的化簡目標是找出功能相同、成本可能更低的表示式。identity、null、idempotent、complement、commutative、associative 與 distributive laws 都能逐列由真值表驗證。例如 A+AB=A(1+B)=A，稱為 absorption；它表示 AB 已被 A 覆蓋，可以移除。",
          "De Morgan 定律連結反相與 AND/OR：NOT(A AND B) 等價於 NOT A OR NOT B；NOT(A OR B) 等價於 NOT A AND NOT B。推廣到多個變數時，反相穿過括號會交換 AND 與 OR，且每個 literal 都要反相。這是 NAND/NOR 實作與 active-low signal 分析的核心。",
          "代數變形的安全檢查是比較原式與新式的所有輸入列。若變數很多，formal equivalence checker 以相同原理但更有效率地證明等價。化簡後閘數較少不一定延遲最低：fan-in、fan-out、wire delay、可用 cell 與 critical path 都會影響實際 implementation。"
        ],
        figure: {
          type: "matrix",
          title: "常用布林定律速查",
          columns: ["定律", "形式", "直覺"],
          rows: [
            ["Identity", "A+0=A；A·1=A", "不加入有效條件"],
            ["Complement", "A+NOT A=1；A·NOT A=0", "必有一真、不可同真"],
            ["Idempotent", "A+A=A；A·A=A", "重複條件不改變結果"],
            ["Absorption", "A+A·B=A", "較窄條件已被較寬條件包含"],
            ["De Morgan", "NOT(A·B)=NOT A+NOT B", "反相穿越運算並交換 AND/OR"]
          ],
          caption: "每一條定律都是 Boolean functions 的等價關係，可由真值表逐列驗證。"
        },
        sourceRefs: ["S1", "S3"]
      },
      {
        title: "4. 從真值表到 canonical SOP、POS 與 Karnaugh map",
        paragraphs: [
          "canonical sum of products（SOP）從輸出為 1 的每一列建立 minterm。該列中輸入為 1 就寫原變數，輸入為 0 就寫反相變數，再把 literals 以 AND 相連；最後將所有 minterms 以 OR 相連。每個 minterm 只會匹配一列，因此必然重建原真值表。",
          "canonical product of sums（POS）則從輸出為 0 的每列建立 maxterm，再以 AND 連接。SOP 與 POS 都是機械化、可驗證的起點，通常不是最小實作。don't-care input 可以在化簡時視需要取 0 或 1，但前提是系統規格保證那些 combinations 永遠不發生，或其輸出確實無關。",
          "Karnaugh map 以 Gray-code 順序排列 cells，使水平或垂直相鄰 cell 只差一個 bit。將 1 以 1、2、4、8 等二次方大小群組，群組內會變動的變數被消去；邊界彼此相鄰，群組也可以重疊。K-map 適合少量變數的人工化簡，較大設計通常交由 synthesis 工具最佳化。"
        ],
        figure: {
          type: "matrix",
          title: "三輸入 majority 的 canonical SOP",
          columns: ["A B C", "M", "輸出為 1 時的 minterm"],
          rows: [
            ["000", "0", "—"], ["001", "0", "—"], ["010", "0", "—"],
            ["011", "1", "(NOT A)·B·C"], ["100", "0", "—"],
            ["101", "1", "A·(NOT B)·C"], ["110", "1", "A·B·(NOT C)"],
            ["111", "1", "A·B·C"]
          ],
          caption: "四個 minterms 相加得到 canonical SOP，再用相鄰列的共同 literals 化簡為 AB+AC+BC。"
        },
        sourceRefs: ["S3", "S4"]
      },
      {
        title: "5. Multiplexer、decoder 與 comparator 是可重用的組合模組",
        paragraphs: [
          "2-to-1 multiplexer（mux）依 select S 從 D0、D1 選一個輸出：Y=(NOT S)D0+SD1。它不只是在搬資料，也能實作任意 Boolean function：選一個變數當 S，再讓 D0、D1 分別代表該變數為 0、1 時剩餘輸入的子函數。多層 mux 形成 datapath 中的 operand、ALU result 與 next-PC 選擇網路。",
          "n-to-2^n decoder 將 n-bit code 轉成 one-hot outputs，理想情況下每次只有一條輸出有效。每個輸出就是一個 minterm，因此把指定 decoder outputs 以 OR 相連即可實作 SOP。encoder 執行相反方向；若可能同時有多個輸入有效，就需要 priority encoder 明確定義誰優先。",
          "equality comparator 可逐 bit 做 XNOR，再將所有結果 AND：每一對 bits 都相同時整個 word 才相等。unsigned magnitude comparator 則由最高有效 bit 開始，第一個不同 bit 決定大小。這種『先找最高優先差異』的結構也說明為何 signed 與 unsigned comparison 不能任意互換。"
        ],
        figure: {
          type: "flow",
          title: "以選擇訊號控制資料路徑",
          items: ["D0 / D1 候選值", "Select S", "2-to-1 MUX", "唯一輸出 Y", "送入 ALU 或 register"],
          caption: "控制訊號不必直接修改資料；它經常只決定哪一條既有資料路徑能到達下一級。"
        },
        sourceRefs: ["S1", "S4", "S6"]
      },
      {
        title: "6. Half adder、full adder 與 ALU slice",
        paragraphs: [
          "half adder 加兩個 1-bit operands：Sum=A XOR B，Carry=A AND B。多位元加法還必須接收較低位傳來的 Cin，因此 full adder 有三個輸入。其 Sum=A XOR B XOR Cin；Cout 在三個輸入至少兩個為 1 時成立，所以 Cout=AB+A·Cin+B·Cin。",
          "把每一位 full adder 的 Cout 接到下一位 Cin，形成 ripple-carry adder。功能上它完全正確，但最高位結果必須等待 carry 逐級傳播；若每級 carry path 延遲為 tcarry，N-bit critical path 約隨 N 線性成長。carry-lookahead 以 generate Gi=AiBi 與 propagate Pi=Ai XOR Bi 預先展開 carry 關係，以更多硬體換取較短深度。",
          "ALU 可視為多個 bit slices 與輸出選擇器。每個 slice 同時計算 AND、OR、sum 等候選值，operation code 再由 mux 選出結果；subtraction 可利用 A+(NOT B)+1，讓同一 adder 重用於加減。zero、carry、overflow 與 less-than 等 flags 由結果與最高位 carry 關係產生，之後成為 branch 或 status 判斷的輸入。"
        ],
        figure: {
          type: "matrix",
          title: "一位 full adder 的八種輸入",
          columns: ["A", "B", "Cin", "Sum", "Cout"],
          rows: [
            ["0", "0", "0", "0", "0"], ["0", "0", "1", "1", "0"],
            ["0", "1", "0", "1", "0"], ["0", "1", "1", "0", "1"],
            ["1", "0", "0", "1", "0"], ["1", "0", "1", "0", "1"],
            ["1", "1", "0", "0", "1"], ["1", "1", "1", "1", "1"]
          ],
          caption: "Sum 是三輸入 parity；Cout 是三輸入 majority。兩個方程式都能直接由表格重建。"
        },
        sourceRefs: ["S1", "S4"]
      },
      {
        title: "7. State、latch 與 edge-triggered register",
        paragraphs: [
          "組合電路的輸出只由當下輸入決定；若輸出還取決於先前事件，系統就需要 state。最小的儲存概念可由 feedback 建立兩個穩定狀態，但任意組合邏輯回授可能振盪或落入不可預期狀態，不能把『接回去』當成可靠記憶體設計。",
          "level-sensitive latch 在 enable 有效期間透明，輸入變化可持續穿過；edge-triggered register 只在指定 clock edge 取樣 D，之後將 Q 保持到下一個 edge。兩者都儲存 bit，但 timing model 不同。同步處理器資料路徑通常以 edge-triggered registers 描述 stage boundary，避免在一個 cycle 內不受控地穿透多級。",
          "同步狀態更新可以寫成 S(t+1)=F(S(t),X(t))，輸出則為 G(S(t),X(t)) 或只由 S(t) 決定。clock edge 到來時，所有 registers 概念上同時取樣各自 D；每個 D 在 edge 前其實已由舊 Q 經組合邏輯算好。分析時先固定舊 state，再算 next state，最後一次更新，不能逐個 register 就地覆寫。"
        ],
        figure: {
          type: "flow",
          title: "同步狀態的封閉迴路",
          items: ["目前 Q = S(t)", "組合 next-state 邏輯 F", "D = S(t+1)", "clock edge 取樣", "新的 Q"],
          caption: "feedback 穿過 register，讓每次狀態改變只發生在離散 clock edge；cycle 內的組合邏輯負責算好下一狀態。"
        },
        sourceRefs: ["S1", "S2", "S5"]
      },
      {
        title: "8. Setup、hold、critical path 與最高時脈",
        paragraphs: [
          "一條 register-to-register path 從來源 register 的 clock-to-Q delay 開始，經 combinational logic 與 wire delay，到目的 register 的 D。為了在下一個 edge 正確取樣，clock period 至少要涵蓋 tclk-q(max)+tcomb(max)+tsetup，再加上必須保留的 clock skew 或 uncertainty。setup slack 是可用週期減去實際需求；負值表示時脈太快或路徑太慢。",
          "hold constraint 檢查同一個 edge 之後，新資料不能太早抵達：tclk-q(min)+tcomb(min) 必須不小於 thold，再依 clock skew 定義調整。降低 clock frequency 會拉長下一個 edge 的距離，通常能修 setup violation，卻不會改變同一 edge 附近的最短路徑，因此不能靠降頻修 hold violation。常見 hold 修正是增加最短路徑 delay 或調整 clock distribution。",
          "整個同步模組的最低合法 clock period 由所有 paths 中需求最大的 critical path 決定，fmax=1/Tmin。增加 pipeline register 可把長組合路徑切短並提高 throughput，但會增加 registers、控制複雜度與 latency。只有在完整 static timing analysis 中同時滿足 setup、hold、clock-domain 與 I/O constraints，功能模擬正確才足以成為可運作的電路。"
        ],
        figure: {
          type: "factor",
          title: "一個 clock period 的最長路徑預算",
          items: [
            { label: "tclk-q(max)", detail: "來源 register 在 edge 後推出新 Q" },
            { label: "tcomb(max)", detail: "最慢組合邏輯與連線" },
            { label: "tsetup", detail: "目的 register 在下一 edge 前的穩定時間" },
            { label: "uncertainty", detail: "skew、jitter 與保留量" }
          ],
          caption: "Tclk 必須大於或等於四項總和；最短路徑則另以 hold inequality 檢查。"
        },
        sourceRefs: ["S2", "S5", "S9"]
      },
      {
        title: "9. 有限狀態機：把時間行為化成有限圖",
        paragraphs: [
          "finite state machine（FSM）用有限個 states 摘要所有與未來行為有關的過去資訊。設計時先寫清楚輸入與輸出，再找出為了做出下一次決策必須記住什麼。若兩段 history 對任何未來輸入都會產生相同行為，它們可以合併為同一 state；state 名稱是語意標籤，實作時才映射成 bits。",
          "Moore machine 的輸出只由 current state 決定，通常在進入某 state 後改變；Mealy machine 的輸出由 current state 與 current input 共同決定，常能較早反應並使用較少 states，但組合輸入變化可能直接影響輸出。兩者能表示相同類型的循序行為，時序與介面需求決定較合適的形式。",
          "FSM 實作包含 state register、next-state logic 與 output logic。若有 N states，binary encoding 至少需要 ceil(log2 N) bits；one-hot encoding 使用 N bits，解碼較直接但 registers 較多。重設後必須進入已知 state，且所有 input/state combinations 都應有明確轉移，避免 latch inference 或 unreachable-state recovery 不明。"
        ],
        figure: {
          type: "matrix",
          title: "可重疊偵測 101 的 Mealy FSM",
          columns: ["目前 state", "已記住的 suffix", "input=0 → next/output", "input=1 → next/output"],
          rows: [
            ["S0", "無", "S0 / 0", "S1 / 0"],
            ["S1", "1", "S10 / 0", "S1 / 0"],
            ["S10", "10", "S0 / 0", "S1 / 1"]
          ],
          caption: "在 S10 收到 1 時完成 101，同時新字串末尾的 1 又可成為下一次偵測的開頭，因此回到 S1。"
        },
        sourceRefs: ["S1", "S5", "S6"]
      },
      {
        title: "10. 亞穩態、clock-domain crossing 與 RTL 驗證",
        paragraphs: [
          "若 asynchronous input 或另一 clock domain 的訊號在取樣邊緣附近改變，可能違反 setup/hold，使 flip-flop 進入 metastable state。輸出最後通常會解析成 0 或 1，但解析時間沒有固定上限；若不穩定值立刻扇出到多處，接收邏輯可能在同一事件上得到不一致判斷。",
          "單 bit control 常用兩級或多級 synchronizer：第一級承受較高亞穩態機率，後續級提供額外解析時間，再把穩定結果送入接收 domain。這會把 failure probability 壓低並提高 MTBF，卻不是數學上的完全消除。multi-bit data 不能把每一位各自同步，因為 bits 可能跨 cycle 不一致；常見方法是 handshake、Gray-code pointer 或 asynchronous FIFO。",
          "RTL 以 register transfer 描述 clock edge 間的資料與控制，synthesis 將可合成語意映射為 gates、muxes、registers 與 wires。IEEE 1800-2023 同時涵蓋 design、testbench 與 assertions，但 HDL 不是逐行執行的一般軟體：並行硬體會同時存在。完整驗證要把真值表／state transition 的功能證據、simulation、formal checks、CDC analysis 與 static timing analysis 放在一起。"
        ],
        figure: {
          type: "flow",
          title: "從 RTL 規格到可計時的數位電路",
          items: ["Boolean / state specification", "RTL", "Simulation + assertions", "Synthesis", "Gate-level netlist", "STA + CDC", "可實作設計"],
          caption: "功能正確與時間正確是兩個檢查維度；任一項失敗都不能保證實體系統依規格運作。"
        },
        sourceRefs: ["S7", "S8", "S9"]
      }
    ],
    workedExamples: [
      {
        title: "例題一：由 majority 規格推導最簡 SOP",
        prompt: "三個輸入 A、B、C 中至少兩個為 1 時 M=1。由真值表建立 canonical SOP，再化簡。",
        steps: [
          "三個 inputs 共有 2^3=8 列；輸出為 1 的列是 011、101、110、111。",
          "依序寫出 minterms：(NOT A)BC、A(NOT B)C、AB(NOT C)、ABC。",
          "canonical SOP 為 M=(NOT A)BC+A(NOT B)C+AB(NOT C)+ABC。",
          "將 ABC 分別與前三項配對：BC[(NOT A)+A]=BC，AC[(NOT B)+B]=AC，AB[(NOT C)+C]=AB。",
          "得到 M=AB+AC+BC；任一 pair 同時為 1，就表示至少有兩個 1。",
          "逐列驗證簡式只在 011、101、110、111 輸出 1，與原規格相同。"
        ],
        result: "majority function 的化簡式為 AB+AC+BC，也正是 full adder 的 carry-out。"
      },
      {
        title: "例題二：用 4-to-1 mux 實作三輸入函數",
        prompt: "F(A,B,C)=Σm(1,2,6,7)。以 A、B 作 mux select，求四個 data inputs。",
        steps: [
          "固定 AB=00，對應 minterms 0、1；C=0 時 F=0，C=1 時 F=1，所以 D0=C。",
          "固定 AB=01，對應 minterms 2、3；輸出依序為 1、0，所以 D1=NOT C。",
          "固定 AB=10，對應 minterms 4、5；兩列輸出皆 0，所以 D2=0。",
          "固定 AB=11，對應 minterms 6、7；兩列輸出皆 1，所以 D3=1。",
          "把 A、B 接到 select，把 C、NOT C、0、1 接到 D0..D3。",
          "mux 對每一組 AB 只選相應子函數，因此八列輸出與 Σm(1,2,6,7) 完全一致。"
        ],
        result: "D0=C、D1=NOT C、D2=0、D3=1。mux 可用 Shannon expansion 把函數分解成較小子函數。"
      },
      {
        title: "例題三：逐位追蹤 4-bit ripple-carry addition",
        prompt: "以四個 full adders 計算 1011₂+0110₂，初始 Cin=0。",
        steps: [
          "bit 0：1+0+0，S0=1、C1=0。",
          "bit 1：1+1+0，S1=0、C2=1。",
          "bit 2：0+1+1，S2=0、C3=1。",
          "bit 3：1+0+1，S3=0、C4=1。",
          "由最高 carry 與四個 sum bits 組成 10001₂。",
          "十進位核對：1011₂=11、0110₂=6，而 11+6=17=10001₂。"
        ],
        result: "輸出為 C4S3S2S1S0=10001₂；每一級都必須等待前一級 carry，形成 ripple critical path。"
      },
      {
        title: "例題四：同時檢查 setup 與 hold",
        prompt: "某路徑 tclk-q(max)=80 ps、tcomb(max)=620 ps、tsetup=100 ps、uncertainty=50 ps；最短值 tclk-q(min)=60 ps、tcomb(min)=40 ps、thold=70 ps。求 Tmin、fmax 與 hold slack。",
        steps: [
          "setup path 的最低週期 Tmin=80+620+100+50=850 ps。",
          "fmax=1/(850×10^-12)=1.176×10^9 Hz，約 1.176 GHz。",
          "若實際 clock period 為 900 ps，setup slack=900-850=50 ps。",
          "最短資料抵達時間為 60+40=100 ps。",
          "在忽略額外 skew 的題目模型下，hold slack=100-70=30 ps。",
          "兩個 slack 都非負，因此此路徑在 900 ps clock 下同時滿足 setup 與 hold。"
        ],
        result: "最低週期 850 ps、最高頻率約 1.176 GHz；900 ps 週期時 setup slack=50 ps、hold slack=30 ps。"
      },
      {
        title: "例題五：追蹤可重疊 101 sequence detector",
        prompt: "使用本章 Mealy FSM，初始 S0，依序輸入 110101，列出每一步 state 與 output。",
        steps: [
          "input 1：S0→S1，output 0；已記住 suffix 1。",
          "input 1：S1→S1，output 0；最新 suffix 仍是 1。",
          "input 0：S1→S10，output 0；已記住 suffix 10。",
          "input 1：S10→S1，output 1；偵測到第一個 101，結尾 1 同時保留。",
          "input 0：S1→S10，output 0。",
          "input 1：S10→S1，output 1；偵測到第二個 101。",
          "輸出序列為 000101，兩個 1 分別對應輸入位置 4 與 6 結束的 pattern。"
        ],
        result: "狀態序列 S0,S1,S1,S10,S1,S10,S1；output=000101，重疊能力來自偵測後回到 S1。"
      }
    ],
    misconceptions: [
      ["邏輯 0 就是精確的 0 V，邏輯 1 就是精確的電源電壓。", "0 與 1 是電壓範圍的抽象；合法範圍與 noise margin 由元件規格決定。"],
      ["Boolean 的 + 和 · 就是一般加法與乘法。", "+ 代表 OR、· 代表 AND，所以 1+1=1；只有放進算術電路後才依 binary arithmetic 解讀。"],
      ["閘數最少的表示式一定最快。", "實際延遲還受 logic depth、fan-in、fan-out、wire 與 cell library 影響，必須看 critical path。"],
      ["組合電路輸入一變，輸出立刻得到新值。", "所有 gates 都有 propagation delay，不同路徑還可能造成短暫 glitch。"],
      ["Latch 與 register 只是兩個名稱。", "Latch 在有效電位期間透明；edge-triggered register 在 clock edge 取樣，timing 行為不同。"],
      ["降低 clock frequency 可以修正所有 timing violations。", "拉長週期通常能改善 setup，但同一 edge 附近的 hold violation 需要調整最短資料路徑或 clock。"],
      ["兩級 synchronizer 能完全消除 metastability。", "它以增加解析時間降低 failure probability、提高 MTBF，不能給出絕對零風險。"],
      ["HDL 像一般程式一樣由上到下只執行一次。", "RTL 描述同時存在的硬體與 clocked behavior；simulation scheduling 與 synthesis semantics 都必須符合該模型。"]
    ],
    exercises: [
      { level: "基礎", question: "四個 Boolean inputs 的完整真值表有幾列？若只有輸出為 1 的列要寫 canonical SOP，最多會有幾個 minterms？", solution: ["每個 input 有兩種值，四個 inputs 共有 2^4=16 種 combinations。", "最壞情況所有列輸出皆為 1，因此 canonical SOP 最多有 16 個 minterms。"] },
      { level: "基礎", question: "化簡 F=A+A·B，並以文字說明。", solution: ["使用 absorption law：A+A·B=A。", "當 A=1 時 F 已為 1；當 A=0 時 AB 也必為 0，因此 B 不會改變輸出。"] },
      { level: "基礎", question: "將 NOT(A+B·NOT C) 只用 NOT、AND、OR 展開，使最外層不再有括號反相。", solution: ["先用 De Morgan：NOT(A+B·NOT C)=NOT A · NOT(B·NOT C)。", "再展開第二項：NOT(B·NOT C)=NOT B+C，所以結果為 (NOT A)·((NOT B)+C)。"] },
      { level: "基礎", question: "寫出 XOR 的 canonical SOP。", solution: ["XOR 在 01 與 10 兩列為 1。", "因此 A XOR B=(NOT A)B+A(NOT B)。"] },
      { level: "核心", question: "F(A,B,C)=Σm(0,2,4,6)。化簡 F。", solution: ["四個 minterms 的 binary indices 都是偶數，因此最低位 C 都為 0。", "A、B 可任意變動而不影響輸出，所以 F=NOT C。"] },
      { level: "核心", question: "用 2-to-1 mux 表示 F(A,B)=A XOR B，選 A 為 S。D0、D1 應接什麼？", solution: ["A=0 時 F=B，所以 D0=B。", "A=1 時 F=NOT B，所以 D1=NOT B；代入 mux 方程可得 (NOT A)B+A(NOT B)。"] },
      { level: "核心", question: "3-to-8 decoder 的每條 output 對應什麼？如何做 F=Σm(1,3,6)？", solution: ["每條 output 對應三個 inputs 的一個 minterm，任一時刻理想上只有對應 code 的 output 有效。", "將 decoder 的 y1、y3、y6 經 OR 相連，即可在 minterm 1、3、6 時輸出 1。"] },
      { level: "核心", question: "full adder 輸入 A=1、B=0、Cin=1 時，Sum 與 Cout 為何？", solution: ["Sum=1 XOR 0 XOR 1=0。", "三個 inputs 中有兩個 1，因此 Cout=1；算術核對為 1+0+1=10₂。"] },
      { level: "核心", question: "8-bit ripple adder 每級 carry delay 為 70 ps，最後 sum XOR delay 為 40 ps。以 7 級 carry 傳播加最後 XOR 估計最長 delay。", solution: ["carry 從最低位穿過到最高位之前需要 7×70=490 ps。", "再加最高位 sum 的 40 ps，估計 critical-path delay=530 ps。"] },
      { level: "進階", question: "路徑 tclk-q(max)=90 ps、tcomb(max)=710 ps、tsetup=80 ps，沒有額外 uncertainty。最低 clock period 與 fmax 為何？", solution: ["Tmin=90+710+80=880 ps。", "fmax=1/(880×10^-12)≈1.136 GHz。"] },
      { level: "進階", question: "某最短路徑 tclk-q(min)=45 ps、tcomb(min)=15 ps、thold=75 ps。求 hold slack 並判斷。", solution: ["資料最早在 45+15=60 ps 抵達，hold slack=60-75=-15 ps。", "slack 為負，存在 15 ps hold violation；單純拉長 clock period 不會修正同一 edge 的最早抵達。"] },
      { level: "進階", question: "有 5 個 states 的 binary-encoded FSM 至少需要幾個 state bits？one-hot 又需要幾個？", solution: ["ceil(log2 5)=3，所以 binary encoding 至少需要 3 bits，可提供 8 個 codes。", "one-hot 每個 state 使用一個獨立 bit，因此需要 5 bits。"] },
      { level: "進階", question: "對 101 detector，從 S1 收到 0 為何不能回 S0？", solution: ["S1 表示已看見 suffix 1；再收到 0 後，最新兩個 bits 是 10。", "10 正是 pattern 101 的前兩位，因此必須進入 S10，保留可能在下一個 1 完成偵測的資訊。"] },
      { level: "挑戰", question: "為何不能用三個獨立兩級 synchronizers 傳送會同時改變的 3-bit binary counter？", solution: ["每個 bit 的解析時間與取樣 cycle 可能不同，接收端可能短暫組合出來源端從未存在的 code。", "可改用 handshake 保持整個 word 穩定，或以 Gray code 讓相鄰 count 只改一位，再搭配適當 CDC 結構。"] }
    ],
    glossary: [
      ["Digital abstraction", "把連續電氣訊號依合法範圍解讀為有限邏輯符號的介面。"],
      ["Noise margin", "合法輸出與接收端判定門檻之間可容忍雜訊的餘量。"],
      ["Propagation delay", "輸入改變到輸出達到對應穩定值所需時間。"],
      ["Minterm", "只在真值表某一列為 1、包含每個輸入一次的 AND term。"],
      ["Canonical SOP", "將所有輸出為 1 的 minterms 以 OR 相連的標準表示。"],
      ["Karnaugh map", "以 Gray-code adjacency 視覺化合併 implicants 的少變數化簡方法。"],
      ["Multiplexer", "依 select 從多個 data inputs 選一個送到輸出的組合模組。"],
      ["Decoder", "把 n-bit code 展開成最多 2^n 條 one-hot outputs 的模組。"],
      ["Full adder", "計算 A、B、Cin 的 Sum 與 Cout 的一位加法器。"],
      ["Critical path", "決定最低 clock period 或組合電路最壞延遲的最長 timing path。"],
      ["Setup time", "取樣 edge 前，目的 register 的 D 必須保持穩定的時間。"],
      ["Hold time", "取樣 edge 後，目的 register 的 D 仍必須保持穩定的時間。"],
      ["Clock-to-Q", "clock edge 到來源 register 的 Q 反映新狀態之間的延遲。"],
      ["Finite state machine", "以有限 states、inputs、outputs 與 transition function 描述循序行為的模型。"],
      ["Moore machine", "輸出只由 current state 決定的 FSM。"],
      ["Mealy machine", "輸出由 current state 與 current input 共同決定的 FSM。"],
      ["Metastability", "storage element 在違反取樣時間時可能暫時無法解析成穩定 0/1 的狀態。"],
      ["Clock-domain crossing", "訊號在非同步或不同 clock relationships 的 domains 之間傳遞。"],
      ["RTL", "描述 registers 之間資料轉移與組合運算的硬體抽象層次。"],
      ["Static timing analysis", "不依賴特定 simulation vectors，對 timing graph 的最長與最短 paths 檢查 constraints。"]
    ],
    sources: [
      { key: "S1", title: "MIT OpenCourseWare 6.004: Computation Structures, Digital Logic Sequence", url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c8/c8s1/", accessed: "2026-08-17", use: "digital abstraction、combinational/sequential logic、FSM、timing、adder 與設計取捨的公開課程基礎。" },
      { key: "S2", title: "UC Berkeley CS61C Course Notes: Synchronous Digital Systems", url: "https://notes.cs61c.org/content/sds-intro/", accessed: "2026-08-17", use: "同步數位系統、組合與 stateful circuits 的現行課程脈絡。" },
      { key: "S3", title: "UC Berkeley CS61C Course Notes: Boolean Algebra", url: "https://notes.cs61c.org/content/sds-combinational-logic/boolean-algebra/", accessed: "2026-08-17", use: "Boolean operators、真值表、等價與布林定律。" },
      { key: "S4", title: "UC Berkeley CS61C Course Notes: Canonical Form and Combinational Logic Design", url: "https://notes.cs61c.org/content/sds-combinational-logic/cl-design/", accessed: "2026-08-17", use: "canonical SOP、truth-table synthesis、mux、adder 與組合設計。" },
      { key: "S5", title: "UC Berkeley CS61C Course Notes: State and Timing Summary", url: "https://notes.cs61c.org/content/sds-state/summary/", accessed: "2026-08-17", use: "register timing、critical path、setup 與 hold constraints。" },
      { key: "S6", title: "UC Berkeley CS61C Course Notes: Finite State Machines", url: "https://notes.cs61c.org/content/sds-state/fsm/", accessed: "2026-08-17", use: "FSM 的 state、transition、output 與同步實作。" },
      { key: "S7", title: "IEEE 1800-2023: SystemVerilog Language Reference Manual", url: "https://standards.ieee.org/ieee/1800/7743/", accessed: "2026-08-17", use: "目前 active 的 SystemVerilog design、verification、assertion 與 testbench 標準。" },
      { key: "S8", title: "Intel Quartus Prime Pro Edition User Guide: Metastability Analysis", url: "https://www.intel.com/content/www/us/en/docs/programmable/683068/18-1/metastability-analysis.html", accessed: "2026-08-17", use: "asynchronous transfer、synchronizer chain、metastability 與 MTBF。" },
      { key: "S9", title: "Altera Timing Analyzer Cookbook", url: "https://docs.altera.com/r/docs/683081/current", accessed: "2026-08-17", use: "clock constraints、setup/hold analysis 與 timing verification 的官方實務。" }
    ]
  },
  {
    chapter: 4,
    title: "MARIE：從指令位元到完整狀態追蹤",
    english: "MARIE: From Instruction Bits to Complete State Traces",
    revised: "2026-08-18",
    readingTime: "約 180–220 分鐘",
    intro: "MARIE 是刻意簡化的 accumulator machine，目的不是模擬現代 CPU 的全部複雜度，而是讓一條指令的所有狀態變化都能被看見。16-bit instruction 如何切成 opcode 與 address、PC 如何推進、memory word 如何經 MAR 與 MBR 到達 AC、控制轉移如何改寫 PC，都可以用 register transfer notation 逐步驗證。本章以第 4 版 ISA 為準，從 datapath 與共同 fetch cycle 開始，建立 direct、indirect、branch、subroutine 與 assembler 的完整模型，再用可執行程式追蹤 machine code、register state 與 memory side effect。",
    outcomes: [
      "能畫出 MARIE 的 CPU、memory、I/O 與 bus 關係，並說明七個 registers 的寬度與責任。",
      "能把 16-bit instruction 切成 4-bit opcode 與 12-bit address，完成 assembly 與 machine word 的雙向轉換。",
      "能逐步寫出 fetch-decode-execute 的 register transfers，並分清 IR、MAR 與 MBR。",
      "能依第 4 版完整 instruction set 追蹤 AC、PC、memory 與 I/O 的變化。",
      "能正確使用 Skipcond 與 Jump 表達 if、loop，並說明 skip 與 branch 的差異。",
      "能追蹤 AddI、LoadI、StoreI、JumpI 的兩層 memory dereference。",
      "能解釋 JnS 如何把 return address 存在 memory，並以 JumpI 完成返回。",
      "能建立 symbol table，說明 two-pass assembler 如何解析 forward reference。",
      "能比較 hardwired 與 microprogrammed control，並辨認 MARIE 與 MIPS 顯露狀態的差異。"
    ],
    sections: [
      {
        title: "1. MARIE 是可完整觀察的 stored-program machine",
        paragraphs: [
          "MARIE 將 instruction 與 data 都放在同一個 word-addressed memory。PC 保存下一個 instruction 的 word address，CPU 依 PC 取出 16-bit word，再把高 4 bits 解讀為 operation、低 12 bits 解讀為 address 或 condition。相同 bits 是 instruction 還是 data，取決於它是否經由 PC 被 fetch，以及目前 operation 對它的解讀。",
          "這套模型只有一個主要算術狀態 AC。Load 把 memory operand 放進 AC，Add 以 AC 為隱含來源與目的，Store 再把 AC 寫回 memory。程式不必在每條 arithmetic instruction 中編出 destination register，因此 machine word 很短；代價是中間值頻繁經過 AC，平行保留 operands 的能力有限。",
          "MARIE 的簡化必須和現代 CPU 的實作分開。它沒有一般 register file、cache、pipeline、virtual memory 或 out-of-order machinery，但仍具備 stored program、instruction encoding、datapath、control、I/O 與 state transition 等核心觀念。學會逐步追蹤 MARIE 後，同一套證據方法可套到 MIPS，只是可見 registers 與資料路徑更多。"
        ],
        figure: {
          type: "hierarchy",
          title: "MARIE 的觀察邊界",
          items: [
            { label: "Assembly program", detail: "mnemonics、labels、DEC/HEX directives" },
            { label: "ISA", detail: "15 個第 4 版 instructions、16-bit encoding" },
            { label: "Architectural state", detail: "AC、PC、memory、input/output" },
            { label: "Datapath state", detail: "MAR、MBR、IR、InREG、OutREG" },
            { label: "Control", detail: "fetch states、opcode decode、control signals" }
          ],
          caption: "由上往下追蹤時，每一層都把同一個程式轉成更具體的 bits、register transfers 與 clocked state。"
        },
        sourceRefs: ["S1", "S2", "S3"]
      },
      {
        title: "2. 七個 registers、單一 bus 與 memory transaction",
        paragraphs: [
          "AC、MBR、IR 是 16 bits，能保存一個完整 data/instruction word；MAR 與 PC 是 12 bits，因為 12-bit address 可選 2^12=4096 個 words。第 4 版模型的 InREG 與 OutREG 為 8 bits，用來隔開外部裝置與 CPU。register width 不是裝飾資訊：把 16-bit IR 全部送進 12-bit MAR 時，只能使用 IR[11:0]。",
          "MAR 回答『哪一個 memory word』，MBR 回答『該 word 的內容是什麼或準備寫什麼』。memory read 可寫成 MBR←M[MAR]；memory write 可寫成 M[MAR]←MBR。IR 保存正在執行的 instruction，避免 PC 已移到下一個位置後失去目前 opcode。AC 保存 arithmetic operands/results，與 MAR、MBR 的位址／資料角色不同。",
          "共享 bus 在一個 transfer 中通常只能有一個 source 驅動，但可讓一個或多個合法 destinations 取樣。若 PC 與 AC 同時驅動 bus，資料會衝突；若 control 沒有開啟目的 register 的 load enable，bus 上即使有正確值也不會留下 state。datapath 圖必須搭配 control sequence，才能說明資料在什麼 clock edge 真正被保存。"
        ],
        figure: {
          type: "matrix",
          title: "MARIE register 責任表",
          columns: ["Register", "寬度", "保存內容", "典型更新"],
          rows: [
            ["AC", "16", "operand / ALU result", "Load、Add、Subt、Input、Clear"],
            ["MAR", "12", "memory word address", "MAR←PC 或 MAR←IR[11:0]"],
            ["MBR", "16", "memory read/write buffer", "MBR←M[MAR] 或 MBR←AC"],
            ["PC", "12", "next instruction address", "PC←PC+1、Jump、Skipcond"],
            ["IR", "16", "current instruction", "IR←MBR during fetch"],
            ["InREG", "8", "外部輸入", "input device update"],
            ["OutREG", "8", "外部輸出", "OutREG←AC low-order data"]
          ],
          caption: "位址 registers 為 12 bits，word registers 為 16 bits；每一步先辨認保存的是 address 還是 value。"
        },
        sourceRefs: ["S3", "S6"]
      },
      {
        title: "3. 16-bit instruction format 與 word addressing",
        paragraphs: [
          "每個 MARIE instruction 固定 16 bits：bits 15..12 是 opcode，bits 11..0 是 address/operand field。4-bit opcode 有 16 種 patterns；第 4 版完整 ISA 使用 0x0 到 0xE，0xF 保留。三個 hexadecimal digits 恰好表示 12-bit field，所以 assembly 與 machine word 的對照特別直接。",
          "例如 Load 3A5 的 opcode 是 0x1，machine word 因此是 0x13A5；反向解碼 0xB207，最高 hex digit B 表示 AddI，低三 digits 207 表示 pointer 所在 address。Input、Output、Halt、Clear 不需要一般 memory operand，低 12 bits 在第 4 版基本語意中不負責尋址，常以 000 填入。",
          "MARIE 是 word-addressed：相鄰 addresses 各保存一個 16-bit word，因此 sequential next PC 是 PC+1。4K words 等於 4096×16=65536 bits=8192 bytes 的內容容量，但 architectural address 仍是 0x000 到 0xFFF。這與 byte-addressed MIPS 的固定 4-byte instruction 通常使 PC+4 不同。"
        ],
        figure: {
          type: "bits",
          title: "MARIE 16-bit instruction field",
          totalBits: 16,
          items: [
            { label: "Opcode [15:12]", bits: 4, detail: "0x0–0xE 選擇第 4 版 operation" },
            { label: "Address / condition [11:0]", bits: 12, detail: "0x000–0xFFF word address，或 Skipcond condition" }
          ],
          caption: "hexadecimal machine word 的第一個 digit 是 opcode，後三個 digits 是 12-bit field。"
        },
        sourceRefs: ["S3", "S5", "S6"]
      },
      {
        title: "4. 共同 fetch cycle：先取得 instruction，再決定 execute path",
        paragraphs: [
          "所有 instructions 先執行共同 fetch。第一步 MAR←PC，把 next instruction address 放到 memory interface；第二步 MBR←M[MAR] 取得完整 word；第三步 IR←MBR 固定 current instruction；第四步 PC←PC+1，先預設 sequential successor。不同教材或 simulator 可能把可同時發生的 transfers 合併在同一 clock state，但 architectural result 必須一致。",
          "decode 檢查 IR[15:12]，並在需要 address 時把 IR[11:0] 送入 MAR。decode 本身通常只是 combinational control decision，不等於已取得 operand。例如 Load X 在 decode 後仍要 read M[X]；Clear 不需要 memory operand，可直接 AC←0；Jump X 只要以 X 覆寫 PC。",
          "追蹤 instruction 時應同時記錄『舊值、transfer、更新後值』。PC 在 fetch 後已指向下一個 word，因此 branch 未成立時自然繼續；Jump 或 JnS 則在 execute phase 覆寫這個預設值。若把 IR 與 PC 混為一談，便會錯把 current instruction address 當成 return address。"
        ],
        figure: {
          type: "flow",
          title: "MARIE fetch-decode-execute 狀態鏈",
          items: ["MAR←PC", "MBR←M[MAR]", "IR←MBR", "PC←PC+1", "Decode IR[15:12]", "Execute opcode semantics"],
          caption: "PC 的遞增屬於共同 fetch；execute 只在控制轉移需要時覆寫 next PC。"
        },
        sourceRefs: ["S3", "S4", "S6", "S9", "S10"]
      },
      {
        title: "5. Direct data movement、arithmetic 與 I/O",
        paragraphs: [
          "Load X、Store X、Add X、Subt X 都使用 direct addressing，effective address EA=X。Load 的 execute path 是 MAR←X、MBR←M[MAR]、AC←MBR；Store 則是 MAR←X、MBR←AC、M[MAR]←MBR。Add/Subt 先讀出 M[X]，再用 ALU 對 AC 與 MBR 運算並把結果寫回 AC。",
          "Input 把 InREG 的值送進 AC，Output 把 AC 的可輸出資料送到 OutREG，Halt 停止後續 instruction cycle，Clear 將 AC 歸零。這些 instructions 不需要一般 memory operand；即使 machine word 仍有低 12 bits，也不能把每個 bit field 都自動解讀成 address。",
          "MARIE 的 arithmetic 以 16-bit two's-complement bit pattern 保存。超過可表示範圍時低 16 bits 留在 AC，但基本 ISA 沒有一般 programmer-visible overflow flag；因此程式若需要偵測 overflow，不能假設 Skipcond 會替它完成。I/O 的外部字元或數值呈現也屬 simulator/interface convention，不能由 AC bits 自動推知型別。"
        ],
        figure: {
          type: "matrix",
          title: "第 4 版 MARIE 完整 opcode map",
          columns: ["Hex", "Instruction", "主要 architectural effect"],
          rows: [
            ["0", "JnS X", "M[X]←PC；PC←X+1"], ["1", "Load X", "AC←M[X]"],
            ["2", "Store X", "M[X]←AC"], ["3", "Add X", "AC←AC+M[X]"],
            ["4", "Subt X", "AC←AC−M[X]"], ["5", "Input", "AC←InREG"],
            ["6", "Output", "OutREG←AC"], ["7", "Halt", "停止 instruction cycle"],
            ["8", "Skipcond C", "條件成立時 PC←PC+1"], ["9", "Jump X", "PC←X"],
            ["A", "Clear", "AC←0"], ["B", "AddI X", "AC←AC+M[M[X]]"],
            ["C", "JumpI X", "PC←M[X]"], ["D", "LoadI X", "AC←M[M[X]]"],
            ["E", "StoreI X", "M[M[X]]←AC"]
          ],
          caption: "表格列的是 architectural effect；實體 datapath 仍可能需要多個 MAR/MBR microoperations 才完成。"
        },
        sourceRefs: ["S3", "S5"]
      },
      {
        title: "6. Skipcond 與 Jump：以 PC 表達 if 與 loop",
        paragraphs: [
          "Skipcond 不指定任意 target；它只在條件成立時把已經指向下一個 instruction 的 PC 再加 1，所以恰好略過一個 16-bit word。condition 放在 IR[11:10]：00 檢查 AC<0，01 檢查 AC=0，10 檢查 AC>0，常用 hexadecimal operands 分別寫成 000、400、800。",
          "if/else 的典型排列是先讓 AC 保存比較結果，再用 Skipcond 跳過緊接著的 Jump。以 X<Y 為例，Load X、Subt Y 後 AC=X−Y；Skipcond 000 為真時略過 Jump Else，順向進入 then block。then block 結尾仍需 Jump End，否則會落入 else block。",
          "loop 由 backward Jump 形成。每次 iteration 都必須在 AC 中重建 condition，因為 loop body 可能改變 AC。分析時不要只畫箭頭；要列出每次到達 Skipcond 時的 AC、fetch 後 PC、條件是否成立，以及成立後實際略過哪一個 word。"
        ],
        figure: {
          type: "matrix",
          title: "Skipcond condition field",
          columns: ["Assembly", "IR[11:10]", "判斷", "true 時效果"],
          rows: [
            ["Skipcond 000", "00", "AC<0", "略過下一個 word"],
            ["Skipcond 400", "01", "AC=0", "略過下一個 word"],
            ["Skipcond 800", "10", "AC>0", "略過下一個 word"],
            ["11", "11", "第 4 版未定義", "不可依賴"]
          ],
          caption: "C 不是 branch target。Skipcond 只決定是否再增加一次 PC，通常與下一條 Jump 配對。"
        },
        sourceRefs: ["S3", "S5", "S7"]
      },
      {
        title: "7. Indirect addressing：memory 中的 value 也可以是 address",
        paragraphs: [
          "direct addressing 的 EA=X；indirect addressing 的 EA=M[X] 低 12 bits。LoadI X 要先讀 pointer slot X，再以其中的 address 讀真正 operand：MAR←X、MBR←M[MAR]、MAR←MBR[11:0]、MBR←M[MAR]、AC←MBR。兩次 memory reads 的角色不同，第一次取得 address，第二次取得 data。",
          "AddI X 使用相同 dereference 再把 operand 加到 AC；StoreI X 把 AC 寫到 M[M[X]]；JumpI X 則把 M[X] 載入 PC。若 M[X] 的 pointer 錯誤，direct slot 本身看起來可能完全正常，真正被讀寫的 distant location 才會出錯。追蹤時要明確寫出 X、M[X]、M[M[X]] 三個量。",
          "indirect addressing 讓 pointer、array traversal 與 subroutine return 成為可能。pointer 每前進一個 MARIE word，address 加 1，而不是加 2 bytes。它也增加 memory traffic：direct Load 通常需要一次 operand read，LoadI 需要 pointer read 加 data read，因此相同 architectural result 可能有不同執行成本。"
        ],
        figure: {
          type: "flow",
          title: "LoadI X 的兩層解參照",
          items: ["instruction field X", "read M[X] = pointer P", "EA←P[11:0]", "read M[P] = data", "AC←data"],
          caption: "第一個 memory word 保存 address，第二個 memory word 才保存 operand；把 M[X] 直接當 data 會少解參照一層。"
        },
        sourceRefs: ["S3", "S5"]
      },
      {
        title: "8. JnS 與 JumpI：把 return address 存在程式旁的 memory",
        paragraphs: [
          "執行 JnS X 時，共同 fetch 已把 PC 更新成 call 之後的 address。execute 將這個 PC 保存到 M[X]，再令 PC=X+1。因此 label X 所在 word 不是 subroutine 的第一條 executable instruction，而是 return-address slot；subroutine body 從下一個 word開始。",
          "return 使用 JumpI X，令 PC←M[X]，回到 JnS 先前保存的 successor。這個配對沒有專用 link register 或 stack。若 subroutine 內再次 JnS 到同一個 return slot，原 return address 會被覆蓋，所以一般 recursion 與巢狀呼叫需要額外軟體機制保存 return addresses。",
          "參數與結果通常經 AC 或約定的 memory locations 傳遞。這是 calling convention 的雛形：ISA 只定義 JnS/JumpI 的 state effect，程式還要共同約定 input 在哪裡、哪些 locations 會被修改、result 留在哪裡。MIPS 的 jal 將 return address 放進 $ra，兩者功能相似但 architectural state 不同。"
        ],
        figure: {
          type: "flow",
          title: "JnS X / JumpI X 的呼叫迴路",
          items: ["fetch JnS：PC=return", "M[X]←PC", "PC←X+1", "執行 subroutine body", "JumpI X：PC←M[X]", "回到 caller"],
          caption: "X 是 return-address slot，X+1 才是 subroutine entry；同一 slot 同時承擔 linkage state。"
        },
        sourceRefs: ["S3", "S5", "S8"]
      },
      {
        title: "9. Assembler：從 labels 與 directives 產生 memory image",
        paragraphs: [
          "assembly source 的 mnemonic 是人可讀的 opcode 名稱，label 是 symbolic address。DEC 與 HEX 不是 CPU instructions，而是要求 assembler 把常數 word 放入 memory；ORG 設定 location counter。每個 instruction 或 data directive 通常占一個 word，所以 assembler 能依序計算每個 label 的 12-bit address。",
          "forward reference 使 single pass 不夠方便：Jump Done 出現時，Done 可能尚未被看見。two-pass assembler 第一遍更新 location counter 並建立 symbol table；第二遍查 opcode table 與 symbol table，把每一列輸出成 16-bit word。若 label 重複、symbol 未定義或 address 超出 0xFFF，assembler 應報錯而不是猜測。",
          "例如程式從 ORG 100 開始，四條 instructions 位於 100..103，接著 X、Y、Z labels 便位於 104、105、106。Load X 編成 1104，Add Y 編成 3105，Store Z 編成 2106，Halt 編成 7000。symbol table 是連接 source name 與 machine address 的可驗證證據。"
        ],
        figure: {
          type: "flow",
          title: "Two-pass assembly pipeline",
          items: ["Source lines", "Pass 1: location counter", "Symbol table", "Pass 2: opcode + address", "16-bit memory image", "listing / diagnostics"],
          caption: "第一遍回答 label 在哪裡，第二遍才把 mnemonic 與 symbol 組成 machine word。"
        },
        sourceRefs: ["S1", "S5", "S6"]
      },
      {
        title: "10. Clocked control、hardwired control、microprogram 與 interrupts",
        paragraphs: [
          "control unit 讀取 current control state、IR opcode 與必要 condition，產生 bus source、register load、memory read/write 與 ALU operation 等 signals。clock edge 使 datapath registers 與 controller state 一起前進。RTN 描述『必須發生什麼 transfer』，control state machine 描述『在哪一個 clock step 啟用哪些 signals』。",
          "hardwired control 直接以 finite-state logic 產生 signals，通常反應快，但修改 instruction sequence 需要更動 logic。microprogrammed control 把每個 control word 與 next-address rule 放在 control memory，較容易表達複雜 instructions，但要付出 microinstruction fetch 與 control-store 成本。兩者都必須實現相同 ISA-visible result。",
          "interrupt 讓外部事件在 instruction boundaries 改變正常控制流。完整機制至少要保存 resume state、辨認 handler entry、處理事件並恢復；basic MARIE program trace 通常先假設沒有 pending interrupt。這不是把 interrupt 當作不存在，而是明確固定分析條件；若加入 interrupt，必須把額外 state transitions 放進 instruction cycle。"
        ],
        figure: {
          type: "hierarchy",
          title: "控制單元把 ISA 語意展開成 clock steps",
          items: [
            { label: "ISA instruction", detail: "例如 AC←AC+M[X]" },
            { label: "RTN sequence", detail: "MAR←X；MBR←M[MAR]；AC←AC+MBR" },
            { label: "Control states", detail: "fetch、decode、operand read、ALU write" },
            { label: "Control signals", detail: "bus select、load enable、read/write、ALU op" },
            { label: "Clocked result", detail: "registers 與 memory 更新" }
          ],
          caption: "hardwired 與 microprogrammed control 的內部方法不同，最終都要產生正確的 transfer sequence。"
        },
        sourceRefs: ["S1", "S4", "S6"]
      },
      {
        title: "11. 第 4 版 MARIE、現行 MARIE.js 與 MIPS 的邊界",
        paragraphs: [
          "本章 machine words 依第 4 版：opcode A 是 Clear，A000 使 AC←0。現行 MARIE.js 自 v2.1 起把 opcode A 一般化為 LoadImmi X，並把 Clear 當成 LoadImmi 0 的 alias；它還接受 Skipcond 0C00 作 nonzero extension。這些 simulator extensions 不能反向寫進第 4 版 ISA 題目的答案。",
          "MARIE 與 MIPS 都以 PC、instruction bits、datapath 與 memory operations 執行 stored program，但 MIPS 對 programmers 顯露多個 general-purpose registers、三個 register operands、byte addressing 與固定 32-bit instruction。MARIE 的 PC+1 是下一個 16-bit word；MIPS sequential PC 通常+4 是下一個 4-byte instruction。",
          "比較兩者時，應先固定同一層次。Load X 與 lw 都造成 memory-to-register transfer，但前者 destination 隱含為 AC 且 address 直接在 12-bit field，後者 destination/base registers 與 signed offset 都在 instruction 中。MARIE 的價值是把 state chain縮短到可手算；MIPS 則讓相同原理接近實際 RISC datapath。"
        ],
        figure: {
          type: "matrix",
          title: "MARIE 與 MIPS 的同層比較",
          columns: ["面向", "MARIE 第 4 版", "MIPS32 基礎模型"],
          rows: [
            ["instruction", "16 bits；4-bit opcode+12-bit field", "32 bits；依 format 分欄"],
            ["arithmetic state", "AC 為隱含 operand/result", "general-purpose register file"],
            ["addressing", "word-addressed；PC+1", "byte-addressed；sequential PC+4"],
            ["load", "Load X：AC←M[X]", "lw rt,offset(base)"],
            ["call linkage", "JnS 將 return address 寫入 M[X]", "jal 通常寫入 $ra"],
            ["分析重點", "完整 RTN 與 control steps", "fields、datapath、pipeline 與 hazards"]
          ],
          caption: "ISA 顯露的 state 不同，但都可用 fetch、decode、operand、execute、state update 的證據鏈分析。"
        },
        sourceRefs: ["S7", "S9"]
      }
    ],
    workedExamples: [
      {
        title: "例題一：MARIE instruction 的編碼與反解",
        prompt: "將 Load 3A5 編成 machine word，並反向解碼 B207。",
        steps: [
          "Load 的第 4 版 hexadecimal opcode 是 1，形成高 4 bits 0001。",
          "address 3A5 已是三個 hex digits，等於 12-bit pattern 0011 1010 0101。",
          "串接 opcode 與 address 得 0001 0011 1010 0101，即 0x13A5。",
          "反解 0xB207 時先取最高 digit B，opcode B 對應 AddI。",
          "低三 digits 是 0x207，表示 pointer slot 位於 word address 207。",
          "architectural effect 是 AC←AC+M[M[0x207]]，不能少掉其中一層 memory dereference。"
        ],
        result: "Load 3A5→0x13A5；0xB207→AddI 207。固定欄位使 hex digit 可直接對應 opcode/address。"
      },
      {
        title: "例題二：逐步追蹤 fetch 與 Load execute",
        prompt: "初始 PC=100、AC=0000，M[100]=1300，M[300]=FFFB。追蹤一條 instruction 後的 state。",
        steps: [
          "MAR←PC，使 MAR=100；此時 PC 仍是 100。",
          "MBR←M[MAR]，讀得 MBR=1300。",
          "IR←MBR 得 IR=1300，PC←PC+1 得 PC=101。",
          "decode IR[15:12]=1 為 Load，IR[11:0]=300 為 X。",
          "execute：MAR←300，MBR←M[300]=FFFB。",
          "AC←MBR，使 AC=FFFB；以 16-bit two's complement 解讀為 −5。",
          "memory 沒有被寫入，next instruction address 保持 PC=101。"
        ],
        result: "完成後 IR=1300、PC=101、AC=FFFB；fetch 與 operand read 是兩次目的不同的 memory access。"
      },
      {
        title: "例題三：由 assembly、machine words 到 X+Y",
        prompt: "程式從 100 開始：Load X；Add Y；Store Z；Halt；X=7、Y=−3、Z=0。建立 addresses、編碼並追蹤結果。",
        steps: [
          "四條 instructions 占 100..103，因此 X=104、Y=105、Z=106。",
          "machine words 依序為 1104、3105、2106、7000；data words 為 0007、FFFD、0000。",
          "Load X 後 AC=M[104]=0007，PC 指向 101。",
          "Add Y 後 AC=0007+FFFD=0004；低 16 bits 表示十進位 4。",
          "Store Z 將 M[106] 由 0000 更新為 0004，AC 仍為 0004。",
          "Halt 終止 instruction cycle，Z 的最終值為 4。"
        ],
        result: "symbol placement、machine encoding 與 state trace 三者一致：7+(−3)=4，M[106]=0004。"
      },
      {
        title: "例題四：以 Skipcond 計算絕對值",
        prompt: "追蹤 Input=-6 的程式：Input；Store X；Skipcond 000；Jump Done；Clear；Subt X；Done, Output；Halt。",
        steps: [
          "Input 後 AC=FFFA，也就是 −6；Store X 令 M[X]=FFFA。",
          "fetch Skipcond 後 PC 已指向緊接的 Jump Done。",
          "AC<0 成立，因此 Skipcond 再令 PC←PC+1，略過 Jump Done。",
          "Clear 令 AC=0。",
          "Subt X 計算 0−(−6)=6，使 AC=0006。",
          "Output 將 6 送到 OutREG，Halt 結束。",
          "若 input 非負，condition 不成立，Jump Done 會略過 Clear/Subt，直接輸出原值。"
        ],
        result: "Skipcond 本身只略過下一條 Jump；負數路徑執行 0−X，非負路徑直接前往 Done。"
      },
      {
        title: "例題五：以 LoadI/AddI 走訪三個 array words",
        prompt: "Ptr 初值為 120，M[120..122] 分別為 4、−1、6。每次 AddI Ptr 後把 Ptr 加 1，共執行三次，求 Sum 與 memory reads。",
        steps: [
          "初始化 Sum=0、Ptr=120、Ctr=3。第一次 AddI 先讀 M[Ptr]=120，再讀 M[120]=4，Sum=4。",
          "將 Ptr 更新為 121，Ctr 更新為 2；Skipcond 400 不成立，回到 loop。",
          "第二次 AddI 讀 M[121]=−1，Sum=4+(−1)=3。",
          "Ptr 更新為 122、Ctr=1，繼續 loop。",
          "第三次 AddI 讀 M[122]=6，Sum=3+6=9。",
          "Ctr 降為 0，Skipcond 400 略過 backward Jump，離開 loop。",
          "三次 AddI 各有 pointer read 與 operand read，因此僅 indirect operands 就產生 6 次 memory reads。"
        ],
        result: "最終 Sum=9、Ptr=123、Ctr=0；每個 AddI 的證據鏈都是 X→M[X]→M[M[X]]。"
      },
      {
        title: "例題六：用 JnS/JumpI 呼叫 Double",
        prompt: "caller 在 102 執行 JnS Double，Double label 位於 110，return slot 初值 0000；body 自 111 開始，最後 JumpI Double。追蹤 call 與 return。",
        steps: [
          "fetch address 102 的 JnS 後，PC 已由 102 增為 103，這就是 return address。",
          "execute JnS：M[110]←103，把 return address 寫入 Double label 所在 word。",
          "接著 PC←110+1=111，開始執行 subroutine body。",
          "body 可 Load Arg、Add Arg、Store Result，把 input 加倍；此處假設 result 已寫好。",
          "fetch JumpI Double 後，JumpI 讀 M[110]=103。",
          "PC←103，下一次 fetch 回到 caller 的 JnS 後一條 instruction。",
          "若在返回前再次用同一 slot M[110] 儲存其他 return address，原 caller linkage 就會遺失。"
        ],
        result: "call 後 M[110]=103、PC=111；return 後 PC=103。MARIE 以 memory slot 保存 linkage。"
      }
    ],
    misconceptions: [
      ["MAR、MBR 都和 memory 有關，所以可以互換。", "MAR 保存 12-bit address，MBR 保存 16-bit data/instruction word；角色與寬度都不同。"],
      ["PC 保存目前正在執行的 instruction。", "IR 保存 current instruction；fetch 後 PC 通常已指向 sequential next instruction。"],
      ["Skipcond C 的 C 是 branch target。", "C 編碼 negative/zero/positive condition；true 時只略過緊接的一個 word。"],
      ["LoadI X 就是把 M[X] 放進 AC。", "那是 Load X；LoadI 要再把 M[X] 當 address，結果是 AC←M[M[X]]。"],
      ["JnS X 直接跳到 X 執行。", "X 是 return-address slot；JnS 將 PC 存入 M[X]，再跳到 X+1。"],
      ["DEC、HEX、ORG 都是 CPU 會執行的 instructions。", "它們是 assembler directives，用來配置 location 或 data，不會被 opcode decoder 執行。"],
      ["MARIE 的 PC+1 和 MIPS 的 PC+4 矛盾。", "MARIE 以 word 定址，MIPS 基礎模型以 byte 定址；兩者都前進一個固定長度 instruction。"],
      ["MARIE.js 能接受的語法一定就是第 4 版 ISA。", "現行 simulator 有 LoadImmi 與額外 Skipcond condition；本章的編碼答案以第 4 版語意為準。"]
    ],
    exercises: [
      { level: "基礎", question: "12-bit MAR 最多可指定多少個 memory words？若每 word 16 bits，內容容量是多少 bytes？", solution: ["2^12=4096 個 word addresses。", "4096×16 bits=65536 bits=8192 bytes；address unit 仍是 word。"] },
      { level: "基礎", question: "IR=0x43A5 時，opcode、instruction 與 address 分別為何？", solution: ["高 4 bits 是 hex 4，對應 Subt。", "低 12 bits 是 0x3A5，因此解碼為 Subt 3A5。"] },
      { level: "基礎", question: "將 Store 2F0 與 Halt 編成 16-bit hexadecimal machine words。", solution: ["Store opcode=2，串接 address 2F0 得 22F0。", "Halt opcode=7 且不使用一般 address，慣例填 000，得 7000。"] },
      { level: "基礎", question: "說明 MAR←PC 與 MBR←M[MAR] 各自搬移的是 address 還是 word。", solution: ["MAR←PC 搬移 12-bit instruction address。", "MBR←M[MAR] 以該 address 讀取一個 16-bit memory word。"] },
      { level: "核心", question: "PC=2A0、M[2A0]=9105。fetch 完成後 IR、PC 為何？execute 後 PC 為何？", solution: ["fetch 後 IR=9105，PC 先變成 2A1。", "opcode 9 是 Jump，execute 以 address field 105 覆寫 PC，所以最終 PC=105。"] },
      { level: "核心", question: "AC=0009、M[080]=FFFC。執行 Subt 080 後 AC 為何？", solution: ["FFFC 是 16-bit two's complement 的 −4。", "AC=9−(−4)=13，hex 為 000D。"] },
      { level: "核心", question: "AC=0 時執行 Skipcond 400。若 fetch 後 PC=205，execute 後 PC 為何？哪個 word 被略過？", solution: ["condition AC=0 成立，因此 PC 再加 1 成為 206。", "address 205 的 instruction 被略過，下一次 fetch 從 206 開始。"] },
      { level: "核心", question: "M[050]=2C0、M[2C0]=0017。Load 050 與 LoadI 050 各使 AC 得到什麼？", solution: ["Load 050 直接讀 M[050]，所以 AC=02C0。", "LoadI 050 以 M[050]=2C0 為 effective address，再讀 M[2C0]，所以 AC=0017。"] },
      { level: "核心", question: "AC=0005、M[060]=300、M[300]=0007。AddI 060 後 AC 為何？需要幾次 operand-related memory reads？", solution: ["先讀 pointer M[060]=300，再讀 operand M[300]=7，AC=5+7=12=000C。", "不含 instruction fetch，indirect operand path 需要 2 次 memory reads。"] },
      { level: "進階", question: "caller 在 address 180 執行 JnS 250。fetch 與 call 完成後，M[250]、PC 各為何？", solution: ["fetch 後 PC=181，所以 JnS 保存 M[250]=181。", "subroutine entry 是 X+1，因此 PC=251。"] },
      { level: "進階", question: "從 ORG 100 開始依序有 Load A、Jump Done、A DEC 5、Done Halt。建立 symbol table 與 machine words。", solution: ["addresses 為 Load=100、Jump=101、A=102、Done=103，所以 symbols A→102、Done→103。", "machine/data words 為 1102、9103、0005、7000。"] },
      { level: "進階", question: "為何 Store X 可改變 memory 卻不必改變 AC？列出其 RTN。", solution: ["Store 的 source 是 AC，copy 不會清除來源 register。", "RTN 為 MAR←X、MBR←AC、M[MAR]←MBR；完成後 AC 保持原值。"] },
      { level: "進階", question: "某 loop 在 Ctr 從 3 每次減 1 後執行 Skipcond 400、Jump Loop。Jump Loop 會執行幾次？", solution: ["Ctr 依序成為 2、1、0。前兩次不為零，因此 Jump Loop 執行 2 次。", "第三次 condition 成立，Skipcond 略過 Jump，離開 loop。loop body 總共執行 3 iterations。"] },
      { level: "挑戰", question: "為何同一個 return slot 無法直接支援 recursive JnS？", solution: ["每次 JnS 都把新的 return address 寫入 M[X]，下一層呼叫會覆蓋上一層 linkage。", "recursive convention 必須把每一層 return address 移到不同 storage，例如軟體管理的 stack，返回前再恢復。"] },
      { level: "挑戰", question: "現行 MARIE.js 的 LoadImmi 2A5 編成 A2A5。以第 4 版 ISA 解讀同一 word 時應如何處理？", solution: ["第 4 版把 opcode A 定義為 Clear，低 12 bits 不形成一般 immediate operand。", "因此第 4 版答案應視為 Clear，而不是載入 0x2A5；跨 simulator 比較前必須先固定 ISA version。"] }
    ],
    glossary: [
      ["Accumulator machine", "以單一主要累加器作為 arithmetic 隱含來源與目的的 ISA 模型。"],
      ["AC", "16-bit accumulator，保存 MARIE 的主要 operand 與 ALU result。"],
      ["MAR", "12-bit Memory Address Register，指定下一次 memory transaction 的 word address。"],
      ["MBR", "16-bit Memory Buffer Register，保存讀出的 word 或準備寫入的 word。"],
      ["PC", "12-bit Program Counter，保存下一個 instruction word 的 address。"],
      ["IR", "16-bit Instruction Register，保存 current instruction 供 decode/execute 使用。"],
      ["Word addressing", "每個 address 選取一個完整 word；MARIE sequential instruction address 因此加 1。"],
      ["Opcode", "instruction 中選擇 operation semantics 的欄位。"],
      ["Register transfer notation", "以 Rdest←expression 描述 clocked data movement 與 state update 的記號。"],
      ["Microoperation", "一個 control step 中可完成的基本 register、ALU 或 memory operation。"],
      ["Fetch cycle", "依 PC 取得 instruction、寫入 IR 並建立 sequential next PC 的共同階段。"],
      ["Direct addressing", "instruction field X 本身就是 effective address，EA=X。"],
      ["Indirect addressing", "先讀 M[X] 取得 effective address，EA=M[X]。"],
      ["Skipcond", "依 AC sign/zero condition 決定是否略過下一個 instruction word。"],
      ["JnS", "把 fetch 後 PC 存入 M[X] 並跳到 X+1 的 MARIE call instruction。"],
      ["JumpI", "以 M[X] 更新 PC 的 indirect control transfer，可配合 JnS 返回。"],
      ["Assembler directive", "控制 address/data 配置但不由 CPU opcode decoder 執行的 ORG、DEC、HEX 等命令。"],
      ["Symbol table", "assembler 建立的 label 到 numeric address 對照。"],
      ["Hardwired control", "以固定 combinational/sequential logic 直接產生 control signals。"],
      ["Microprogrammed control", "由 control memory 中的 microinstructions 產生 datapath signals。"],
      ["Architectural state", "ISA 程式可觀察、會影響後續行為的 registers、memory 與 I/O state。"]
    ],
    sources: [
      { key: "S1", title: "Penn State CMPSC 312: Computer Organization and Architecture", url: "https://h3turing.vmhost.psu.edu/cmpsc312/", accessed: "2026-08-18", use: "作者 Linda Null 公開的第 4 章課程投影片、MARIE simulator、datapath simulator 與 guide 資源入口。" },
      { key: "S2", title: "Linda Null: The Essentials of Computer Organization and Architecture, Fourth Edition", url: "https://h3turing.vmhost.psu.edu/~null/", accessed: "2026-08-18", use: "作者、第四版與 MARIE simulator 的公開書目脈絡。" },
      { key: "S3", title: "Brooklyn College CISC 3310: MARIE Registers", url: "https://www.sci.brooklyn.cuny.edu/~briskman/cisc/3310/lecture_notes/topic_06/04.html", accessed: "2026-08-18", use: "MARIE registers 的寬度、功能與 fetch-decode-execute 中的角色。" },
      { key: "S4", title: "Gordon College CS311: CPU Control, Hardwired Control and Microprogramming", url: "https://www.cs.gordon.edu/courses/cs311/lectures-2003/control.html", accessed: "2026-08-18", use: "MARIE control state machine、control word、hardwired control 與 microprogrammed control。" },
      { key: "S5", title: "University of Northern Iowa: MARIE Assembly Language Supplement", url: "https://www.cs.uni.edu/~fienup/cs1410s14/lectures/Supplement_MARE_AL.pdf", accessed: "2026-08-18", use: "第 4 版完整 instruction summary、Skipcond、subroutine、if/loop assembly patterns。" },
      { key: "S6", title: "Gordon College CS311: The Architecture of a Simple Computer", url: "https://www.math-cs.gordon.edu/courses/cs311/lectures-2003/simple_computer.pdf", accessed: "2026-08-18", use: "register widths、word-addressed memory、fetch-decode-execute 與 register-transfer semantics。" },
      { key: "S7", title: "Brooklyn College CISC 3310: MARIE Skipcond Instruction", url: "https://www.sci.brooklyn.cuny.edu/~briskman/cisc/3310/lecture_notes/topic_06/09.html", accessed: "2026-08-18", use: "IR condition bits 與 Skipcond 的 negative、zero、positive control behavior。" },
      { key: "S8", title: "MARIE.js Wiki: Subroutines", url: "https://github.com/MARIE-js/MARIE.js/wiki/Subroutines", accessed: "2026-08-18", use: "JnS 與 JumpI 的 call/return 組合及 simulator behavior。" },
      { key: "S9", title: "MARIE.js Releases", url: "https://github.com/MARIE-js/MARIE.js/releases", accessed: "2026-08-18", use: "現行 simulator 的 datapath visualization 與 v2.1 opcode A、Skipcond extensions，供版本相容性註記。" },
      { key: "S10", title: "University of Northern Iowa: The Fetch-Decode-Execute Cycle", url: "https://www.cs.uni.edu/~schafer/cohort26/FCCS/lessons/week2/topic2e/t2e_r2_fde.html", accessed: "2026-08-18", use: "以公開教材核對 fetch、decode、execute、register 與 ALU data movement 的通用模型。" }
    ]
  },
  {
    chapter: 5,
    title: "指令集架構：編碼、定址與管線化執行",
    english: "Instruction Set Architecture: Encoding, Addressing, and Pipelined Execution",
    revised: "2026-08-19",
    readingTime: "約 200–240 分鐘",
    intro: "指令集架構（ISA）是 machine code 與處理器共同遵守的二進位合約。每一個 opcode、register field、immediate、位址計算與控制轉移規則，都必須精確到單一 bit；同一份合約卻能由單週期、多週期、pipeline 或 out-of-order 處理器實作。本章先以 operand 數量與 instruction format 建立設計空間，再以經典 MIPS32 子集完成 assembly、machine word、effective address、branch 與 procedure call 的雙向追蹤。最後把相同 instructions 放入五階段 pipeline，分清 instruction latency、throughput、structural/data/control hazard，以及 forwarding、stall 與 flush 各自解決的問題，並用 RISC-V、A64 與 x86-64 對照哪些特性屬於 RISC 慣例、哪些才是特定 ISA 的規則。",
    outcomes: [
      "能把 ISA 與 microarchitecture 分開，列出 ISA 對 instruction、state、memory 與 exception 的承諾。",
      "能比較 zero-address、one-address、two-address、three-address 與 load-store operand models。",
      "能依 bit position 編解碼 MIPS R、I、J formats，並檢查 register number、immediate 與 reserved fields。",
      "能判斷 MIPS immediate 應做 sign extension 或 zero extension，並正確處理 32-bit constants。",
      "能計算 register、immediate、base-plus-offset、PC-relative 與 pseudo-direct addressing 的 effective value/target。",
      "能追蹤 load/store 的 byte address、alignment 與 endianness，不把 instruction field order 和 byte order 混為一談。",
      "能以 calling convention 追蹤 argument、return value、return address、caller-saved、callee-saved 與 stack frame。",
      "能計算理想 pipeline cycles、clock period、speedup，並畫出含 forwarding、stall 與 flush 的 timeline。",
      "能比較 MIPS、RISC-V、A64 與 x86-64 的 encoding 選擇，不把 RISC/CISC 名稱當成效能結論。"
    ],
    sections: [
      {
        title: "1. ISA 是可執行檔與處理器之間的精確合約",
        paragraphs: [
          "ISA 規定 programmer-visible state 與每條 instruction 對 state 的效果。這通常包括 general-purpose registers、PC、資料型別、instruction encodings、address space、memory access、control transfer、privilege 與 exception。binary 中的 32 bits 只有在指定 ISA 與版本下才有確定語意；換一套 encoding，同一 bit pattern 可能變成另一條 instruction，也可能是 illegal instruction。",
          "Microarchitecture 決定合約在晶片內怎麼完成。相同 MIPS machine code 可以由簡單 in-order core 或較深 pipeline 執行；cache 大小、forwarding network、branch predictor 與 execution units 會改變時間與能量，但正常完成時的 architectural state 必須相同。ISA compatibility 因而回答『能否正確執行』，benchmark 才回答『執行多快』。",
          "assembly language 是 machine encoding 的可讀表示，但一行 assembly 不一定恰好對應一條 hardware instruction。assembler directive 只配置資料或位置；pseudo-instruction 可能展開成一條或多條真正 instructions。分析 machine code 時要依 ISA manual 與 assembler mode，不能只依 mnemonic 的外觀推測 instruction count。"
        ],
        figure: {
          type: "hierarchy",
          title: "從程式語意到硬體實作的責任邊界",
          items: [
            { label: "Source program", detail: "型別、控制流程、函式與資料結構" },
            { label: "Compiler / Assembler", detail: "instruction selection、register allocation、symbols、relocation" },
            { label: "ISA contract", detail: "encodings、registers、addresses、exceptions、observable state" },
            { label: "Microarchitecture", detail: "datapath、control、pipeline、prediction、cache" },
            { label: "Circuit", detail: "timing、wires、gates、storage elements" }
          ],
          caption: "machine code 直接依賴 ISA；pipeline 深度與 cache 組織位於合約之下，可在維持 observable behavior 時改變。"
        },
        sourceRefs: ["S1", "S2", "S7"]
      },
      {
        title: "2. Operand model 決定 instruction 必須說出多少資訊",
        paragraphs: [
          "一個 expression Z=A+B 可以由不同 operand models 表示。stack machine 的 arithmetic 使用 stack top，add 不需顯式 operands；accumulator machine 隱含 AC，只需指出 memory operand；two-address machine 讓其中一個來源兼作 destination；three-address machine 明確指出兩個 sources 與一個 destination。欄位越多，單條 instruction 能直述的資訊越多，但 encoding space 與 instruction width 也受到壓力。",
          "register-memory ISA 允許某些 arithmetic instruction 直接讀 memory operand；load-store ISA 則規定 arithmetic 只碰 registers，memory 只能由 load/store 存取。MIPS、RV32I 與 A64 的整數核心都採 load-store 風格：先把資料載入 register，運算後再 store。這增加明確的 data-movement instructions，卻使 ALU datapath 與 pipeline stage 的角色較規則。",
          "instruction 數少不必然較快。stack expression 可能使用較短 encodings，卻頻繁存取 stack；three-address code 可能需要較多 encoding bits，卻能把中間值留在 registers。真正成本要結合 dynamic instruction count、每類 instruction 的 CPI、memory traffic 與 clock period，而不是只數 assembly 行數。"
        ],
        figure: {
          type: "matrix",
          title: "同一個 Z=A+B 的 operand 表達",
          columns: ["模型", "代表序列", "隱含 state", "主要取捨"],
          rows: [
            ["Zero-address stack", "push A; push B; add; pop Z", "stack top", "短 arithmetic encoding，資料移動較多"],
            ["One-address accumulator", "load A; add B; store Z", "AC", "格式簡單，中間值集中於 AC"],
            ["Two-address", "move Z,A; add Z,B", "destination 兼 source", "少一個 operand field，可能需先 copy"],
            ["Three-address", "add Z,A,B", "無", "資料流明確，需要多個 register fields"],
            ["MIPS load-store", "lw; lw; add; sw", "register file", "memory 與 ALU instructions 分離"]
          ],
          caption: "operand count 描述 instruction 明寫幾個位置；它與實際 memory accesses、instruction count 必須分開計算。"
        },
        sourceRefs: ["S1", "S8", "S9"]
      },
      {
        title: "3. Fixed-length encoding：MIPS R、I、J formats",
        paragraphs: [
          "經典 MIPS32 CPU instruction 是一個 aligned 32-bit word。三種基本 formats 都把 6-bit primary opcode 放在 bits 31..26。R format 另含 rs、rt、rd、shamt 與 funct；I format 含 rs、rt 與 16-bit immediate；J format 把其餘 26 bits 作為 instr_index。32 個 general-purpose registers 需要 5-bit index，因為 2^5=32。",
          "R format 的 primary opcode 常為 SPECIAL=0，真正 operation 由 funct 再區分。例如 add 的 funct=0x20，sll 的 funct=0x00；固定 shift 使用 shamt，普通 add 的 shamt 必須為 0。I format 的 rt 角色依 instruction 改變：addi/lw 的 rt 是 destination，sw/beq 的 rt 是 source。欄位名稱不是永遠等於 data-flow 方向。",
          "fixed length 讓 next sequential PC 通常是 PC+4，也讓 fetch boundary 與 major decode 規則整齊；代價是常數與 target 必須塞入有限欄位。A64 同樣使用 32-bit fixed-length instructions；RV32I base 也固定 32 bits，但 optional compressed extension 可把 alignment 放寬。x86-64 則使用 variable-length encodings，所以 instruction boundary 需要更複雜的 decode。"
        ],
        figure: {
          type: "matrix",
          title: "MIPS32 三種基本 instruction formats",
          columns: ["Format", "bits 31..26", "25..21", "20..16", "15..11", "10..6", "5..0"],
          rows: [
            ["R", "opcode 6", "rs 5", "rt 5", "rd 5", "shamt 5", "funct 6"],
            ["I", "opcode 6", "rs 5", "rt 5", "immediate[15:11]", "immediate[10:6]", "immediate[5:0]"],
            ["J", "opcode 6", "instr_index[25:21]", "instr_index[20:16]", "instr_index[15:11]", "instr_index[10:6]", "instr_index[5:0]"]
          ],
          caption: "I/J 的欄位在表中為了對齊 R format 被切開顯示；實際上 immediate 與 instr_index 都是連續 bit fields。"
        },
        sourceRefs: ["S1", "S2", "S3", "S8", "S9", "S10"]
      },
      {
        title: "4. R format 編解碼：從 register data flow 到 32 bits",
        paragraphs: [
          "編碼 add $t0,$s1,$s2 時，先把 assembly operands 對應到 data flow：GPR[8]←GPR[17]+GPR[18]，所以 rs=17、rt=18、rd=8。再填 opcode=0、shamt=0、funct=32。把 6/5/5/5/5/6 fields 串接後才轉 hexadecimal，可避免直接心算 hex 時跨欄位錯位。",
          "反向解碼應先取 primary opcode。若 opcode=0，再依 funct 判斷 arithmetic/logic operation，並檢查 shamt 是否符合該 instruction。machine word 0x02324020 可切為 opcode 0、rs 17、rt 18、rd 8、shamt 0、funct 0x20，因此是 add $t0,$s1,$s2。",
          "register aliases 是 ABI 名稱，不改變 machine encoding。$t0 與 $8 指向相同 GPR index；$zero 固定讀出 0，對它的寫入不形成一般可見 state。不同 toolchain 可能顯示 numeric names 或 ABI aliases，驗證時應回到 5-bit register number。"
        ],
        figure: {
          type: "bits",
          title: "add $t0,$s1,$s2 的 R-format fields",
          totalBits: 32,
          items: [
            { label: "opcode=0", bits: 6, detail: "SPECIAL" },
            { label: "rs=17", bits: 5, detail: "$s1 source" },
            { label: "rt=18", bits: 5, detail: "$s2 source" },
            { label: "rd=8", bits: 5, detail: "$t0 destination" },
            { label: "shamt=0", bits: 5, detail: "not a fixed shift" },
            { label: "funct=32", bits: 6, detail: "ADD" }
          ],
          caption: "串接結果為 000000 10001 10010 01000 00000 100000 = 0x02324020。"
        },
        sourceRefs: ["S1", "S2", "S3"]
      },
      {
        title: "5. Immediate semantics：同一個 16-bit field 不只一種擴展規則",
        paragraphs: [
          "I format 提供 16-bit immediate，但 ALU 與 address 通常是 32 bits，因此執行前必須擴展。addi、slti、load/store offset 與 branch displacement 把 immediate 視為 signed two's complement 並 sign-extend；andi、ori、xori 則 zero-extend。lui 不做一般低位 operand，而是把 immediate 放到 result 的 bits 31..16，低 16 bits 填 0。",
          "16-bit signed immediate 範圍是 −32768 到 32767，unsigned bit pattern 範圍是 0 到 65535。0xFFFF 經 sign extension 是 0xFFFFFFFF=−1，經 zero extension 是 0x0000FFFF=65535。operation 決定 interpretation；看到最高 bit 為 1 不能自行決定一定是負數。",
          "超過單一 immediate 的 32-bit constant 通常由多條 instructions 建立。例如 0x1234ABCD 可用 lui $t0,0x1234 產生 0x12340000，再用 ori $t0,$t0,0xABCD 合併低 16 bits。li 是 assembler pseudo-instruction，常數較小時可能只展開一條，較大時才需要兩條；因此 static instruction count 取決於 expansion。"
        ],
        figure: {
          type: "matrix",
          title: "MIPS immediate 的解讀規則",
          columns: ["Instruction 類型", "16-bit field", "32-bit operand/用途", "例子"],
          rows: [
            ["addi / slti", "signed", "sign-extend", "0xFFF4 → −12"],
            ["lw / sw", "signed byte offset", "EA=GPR[rs]+signext(imm)", "−8($sp)"],
            ["beq / bne", "signed word displacement", "target=PC+4+(signext(imm)<<2)", "0xFFFB → −5 instructions"],
            ["andi / ori / xori", "bit mask", "zero-extend", "0xFFFF → 0x0000FFFF"],
            ["lui", "upper half", "imm<<16", "0x1234 → 0x12340000"]
          ],
          caption: "欄位寬度相同不代表語意相同；extension 與 scaling 都由 opcode 規定。"
        },
        sourceRefs: ["S1", "S2", "S3", "S7"]
      },
      {
        title: "6. Addressing modes：先算 effective address，再做 memory operation",
        paragraphs: [
          "register addressing 直接從 GPR 取 operand；immediate addressing 把 instruction field 作為 operand；base-plus-offset addressing 先算 EA=GPR[base]+signext(offset)，再由 load/store 讀寫 memory。MIPS memory 是 byte-addressed，所以 lw 的 offset 單位是 bytes，不是 array index 或 words。若 $s0 是 int array base，A[i] 的位址通常是 $s0+4i。",
          "lw $t0,20($s1) 的 architectural effect 是 GPR[8]←M32[GPR[17]+20]；sw $t0,−8($sp) 則是 M32[GPR[29]−8]←GPR[8]。自然對齊的 word address 低兩 bits 為 00。MIPS32 的對齊要求作用在最後 EA，而不是只看 offset；base 未對齊時，即使 offset 可被 4 整除，EA 仍可能 misaligned。",
          "endianness 決定 multi-byte word 的 bytes 如何放到遞增 addresses，不改變 instruction diagram 中 bits 31..26 在抽象 machine word 裡是 opcode。假設 0x12345678 存在 address 0x1000：big-endian 由低址到高址是 12 34 56 78，little-endian 是 78 56 34 12；正確的 aligned word load 在同一 endian mode 下都重建 0x12345678。"
        ],
        figure: {
          type: "flow",
          title: "lw rt,offset(base) 的位址與資料路徑",
          items: ["read GPR[base]", "sign-extend offset", "ALU add → EA", "check alignment / access", "read memory word", "write GPR[rt]"],
          caption: "offset 參與位址計算，不是被載入的資料；memory read 只有在 EA 形成後才能定位。"
        },
        sourceRefs: ["S1", "S2", "S3", "S7"]
      },
      {
        title: "7. Branch 與 jump：target 不是把 label 直接塞進欄位",
        paragraphs: [
          "MIPS beq/bne 使用 PC-relative addressing。assembler 計算 displacement=(target−(PC+4))/4，檢查 target word-aligned 且商落在 signed 16-bit 範圍，再放入 immediate。執行時 target=PC+4+(signext(immediate)<<2)。以 instruction 數為單位儲存 displacement，可在 16 bits 內涵蓋約 ±128 KiB 的 byte 範圍。",
          "j/jal 使用 pseudo-direct（PC-region）addressing。26-bit instr_index 左移 2 bits 提供 target[27:0]，高 4 bits 取自 PC+4，因此只能在同一個 256 MiB region 內直接跳轉。這不是 signed PC-relative offset；跨 region 或無法直接編碼的 target 需要先形成完整 address，再用 register-indirect jump。",
          "經典 MIPS32 定義一個 branch delay slot：緊接 branch/jump 的 instruction 會先執行，再到 target；部分 simulator 可選擇是否模擬，較新的 MIPS Release 6 compact branches 與 RISC-V 則不採傳統 delay slot。machine-code 題目必須先固定 ISA revision 與 simulator mode；branch immediate 的 base PC+4 與是否執行 delay-slot instruction 是兩個不同規則。"
        ],
        figure: {
          type: "matrix",
          title: "MIPS control target 的三種形成方式",
          columns: ["類型", "代表 instruction", "target equation", "主要範圍"],
          rows: [
            ["PC-relative", "beq / bne", "PC+4+(signext(imm16)<<2)", "約 PC+4 前後 128 KiB"],
            ["Pseudo-direct", "j / jal", "{(PC+4)[31:28],index26,00}", "目前 256 MiB region"],
            ["Register indirect", "jr / jalr", "GPR[rs]", "register 可表示的 address"]
          ],
          caption: "三種 control transfers 的 target equation 不可互換；先辨認 format，再代入正確基準與 scaling。"
        },
        sourceRefs: ["S1", "S2", "S6", "S11"]
      },
      {
        title: "8. Procedure call 是 ISA mechanism 加上 ABI convention",
        paragraphs: [
          "jal 同時建立 control transfer 與 return link；在經典 delayed-branch MIPS 中 $ra 保存 branch 之後第二條 instruction 的 address（PC+8），因為 PC+4 是 delay slot。jr $ra 返回 caller。這只提供基本 mechanism；argument、result、哪些 registers 必須保存，以及 stack layout 由 ABI/calling convention 規定。",
          "常見 MIPS convention 以 $a0–$a3 傳前四個 arguments、$v0–$v1 傳 return values、$t0–$t9 作 caller-saved temporaries、$s0–$s7 作 callee-saved registers、$sp 指向 stack、$ra 保存 return address。caller 若要跨 call 保留 $t register，必須自行保存；callee 若修改 $s register，必須在 entry 保存並在 return 前恢復。",
          "non-leaf procedure 還會呼叫其他 procedure，因此新的 jal 會覆寫 $ra；它必須在 stack frame 保存原 $ra。stack frame 也可保存 callee-saved registers、local variables、spill slots 與超出 register 數量的 arguments。正確性要在 return 前檢查 $sp 恢復到 entry 值、所有應保留 registers 還原、result 放在約定位置。"
        ],
        figure: {
          type: "matrix",
          title: "常見 MIPS procedure register convention",
          columns: ["Registers", "角色", "跨 call 保存責任", "典型動作"],
          rows: [
            ["$a0–$a3", "arguments", "caller 視需要保存", "call 前放入參數"],
            ["$v0–$v1", "return values", "caller 取得結果", "return 前寫入"],
            ["$t0–$t9", "temporaries", "caller-saved", "caller 在需要時 spill"],
            ["$s0–$s7", "saved values", "callee-saved", "callee 修改前保存"],
            ["$sp", "stack pointer", "callee 必須恢復", "配置／釋放 frame"],
            ["$ra", "return link", "non-leaf callee 通常保存", "jal 寫入、jr 讀取"]
          ],
          caption: "ISA 定義 jal/jr 的 state effect；ABI 定義 registers 與 stack 的共同責任。"
        },
        sourceRefs: ["S2", "S4", "S11"]
      },
      {
        title: "9. 五階段 pipeline：重疊不同 instructions，而非縮短單條工作",
        paragraphs: [
          "經典 RISC pipeline 分為 IF、ID、EX、MEM、WB。IF 取 instruction 並形成 sequential PC，ID decode 並讀 registers，EX 執行 ALU 或算 EA，MEM 存取 data memory，WB 寫回 register。pipeline registers 保存各 stage 邊界的 data/control，使第 n 條在 EX 時，第 n+1 條可在 ID、第 n+2 條可在 IF。",
          "若 k stages 每 stage 一個 cycle，沒有 hazards 的 n 條 instructions 需要 k+n−1 cycles：前 k−1 cycles 填管線，此後理想上每 cycle 完成一條。單條 instruction latency 約為 k×Tclk，未必比非 pipeline 更短；改善的是 steady-state throughput。clock period 受最慢 stage 加 pipeline-register overhead 限制，而不是所有 stage 延遲平均值。",
          "理想 speedup 只有在 n 很大、stages 平衡、overhead 小且沒有 stalls 時接近 k。若 stage delays 差異大，最慢 stage 決定 Tclk；hazards、cache miss、branch recovery 與 pipeline fill/drain 都增加 cycles。CPU time 仍應以 instruction count×CPI×clock period 分析。"
        ],
        figure: {
          type: "timeline",
          title: "五條獨立 instructions 的理想五階段重疊",
          columns: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
          rows: [
            { label: "I1", cells: ["IF", "ID", "EX", "MEM", "WB", "", "", "", ""] },
            { label: "I2", cells: ["", "IF", "ID", "EX", "MEM", "WB", "", "", ""] },
            { label: "I3", cells: ["", "", "IF", "ID", "EX", "MEM", "WB", "", ""] },
            { label: "I4", cells: ["", "", "", "IF", "ID", "EX", "MEM", "WB", ""] },
            { label: "I5", cells: ["", "", "", "", "IF", "ID", "EX", "MEM", "WB"] }
          ],
          caption: "k=5、n=5 時理想 cycles=5+5−1=9；填滿後每 cycle 有一條 instruction 完成 WB。"
        },
        sourceRefs: ["S5", "S12"]
      },
      {
        title: "10. Hazards：資源衝突、資料相依與未知 next PC",
        paragraphs: [
          "structural hazard 發生在同一 cycle 有多個 stages 需要同一硬體資源。例如 IF 與 MEM 共用單埠 memory 時，load/store 的 data access 會和下一條 instruction fetch 衝突。分離 instruction/data memories、增加 ports 或 stall 可處理；這是 implementation 資源問題，不是 assembly 中的 data dependency。",
          "data hazard 在較早 instruction 尚未產生／提交值時，較晚 instruction 已要讀它。經典 in-order five-stage 主要面對 RAW（read after write）。ALU result 可由 EX/MEM 或 MEM/WB forwarding 到下一條 EX；但 load data 到 MEM 結尾才可用，緊接的 consumer 通常仍需一個 load-use stall。stall 固定 PC/IF-ID 並向 EX 插入不改 state 的 bubble。",
          "control hazard 來自 branch/jump 尚未確定 next PC。處理器可 stall、預測方向/target，或先沿某一路徑 fetch；預測錯誤時要 flush 錯誤路徑 instructions，不能讓它們改變 architectural state。delay slot 是 ISA-visible 策略，branch prediction 是 microarchitecture strategy；兩者不可混稱。"
        ],
        figure: {
          type: "timeline",
          title: "load-use hazard：forwarding 仍需要一個 stall",
          columns: ["1", "2", "3", "4", "5", "6", "7", "8"],
          rows: [
            { label: "lw $t0,0($s0)", cells: ["IF", "ID", "EX", "MEM", "WB", "", "", ""] },
            { label: "add $t1,$t0,$t2", cells: ["", "IF", "ID", "ST", "EX", "MEM", "WB", ""] },
            { label: "sub $t3,$t1,$t4", cells: ["", "", "IF", "ST", "ID", "EX", "MEM", "WB"] }
          ],
          caption: "lw 的 data 到 cycle 4 MEM 結尾才形成，consumer 的 EX 延到 cycle 5；其後 add result 可 forwarding 給 sub。"
        },
        sourceRefs: ["S5", "S12", "S13"]
      },
      {
        title: "11. 跨 ISA 比較：規則要逐項比，不以 RISC/CISC 標籤代替證據",
        paragraphs: [
          "MIPS 教學子集以 32-bit fixed length、32 GPRs、三種主要 formats 與 load-store operations 建立清楚模型。RV32I 也採 32-bit base instructions 與 32 integer registers，但以 R/I/S/B/U/J formats 保持 register fields 位置一致，branch immediate 的編排與 MIPS 不同，且 base ISA 沒有 branch delay slot。A64 的 instructions 也是固定 32 bits，提供 31 個 general-purpose registers 的 64/32-bit views。",
          "x86-64 保留 variable-length instructions、較多 addressing forms 與長期 binary compatibility。這會使 front-end decode 與 instruction boundary 處理較複雜，但現代 x86 implementations 可把 instructions decode 成內部 micro-operations，再由寬廣 pipeline 執行。固定長度不自動保證較快，variable length 也不等於每條都慢。",
          "比較 ISA 時可逐項量測：code density、decode regularity、register count、immediate range、memory addressing、control-transfer reach、extension mechanism 與 compatibility burden。效能則還要加入 compiler、workload 與 microarchitecture。ISA 的目標是定義可長期維持的 interface，不是單獨決定某顆 CPU 的 IPC、clock 或 energy。"
        ],
        figure: {
          type: "matrix",
          title: "四種 ISA 的可觀察 encoding 特徵",
          columns: ["特徵", "MIPS32 經典子集", "RV32I base", "A64", "x86-64"],
          rows: [
            ["基本 instruction length", "32 bits", "32 bits", "32 bits", "variable 1–15 bytes"],
            ["整數 register 規模", "32×32-bit GPR", "32×XLEN", "31×64-bit GPR views", "16×64-bit GPR"],
            ["memory arithmetic", "load-store", "load-store", "主要為 load-store", "可有 memory operand"],
            ["branch delay slot", "經典版本有", "無", "無", "無"],
            ["格式特色", "R/I/J", "R/I/S/B/U/J", "多類 32-bit formats", "prefix/opcode/ModR/M 等可變組合"]
          ],
          caption: "表格比較 architectural encoding，不代表特定 implementation 的效能排名。MIPS revision 與 optional extensions 必須另行固定。"
        },
        sourceRefs: ["S1", "S7", "S8", "S9", "S10"]
      }
    ],
    workedExamples: [
      {
        title: "例題一：編碼與反解 add $t0,$s1,$s2",
        prompt: "依經典 MIPS32 R format 編碼 add $t0,$s1,$s2，並從結果反向驗證所有 fields。",
        steps: [
          "由 register convention 得 $t0=8、$s1=17、$s2=18；data flow 是 GPR[8]←GPR[17]+GPR[18]。",
          "add 使用 R format：opcode=0、rs=17、rt=18、rd=8、shamt=0、funct=0x20。",
          "轉成欄位 bits：000000 | 10001 | 10010 | 01000 | 00000 | 100000。",
          "串接為 00000010001100100100000000100000，每 4 bits 分組為 0 2 3 2 4 0 2 0。",
          "machine word 是 0x02324020；反解最高 6 bits 為 0，所以再查最低 funct=0x20 得 ADD。",
          "取出 rs/rt/rd 得 17/18/8，和 assembly operands 的 sources/destination 一致；shamt=0 也符合非 shift instruction。"
        ],
        result: "add $t0,$s1,$s2 編碼為 0x02324020，完整 field round-trip 無矛盾。"
      },
      {
        title: "例題二：負 immediate 與 base-plus-offset encoding",
        prompt: "編碼 addi $t0,$s1,−12 與 sw $t0,−8($sp)，並說明兩個 immediate 的語意。",
        steps: [
          "−12 的 16-bit two's complement 是 0xFFF4；addi opcode=8、rs=$s1=17、rt=$t0=8。",
          "欄位串接為 opcode 001000、rs 10001、rt 01000、imm 1111111111110100，得到 0x2228FFF4。",
          "執行 addi 時 0xFFF4 sign-extend 成 0xFFFFFFF4，再和 GPR[17] 相加；rt 是 destination。",
          "sw opcode=43、base rs=$sp=29、data rt=$t0=8、offset −8=0xFFF8。",
          "sw machine word 為 0xAFA8FFF8；EA=GPR[29]+0xFFFFFFF8=SP−8。",
          "sw 的 rt 是要寫到 memory 的 source，而 addi 的 rt 是 destination；相同欄位位置可有不同 data-flow role。"
        ],
        result: "addi 為 0x2228FFF4；sw 為 0xAFA8FFF8。兩者都 sign-extend immediate，但一個形成 ALU operand，另一個形成 byte address offset。"
      },
      {
        title: "例題三：建立 32-bit constant 並計算 pseudo-instruction expansion",
        prompt: "把 li $t0,0x1234ABCD 展開為真正 MIPS instructions，列出每一步 register value 與 machine word。",
        steps: [
          "常數超出 signed 16-bit，不能由單一 addi 表示；分成 upper=0x1234、lower=0xABCD。",
          "lui $t0,0x1234 執行 GPR[8]←0x1234<<16=0x12340000。",
          "lui 的 opcode=0x0F、rs=0、rt=8、imm=0x1234，machine word=0x3C081234。",
          "ori $t0,$t0,0xABCD 將 lower immediate zero-extend 為 0x0000ABCD。",
          "0x12340000 OR 0x0000ABCD=0x1234ABCD；ori machine word=0x3508ABCD。",
          "若誤用會 sign-extend 的 addi 合併 0xABCD，operand 會是負值，可能使 upper half 受 borrow/carry 影響；ori 的 bitwise merge 不會。"
        ],
        result: "此 li 展開為兩條 instructions：0x3C081234、0x3508ABCD，最後 $t0=0x1234ABCD。"
      },
      {
        title: "例題四：計算 backward beq 的 PC-relative field",
        prompt: "beq 位於 0x00400020，target 位於 0x00400010，assembly 為 beq $t0,$t1,target。求 immediate 與 machine word。",
        steps: [
          "branch base 是 PC+4=0x00400024，而不是 branch 自己的 0x00400020。",
          "byte delta=0x00400010−0x00400024=−0x14=−20 bytes。",
          "instruction displacement=−20/4=−5；target aligned 且整除 4。",
          "−5 的 16-bit two's complement 是 0xFFFB。",
          "beq opcode=4、rs=$t0=8、rt=$t1=9，串接得到 0x1109FFFB。",
          "反驗：signext(0xFFFB)<<2=−20；0x00400024−20=0x00400010。"
        ],
        result: "immediate=0xFFFB，machine word=0x1109FFFB；以 target equation 回算得到原 target。"
      },
      {
        title: "例題五：計算 j 的 pseudo-direct target",
        prompt: "j instruction 位於 0x00400040，要跳到 aligned address 0x00401234。求 instr_index 與 machine word，並驗證 region bits。",
        steps: [
          "target 低兩 bits 為 00，符合 4-byte alignment，可由 index 隱含這兩 bits。",
          "instr_index=(0x00401234>>2)&0x03FFFFFF=0x0010048D。",
          "j 的 opcode=2，位於 bits 31..26；machine word=(2<<26)|0x0010048D=0x0810048D。",
          "執行時先取 PC+4=0x00400044，其高 4 bits 是 0x0。",
          "index<<2=0x00401234，串接高 4 bits 後 target 仍為 0x00401234。",
          "若 target 與 PC+4 不在相同 256 MiB region，這個 26-bit index 不能單獨表達完整 target。"
        ],
        result: "instr_index=0x0010048D，machine word=0x0810048D，重建 target=0x00401234。"
      },
      {
        title: "例題六：non-leaf procedure 的 stack state",
        prompt: "函式 F 會修改 $s0 並呼叫 G。entry 時 $sp=0x7FFFFFF0、$ra=0x00400108。F 配置 8-byte frame，將 $ra 存 4($sp)、$s0 存 0($sp)。追蹤 prologue 與 epilogue。",
        steps: [
          "addiu $sp,$sp,−8 後 $sp=0x7FFFFFE8，frame 範圍為 0x7FFFFFE8..0x7FFFFFEF。",
          "sw $s0,0($sp) 把 caller 可觀察的原 $s0 保存於 0x7FFFFFE8。",
          "sw $ra,4($sp) 把 return address 0x00400108 保存於 0x7FFFFFEC。",
          "jal G 會建立新的 $ra，因此 F 不能依賴 register 中仍保留 0x00400108。",
          "G 返回後，lw $s0,0($sp) 與 lw $ra,4($sp) 還原兩個 architectural values。",
          "addiu $sp,$sp,8 恢復 0x7FFFFFF0；jr $ra 以 0x00400108 返回。",
          "若 restore 順序所用 addresses 都以目前 frame $sp 為 base，必須在回收 frame 前完成 loads。"
        ],
        result: "return 前 $s0、$ra、$sp 均恢復 entry state；F 可安全地成為 non-leaf procedure。"
      },
      {
        title: "例題七：由 stage delays 計算 pipeline time 與 speedup",
        prompt: "IF/ID/EX/MEM/WB combinational delays 分別為 250/150/200/300/180 ps，每個 pipeline register overhead 20 ps。忽略 hazards，比較 8 條 instructions 的非 pipeline sequential time 與五階段 pipeline time。",
        steps: [
          "非 pipeline 每條需各階段延遲總和：250+150+200+300+180=1080 ps。",
          "8 條 sequential time=8×1080=8640 ps。",
          "pipeline clock 由最慢 MEM 300 ps 加 overhead 20 ps 決定，Tclk=320 ps。",
          "k=5、n=8，理想 cycles=k+n−1=5+8−1=12。",
          "pipeline time=12×320=3840 ps。",
          "speedup=8640/3840=2.25，而不是 5；stage imbalance、register overhead 與 fill/drain 都限制收益。"
        ],
        result: "8 條 instructions 的理想 pipeline time 為 3.84 ns，speedup=2.25×。"
      }
    ],
    misconceptions: [
      ["一行 assembly 永遠就是一條 machine instruction。", "pseudo-instruction 可展開為多條，directive 甚至不會成為 executable instruction；必須查看 assembler output。"],
      ["R format 的 rt 永遠是 destination。", "add 的 destination 是 rd；I-format addi/lw 才常以 rt 作 destination，而 sw/beq 的 rt 是 source。"],
      ["所有 16-bit immediates 都要 sign-extend。", "addi、offset、branch 會 sign-extend；andi/ori/xori zero-extend；lui 則放入 upper half。"],
      ["lw 4($s0) 是載入陣列第 4 個 word。", "offset 單位是 bytes；若 element 為 4 bytes，offset 4 通常是下一個 element。"],
      ["little-endian 會把 instruction opcode 移到 machine word 的最低 6 bits。", "endianness 排列 memory bytes；解碼後的 32-bit instruction 仍以 bits 31..26 作 primary opcode。"],
      ["beq immediate 就是 target address。", "它是相對 PC+4、以 4-byte instructions 為單位的 signed displacement。"],
      ["j 能直接跳到任意 32-bit address。", "pseudo-direct target 的高 4 bits 來自 PC+4，只能直接到同一 256 MiB region。"],
      ["forwarding 可以消除所有 RAW stalls。", "緊接 load 的 consumer 通常在 data 可用前就需要 EX operand，因此仍有一個 load-use stall。"],
      ["五階段 pipeline 讓每條 instruction latency 變成五分之一。", "pipeline 主要提高多條 instructions 的 throughput；單條 latency 還包含五個 cycles 與 pipeline-register overhead。"],
      ["RISC 一定比 CISC 快。", "ISA label 不足以決定 performance；compiler、workload、cache、pipeline、execution width 與製程都會影響結果。"]
    ],
    exercises: [
      { level: "基礎", question: "32 個 general-purpose registers 至少需要幾個 instruction bits 才能指定一個 register？", solution: ["需要 ceil(log2 32)=5 bits。", "5 bits 有 2^5=32 種 patterns，能編出 index 0..31。"] },
      { level: "基礎", question: "MIPS R format 的六個 fields 依 bits 31..0 順序為何？總寬度是否為 32？", solution: ["順序是 opcode 6、rs 5、rt 5、rd 5、shamt 5、funct 6。", "6+5+5+5+5+6=32 bits。"] },
      { level: "基礎", question: "0xFFFF 經 sign extension 與 zero extension 到 32 bits 後各為何？", solution: ["sign extension 複製 sign bit 1，得到 0xFFFFFFFF，也就是 −1。", "zero extension 補 16 個 0，得到 0x0000FFFF，也就是 65535。"] },
      { level: "基礎", question: "若 $s0=0x1000，執行 lw $t0,12($s0) 的 effective address 為何？若存取 word，是否自然對齊？", solution: ["EA=0x1000+12=0x100C。", "0x100C mod 4=0，所以是 4-byte naturally aligned address。"] },
      { level: "基礎", question: "將 add $t0,$s1,$s2 的 register numbers 與 data-flow equation 寫出。", solution: ["$t0=8、$s1=17、$s2=18。", "GPR[8]←GPR[17]+GPR[18]；rs=17、rt=18、rd=8。"] },
      { level: "核心", question: "編碼 lw $t0,20($s1)，並列出 opcode、rs、rt、immediate。", solution: ["lw opcode=35=0x23，rs=$s1=17，rt=$t0=8，immediate=20=0x0014。", "串接後 machine word=(35<<26)|(17<<21)|(8<<16)|20=0x8E280014。"] },
      { level: "核心", question: "反解 machine word 0x2228FFF4，說明 instruction 與 immediate value。", solution: ["opcode=8 是 addi，rs=17=$s1，rt=8=$t0。", "immediate 0xFFF4 sign-extend 為 −12，所以是 addi $t0,$s1,−12。"] },
      { level: "核心", question: "branch 位於 0x1000、target 位於 0x1040，求 PC-relative immediate。", solution: ["base=PC+4=0x1004，byte delta=0x1040−0x1004=0x3C=60。", "immediate=60/4=15=0x000F；回算 0x1004+(15<<2)=0x1040。"] },
      { level: "核心", question: "branch 位於 0x2000，immediate=0xFFFC。taken target 為何？", solution: ["0xFFFC sign-extend 是 −4 instructions，左移 2 得 −16 bytes。", "base=0x2004，所以 target=0x2004−0x10=0x1FF4。"] },
      { level: "核心", question: "解釋 lui $t0,0x89AB 後的 register value，並指出低 16 bits。", solution: ["lui 將 immediate 放入 bits 31..16，得到 $t0=0x89AB0000。", "低 16 bits 由 instruction semantics 填 0，不是 sign extension。"] },
      { level: "核心", question: "0x12345678 存於 0x1000..0x1003。列出 little-endian 與 big-endian 的四個 memory bytes。", solution: ["little-endian 低址到高址為 78、56、34、12。", "big-endian 低址到高址為 12、34、56、78；word value 在匹配的 load mode 下相同。"] },
      { level: "進階", question: "編碼 j 0x00401234，並以 PC+4 高位驗證 target；假設 j 位於 0x00400040。", solution: ["index=(0x00401234>>2)&0x03FFFFFF=0x0010048D，opcode=2，所以 word=0x0810048D。", "PC+4=0x00400044 高 4 bits 為 0；{0,index,00}=0x00401234。"] },
      { level: "進階", question: "caller 在 call 後仍需要 $t0，callee 會任意修改 $t0。依 caller-saved 規則，責任與操作為何？", solution: ["$t0 屬 caller-saved，因此 caller 在 jal 前把 live value 保存到 stack 或其他安全位置。", "callee return 後 caller 再 restore；不能要求 callee 自動保存所有 $t registers。"] },
      { level: "進階", question: "五階段 pipeline 理想執行 20 條 instructions 需要幾 cycles？若 Tclk=400 ps，總時間為何？", solution: ["cycles=k+n−1=5+20−1=24。", "time=24×400 ps=9600 ps=9.6 ns。"] },
      { level: "進階", question: "基準 CPI=1，20% instructions 是 load，其中 30% 緊接 dependent consumer 並各 stall 1 cycle。新 CPI 為何？", solution: ["每條 instruction 的 load-use stall contribution=0.20×0.30×1=0.06。", "CPI=1+0.06=1.06；這裡假設其他 hazards 與 misses 都不存在。"] },
      { level: "挑戰", question: "某 pipeline stage delays 為 180、220、170、260、190 ps，register overhead 30 ps。若可把 260 ps stage 均分成兩個 130 ps stages，原五階段與新六階段的 clock periods 各為何？對大量 instructions 的理想 throughput 改善多少？", solution: ["原 Tclk=max(...)+30=260+30=290 ps；新 Tclk=max(180,220,170,130,130,190)+30=220+30=250 ps。", "大量 instructions 的 throughput 約與 1/Tclk 成正比，改善比=290/250=1.16，也就是約 16%；stage 增加會提高單條 latency 與短序列 fill cost。"] }
    ],
    glossary: [
      ["Instruction set architecture", "software-visible instructions、state、memory、exception 與 encoding 的合約。"],
      ["Microarchitecture", "實作某 ISA 的 datapath、pipeline、cache、prediction 與 control 組織。"],
      ["Opcode", "instruction 中選擇 operation 或主要 instruction class 的 bit field。"],
      ["Operand", "instruction 讀取、計算或寫入的 value/location。"],
      ["Load-store architecture", "只有 load/store 存取 memory，arithmetic 主要在 registers 間運算的 ISA。"],
      ["R format", "MIPS 以 opcode、rs、rt、rd、shamt、funct 組成的 register-oriented 32-bit format。"],
      ["I format", "MIPS 以 opcode、rs、rt 與 16-bit immediate 組成的 format。"],
      ["J format", "MIPS 以 opcode 與 26-bit instr_index 組成的 direct jump format。"],
      ["Sign extension", "複製較窄值的最高 sign bit，使 two's-complement 數值在加寬後不變。"],
      ["Zero extension", "在較窄 bit pattern 高位補 0，使其成為較寬的非負／mask value。"],
      ["Effective address", "完成 base、offset、index 或 indirection 後，memory operation 真正存取的 address。"],
      ["PC-relative addressing", "以 PC 附近位置為基準加 signed displacement 形成 target。"],
      ["Pseudo-direct addressing", "MIPS jump 以 PC+4 高位和 instruction index 低位串接 target 的方式。"],
      ["Pseudo-instruction", "assembler 接受但可能展開為其他一或多條 machine instructions 的表示。"],
      ["Calling convention", "procedure 間對 arguments、results、register preservation 與 stack layout 的 ABI 規則。"],
      ["Pipeline", "把 instruction processing 分 stages，讓多條 instructions 在不同 stages 重疊。"],
      ["Latency", "單一 operation 從開始到完成經過的時間。"],
      ["Throughput", "單位時間內可完成的 operations/instructions 數量。"],
      ["Structural hazard", "多個同時進行的 stages 爭用不足硬體資源的衝突。"],
      ["RAW hazard", "較晚 instruction 在較早 instruction 寫入前就要讀同一 location 的 true dependency。"],
      ["Forwarding", "把尚未寫回 register file 的結果直接送到需要它的後續 stage。"],
      ["Stall", "暫停部分 pipeline state 並插入 bubble，等待 hazard 消失。"],
      ["Flush", "取消錯誤路徑或不應提交的 pipeline instructions。"],
      ["Branch delay slot", "經典 MIPS 中位於 branch/jump 後、在 control transfer 生效前執行的一個 ISA-visible instruction position。"]
    ],
    sources: [
      { key: "S1", title: "MIPS32 Architecture for Programmers, Volume I: Introduction", url: "https://www.cs.cornell.edu/people/egs/comp303/resources/MIPS_Vol1.pdf", accessed: "2026-08-19", use: "ISA/implementation 邊界、MIPS32 state、32-bit CPU formats、register 與 encoding tables。" },
      { key: "S2", title: "MIPS32 Architecture for Programmers, Volume II: Instruction Set", url: "https://people.cs.pitt.edu/~don/coe1502/current/mips32_instr_set.pdf", accessed: "2026-08-19", use: "ADD、load/store、branch、jump 的 fields、operation、alignment、exceptions 與 instruction semantics。" },
      { key: "S3", title: "UNSW COMP1521 26T2: MIPS Instruction Set", url: "https://cgi.cse.unsw.edu.au/~cs1521/26T2/resources/mips-guide.html", accessed: "2026-08-19", use: "2026 公開課程的 MIPS32/SPIM instruction、register、immediate 與 pseudo-instruction 交叉核對。" },
      { key: "S4", title: "Cornell CS314: MIPS Calling Conventions", url: "https://www.cs.cornell.edu/courses/cs314/2003fa/handouts/procs2.html", accessed: "2026-08-19", use: "argument/result registers、caller/callee-saved 分工、stack frame 與 return-address convention。" },
      { key: "S5", title: "Cornell CS5220: Single-Core Architecture and Classic Five-Stage Pipeline", url: "https://www.cs.cornell.edu/courses/cs5220/2024fa/slides/03-single-core.html", accessed: "2026-08-19", use: "IF/ID/EX/MEM/WB、pipeline throughput/latency 與現代 execution context。" },
      { key: "S6", title: "Cornell CS3410: MIPS Addressing Modes", url: "https://www.cs.cornell.edu/courses/cs3410/2008fa/Lectures/Lec13_linkersMemory_web.pdf", accessed: "2026-08-19", use: "register、base、immediate、PC-relative 與 pseudo-direct addressing 的公開課程圖解。" },
      { key: "S7", title: "RISC-V Unprivileged ISA Specification, Version 20260120", url: "https://docs.riscv.org/reference/isa/unpriv/rv32.html", accessed: "2026-08-19", use: "RV32I fixed formats、immediate encoding、load-store、branch、alignment 與 endianness 的最新 ratified specification。" },
      { key: "S8", title: "Arm Learn the Architecture: A64 ISA Guide", url: "https://developer.arm.com/documentation/102374/0103/Registers-in-AArch64---general-purpose-registers", accessed: "2026-08-19", use: "A64 general-purpose register views 與 register-operated instruction model。" },
      { key: "S9", title: "Intel 64 and IA-32 Architectures Software Developer's Manuals", url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html", accessed: "2026-08-19", use: "x86-64 architectural environment、variable-length instruction references 與跨 ISA encoding 比較。" },
      { key: "S10", title: "Arm: The A64 ISA and Compilers", url: "https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/the-a64-isa-and-compilers", accessed: "2026-08-19", use: "A64 32-bit fixed-length encoding、register fields 與 immediate layout 的官方說明。" },
      { key: "S11", title: "MIPS32 Architecture for Programmers: Jump and Branch Semantics", url: "https://www.cs.cornell.edu/courses/cs3410/2013sp/MIPS_Vol2.pdf", accessed: "2026-08-19", use: "PC-region jump、PC+4 high bits、delay slot、J/JAL/JR semantics 與 target reconstruction。" },
      { key: "S12", title: "UC Berkeley CS61C Course Notes: Data Hazards", url: "https://notes.cs61c.org/content/pipeline-hazards/data-hazards/", accessed: "2026-08-19", use: "RAW detection、forwarding paths、load-use stall、bubble 與 pipeline-register control。" },
      { key: "S13", title: "UC Berkeley CS61C Course Notes: Control Hazards", url: "https://notes.cs61c.org/content/pipeline-hazards/control-hazards/", accessed: "2026-08-19", use: "branch next-PC uncertainty、prediction、stall 與 flush 的五階段 pipeline 行為。" }
    ]
  },
  {
    chapter: 6,
    title: "記憶體階層：Cache、虛擬記憶體與位址轉譯",
    english: "Memory Hierarchy: Caches, Virtual Memory, and Address Translation",
    revised: "2026-08-20",
    readingTime: "約 220–270 分鐘",
    intro: "處理器可以在極短時間內產生 memory request，但容量大的儲存體無法同時具備最低延遲、最高頻寬、最低成本與非揮發性。記憶體系統因此不是單一陣列，而是由 registers、SRAM caches、DRAM、persistent storage 與位址轉譯共同構成的階層。本章以『一次 byte address 最後在哪裡命中、為何命中、付出多少成本』作為共同證據鏈：先從 memory technology 與 locality 推導 cache，再精確計算 tag/index/offset、mapping、replacement、write policy 與多層 AMAT；接著把 virtual address 切成 VPN/page offset，追蹤 page table、TLB、permission 與 page fault。每個模型都明確區分 data copy、address translation 與 architectural state，讓 cache miss、TLB miss 和 page fault 不再混為同一件事。",
    outcomes: [
      "能比較 SRAM、DRAM 與 persistent storage 的保存方式、延遲、密度、揮發性與系統角色。",
      "能由 memory reference trace 辨認 temporal、spatial locality、working set 與 stride 對命中率的影響。",
      "能說明 cache line 的 data、tag、valid、dirty 與 replacement metadata，並逐步判斷 hit/miss。",
      "能由 capacity、block size、associativity 與 address width 推導 sets、offset、index、tag 與 metadata overhead。",
      "能模擬 direct-mapped、set-associative、fully associative cache 與 LRU/FIFO/random replacement。",
      "能比較 write-through/write-back 與 write-allocate/no-write-allocate，追蹤 dirty eviction 的 memory traffic。",
      "能計算單層、多層 AMAT、local/global miss rate 與 memory-stall CPI，並檢查條件機率與單位。",
      "能把 virtual address 轉為 VPN/page offset，經 page table 或 TLB 取得 PPN 並重建 physical address。",
      "能區分 TLB miss、page fault、protection fault 與 cache miss，並解釋 OS 和 hardware 的分工。",
      "能比較 paging 與 segmentation，說明 multi-level page table、huge page、sharing 與 protection 的取捨。"
    ],
    sections: [
      {
        title: "1. 記憶體階層用常見快速路徑包住少數昂貴事件",
        paragraphs: [
          "沒有單一 memory technology 能同時做到接近 register 的 latency、接近 storage 的 capacity、低 cost per bit 與斷電保存。系統把小而快的層級放近 CPU，把大而慢的層級放遠；上層保存下層的一部分 copies。一次 request 若在上層 hit，就以低 latency 完成；若 miss，才向下一層取得較大的 transfer unit。",
          "cache 的管理主要由 hardware 自動完成，cache block 通常為數十 bytes；virtual memory 把 DRAM 視為 address space backing store 的快速層，page 常為數 KiB，mapping 與 page fault 由 MMU 和 operating system 協作。兩者都利用 locality，但成本比例不同：cache miss 常以 cycles 到數百 ns 計，storage-backed page fault 可達微秒或毫秒，因此 VM 更強調避免 fault。",
          "階層的目標不是讓每次 access 都和 L1 一樣快，而是讓平均成本接近上層。評估時必須同時保留 hit time、miss rate、miss penalty 與 traffic。只報 hit rate 會漏掉 hit path 變慢或 miss penalty 增大的代價；只報 bandwidth 也無法回答單一 dependent load 要等待多久。"
        ],
        figure: {
          type: "hierarchy",
          title: "典型 memory hierarchy 與管理單位",
          items: [
            { label: "Registers", detail: "bytes 到 KiB；instruction 明確指定；最低 latency" },
            { label: "L1 cache", detail: "KiB；cache lines；每 core、hit path 極短" },
            { label: "L2 / LLC", detail: "數百 KiB 到數十 MiB；較大但較慢" },
            { label: "DRAM", detail: "GiB；rows/bursts；memory controller 排程" },
            { label: "Persistent storage", detail: "GB/TB；pages/blocks；斷電保存" }
          ],
          caption: "越往下 capacity 通常增加、cost per bit 降低、latency 上升；相鄰層以不同大小的 transfer unit 搬移。"
        },
        sourceRefs: ["S1", "S2", "S3", "S10"]
      },
      {
        title: "2. SRAM、DRAM 與 storage：同樣保存 bits，物理代價不同",
        paragraphs: [
          "SRAM cell 以穩定的電路狀態保存 bit，只要供電存在便不需週期 refresh；它速度快但 cell 面積大，因此適合 on-chip cache。DRAM cell 以 capacitor charge 表示 bit，密度較高但 charge 會洩漏，必須 refresh。DRAM read 牽涉 row activate、sense/restore、column transfer 與可能的 precharge，不能用單一『RAM latency』涵蓋所有情況。",
          "DRAM 被分成 channels、ranks、banks、rows 與 columns。若 request 命中同 bank 已開啟的 row，row-buffer hit 可省去部分 activate/precharge；若要切換 row，memory controller 必須遵守 timing constraints。bank-level parallelism 可重疊不同 banks 的工作，但同 bank 的相依 requests 仍受序列化限制。容量、first-word latency 與 sustained bandwidth 是三個不同指標。",
          "SSD/flash 提供 nonvolatile storage，erase/program/read granularity 與 DRAM 不同，延遲也高得多。virtual memory 可把未 resident page 的內容放在 executable/file 或 swap backing store，但 storage 不是 CPU load/store 直接同步存取的普通 memory cell；page fault 會陷入 OS，安排 I/O、更新 mapping，再重新執行 faulting instruction。"
        ],
        figure: {
          type: "matrix",
          title: "Memory technologies 的核心差異",
          columns: ["層級", "bit 保存方式", "揮發性", "主要系統角色", "關鍵限制"],
          rows: [
            ["SRAM", "bistable circuit state", "是", "register file / cache", "面積與 leakage cost"],
            ["DRAM", "capacitor charge", "是", "main memory", "refresh、row timing、controller queue"],
            ["NAND flash / SSD", "floating-gate/charge state", "否", "persistent backing", "erase/program、wear、I/O latency"],
            ["Disk", "magnetic media", "否", "大容量 persistent storage", "mechanical seek/rotation 或 queueing"]
          ],
          caption: "Random access 名稱不代表 latency 相同；cell、array、interface 與 controller 都會影響可觀察時間。"
        },
        sourceRefs: ["S1", "S10", "S11"]
      },
      {
        title: "3. Locality 是 reference stream 的性質，不是 cache 的保證",
        paragraphs: [
          "temporal locality 表示近期使用的 item 可能很快再次使用，例如 loop counter、function body 與累加變數；spatial locality 表示鄰近 addresses 可能很快被使用，例如 sequential instruction fetch 與 row-major array traversal。cache 以整個 block 填入，把一次 miss 的成本攤到同 block 的後續 accesses。",
          "working set 是某段執行期間實際活躍的 blocks/pages。若 working set 能留在某層，重用會形成 hits；若超過 capacity，block 可能在下次重用前被 evict。stride 決定 reference 間的 address distance：4-byte elements 的 stride 1 依序相差 4 bytes，能利用 line 內多個 elements；大 stride 可能每次落到新 line，甚至反覆撞同一 set。",
          "locality 要由動態 trace 判斷。相同 source code 在不同 input、layout、compiler transformation 下可能產生不同 addresses。cache capacity 或 associativity 增大也不保證所有 workload 都變快，因為 hit time、energy、replacement 與 data movement 會一起改變。"
        ],
        figure: {
          type: "matrix",
          title: "64-byte line、4-byte elements 的兩種 traversal",
          columns: ["Reference pattern", "前四個 byte addresses", "每 line 可利用 elements", "主要 locality"],
          rows: [
            ["contiguous", "0, 4, 8, 12", "最多 16", "strong spatial"],
            ["stride 16 elements", "0, 64, 128, 192", "每次先碰新 line", "line reuse 弱"],
            ["repeat one element", "128, 128, 128, 128", "同一位置", "strong temporal"],
            ["random large set", "input-dependent", "通常低", "working set 決定"]
          ],
          caption: "block size 只提供利用 spatial locality 的機會；程式若不碰 line 內其餘 bytes，搬入的資料就成為 bandwidth 與 capacity 負擔。"
        },
        sourceRefs: ["S1", "S3", "S5", "S12"]
      },
      {
        title: "4. Cache line 命中需要 index、tag、valid 與 offset 共同成立",
        paragraphs: [
          "CPU 提供 byte address 後，offset 選 line 內的 byte，index 選一個 set，tag 辨認該 set 中哪個 memory block。N-way set-associative cache 對同 set 的 N 個 valid tags 平行比較；恰有 matching valid line 才是 hit，再由 way-select 與 offset 取出 data。valid=0 時，即使殘留 tag bits 相同也不能命中。",
          "cache data capacity 通常只算 data arrays，不含 metadata。每 line 至少有 tag 與 valid；write-back cache 還要 dirty；replacement policy 可能需要 per-set state；可靠性設計也可能加入 parity/ECC。宣稱 32 KiB L1 不代表晶片只配置 32 KiB bits，實際 arrays 還包括 metadata、ports 與控制結構。",
          "hit/miss 是對特定 access size 與 cache state 的判斷。跨越 line boundary 的 unaligned access 可能拆成兩個 cache accesses；instruction cache 與 data cache 也可能有不同 state。分析表格若沒有 initial valid bits、block size、mapping 與 policy，就無法唯一決定結果。"
        ],
        figure: {
          type: "flow",
          title: "Set-associative cache read 的證據鏈",
          items: ["byte address", "offset / index / tag", "select one set", "compare N valid tags", "select matching way", "offset selects bytes", "return data"],
          caption: "index 只縮小搜尋範圍；tag match 還必須和 valid 一起成立，offset 不參與 tag comparison。"
        },
        sourceRefs: ["S3", "S5", "S6", "S7"]
      },
      {
        title: "5. 位址切割從 data capacity、block size 與 ways 推導",
        paragraphs: [
          "令 data capacity=C bytes、block size=B bytes、associativity=A。line count=C/B，set count=S=C/(B×A)。byte-addressed、power-of-two 設計中，offset bits=log2 B，index bits=log2 S，tag bits=address width−index−offset。ways 不額外占 address bits；它表示同一 index 下有 A 個 candidate lines。",
          "以 32 KiB、64-byte、4-way、32-bit address 為例，lines=32768/64=512，sets=512/4=128。offset=6 bits，index=7 bits，tag=19 bits。address 0x12345678 的 offset 是 0x38=56，index 是 89，tag 是 0x91A2。重建時 (tag<<13)|(index<<6)|offset 必須回到原 address。",
          "若題目問總 storage，還要加入 metadata。上述 cache 有 512 lines；若每 line 有 19-bit tag、valid 與 dirty，共 21 bits，另用每 set 3-bit tree pseudo-LRU，metadata=512×21+128×3=11136 bits=1392 bytes。這仍未計 ECC、banking 與 implementation overhead。"
        ],
        figure: {
          type: "bits",
          title: "32 KiB、64 B block、4-way cache 的 32-bit address",
          totalBits: 32,
          items: [
            { label: "Tag [31:13]", bits: 19, detail: "辨認 memory block" },
            { label: "Index [12:6]", bits: 7, detail: "選 128 sets 之一" },
            { label: "Offset [5:0]", bits: 6, detail: "選 64-byte line 內位置" }
          ],
          caption: "sets=C/(B×A)=128；address bits 由 tag、index、offset 完整分割，19+7+6=32。"
        },
        sourceRefs: ["S5", "S6", "S7"]
      },
      {
        title: "6. Placement 與 replacement：候選位置越多，選擇成本越高",
        paragraphs: [
          "direct-mapped cache 是 1-way，每個 block 只有一個 candidate line，hit path 簡單但容易 conflict。fully associative 沒有 index，block 可放任何 line，需比較所有 candidate tags。N-way set-associative 在兩者之間：block 由 index 固定到一個 set，再放入該 set 任一 way。",
          "當 set 有 invalid way 時不需 evict；全滿後才依 replacement policy 選 victim。LRU 依最近使用順序，FIFO 依進入順序，random 不維護完整歷史。true LRU 在高 associativity 下需較多 state 與更新，實作常採 pseudo-LRU。policy 對某一 trace 較好，不代表對所有 traces 最佳。",
          "3C model 將 miss 分為 compulsory、capacity、conflict。首次碰 block 是 compulsory；若同容量 fully associative cache 也 miss，且不是首次，就是 capacity；只有受限 mapping 才 miss則是 conflict。multi-core 還可能因 coherence invalidation 產生額外 misses，因此 3C 是基礎分類而非所有現代事件的完整清單。"
        ],
        figure: {
          type: "matrix",
          title: "Cache placement 與硬體工作",
          columns: ["Organization", "一個 block 的 candidates", "Tag comparisons", "需要 replacement?", "典型取捨"],
          rows: [
            ["Direct-mapped", "1 line", "1", "無選擇", "fast hit、conflict 較多"],
            ["4-way set associative", "selected set 的 4 ways", "4", "set full 時", "常見折衷"],
            ["Fully associative", "all lines", "all candidates", "full 時", "conflict 最少、成本最高"]
          ],
          caption: "associativity 增加 placement flexibility，但 comparator、way mux、replacement state 與 hit latency 也可能增加。"
        },
        sourceRefs: ["S5", "S6", "S7", "S8"]
      },
      {
        title: "7. Write policy 必須分開回答 hit 與 miss",
        paragraphs: [
          "write-through 在 write hit 時同時更新 cache 與下一層，lower level 較快保持最新，但每次 store 都產生下層 traffic，通常需要 write buffer 隔開 CPU。write-back 只更新 cache line 並設 dirty；dirty victim 被替換時才整 line 寫回，可合併同 line 多次 stores，但 miss penalty 可能包含 write-back。",
          "write-allocate 在 write miss 時先把整個 line 載入 cache，再修改 target bytes，適合期待後續 reuse，常和 write-back 配對。no-write-allocate（write-around）讓 miss write 直接送下層，不填入 cache，避免一次性 writes 污染 cache，常和 write-through 配對。這些是常見組合，不是 ISA 強制綁定。",
          "partial store 需要 byte enables 或 read-modify-write，multi-core 還要取得 coherent ownership。dirty bit 只表示 cache copy 比下一層新，不代表資料已持久化到 storage；store instruction 完成、cache line 寫回 DRAM、persistent device 完成寫入是三個不同完成邊界。"
        ],
        figure: {
          type: "matrix",
          title: "Write hit / miss 的四個決策",
          columns: ["Policy", "Write hit", "Write miss", "Traffic 特性", "必要 metadata"],
          rows: [
            ["Write-through + no-allocate", "cache 與 lower 更新", "繞過 cache", "每次 store 下送", "write buffer 常見"],
            ["Write-through + allocate", "兩層更新", "fill 後更新", "miss 多 line fill", "write buffer 常見"],
            ["Write-back + allocate", "cache 更新、dirty=1", "fill 後更新", "dirty eviction 才整 line 下送", "dirty bit"],
            ["Write-back + no-allocate", "hit line dirty", "miss 繞過", "可行但較少見", "dirty bit + bypass"]
          ],
          caption: "write propagation 與 miss allocation 是兩個正交問題；完整答案要同時描述 hit、miss 與 eviction。"
        },
        sourceRefs: ["S1", "S8"]
      },
      {
        title: "8. AMAT 是條件成本的展開，不是只代一條公式",
        paragraphs: [
          "單層 AMAT=hit time+miss rate×miss penalty，其中 miss penalty 應明確定義為完成 hit check 之外的額外成本。hit time 每次 access 都支付，miss penalty 只在 miss 路徑支付。若採用『miss total time』而非額外 penalty，公式要改寫為 hit rate×hit time+miss rate×miss total time，不能混用兩種定義。",
          "兩層 AMAT=T1+m1×(T2+m2×TM)，m2 是以 L1 misses 為分母的 L2 local miss rate。到達 memory 的 global miss rate=m1×m2。若把 L2 local miss rate直接加到 L1 miss rate，會把根本未送到 L2 的 requests 也算進去。",
          "cache 對 CPU time 的影響可轉為 CPI。instruction miss stall=每條 instruction 的 I-access×I-miss rate×penalty；data miss stall=data accesses per instruction×D-miss rate×penalty。memory-level parallelism 可能重疊部分 miss latency，但基礎 blocking model 先假設每個 penalty 都完全形成 stall，並清楚標示這項假設。"
        ],
        figure: {
          type: "flow",
          title: "兩層 cache 的條件機率樹",
          items: ["pay L1 hit time", "L1 miss with m1", "pay L2 hit time", "L2 local miss with m2", "pay memory penalty"],
          caption: "每向下一層的成本只乘上到達該層的機率；memory path probability 是 m1×m2。"
        },
        sourceRefs: ["S4", "S5", "S9"]
      },
      {
        title: "9. 程式存取順序會改變 miss rate，但不改變演算法答案",
        paragraphs: [
          "row-major matrix 的同一 row elements 在 memory 中連續。先走 row、再走 column 通常形成 unit stride；反過來走 column 可能每次跨越整個 row，降低 line utilization。兩種 traversal 可計算相同數學結果，卻產生不同 cache trace、TLB footprint 與 DRAM row behavior。",
          "loop interchange、blocking/tiling 與 structure layout 是常見 locality transformations。matrix multiplication 以 tiles 工作，可讓一小塊 A/B/C 在 cache 中多次重用後再移到下一 tile；收益取決於 tile working set 是否 fits、associativity conflicts、compiler vectorization 與 extra loop overhead。",
          "prefetch 利用可預測 address stream 提前搬 line，可隱藏 latency 但不降低必須傳輸的 bytes；過早、錯誤或過多 prefetch 會占 bandwidth 並驅逐有用 data。cache-friendly 不等於盲目增加 block size或 prefetch distance，仍要以 miss、traffic、runtime 與 energy measurement 驗證。"
        ],
        figure: {
          type: "matrix",
          title: "8×8 row-major int matrix、64-byte line 的 traversal",
          columns: ["Loop order", "相鄰 access distance", "一個 line 涵蓋", "預期行為"],
          rows: [
            ["for i, then j", "4 bytes", "兩個完整 rows", "high line utilization"],
            ["for j, then i", "32 bytes", "每 line 只交錯用部分 elements", "較多 active lines"],
            ["blocked", "tile 內多為小 stride", "tile working set 重用", "降低 capacity traffic 的機會"]
          ],
          caption: "此例一 row=8×4=32 bytes，所以 64-byte line 可含兩 rows；實際 alignment 會影響邊界。"
        },
        sourceRefs: ["S5", "S9", "S12"]
      },
      {
        title: "10. Paging 保留 page offset，只重新映射 page number",
        paragraphs: [
          "virtual memory 讓每個 process 使用 virtual addresses，再由 MMU 轉成 physical addresses。固定 page size=2^p bytes 時，virtual address 分成 VPN 與 p-bit page offset；page table 將 VPN 映射到 PPN，physical address 由 PPN 與原 offset 串接。offset 不翻譯，因為 virtual page 與 physical frame 大小相同。",
          "32-bit VA、4 KiB pages 有 12-bit offset 與 20-bit VPN，共 2^20 virtual pages。VA 0x12345ABC 的 VPN=0x12345、offset=0xABC；若 PTE 給 PPN=0x2ABCD，PA=0x2ABCDABC。page size 增大會增加 offset bits、減少 page count 和 TLB pressure，但也可能增加 internal fragmentation 與 fault transfer。",
          "paging 允許不連續 virtual pages 放到任意 free frames，提供 relocation、isolation、sharing 與 demand allocation。兩個 processes 可把不同 VPN 映到同一 read-only physical frame 共享 library code；也可把相同 VA 映到不同 frames，讓彼此看見獨立 address space。"
        ],
        figure: {
          type: "flow",
          title: "Virtual address 到 physical address",
          items: ["VA = VPN | offset", "lookup PTE(VPN)", "check valid / permissions", "obtain PPN", "PA = PPN | same offset", "access cache / memory"],
          caption: "translation 改變 page number，不改變 page offset；permission check 是形成合法 physical access 的一部分。"
        },
        sourceRefs: ["S2", "S6", "S13", "S14"]
      },
      {
        title: "11. Multi-level page table 與 TLB：減少容量與常見翻譯延遲",
        paragraphs: [
          "single-level page table 若每個 VPN 都有 PTE，32-bit VA、4 KiB page、4-byte PTE 需要 2^20×4=4 MiB per process，即使大部分 address space 未使用。multi-level page table 把 VPN 分段；只有某個 virtual region 實際使用時才配置下一層 table，讓大洞只需上層 invalid entry。代價是 TLB miss 時可能需要多次 memory reads 完成 page walk。",
          "TLB 是 address translations 的小型 associative cache，entry 保存 VPN→PPN、permissions、valid，常含 ASID/PCID 區分 address spaces。TLB hit 可直接取得 translation；TLB miss 進行 hardware/software page-table walk，找到 valid PTE 後 refill。TLB miss 不表示 page 不在 DRAM，也不等於 page fault。",
          "以 RISC-V Sv32 為具體模型，32-bit VA 切成 VPN[1] 10 bits、VPN[0] 10 bits、offset 12 bits；兩層 table 各 1024 個 4-byte PTE，恰為 4 KiB page。PTE 的 V/R/W/X 等 bits 同時描述 validity 與 permissions。specification 定義 translation behavior，但 TLB size/replacement 通常屬 implementation。"
        ],
        figure: {
          type: "bits",
          title: "RISC-V Sv32 virtual address",
          totalBits: 32,
          items: [
            { label: "VPN[1]", bits: 10, detail: "index root page table" },
            { label: "VPN[0]", bits: 10, detail: "index next-level table" },
            { label: "Page offset", bits: 12, detail: "4 KiB page 內 byte" }
          ],
          caption: "每層 10-bit index 選 1024 PTEs；offset 在 translation 前後保持不變。"
        },
        sourceRefs: ["S13", "S14", "S15"]
      },
      {
        title: "12. Page fault、replacement、protection fault 與 segmentation",
        paragraphs: [
          "page-table walk 找到 present/valid mapping 才能形成 PA。若 mapping 合法但 page 尚未 resident，page fault trap 讓 OS 配置 free frame 或選 victim；dirty victim 可能先寫回 storage，再讀入所需 page、更新 PTE/TLB，最後重新執行 faulting instruction。fault service 的巨大 latency 使極低 fault probability 仍可能主宰 average time。",
          "protection fault 與 not-present fault 都可能由 memory access 觸發 exception，但原因不同。R/W/X permission 不允許目前 operation 時，不能靠把 page 從 storage 載入就修復；OS 通常回報錯誤或依 copy-on-write 等既定機制建立新 mapping。valid/present、dirty、accessed/reference 與 permissions 是不同狀態，不應壓成單一 hit bit。",
          "segmentation 以 variable-size logical regions 的 base、limit 與 protection 形成 address，能直接表達 code/data/stack 等語意，但外部碎片與 placement 較複雜。paging 使用 fixed-size pages，避免外部碎片但有 page 內浪費。部分歷史系統結合 segmentation 與 paging；現代一般 purpose systems 的主要 address translation 通常以 paging 為核心。"
        ],
        figure: {
          type: "matrix",
          title: "三種 translation outcome",
          columns: ["Outcome", "Translation state", "處理路徑", "可否重試 instruction"],
          rows: [
            ["TLB miss, page present", "TLB 無 entry；PTE valid", "page walk + TLB refill", "可以"],
            ["Page fault", "PTE not present / demand state", "OS 配 frame、I/O、更新 mapping", "處理成功後可以"],
            ["Protection fault", "mapping 存在但 permission 不符", "OS exception policy", "通常不可，除非 COW 等合法機制"],
            ["Cache miss", "PA 已形成、line 不在 cache", "hardware line fill", "不是 architectural retry trap"]
          ],
          caption: "translation、residency、permission 與 data cache state 是四個判斷層次；名稱相似不代表處理成本相同。"
        },
        sourceRefs: ["S2", "S6", "S13", "S14", "S15"]
      },
      {
        title: "13. TLB、cache 與多核心一致性形成完整 memory access path",
        paragraphs: [
          "一般 physically addressed cache path 先以 VA 查 TLB 得 PA，再以 PA 的 index/tag 查 cache。為縮短 L1 hit path，VIPT cache 可用不經 translation 的 page-offset bits先 index，同時查 TLB，之後以 physical tag 比對；cache geometry 必須避免 virtual aliases 造成不一致。這是 microarchitecture timing optimization，不改變程式的 VA→PA contract。",
          "TLB 保存 translations，cache 保存 instructions/data copies，page table 保存 authoritative mappings。context switch 可能切換 page-table root；ASID 可讓不同 address spaces 的 TLB entries 共存。當 OS 修改 mapping，需要依 ISA 規則同步 page-table update、translation cache invalidation 與 execution ordering，不能只改 memory 中 PTE 就假設所有 cores 立即看見。",
          "多核心還需要 cache coherence，確保同一 physical block 的 writable copies 依 protocol 取得 ownership 並傳播 invalidation/update。coherence 不等於 consistency：coherence 處理單一 address 的 copies，memory consistency 規定不同 addresses 的可觀察 ordering。基礎 cache mapping 題可假設單核心，但把結果外推到共享 memory 前必須加入這兩層規則。"
        ],
        figure: {
          type: "flow",
          title: "一次 load 的整合路徑",
          items: ["instruction forms VA", "TLB lookup", "permission check / PA", "L1 tag + data", "lower cache levels", "memory controller / DRAM", "return value"],
          caption: "TLB miss 走 page table；cache miss 走 lower memory hierarchy；page fault 才由 OS 建立 residency，三條 slow path 不同。"
        },
        sourceRefs: ["S2", "S9", "S13", "S14", "S15"]
      }
    ],
    workedExamples: [
      {
        title: "例題一：完整推導 cache address fields 與 metadata",
        prompt: "32-bit byte address、32 KiB data cache、64-byte blocks、4-way、write-back。求 lines、sets、tag/index/offset，並切割 address 0x12345678。",
        steps: [
          "data capacity C=32 KiB=32768 bytes；block B=64 bytes；ways A=4。",
          "lines=C/B=32768/64=512；sets=lines/A=512/4=128。",
          "offset bits=log2 64=6；index bits=log2 128=7；tag bits=32−6−7=19。",
          "offset=address & 0x3F=0x38=56。",
          "index=(address>>6)&0x7F=89；tag=address>>13=0x91A2。",
          "回算 (0x91A2<<13)|(89<<6)|56=0x12345678，欄位切割一致。",
          "若每 line 有 19-bit tag、valid、dirty，另每 set 3-bit tree PLRU，metadata=512×21+128×3=11136 bits=1392 bytes。"
        ],
        result: "512 lines、128 sets、19/7/6-bit tag/index/offset；0x12345678 對應 tag 0x91A2、set 89、offset 56。"
      },
      {
        title: "例題二：逐筆模擬 direct-mapped cache",
        prompt: "空的 direct-mapped cache 有 4 lines、每 block 4 bytes。依序讀 byte addresses 0,4,8,0,16,4,20,0，求 hit/miss。",
        steps: [
          "先除以 block size 得 block numbers：0,1,2,0,4,1,5,0；line index=block mod 4。",
          "block 0→line0 miss；block 1→line1 miss；block 2→line2 miss，三個 valid tags 建立。",
          "再次 block 0 查 line0、tag 相同，hit。",
          "block 4 也映 line0，但 tag 不同，miss 並 evict block 0。",
          "block 1 仍在 line1，hit。",
          "block 5 映 line1，miss 並 evict block 1。",
          "最後 block 0 映 line0，但 line0 現為 block 4，因此 miss。",
          "總 hits=2、misses=6，hit rate=2/8=25%。"
        ],
        result: "M,M,M,H,M,H,M,M；direct mapping 使 blocks 0/4 與 1/5 分別衝突。"
      },
      {
        title: "例題三：同一 trace 比較 LRU 與 FIFO",
        prompt: "一個 2-way set 已滿／空間可容兩 blocks，依序 access blocks 0,2,0,4,2,0；所有 blocks 映到同 set。比較 LRU 與 FIFO。",
        steps: [
          "LRU：0 miss、2 miss，set={0,2}；再 access 0 hit，使 2 成為 least recent。",
          "access 4 miss，LRU evict 2，set={0,4}；access 2 miss，evict 0；最後 0 miss。LRU 只有 1 hit。",
          "FIFO：0 miss、2 miss，進入順序 0 oldest、2 newest；access 0 hit 不改 FIFO order。",
          "access 4 miss，FIFO evict 最早進入的 0，set={2,4}。",
          "access 2 hit；最後 access 0 miss，evict 2。FIFO 有 2 hits。",
          "這個短 trace 中 FIFO 比 LRU 多一個 hit，證明 policy 沒有對所有 traces 的固定勝負。"
        ],
        result: "LRU hit rate=1/6；FIFO hit rate=2/6。replacement 必須依完整 trace 模擬。"
      },
      {
        title: "例題四：比較 write-through 與 write-back traffic",
        prompt: "CPU 對 cache-resident 4-byte words 執行 1000 次 stores。write-through 每次下送 4 bytes；write-back 期間發生 40 次 dirty 64-byte line evictions。忽略 write misses 與 protocol overhead，比較下層 data traffic。",
        steps: [
          "write-through 每次 store 更新 lower level，traffic=1000×4=4000 bytes。",
          "write-back 在 hit 時只改 cache 並設 dirty，不因每次 store 立即下送。",
          "40 個 dirty victims 各寫回完整 64-byte line，traffic=40×64=2560 bytes。",
          "此假設下 write-back 少 4000−2560=1440 bytes，也就是 36%。",
          "結果不是普遍比例：若 stores 分散到大量 lines、頻繁 dirty eviction，write-back traffic 可增加。",
          "write buffer、coherence messages、read-for-ownership 與 final flush 未列入，因此結論只適用題目邊界。"
        ],
        result: "指定假設下 write-through 4000 B、write-back 2560 B；write-back 合併了同 line 的多次修改。"
      },
      {
        title: "例題五：兩層 AMAT 與 global miss rate",
        prompt: "L1 hit time=1 cycle、L1 miss rate=5%；L2 hit time=8 cycles、L2 local miss rate=10%；memory penalty=100 cycles。求 AMAT 與到達 memory 的 global rate。",
        steps: [
          "先固定條件：L2 的 10% 只以 L1 misses 為分母。",
          "發生 L1 miss 後的條件成本=8+0.10×100=18 cycles。",
          "平均 L1 miss contribution=0.05×18=0.9 cycle。",
          "AMAT=1+0.9=1.9 cycles。",
          "memory global access rate=0.05×0.10=0.005=0.5%。",
          "若把 5%+10% 當 memory rate 會錯，因為 95% L1 hits 根本不查 L2。"
        ],
        result: "AMAT=1.9 cycles；每 1000 次 L1 accesses 平均 5 次到達 memory。"
      },
      {
        title: "例題六：把 instruction/data misses 轉成 CPI",
        prompt: "base CPI=1；每條 instruction 有一次 I-cache access，I-miss rate=2%；平均 data accesses/instruction=0.30，D-miss rate=4%；兩者 penalty 都是 50 cycles。假設 blocking 且無重疊，求 CPI。",
        steps: [
          "I-miss stall/instruction=1×0.02×50=1.0 cycle。",
          "D-miss frequency/instruction=0.30×0.04=0.012。",
          "D-miss stall/instruction=0.012×50=0.6 cycle。",
          "total memory stall CPI=1.0+0.6=1.6。",
          "total CPI=base 1+stall 1.6=2.6。",
          "CPU time 若 clock 與 instruction count 固定，會相對 base model 增為 2.6 倍；實際 nonblocking cache 可能重疊部分 penalty。"
        ],
        result: "blocking model 下 CPI=2.6，其中 I-cache stalls 佔 1.0、D-cache stalls 佔 0.6。"
      },
      {
        title: "例題七：32-bit paging address translation",
        prompt: "32-bit virtual address 0x12345ABC、4 KiB pages；PTE 將 VPN 映到 PPN 0x2ABCD。求 VPN、offset 與 physical address。",
        steps: [
          "4 KiB=2^12 bytes，因此 page offset 是低 12 bits，VPN 是高 20 bits。",
          "VPN=0x12345ABC>>12=0x12345。",
          "offset=0x12345ABC&0xFFF=0xABC。",
          "PTE lookup 以 VPN 0x12345 取得 PPN 0x2ABCD，並先檢查 valid/permissions。",
          "PA=(0x2ABCD<<12)|0xABC=0x2ABCDABC。",
          "offset 0xABC 在 VA 與 PA 完全相同，只有 page number 被替換。"
        ],
        result: "VPN=0x12345、offset=0xABC、PA=0x2ABCDABC。"
      },
      {
        title: "例題八：Sv32 兩層 page-table indices",
        prompt: "將 Sv32 virtual address 0xCAFEBABE 切成 VPN[1]、VPN[0] 與 12-bit offset。",
        steps: [
          "Sv32 format 是 10-bit VPN[1]、10-bit VPN[0]、12-bit offset。",
          "offset=VA&0xFFF=0xABE=2750。",
          "VPN[0]=(VA>>12)&0x3FF=0x3EB=1003。",
          "VPN[1]=(VA>>22)&0x3FF=0x32B=811。",
          "root table 先用 index 811 選 PTE；若它指向 next level，再用 index 1003 選 leaf PTE。",
          "leaf PTE 提供 PPN/permissions，最後和 offset 0xABE 串接；沒有 leaf PTE 資料時不能猜 PA。"
        ],
        result: "VPN[1]=0x32B、VPN[0]=0x3EB、offset=0xABE。"
      },
      {
        title: "例題九：TLB miss 與 page fault 的平均成本",
        prompt: "TLB lookup=1 ns、memory access=100 ns、TLB hit rate=95%；TLB miss 需額外一次 100 ns single-level page-table read。另 page-fault probability=10^-6、extra service penalty=5 ms。分別計算不含 page fault 的 translation+memory EAT，以及加入 fault penalty 後的量級。",
        steps: [
          "TLB hit path=1+100=101 ns。",
          "TLB miss 但 page present path=1+100(PTE)+100(data)=201 ns。",
          "不含 page fault EAT=0.95×101+0.05×201=106 ns。",
          "5 ms=5,000,000 ns。",
          "page-fault average extra=10^-6×5,000,000=5 ns。",
          "加入題目獨立 fault model 後約為 106+5=111 ns。",
          "若 fault probability 提高到 10^-4，extra 會變 500 ns，立刻超過正常 translation/access 成本。"
        ],
        result: "TLB/page-table EAT=106 ns；加入 10^-6 fault probability 後約 111 ns。低機率事件仍因巨大 penalty 影響平均值。"
      }
    ],
    misconceptions: [
      ["Cache 容量就是晶片為 cache 配置的全部 bits。", "標示容量通常只算 data；tag、valid、dirty、replacement、ECC 與 ports 都是額外成本。"],
      ["ways 需要另外從 address 取 log2(ways) 個 bits。", "index 選 set；同 set 的 ways 以 tag comparisons 決定，不由 address 直接選 way。"],
      ["valid=1 就代表 cache hit。", "還必須 index 到正確 set 並有 matching tag；valid 只表示該 entry 可參與比較。"],
      ["block 越大一定越能提高 hit rate。", "過大 block 會減少 line count、增加 conflict/capacity pressure、pollution 與 miss penalty。"],
      ["LRU 對每一個 trace 都優於 FIFO 或 random。", "LRU 利用 temporal locality，但特定 trace 可能讓 FIFO 命中更多；高 ways 的 exact LRU 也有成本。"],
      ["Write-back 表示資料已寫到 persistent storage。", "它只表示 modified line 延後寫到下一 memory level；持久化還有 memory controller 與 storage 邊界。"],
      ["L2 miss rate 可直接和 L1 miss rate相加。", "L2 local rate 以 L1 misses 為分母；到 memory 的 global rate通常是兩者相乘。"],
      ["TLB 保存最近使用的程式資料。", "TLB cache 的是 VPN→PPN translations/permissions；data cache 才保存程式 data copies。"],
      ["TLB miss 就是 page fault。", "TLB miss 可由 valid page-table entry refill；只有 page 不 resident或 mapping 狀態要求 OS 時才 fault。"],
      ["Physical address 的 offset 由 page table重新計算。", "同 page size 下 page offset 原樣保留，page table只替換 VPN 為 PPN。"],
      ["Virtual memory 只用來讓程式超過 DRAM 容量。", "它同時提供 relocation、isolation、permission、sharing、copy-on-write 與 sparse address spaces。"],
      ["Cache coherence 已經定義所有多執行緒 memory ordering。", "coherence 聚焦單一 block/address 的 copies；consistency model 才規定跨 addresses 的 ordering。"]
    ],
    exercises: [
      { level: "基礎", question: "說明 SRAM 為何常用於 cache、DRAM 為何常用於 main memory。", solution: ["SRAM 不需 refresh、latency 低，但 cell 面積與 cost/bit 較高，適合小而快的 on-chip cache。", "DRAM cell 密度高、capacity/cost 較適合 main memory，但需 refresh 且 access 受 row/bank timing 影響。"] },
      { level: "基礎", question: "64-byte cache line 可容納多少個 4-byte integers？", solution: ["64/4=16 個 integers。", "只有 address 與 line boundary 對齊時，連續 16 elements 才恰在同一 line；跨界時會分到兩 lines。"] },
      { level: "基礎", question: "8 KiB direct-mapped cache、32-byte blocks 共有多少 lines？offset 與 index 各幾 bits？", solution: ["lines=8192/32=256。", "offset=log2 32=5 bits；direct-mapped 有 256 sets，index=log2 256=8 bits。"] },
      { level: "基礎", question: "hit rate=96% 時 miss rate 為何？10000 次 accesses 平均幾次 misses？", solution: ["miss rate=1−0.96=0.04=4%。", "10000×0.04=400 次 misses。"] },
      { level: "基礎", question: "區分 cache line 的 valid bit 與 dirty bit。", solution: ["valid 表示 line 目前包含可用 mapping/data，可參與 tag hit 判斷。", "dirty 表示 write-back line 已修改、比下一層新，eviction 前需要寫回。"] },
      { level: "核心", question: "64 KiB cache、64-byte blocks、8-way、36-bit physical addresses，求 lines、sets、offset/index/tag bits。", solution: ["lines=65536/64=1024；sets=1024/8=128。", "offset=6、index=7、tag=36−6−7=23 bits。"] },
      { level: "核心", question: "direct-mapped cache 有 8 sets、16-byte blocks。byte address 0x12C 的 block number、set index、offset 為何？", solution: ["block number=floor(0x12C/16)=0x12=18；offset=0xC=12。", "set index=18 mod 8=2；tag 若需要則為 floor(18/8)=2。"] },
      { level: "核心", question: "L1 hit=2 cycles、miss rate=3%、memory extra penalty=80 cycles，求單層 AMAT。", solution: ["miss contribution=0.03×80=2.4 cycles。", "AMAT=2+2.4=4.4 cycles；這裡 80 是 hit check 之外的 extra penalty。"] },
      { level: "核心", question: "L1 miss rate=8%，L2 local miss rate=25%。求 L2 global access rate 與 memory global rate。", solution: ["所有 L1 accesses 中有 8% 到達 L2，所以 L2 global access rate=8%。", "其中 25% 再 miss，memory global rate=0.08×0.25=0.02=2%。"] },
      { level: "核心", question: "write-back cache 替換 clean line 與 dirty line 時，下層 traffic 有何不同？", solution: ["clean line 和下一層相同，不需先寫回；miss fill 只需讀入新 line。", "dirty line 必須先或並行安排完整 modified line 寫回，再完成新 line fill；penalty/traffic 較大。"] },
      { level: "核心", question: "32-bit VA、8 KiB pages 時 VPN 與 offset 各幾 bits？dense page table 有多少 entries？", solution: ["8 KiB=2^13，所以 offset=13 bits、VPN=32−13=19 bits。", "dense table 有 2^19=524288 entries。"] },
      { level: "核心", question: "VA=0x00ABCDEF、4 KiB pages，求 VPN 與 offset。", solution: ["VPN=VA>>12=0x00ABC；前導零可省略為 0xABC。", "offset=VA&0xFFF=0xDEF。"] },
      { level: "進階", question: "32-bit VA、4 KiB pages、4-byte PTE 的 single-level dense page table 多大？", solution: ["virtual pages=2^(32−12)=2^20。", "size=2^20×4 bytes=2^22 bytes=4 MiB per page table。"] },
      { level: "進階", question: "Sv32 address 0xCAFEBABE 的 VPN[1]、VPN[0]、offset 為何？", solution: ["VPN[1]=(VA>>22)&0x3FF=0x32B；VPN[0]=(VA>>12)&0x3FF=0x3EB。", "offset=VA&0xFFF=0xABE；10+10+12=32 bits。"] },
      { level: "進階", question: "TLB lookup=1 ns、memory=80 ns、TLB hit=90%，miss 時多一次 memory PTE read；page 均 present。求 EAT。", solution: ["hit path=1+80=81 ns；miss path=1+80+80=161 ns。", "EAT=0.9×81+0.1×161=89 ns。"] },
      { level: "進階", question: "page-fault extra penalty=2 ms、fault probability=10^-5。它對每次 access 的平均額外成本是多少 ns？", solution: ["2 ms=2,000,000 ns。", "average extra=10^-5×2,000,000=20 ns；必須和正常 access latency 相加。"] },
      { level: "挑戰", question: "32 KiB、64-byte、4-way、32-bit cache，每 line 有 tag/valid/dirty，另每 set 3-bit tree PLRU。metadata 共多少 bytes？", solution: ["sets=128、lines=512、tag=19 bits；per-line metadata=19+1+1=21 bits。", "total=512×21+128×3=11136 bits=1392 bytes；未含 ECC 與實作 overhead。"] },
      { level: "挑戰", question: "base CPI=0.8；I-miss rate=1%、penalty=40；data accesses/instruction=0.25、D-miss rate=6%、penalty=60。blocking model 的 CPI 為何？", solution: ["I stall=1×0.01×40=0.4；D stall=0.25×0.06×60=0.9。", "total CPI=0.8+0.4+0.9=2.1；若 misses 可重疊，需另給 overlap 模型。"] }
    ],
    glossary: [
      ["Memory hierarchy", "以多層不同 capacity/latency/cost technology 提供接近上層平均速度的系統。"],
      ["SRAM", "以穩定電路狀態保存 bit、無需 refresh、常用於 cache 的 volatile memory。"],
      ["DRAM", "以 capacitor charge 保存 bit、需要 refresh、常用於 main memory 的 volatile memory。"],
      ["Temporal locality", "近期被存取的 item 在不久後再次被使用的傾向。"],
      ["Spatial locality", "某 address 被存取後，鄰近 addresses 很快被使用的傾向。"],
      ["Working set", "一段執行期間內持續活躍、需要保留以獲得 reuse 的 blocks/pages 集合。"],
      ["Cache line", "cache 與下一層間搬移及配置的固定大小 data block。"],
      ["Tag", "辨認 indexed set 中 cache line 對應哪個 memory block 的 address 高位。"],
      ["Index", "從 direct/set-associative cache 選出一個 set 的 address bits。"],
      ["Block offset", "選擇 cache line 內 byte/word 的低位 address bits。"],
      ["Associativity", "同一 memory block 在 cache 中可選 candidate lines 的數量。"],
      ["Compulsory miss", "某 block 在 reference history 中第一次被要求而發生的 miss。"],
      ["Capacity miss", "即使 fully associative，相同總容量仍因 working set 過大而發生的非首次 miss。"],
      ["Conflict miss", "因受限 mapping 碰撞、但相同容量 fully associative 本可命中的 miss。"],
      ["Write-through", "cache write 同時更新下一層的 propagation policy。"],
      ["Write-back", "cache write 只設 dirty，直到 eviction 等事件才把 line 寫回下一層。"],
      ["Write-allocate", "write miss 時先把 target line fill 到 cache 再修改。"],
      ["AMAT", "Average Memory Access Time，以各層條件機率加權的平均 access latency。"],
      ["Local miss rate", "以真正到達該 cache level 的 accesses 為分母計算的 miss rate。"],
      ["Global miss rate", "以最上層所有 memory accesses 為分母，最後在某層 miss 的比例。"],
      ["Virtual address", "process/ISA 產生、在存取 physical memory 前需要 translation 的 address。"],
      ["Physical address", "完成 translation 後用來選 physical cache/memory location 的 address。"],
      ["Page", "virtual memory 中固定大小的 mapping/transfer unit；physical 對應稱 page frame。"],
      ["VPN / PPN", "Virtual Page Number 與 Physical Page Number，page table 映射的兩端。"],
      ["Page table entry", "保存 PPN、valid/present、permissions、accessed/dirty 等 translation state 的 entry。"],
      ["TLB", "Translation Lookaside Buffer，cache 最近使用的 address translations 與 permissions。"],
      ["Page fault", "translation/residency 狀態要求 OS 介入處理的 synchronous exception。"],
      ["Segmentation", "以 variable-size logical segment 的 base、limit、protection 形成 address 的方法。"],
      ["ASID", "Address Space Identifier，使不同 address spaces 的 translations 可在 TLB 中區分。"],
      ["Cache coherence", "多核心維持同一 physical block 多份 cache copies 一致性的機制。"]
    ],
    sources: [
      { key: "S1", title: "MIT 6.004: Caches and the Memory Hierarchy", url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c14/", accessed: "2026-08-20", use: "SRAM/DRAM、locality、direct/associative cache、block size、conflict 與 write strategies 的公開課程基礎。" },
      { key: "S2", title: "MIT 6.004: Virtual Memory Annotated Slides", url: "https://live.ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c16/c16s1/", accessed: "2026-08-20", use: "paging、page map、TLB、page fault、protection、multi-level translation 與 cache/MMU 整合。" },
      { key: "S3", title: "UC Berkeley CS61C: Memory Hierarchy, Revisited", url: "https://notes.cs61c.org/content/caches-intro/memory-hierarchy/", accessed: "2026-08-20", use: "memory hierarchy、cache levels、locality 與 block transfer 的現行課程脈絡。" },
      { key: "S4", title: "UC Berkeley CS61C: Average Memory Access Time", url: "https://notes.cs61c.org/content/caches-intro/amat/", accessed: "2026-08-20", use: "hit time、miss rate、miss penalty 與 multi-level AMAT 定義。" },
      { key: "S5", title: "Cornell CS3410 Spring 2026: Caches", url: "https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/caches.html", accessed: "2026-08-20", use: "2026 cache mapping、3C classification、replacement、block-size tradeoff 與 AMAT 公開教材。" },
      { key: "S6", title: "Cornell CS3410 Spring 2026: Virtual Memory", url: "https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/vm.html", accessed: "2026-08-20", use: "2026 paging、4 KiB address split、page tables、replacement、sharing 與 multi-level tables。" },
      { key: "S7", title: "UC Berkeley CS61C: Direct-Mapped Cache", url: "https://notes.cs61c.org/content/caches-ii/direct-mapped/", accessed: "2026-08-20", use: "block number、tag/index/offset、hit procedure、direct mapping 與 hardware comparisons。" },
      { key: "S8", title: "UC Berkeley CS61C: Fully Associative Cache and Write Policies", url: "https://notes.cs61c.org/content/caches-ii/fully-associative/", accessed: "2026-08-20", use: "associative placement、write-through、write-back、dirty bit 與 replacement。" },
      { key: "S9", title: "Intel 64 and IA-32 Architectures Optimization Reference Manual", url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel64-and-ia32-architectures-optimization.html", accessed: "2026-08-20", use: "現代 cache hierarchy、memory latency/bandwidth、prefetch 與 locality optimization 的官方實務。" },
      { key: "S10", title: "IBM: What Is Primary Storage?", url: "https://www.ibm.com/think/topics/primary-storage", accessed: "2026-08-20", use: "register、cache、DRAM、SRAM 與 flash 在 primary storage hierarchy 中的速度、容量、揮發性與用途比較。" },
      { key: "S11", title: "Micron DDR5 SDRAM: New Features", url: "https://www.micron.com/content/dam/micron/global/public/products/white-paper/ddr5-new-features-white-paper.pdf", accessed: "2026-08-20", use: "DRAM banks、burst、refresh 與現代 DDR5 data movement 的官方技術背景。" },
      { key: "S12", title: "Intel: Loop Optimizations Where Blocks Are Required", url: "https://www.intel.com/content/www/us/en/developer/articles/technical/loop-optimizations-where-blocks-are-required.html", accessed: "2026-08-20", use: "loop blocking/tiling、working-set fit 與 cache reuse 的官方案例。" },
      { key: "S13", title: "RISC-V Supervisor-Level ISA: Sv32 Virtual Memory", url: "https://docs.riscv.org/reference/isa/priv/supervisor.html", accessed: "2026-08-20", use: "Sv32 10/10/12 address fields、two-level page tables、PTE V/R/W/X permissions 與 page-fault semantics。" },
      { key: "S14", title: "Linux Kernel Documentation: Page Tables", url: "https://docs.kernel.org/mm/page_tables.html", accessed: "2026-08-20", use: "hierarchical page tables、MMU、TLB/page-walk caches、page faults、dirty/permission state 與 huge pages。" },
      { key: "S15", title: "UC Berkeley CS61C: Page Table Design", url: "https://notes.cs61c.org/content/vm/page-table/", accessed: "2026-08-20", use: "page placement/replacement/write policy、PTE size、protection、per-process tables 與 hierarchical design。" }
    ]
  },
  {
    chapter: 7,
    title: "輸出入、儲存與現代裝置介面",
    english: "Input/Output, Storage, and Modern Device Interfaces",
    revised: "2026-08-21",
    readingTime: "約 230–280 分鐘",
    intro: "輸出入系統把處理器的同步指令世界連到速度、資料單位與故障模式各不相同的裝置。一次 I/O request 不是 CPU 對裝置做一次 load 就結束，而是經過 driver、device registers、command queue、interconnect、controller、DMA buffers 與 completion path；儲存 request 還要進入 HDD mechanical positioning 或 SSD flash translation。這條路徑同時牽涉 correctness、ordering、latency、throughput、CPU overhead 與 durability。本章以『誰發出命令、誰搬資料、誰宣告完成、完成到哪一層』追蹤 programmed I/O、interrupt、DMA、PCIe、NVMe、HDD、NAND SSD 與 RAID，並用可重算的模型辨認瓶頸與可靠性邊界。",
    outcomes: [
      "能分辨 device、controller、interconnect、driver 與 operating system 在 I/O request 中的責任。",
      "能追蹤 data、status、control register，並說明 port-mapped 與 memory-mapped I/O 的差異。",
      "能比較 polling、interrupt-driven I/O 與 DMA 的 CPU overhead、latency 與適用條件。",
      "能說明 interrupt pending、enable、priority、vector、context save、acknowledge 與 return 的狀態轉移。",
      "能追蹤 DMA descriptor、buffer ownership、IOVA、cache coherence 與 memory ordering。",
      "能區分 bus bandwidth、payload efficiency、transaction latency、queue depth、IOPS 與 throughput。",
      "能分解 HDD access time 為 seek、rotational latency、transfer 與 controller/queueing 成本。",
      "能說明 NAND page program、block erase、FTL、garbage collection、TRIM、wear 與 write amplification。",
      "能追蹤 NVMe submission/completion queue 與 doorbell，並說明 multi-queue 如何配合多核心與 SSD parallelism。",
      "能推導 RAID 0/1/5/6/10 的 usable capacity、fault tolerance、small-write penalty 與 rebuild 風險。",
      "能用 Little's Law、utilization 與 Amdahl's Law 分析 I/O 系統的平均成本與改善上限。"
    ],
    sections: [
      {
        title: "1. I/O 是跨越多個責任邊界的非同步交易",
        paragraphs: [
          "CPU 執行 load/store 與算術指令，但鍵盤、NIC、GPU 與 storage device 都有自己的時序和內部狀態。device controller 把實體訊號轉成 command、data 與 completion；driver 把 OS 的抽象 request 轉成該 controller 接受的格式；interconnect 則運送 address、payload 與控制訊息。device 與 controller 不是同義詞，同一 controller 也可能管理多個 media units。",
          "I/O request 通常經過 submit、queue、service、complete 四個階段。submit 只代表命令已被系統接受；controller completion 代表裝置完成到介面定義的邊界；application return 又可能晚於 interrupt、driver cleanup 與 scheduler wakeup。對 write 而言，controller cache、volatile buffer 與 persistent media 之間還有 durability 差異。",
          "同步 API 可以建立在非同步硬體之上：process 發出 request 後進入 blocked state，CPU 改執行其他 runnable process；completion 到達再喚醒原 process。因而『呼叫者等待』不等於『整顆 CPU 忙等』，而『DMA 自動搬移』也不等於 request 沒有 software cost。"
        ],
        figure: {
          type: "flow",
          title: "一次 block I/O request 的端到端路徑",
          items: ["application", "system call", "OS block layer", "device driver", "command queue", "controller", "media", "completion / wakeup"],
          caption: "每一站都可能加入排隊、轉換與錯誤處理；完成狀態必須說明是 queue、controller、media 或 application 邊界。"
        },
        sourceRefs: ["S1", "S3", "S7", "S9"]
      },
      {
        title: "2. Device registers 是軟硬體契約，不是普通變數",
        paragraphs: [
          "典型 controller 暴露 data、status 與 control/command registers。data register 保存小量 payload 或 FIFO entry；status 提供 ready、busy、error、interrupt pending；control 指定方向、模式、reset 或啟動。register width、bit semantics、可讀寫性與 side effects 都由 device interface 定義。read-clear status 讀一次便清除事件，write-one-to-clear 則以寫入 1 清除對應 bit。",
          "port-mapped I/O 使用獨立 I/O address space 與特殊 instructions；memory-mapped I/O（MMIO）把 registers 映射進 CPU address space，沿用一般 load/store。兩者只改變 CPU 如何到達 register，不改變 polling、interrupt 或 DMA 的選擇。MMIO page 通常使用 device memory attributes，避免普通 cache 合併、推測或保留 stale values。",
          "compiler 與 CPU 都可能重排 ordinary memory accesses，但 device protocol 常要求先填 descriptor/buffer，再寫 doorbell。portable driver 使用 readX/writeX 與 barrier API 建立 ordering。volatile 只能限制特定 compiler transformation，不能單獨保證 CPU memory ordering、cache coherence 或 device completion。"
        ],
        figure: {
          type: "matrix",
          title: "Device register 的常見語意",
          columns: ["Register", "典型方向", "範例欄位", "可能副作用", "錯誤用法"],
          rows: [
            ["DATA / FIFO", "R/W", "payload bytes", "read 會 pop", "重複讀取當成同一值"],
            ["STATUS", "多為 R", "ready, busy, error", "read-clear", "快取或刪除讀取"],
            ["CONTROL", "多為 W/RW", "enable, reset, mode", "立即改變裝置", "任意合併 writes"],
            ["DOORBELL", "W", "queue tail", "觸發 controller fetch", "descriptor 尚未可見就通知"]
          ],
          caption: "register access 的可觀察效果由 device specification 決定；相同位元值在 ordinary RAM 與 MMIO 不具有相同語意。"
        },
        sourceRefs: ["S1", "S3", "S5"]
      },
      {
        title: "3. Polling、interrupt 與 DMA 解決的是不同成本",
        paragraphs: [
          "polling 由 CPU 反覆讀 status，ready 後再處理。它沒有 interrupt entry/exit，若事件很快且可預測，短暫 polling 可能得到最低 latency；若裝置很慢或事件稀疏，大量 checks 不產生 useful work。poll interval 越長，CPU overhead 越低，但事件額外等待最多接近一個 interval。",
          "interrupt 讓裝置在事件到達時請求 CPU service，避免持續 polling。成本包括 interrupt delivery、pipeline/privilege transition、必要 state save、handler、acknowledge、return，以及可能的 cache/TLB disturbance。高事件率下，每個 packet 一次 interrupt 可能比批次 polling 更昂貴，因此現代網路與儲存常採 interrupt moderation 或 hybrid polling。",
          "DMA 解決 bulk data movement 的 CPU copy 問題。CPU/driver 建立 buffer 與 descriptor，controller 直接讀寫 main memory，最後以 interrupt 或 polled completion 回報。interrupt 決定『何時通知 CPU』，DMA 決定『誰搬 payload』；系統可以 DMA 加 polling，也可以 PIO 加 interrupt，兩軸不能混為同一選項。"
        ],
        figure: {
          type: "matrix",
          title: "三種控制方式的工作分配",
          columns: ["方式", "等待者", "payload mover", "固定成本", "適合情境"],
          rows: [
            ["Polling + PIO", "CPU loop", "CPU", "每次 check/copy", "短等待、小資料、可預測事件"],
            ["Interrupt + PIO", "device notification", "CPU", "每事件 entry/exit", "稀疏小事件"],
            ["Interrupt + DMA", "device notification", "controller", "setup + completion", "較大區塊、非同步 I/O"],
            ["Polling + DMA", "CPU completion loop", "controller", "setup + checks", "高率低延遲 queue"]
          ],
          caption: "notification mechanism 與 data movement mechanism 是兩個獨立維度；比較時要分開計算 setup、copy、wait 與 completion。"
        },
        sourceRefs: ["S1", "S2", "S4"]
      },
      {
        title: "4. Interrupt 是可恢復的控制轉移",
        paragraphs: [
          "external interrupt 在 instruction stream 之外非同步到達；exception 通常由目前 instruction 同步觸發；system call 是程式主動執行 trap instruction。三者都可能進入 privileged handler，但 cause、return PC 與 restart semantics 不同。precise state 要讓 handler 看見等同於某個 instruction boundary 的 architectural state。",
          "概念步驟為：event 令 pending bit 成立；enable/mask 與 priority 判斷是否接受；CPU 保存 return PC、先前 privilege 與 interrupt-enable state；由 vector 或 common entry 取得 handler；software 保存還會使用的 registers、辨認來源、service/acknowledge，最後 restore 並執行 return-from-trap。acknowledge 過早可能遺失狀態，過晚可能重複進入。",
          "RISC-V supervisor mode 以 sip/sie 表示 pending/enable，sstatus.SIE 控制全域接受，stvec 提供 Direct 或 Vectored entry，scause 記錄原因，sepc 保存 return PC，sret 恢復 privilege/control state。Vectored mode 的 asynchronous interrupt entry 為 BASE+4×cause，但 synchronous exceptions 仍到 BASE。"
        ],
        figure: {
          type: "flow",
          title: "Interrupt entry 到 return 的狀態鏈",
          items: ["device event", "pending=1", "enable + priority", "save PC / privilege", "vector handler", "service + acknowledge", "restore state", "return"],
          caption: "interrupt completion 不是只跳到 handler；必須保存足以恢復 execution 的 architectural/control state，並正確清除事件來源。"
        },
        sourceRefs: ["S2", "S6"]
      },
      {
        title: "5. Priority、masking 與 moderation 決定最壞延遲",
        paragraphs: [
          "interrupt controller 收集多個 sources，以 enable mask、priority 與 routing 選擇 target CPU/vector。mask 只是暫時不接受，不一定清除 device pending state。level-triggered source 在條件存在期間保持 asserted；edge-triggered source記錄 transition。兩者對 acknowledge、共享線與事件合併有不同要求。",
          "若高 priority handler 可以 preempt 低 priority handler，critical event latency 可降低，但 nesting 增加 stack/state 管理與 shared-data synchronization。若 handler 長時間關閉 interrupts，其他來源即使 priority 更高也可能等待。最壞 latency 至少包含目前不可中斷區段、較高 priority work、entry overhead 與 handler 前置路徑。",
          "interrupt moderation 把多個 completions 合併後再通知，可降低 interrupts per second 與 CPU overhead，代價是第一個完成必須等待 batch/time threshold。高 IOPS 裝置常把 queues 與 interrupt vectors 分配到不同 CPU affinity，減少共享鎖與跨核心 cache traffic，但 queue imbalance 仍可能造成 tail latency。"
        ],
        figure: {
          type: "timeline",
          title: "兩種 completion notification 的時間比較",
          columns: ["t0", "t1", "t2", "t3", "t4", "t5"],
          rows: [
            { label: "per-event IRQ", cells: ["C1", "IRQ1", "C2", "IRQ2", "C3", "IRQ3"] },
            { label: "moderated IRQ", cells: ["C1", "C2", "C3", "timer", "one IRQ", "batch handle"] },
            { label: "tradeoff", cells: ["低首件延遲", "高 overhead", "", "較高首件等待", "低 IRQ rate", "攤平成本"] }
          ],
          caption: "moderation 不會消除 work，只把多次固定通知成本合併；threshold 太大會直接增加 completion latency。"
        },
        sourceRefs: ["S2", "S7"]
      },
      {
        title: "6. DMA 正確性來自 buffer ownership、address 與 ordering",
        paragraphs: [
          "DMA descriptor 通常保存 device-visible buffer address、length、direction、flags 與 next/index。CPU 先配置/映射 buffer，填入 payload 或保留接收空間，再填 descriptor，最後更新 queue tail/doorbell。controller 取 descriptor 後對 memory 發出 reads/writes，完成時更新 completion entry 或 ownership bit。",
          "device 使用的 DMA address 可能是 IOVA，而非 CPU virtual address，也不必等於 physical address。IOMMU 依 device/domain page table 將 IOVA 轉成 physical page，提供 scatter-gather mapping、隔離與重定位。driver 必須使用 DMA mapping API，不能把一般 pointer 直接交給裝置。mapping direction 也會影響 cache synchronization 與權限。",
          "non-coherent system 中，CPU cache 可能持有 device 看不到的 dirty data，或保留 device 已改寫位置的 stale copy；software 需在 ownership transfer 前後 sync/flush/invalidate。即使 coherent DMA，也仍需要 ordering：先讓 descriptor/data 對 device 可見，再 ring doorbell；先確認 completion，再讀 device 寫入的 buffer。coherence 不等於 ordering。"
        ],
        figure: {
          type: "flow",
          title: "Transmit DMA 的 ownership handoff",
          items: ["CPU fills buffer", "DMA map → IOVA", "CPU writes descriptor", "memory barrier", "MMIO doorbell", "device DMA reads", "completion", "CPU unmaps/reuses"],
          caption: "buffer 在 handoff 期間由 device 擁有；CPU 若提早修改或重用，會形成 data race，即使 address mapping 完全正確。"
        },
        sourceRefs: ["S3", "S4", "S5"]
      },
      {
        title: "7. Interconnect 將 requests 封裝成可仲裁的 transactions",
        paragraphs: [
          "shared parallel bus 由多個 masters 競爭同一組 wires，需要 arbitration 決定 ownership；point-to-point switched fabric 則以 links 與 switches 建立多條 concurrent paths。interconnect 必須定義 addressing/routing、transaction format、flow control、ordering、error detection 與 configuration，而不只是標示一個 peak data rate。",
          "PCI Express 是 serial point-to-point I/O interconnect，以 lanes 擴展 link width，並以 Transaction、Data Link、Physical layers 運送 memory/configuration/messages。payload 之外還有 headers、link framing、flow control 與 encoding overhead；nominal transfer rate 不能直接當成 application throughput。posted write 可先完成於 requester，read 則需要 request/completion round trip。",
          "USB 是 host-controlled topology，device 透過 descriptors/endpoints 呈現介面。control、bulk、interrupt、isochronous transfer types 有不同服務語意；名稱為 interrupt transfer 不代表 device 可任意搶占 bus，而是 host controller 依週期排程 endpoint。USB4 進一步讓單一 link 動態共享 data/display protocols。"
        ],
        figure: {
          type: "hierarchy",
          title: "I/O transaction 的封裝層次",
          items: [
            { label: "Software request", detail: "read/write/ioctl、buffer、length" },
            { label: "Command protocol", detail: "NVMe command、USB transfer、device-specific descriptor" },
            { label: "Transaction layer", detail: "address、request/completion、routing" },
            { label: "Link reliability", detail: "sequence、CRC/retry、flow control" },
            { label: "Physical link", detail: "lanes、symbols/flits、electrical signaling" }
          ],
          caption: "應用 payload 只占底層傳輸的一部分；每層加入必要 metadata 與 control，因此 raw link rate 是上限而非實際吞吐量。"
        },
        sourceRefs: ["S8", "S14", "S15"]
      },
      {
        title: "8. I/O 效能必須同時保留 latency、IOPS、throughput 與 queue depth",
        paragraphs: [
          "latency 是單一 request 從指定起點到終點的時間；IOPS 是每秒完成 requests；throughput 是每秒 payload bytes。若 requests 大小固定，throughput=IOPS×bytes/request；若大小混合，必須用總 bytes/總時間。高 sequential throughput 不保證 4 KiB random IOPS 高，反之亦然。",
          "queue depth 是同時 outstanding requests 數。Little's Law 對穩定長期系統給出 L=λW：平均 in-flight requests=completion rate×平均 response time。增加 queue depth 可讓 controller/media 平行工作並提高 throughput，但也會增加等待；當 arrival rate 接近 service capacity，utilization 上升會讓 queueing latency 非線性惡化。",
          "平均值會隱藏 tail latency。p99 表示 99% requests 不超過該時間，仍有 1% 更慢；對 fan-out service，一個 user operation 等待多個 I/Os 時，任一慢 request 都可能主導整體。評估要固定 workload 的 read/write ratio、block size、randomness、queue depth、data state 與 measurement boundary。"
        ],
        figure: {
          type: "matrix",
          title: "I/O 指標回答的不同問題",
          columns: ["Metric", "單位", "回答", "不能單獨推論"],
          rows: [
            ["Latency", "µs / ms", "單一 request 等多久", "每秒總工作量"],
            ["IOPS", "requests/s", "每秒完成幾筆", "每筆 bytes"],
            ["Throughput", "MB/s / GB/s", "每秒 payload", "小 request latency"],
            ["Queue depth", "requests", "同時 outstanding work", "裝置一定更快"],
            ["p99 latency", "µs / ms", "尾端等待界線", "最壞情況"]
          ],
          caption: "只有在 block size 與 workload 固定時，IOPS 與 throughput 才能直接互換；measurement boundary 也必須一致。"
        },
        sourceRefs: ["S7", "S10", "S11"]
      },
      {
        title: "9. HDD latency 由機械定位與資料傳輸共同形成",
        paragraphs: [
          "HDD 以 rotating platters 保存磁性資料，head 移到目標 track 的時間是 seek time；目標 sector 旋轉到 head 下方的等待是 rotational latency；資料通過 head 的時間是 transfer time。平均旋轉延遲可近似半圈：Trot=60/(2×RPM) seconds。7200 RPM 約為 4.17 ms，15000 RPM 約 2 ms。",
          "簡化 access time=Tqueue+Tcontroller+Tseek+Trotation+Ttransfer。random request 常被 seek/rotation 主導；large sequential request 把一次定位成本攤到更多 bytes。logical block address 隱藏實際 geometry，drive firmware、cache 與 command queue 仍可重排 requests 以降低 head movement。",
          "把多個 random blocks 排序可提高 throughput，卻可能讓較老 request 等更久，所以 scheduler 需平衡 locality、fairness 與 deadline。HDD cache hit、sequential prefetch 或 write cache 也會改變 host-observed latency；完成到 volatile write cache 不一定代表已寫入 platter。"
        ],
        figure: {
          type: "flow",
          title: "HDD read latency 分解",
          items: ["queue wait", "controller", "seek to track", "wait for sector", "transfer sectors", "return data"],
          caption: "random access 的固定機械定位成本通常遠大於傳送少量 bytes；sequential access 主要改善的是定位成本攤提。"
        },
        sourceRefs: ["S15"]
      },
      {
        title: "10. SSD 用 FTL 隱藏 NAND 的 erase-before-write 限制",
        paragraphs: [
          "NAND flash read/program 以 page 為主要單位，erase 則以包含許多 pages 的較大 block 為單位；已 program page 不能像 RAM 一樣任意原地覆寫。SSD controller 以 Flash Translation Layer（FTL）把 host LBA 映射到 physical flash location，新版本通常寫到其他 free page，再把舊 mapping 標為 invalid。",
          "garbage collection 選擇含 invalid pages 的 erase block，把仍 valid pages 搬到別處後 erase 原 block。因 host 寫一次可能造成額外 internal copies，write amplification factor WAF=NAND bytes written/host bytes written。WAF>1 會消耗 bandwidth 與 program/erase endurance，並可能在 free space 少時形成 latency spikes。",
          "TRIM/deallocate 讓 OS 告知哪些 LBAs 不再保存有效資料，使 FTL 可免搬這些 pages。wear leveling 分散 erase cycles，overprovisioning 提供 spare area，parallel channels/dies 則提高 concurrency。SSD 沒有 seek 不代表所有 accesses 等價：block size、queue depth、read/write mix、drive fullness、GC 與 thermal state 都會影響結果。"
        ],
        figure: {
          type: "flow",
          title: "一筆 overwrite 在 FTL 內部的生命週期",
          items: ["host writes LBA 42", "allocate free page", "program new data", "update LBA mapping", "old page invalid", "GC copies valid pages", "erase block"],
          caption: "host 看見固定 LBA，controller 在 NAND 中採 out-of-place update；GC 產生的額外 writes 形成 write amplification。"
        },
        sourceRefs: ["S11", "S12"]
      },
      {
        title: "11. NVMe queues 將多核心 requests 對應到 SSD parallelism",
        paragraphs: [
          "NVMe 定義 host software 與 nonvolatile-memory subsystem 的 command/completion interface，常透過 PCIe。controller 至少有 Admin Submission/Completion Queue，並可建立多組 I/O Submission/Completion Queues。submission queue entries 由 host 寫入 memory，host 更新 tail doorbell；controller 取命令、執行後把 completion entry 寫回 memory，再以 interrupt 或 polling 通知。",
          "submission queue 是 host producer/controller consumer；completion queue 是 controller producer/host consumer。head/tail 與 phase state 防止把舊 entry 誤認為新 completion。command identifier 把 out-of-order completion 對回原 request；queue ordering 不代表所有 commands 必須依提交順序完成。",
          "per-core software queues 減少 global lock contention，hardware queues 讓 controller 同時服務不同 NAND channels/dies。Linux blk-mq 以 software staging queues 與 hardware dispatch queues連接多核心和 block device。queue depth 太小可能餵不滿 SSD，太大則增加 queueing 與 tail latency；最佳值由 workload 與 service-level target 決定。"
        ],
        figure: {
          type: "timeline",
          title: "NVMe submission/completion queue ownership",
          columns: ["1", "2", "3", "4", "5", "6"],
          rows: [
            { label: "Host", cells: ["write SQE", "barrier", "ring SQ tail", "other work", "read CQE", "ring CQ head"] },
            { label: "Controller", cells: ["", "", "fetch SQE", "DMA data", "write CQE", "observe head"] },
            { label: "Ownership", cells: ["host builds", "publish", "device owns", "device active", "host reclaims", "entry reusable"] }
          ],
          caption: "doorbell 只發布 queue position；descriptor/data 的 visibility 必須先由 ordering 保證。completion 也要在 CPU 讀 buffer 前建立同步。"
        },
        sourceRefs: ["S7", "S9", "S10"]
      },
      {
        title: "12. RAID 在 capacity、performance 與 failure tolerance 間交換",
        paragraphs: [
          "RAID 0 將 stripes 分散到 N drives，usable capacity=N×smallest-drive capacity，但沒有 redundancy，任一 drive failure 都破壞 array。RAID 1 保存 mirror copies，two-way mirror 的 usable capacity 約為總容量一半，可從任一健康 copy 讀取。RAID 10 先 mirror 再 stripe，兼具 parallelism 與 redundancy，但 failure tolerance 取決於失效是否落在同一 mirror group。",
          "RAID 5 以 distributed single parity 提供 N−1 drives 的容量並容忍一顆失效；RAID 6 以 dual parity 提供 N−2 drives 容量並容忍兩顆失效。full-stripe write 可直接由新 data 算 parity；small partial-stripe write 常需 read old data、read old parity、write new data、write new parity，RAID 5 形成典型 4 I/O read-modify-write penalty，RAID 6 需要更多 parity work。",
          "RAID 不是 backup。它無法防止誤刪、ransomware、controller/software corruption、site failure 或所有 correlated faults。degraded mode 與 rebuild 期間，每筆 request 可能要由 surviving drives 重建資料，performance 下降且其餘 drives 承受更高 load；capacity 計算也必須以 smallest member 為基準。"
        ],
        figure: {
          type: "matrix",
          title: "常見 RAID level 的基本模型",
          columns: ["Level", "Usable capacity（N×S）", "最少 drives", "保證容忍", "small-write 特性"],
          rows: [
            ["RAID 0", "N×S", "2", "0 drive", "parallel data writes"],
            ["RAID 1", "約 N/2×S", "2", "每 mirror group 1 drive", "duplicate writes"],
            ["RAID 5", "(N−1)×S", "3", "1 drive", "single-parity RMW"],
            ["RAID 6", "(N−2)×S", "4", "2 drives", "dual-parity RMW"],
            ["RAID 10", "N/2×S", "4", "依 mirror group", "mirror + stripe"]
          ],
          caption: "S 是 smallest member capacity；RAID level 只定義 mapping/redundancy，不自動提供獨立歷史版本或異地副本。"
        },
        sourceRefs: ["S13"]
      },
      {
        title: "13. 端到端效能與可靠性要先畫出 completion 邊界",
        paragraphs: [
          "Amdahl's Law 對 I/O 改善同樣成立：若原 execution time 中 fraction F 在可改善的 I/O path，該部分加速 S 倍，overall speedup=1/((1−F)+F/S)。即使 device 峰值快十倍，若 application 大部分時間在 CPU、locks 或 network，整體改善仍受未改部分限制。反之，CPU 加速也可能讓 I/O 更早成為 bottleneck。",
          "可靠 I/O 需要在各層檢查 error detection 與 recovery：link CRC/retry 保護傳輸，ECC 保護 media bits，timeout 處理無 completion，sequence/command ID 防止配錯 request，flush/FUA 等命令定義 durability ordering。retry 只有在 operation idempotent 或 protocol 能去重時才安全；結果未知的 write 不能一律盲目重送。",
          "一次 request 的完整證據包含：command 已發布、buffer ownership 已轉移、device 已完成、data 對 CPU 可見、error status 已檢查，以及必要時已達 persistent boundary。只看『interrupt 到了』或『system call 返回』仍不足以推論所有資料已安全保存；正確性必須和介面保證、power-failure model 一起敘述。"
        ],
        figure: {
          type: "hierarchy",
          title: "Write completion 的逐層保證",
          items: [
            { label: "Submitted", detail: "command 已進入 software/device queue" },
            { label: "Transferred", detail: "DMA payload 已離開或進入 host memory" },
            { label: "Controller complete", detail: "device protocol 回報成功" },
            { label: "Cache durable?", detail: "取決於 volatile cache、power-loss protection 與 flush" },
            { label: "Media durable", detail: "符合介面對 persistent completion 的定義" }
          ],
          caption: "越下層的保證通常成本越高；software 必須要求與資料重要性相符的 completion/durability level。"
        },
        sourceRefs: ["S3", "S5", "S9", "S13"]
      }
    ],
    workedExamples: [
      {
        title: "例題一：計算 polling 的 CPU 成本與最壞偵測延遲",
        prompt: "1 GHz CPU 每 200 cycles 檢查一次 status，裝置平均 1 ms 才 ready。若 busy loop 不做其他事，求 checks、耗用 cycles 與最壞額外偵測延遲。",
        steps: [
          "poll interval=200 cycles/(10^9 cycles/s)=200 ns。",
          "平均等待 1 ms 期間 checks=1 ms/200 ns=5000。",
          "總 polling cycles=5000×200=1,000,000 cycles。",
          "1,000,000 cycles/1 GHz=1 ms，整段 CPU time 都耗在等待。",
          "ready 若剛好發生在一次 check 後，最壞額外偵測延遲接近 200 ns；平均約 100 ns。",
          "縮短 interval 會降低 detection latency，卻增加每秒 register reads；延長 interval 則相反。"
        ],
        result: "平均約 5000 次 checks、1,000,000 CPU cycles；最壞偵測延遲約 200 ns。"
      },
      {
        title: "例題二：比較 periodic polling 與 interrupt overhead",
        prompt: "事件率 10,000/s。每次 interrupt 完整成本 1.2 µs；poll 每 4 µs 一次，每次 check 80 ns。比較單核心時間比例。",
        steps: [
          "interrupt CPU time/s=10,000×1.2 µs=12,000 µs=12 ms。",
          "interrupt utilization=12 ms/1000 ms=1.2%。",
          "poll rate=1/(4 µs)=250,000 checks/s。",
          "poll CPU time/s=250,000×80 ns=20,000,000 ns=20 ms。",
          "poll utilization=20 ms/1000 ms=2.0%。",
          "此 workload 下 interrupt 固定成本較低；poll 的最壞檢測延遲約 4 µs，兩者 latency boundary 也不同。"
        ],
        result: "Interrupt 約占 1.2% CPU，periodic polling 約占 2.0%；不能只以通知次數判斷。"
      },
      {
        title: "例題三：估算 DMA 對 CPU data-copy 工作的減量",
        prompt: "傳送 8 MiB。PIO loop 每次搬 8 bytes 並耗 4 cycles；DMA setup 與 completion 共 2400 cycles。求 PIO 與 DMA 的 CPU cycles 比。",
        steps: [
          "8 MiB=8×2^20=8,388,608 bytes。",
          "PIO iterations=8,388,608/8=1,048,576。",
          "PIO CPU cycles=1,048,576×4=4,194,304。",
          "DMA CPU cycles=2400；payload transfer 由 controller 執行，不計為 CPU cycles。",
          "CPU-cycle reduction ratio=4,194,304/2400≈1747.63。",
          "這不是 device transfer 加速 1748 倍；它只表示 CPU copy work 的減量，elapsed time 仍受 memory/interconnect/device bandwidth 限制。"
        ],
        result: "PIO 約 4,194,304 cycles，DMA software path 2400 cycles，CPU 搬移成本約減少 1748 倍。"
      },
      {
        title: "例題四：由 event rate 與 handler time 判斷 interrupt 飽和",
        prompt: "裝置每秒 50,000 events，每次 handler 含 entry/exit 共 6 µs。求 CPU utilization；若改成每 8 events 一次 interrupt、每批 10 µs，求新 utilization。",
        steps: [
          "逐事件模式 utilization=50,000×6 µs/s=300,000 µs/s=30%。",
          "每批 8 events 時，interrupt rate=50,000/8=6250/s。",
          "batch mode CPU time=6250×10 µs=62,500 µs/s。",
          "batch utilization=6.25%。",
          "CPU overhead 降低 30%−6.25%=23.75 percentage points。",
          "但第一個 event 可能等待其餘 events 或 moderation timer，tail/first-event latency 必須另算。"
        ],
        result: "逐事件 IRQ 占 30% CPU；每 8 筆合併後占 6.25%，代價是增加通知等待。"
      },
      {
        title: "例題五：計算 transaction payload efficiency",
        prompt: "一種 generic link transaction 每 256-byte payload 另有 28 bytes header/control overhead，raw usable symbol bandwidth 為 8 GB/s。求 payload efficiency 與理想 payload throughput。",
        steps: [
          "transaction bytes=256+28=284 bytes。",
          "payload efficiency=256/284≈0.901408。",
          "理想 payload throughput=8 GB/s×0.901408≈7.211 GB/s。",
          "每秒 overhead bandwidth 約 8−7.211=0.789 GB/s。",
          "若 payload 只有 64 bytes，efficiency=64/(64+28)≈69.57%，固定 overhead 影響更大。",
          "實際 throughput 還會受 idle、flow control、retries、software queue 與 device service 限制。"
        ],
        result: "256-byte payload 時效率約 90.14%，理想 payload throughput 約 7.21 GB/s。"
      },
      {
        title: "例題六：用 Little's Law 推導必要 queue depth",
        prompt: "穩定 workload 完成率 80,000 IOPS，平均 response time 250 µs。求平均 outstanding requests；若 queue depth 只有 8，是否足以維持這組數據？",
        steps: [
          "λ=80,000 requests/s，W=250 µs=0.00025 s。",
          "Little's Law：L=λW。",
          "L=80,000×0.00025=20 requests。",
          "平均 in-flight 已是 20，queue depth 8 不可能同時維持同一 throughput 與 latency。",
          "若 W 仍為 250 µs，QD=8 的理想 throughput upper bound=L/W=8/0.00025=32,000 IOPS。",
          "這是穩定平均關係，不直接描述 burst 或 p99。"
        ],
        result: "平均需要 20 個 outstanding requests；QD=8 在相同 latency 下最多對應約 32,000 IOPS。"
      },
      {
        title: "例題七：分解 7200 RPM HDD random read",
        prompt: "平均 seek 8.5 ms、7200 RPM、transfer rate 180 MB/s，讀取 64 KiB；忽略 queue/controller overhead，估算 access time。",
        steps: [
          "一圈時間=60/7200 s=0.008333... s=8.333 ms。",
          "平均 rotational latency=半圈=4.1667 ms。",
          "64 KiB=65,536 bytes；以 180,000,000 bytes/s 計，transfer=0.0003641 s=0.3641 ms。",
          "access time=8.5+4.1667+0.3641=13.0308 ms。",
          "資料傳輸只占約 0.3641/13.0308≈2.79%，小 random read 主要被定位成本支配。",
          "sequential 下一區塊若免 seek/rotation，observed bandwidth 可大幅上升。"
        ],
        result: "估計約 13.03 ms，其中 seek 與 rotation 合計約 12.67 ms。"
      },
      {
        title: "例題八：計算 SSD write amplification 與 endurance 時間",
        prompt: "host 每日寫入 120 GB，controller 因 GC 實際寫 NAND 180 GB。SSD 額定 600 TBW（以十進位計）。求 WAF 與在固定 host workload 下的理想天數。",
        steps: [
          "WAF=NAND writes/host writes=180/120=1.5。",
          "600 TBW=600,000 GB host writes，因 TBW 通常是 host-visible endurance 指標。",
          "理想天數=600,000 GB/(120 GB/day)=5000 days。",
          "5000/365≈13.70 years。",
          "若題目改給 NAND physical write budget，則必須以每日 180 GB 除，不能沿用 host write。",
          "實際壽命還受 workload、temperature、spare area、firmware 與 warranty 條件影響。"
        ],
        result: "WAF=1.5；以 600 TBW 的 host-write 定義估算約 5000 天，約 13.7 年。"
      },
      {
        title: "例題九：比較六顆 4 TB drives 的 RAID capacity",
        prompt: "六顆相同 4 TB drives，分別建 RAID 0、RAID 1（三組 mirror 再合併容量）、RAID 5、RAID 6、RAID 10，求 usable capacity 與最低保證容錯。",
        steps: [
          "總 raw capacity=6×4=24 TB。",
          "RAID 0：6×4=24 TB，保證容忍 0 顆。",
          "RAID 1 / RAID 10 two-way mirrors：6/2×4=12 TB；每個 mirror group 可失效一顆。",
          "RAID 5：(6−1)×4=20 TB，保證容忍任意 1 顆。",
          "RAID 6：(6−2)×4=16 TB，保證容忍任意 2 顆。",
          "RAID 10 可能容忍多顆，但若同一 mirror group 全失效就失敗，因此不能簡化為保證任意 3 顆。"
        ],
        result: "RAID0/1/5/6/10 分別為 24/12/20/16/12 TB；容錯語意取決於 level 與失效分布。"
      },
      {
        title: "例題十：用 Amdahl's Law 評估 SSD 升級",
        prompt: "原程式 35% 時間等待 storage I/O。新 device 讓該部分快 5 倍，其他時間不變。求 overall speedup 與新 I/O 時間比例。",
        steps: [
          "normalize old time=1；F=0.35，S=5。",
          "new time=(1−0.35)+0.35/5=0.65+0.07=0.72。",
          "overall speedup=1/0.72≈1.3889。",
          "new execution 中 I/O fraction=0.07/0.72≈0.09722=9.72%。",
          "即使 I/O path 快 5 倍，整體只快約 1.39 倍，因 65% 未改善。",
          "若把 I/O 變成無限快，上限為 1/0.65≈1.5385。"
        ],
        result: "overall speedup 約 1.389；新 execution 中 I/O 約占 9.72%，理論上限約 1.538。"
      }
    ],
    misconceptions: [
      ["Interrupt-driven I/O 表示 CPU 完全不必處理裝置。", "CPU 仍需 entry/exit、handler、acknowledge、queue cleanup 與 process wakeup；interrupt 只避免持續 polling。"],
      ["DMA 與 interrupt 是同一種 I/O 模式。", "DMA 決定 payload mover；interrupt 決定 completion notification。兩者可獨立組合。"],
      ["MMIO register 可像普通 global variable 一樣快取與重排。", "device register 可能有 side effect 且要求 ordering，必須使用 device mapping、accessor 與 barrier。"],
      ["volatile 能完整解決 DMA 與 MMIO ordering。", "volatile 主要限制 compiler；CPU ordering、cache coherence 與 ownership 需架構/OS API 保證。"],
      ["IRQ priority 越高，所有 interrupt latency 都越低。", "高 priority 可壓低自身等待，卻可能延後低 priority sources，並增加 nesting 與共享狀態成本。"],
      ["Peak link rate 就是 application throughput。", "encoding、headers、flow control、retries、queueing 與 device service 都會降低 payload throughput。"],
      ["較深 queue 一定降低 latency。", "queue depth 可提高 parallel utilization，但排隊時間通常增加，尤其接近飽和時。"],
      ["SSD 沒有 moving parts，所以每筆 I/O latency 相同。", "FTL mapping、GC、WAF、queue depth、read/write mix、fullness 與 parallelism 都會改變 latency。"],
      ["TRIM 會立即把指定 NAND pages 全部抹除。", "TRIM/deallocate 表示 LBAs 不再有效，controller 可在合適時機回收；實際 erase timing 由 FTL 決定。"],
      ["RAID 5 可以視為 backup。", "RAID 提供特定 drive-failure redundancy，不保護誤刪、惡意加密、site failure 或所有 correlated corruption。"],
      ["RAID 10 一定能容忍任意兩顆 drives 同時失效。", "若兩顆屬同一 mirror group，array 可能失敗；容忍度取決於失效分布。"],
      ["write system call 返回就必然已寫入 persistent media。", "completion 可能只到 page cache 或 volatile controller cache；durability 取決於 flush/FUA、device guarantee 與 power-failure model。"]
    ],
    exercises: [
      { level: "基礎", question: "data、status 與 control register 各自負責什麼？", solution: ["data 保存 payload/FIFO entry；status 呈現 ready、busy、error 等狀態。", "control/command 由 software 寫入以啟動、重設或選擇模式；每個 register 的副作用由介面定義。"] },
      { level: "基礎", question: "memory-mapped I/O 與 port-mapped I/O 的核心差異是什麼？", solution: ["MMIO 把 device registers 放入 CPU memory address space，以 load/store 存取。", "port-mapped I/O 使用獨立 I/O space 與專用 instructions；兩者都仍可搭配 polling、interrupt 或 DMA。"] },
      { level: "基礎", question: "為何 interrupt 不會消除 I/O 的 CPU overhead？", solution: ["CPU 仍要進入 handler、保存/恢復必要 state、辨認與清除來源。", "driver 還需處理 completion、unmap/recycle buffers 與喚醒 process。"] },
      { level: "基礎", question: "DMA transfer 前，CPU 通常要準備哪些資訊？", solution: ["準備/映射 buffer，建立含 DMA address、length、direction、flags 的 descriptor。", "先發布 descriptor/data，再以正確 ordering 更新 queue/doorbell。"] },
      { level: "基礎", question: "1 ms 內到達 40 個 completions，若每 10 個合併一次 interrupt，會產生幾次 interrupts？", solution: ["40/10=4 個 batches，因此產生 4 次 interrupts。", "通知成本降低，但每批前面的 completion 會等待 batch threshold 或 timer。"] },
      { level: "計算", question: "2.5 GHz CPU 的 interrupt handler 花 7500 cycles，單次時間是多少？每秒 20,000 次占多少 CPU？", solution: ["單次=7500/(2.5×10^9)=3 µs。", "20,000×3 µs=60 ms/s，因此占單核心 6%。"] },
      { level: "計算", question: "4 KiB requests、100,000 IOPS 對應多少十進位 MB/s？", solution: ["4 KiB=4096 bytes；throughput=4096×100,000=409,600,000 bytes/s。", "以 10^6 bytes/MB 計為 409.6 MB/s。"] },
      { level: "計算", question: "平均 60,000 IOPS、response time 400 µs，依 Little's Law 平均 outstanding requests 為多少？", solution: ["W=0.0004 s，L=λW=60,000×0.0004。", "L=24 requests。"] },
      { level: "計算", question: "10,000 RPM HDD 的平均 rotational latency 為多少？", solution: ["一圈時間=60/10,000 s=6 ms。", "平均等待半圈，因此 rotational latency=3 ms。"] },
      { level: "計算", question: "host 寫 80 GB、NAND 寫 200 GB，WAF 是多少？", solution: ["WAF=NAND writes/host writes=200/80。", "WAF=2.5，表示每 1 byte host write 對應平均 2.5 bytes NAND programming。"] },
      { level: "計算", question: "八顆 6 TB drives 建 RAID 6，usable capacity 與保證容忍失效數是多少？", solution: ["usable=(8−2)×6=36 TB。", "dual parity 保證容忍任意兩顆 member drives 失效。"] },
      { level: "計算", question: "RAID 5 small write 採 read-modify-write，典型需要哪些四個 member operations？", solution: ["read old data、read old parity。", "write new data、write new parity；不含額外 controller/cache effects。"] },
      { level: "進階", question: "為何 coherent DMA 仍需要 memory barrier？", solution: ["coherence 確保同一位置的 copies 最終一致，並不自動規定不同位置 accesses 的先後。", "descriptor/data 必須先可見再 ring doorbell；completion 必須先可見再讀 buffer，因此仍需 ordering。"] },
      { level: "進階", question: "說明 level-triggered interrupt 若未清除 device condition 便 return 會發生什麼。", solution: ["interrupt line/pending condition 仍成立，CPU 重新 enable 後可能立刻再次進入 handler。", "handler 必須依 device protocol service/acknowledge，並確認造成 level 的條件已解除。"] },
      { level: "進階", question: "同一 SSD 為何 1 MiB sequential throughput 高，4 KiB random latency 卻可能仍不理想？", solution: ["大 sequential request 能攤平 command/queue 固定成本並利用 channels/dies parallelism。", "4 KiB random work 受每筆 command latency、mapping、queueing 與 GC 影響，兩個 metric 不等價。"] },
      { level: "進階", question: "六顆 drives 的 RAID 10 同時壞兩顆，何時仍可運作、何時失敗？", solution: ["若失效分散在不同 mirror groups 且每組仍有一份 copy，array 可運作。", "若同一 mirror group 的兩份 copies 都失效，該 stripe data 無法重建，array 失敗。"] },
      { level: "整合", question: "原時間 40% 為 I/O；I/O 快 4 倍後 overall speedup 是多少？", solution: ["new normalized time=0.60+0.40/4=0.70。", "speedup=1/0.70≈1.4286。"] },
      { level: "整合", question: "一筆 persistent write 從 DMA completion 到真正 durable，還要檢查哪些邊界？", solution: ["確認 DMA/command status、buffer ownership 與 data visibility，並檢查 controller 回報是否包含 write cache。", "若 volatile cache 不在 durable guarantee 中，還需 flush/FUA 或等價機制，並確認 error/timeout 與 power-loss model。"] }
    ],
    glossary: [
      ["Device controller", "把 interconnect commands 轉成裝置內部操作並管理 data/completion 的控制硬體。"],
      ["Device driver", "作業系統中把通用 I/O request 轉成特定 controller protocol 的 software。"],
      ["MMIO", "Memory-Mapped I/O，把 device registers 映射進 CPU address space。"],
      ["PIO", "Programmed I/O，由 CPU instructions 直接搬移資料或輪詢 register。"],
      ["Polling", "CPU 週期性讀取 status 以偵測事件或 completion。"],
      ["Interrupt", "外部事件造成的非同步 privileged control transfer。"],
      ["Interrupt vector", "把 interrupt cause 對應到 handler entry 的編號或位址機制。"],
      ["Interrupt moderation", "以數量或時間 threshold 合併多個 events 的通知方法。"],
      ["DMA", "Direct Memory Access，由 controller 在 device 與 main memory 間搬移 payload。"],
      ["DMA descriptor", "描述 buffer address、length、direction、flags 與 ownership 的 command record。"],
      ["IOVA", "I/O Virtual Address，device 發出 DMA 時使用、可由 IOMMU 轉譯的 address。"],
      ["IOMMU", "為 device DMA 提供 address translation 與 isolation 的 memory management unit。"],
      ["Memory barrier", "限制 memory/MMIO operations 可觀察順序的架構或 OS primitive。"],
      ["Posted write", "requester 不等待 endpoint completion response 即可向前進行的 write transaction。"],
      ["Latency", "單一 request 從指定起點到終點的 elapsed time。"],
      ["IOPS", "Input/Output Operations Per Second，每秒完成的 I/O requests 數。"],
      ["Throughput", "單位時間完成的 payload bytes 或工作量。"],
      ["Queue depth", "同時 outstanding、尚未完成的 requests 數量。"],
      ["Little's Law", "穩定系統中的平均數量 L=arrival/completion rate λ×平均時間 W。"],
      ["Seek time", "HDD head 移到目標 track 所需時間。"],
      ["Rotational latency", "HDD 等待目標 sector 旋轉到 head 下方的時間。"],
      ["FTL", "Flash Translation Layer，把 host LBA 映射到 NAND physical location。"],
      ["Garbage collection", "SSD 搬移 valid pages 並 erase blocks 以回收 free space。"],
      ["Write amplification", "NAND physical writes 與 host logical writes 的比值。"],
      ["TRIM / deallocate", "host 告知 device 某些 LBAs 已不需保留資料的命令語意。"],
      ["Submission queue", "host 提交 commands、controller 消費 entries 的 queue。"],
      ["Completion queue", "controller 發布 completion、host 回收 entries 的 queue。"],
      ["RAID", "以多個 storage devices 實作 striping、mirroring 或 parity 的 array。"],
      ["Parity", "由 data blocks 計算、可在特定失效數內重建遺失資料的冗餘資訊。"],
      ["Durability", "成功回報後，在規定 failure model 下資料仍能保存的保證。"]
    ],
    sources: [
      { key: "S1", title: "Cornell CS3410 Fall 2025: Input/Output", url: "https://www.cs.cornell.edu/courses/cs3410/2025fa/notes/io.html", accessed: "2026-08-21", use: "device registers、port/MMIO、polling、interrupt、DMA 與 cache coherence 的公開課程基礎。" },
      { key: "S2", title: "Cornell CS3410 Spring 2026: Interrupts", url: "https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/interrupt.html", accessed: "2026-08-21", use: "interrupt/trap、precise control transfer、context state 與 I/O notification。" },
      { key: "S3", title: "Linux Kernel: Bus-Independent Device Accesses", url: "https://docs.kernel.org/driver-api/device-io.html", accessed: "2026-08-21", use: "MMIO accessors、port I/O、posted writes 與 device-access ordering。" },
      { key: "S4", title: "Linux Kernel: Dynamic DMA Mapping Guide", url: "https://docs.kernel.org/core-api/dma-api-howto.html", accessed: "2026-08-21", use: "DMA addresses、direction、coherent/streaming mappings、ownership 與 synchronization。" },
      { key: "S5", title: "Linux Kernel Memory Barriers", url: "https://docs.kernel.org/core-api/wrappers/memory-barriers.html", accessed: "2026-08-21", use: "compiler/CPU barriers、device operations、DMA coherence 與 MMIO ordering。" },
      { key: "S6", title: "RISC-V Supervisor-Level ISA", url: "https://docs.riscv.org/reference/isa/priv/supervisor.html", accessed: "2026-08-21", use: "stvec、sip/sie、scause、sepc、SIE、vectored interrupt 與 sret semantics。" },
      { key: "S7", title: "Linux Kernel: Multi-Queue Block I/O", url: "https://www.kernel.org/doc/html/latest/block/blk-mq.html", accessed: "2026-08-21", use: "software/hardware queues、多核心 block I/O、NVMe parallel submission 與 queueing。" },
      { key: "S8", title: "Intel: PCI Express Architecture", url: "https://www.intel.com/content/www/us/en/io/pci-express/pci-express-architecture-general.html", accessed: "2026-08-21", use: "PCIe serial point-to-point architecture、lanes、transaction/data-link/physical layers 與 protocol overhead。" },
      { key: "S9", title: "NVM Express Base Specification", url: "https://nvmexpress.org/specification/nvm-express-base-specification/", accessed: "2026-08-21", use: "NVMe 2.4、submission/completion queues、commands、transports 與 controller interface。" },
      { key: "S10", title: "NVM Express: Base Architectural Overview", url: "https://nvmexpress.org/base-nvm-express-part-one/", accessed: "2026-08-21", use: "Admin/I/O SQ-CQ pairs、namespace、command/completion sizes 與 multi-queue concepts。" },
      { key: "S11", title: "Micron: Client vs. Data Center SSDs", url: "https://www.micron.com/content/dam/micron/global/public/products/technical-marketing-brief/client-vs-enterprise-performance-use-cases-tech-brief.pdf", accessed: "2026-08-21", use: "SSD IOPS、latency、overprovisioning、garbage collection、WAF、parallelism 與 power-loss protection。" },
      { key: "S12", title: "KIOXIA: Understanding Garbage Collection in NAND Flash", url: "https://americas.kioxia.com/content/dam/kioxia/en-us/business/memory/mlc-nand/asset/KIOXIA_Managed_Flash_BOS_P4_Understanding_Garbage_Collection_Tech_Brief.pdf", accessed: "2026-08-21", use: "NAND valid/invalid data、physical blocks、copy/erase garbage collection 與 lifetime/performance effects。" },
      { key: "S13", title: "Red Hat Enterprise Linux 8: Managing RAID", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html/managing_storage_devices/managing-raid_managing-storage-devices", accessed: "2026-08-21", use: "RAID 0/1/4/5/6/10、striping、mirroring、parity、capacity 與 failure recovery。" },
      { key: "S14", title: "USB-IF: USB4", url: "https://www.usb.org/usb4", accessed: "2026-08-21", use: "host/device interconnect、shared data/display protocols、link bandwidth 與 compatibility。" },
      { key: "S15", title: "Seagate Cheetah 15K.6 SAS Product Manual", url: "https://www.seagate.com/docs/pdf/en-US/cheetah-15k-6-sas-pm.pdf", accessed: "2026-08-21", use: "HDD rotational speed、average rotational latency、seek、transfer 與 access-time measurement boundary。" }
    ]
  },
  {
    chapter: 8,
    title: "系統軟體：從原始碼到受保護的執行環境",
    english: "System Software: From Source Code to Protected Execution",
    revised: "2026-08-22",
    readingTime: "約 240–300 分鐘",
    intro: "系統軟體把硬體提供的指令、特權與位址轉譯機制，組合成程式可使用的執行環境。原始碼先經編譯器與組譯器形成帶有符號和重定位資訊的目的檔，連結器解析跨檔案參照並配置位址，載入器建立虛擬位址空間，作業系統再以行程、系統呼叫和排程管理執行。虛擬機器與容器則在不同邊界上重複或隔離這些資源。本章沿著一個程式從文字到 CPU 執行的生命週期，逐位元追蹤符號、節區、重定位、ELF segment、trap、context switch、動態連結與兩階段位址轉譯，並以可重算例題區分語言語意、ABI、ISA 與作業系統政策各自負責的部分。",
    outcomes: [
      "能說明 user mode、kernel mode、trap 與 protected resource 之間的關係。",
      "能列出 process context，並量化 context switch 的直接 CPU 成本。",
      "能依 RISC-V calling convention 追蹤 system call arguments、cause、return value 與 privilege transition。",
      "能以 two-pass assembler 建立 symbol table，計算 label address 與 PC-relative displacement。",
      "能區分 ELF section 與 segment，解讀 symbol、relocation、program header 與 zero-fill 語意。",
      "能套用 S+A-P 等 relocation expression，並檢查欄位寬度與對齊。",
      "能說明 static linker、loader、dynamic linker、GOT、PLT 與 shared object 的分工。",
      "能追蹤 compiler front end、IR、optimization、instruction selection、register allocation 與 code emission。",
      "能比較 interpretation、bytecode、JIT 與 ahead-of-time compilation 的啟動與穩態成本。",
      "能區分 virtual machine 與 container 的隔離邊界，並完成兩階段 page translation。",
      "能由原始碼一路定位到 instruction、mapping、privilege 與 runtime state，建立端到端除錯模型。"
    ],
    sections: [
      {
        title: "1. 系統軟體是一組可組合的抽象與狀態轉換",
        paragraphs: [
          "應用程式看到 function、file、process 與 virtual address；硬體看到 instruction、register、physical memory 與 device event。compiler 把高階語言轉成 ISA instructions，assembler 把 mnemonic 轉成 machine code，linker 把分散的 definitions/references 合成映像，loader 建立 address space，kernel 則仲裁 CPU、memory 與 I/O。每一層都把上一層未完成的名稱或請求，轉成下一層可處理的具體狀態。",
          "語言規格、ABI 與 ISA 是三個不同契約。語言規格定義 expression 與 object 的語意；ABI 規定 register usage、stack layout、object format、calling convention 與 system interface；ISA 定義 instruction encoding 和 architectural state。相同 C 程式可針對不同 ISA 編譯，而同一 ISA 上若 ABI 不相容，目的檔仍不能直接連結。",
          "分析問題時可沿四條線追蹤：名稱從 identifier 變成 symbol 再變成 address；資料從 source object 變成 section bytes 再映射到 page；控制從 function call 變成 branch/link 再經 trap 進入 kernel；權限從 process credentials 與 page permission 落到 privilege mode 和 hardware checks。這些線在執行中的一條 instruction 上匯合。"
        ],
        figure: { type: "flow", title: "程式生命週期與主要責任", items: ["source language", "compiler / IR", "assembler", "relocatable object", "static linker", "executable / shared object", "loader + dynamic linker", "process on CPU"], caption: "箭頭代表狀態轉換，不代表所有工具必須是獨立行程；每一步都保留或解決一部分資訊。" },
        sourceRefs: ["S3", "S4", "S6", "S10"]
      },
      {
        title: "2. 特權、保護與作業系統資源",
        paragraphs: [
          "user mode 不能任意修改 page tables、interrupt state 或 device registers；這些 privileged operations 由 kernel mode 執行。hardware 在每次 instruction、memory access 或 control transfer 檢查目前 privilege 與權限。保護不是靠應用程式自律，而是靠 CPU privilege、MMU page permissions 與 kernel-maintained ownership 共同強制。",
          "process 是受保護的執行個體，通常包含 virtual address space、register context、open-file table、credentials、signal state 與 scheduling state。thread 是可被排程的 control flow，擁有自己的 PC、general registers 與 stack，但可與同 process 的其他 threads 共享 address space 和 files。因而 process isolation 與 thread concurrency 是不同問題。",
          "kernel 以 handle 或 descriptor 表示資源，使應用程式不必直接操控 controller 或 physical page。系統呼叫入口會驗證 number、argument pointer、length 與 permission，之後才執行資源操作。即使參數型別在 source code 正確，kernel 仍須視 user pointer 為不可信，因為 mapping 可缺頁、越界或在 concurrent execution 中改變。"
        ],
        figure: { type: "hierarchy", title: "保護邊界由軟硬體共同建立", items: [{ label: "Application", detail: "functions, virtual addresses, descriptors" }, { label: "ABI / system-call boundary", detail: "registers, trap, validated arguments" }, { label: "Kernel", detail: "scheduler, VM, files, drivers" }, { label: "Hardware enforcement", detail: "privilege, page permissions, interrupts" }], caption: "抽象由 software 命名，越權行為則由 privilege checks 與 address translation 阻止。" },
        sourceRefs: ["S1", "S2", "S3", "S13"]
      },
      {
        title: "3. 行程、執行緒與 context switch",
        paragraphs: [
          "CPU 同一時間在一個 hardware thread 上只呈現一組 architectural state。scheduler 要換到另一個 runnable thread，必須保存被換出者稍後需要的 PC、stack pointer、callee-saved registers、status 和必要的 control state，再載入下一個 thread 的 context。保存集合取決於 ISA、ABI、kernel entry path 與 lazy/eager policy。",
          "context switch 的直接成本是執行 save、scheduler 與 restore 所需 cycles；間接成本則來自 cache working set 被替換、branch predictor history 改變、TLB entries 失效或 address-space tag 切換。只用 instruction count 估算時會漏掉後者，因此實測 latency 會隨 working set、core migration 與 security policy 改變。",
          "process state 常以 running、runnable、blocked 等狀態表示。blocked thread 正等待 event，放進 run queue 只會浪費 CPU；event completion 使它轉回 runnable，但不保證立刻 running。preemption 是 scheduler 暫停仍可執行的 thread，blocking 則是 thread 當下無法前進，兩者的原因與 accounting 不同。"
        ],
        figure: { type: "timeline", title: "一次 blocking I/O 前後的排程狀態", columns: ["t0", "t1", "t2", "t3", "t4", "t5"], rows: [{ label: "Thread A", cells: ["running", "syscall", "blocked", "blocked", "runnable", "running"] }, { label: "Thread B", cells: ["runnable", "runnable", "running", "running", "running", "runnable"] }, { label: "Kernel/event", cells: ["", "submit", "switch", "completion", "wakeup", "switch"] }], caption: "completion 只把 A 變成 runnable；實際取得 CPU 還取決於 scheduler。" },
        sourceRefs: ["S1", "S2", "S3"]
      },
      {
        title: "4. System call 是受控的同步 trap",
        paragraphs: [
          "一般 function call 在同一 privilege level 內改變 PC，system call 則使用 ISA 定義的 trap instruction 進入 kernel。以 RISC-V Linux ABI 為例，system-call number 放在 a7，最多六個參數放在 a0–a5，ecall 觸發 exception；kernel trap entry 保存必要 state、辨認 cause，再依 number 分派。這是一個同步事件，因為 cause 直接來自目前 instruction。",
          "trap hardware/firmware 會保存可返回的位置和 cause，切換到受信任入口；kernel 不能直接相信 user stack，所以先切到 kernel-controlled stack 或 trap frame。完成後，return value 通常放回 a0，exception return 恢復 privilege 與 PC。錯誤表示法是 ABI 的一部分，不可由 ISA encoding 單獨推得。",
          "system call 不保證每次都發生 context switch。若 request 可立即完成，kernel 可返回同一 thread；若需等待 I/O，thread 轉為 blocked，scheduler 才換人。相反地，timer interrupt 可在沒有 system call 時造成 preemption。trap、mode switch 與 context switch 因而是三個可重疊但不等價的事件。"
        ],
        figure: { type: "flow", title: "RISC-V system call 的控制與資料路徑", items: ["a7=number; a0–a5=args", "ecall", "trap entry + trap frame", "validate + dispatch", "kernel service / possible block", "a0=result", "exception return", "user PC resumes"], caption: "參數先依 ABI 放入 registers；是否排程其他 thread 由服務能否立即完成決定。" },
        sourceRefs: ["S1", "S2", "S7"]
      },
      {
        title: "5. 組譯器：位置計數器、符號與兩趟解析",
        paragraphs: [
          "assembler 解析 labels、mnemonics、operands 與 directives。instruction 產生 machine-code bytes；`.byte`、`.word`、`.align`、`.section` 等 directives 控制資料與 layout，不一定對應 CPU instruction。location counter 記錄目前 section 的 offset，label 則把名稱綁定到當下位置。",
          "forward reference 在讀到 branch 時尚不知道後方 label 的位址。典型 two-pass assembler 第一趟依 instruction/data 大小更新 location counter 並建立 symbol table；第二趟編碼 operands，已知的 local reference 可直接計算，仍待外部定義者則產生 relocation entry。實作也可用 backpatching，但資訊需求相同。",
          "PC-relative 欄位通常保存 target 相對某個架構指定基準的位移，而不是 target absolute address。MIPS branch 以 PC+4 為基準，位移以 instruction words 計；若 branch 位於 0x1004、target 0x1010，欄位為 (0x1010−0x1008)/4=2。計算前必須確認基準、縮放、signed range 與 alignment。"
        ],
        figure: { type: "timeline", title: "Two-pass assembler 如何解決 forward label", columns: ["讀 source", "更新位置", "建立符號", "編碼", "輸出"], rows: [{ label: "Pass 1", cells: ["scan", "size/align", "labels", "", "symbol table"] }, { label: "Pass 2", cells: ["scan", "", "lookup", "instructions/data", "bytes + relocations"] }], caption: "第一趟解決 section-local 位置；第二趟把可知值寫入欄位，外部或 layout-dependent 值保留為 relocation。" },
        sourceRefs: ["S4", "S7"]
      },
      {
        title: "6. ELF 目的檔：sections、symbols 與 relocations",
        paragraphs: [
          "relocatable object 尚不是可直接執行的 memory image。ELF section header 描述 `.text`、`.rodata`、`.data`、`.bss`、symbol table、string table 和 relocation sections；section 是 linker 的組織單位。`.bss` 表示需配置且初始化為零的資料，通常不必在檔案中存放同量 zero bytes。",
          "symbol table entry 記錄 name、binding、type、所屬 section 與 value。defined global symbol 可供其他 object 使用；undefined symbol 是等待 linker 尋找 definition 的 reference；local symbol 通常只在 object 內可見。weak/strong 規則與 visibility 會影響 resolution，並不是同名就任意選一個。",
          "relocation entry 指出要修補的位置、relocation type、相關 symbol 與 addend。type 決定公式、欄位寬度、signedness、縮放與 overflow check。把 relocation 只想成『填絕對位址』會漏掉 PC-relative、GOT-relative、TLS 和 instruction-split encodings。"
        ],
        figure: { type: "matrix", title: "ELF link-time sections 的角色", columns: ["Section 類型", "典型內容", "占檔案 bytes", "執行時權限", "主要使用者"], rows: [[".text", "instructions", "是", "R-X", "linker / loader"], [".rodata", "constants", "是", "R--", "linker / loader"], [".data", "initialized writable data", "是", "RW-", "linker / loader"], [".bss", "zero-initialized data", "近乎否", "RW-", "linker / loader"], [".symtab/.strtab", "names and symbols", "是", "通常不映射", "linker/debugger"], [".rela.*", "relocation records", "是", "通常不映射", "linker"]], caption: "section 描述 link-time 組織；最終載入權限由 program segments 決定。" },
        sourceRefs: ["S6", "S7"]
      },
      {
        title: "7. 靜態連結：符號解析、配置與重定位",
        paragraphs: [
          "static linker 先收集 input sections，依 linker script 或預設規則合併與排序，再為 output sections 配置 virtual address 和 file offset。alignment 會在 sections 間產生 padding；地址不能只把前一段 size 相加。之後 linker 解析 symbol definitions，套用 relocations，並建立 executable 或 shared object。",
          "常見 PC-relative relocation 可抽象為 S+A−P：S 是 symbol address，A 是 addend，P 是被修補位置。若 S=0x2400、A=−4、P=0x1010，結果為 0x13EC。真正 ELF relocation type 可能再做右移、切欄位或加入 GOT/PLT base，因此公式名稱和 ISA 規格都必須一起讀。",
          "archive library 通常按 unresolved symbols 抽取需要的 members，command-line order 因而可能影響一次掃描式解析。multiple strong definitions 通常是錯誤；unresolved required symbol 也會使連結失敗。link map、symbol table 與 relocation dump 能把『undefined reference』或錯誤跳址定位到確切 object 和修補點。"
        ],
        figure: { type: "flow", title: "Static linker 的資訊流", items: ["input objects + archives", "resolve symbols", "merge input sections", "apply script + alignment", "assign S and P", "evaluate relocations", "emit segments + entry point"], caption: "symbol resolution 決定名稱指向誰；layout 決定位址；relocation 才能把位址寫入正確欄位。" },
        sourceRefs: ["S5", "S6", "S7"]
      },
      {
        title: "8. Loader、execve 與執行時記憶體映像",
        paragraphs: [
          "ELF program header 描述 loader 要建立的 segments；section header 主要服務 link/debug。`PT_LOAD` entry 給出 file offset、virtual address、file size、memory size、alignment 與 R/W/X flags。loader 將檔案範圍映射到 pages，若 memory size 大於 file size，差額必須 zero-fill，這正是 `.bss` 常見的執行時來源。",
          "`execve` 以新程式映像取代目前 process 的 address space，但成功後仍沿用 process identity 的許多外部關係，例如 PID 與未被 close-on-exec 關閉的 descriptors。kernel 建立 mappings、stack、arguments、environment 與 auxiliary vector，設定 entry PC；若 executable 指定 interpreter，dynamic linker 會先取得控制。",
          "ASLR 讓 stack、shared objects、PIE executable 等 mapping base 在不同執行間變動，降低固定地址可預測性。position-independent code 以 PC-relative 或 GOT-based addressing 減少 text relocation。ASLR 不改變 section 內 object 的相對 layout，但使 absolute runtime address 不能從一次執行永久記住。"
        ],
        figure: { type: "hierarchy", title: "一個典型 process virtual address space", items: [{ label: "High addresses", detail: "user stack, argv, env, auxiliary vector" }, { label: "Mapped region", detail: "shared objects, dynamic linker, mmap files" }, { label: "Heap", detail: "dynamic allocation, grows by mappings/brk policy" }, { label: "Executable load segments", detail: "R-X text, R-- constants, RW- data + zero fill" }, { label: "Low addresses", detail: "normally left unmapped near null" }], caption: "實際方向、base 與區域排列由 ABI、OS 與 ASLR 決定；圖表示責任而非固定地址。" },
        sourceRefs: ["S6", "S8", "S9"]
      },
      {
        title: "9. 動態連結：shared objects、GOT 與 PLT",
        paragraphs: [
          "dynamic linking 把部分 symbol resolution 延到 load time 或 first call。dynamic linker 依 executable metadata 與搜尋規則載入 shared objects，處理 dependency graph、symbol lookup 與 dynamic relocations，再把控制交給程式 entry。library filename、SONAME、search path 與 already-loaded object identity 都會影響實際選到的版本。",
          "position-independent data reference 常透過 Global Offset Table：instruction 以相對方式找到 GOT slot，loader 把 runtime address 寫入 slot。外部 function call 常經 Procedure Linkage Table stub；eager binding 可在啟動時完成，lazy binding 則第一次呼叫 resolver 後改寫 slot。lazy binding 降低未使用 symbol 的 startup work，但增加第一次呼叫成本與狀態轉移。",
          "shared text pages 可由多個 processes 共用同一 physical pages，private writable data 則各自存在。這能節省記憶體與更新空間，但不是零成本：dynamic relocations、symbol lookup、page faults 與 indirection 仍存在。static 與 dynamic linking 的選擇還牽涉部署、ABI compatibility、security updates 和可重現性。"
        ],
        figure: { type: "flow", title: "第一次外部函式呼叫的 lazy binding 路徑", items: ["caller", "PLT entry", "unresolved GOT slot", "dynamic resolver", "search symbol definitions", "patch GOT slot", "target function", "later calls go direct via GOT"], caption: "具體名稱依 ABI 而異；核心概念是把一次昂貴解析結果快取在可寫的表格位置。" },
        sourceRefs: ["S7", "S9"]
      },
      {
        title: "10. 編譯器管線：從語意到 machine code",
        paragraphs: [
          "front end 執行 lexical analysis、parsing、name/type checking，建立帶語意的 intermediate representation。middle end 在 IR 上做 control-flow、data-flow 與 alias analysis，再執行 constant propagation、dead-code elimination、loop transformation 或 inlining。合法 optimization 必須保存語言與 ABI 可觀察行為，而不是只讓輸出看似相同。",
          "back end 將 IR operations 選成 target instructions，安排 instruction order，並把無限概念 temporaries 配到有限 registers。register allocation 發生 spill 時會新增 load/store 和 stack slots；instruction scheduling 在 dependency 與 latency 限制下調整順序。最後 assembler 或 integrated assembler 產生 object code、symbols、relocations 與 debug/unwind metadata。",
          "效能不能只由 source statement 數或 instruction count 判斷。optimization 可能減少 instructions 卻增加 CPI，也可能增加 code size 但改善 vectorization。CPU time=instruction count×CPI/clock rate 仍是整合模型；profile-guided optimization 和 link-time optimization 只是取得跨執行或跨 module 資訊，並未取消硬體成本。"
        ],
        figure: { type: "flow", title: "Compiler 的主要表示與決策", items: ["tokens + syntax tree", "typed semantic IR", "control/data-flow IR", "target-independent optimization", "instruction selection", "register allocation + scheduling", "machine instructions + metadata"], caption: "每次轉換都應能說明 preserved semantics，以及新加入的 target/ABI constraints。" },
        sourceRefs: ["S10", "S11"]
      },
      {
        title: "11. Interpreter、bytecode 與 JIT compilation",
        paragraphs: [
          "tree-walking interpreter 直接巡訪 syntax/AST；bytecode VM 先把 source 轉成較緊密的虛擬 instruction stream，再以 dispatch loop 執行。兩者都可快速開始且保留動態資訊，但每個 guest operation 會付出 decode、dispatch、type check 或 representation overhead。bytecode 是虛擬 ISA，不等於 host CPU machine code。",
          "JIT 在執行時挑選 hot code 編譯成 host machine code。它多付 compilation time 和 code memory，換取後續 calls 較低成本；runtime profile 可支持 speculative specialization、inlining 與 devirtualization。若假設失效，guard 會轉入 fallback 或 deoptimization，重建可由 interpreter/較低 tier 理解的 state。",
          "tiered execution 用 interpreter 或 baseline compiler 取得低 startup latency，再將反覆執行區域交給 optimizing tier。break-even 次數等於 JIT 額外固定成本除以每次節省時間。短命 command 可能永遠無法回收編譯成本，長時間 service 則重視 steady-state throughput 和 pause variability。"
        ],
        figure: { type: "matrix", title: "四種執行策略的成本輪廓", columns: ["策略", "啟動成本", "每次 dispatch", "可用 runtime profile", "典型風險"], rows: [["AST interpreter", "低", "高", "可", "節點/型別 overhead"], ["Bytecode VM", "低至中", "中", "可", "dispatch overhead"], ["AOT native", "建置時支付", "低", "有限", "缺少 runtime facts"], ["Tiered JIT", "執行時支付", "熱區低", "強", "compile pause/deopt"]], caption: "實際 runtime 常混合多種策略；比較時需同時列 startup、steady state、memory 與 tail latency。" },
        sourceRefs: ["S12"]
      },
      {
        title: "12. 虛擬機器與兩階段位址轉譯",
        paragraphs: [
          "virtual machine 向 guest 提供虛擬 CPU、memory 與 devices。hypervisor 必須截取或控制 guest 的 privileged operations，並在 guest 之間配置 host resources。type-1 hypervisor 直接管理硬體，type-2/hosted hypervisor 以 host OS process 等機制取得資源；這是部署結構分類，不直接保證某一類必然更快。",
          "hardware-assisted virtualization 讓 guest kernel 在受控 privilege mode 執行。RISC-V H extension 定義 HS/VS/VU 等狀態，以及 guest virtual address 經 VS-stage 轉成 guest physical address，再由 G-stage 轉成 supervisor physical address。每一階段都有 page permissions；translation cache 未命中時可能需要多次 page-table memory accesses。",
          "device virtualization 可採 emulation、paravirtual device 或 direct assignment。emulation 相容性高但需攔截較多 operations；paravirtual interface 讓 guest driver 用明確 queue protocol 降低 exits；direct assignment 可接近原生資料路徑，卻需要 IOMMU、interrupt remapping 與 ownership isolation。CPU virtualization 與 I/O virtualization 必須分開評估。"
        ],
        figure: { type: "flow", title: "RISC-V guest 的兩階段位址路徑", items: ["guest virtual address", "VS-stage page tables", "guest physical address", "G-stage page tables", "supervisor physical address", "host memory / MMIO"], caption: "page offset 在一般 4 KiB leaf translation 中保留；兩階段都可能因 permission 或 mapping 缺失而 fault。" },
        sourceRefs: ["S13", "S14"]
      },
      {
        title: "13. Containers、資源控制與端到端診斷",
        paragraphs: [
          "container 通常共享 host kernel，不為每個 container 提供完整 guest kernel。namespaces 改變 process 看見的 PID、mount、network 等資源視圖；cgroups 對 process 群組計量與限制 CPU、memory、I/O 等資源；capabilities、seccomp、LSM 與 filesystem policy 再縮小權限。image packaging 不是隔離本身。",
          "VM 的主要隔離邊界在 virtual hardware/hypervisor，container 的主要邊界在共同 kernel 提供的 process abstractions。VM 可執行不同 guest kernels，成本通常包含 guest memory 與 device model；container 啟動和密度通常較輕，但共同 kernel 的 attack surface 與 compatibility boundary 不同。兩者可疊加，例如在 VM 中執行 containers。",
          "端到端診斷要先辨認失敗發生在哪個轉換：compiler diagnostic 指向語言/IR，assembler error 指向 syntax/encoding，undefined symbol 指向 resolution，relocation overflow 指向 layout/range，loader error 指向 format/dependency/mapping，protection fault 指向 runtime address/permission，system-call error 指向 resource policy。保留 source、object、link map、ELF dump、process maps、trace 與 performance counters，才能把現象對回正確層次。"
        ],
        figure: { type: "matrix", title: "VM 與 container 的隔離邊界", columns: ["面向", "Virtual machine", "Container", "兩者疊加時"], rows: [["Kernel", "每個 guest 可不同", "共享 host kernel", "guest kernel 內共享"], ["Hardware view", "virtual CPU/memory/devices", "host process view", "先虛擬硬體再切 process"], ["Resource control", "hypervisor allocation", "cgroups/scheduler", "兩層 quota 都生效"], ["主要啟動物", "guest OS + services", "process + image", "VM 後啟 container"], ["診斷邊界", "guest/host/hypervisor", "process/shared kernel", "需辨認兩層 mapping"]], caption: "兩種技術解決的邊界不同，不能只用啟動速度或封裝格式判定隔離強度。" },
        sourceRefs: ["S14", "S15"]
      }
    ],
    workedExamples: [
      { title: "例題一：量化 context-switch 直接成本", prompt: "2 GHz CPU 每次 context switch 花 12,000 cycles，每秒發生 1000 次。求單次時間與單核心時間比例。", steps: ["單次時間=cycles/clock rate。", "12,000/(2×10^9)=6×10^-6 s=6 µs。", "每秒總時間=1000×6 µs=6000 µs。", "6000 µs=6 ms=0.006 s。", "單核心比例=0.006/1=0.6%。", "這只含直接 cycles；cache、TLB 與 migration 的後續成本未計。"], result: "單次 6 µs，每秒直接使用 6 ms，也就是單核心 0.6%。" },
      { title: "例題二：追蹤 RISC-V write system call", prompt: "以 Linux RISC-V ABI 表示 write(fd=1, buf, count=5)，追蹤入口到返回所需的 architectural state。", steps: ["將 system-call number 64 放入 a7。", "將 fd=1 放入 a0，buffer address 放入 a1，count=5 放入 a2。", "執行 ecall，CPU 以 environment-call exception 進入 trap path。", "kernel 從 trap frame 取得 number/arguments，驗證 user buffer range 與 descriptor。", "service 完成後把 result 或 ABI 定義的錯誤表示放回 a0。", "exception return 恢復 user PC/privilege；若 I/O 曾阻塞，中間可能另有 scheduler switch。"], result: "入口關鍵值為 a7=64、a0=1、a1=buf、a2=5；ecall 本身不等於一定換行程。" },
      { title: "例題三：計算 two-pass branch label", prompt: "MIPS 指令固定 4 bytes。branch 在 0x1004，下一指令為 0x1008，target label 位於 0x1010。求 branch immediate。", steps: ["Pass 1 由 base 與每條 4 bytes 計出 label address=0x1010。", "MIPS branch base 是 PC+4，因此 base=0x1008。", "byte displacement=0x1010−0x1008=8 bytes。", "欄位以 word 為單位，8/4=2。", "2 可放入 signed 16-bit immediate，且 target 為 4-byte aligned。", "執行時重建 target=0x1008+(2<<2)=0x1010。"], result: "branch immediate=2；若誤用目前 PC，會得到 3 並跳到錯誤位置。" },
      { title: "例題四：套用 PC-relative relocation", prompt: "某 relocation 使用 S+A−P。已知 S=0x2400、A=−4、P=0x1010，求待寫值。", steps: ["S 是目標 symbol runtime/link address 0x2400。", "A 是 relocation addend −4。", "P 是被修補欄位地址 0x1010。", "代入：0x2400−4−0x1010。", "0x2400−0x1010=0x13F0，再減 4 得 0x13EC。", "寫入前還須依 relocation type 檢查 signed range、縮放與欄位切割。"], result: "抽象 relocation value=0x13EC；是否直接寫完整值由實際 relocation type 決定。" },
      { title: "例題五：配置對齊後的 output sections", prompt: "`.text` 從 0x1000 開始、size 0x1A0；`.rodata` 與 `.data` 都需 0x100 alignment，rodata size 0x90。求各起訖位置。", steps: ["text start=0x1000。", "text end-exclusive=0x1000+0x1A0=0x11A0。", "把 0x11A0 向上對齊 0x100，rodata start=0x1200，產生 0x60 padding。", "rodata end-exclusive=0x1200+0x90=0x1290。", "把 0x1290 向上對齊 0x100，data start=0x1300，產生 0x70 padding。", "因此 symbol address 必須在 layout 完成後計算，不能只串接 sizes。"], result: "text [0x1000,0x11A0)、rodata [0x1200,0x1290)、data 從 0x1300 開始。" },
      { title: "例題六：區分 ELF file size 與 memory size", prompt: "一個 RW load segment 含 1536 bytes initialized data 與 4096 bytes BSS。忽略 page padding，求檔案 payload、記憶體需求與 zero-fill。", steps: ["initialized data 必須在 executable 中保存，因此 file payload=1536 bytes。", "BSS 只描述執行時需為零的區域，不需保存 4096 個 zero bytes。", "memory size=1536+4096=5632 bytes。", "loader 映射 file-backed 1536 bytes。", "其後 4096 bytes 建立為 zero-filled memory。", "所以 program header 的 p_memsz 可大於 p_filesz，差額是 4096 bytes。"], result: "file payload 1536 bytes，memory 5632 bytes，loader zero-fill 4096 bytes。" },
      { title: "例題七：計算 shared library pages 的節省", prompt: "10 個 processes 使用同一 library；每份有 3 MiB read-only text 與 0.5 MiB private writable data。比較可共享 text 與完全複製。", steps: ["完全複製每 process=3+0.5=3.5 MiB。", "10 份總量=10×3.5=35 MiB。", "共享模式只需一份 text=3 MiB。", "private data 仍需 10×0.5=5 MiB。", "共享總量=3+5=8 MiB。", "節省=35−8=27 MiB；尚未計 page tables、relocations 與未實際 fault-in pages。"], result: "理想物理頁用量由 35 MiB 降為 8 MiB，節省 27 MiB。" },
      { title: "例題八：評估 optimization 的整體 CPU time", prompt: "原程式 IC=10^9、CPI=1.5、clock=3 GHz。最佳化後 IC=0.75×10^9、CPI=1.7。求兩者時間與 speedup。", steps: ["原時間=10^9×1.5/(3×10^9)=0.5 s。", "最佳化後 cycles=0.75×10^9×1.7=1.275×10^9。", "新時間=1.275×10^9/(3×10^9)=0.425 s。", "speedup=old/new=0.5/0.425≈1.17647。", "雖然 CPI 由 1.5 升到 1.7，IC 降低更多。", "因此只比較 IC 或 CPI 都無法得出完整結論。"], result: "時間由 0.500 s 降為 0.425 s，speedup 約 1.176 倍。" },
      { title: "例題九：求 JIT break-even 次數", prompt: "JIT compilation 固定花 40 ms；編譯後每 call 2 µs，interpreter 每 call 10 µs。至少幾次 calls 才回收成本？", steps: ["每次節省=10−2=8 µs。", "固定成本 40 ms=40,000 µs。", "break-even N=40,000/8。", "N=5000 calls。", "5000 次時兩者總時間都為 50 ms：interpreter 5000×10 µs；JIT 40 ms+5000×2 µs。", "少於 5000 次 interpreter 較快，多於 5000 次才開始有淨收益。"], result: "break-even 為 5000 calls。" },
      { title: "例題十：完成兩階段 4 KiB page translation", prompt: "GVA=0x12345ABC。VS-stage 對應 guest PPN=0x45678，G-stage 對應 host PPN=0x9ABCD。求 GPA 與 supervisor physical address。", steps: ["4 KiB page 有 12-bit offset。", "GVA offset=0xABC，VPN=0x12345。", "VS-stage 保留 offset，GPA=(0x45678<<12)|0xABC=0x45678ABC。", "G-stage 以 guest physical page number 查得 host PPN=0x9ABCD。", "再次保留 offset，SPA=(0x9ABCD<<12)|0xABC=0x9ABCDABC。", "任一 stage permission 不足或 entry invalid 都會 fault，不能只檢查最後 physical address。"], result: "GPA=0x45678ABC，supervisor physical address=0x9ABCDABC。" }
    ],
    misconceptions: [
      ["System call 就是普通 library function call。", "library wrapper 可用一般 call 進入，但真正 system-call boundary 需要 trap、privilege transition 與 kernel validation。"],
      ["每次 system call 都會換到另一個 process。", "mode switch 可返回同一 thread；只有 blocking、preemption 或其他排程決策才需 context switch。"],
      ["Context switch 只保存 general-purpose registers。", "還可能涉及 PC、status、stack、address-space identity、floating/vector state 與間接 cache/TLB effects。"],
      ["Assembler 看見 label 就一定知道最終 absolute address。", "relocatable object 的最終 layout 尚未決定；外部或 layout-dependent reference 必須保留 relocation。"],
      ["ELF section 與 segment 是同一張表的兩個名稱。", "section 是 link-time 組織，segment 是 loader 建立 runtime mapping 的單位。"],
      ["BSS 是 executable 中一大段 zero bytes。", "BSS 通常以 memory-size metadata 表示，loader 建立 zero-filled pages，避免相同 zeros 佔檔案。"],
      ["Linker 只把 object files 首尾相接。", "它還要解析 symbols、套用 script/alignment、配置位址、檢查 relocation range 並建立 program headers。"],
      ["Dynamic linking 代表所有 library code 每個 process 都各複製一份。", "read-only code pages通常可共享；writable state 與部分 relocation pages仍是 private。"],
      ["Compiler optimization 讓 instruction count 下降就必然更快。", "CPU time 同時受 IC、CPI、clock、cache 與執行路徑影響，必須整體量測或計算。"],
      ["Bytecode 可直接由任何 CPU 執行。", "bytecode 是虛擬 machine 的 instruction format，仍需 interpreter 或 JIT 轉成 host behavior。"],
      ["Type-1 hypervisor 必然比 hosted hypervisor 快。", "分類描述部署邊界；實際成本由 exits、translation、device path、scheduler 與實作決定。"],
      ["Container 就是一種較小的 VM。", "container 通常共享 host kernel，以 namespaces/cgroups 等隔離 processes；VM 則提供 virtual hardware 和獨立 guest kernel。"]
    ],
    exercises: [
      { level: "基礎", question: "語言規格、ABI 與 ISA 分別約束哪一層？", solution: ["語言規格定義 source-level types、operations 與可觀察語意；ISA 定義 machine instructions 和 architectural state。", "ABI 位在兩者與 OS 之間，規定 calling convention、register roles、object format、stack 與 system interface。"] },
      { level: "基礎", question: "process 與 thread 的 state 有哪些共享與私有部分？", solution: ["同 process threads 通常共享 virtual address space、code/data 與 open files。", "每個 thread 有自己的 PC、register context、stack 與 scheduling state。"] },
      { level: "基礎", question: "同步 trap 與外部 interrupt 的 cause 有何差異？", solution: ["同步 trap 直接由目前 instruction 引起，例如 ecall 或 page fault。", "外部 interrupt 來自 timer/device 等非同步來源，可在 instruction boundary 被處理。"] },
      { level: "基礎", question: "assembler directive 為何不一定產生 CPU instruction？", solution: ["directive 命令 assembler 選 section、配置資料、對齊或宣告 symbol。", "只有 instruction mnemonic 的編碼才對應 ISA instruction；directive 可只改 metadata/location counter。"] },
      { level: "基礎", question: "為何 `.bss` 能增加 memory size 卻幾乎不增加 file payload？", solution: ["它描述 zero-initialized storage，檔案只需記錄位置與大小。", "loader 配置對應 memory 並保證初值為零，不必逐 byte 儲存 zeros。"] },
      { level: "基礎", question: "ELF section header 與 program header 的主要使用者各是誰？", solution: ["section headers 主要供 assembler/linker/debugger 組織 symbols、code、data 與 relocations。", "program headers 供 loader 建立 runtime segments、permissions 與 entry environment。"] },
      { level: "計算", question: "3 GHz CPU 每次 context switch 為 9000 cycles，每秒 20,000 次，占單核心多少？", solution: ["單次=9000/(3×10^9)=3 µs。", "每秒=20,000×3 µs=60 ms，因此占單核心 6%。"] },
      { level: "計算", question: "MIPS branch 位於 0x2000，target=0x1FF0，求 signed word displacement。", solution: ["base=PC+4=0x2004，byte displacement=0x1FF0−0x2004=−0x14=−20。", "以 4-byte word 為單位，immediate=−20/4=−5。"] },
      { level: "計算", question: "relocation 使用 S+A−P，S=0x5000、A=8、P=0x4800，結果為何？", solution: ["代入為 0x5000+8−0x4800。", "0x5000−0x4800=0x800，因此結果=0x808；仍須做 type-specific range check。"] },
      { level: "計算", question: "section 末端為 0x237A，下一 section 要求 0x100 alignment，起點與 padding 是多少？", solution: ["下一個 0x100 邊界是 0x2400。", "padding=0x2400−0x237A=0x86 bytes。"] },
      { level: "計算", question: "segment 的 p_filesz=0x900、p_memsz=0x1500，loader 要 zero-fill 多少？", solution: ["差額=0x1500−0x900=0xC00 bytes。", "file-backed 部分到 p_filesz；其後至 p_memsz 的 0xC00 bytes 必須初始化為零。"] },
      { level: "計算", question: "JIT 固定成本 24 ms，interpreter 9 µs/call，JIT code 3 µs/call，break-even 為幾次？", solution: ["每次節省 6 µs，24 ms=24,000 µs。", "N=24,000/6=4000 calls。"] },
      { level: "計算", question: "20 processes 共用 5 MiB text，各有 0.25 MiB private data；理想總物理量是多少？", solution: ["shared text 只計 5 MiB。", "private data=20×0.25=5 MiB，總計 10 MiB。"] },
      { level: "進階", question: "為何 ASLR 下 PC-relative code 比 absolute-address text relocation 更容易共享？", solution: ["PC-relative reference 依 code 與 target 的相對距離，整段換 base 時通常不必修改 instruction page。", "absolute text relocation 需在每個 runtime base 寫入不同值，使原本 read-only code page 變成 process-private。"] },
      { level: "進階", question: "lazy binding 的第一次與後續函式呼叫各走什麼路徑？", solution: ["第一次經 PLT/GOT 進 resolver，搜尋 symbol 並把結果寫入 slot。", "後續呼叫讀取已解析 slot，直接跳到 target，省去重複 lookup。"] },
      { level: "進階", question: "register allocation 發生 spill 為何可能同時改變 IC 與 CPI？", solution: ["spill 插入 load/store，直接增加 dynamic instruction count。", "新增 memory operations 也會改變 dependency、cache miss 與 pipeline pressure，因此 CPI 也可能變動。"] },
      { level: "整合", question: "兩階段轉譯中，VS-stage 允許 write、G-stage 禁止 write，guest store 是否成功？", solution: ["不成功；有效權限必須通過兩個 stage 的檢查。", "G-stage write permission fault 會把控制交給 hypervisor-defined trap path，即使 guest page table 允許 write。"] },
      { level: "整合", question: "程式出現 `undefined reference`，應優先檢查哪些 artifact，而不是執行時 page table？", solution: ["檢查 object symbol tables、definition visibility、archive/library order、link command 與 link map。", "這是 link-time name resolution 失敗，尚未產生可載入映像，runtime page table 不是第一層原因。"] }
    ],
    glossary: [
      ["System software", "管理、轉換或提供執行環境的 compiler、assembler、linker、loader、kernel 與 runtime 等軟體。"],
      ["Privilege mode", "限制可執行 instructions 與可存取 control resources 的處理器狀態。"],
      ["Process", "具有受保護 address space、resources 與至少一條執行控制流的程式個體。"],
      ["Thread", "可被 scheduler 執行、具有獨立 PC/registers/stack 的 control flow。"],
      ["Context switch", "保存一個 execution context 並恢復另一個 context 的排程轉換。"],
      ["Trap", "由 exception、system call 或 interrupt 進入受信任 handler 的控制轉移。"],
      ["System call", "user process 依 ABI 請求 kernel service 的受控介面。"],
      ["ABI", "規範 binary-level calling convention、register、stack、object format 與 system interface 的契約。"],
      ["Assembler", "把 assembly instructions/directives 轉成 object bytes、symbols 與 relocations 的工具。"],
      ["Location counter", "assembler 在目前 section 內追蹤下一個 byte/word 位置的狀態。"],
      ["Symbol", "把名稱連到 section、value、binding、type 或未定義 reference 的 link-time record。"],
      ["Relocation", "描述 link/load time 應如何依 symbol 與位置修補欄位的 record。"],
      ["ELF", "Executable and Linkable Format，用於 relocatable object、executable、shared object 與 core file。"],
      ["Section", "ELF 中供 linking/debugging 組織 code、data、symbols 或 relocations 的單位。"],
      ["Segment", "program header 描述、供 loader 映射為 runtime memory region 的單位。"],
      ["BSS", "執行時配置且初值為零、通常不逐 byte 儲存在檔案中的資料區。"],
      ["Static linker", "解析 symbols、配置 sections、套用 relocations 並產生映像的工具。"],
      ["Linker script", "控制 output sections、memory regions、alignment、symbols 與 entry 的配置規則。"],
      ["Loader", "依 executable metadata 建立 process mappings、stack 與 entry state 的機制。"],
      ["Dynamic linker", "在 load/run time 載入 shared objects 並解析 dynamic symbols/relocations 的 runtime。"],
      ["GOT", "Global Offset Table，保存 position-independent code 所需 runtime addresses 的表。"],
      ["PLT", "Procedure Linkage Table，將外部 function call 導向 dynamic resolution/target 的 stubs。"],
      ["PIC", "Position-Independent Code，可在不同 base address 執行而少做或不做 text relocation。"],
      ["ASLR", "Address Space Layout Randomization，改變 mappings 的 runtime base 以降低地址可預測性。"],
      ["IR", "Intermediate Representation，compiler analyses 與 transformations 使用的中間程式形式。"],
      ["Register allocation", "把 compiler temporaries 配到 physical registers，必要時產生 spill 的步驟。"],
      ["Interpreter", "在 runtime 逐步解讀 source/AST/bytecode 語意而執行的系統。"],
      ["JIT", "Just-In-Time compilation，在執行期間把程式區域編譯成 host machine code。"],
      ["Hypervisor", "建立與管理 virtual machines、仲裁 guest 與 physical resources 的軟體層。"],
      ["Container", "共享 kernel、以 namespaces/cgroups 等隔離和控制 process 群組的執行環境。"]
    ],
    sources: [
      { key: "S1", title: "Cornell CS3410 Spring 2026: Processes and System Calls", url: "https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/process.html", accessed: "2026-08-22", use: "process、context、system calls、user/kernel boundary 與 RISC-V Linux syscall registers。" },
      { key: "S2", title: "Cornell CS3410 Spring 2026: Interrupts and Traps", url: "https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/interrupt.html", accessed: "2026-08-22", use: "interrupt、exception、trap、context save 與 privilege transition。" },
      { key: "S3", title: "MIT 6.1810 Operating System Engineering", url: "https://ocw.mit.edu/courses/6-1810-operating-system-engineering-fall-2023/", accessed: "2026-08-22", use: "xv6-backed processes、virtual memory、traps、system calls、scheduling 與 file interface。" },
      { key: "S4", title: "GNU Binutils 2.47: Using as", url: "https://sourceware.org/binutils/docs/as/", accessed: "2026-08-22", use: "assembler syntax、directives、symbols、sections、location counter 與 object generation。" },
      { key: "S5", title: "GNU ld 2.47: Linker Scripts", url: "https://sourceware.org/binutils/docs/ld/Scripts.html", accessed: "2026-08-22", use: "section placement、memory layout、alignment、entry point 與 linker-script semantics。" },
      { key: "S6", title: "System V ABI: ELF Specification", url: "https://refspecs.linuxfoundation.org/elf/elfspec.pdf", accessed: "2026-08-22", use: "ELF headers、sections、segments、symbols、relocations、loading 與 dynamic linking。" },
      { key: "S7", title: "RISC-V ABIs Specification", url: "https://riscv-non-isa.github.io/riscv-elf-psabi-doc/", accessed: "2026-08-22", use: "calling convention、ELF object conventions、relocation expressions、GOT/PLT 與 linker relaxation。" },
      { key: "S8", title: "Linux man-pages: execve(2)", url: "https://man7.org/linux/man-pages/man2/execve.2.html", accessed: "2026-08-22", use: "process image replacement、arguments/environment、interpreter、descriptors 與 process attributes。" },
      { key: "S9", title: "Linux man-pages: ld.so(8)", url: "https://man7.org/linux/man-pages/man8/ld.so.8.html", accessed: "2026-08-22", use: "dynamic loader、shared-object dependency resolution、search paths、preload 與 secure-execution behavior。" },
      { key: "S10", title: "GCC Internals: Passes and Files of the Compiler", url: "https://gcc.gnu.org/onlinedocs/gccint/Passes.html", accessed: "2026-08-22", use: "front end、IR、GIMPLE/RTL passes、optimization、register allocation 與 final emission。" },
      { key: "S11", title: "GCC 16.1: Options That Control Optimization", url: "https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html", accessed: "2026-08-22", use: "optimization levels、individual transformations、profile-guided 與 link-time optimization。" },
      { key: "S12", title: "LLVM: ORCv2 JIT APIs", url: "https://llvm.org/docs/ORCv2.html", accessed: "2026-08-22", use: "JIT linking、symbol lookup、lazy materialization、concurrent compilation 與 runtime lifecycle。" },
      { key: "S13", title: "RISC-V Privileged ISA: Hypervisor Extension", url: "https://docs.riscv.org/reference/isa/priv/hypervisor", accessed: "2026-08-22", use: "HS/VS/VU privilege、two-stage address translation、guest traps 與 virtualized interrupts。" },
      { key: "S14", title: "Oracle VirtualBox 7.2: Introduction", url: "https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/Introduction.html", accessed: "2026-08-22", use: "hosted virtualization、guest/host、virtual hardware、VM lifecycle 與 deployment boundary。" },
      { key: "S15", title: "Linux Kernel: Control Group v2", url: "https://docs.kernel.org/admin-guide/cgroup-v2.html", accessed: "2026-08-22", use: "cgroup hierarchy、process membership、CPU/memory/I/O resource control 與 delegation。" }
    ]
  },
  {
    chapter: 9,
    title: "替代型計算機架構：從 ILP 到異質平行系統",
    english: "Alternative Architectures: From ILP to Heterogeneous Parallel Systems",
    revised: "2026-08-23",
    readingTime: "約 260–320 分鐘",
    intro: "單一順序指令流不是唯一的計算組織方式。現代 CPU 在不改變程式順序語意的前提下，以 superscalar、out-of-order 與 speculation 挖掘 instruction-level parallelism；vector processor 和 GPU 把同一運算擴展到許多資料元素；multicore 與 cluster 讓多個指令流透過共享記憶體或 message passing 協作；dataflow、systolic array 與 neural accelerator 則把運算和資料移動固定成更專用的空間結構。量子處理器更換了 state、operation 與 measurement 的基本模型。本章以『平行工作由誰發現、由誰排程、資料放在哪裡、如何同步、上限由什麼決定』為主線，建立各種架構可比較、可計算且不混淆抽象層次的共同框架。",
    outcomes: [
      "能用 Flynn taxonomy 分辨 SISD、SIMD、MISD 與 MIMD，並說明其分類限制。",
      "能區分 RISC ISA 原則與 superscalar、out-of-order 等微架構實作。",
      "能追蹤 register renaming、issue、execute、retire 如何保存 precise architectural state。",
      "能比較動態 superscalar 排程與 VLIW/EPIC 靜態排程的責任分配。",
      "能依 VLEN、SEW、VL 計算 vector strip-mining 次數與 lane utilization。",
      "能分辨 SIMD、SIMT、SPMD 與 thread-level parallelism，並量化 warp divergence。",
      "能說明 cache coherence、memory consistency、atomicity 與 synchronization 的差異。",
      "能比較 shared-memory OpenMP 與 distributed-memory MPI 的資料交換成本。",
      "能套用 Amdahl's Law、Gustafson's Law、parallel efficiency 與 communication model。",
      "能推導 dataflow firing、systolic wavefront 與 roofline throughput ceiling。",
      "能以 state vector、unitary gate、measurement probability 與 circuit depth描述量子架構的基本限制。"
    ],
    sections: [
      {
        title: "1. 平行性有不同粒度，也有不同責任邊界",
        paragraphs: [
          "parallelism 是同一段時間內有多個有用 operations 前進，但 operations 可以來自同一 instruction 的多個資料元素、同一 thread 的多條獨立 instructions、多個 threads、多個 processes，或專用 accelerator 的 processing elements。data-level parallelism、instruction-level parallelism（ILP）、thread-level parallelism（TLP）與 request-level parallelism（RLP）描述不同來源，不能只以『核心數』概括。",
          "Flynn taxonomy 以 instruction streams 與 data streams 各為 single/multiple，形成 SISD、SIMD、MISD、MIMD。它描述觀察到的控制/資料流，不直接指定 cache、interconnect、programming language 或是否 out-of-order。superscalar CPU 對單一 sequential program 可同時發出多條 instructions，但在 Flynn 的程式模型分類中仍常視為 SISD。",
          "真實系統常疊加分類：MIMD multicore 的每個 core 可能是 superscalar，core 內又有 SIMD vector units；GPU grid 是大量 threads 的 SPMD programming model，warp 在硬體上以 SIMT 執行。比較架構時必須先選定觀察層次，否則同一 GPU 可被不一致地貼上 SIMD 或 MIMD 標籤。"
        ],
        figure: { type: "matrix", title: "Flynn taxonomy 與現代解讀", columns: ["Instruction streams", "Data streams", "分類", "典型抽象", "不代表"], rows: [["Single", "Single", "SISD", "sequential program/core", "一定是單週期或 in-order"], ["Single", "Multiple", "SIMD", "vector instruction over lanes", "每 lane 有獨立 instruction stream"], ["Multiple", "Single", "MISD", "罕見的多重處理鏈", "一般 pipeline"], ["Multiple", "Multiple", "MIMD", "multicore/cluster", "一定共享 memory"]], caption: "taxonomy 只用兩個 stream 維度分類；microarchitecture、memory model 與 programming model 要另外描述。" },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "2. RISC 是 ISA 設計取向，不是低效能微架構",
        paragraphs: [
          "RISC 架構通常強調規則 instruction encoding、load/store memory operations、較多 registers 與易於 pipeline 的基本 operations；CISC 則可提供較多 addressing forms 或複雜 instructions。這是 ISA interface 的取向，不是 transistor 數、issue width 或 clock frequency 的直接分類。RISC ISA 完全可以由寬發射、out-of-order、speculative CPU 實作。",
          "ISA 決定 software-visible registers、instructions、exceptions 與 memory-order rules；microarchitecture 決定 decode width、reorder buffer、execution ports、cache hierarchy 與 predictor。相同 RISC-V binary 可以在小型 in-order core 與大型 out-of-order core 上正確執行，只是 latency、IPC、power 和 supported optional extensions 不同。",
          "簡單 encoding 能降低部分 front-end 複雜度，但現代效能仍受 branch prediction、data dependencies、memory latency 與 instruction supply 限制。把『一條 RISC instruction 做的事較少』直接推成『程式一定較慢』忽略 instruction count、CPI、clock rate 與 compiler code generation 的共同作用。"
        ],
        figure: { type: "hierarchy", title: "同一 ISA 下可存在的微架構跨度", items: [{ label: "Program / ABI", detail: "相同 binary-level contract" }, { label: "RISC-V ISA", detail: "instructions, registers, exceptions, memory model" }, { label: "Small core", detail: "in-order, narrow issue, small caches" }, { label: "Large core", detail: "superscalar, out-of-order, speculation" }, { label: "Implementation result", detail: "不同 IPC, frequency, area, power" }], caption: "ISA 相容不要求內部 datapath 相同；software-visible結果必須符合相同 architectural contract。" },
        sourceRefs: ["S2", "S3", "S16"]
      },
      {
        title: "3. Superscalar 與 out-of-order execution 挖掘 ILP",
        paragraphs: [
          "superscalar front end 每 cycle 最多 fetch/decode/rename 多條 instructions，back end 也有多個 execution units。issue width 是每 cycle 的理論寬度，實際 IPC 還受 instruction supply、dependencies、port conflicts、cache misses、branch mispredictions 與 retirement width 限制。四寬處理器並不保證 IPC=4。",
          "register renaming 把 ISA architectural register 名稱映射到較多 physical registers，消除 WAR 與 WAW false dependencies；RAW true dependency 仍必須等待 producer。reservation stations 或 issue queues 保存待執行 operations，operands ready 且 execution port 可用時便可越過較早但尚未 ready 的 instruction。",
          "out-of-order execute 之後通常依 program order retire。reorder buffer 保存順序、result status 與 exception information，只有最舊已完成 instruction 能提交 architectural state。若 speculation 錯誤或較老 instruction fault，較新的 speculative results 被丟棄，因而維持 precise exception。"
        ],
        figure: { type: "flow", title: "Out-of-order core 的前進與提交路徑", items: ["fetch + predict", "decode", "rename physical registers", "dispatch to issue queue", "out-of-order execute", "write result", "in-order retire", "architectural state"], caption: "execute 可重排，retire 仍按 program order；rename map 與 reorder buffer 共同區分 speculative/committed state。" },
        sourceRefs: ["S2", "S3"]
      },
      {
        title: "4. VLIW/EPIC 把排程責任移向 compiler",
        paragraphs: [
          "VLIW 將多個可並行 operations 編入同一個很寬的 instruction word 或 bundle，不同 slots 對應可用 functional-unit 類型。compiler 建立 dependency graph、安排 operations 到 cycles/slots，必要時插入 NOP。hardware 不必像通用 out-of-order core 一樣在 runtime 搜尋大量 ready instructions。",
          "static scheduling 的難點是 latency、resource 與 control-flow assumptions 被編進 binary。若下一代實作改變 operation latency 或 functional units，舊 schedule 可能仍正確但效率下降；binary compatibility、code size、cache pressure 和 unpredictable memory latency 都是成本。EPIC 類設計以 predication、speculation hints 與 bundles 增加 compiler 可表達資訊。",
          "動態 superscalar 看到當次 cache miss、branch outcome 與 runtime dependencies，可即時改排；VLIW compiler 則看到較大範圍的 source/IR dependence，且 scheduling logic 不必每 cycle耗電。兩者不是『硬體平行』與『軟體不平行』的對立，而是誰在什麼時刻決定 issue grouping。"
        ],
        figure: { type: "timeline", title: "四槽 VLIW bundle 的靜態配置", columns: ["0", "1", "2", "3", "4"], rows: [{ label: "ALU slot", cells: ["A", "D", "G", "J", "M"] }, { label: "MUL slot", cells: ["B", "", "H", "K", ""] }, { label: "MEM slot", cells: ["", "E", "I", "", "N"] }, { label: "BR slot", cells: ["C", "F", "", "L", ""] }], caption: "每個 cycle 對應一個 bundle；空白 slot 仍占 encoding，示例共有 13 個 useful operations、20 個 slots。" },
        sourceRefs: ["S4", "S17"]
      },
      {
        title: "5. Vector architecture 以 VL 控制資料平行",
        paragraphs: [
          "vector instruction 對一組 elements 執行相同 operation，vector registers 保存多個 elements，lanes 提供平行 datapaths。以 RISC-V V extension 為例，VLEN 是 implementation 的 vector-register bit width，SEW 是 selected element width，LMUL 可把多個 registers 組成較大的 register group；當 LMUL=1 時，VLMAX 約為 VLEN/SEW。",
          "程式以 strip mining 處理任意長度 N：每輪 `vsetvli` 依剩餘 elements 和 hardware capacity 設定 VL，vector load/compute/store 只處理 active elements，再把 index 增加 VL。最後一輪可自然使用較小 VL，避免為固定 SIMD width 另寫 scalar tail。vector-length agnostic binary 因而能在不同 VLEN implementations 上運作。",
          "mask register 讓每個 element 可選擇是否更新，適合 conditionals 與 tail；但 masked-off lanes 不產生有用 operation，不能視為滿利用率。vector chaining、memory stride、gather/scatter、bank conflicts 與 memory bandwidth 會使 peak lane count 與實際 throughput 出現差距。"
        ],
        figure: { type: "bits", title: "VLEN=256、SEW=32、LMUL=1 的 vector register", totalBits: 256, items: [{ label: "e0", bits: 32, detail: "element 0" }, { label: "e1", bits: 32, detail: "element 1" }, { label: "e2", bits: 32, detail: "element 2" }, { label: "e3", bits: 32, detail: "element 3" }, { label: "e4", bits: 32, detail: "element 4" }, { label: "e5", bits: 32, detail: "element 5" }, { label: "e6", bits: 32, detail: "element 6" }, { label: "e7", bits: 32, detail: "element 7" }], caption: "此設定 VLMAX=8 elements；實際 VL 可小於 8，例如最後一輪只啟用 3 個 elements。" },
        sourceRefs: ["S5", "S6"]
      },
      {
        title: "6. SIMD、SIMT 與 GPU warp 不是同一抽象",
        paragraphs: [
          "SIMD instruction 在 ISA 中明確操作 vector lanes；SIMT programming model 讓每個 thread 保有自己的 registers、thread index 與邏輯 control flow，hardware 再把 threads 分組執行。CUDA 中 32 threads 組成一個 warp；warp issue 一個共同 instruction，active mask 指定目前參與的 lanes。",
          "同一 warp 的 threads 遇到 data-dependent branch 並走不同 paths 時，hardware 必須在不同 active masks 下執行各 path，稱為 divergence。結果仍符合各 thread 的 control flow，但 lanes 在另一 path 執行期間閒置。divergence 只在 warp 內造成這種 serialization，不同 warps 走不同 paths 不等同於同一 warp divergence。",
          "GPU 以大量 resident warps 隱藏 long-latency operation：某 warp 等 memory 時，scheduler 可 issue 另一個 ready warp。occupancy 受 registers、shared memory、block/warp limits 共同限制；高 occupancy 只增加可選 warps，不保證 coalesced memory、低 divergence 或足夠 arithmetic intensity。"
        ],
        figure: { type: "timeline", title: "一個 divergent warp 的 active masks", columns: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], rows: [{ label: "Path A: 20 lanes", cells: ["20", "20", "20", "20", "20", "", "", "", "", "", "", ""] }, { label: "Path B: 12 lanes", cells: ["", "", "", "", "", "12", "12", "12", "12", "12", "12", "12"] }, { label: "Reconverged", cells: ["", "", "", "", "", "", "", "", "", "", "", "32"] }], caption: "示例以先 A 後 B 表示 serialization；實際 scheduling/reconvergence 細節依架構，但 inactive lanes 不完成該 path 的工作。" },
        sourceRefs: ["S1", "S7"]
      },
      {
        title: "7. Shared-memory multicore 需要 coherence 與 consistency",
        paragraphs: [
          "每個 core 有 private cache 時，同一 physical cache line 可能出現多份 copies。cache coherence 對單一 memory location 的 writes/reads 建立一致性，例如 write-invalidate protocol 先取得 exclusive ownership，再使其他 cached copies invalid。MESI 類 states描述 line 是否 modified、exclusive、shared 或 invalid，但具體 protocol 可有更多 states與 directory。",
          "memory consistency model 規定不同 locations 的 memory operations 可被其他 harts 觀察成哪些順序。coherence 不自動保證 `write data; write flag` 在另一 core 看來同序；RISC-V RVWMO 允許較弱排序，跨 hart communication 需使用 acquire/release、atomics 或 FENCE 等同步機制建立 happens-before。",
          "false sharing 發生在 cores 修改同一 cache line 中不同 variables。程式沒有共享同一 variable，卻因 ownership 以 line 為單位來回轉移而變慢。padding 或重新配置 data ownership 可降低 transfer，但會增加 footprint；正確性問題與效能問題仍要分開判斷。"
        ],
        figure: { type: "flow", title: "Write-invalidate ownership 的簡化路徑", items: ["Core A/B hold Shared line", "Core A requests write ownership", "coherence request", "Core B copy invalidated", "Core A enters Modified", "A writes locally", "later read by B triggers transfer/writeback"], caption: "圖只表達 ownership 核心語意；bus snooping、directory、transient states 與 acknowledgement 數量依實作而異。" },
        sourceRefs: ["S10", "S11", "S12"]
      },
      {
        title: "8. Synchronization 建立 ordering，不替代工作分解",
        paragraphs: [
          "data race 是兩個 concurrent accesses 指向同一 memory location、至少一個是 write，且缺少足以排序它們的 synchronization。lost update 可由兩個 threads 都讀到舊值、各自加一再寫回造成。cache coherence 只確保 writes 的傳播規則，不把 read-modify-write 三步自動變成 atomic transaction。",
          "mutex 把 critical section 序列化；atomic read-modify-write 對一個位置提供 indivisible update，並依 memory order 建立同步；barrier 讓一組 participants 在 phase boundary 等待；condition/event 處理狀態尚未成立時的等待。選擇 primitive 要依 invariant，而不是把所有 shared accesses 都加同一種 barrier。",
          "lock contention、atomic serialization、barrier imbalance 與 cache-line bouncing 都是 synchronization overhead。細粒度 locking 可增加 concurrency 卻提高 bookkeeping 和 deadlock complexity；粗粒度 locking 較簡單但限制 parallel fraction。correctness 必須先由 happens-before 證明，再量測 contention。"
        ],
        figure: { type: "timeline", title: "Lost update 與 atomic update 的差異", columns: ["1", "2", "3", "4", "5", "6"], rows: [{ label: "Thread A (racy)", cells: ["load 0", "", "add→1", "", "store 1", ""] }, { label: "Thread B (racy)", cells: ["", "load 0", "", "add→1", "", "store 1"] }, { label: "Atomic version", cells: ["fetch_add→1", "serialized", "fetch_add→2", "", "", ""] }], caption: "兩次普通 increment 最後可能只得到 1；atomic RMW 讓兩個更新在線性化順序中各生效一次。" },
        sourceRefs: ["S8", "S11"]
      },
      {
        title: "9. Shared-memory 與 message-passing programming models",
        paragraphs: [
          "OpenMP 以 compiler directives、runtime routines 和 environment variables 擴充 C/C++/Fortran，可表達 parallel regions、worksharing、tasks、SIMD 和 device offload。threads 可共享 address space，但 variables 的 shared/private/mapped semantics 必須明確；規格不要求 implementation 自動偵測所有 data races 或 deadlocks。",
          "MPI 讓 processes 透過 communicator 執行 point-to-point、collective、one-sided 與 I/O operations。每個 rank 通常有自己的 address space，資料交換是 explicit messages；這適合跨 nodes 擴展，也迫使 decomposition 明確。send completion、receive matching、ordering 與 collective participation 都由 MPI semantics 定義。",
          "communication time 常以 T=α+n/β 近似：α 是固定 startup latency，n 是 bytes，β 是 effective bandwidth。小 messages 受 α 支配，大 messages 才接近 bandwidth；collective 還受 topology、algorithm 與 participant count 影響。shared memory 也不是免費通訊，coherence traffic 和 NUMA remote access 只是隱藏在 load/store interface 下。"
        ],
        figure: { type: "matrix", title: "OpenMP 與 MPI 的主要成本邊界", columns: ["面向", "OpenMP shared memory", "MPI message passing", "共同要求"], rows: [["Address space", "threads 共享", "ranks 分離", "partition work/data"], ["Communication", "loads/stores + coherence", "explicit messages/collectives", "計算與傳輸重疊"], ["Synchronization", "locks/atomics/barriers/tasks", "matching/collectives/RMA sync", "避免 races/deadlock"], ["Scale boundary", "通常單一 shared-memory node", "可跨 nodes", "受 serial work 與 imbalance 限制"], ["Data placement", "first-touch/NUMA policy", "rank-local buffers", "locality 決定成本"]], caption: "programming model 不等於 hardware topology；混合 MPI+OpenMP 可在 node 間與 node 內使用不同抽象。" },
        sourceRefs: ["S8", "S9"]
      },
      {
        title: "10. Scalability：固定工作量與固定時間是不同問題",
        paragraphs: [
          "Amdahl's Law 假設固定 problem size，parallel fraction p 在 N 個 processors 上理想縮短為 p/N：S(N)=1/((1−p)+p/N)。當 N→∞，speedup 上限為 1/(1−p)。serial fraction、communication、synchronization、load imbalance 與 parallel overhead 都會把實際結果壓得更低。",
          "parallel efficiency E=S/N 表示平均每個 processor 相對單 processor baseline 的使用成效。增加 N 若 speedup 增幅小於 N，efficiency 下降；但 efficiency 不是 energy efficiency，也不表示每個 core 每 cycle 都忙。strong scaling 固定問題大小，weak scaling 則隨資源增加問題大小。",
          "Gustafson's Law 以固定 parallel execution time 解讀 scaled workload。若在 N processors 的執行時間中 serial fraction 為 s，scaled speedup S_G=N−s(N−1)。它不否定 Amdahl，而是改變問題大小與 fraction 的量測基準；報告 speedup 時必須交代 fixed-size 或 scaled-size。"
        ],
        figure: { type: "matrix", title: "p=0.92 的 Amdahl strong-scaling 曲線", columns: ["Processors N", "Serial term", "Parallel term p/N", "Ideal speedup", "Efficiency"], rows: [["1", "0.08", "0.9200", "1.000", "100.0%"], ["2", "0.08", "0.4600", "1.852", "92.6%"], ["4", "0.08", "0.2300", "3.226", "80.6%"], ["8", "0.08", "0.1150", "5.128", "64.1%"], ["16", "0.08", "0.0575", "7.273", "45.5%"], ["∞", "0.08", "0", "12.500", "→0"]], caption: "即使 92% 可平行，16 processors 的理想 speedup 只有約 7.27；增加 resources 不會消除 serial term。" },
        sourceRefs: ["S13", "S14"]
      },
      {
        title: "11. Dataflow 與 systolic array 把 dependencies 空間化",
        paragraphs: [
          "von Neumann control-flow machine 主要由 PC 選下一條 instruction；dataflow model 則在 operation 的 input tokens 都 ready 時 firing。dependency graph 中沒有 edge path 的 nodes 可並行，control dependence 可轉成 tokens/predicates。純 dataflow 容易暴露平行性，但 token matching、memory side effects 與 resource scheduling仍需實作機制。",
          "systolic array 由規則排列的 processing elements（PEs）以鄰近 links 傳資料。matrix multiplication 可讓 A values 沿 rows 流動、B values 沿 columns 流動，每個 PE累積一個 output dot product。權重或 partial sums 的 stationary 選擇會改變 data reuse 與 external bandwidth。",
          "N×N 方形 array 在一個常見 skewed-input 模型下，第一個 products 進入後形成 wavefront；最後一個 output 約在 3N−2 cycles 完成。這不是所有 accelerator 的固定公式，因為 pipeline depth、input/output staging、tiling 和 array dimensions 會改變邊界；推導時必須明示 cycle convention。"
        ],
        figure: { type: "matrix", title: "4×4 systolic matrix-multiply processing elements", columns: ["PE column 0", "PE column 1", "PE column 2", "PE column 3"], rows: [["C00 += A0k×Bk0", "C01 += A0k×Bk1", "C02 += A0k×Bk2", "C03 += A0k×Bk3"], ["C10 += A1k×Bk0", "C11 += A1k×Bk1", "C12 += A1k×Bk2", "C13 += A1k×Bk3"], ["C20 += A2k×Bk0", "C21 += A2k×Bk1", "C22 += A2k×Bk2", "C23 += A2k×Bk3"], ["C30 += A3k×Bk0", "C31 += A3k×Bk1", "C32 += A3k×Bk2", "C33 += A3k×Bk3"]], caption: "每個 PE 保留自己的 Cij partial sum；A 沿 row、B 沿 column 逐 cycle 移動並重用。" },
        sourceRefs: ["S15", "S18"]
      },
      {
        title: "12. Neural accelerator 是 domain-specific data movement machine",
        paragraphs: [
          "neural-network workload 大量使用 matrix multiply、convolution、activation 與 reduction。專用 accelerator 以 MAC arrays、較低精度 arithmetic、大型 on-chip buffers 與 software-managed data movement 提高 throughput/energy efficiency。它不是『神經網路自己思考的硬體』，而是對特定 tensor operations 與 dataflow 優化的計算機。",
          "roofline model 以 operational intensity I=operations/byte 連結 compute 與 memory：attainable performance ≤ min(peak compute, memory bandwidth×I)。低 intensity workload 位於 bandwidth-bound 區，高 intensity 才可能接近 compute peak。tiling、fusion 與 reuse 主要提高 bytes 搬入後可完成的 operations。",
          "Google 第一代 datacenter TPU 的核心是 65,536 個 8-bit MAC matrix unit 與 28 MiB software-managed on-chip memory，展現 domain-specific architecture 如何把 area/power 移給大量 MAC 與 predictable data path。歷史測量不能直接代表現代 accelerator，但其方法仍提醒 peak TOPS、achieved TOPS、latency、batch size 與 TOPS/W 必須分開。"
        ],
        figure: { type: "flow", title: "Tensor tile 在 accelerator 中的資料生命週期", items: ["off-chip tensor", "DMA / prefetch", "on-chip buffer", "tile / layout transform", "MAC or tensor array", "accumulator / reduction", "activation / quantize", "write result tile"], caption: "能量與時間常由資料移動支配；tiling 的目的，是讓同一批 bytes 在 array 內重用多次。" },
        sourceRefs: ["S15", "S19"]
      },
      {
        title: "13. Quantum architecture 改變 state 與 measurement 模型",
        paragraphs: [
          "classical bit 是 0 或 1；單一 pure qubit 可寫成 |ψ⟩=α|0⟩+β|1⟩，其中 complex amplitudes 滿足 |α|²+|β|²=1。對 computational basis 測量得到 0/1 的機率分別為 |α|²、|β|²，單次 measurement 不會輸出 amplitudes。重複 shots 只能估計 probability distribution。",
          "quantum gate 對 state vector 執行 unitary transformation；多 qubits 可形成 entangled state，不能拆成各自獨立 state 的 tensor product。quantum circuit depth 是沿 dependency path 的 gate layers；共用同一 qubit 的 gates 不能同 layer。實體 QPU 還受 topology、gate fidelity、decoherence、calibration 與 measurement errors 限制。",
          "physical qubit 不等於 fault-tolerant logical qubit。quantum error correction 以多個 physical qubits、syndrome extraction 和 classical decoding 保護 logical information，帶來大量空間/時間 overhead。2026 roadmap 屬工程目標而非已完成保證；量子處理器也不取代 CPU，實際 workflow 包含 classical mapping、transpilation、control、shots 與 post-processing。"
        ],
        figure: { type: "flow", title: "一個 Bell-state circuit 的狀態路徑", items: ["|00⟩", "H on q0", "(|00⟩+|10⟩)/√2", "CNOT q0→q1", "(|00⟩+|11⟩)/√2", "measure both", "00 or 11, each 1/2"], caption: "量測結果具有相關性；不會在一次 shot 同時讀出 00 與 11，也不能由單次結果還原 amplitudes。" },
        sourceRefs: ["S20", "S21"]
      }
    ],
    workedExamples: [
      { title: "例題一：由 issue width 與 IPC 分開計算 cycles", prompt: "4-wide superscalar core 執行 20 條 instructions。理想無限制與實測 IPC=2.5 時各需多少 cycles？", steps: ["issue width=4 表示每 cycle 理論最多 4 條。", "理想 cycles=ceil(20/4)=5。", "實測平均 IPC=2.5，cycles=instruction count/IPC。", "20/2.5=8 cycles。", "實測相對理想多 8−5=3 cycles。", "差距可能來自 dependencies、misses 或 port conflicts，不能由 IPC 單獨定位原因。"], result: "理想 5 cycles；IPC=2.5 時 8 cycles，達到理論 issue capacity 的 62.5%。" },
      { title: "例題二：建立 out-of-order ready schedule", prompt: "I1: r1=a+b（latency 2）；I2: r2=r1×c（3）；I3: r3=d+e（1）；I4: r4=r3+f（1）。假設每 cycle 可發出兩條且 units 足夠，求最早完成 cycle。", steps: ["I1→I2 是 RAW chain；I3→I4 是另一條 RAW chain。", "cycle 1 可同時 issue I1 與 I3。", "I3 latency 1，在 cycle 2 前 ready，因此 cycle 2 issue I4。", "I1 latency 2，在 cycle 3 前 ready，因此 cycle 3 issue I2。", "I4 在 cycle 3 前完成；I2 latency 3，在 cycle 6 前完成。", "in-order machine 若被 I2 阻擋可能延後 I3/I4；out-of-order 可先利用獨立 chain。"], result: "critical path I1→I2 決定最早完成時間，於 cycle 6 前完成；I3/I4 可穿插執行。" },
      { title: "例題三：計算 VLIW bundle slot utilization", prompt: "四槽 VLIW schedule 使用 5 個 bundles，共放入 13 個 useful operations。求 slot utilization 與 NOP/empty slots。", steps: ["總 slots=4×5=20。", "useful slots=13。", "empty slots=20−13=7。", "utilization=13/20=0.65。", "empty fraction=7/20=35%。", "這只量化 static packing；不包含 cache miss 造成整個 schedule 等待。"], result: "slot utilization=65%，共有 7 個 empty/NOP slots。" },
      { title: "例題四：RISC-V vector strip mining", prompt: "VLEN=256、SEW=32、LMUL=1，處理 N=1003 elements。求 VLMAX、迴圈輪數、最後 VL 與平均 lane utilization。", steps: ["VLMAX=VLEN/SEW=256/32=8 elements。", "full rounds=floor(1003/8)=125，處理 1000 elements。", "remaining=3，所以還需一輪，總 rounds=126。", "最後 `vsetvli` 設 VL=3。", "總 lane capacity=126×8=1008 element-slots。", "平均 utilization=1003/1008≈99.504%。"], result: "VLMAX=8、126 輪、最後 VL=3，平均 lane utilization 約 99.50%。" },
      { title: "例題五：量化 warp branch divergence", prompt: "32-lane warp 中 20 lanes 走 5-cycle path A，12 lanes 走 7-cycle path B，兩路需序列化。求 elapsed warp cycles 與 useful lane-cycle utilization。", steps: ["divergent paths serial execution，elapsed=5+7=12 cycles。", "capacity=32 lanes×12 cycles=384 lane-cycles。", "path A useful work=20×5=100 lane-cycles。", "path B useful work=12×7=84 lane-cycles。", "total useful=184 lane-cycles。", "utilization=184/384≈47.9167%。"], result: "warp 經過 12 cycles，active useful lane-cycle utilization 約 47.92%。" },
      { title: "例題六：追蹤 false-sharing ownership", prompt: "Core A、B 交替對同一 64-byte line 中不同 counters 做 8 次 writes；line 起初不在任一 cache。計算取得 ownership 與 core-to-core ownership transfers。", steps: ["第 1 次 A write 取得 exclusive/modified ownership。", "第 2 次 B write 使 A copy invalid，ownership A→B。", "之後每次 writer 都與前一次不同，因此每次都轉移 ownership。", "8 次 writes 中，第 1 次是初次取得，後 7 次是 core-to-core transfers。", "若 counters padding 到不同 lines，各 core 首次取得自己的 line 後不必因對方 write 轉移。", "variables 不同仍會 bouncing，因 coherence granularity 是 cache line。"], result: "共有 8 次 ownership acquisitions，其中 7 次為 A/B 間轉移；padding 可消除這個交替 transfer pattern。" },
      { title: "例題七：估算 MPI point-to-point message time", prompt: "模型 T=α+n/β，startup α=2 µs、bandwidth β=20 GB/s（十進位）、payload=64 KiB。求理想時間與有效 payload bandwidth。", steps: ["n=64×1024=65,536 bytes。", "transfer term=n/β=65,536/(20×10^9) s。", "transfer=3.2768 µs。", "total=2+3.2768=5.2768 µs。", "effective bandwidth=n/T=65,536/(5.2768 µs)≈12.419 GB/s。", "固定 startup 使小 message 尚未達到 20 GB/s link ceiling。"], result: "理想 message time 約 5.2768 µs，有效 payload bandwidth 約 12.42 GB/s。" },
      { title: "例題八：比較 Amdahl 與 Gustafson scaling", prompt: "parallel fraction p=0.92、N=16。求 Amdahl fixed-size speedup/efficiency；若 parallel run 中 serial fraction s=0.08，求 Gustafson scaled speedup。", steps: ["Amdahl denominator=(1−0.92)+0.92/16。", "denominator=0.08+0.0575=0.1375。", "S_A=1/0.1375≈7.2727。", "efficiency=7.2727/16≈45.45%。", "Gustafson S_G=N−s(N−1)=16−0.08×15。", "S_G=14.8；它對應 scaled workload，不可與 7.2727 當同一固定問題的衝突結果。"], result: "Amdahl speedup≈7.273、efficiency≈45.45%；Gustafson scaled speedup=14.8。" },
      { title: "例題九：推導 4×4 systolic wavefront latency", prompt: "採用 skewed inputs、每 PE 每 cycle 做一個 MAC、無額外 pipeline/output delay的 4×4 square array，求最後 output 完成 cycle。", steps: ["output Cij 需要 k=0..3 共 4 個 products。", "A row i 與 B column j 的第一組 operands 在 offset i+j 後相遇。", "Cij 的第 4 個 product 在 offset i+j+3 的 cycle slot 執行。", "以第一個 MAC 為 cycle 1，完成 cycle=i+j+4。", "最晚是 C33：3+3+4=10。", "等價一般式為 3N−2=3×4−2=10 cycles。"], result: "在明示的 cycle convention 下，最後 C33 於 cycle 10 完成。" },
      { title: "例題十：用 roofline 判斷 neural kernel bottleneck", prompt: "accelerator peak=100 TOPS，memory bandwidth=2 TB/s，kernel operational intensity=30 operations/byte。求 performance ceiling 與 bottleneck。", steps: ["bandwidth roof=bandwidth×intensity。", "2×10^12 bytes/s×30 operations/byte=60×10^12 operations/s。", "bandwidth roof=60 TOPS。", "compute roof=100 TOPS。", "attainable≤min(100,60)=60 TOPS。", "要進入 compute-bound，intensity 至少需 peak/bandwidth=100/2=50 operations/byte。"], result: "ceiling=60 TOPS，屬 bandwidth-bound；ridge point intensity=50 operations/byte。" },
      { title: "例題十一：計算 Hadamard 後的測量機率", prompt: "qubit 初態 |0⟩，施加 H 得 (|0⟩+|1⟩)/√2。求測量機率與 1000 shots 的期望 counts。", steps: ["α=1/√2，β=1/√2。", "P(0)=|α|²=1/2。", "P(1)=|β|²=1/2。", "1000 shots 的 expected count(0)=1000×0.5=500。", "expected count(1)=500。", "實際 finite-shot counts 可偏離 500/500；單次 measurement 只給一個 bit。"], result: "P(0)=P(1)=0.5；1000 shots 的期望值各 500 次。" }
    ],
    misconceptions: [
      ["RISC processor 都是簡單、單發射、in-order。", "RISC 描述 ISA 取向；實作可以是寬發射、out-of-order、speculative microarchitecture。"],
      ["四寬 superscalar 的 IPC 永遠是 4。", "4 是 issue/retire ceiling之一；dependencies、ports、branches 和 memory stalls 會降低 achieved IPC。"],
      ["Register renaming 能消除所有 data dependencies。", "它消除 WAR/WAW name dependencies；RAW true dependency 仍須等待 producer。"],
      ["VLIW 不需要處理 runtime hazards。", "compiler 處理可預測的 dependency/resource schedule；cache miss、exception 與變動 latency仍需 architecture/hardware semantics。"],
      ["Vector width 越大，任何程式都等比例變快。", "可用 DLP、tail/mask、memory bandwidth、stride 和 dependencies 都限制利用率。"],
      ["SIMD、SIMT 與 SPMD 是同一詞。", "SIMD 是單一 vector instruction；SIMT 是 warp 執行模型；SPMD 是多 workers 執行同一 program 的 programming model。"],
      ["GPU 的高 occupancy 就代表高效能。", "occupancy 只提供可排程 warps；divergence、uncoalesced access、low intensity 與 instruction mix 仍可能成為瓶頸。"],
      ["Cache coherence 保證所有 cores 以程式順序看到所有 writes。", "coherence 主要約束單一 location；跨 locations ordering 由 memory consistency與 synchronization 定義。"],
      ["不同 variables 不會 false sharing。", "只要落在同一 cache line 且由不同 cores 寫入，就可能發生 ownership bouncing。"],
      ["Atomic increment 和普通 load-add-store 等價。", "普通三步可交錯而遺失更新；atomic RMW 提供不可分割的線性化操作。"],
      ["MPI bandwidth 等於每個 message 的有效 bandwidth。", "小 message 受 startup latency α 支配，protocol、topology與 contention 也會降低有效值。"],
      ["Gustafson's Law 推翻 Amdahl's Law。", "兩者分別回答 scaled-size/fixed-time 與 fixed-size 問題，假設與 fraction 定義不同。"],
      ["Neural accelerator 的 TOPS 就是模型推論速度。", "實際速度還受 precision、utilization、memory、layout、batch、unsupported operations 與 latency boundary 影響。"],
      ["n qubits 可在一次 measurement 讀出全部 2^n amplitudes。", "一次 measurement 只得到一個 n-bit outcome；估計 distribution 需重複 shots，且一般不能完整重建所有 amplitudes。"]
    ],
    exercises: [
      { level: "基礎", question: "為何 superscalar sequential CPU 在 Flynn taxonomy 中常仍歸為 SISD？", solution: ["architectural program 仍是一個 instruction stream 操作一個邏輯 data stream。", "同 cycle 內多發射是 microarchitectural ILP，不自動形成多個自主 instruction streams。"] },
      { level: "基礎", question: "RAW、WAR、WAW 中，register renaming 能消除哪些？", solution: ["renaming 可讓不同 writes 使用不同 physical registers，消除 WAR 與 WAW name dependencies。", "RAW 是 consumer 真正需要 producer value 的 true dependency，不能由改名消除。"] },
      { level: "基礎", question: "VL 與 VLEN 有何差異？", solution: ["VLEN 是 implementation 的 vector-register bit width，通常為硬體屬性。", "VL 是當前 vector instruction 實際處理的 active element count，可在每輪由剩餘工作設定。"] },
      { level: "基礎", question: "Warp divergence 為何只需在同一 warp 內判斷？", solution: ["同一 warp 的 lanes 共用 instruction issue，分支路徑需用不同 masks 序列化。", "不同 warps 本來就可由 scheduler 獨立前進，走不同 path 不會互相遮罩 lanes。"] },
      { level: "基礎", question: "Cache coherence 與 memory consistency 各回答什麼問題？", solution: ["coherence 回答同一 location 的多份 cached copies 和 writes 如何保持一致。", "consistency 回答跨 locations、跨 harts 的 memory operations 可以被觀察成哪些順序。"] },
      { level: "基礎", question: "OpenMP 與 MPI 的 address-space 假設有何典型差異？", solution: ["OpenMP threads 通常共享一個 process address space，以 shared/private rules 區分資料。", "MPI ranks 通常各有 address space，透過明確 send/receive/collective 交換資料。"] },
      { level: "計算", question: "8-wide core 執行 100 instructions，實測 IPC=5，理想與實測 cycles 各是多少？", solution: ["理想 cycles=ceil(100/8)=13。", "實測 cycles=100/5=20；issue-capacity utilization=5/8=62.5%。"] },
      { level: "計算", question: "三槽 VLIW 使用 8 bundles 放入 18 useful operations，slot utilization 為多少？", solution: ["總 slots=3×8=24。", "utilization=18/24=75%，empty slots=6。"] },
      { level: "計算", question: "VLEN=512、SEW=64、LMUL=1，處理 130 elements 需幾輪，最後 VL 是多少？", solution: ["VLMAX=512/64=8。", "ceil(130/8)=17 輪；16 輪處理 128，最後 VL=2。"] },
      { level: "計算", question: "32-lane warp 只有 24 lanes 執行一段 6-cycle 無其他分支程式，lane utilization 為多少？", solution: ["useful lane-cycles=24×6，capacity=32×6。", "utilization=24/32=75%。"] },
      { level: "計算", question: "T=α+n/β，α=1 µs、β=10 GB/s、n=10 KB（十進位），求 message time。", solution: ["transfer=10,000/(10×10^9)=1 µs。", "total=1+1=2 µs。"] },
      { level: "計算", question: "p=0.95、N=20 時 Amdahl speedup 與 efficiency 為多少？", solution: ["S=1/(0.05+0.95/20)=1/0.0975≈10.256。", "E=S/20≈0.5128=51.28%。"] },
      { level: "計算", question: "Gustafson 模型 N=32、parallel-run serial fraction s=0.03，scaled speedup 為多少？", solution: ["S_G=N−s(N−1)。", "32−0.03×31=31.07。"] },
      { level: "計算", question: "peak=80 TOPS、bandwidth=1.5 TB/s、intensity=40 ops/byte，roofline ceiling 為多少？", solution: ["bandwidth roof=1.5×40=60 TOPS。", "min(80,60)=60 TOPS，因此 bandwidth-bound。"] },
      { level: "進階", question: "False sharing 為何可在程式沒有 data race 時仍發生？", solution: ["threads 可寫不同 variables，因此沒有同一 location 的 conflicting access。", "若 variables 位於同一 cache line，coherence ownership 仍以 line 為單位轉移，造成效能損失。"] },
      { level: "進階", question: "VLIW binary 換到 operation latency 不同的新實作時，correctness 與 performance 可能如何不同？", solution: ["architecture 必須提供相容 semantics，必要時 hardware interlock 或重新編譯保證 correctness。", "舊 static schedule 可能留下更多 bubbles 或不合新 resources，因此即使正確也失去效能。"] },
      { level: "整合", question: "一個 GPU kernel 同時有高 occupancy、嚴重 divergence 與低 operational intensity，為何仍可能很慢？", solution: ["高 occupancy 只代表有較多 resident warps 可隱藏 latency。", "divergence 降低 active lanes；低 intensity 使工作受 memory bandwidth 限制，兩者都不會由 occupancy 自動修復。"] },
      { level: "整合", question: "Bell state (|00⟩+|11⟩)/√2 測量 1000 shots，哪些 outcomes 理論機率為零，非零 outcomes 的期望 counts 為何？", solution: ["01 與 10 的 amplitude 為零，因此理論機率為零。", "00 與 11 各為 1/2，期望各約 500；實機 noise 可能出現少量其他 outcomes。"] }
    ],
    glossary: [
      ["ILP", "Instruction-Level Parallelism，同一 instruction stream 中可重疊執行的獨立 operations。"],
      ["DLP", "Data-Level Parallelism，對多個資料元素套用相同或相近運算的平行性。"],
      ["TLP", "Thread-Level Parallelism，多個 threads 同時前進的平行性。"],
      ["Flynn taxonomy", "以 instruction streams 與 data streams 的 single/multiple 組合分類架構。"],
      ["SISD", "Single Instruction Stream, Single Data Stream。"],
      ["SIMD", "Single Instruction Stream, Multiple Data Streams，以一個 vector operation 控制多 lanes。"],
      ["MIMD", "Multiple Instruction Streams, Multiple Data Streams，多個自主 processors/cores 的模型。"],
      ["SPMD", "Single Program, Multiple Data，多 workers 執行同一程式但處理不同 data/indices。"],
      ["Superscalar", "每 cycle 可 issue/execute/retire 多條 scalar instructions 的微架構。"],
      ["IPC", "Instructions Per Cycle，每 cycle 平均完成或 retired 的 instructions 數。"],
      ["Register renaming", "把 architectural registers 映射到 physical registers 以消除 name dependencies。"],
      ["Reorder buffer", "追蹤 in-flight instructions 並支持 in-order retirement/precise exception 的結構。"],
      ["Speculation", "在結果尚未確定前先執行預測路徑，錯誤時回復 committed state。"],
      ["VLIW", "Very Long Instruction Word，由 compiler 把多個並行 operations 打包進寬 instruction。"],
      ["EPIC", "Explicitly Parallel Instruction Computing，以 bundles、predication 等顯式描述平行性的 ISA 取向。"],
      ["VLEN", "RISC-V vector implementation 每個 vector register 的 bit width。"],
      ["SEW", "Selected Element Width，vector operation 當前 element bit width。"],
      ["VL", "Vector Length，當前 vector instruction 實際處理的 active element count。"],
      ["Strip mining", "將任意長迴圈切成每輪最多 VL elements 的 vectorized execution 方法。"],
      ["SIMT", "Single Instruction, Multiple Threads，以 thread semantics 表達、以 warp-like group 執行的模型。"],
      ["Warp", "CUDA 中由 32 threads 組成、共同接受 instruction issue 的 execution group。"],
      ["Divergence", "同一 warp threads 採不同 control paths，造成 masks 下的 path serialization。"],
      ["Occupancy", "可同時 resident 的 active warps 相對硬體上限的比例或數量概念。"],
      ["Cache coherence", "維持同一 memory location 多份 cached copies 之 read/write 一致性的規則。"],
      ["Memory consistency", "規定跨 processors memory operations 可被觀察成哪些順序的模型。"],
      ["False sharing", "不同 variables 共用 cache line，跨 cores writes 造成不必要 ownership traffic。"],
      ["Atomic RMW", "不可分割完成 read-modify-write 並具有指定 ordering semantics 的 operation。"],
      ["Strong scaling", "固定 problem size，增加 processors 以縮短 execution time。"],
      ["Weak scaling", "增加 processors 時同步增加 problem size，觀察固定每 processor 工作下的時間。"],
      ["Systolic array", "processing elements 以規則鄰接資料流逐拍計算的空間化陣列。"],
      ["Operational intensity", "完成 operations 數與從指定 memory boundary 搬移 bytes 的比值。"],
      ["Roofline model", "以 compute peak 與 bandwidth×intensity 的較小值界定 performance ceiling。"],
      ["Qubit", "以 normalized complex amplitudes 表示 |0⟩、|1⟩ superposition 的量子資訊單位。"],
      ["Quantum circuit depth", "考慮 qubit dependencies 後必須依序執行的最少 gate layers 數。"]
    ],
    sources: [
      { key: "S1", title: "UC Berkeley CS61C: Flynn's Taxonomy", url: "https://notes.cs61c.org/content/parallel-dlp/", accessed: "2026-08-23", use: "SISD/SIMD/MISD/MIMD、SPMD 與現代多層平行架構分類。" },
      { key: "S2", title: "Cornell ECE 4750 / CS 4420 Computer Architecture, Fall 2026", url: "https://www.cs.cornell.edu/courses/cs4420/2017fa/", accessed: "2026-08-23", use: "superscalar、out-of-order、register renaming、VLIW、SIMD、multithreading、coherence 與 consistency 範圍。" },
      { key: "S3", title: "Intel 64 and IA-32 Architecture Manuals, August 2026", url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html", accessed: "2026-08-23", use: "current superscalar CPU ISA、vector extensions、optimization manuals 與 multiprocessor architecture references。" },
      { key: "S4", title: "Intel Itanium Architecture Software Developer's Manual, Volume 1", url: "https://www.intel.com/content/dam/www/public/us/en/documents/manuals/itanium-architecture-software-developer-rev-2-3-vol-1-manual.pdf", accessed: "2026-08-23", use: "EPIC bundles、instruction groups、predication、speculation 與 static parallel encoding。" },
      { key: "S5", title: "RISC-V V Vector Extension 1.0", url: "https://docs.riscv.org/reference/isa/unpriv/v-st-ext", accessed: "2026-08-23", use: "VLEN、SEW、LMUL、VL、mask、strip mining 與 vector-length agnostic execution。" },
      { key: "S6", title: "Arm: Introduction to SVE", url: "https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/SVE%20programmers%20guide/102476_0001_00_en_introduction-to-sve.pdf", accessed: "2026-08-23", use: "vector-length agnostic programming、predication 與不同 hardware vector lengths 的 binary portability。" },
      { key: "S7", title: "NVIDIA CUDA Programming Guide 13.2", url: "https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html", accessed: "2026-08-23", use: "SIMT、32-thread warps、active masks、divergence、thread hierarchy、memory 與 occupancy。" },
      { key: "S8", title: "OpenMP API Specification 6.0", url: "https://www.openmp.org/wp-content/uploads/OpenMP-API-Specification-6-0.pdf", accessed: "2026-08-23", use: "shared-memory parallel regions、tasks、worksharing、SIMD、device constructs 與 synchronization semantics。" },
      { key: "S9", title: "MPI Standard 4.1", url: "https://www.mpi-forum.org/docs/mpi-4.1/mpi41-report/mpi41-report.htm", accessed: "2026-08-23", use: "point-to-point、collectives、communicators、one-sided communication、I/O 與 process model。" },
      { key: "S10", title: "Cornell CS3410 Spring 2026: Cache Coherency", url: "https://courses.cs.cornell.edu/cs3410/2026sp/notes/cachecoherency.html", accessed: "2026-08-23", use: "private caches、write-invalidate、snooping、coherence states 與 false sharing foundation。" },
      { key: "S11", title: "RISC-V RVWMO Memory Consistency Model 2.0", url: "https://docs.riscv.org/reference/isa/unpriv/rvwmo.html", accessed: "2026-08-23", use: "global memory order、preserved program order、FENCE、acquire/release 與 legal executions。" },
      { key: "S12", title: "MIT 6.004: Multicore and Cache Coherence", url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c21/c21s1/", accessed: "2026-08-23", use: "shared-memory multicore、coherence/consistency distinction、barriers 與 cache-line states。" },
      { key: "S13", title: "Gene Amdahl: Validity of the Single Processor Approach", url: "https://doi.org/10.1145/1465482.1465560", accessed: "2026-08-23", use: "fixed-workload serial fraction 與 parallel speedup upper-bound 的原始論文。" },
      { key: "S14", title: "John Gustafson: Reevaluating Amdahl's Law", url: "https://course.ece.cmu.edu/~ece600/fall16/references/gustafson.pdf", accessed: "2026-08-23", use: "scaled-workload/fixed-time speedup 與 Gustafson formula 的原始論文。" },
      { key: "S15", title: "Google: In-Datacenter Performance Analysis of a TPU", url: "https://research.google/pubs/in-datacenter-performance-analysis-of-a-tensor-processing-unit/", accessed: "2026-08-23", use: "systolic-style matrix unit、on-chip memory、TOPS、latency 與 domain-specific architecture measurements。" },
      { key: "S16", title: "RISC-V Unprivileged ISA Introduction", url: "https://docs.riscv.org/reference/isa/v20240411/unpriv/intro.html", accessed: "2026-08-23", use: "RISC-V modular ISA、implementation freedom 與 ISA/execution-environment boundary。" },
      { key: "S17", title: "LLVM VLIW Machine Scheduler", url: "https://llvm.org/doxygen/classllvm_1_1VLIWMachineScheduler.html", accessed: "2026-08-23", use: "現行 compiler backend 的 VLIW dependency/resource scheduling 與 packetization。" },
      { key: "S18", title: "Wavelet: Formally Verified Asynchronous Dataflow Compilation", url: "https://arxiv.org/abs/2608.05451", accessed: "2026-08-23", use: "spatial dataflow operators、asynchronous channels、determinacy、pipelining 與 data locality 的現代研究。" },
      { key: "S19", title: "Google NeuroMeter: Modeling ML Accelerators", url: "https://research.google/pubs/neurometer-an-integrated-power-area-and-timing-modeling-framework-for-machine-learning-accelerators/", accessed: "2026-08-23", use: "systolic tensor units、vector units、reduction trees、power/area/timing 與 accelerator tradeoffs。" },
      { key: "S20", title: "IBM Quantum Learning: Quantum Circuits", url: "https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/quantum-circuits/circuits", accessed: "2026-08-23", use: "qubit wires、unitary gates、state vectors、measurement、composition 與 circuit model。" },
      { key: "S21", title: "IBM Quantum 2026 Roadmap", url: "https://www.ibm.com/roadmaps/quantum/2026/", accessed: "2026-08-23", use: "2026 hardware、circuit-depth/error-correction goals、modular processors 與 classical-quantum workflow 的 current context。" }
    ]
  },
  {
    chapter: 10,
    title: "嵌入式系統：從硬體邊界到可預測且可更新的裝置",
    english: "Embedded Systems: From Hardware Boundaries to Predictable and Updateable Devices",
    revised: "2026-08-24",
    readingTime: "約 280–340 分鐘",
    intro: "嵌入式系統不是縮小版桌上型電腦，而是為特定物理任務配置計算、記憶體、通訊、能源與可靠度的完整系統。感測器送入的事件有截止時間，致動器的錯誤輸出可能直接改變真實世界；Flash 和 SRAM 容量固定，電池能量有限，韌體還必須能在部署後安全更新。本章從 MCU、MPU、SoC、FPGA 與 ASIC 的選型開始，逐層追蹤 reset、memory map、MMIO、interrupt、DMA、RTOS scheduling、serial buses、low-power state、watchdog 與 signed firmware update。每個主題都以 state、時間上界、資源預算與失敗後果描述，使系統是否正確不只憑『平均看起來夠快』判斷。",
    outcomes: [
      "能依 workload、deadline、memory、power、volume 與可更新性比較 MCU、MPU、SoC、FPGA 和 ASIC。",
      "能追蹤 reset vector、startup code、linker image、Flash/SRAM 區域與 C runtime 初始化。",
      "能正確解讀 memory-mapped register 的 access width、bit mask、side effect、volatile 與 memory barrier。",
      "能分解 interrupt latency、service time、jitter、nesting 與 deferred work 的時間路徑。",
      "能設計 DMA buffer ownership，並辨識 cache coherence、alignment 與 completion ordering 的條件。",
      "能以 C、T、D、J、B 與 WCET 建模 periodic tasks，檢查 utilization 和 response time。",
      "能區分 thread、ISR、queue、semaphore、mutex、priority inheritance、tick 與 tickless idle。",
      "能建立 Flash、SRAM、stack、heap、buffer 與 OTA slots 的可驗證資源預算。",
      "能估算 UART、SPI、I2C 與 CAN transaction 的 framing、bandwidth、latency 與 arbitration 成本。",
      "能以 duty cycle、residency 與 wake-up latency 分析平均功率和 sleep-state 選擇。",
      "能說明 watchdog、brownout、secure boot、A/B update、rollback 與 anti-rollback 各自處理的失敗。"
    ],
    sections: [
      {
        title: "1. 嵌入式系統由物理任務與限制共同定義",
        paragraphs: [
          "embedded system 以特定功能為中心：讀取 sensor、執行 control law、更新 actuator、保存狀態並和其他節點通訊。它可能沒有螢幕或一般檔案系統，卻仍是一台完整計算機。功能正確只是第一層；相同結果若晚於 deadline、耗盡電池、超出溫度範圍或無法從斷電恢復，仍是系統失敗。",
          "MCU 通常把 processor core、Flash、SRAM、timers、interrupt controller 和 peripherals 整合在單一晶片，適合直接控制、低 standby power 與固定 memory budget。MPU 常搭配外部 DRAM、MMU 和較完整 OS，適合大型 software stack；SoC 是整合尺度，可能同時包含 MCU-class cores、application cores、GPU、DSP、radio 與 accelerators，不能只由名稱推定能力。",
          "選型先把需求寫成可驗證界線：event rate、worst-case latency、compute throughput、code/data capacity、I/O voltage/protocol、average/peak power、boot time、security lifecycle、環境溫度與 production volume。datasheet 的 peak MHz 或 core 名稱只回答局部問題；系統邊界才決定 memory、interconnect、clock、package 和 software 是否一起成立。"
        ],
        figure: { type: "matrix", title: "嵌入式平台的典型能力邊界", columns: ["平台", "Memory/OS", "I/O 與 timing", "主要優勢", "主要代價"], rows: [["MCU", "on-chip Flash/SRAM；bare metal/RTOS", "直接 peripheral、低 interrupt latency", "低功耗、低 BOM、快速啟動", "容量與隔離有限"], ["MPU", "external DRAM；rich OS", "driver stack、較高變異", "大記憶體、process ecosystem", "功耗、boot 與硬體複雜"], ["Heterogeneous SoC", "多種 memories/OS domains", "real-time core + application core", "整合與分工", "共享資源驗證困難"], ["FPGA", "on-chip RAM + external memory", "自訂 parallel datapath/I/O", "可重組、deterministic pipeline", "開發、面積與動態功耗"], ["ASIC/ASSP", "依產品固定", "完全客製介面", "量產效率與密度", "NRE、時程、不可重組"]], caption: "表列典型特性而非硬性分類；實際零件仍須由 datasheet、reference manual 與 workload measurement 核對。" },
        sourceRefs: ["S1", "S14"]
      },
      {
        title: "2. 現成元件、FPGA 與 ASIC 是不同的承諾時間點",
        paragraphs: [
          "off-the-shelf MCU/SoC 在製造前已固定 CPU、memory 與 peripherals，設計者主要以 software 和 board wiring 組合功能。它降低 non-recurring engineering（NRE）與上市時間，但若 workload 需要特殊 bit-level pipeline、超多 parallel channels 或非標準 timing，general-purpose datapath 可能浪費 cycles 與 energy。",
          "FPGA 由 LUT、flip-flop、carry chain、block RAM、DSP blocks、I/O blocks 與 programmable routing 組成。hardware description 經 synthesis、place-and-route 形成 configuration；不同 operations 可真正同時存在於空間，而不是輪流占用 CPU。可重組不代表零成本：routing delay、resource utilization、clock-domain crossing 與 timing closure 都必須驗證。",
          "ASIC 把功能固定到製造的 silicon，量大時可取得更高密度、更低每單位能耗與較低 unit cost，但需支付 masks、verification、tooling 與 respin 風險。選擇可用 break-even 思考：總成本=NRE+volume×unit cost；此外還要加入 field update、certification、供應鏈與錯誤修復的價值，不能只比較單價。"
        ],
        figure: { type: "matrix", title: "設計彈性與成本發生時間", columns: ["面向", "MCU/SoC", "FPGA", "ASIC"], rows: [["功能固定", "晶片固定；韌體可改", "logic/routing 可重組", "製造後固定"], ["前期成本", "低", "中", "高"], ["單位成本/量產效率", "中", "中至高", "大量時最佳"], ["parallel timing", "由 CPU/accelerator 排程", "可建立專用 pipeline", "可完全專用"], ["部署後修正", "firmware update", "bitstream + firmware", "只能改可程式層"]], caption: "真正決策還包含 volume、上市時間、power、certification 和錯誤後果；單一維度沒有普遍最佳解。" },
        sourceRefs: ["S14", "S15"]
      },
      {
        title: "3. Reset 到 main 之間存在完整的啟動資料路徑",
        paragraphs: [
          "reset 後 processor 從 architecture 指定的 reset state 取得初始 stack pointer 與 reset handler，或先從固定 boot address 取第一條 instruction。startup code 設定 clock、memory wait states 和必要的低階硬體，再建立語言執行環境。C/C++ 的 `main` 不是第一條指令；它依賴先前已建立的 stack、initialized data 與 zero-initialized storage。",
          "linker script 把 `.text`、`.rodata` 與初值映像放進 nonvolatile Flash，把執行時可寫的 `.data`、`.bss`、heap、stacks 和 DMA buffers 配到 SRAM。啟動時 `.data` 初值由 Flash copy 到 SRAM，`.bss` 清零。link address、load address 與 runtime address 可能不同，若 copy range 或 alignment 錯一 byte，程式可在進入 main 前就破壞 state。",
          "vector table 把 exception/interrupt number 對應到 handler address；bootloader 可能先驗證 application image，再把 vector base、stack 與 entry control 交給 application。完整 boot contract 要說明 clock/reset cause、memory ownership、interrupt mask、peripheral state 和 image metadata，否則 bootloader 與 application 會各自假設對方已初始化同一資源。"
        ],
        figure: { type: "hierarchy", title: "韌體映像與啟動時搬移", items: [{ label: "Flash: bootloader", detail: "reset entry、image verification、recovery" }, { label: "Flash: vector + .text/.rodata", detail: "handlers、instructions、constants" }, { label: "Flash: .data load image", detail: "writable globals 的初值" }, { label: "SRAM: .data + .bss", detail: "copy initial values；zero-fill" }, { label: "SRAM: heap/stacks/buffers", detail: "runtime allocation 與 bounded ownership" }, { label: "main / scheduler", detail: "在 runtime state 完成後開始" }], caption: "Flash 中的 load image 與 SRAM 中的 execution state 是不同位置；linker symbols 定義 copy/zero 的精確邊界。" },
        sourceRefs: ["S1", "S2", "S16"]
      },
      {
        title: "4. MMIO register 是具有副作用的硬體介面",
        paragraphs: [
          "memory-mapped I/O（MMIO）把 peripheral registers 放進 processor address space，load/store 會被 interconnect 導向 device。register 可能是 read-only status、write-only command、read-write configuration、write-one-to-clear（W1C）flags，或 read-to-clear FIFO data。相同 32-bit bit pattern 因 access type 不同而產生不同 state transition。",
          "C 的 `volatile` 告訴 compiler 每次 expression 都要真的發生 access，避免把 polling read 快取在 register 或刪除 output write；它不保證 atomicity、不建立跨 core/device 的 ordering，也不等於 thread synchronization。當 architecture 或 peripheral contract 要求完成前一筆 write、刷新 pipeline 或限制 memory reordering 時，還需要 DMB、DSB、ISB 或平台 API 定義的 barrier。",
          "read-modify-write 必須符合 register semantics。對一般 RW register，可用 `(old & ~mask) | value` 更新欄位；對 W1C status，先 read 再 OR 後 write 可能意外清除其他已置位事件。reserved bits 通常要保留 reset/value 規則，access width 與 alignment 也不可任意改變。正確 driver 的單位是規格定義的 transaction，不只是 C assignment。"
        ],
        figure: { type: "bits", title: "32-bit 控制暫存器的欄位範例", totalBits: 32, items: [{ label: "RES", bits: 16, detail: "reserved; preserve" }, { label: "DIV", bits: 8, detail: "clock divider" }, { label: "MODE", bits: 4, detail: "operating mode" }, { label: "IRQ_EN", bits: 1, detail: "interrupt enable" }, { label: "DMA_EN", bits: 1, detail: "DMA request enable" }, { label: "START", bits: 1, detail: "start command" }, { label: "ENABLE", bits: 1, detail: "peripheral enable" }], caption: "更新 MODE 或 DIV 時要以欄位 mask 保留其他 bits；真正 access policy 必須以該元件 reference manual 為準。" },
        sourceRefs: ["S1", "S2", "S3"]
      },
      {
        title: "5. Interrupt 把外部事件轉成有上界的控制轉移",
        paragraphs: [
          "interrupt request 先由 peripheral 產生 pending condition，再經 interrupt controller 的 enable、priority 和 routing 判斷。processor 在可接受的 boundary 保存必要 context、取得 vector 並執行 ISR。interrupt latency 是事件發生到 ISR 的關鍵處理開始，不只包含 vector entry；更高優先權 ISR、critical section、disabled interval、bus stall 與 cache miss 都可能加入。",
          "ISR 應完成具有立即 deadline 的最小工作：讀取/確認 source、保存 timestamp 或 data、更新 bounded state，然後以 queue、event 或 work item 喚醒 thread-level processing。長計算、blocking lock、動態配置與無界迴圈會延長所有較低優先事件的 blocking。Zephyr 明確區分直接 ISR 與 offloaded work；CMSIS-RTOS2 也限制 ISR 可呼叫的 API。",
          "priority 降低的是特定事件等待，不會消除 overload。若 arrival rate×service time 接近或超過 1，pending work 仍會累積。edge-triggered source 可能因合併事件而需要 counter/FIFO；level-triggered source 若未清除原因會立刻再次進入。設計時要同時記錄 latency distribution、worst observed、理論 blocking bound 和 lost-event counter。"
        ],
        figure: { type: "timeline", title: "Interrupt latency 與 service 的時間分解", columns: ["event", "mask/block", "entry", "top half", "signal", "bottom half", "done"], rows: [{ label: "Device", cells: ["IRQ pending", "pending", "", "ack/data", "", "", ""] }, { label: "CPU/ISR", cells: ["", "higher-priority/critical", "save+vector", "bounded ISR", "post event", "", "return"] }, { label: "Thread", cells: ["", "", "", "", "ready", "process", "complete"] }], caption: "deadline 可能要求 top half 完成，也可能允許 bottom half 完成；兩種 end point 必須分開量測。" },
        sourceRefs: ["S4", "S5", "S6"]
      },
      {
        title: "6. DMA 移動資料，但 ownership 與一致性仍由系統決定",
        paragraphs: [
          "DMA controller 依 source、destination、length、direction 和 trigger 搬移資料，CPU 只負責 descriptor/setup 與 completion。它降低每 byte 的 instruction work，卻不保證整體更快：短 transfer 可能被 setup cost 主導，DMA 與 CPU 也可能競爭 memory bus。circular、scatter-gather 或 linked descriptors 可連續處理 streams，但增加狀態數量。",
          "buffer 必須有明確 ownership。TX 路徑中 CPU 填滿 buffer、完成必要 cache clean/barrier 後交給 DMA，直到 completion 前不得修改；RX 路徑中 DMA 寫完後，CPU 要等待 completion 並依平台規則 invalidate cache 才能讀。Zephyr DMA 文件指出 cache coherence 不由通用 API 自動提供，且同一 channel 通常由單一 client 擁有。",
          "double buffering 讓 DMA 填 A 時 CPU 處理 B，吞吐量由較慢階段決定；若 CPU 偶爾超過一個 buffer period，仍會 overrun。descriptor、buffer、length 和 cache line 的 alignment 要依 controller 限制，completion interrupt 也只證明 DMA 定義的完成點；若資料還要送到 device FIFO 或 nonvolatile media，可能另有 drain/flush 狀態。"
        ],
        figure: { type: "flow", title: "RX DMA buffer 的 ownership handoff", items: ["CPU allocates empty B0", "cache/device preparation", "DMA owns B0", "peripheral fills bytes", "DMA completion", "barrier + cache maintenance", "CPU owns valid B0", "process then recycle"], caption: "在 ownership 交接前讀寫同一 buffer 會形成 race；cache maintenance 的方向取決於 DMA 讀或寫 memory。" },
        sourceRefs: ["S7", "S8"]
      },
      {
        title: "7. 即時系統分析的是 deadline，不是平均速度",
        paragraphs: [
          "periodic task 可用 execution time C、period T 與 relative deadline D 表示；sporadic event 還需 minimum inter-arrival time，release jitter J 描述理想 release 與實際 ready 的偏移。C 應是指定硬體、compiler、memory 與 interference 假設下的 WCET bound，不是平均 profiling time。deadline miss 可能在平均 utilization 很低時仍發生。",
          "preemptive uniprocessor、independent periodic tasks、D=T 且 overhead 忽略時，EDF 的經典 utilization condition 為 Σ(Ci/Ti)≤1；rate-monotonic（RM）固定優先權的充分條件為 U≤n(2^(1/n)−1)，極限趨近 ln2。未通過 RM 充分條件不代表一定失敗，還可做 exact response-time analysis。",
          "真實系統要加入 interrupt execution、context switch、cache-related preemption delay、shared-resource blocking、release jitter 與 non-preemptive sections。schedulability test 是帶假設的證明：只要 workload、priority、clock、compiler 或 critical section 改變，原結論就要重新計算。測試可發現錯誤，但不能取代尚未被測到的 worst case。"
        ],
        figure: { type: "matrix", title: "即時工作模型的符號", columns: ["符號", "含義", "必須界定", "常見錯誤"], rows: [["C", "worst-case execution time", "硬體/clock/cache/干擾", "用平均時間"], ["T", "period/min inter-arrival", "來源的最快到達", "只看 nominal rate"], ["D", "relative deadline", "從 release 到何時", "一律假設 D=T"], ["J", "release jitter", "release 可延遲多少", "完全忽略"], ["B", "lower-priority blocking", "critical sections/protocol", "只算 higher-priority interference"]], caption: "所有時間必須使用同一單位與同一觀察邊界；C 不包含哪些成本也要明列。" },
        sourceRefs: ["S9", "S10", "S11"]
      },
      {
        title: "8. Fixed-priority response time 揭露 blocking 與 interference",
        paragraphs: [
          "對 fixed-priority preemptive uniprocessor，一個常用 response-time recurrence 是 Ri^(k+1)=Ci+Bi+Σ ceil((Ri^k+Jj)/Tj)Cj，總和遍歷較高優先 tasks。從 Ri^0=Ci+Bi 迭代到 fixed point；若在收斂前超過 Di，就無法在這組假設下保證 deadline。ceil 表示 response window 內可能到達的完整干擾工作數。",
          "priority inversion 發生在 high-priority task 等 low-priority task 持有的 mutex，而 medium-priority work 又搶占 low task，使 high task 間接等待 medium work。priority inheritance 暫時提升 lock owner，限制這種 unbounded inversion；priority ceiling 可同時限制 blocking 和某些 deadlock pattern。binary semaphore 只表示 token/event，沒有 mutex owner，因此不能自然提供 inheritance。",
          "降低 critical-section 長度、禁止在持鎖時 blocking I/O、使用 bounded data structure，都能縮小 B。單純把所有 tasks priority 調高沒有意義，priority 是相對順序；過多 interrupt-level work還可能繞過 thread priority protocol。每個 shared resource 都要知道 owner、最大持有時間與允許的 call context。"
        ],
        figure: { type: "timeline", title: "Priority inheritance 限制反轉", columns: ["t0", "t1", "t2", "t3", "t4", "t5", "t6"], rows: [{ label: "Low L", cells: ["lock", "run", "inherits H", "run", "unlock", "", ""] }, { label: "High H", cells: ["", "blocks on lock", "blocked", "blocked", "ready", "run", "done"] }, { label: "Medium M", cells: ["", "ready", "cannot preempt L@H", "waiting", "waiting", "", "run"] }], caption: "inheritance 讓 L 以 H 的有效 priority 完成 bounded critical section；它不縮短 critical section 本身。" },
        sourceRefs: ["S9", "S10", "S11"]
      },
      {
        title: "9. RTOS 把 concurrency 寫成明確 state 與同步關係",
        paragraphs: [
          "RTOS thread 常在 RUNNING、READY、BLOCKED 與 TERMINATED/INACTIVE states 間轉移。READY 只表示可執行，實際 CPU 由 scheduler 依 priority/policy 選擇；BLOCKED thread 等待 timer、queue、semaphore、mutex 或 event flags，不消耗 polling cycles。ISR 不是一般 thread，不能假設可 sleep 或呼叫所有 kernel services。",
          "queue 同時傳遞資料與 ownership；counting semaphore 表示可用資源/事件數；mutex 保護 invariant 並具有 owner；event flags 聚合 bit conditions。同步物件不是可互換名稱。queue capacity 需要以 burst 和 consumer response time決定，滿佇列時 drop、overwrite、block 或 backpressure 都是不同 system semantics。",
          "periodic tick 以固定頻率更新 kernel time 並觸發 timeout，簡單但在 idle 時持續喚醒。tickless idle 會把 timer 設到下一個 deadline，延長 sleep，但 timer range、clock drift、wake latency 與 elapsed-time compensation 必須正確。CMSIS OS Tick 的 timer load 關係為 load=SystemCoreClock/frequency−1，且 SysTick reload field 只有 24 bits。"
        ],
        figure: { type: "flow", title: "RTOS thread state transitions", items: ["INACTIVE", "create → READY", "scheduler → RUNNING", "wait/sleep → BLOCKED", "event/timeout → READY", "preempt/yield → READY", "exit → TERMINATED"], caption: "priority 決定 READY threads 的選擇；BLOCKED 與 busy-wait 不同，前者讓 CPU 可執行其他工作或進入 idle。" },
        sourceRefs: ["S4", "S9", "S12"]
      },
      {
        title: "10. 記憶體預算要以 link map 與 runtime high-water mark閉合",
        paragraphs: [
          "Flash budget 不只含 application `.text`：bootloader、vector/metadata、constants、filesystem/configuration、crash record、factory data 與 OTA secondary slot 都占空間。SRAM 也不只看 global variables：每個 thread stack、kernel objects、network buffers、DMA descriptors、heap fragmentation、alignment padding 和 interrupt nesting 都會疊加。",
          "static allocation 或 fixed-size pool 讓 capacity 與 failure point 可預測；general heap 提供彈性，卻可能 fragmentation、unbounded allocation time 或 runtime failure。安全關鍵 buffer 常用 pool + ownership state。每個 thread stack 必須依最深 call chain、local objects、saved context、library usage 和 nested interrupts 估計，再以 canary/high-water measurement 驗證 margin。",
          "MPU 以有限 regions 建立 read/write/execute 與 privilege 邊界，可隔離 thread stack、driver memory 或 untrusted component；它不是 MMU，也不自動提供 demand paging。region count、alignment、subregion 與 context-switch cost 會限制 partition。把 writable data 設為 non-executable、把 code 設為 read-only，是降低任意寫入後果的基本層。"
        ],
        figure: { type: "hierarchy", title: "512 KiB Flash / 128 KiB SRAM 的預算樹", items: [{ label: "Flash 512 KiB", detail: "boot 32 + slot A 200 + slot B 200 + config/log 24 + reserve 56" }, { label: "SRAM 128 KiB", detail: "static 28 + stacks 24 + pools 40 + kernel 12 + reserve 24" }, { label: "Stack evidence", detail: "link map + call depth + high-water + nesting" }, { label: "Pool evidence", detail: "object size × count + alignment" }, { label: "Failure policy", detail: "bounded reject/drop/recovery，不越界" }], caption: "reserve 不是未說明空白；它要對應 growth、worst-case burst、alignment 與 future update 的明確用途。" },
        sourceRefs: ["S13", "S16", "S17"]
      },
      {
        title: "11. Serial bus 的有效時間由 framing、turnaround 與 arbitration 決定",
        paragraphs: [
          "UART 是 asynchronous point-to-point stream，雙方以 baud、data bits、parity 和 stop bits 約定 frame；8N1 每個 8-bit payload 需 start+8 data+stop 共 10 bit times。SPI 以 clock、controller select 和分離資料線進行 full-duplex shift，沒有統一的高層 framing；mode、word size、select timing 與 maximum clock 由 peripheral 規格決定。",
          "I2C 以 SDA/SCL 兩線連接 addressable targets，byte 後有第九個 ACK/NACK clock，還包含 START、address+R/W、可能的 repeated START 和 STOP。open-drain 與 pull-up 使 rise time、bus capacitance 和 clock stretching 影響可用速率。計算 2-byte write 時至少要計 address byte、register byte、data byte各 9 clocks，而不是只算 16 payload bits。",
          "CAN 以 message identifier 進行 non-destructive bitwise arbitration，較高優先 identifier 可在競爭時繼續，其他 sender 稍後重試；CRC、bit stuffing、acknowledgement 和 error handling 都占 bus time。Classical CAN、CAN FD 與 CAN XL 的 frame/bit-rate 規則不同。選 bus 要比較 topology、距離、noise、determinism、payload、software stack 和 fault containment，不只 peak Mbit/s。"
        ],
        figure: { type: "timeline", title: "UART 8N1 傳送 0x53 的十個 bit times", columns: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], rows: [{ label: "Line", cells: ["START=0", "D0=1", "D1=1", "D2=0", "D3=0", "D4=1", "D5=0", "D6=1", "D7=0", "STOP=1"] }], caption: "UART 通常 least-significant data bit first；0x53=01010011₂，因此 D0 到 D7 為 1,1,0,0,1,0,1,0。" },
        sourceRefs: ["S8", "S18", "S19"]
      },
      {
        title: "12. 低功耗設計是在工作量、state 與喚醒延遲間取捨",
        paragraphs: [
          "energy 是 power 對時間的積分；週期性系統的平均功率可用 Σ(Pstate×tstate)/T。降低 active time 可能讓系統更早進 sleep（race to idle），但提高 clock/voltage 也可能增加 dynamic power。CMOS dynamic power 常以 P≈αCV²f 描述趨勢，實際還有 leakage、clock tree、memory、radio 與 regulator loss。",
          "sleep state 越深，通常 steady-state power 越低，但 entry/exit energy、wake latency 與 lost context 越大。只有預測 idle duration 足夠覆蓋 minimum residency，而且 exit latency 不會讓下一 deadline 失敗，才適合進入該 state。Zephyr system power policy 正是以下一 kernel event、minimum residency 與 exit latency做選擇。",
          "peripheral、DMA、radio 和 debug probe 都可能阻止深睡；unused clock domain、floating input 或錯誤 pull configuration 也會增加耗電。功耗量測要對齊 state timeline，分開 average、peak current、energy per operation 與 battery self-discharge。只看 multimeter 的慢速平均值可能漏掉使 regulator brownout 的短暫峰值。"
        ],
        figure: { type: "matrix", title: "Power state 的可用條件", columns: ["State", "典型保留", "Exit latency", "適用 idle", "檢查項"], rows: [["Run", "全部", "0", "有 ready work", "frequency/voltage"], ["Clock idle", "register/memory", "極短", "短 gap", "interrupt wake"], ["Deep sleep", "部分 SRAM/RTC", "中", "長於 residency", "timer/source/context"], ["Standby/off", "少量 retention", "長", "長期", "boot + state restore"]], caption: "state 名稱因晶片而異；決策必須使用該平台實測 entry/exit energy 和 latency。" },
        sourceRefs: ["S20", "S21"]
      },
      {
        title: "13. 可靠啟動與更新把失敗限制在可恢復狀態",
        paragraphs: [
          "watchdog 偵測 software 未在期限內證明健康並觸發 reset；正確 feed point 應在關鍵工作完成後，而不是由獨立高優先 thread 無條件餵狗。brownout detector 在 supply 不足時阻止錯誤執行或寫 Flash。reset cause、monotonic boot count 與 crash record 讓重啟後能分辨 power、watchdog、fault 或 software request。",
          "secure boot 建立從 immutable/root-of-trust code 到後續 image 的驗證鏈：計算 image hash、驗證由受信 private key 產生的 signature、檢查 metadata/policy，再交出執行權。checksum 只能偵測意外損壞，不能證明發布者。NIST IR 8259 Rev.1 把裝置識別、組態、資料保護、介面限制、更新與 cybersecurity state awareness 視為核心能力。",
          "A/B 或 primary/secondary slots 讓新 image 先被驗證並以 test mode 啟動；application 完成 self-test 後才標記 confirmed，否則下次 reset revert 到舊 image。MCUboot 也支援 security counter 防止回退到已知脆弱版本。power loss 可發生在下載、erase、swap 或 metadata write 任一點，因此狀態轉移要 idempotent，且 recovery image、signing key custody、version policy 和 end-of-support 都是 lifecycle 的一部分。"
        ],
        figure: { type: "flow", title: "可回復的 signed A/B update 狀態機", items: ["download to inactive slot", "verify hash + signature + policy", "mark TEST", "boot candidate", "runtime self-test", "confirm → keep new", "no confirm/reset → revert old", "record outcome"], caption: "signature 驗證、runtime health 與 rollback prevention 是不同檢查；任一步驟失敗都要留下可再次啟動的已知良好映像。" },
        sourceRefs: ["S22", "S23", "S24"]
      }
    ],
    workedExamples: [
      { title: "例題一：比較平台方案的量產總成本", prompt: "MCU 方案 NRE=NT$120 萬、單價 NT$280；ASIC 方案 NRE=NT$3,600 萬、單價 NT$70。只比較這兩項時，break-even volume 為多少？", steps: ["令兩方案總成本相等。", "1,200,000+280N=36,000,000+70N。", "把 unit-cost 差移到左側：210N=34,800,000。", "N=34,800,000/210≈165,714.29。", "volume 必須是整數，從 165,715 units 起 ASIC 的兩項總成本較低。", "這個結果尚未計入時程、驗證、庫存、field update 與 respin 風險。"], result: "簡化 break-even 約 165,715 units；它是成本門檻，不是自動的設計結論。" },
      { title: "例題二：以 mask 更新 MMIO 欄位", prompt: "8-bit RW control register 原值 0xA5。要 set bit 3 並 clear bit 5，其餘保持不變，求寫回值。", steps: ["0xA5=1010 0101₂。", "set bit3 的 mask 是 0x08：0xA5 OR 0x08=0xAD。", "clear bit5 的 mask 是 NOT 0x20；在 8-bit 內為 0xDF。", "0xAD AND 0xDF=0x8D。", "0x8D=1000 1101₂，可見 bit3=1、bit5=0。", "此方法只適用一般 RW register；W1C register 必須依另一套 write semantics。"], result: "寫回 0x8D。" },
      { title: "例題三：計算 SysTick reload 與可表示性", prompt: "SystemCoreClock=48 MHz，要產生 1 kHz OS tick。求 reload；24-bit SysTick 是否容納？", steps: ["每 tick 所需 clocks=48,000,000/1,000=48,000。", "CMSIS 關係為 LOAD=clocks−1。", "LOAD=48,000−1=47,999。", "24-bit 最大 reload=2^24−1=16,777,215。", "47,999 小於上限，因此可直接表示。", "理想 tick period=48,000/48 MHz=1 ms；clock 誤差仍會成為時間誤差。"], result: "LOAD=47,999，可由 24-bit SysTick 表示。" },
      { title: "例題四：求 interrupt 的 CPU utilization", prompt: "某事件每秒 8,000 次，ISR 每次 1.5 µs，deferred thread 每次再用 4 µs。求兩部分 CPU utilization。", steps: ["ISR CPU time/s=8,000×1.5 µs=12,000 µs。", "ISR utilization=12,000/1,000,000=1.2%。", "thread CPU time/s=8,000×4 µs=32,000 µs。", "thread utilization=3.2%。", "total=4.4%，但它不包含 scheduling、cache 與 burst interference。", "ISR 的 1.2% 具有較高 priority，對低優先 tasks 的影響不能只和 thread time 合併看平均。"], result: "ISR 1.2%、deferred work 3.2%，合計平均 CPU work 4.4%。" },
      { title: "例題五：判斷 DMA 的 break-even transfer size", prompt: "PIO 每 byte 要 6 CPU cycles；DMA setup+completion 固定共 1,200 cycles，忽略每 byte DMA CPU cost。何時 DMA 節省 CPU cycles？", steps: ["PIO cost=6N cycles。", "DMA CPU cost=1,200 cycles。", "要節省 CPU：1,200<6N。", "N>200 bytes。", "N=200 時兩者同為 1,200 cycles，尚未嚴格節省。", "N=1,024 時 PIO=6,144 cycles，DMA 節省 4,944 CPU cycles；bus elapsed time另算。"], result: "transfer 大於 200 bytes 時 DMA 才在此模型下降低 CPU work。" },
      { title: "例題六：檢查 EDF 與 RM utilization bound", prompt: "三個 periodic tasks 的 (C,T) 分別為 (1,5)、(1.5,10)、(2,20) ms，且 D=T、獨立、可搶占。求 U 並套用 EDF 與 RM sufficient test。", steps: ["U1=1/5=0.20。", "U2=1.5/10=0.15；U3=2/20=0.10。", "total U=0.45。", "EDF 在列出的理想假設下以 U≤1 檢查，因此通過。", "n=3 的 RM bound=3(2^(1/3)−1)≈0.779763。", "0.45≤0.779763，也通過 RM sufficient test；尚需加入實際 overhead/blocking。"], result: "U=45%；在題設假設下同時通過 EDF 與 RM sufficient bound。" },
      { title: "例題七：迭代 fixed-priority response time", prompt: "高優先 τ1: C1=1,T1=4 ms；低優先 τ2: C2=2,D2=10 ms，blocking B2=0.5 ms，J1=0。求 R2。", steps: ["初值 R2⁰=C2+B2=2.5 ms。", "R2¹=2.5+ceil(2.5/4)×1=3.5 ms。", "R2²=2.5+ceil(3.5/4)×1=3.5 ms。", "兩次相同，fixed point 為 3.5 ms。", "R2=3.5≤D2=10 ms，因此 τ2 在此模型下通過。", "若 B2 增加或 τ1 release jitter 非零，必須重新迭代。"], result: "R2=3.5 ms，小於 10 ms deadline。" },
      { title: "例題八：閉合 Flash 與 SRAM 預算", prompt: "512 KiB Flash 配 boot 32、app A 180、OTA B 180、config 16 KiB；128 KiB SRAM 配 static 24、4 個 2 KiB stacks、buffers 36、kernel 12 KiB。求餘量。", steps: ["Flash 使用=32+180+180+16=408 KiB。", "Flash reserve=512−408=104 KiB。", "stack total=4×2=8 KiB。", "SRAM 使用=24+8+36+12=80 KiB。", "SRAM reserve=128−80=48 KiB。", "reserve 還要覆蓋 alignment、interrupt stack、heap 或未列出的 peripheral descriptors。"], result: "Flash 餘 104 KiB；SRAM 餘 48 KiB。" },
      { title: "例題九：計算 UART 8N1 傳輸時間", prompt: "UART 115,200 baud、8N1，傳 256 payload bytes，忽略 gaps。求 line bits、時間與有效 payload rate。", steps: ["8N1 每 byte=1 start+8 data+1 stop=10 bits。", "line bits=256×10=2,560 bits。", "time=2,560/115,200 s=0.022222... s。", "即約 22.22 ms。", "payload bits=256×8=2,048。", "有效 payload rate=2,048/0.022222...=92,160 bit/s，為 baud 的 80%。"], result: "需 2,560 line bits、約 22.22 ms；有效 payload 92.16 kbit/s。" },
      { title: "例題十：計算 I2C transaction 的 clock 下限", prompt: "I2C 400 kHz 對既有 target 做 1-byte register address + 1-byte data write；計入 address+W、兩個 bytes與各自 ACK，忽略 START/STOP hold time。求 clocks 與理想時間。", steps: ["address+W 是 8 bits，再加 ACK 1 clock，共 9。", "register address 是 8+ACK=9 clocks。", "data byte 也是 8+ACK=9 clocks。", "總 clocks=9+9+9=27。", "time=27/400,000 s=67.5 µs。", "若有 clock stretching、bus contention、rise-time 限制或 software gaps，實際更久。"], result: "理想下限為 27 clocks，即 67.5 µs。" },
      { title: "例題十一：以 duty cycle 求平均功率", prompt: "每 100 ms 週期 active 10 ms、20 mW；sleep 90 ms、0.1 mW。求平均功率與每週期能量。", steps: ["active energy=20 mW×10 ms=200 mW·ms=0.200 mJ。", "sleep energy=0.1 mW×90 ms=9 mW·ms=0.009 mJ。", "總能量=0.209 mJ/period。", "period=0.1 s。", "average power=0.209 mJ/0.1 s=2.09 mW。", "若 wake transition 有額外能量，必須另加後再除以 period。"], result: "平均功率 2.09 mW，每 100 ms 消耗 0.209 mJ。" }
    ],
    misconceptions: [
      ["嵌入式系統就是低效能、小記憶體的電腦。", "它由特定任務、物理 I/O、deadline、energy、reliability 與 lifecycle 定義；有些嵌入式 SoC 的計算能力很高。"],
      ["MCU、MPU 與 SoC 是互斥的三類。", "MCU/MPU 偏向處理與 memory/OS 組織，SoC 描述整合尺度；一顆 SoC 可含多種 cores。"],
      ["FPGA 是可程式 CPU 的另一個名稱。", "FPGA configuration 建立 LUT、register、routing 與專用 datapath；它可包含 CPU，但核心模型不是順序執行 instructions。"],
      ["`volatile` 會讓 shared data thread-safe。", "volatile 主要約束 compiler access；atomicity、inter-thread ordering 和 mutual exclusion 需要 atomic/lock/barrier。"],
      ["任何 register 都能 read-modify-write。", "W1C、read-clear、write-only 與 reserved bits 可能讓 RMW 產生額外副作用。"],
      ["ISR 越長，事件就處理得越完整。", "長 ISR 增加其他事件 blocking；非緊急工作應以 bounded handoff 延後到 thread context。"],
      ["DMA 自動解決 cache coherence。", "DMA API 常不自動維護 CPU cache；ownership、clean/invalidate、barrier 與 alignment 都需平台規則。"],
      ["CPU 平均 utilization 低就不會 miss deadline。", "burst、blocking、priority interference、jitter 與 non-preemptive section 可在低平均負載下造成 deadline miss。"],
      ["RM utilization 超過 bound 就一定不可排程。", "該 bound 是 sufficient 而非 necessary；超過後可用 response-time 等更精確分析。"],
      ["Semaphore 與 mutex 只差名稱。", "mutex 有 owner 並可配合 priority inheritance；semaphore 表示 token/count，語意和錯誤模式不同。"],
      ["Heap 剩餘總 bytes 足夠就一定配置成功。", "fragmentation、alignment、最大 contiguous block 與配置時間都可能使 allocation 失敗或不可預測。"],
      ["400 kHz I2C 每秒可傳 400 kbit payload。", "address、ACK、START/STOP、stretching 和 gaps 都降低 payload rate。"],
      ["最深 sleep state 永遠最省電。", "短 idle 可能無法攤平 entry/exit energy，且 wake latency 可能破壞 deadline。"],
      ["Firmware 有 checksum 就是 secure boot。", "checksum 不驗證發布者；secure boot 需要受信 key/policy 與 cryptographic signature verification。"],
      ["Watchdog 能偵測所有錯誤。", "它只偵測未按健康協定回報的 liveness failure；錯誤但持續餵狗的程式仍可能輸出危險結果。"]
    ],
    exercises: [
      { level: "基礎", question: "MCU 與 MPU 的典型 memory/OS 邊界有何不同？", solution: ["MCU 常整合有限 Flash/SRAM，使用 bare metal 或 RTOS，啟動快且直接控制 peripheral。", "MPU 常配外部 DRAM、MMU 與 rich OS，容量和隔離較強但功耗、boot 與軟體變異較大。"] },
      { level: "基礎", question: "為何 FPGA 的 parallelism 與 CPU time slicing 不同？", solution: ["FPGA 可把多個 datapaths 同時實現在 logic/routing 中，每拍並行前進。", "CPU 通常讓多個 operations 輪流使用有限 execution units，平行程度由 core/units 與 scheduling 限制。"] },
      { level: "基礎", question: "`.data` 與 `.bss` 在啟動時各如何建立？", solution: ["`.data` 的初值映像通常在 Flash，startup 將它 copy 到 SRAM。", "`.bss` 只需配置 runtime space，startup 依語言規則清零，不必在 image 存同量 zero bytes。"] },
      { level: "基礎", question: "`volatile` 與 DMB/DSB memory barrier 分別約束什麼？", solution: ["volatile 約束 compiler 必須發生可觀察 access。", "barrier 約束 architecture 對 memory operations 的 order 或 completion；DSB 比 DMB 進一步等待先前 explicit accesses 完成。"] },
      { level: "基礎", question: "為何 W1C status register 不宜做一般 read-modify-write？", solution: ["read 可能同時看到多個 pending 1 bits。", "把讀值 OR 後寫回會對那些 1 全部執行 clear；應只寫要 acknowledge 的 mask。"] },
      { level: "基礎", question: "ISR top half 與 deferred bottom half 的責任如何分配？", solution: ["top half 立即確認 source、保存必要 data/time 並發出 bounded signal。", "bottom half 在 thread/workqueue context 完成較長處理，可使用允許 blocking 的 kernel services。"] },
      { level: "計算", question: "80 MHz clock 要產生 2 kHz tick，reload 是多少？24-bit 是否容納？", solution: ["clocks/tick=80,000,000/2,000=40,000，LOAD=39,999。", "39,999<16,777,215，因此 24-bit 可容納。"] },
      { level: "計算", question: "每秒 25,000 次 interrupt、每次 2 µs，CPU utilization 為多少？", solution: ["每秒 ISR time=25,000×2 µs=50,000 µs。", "utilization=50,000/1,000,000=5%。"] },
      { level: "計算", question: "DMA 固定成本 900 cycles、PIO 每 byte 5 cycles，嚴格節省 CPU 的最小整數 bytes 是多少？", solution: ["要求 900<5N，所以 N>180。", "最小整數 N=181 bytes。"] },
      { level: "計算", question: "tasks (C,T)=(1,4)、(2,10)、(1,20) ms 的 utilization 是多少？", solution: ["U=1/4+2/10+1/20=0.25+0.20+0.05。", "總 utilization=0.50=50%。"] },
      { level: "計算", question: "115,200 baud、8E1 UART 傳 100 bytes 需要多久？", solution: ["8E1 每 frame=1 start+8 data+1 parity+1 stop=11 bits，共 1,100 bits。", "time=1,100/115,200≈9.5486 ms。"] },
      { level: "計算", question: "I2C 100 kHz 傳 address+W 與 4 data bytes，各 byte 皆有 ACK，忽略 START/STOP 時間，需多久？", solution: ["總共 5 bytes×9 clocks=45 clocks。", "time=45/100,000=450 µs。"] },
      { level: "計算", question: "active 5 ms@30 mW、sleep 195 ms@0.2 mW，每 200 ms 重複，平均功率多少？", solution: ["energy=30×5+0.2×195=189 mW·ms=0.189 mJ。", "average=0.189 mJ/0.2 s=0.945 mW。"] },
      { level: "進階", question: "說明 RX DMA 在 non-coherent cache 系統的正確 ownership 次序。", solution: ["CPU 準備 aligned buffer 後交給 DMA，期間不讀寫；等待 DMA completion。", "completion 後依平台規則執行 barrier/cache invalidate，再由 CPU 讀資料，最後才 recycle。"] },
      { level: "進階", question: "Priority inheritance 為何不能消除 high-priority task 的全部 blocking？", solution: ["它防止 medium tasks 延長 lock owner 的執行，限制 priority inversion。", "high task 仍須等待 low task 完成原本的 bounded critical section；I/O、nested locks 等成本仍存在。"] },
      { level: "進階", question: "Tickless idle 為何需要知道下一個 deadline 與 wake latency？", solution: ["timer 要設定到最早 kernel event，否則 sleeping 太久會漏 deadline。", "只有 idle window 扣除 wake latency 後仍足夠，且超過 minimum residency，深睡才有收益。"] },
      { level: "整合", question: "A/B update 為何同時需要 signature、self-test 與 revert？", solution: ["signature 證明 image 來自受信發布者且內容未被改；不保證新版本在此硬體一定正常。", "self-test 驗證 runtime health；未 confirm 時 revert 保留已知良好版本，避免裝置永久失效。"] },
      { level: "整合", question: "一個控制迴路平均只用 20% CPU，仍偶發 miss deadline，應檢查哪些時間來源？", solution: ["檢查 interrupt burst、higher-priority interference、critical-section blocking、release jitter 與 non-preemptive intervals。", "同時量測 WCET path、cache/DMA/bus contention、clock/power-state wake latency，並重新做 response-time analysis。"] }
    ],
    glossary: [
      ["Embedded system", "為特定物理或資訊任務整合計算、I/O、memory、energy 與 lifecycle 的系統。"],
      ["MCU", "Microcontroller Unit，常整合 CPU、Flash、SRAM、timer 與 peripherals。"],
      ["MPU (processor)", "Microprocessor Unit，常配外部 DRAM、MMU 與較完整作業系統。"],
      ["SoC", "System on Chip，把多種 processors、memory interfaces、I/O 與 accelerators 整合於單晶片。"],
      ["FPGA", "以可組態 logic blocks、registers 與 routing 建立數位硬體的元件。"],
      ["ASIC", "Application-Specific Integrated Circuit，製造後功能結構固定的客製積體電路。"],
      ["NRE", "Non-Recurring Engineering，產品量產前一次性的設計、驗證、mask/tooling 成本。"],
      ["Reset vector", "processor reset 後取得初始執行位置或 vector state 的架構入口。"],
      ["Linker script", "控制 sections、load/run addresses、memory regions 與 symbols 的配置規則。"],
      ["MMIO", "Memory-Mapped I/O，以一般 address-space transactions 存取 device registers。"],
      ["W1C", "Write One to Clear，對 status bit 寫 1 才清除的 register semantics。"],
      ["Memory barrier", "約束 memory operations ordering 或 completion 的 architecture primitive。"],
      ["Interrupt latency", "事件發生到指定 ISR 關鍵處理開始之間的時間。"],
      ["Jitter", "週期事件或 task release/finish 相對理想時間的變動。"],
      ["Deferred work", "由 ISR 發出、稍後在 thread/workqueue context 執行的非緊急處理。"],
      ["DMA", "Direct Memory Access，由 controller 在 peripheral/memory 間搬移資料。"],
      ["Buffer ownership", "某一時間唯一允許讀寫 buffer 的 CPU、DMA 或 device 責任狀態。"],
      ["WCET", "Worst-Case Execution Time，在明定硬體與干擾假設下的執行時間上界。"],
      ["Deadline", "job release 後必須完成指定結果的最晚時間界線。"],
      ["EDF", "Earliest Deadline First，優先執行 absolute deadline 最早 ready job 的動態策略。"],
      ["Rate monotonic", "period 越短固定 priority 越高的 periodic-task 排程策略。"],
      ["Response-time analysis", "迭代計入 execution、blocking 與高優先干擾以求最壞 response time。"],
      ["Priority inversion", "高優先工作因低優先工作持有資源而受中優先工作間接延長等待。"],
      ["Priority inheritance", "mutex owner 暫時繼承最高 waiter priority 以限制 priority inversion。"],
      ["RTOS", "Real-Time Operating System，提供可分析 scheduling、timers、IPC 與同步機制的核心。"],
      ["Tickless idle", "idle 時把 timer 設到下一事件，避免固定 periodic tick 喚醒。"],
      ["MPU (protection)", "Memory Protection Unit，以有限 regions 設定 access permission，通常不做虛擬位址 paging。"],
      ["UART", "使用約定 baud 與 start/data/parity/stop framing 的非同步 serial interface。"],
      ["SPI", "由 controller clock/select 與同步 shift data lines 組成的 serial peripheral interface。"],
      ["I2C", "使用 SDA/SCL、address、ACK/NACK 與 open-drain arbitration 的雙線 bus。"],
      ["CAN", "以 identifier arbitration、錯誤偵測與 frame protocol支援多節點的控制網路。"],
      ["Duty cycle", "工作在某 power/activity state 的時間占總觀察時間比例。"],
      ["Watchdog", "若軟體未在期限內完成健康回報便觸發 recovery/reset 的 timer。"],
      ["Secure boot", "由 root of trust 驗證後續 executable image authenticity/integrity 的啟動鏈。"],
      ["Rollback", "新 image 未確認健康時回復到先前已知良好版本。"],
      ["Anti-rollback", "拒絕啟動低於安全版本/計數器的已知脆弱 image。"]
    ],
    sources: [
      { key: "S1", title: "Arm CMSIS 6: General Device Support", url: "https://arm-software.github.io/CMSIS_6/latest/General/index.html", accessed: "2026-08-24", use: "Cortex-M device startup、vector table、system initialization、device header 與一致的 peripheral interface。" },
      { key: "S2", title: "Arm CMSIS 6 Core: Peripheral Access", url: "https://arm-software.github.io/CMSIS_6/latest/Core/group__peripheral__gr.html", accessed: "2026-08-24", use: "core peripherals、NVIC、SysTick、memory-mapped register structures 與 access qualifiers。" },
      { key: "S3", title: "Arm CMSIS Core Intrinsic Functions", url: "https://arm-software.github.io/CMSIS_5/Core_A/html/group__CMSIS__Core__InstructionInterface.html", accessed: "2026-08-24", use: "DMB、DSB、ISB、WFI/WFE 的 ordering、completion 與 low-power semantics。" },
      { key: "S4", title: "CMSIS-RTOS2: Using the API", url: "https://arm-software.github.io/CMSIS_6/latest/RTOS2/usingOS2.html", accessed: "2026-08-24", use: "ISR-callable API、threads、timers、flags、mutexes、semaphores、queues 與 resource behavior。" },
      { key: "S5", title: "Zephyr: Interrupts", url: "https://docs.zephyrproject.org/latest/kernel/services/interrupts.html", accessed: "2026-08-24", use: "ISR context、direct/regular interrupts、latency 與 offloading work 的規則。" },
      { key: "S6", title: "Zephyr: Workqueue Threads", url: "https://docs.zephyrproject.org/latest/kernel/services/threads/workqueue.html", accessed: "2026-08-24", use: "ISR deferred processing、work item lifecycle、queue/thread execution 與 race handling。" },
      { key: "S7", title: "Zephyr: Direct Memory Access", url: "https://docs.zephyrproject.org/latest/hardware/peripherals/dma.html", accessed: "2026-08-24", use: "DMA configuration、channel ownership、callback、alignment 與 non-automatic cache coherence。" },
      { key: "S8", title: "Zephyr: UART", url: "https://docs.zephyrproject.org/latest/hardware/peripherals/uart.html", accessed: "2026-08-24", use: "polling、interrupt-driven 與 asynchronous DMA-backed UART API 模型。" },
      { key: "S9", title: "CMSIS-RTOS2: Thread Management", url: "https://arm-software.github.io/CMSIS_6/main/RTOS2/group__CMSIS__RTOS__ThreadMgmt.html", accessed: "2026-08-24", use: "thread states、priority、scheduling、stack space 與 lifecycle。" },
      { key: "S10", title: "Zephyr: Scheduling", url: "https://docs.zephyrproject.org/latest/kernel/services/scheduling/index.html", accessed: "2026-08-24", use: "priority-based scheduling、EDF tie-break、ready queues、ISR precedence 與 rescheduling。" },
      { key: "S11", title: "Liu and Layland: Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment", url: "https://www.cs.ru.nl/~hooman/DES/liu-layland.pdf", accessed: "2026-08-24", use: "Radboud University 公開課程保存的原始論文；periodic task model、rate-monotonic 條件與 utilization bound。" },
      { key: "S12", title: "CMSIS-RTOS2: OS Tick API", url: "https://arm-software.github.io/CMSIS_6/latest/RTOS2/group__CMSIS__RTOS__TickAPI.html", accessed: "2026-08-24", use: "OS tick、SysTick reload、timer frequency 與 24-bit限制。" },
      { key: "S13", title: "Zephyr: User Mode", url: "https://docs.zephyrproject.org/latest/kernel/usermode/index.html", accessed: "2026-08-24", use: "MPU-backed userspace、kernel objects、memory domains 與 thread isolation。" },
      { key: "S14", title: "AMD FPGA Architecture", url: "https://docs.amd.com/r/en-US/ug1291-viv/FPGA-Architecture", accessed: "2026-08-24", use: "FPGA logic elements、routing、I/O、memory 與 architecture resources。" },
      { key: "S15", title: "AMD 7 Series Configurable Logic Blocks", url: "https://docs.amd.com/r/en-US/ug474_7Series_CLB/CLB-Overview", accessed: "2026-08-24", use: "LUT、flip-flop、carry logic、distributed memory 與 configurable routing 的具體組成。" },
      { key: "S16", title: "GNU ld: Linker Scripts", url: "https://sourceware.org/binutils/docs/ld/Scripts.html", accessed: "2026-08-24", use: "embedded memory regions、section placement、load/run address、symbols 與 linker image。" },
      { key: "S17", title: "Zephyr: Devicetree Syntax and Structure", url: "https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html", accessed: "2026-08-24", use: "device nodes、unit addresses、register regions、interrupts 與 hardware description。" },
      { key: "S18", title: "NXP UM10204: I2C-bus Specification and User Manual, Rev. 7", url: "https://community.nxp.com/pwmxy87654/attachments/pwmxy87654/nxp-designs/931/1/UM10204.pdf", accessed: "2026-08-24", use: "SDA/SCL、START/STOP、address、ACK/NACK、arbitration、clock stretching 與 timing。" },
      { key: "S19", title: "Bosch X_CAN Protocol Controller", url: "https://www.bosch-semiconductors.com/products/ip-modules/can-ip-modules/x-can/", accessed: "2026-08-24", use: "Classical CAN、CAN FD、CAN XL、identifier arbitration 與目前 ISO 11898 protocol context。" },
      { key: "S20", title: "Zephyr: System Power Management", url: "https://docs.zephyrproject.org/latest/services/pm/system.html", accessed: "2026-08-24", use: "power-state policy、minimum residency、exit latency、next event 與 device power constraints。" },
      { key: "S21", title: "Arm CMSIS Core: Power Management Functions", url: "https://arm-software.github.io/CMSIS_6/latest/Core/group__intrinsic__CPU__gr.html", accessed: "2026-08-24", use: "WFI/WFE、barriers 與 processor low-power entry primitives。" },
      { key: "S22", title: "MCUboot Bootloader Design", url: "https://docs.mcuboot.com/design.html", accessed: "2026-08-24", use: "signed image validation、primary/secondary slots、test/confirm/revert、power-loss recovery 與 downgrade prevention。" },
      { key: "S23", title: "NIST IR 8259 Rev. 1: Foundational Cybersecurity Activities for IoT Device Manufacturers", url: "https://csrc.nist.gov/pubs/ir/8259/r1/final", accessed: "2026-08-24", use: "2026 final revision 的 device cybersecurity lifecycle、risk、support 與 capability foundation。" },
      { key: "S24", title: "NIST IoT Device Cybersecurity Capability Catalogs", url: "https://pages.nist.gov/IoT-Device-Cybersecurity-Requirement-Catalogs/", accessed: "2026-08-24", use: "device identification、configuration、data protection、interface access、software update 與 state awareness。" }
    ]
  },
  {
    chapter: 11,
    title: "效能量測與分析：從時間證據到可重現的最佳化",
    english: "Performance Measurement and Analysis: From Timing Evidence to Reproducible Optimization",
    revised: "2026-08-25",
    readingTime: "約 300–360 分鐘",
    intro: "效能不是處理器型號、GHz 或單一 benchmark 分數，而是指定系統在指定條件下完成指定工作的可觀察結果。同一系統可能有較短 single-request latency，卻在多使用者時有較低 throughput；平均時間改善，p99 tail latency 反而惡化；CPU cycles 下降，energy 或 memory traffic 卻上升。本章建立一條可重現的證據鏈：先定義 workload、輸入與成功條件，再選 latency、throughput、CPU time、energy 等 metric；接著控制環境、重複量測並量化不確定性；最後以 instruction count、CPI、PMU counters、profile、AMAT、Roofline 與 scalability model 尋找瓶頸。所有最佳化都必須回到相同 baseline 重測，並同時確認 correctness，才能把『數字變了』提升為可信的因果結論。",
    outcomes: [
      "能區分 response time、latency、throughput、utilization、tail percentile、speedup 與 efficiency。",
      "能建立包含 workload、SUT、環境、warm-up、repetition、correctness 與 uncertainty 的量測協定。",
      "能推導 CPU Time=IC×CPI×cycle time，並對 instruction mix 求 weighted CPI。",
      "能把 CPI 分解為 base、branch、cache、TLB、resource 與其他 stall contributions。",
      "能解釋 GHz、IPC、MIPS、FLOPS、percent-of-peak 等派生指標的適用邊界。",
      "能比較 SPECspeed、SPECrate、MLPerf scenarios 與 microbenchmark 的 workload/metric contract。",
      "能正確使用 cycles、instructions、branches、misses 等 PMU counters 並辨識 multiplexing 和 skid。",
      "能區分 instrumentation、sampling、tracing 與 statistical profiling 的觀察成本與歸因能力。",
      "能以 AMAT、bandwidth、operational intensity 與 Roofline 判斷 memory-bound 或 compute-bound。",
      "能套用 Amdahl's Law、Gustafson's Law、parallel efficiency 與 scaling overhead。",
      "能以 energy、average power、performance per watt 與 energy-delay product比較時間/能源折衷。",
      "能形成一次只改變可解釋因素、可回復且可重現的最佳化閉環。"
    ],
    sections: [
      {
        title: "1. 效能問題必須先指定工作、邊界與 metric",
        paragraphs: [
          "任何『哪台比較快』都至少缺少 workload、input size、completion boundary 與 metric。response time 可以是 request 到 response、process start 到 exit，或 device event 到 actuator update；throughput 則是單位時間完成的 work。兩者可同時變好，也可能互相取捨。batching 常提高 throughput，卻讓第一筆工作等待更久。",
          "平均 latency 隱藏分布尾端。互動服務常同時報 median、p90、p95、p99 與 maximum，因為少數 queueing、page fault 或 contention events 會決定使用者最差體驗。MLPerf Inference 6.0 的 Server scenario 以 Poisson arrivals 測可維持 throughput，並要求 benchmark-specific 99th-percentile latency constraint；Offline scenario 則一次送入大量 samples，主要量 throughput。",
          "utilization 是資源忙碌比例，不是完成率；100% CPU 可能完成很多工作，也可能 spin、retry 或等待 cache misses。若系統長期穩定，Little's Law 以 L=λW 連結平均在系統中的工作數 L、throughput λ 與平均 response time W。它不直接給 tail latency，也要求 observation boundary 和穩定狀態一致。"
        ],
        figure: { type: "matrix", title: "同一 workload 的不同效能觀察", columns: ["Metric", "單位", "越大/小越好", "回答", "容易漏掉"], rows: [["Latency/response time", "s, ms, ns", "小", "一筆工作多久", "tail distribution"], ["Throughput", "jobs/s, QPS, GB/s", "大", "單位時間完成多少", "latency/quality"], ["Utilization", "% busy", "非單調", "資源忙多久", "是否做 useful work"], ["Tail percentile", "p95/p99 time", "小", "高比例請求的上界", "更稀有 tails"], ["Energy", "J/work", "小", "完成工作耗能", "time/power boundary"]], caption: "metric 必須和成功條件一起報告；高 throughput 但錯誤輸出、超過 tail SLO 或品質不足都不是有效結果。" },
        sourceRefs: ["S1", "S2", "S3"]
      },
      {
        title: "2. 可重現量測是一個受控實驗",
        paragraphs: [
          "量測協定先固定 system under test（SUT）：hardware model/firmware、core/thread count、memory、OS/kernel、compiler/version/flags、libraries、power policy、frequency governor、NUMA placement 與 background load。workload 要保存 source/binary hash、input、seed、command、environment 和 correctness oracle。未揭露條件的數字無法公平比較。",
          "warm-up 可讓 code/data cache、JIT、page mappings、runtime pools 和 thermal state 接近欲觀察狀態；但 cold-start 本身若是產品需求，就不能丟棄。重複量測應交錯 baseline/candidate 的執行順序，降低 temperature、battery 或 background drift。Google Benchmark 支援 minimum warm-up、minimum run time、repetitions 與 random interleaving，反映這些實驗需求。",
          "樣本平均值的 95% confidence interval 在近似常態且標準差未知時可寫為 x̄±t(0.975,n−1)s/√n。interval 描述估計方法的長期 coverage，不表示這次算出的固定 interval 有 95% probability 包含真值。skewed latency 應同時保存 raw samples、percentiles；比較兩版本若能在同一次受控狀態成對執行，paired differences 通常比兩組獨立平均更能消除共同噪聲。"
        ],
        figure: { type: "flow", title: "效能實驗的可重現資料鏈", items: ["freeze question + metric", "record SUT + software", "validate workload output", "warm/cold policy", "interleave repetitions", "store raw measurements", "estimate uncertainty", "publish conditions + conclusion"], caption: "只有最後平均值不足以重現；raw results、commands、configuration 與 correctness evidence 都是量測的一部分。" },
        sourceRefs: ["S4", "S5", "S6", "S7"]
      },
      {
        title: "3. CPU performance equation 把時間拆成三個可追蹤因子",
        paragraphs: [
          "CPU execution time=CPU clock cycles×clock cycle time=IC×CPI/f，其中 IC 是 dynamic instruction count，CPI 是每 instruction 平均 cycles，f 是 clock rate。dynamic 表示 loop 每次執行都計數；source lines 或 static instructions 不能替代 IC。elapsed time 還包含 scheduling、I/O、blocking 等非 running CPU time，必須先說 metric 是 CPU time 或 wall-clock time。",
          "三個因子互相耦合。compiler optimization 可降低 IC 卻使用 latency 較長的 instructions；wider pipeline 或高 frequency 可能縮短 cycle time，卻提高 branch penalty 或 power throttling；vectorization 可能增加單條 instruction 的工作，讓 IC 減少但每 instruction 含義改變。因此不能單獨以 IC、CPI 或 GHz 宣告程式更快。",
          "若 instruction classes i 的比例為 fi、class CPI 為 CPIi，weighted CPI=ΣfiCPIi，且 Σfi=1。若給的是 class counts Ni，則 CPI=Σ(Ni×CPIi)/ΣNi。比例可能因 compiler、input 和 microarchitecture 改變；將不同 ISA 的 instruction counts 直接比較，尤其容易忽略每條 instruction 所做工作不同。"
        ],
        figure: { type: "factor", title: "CPU Time 的三因子證據", items: [{ label: "Instruction Count", detail: "algorithm + ISA + compiler + input" }, { label: "Cycles / Instruction", detail: "pipeline + dependencies + memory" }, { label: "Seconds / Cycle", detail: "clock period = 1/frequency" }], caption: "總時間是三者乘積；最佳化若改變其中多項，要用新乘積而不是只觀察最顯眼的因子。" },
        sourceRefs: ["S8", "S9"]
      },
      {
        title: "4. CPI stack 把總 cycles 歸因到事件機率與 penalty",
        paragraphs: [
          "平均 CPI 可分成 base CPI 與多種 stall CPI：CPI=CPIbase+CPIbranch+CPIL1+CPILLC+CPITLB+...。對 branch，常用 contribution=branch frequency×misprediction rate×misprediction penalty；對 data cache，可用 loads/stores per instruction×miss rate×effective miss penalty。所有 rate 的 denominator 必須一致。",
          "local miss rate 以進入該層的 accesses 為 denominator；global miss rate 以全部 accesses 為 denominator。若 L1 miss rate=5%、L2 local miss rate=10%，到 main memory 的 global rate=0.5%，不能把 10%直接乘每條 instruction。memory-level parallelism 又可能重疊 misses，使 observed stall cycles 小於 misses×isolated latency。",
          "CPI stack 是模型，不是硬體唯一真相。PMU 的 cycles stalled、cache references、misses 可能使用 model-specific event definitions；speculation 可讓執行過但未 retire 的工作被某些 counters 計入。先用 algebra 建立預測，再以多個互相約束的 counters 和 elapsed time closure 檢查，避免用單一 event 直接宣告因果。"
        ],
        figure: { type: "hierarchy", title: "CPI=1.5152 的 contribution stack", items: [{ label: "Base 1.0000", detail: "理想 retire/execution cost" }, { label: "Branch 0.1152", detail: "0.12×0.08×12" }, { label: "L1 data miss 0.4000", detail: "0.25×0.04×40" }, { label: "Total 1.5152", detail: "各互斥/已校正 contribution 相加" }, { label: "Closure check", detail: "IC×CPI/f 是否接近 measured CPU time" }], caption: "若事件可重疊或 counter 定義重複，不能直接相加；圖中的數字只適用明示的簡化模型。" },
        sourceRefs: ["S9", "S10", "S11"]
      },
      {
        title: "5. GHz、IPC、MIPS 與 FLOPS 都是有條件的派生指標",
        paragraphs: [
          "IPC=instructions/cycles，是 CPI 的倒數只在相同 instruction population 上具有直觀意義。out-of-order CPU 可因 workload ILP、cache、branch 和 frequency 不同得到不同 IPC；同一程式的 IPC 高不保證 wall time短，因為 IC 和 frequency 仍在方程式中。issue width 是 ceiling，也不等於 retired IPC。",
          "MIPS=instruction count/(time×10^6)=frequency/(CPI×10^6)。不同 ISA、compiler 或 vector width 的 instruction 做不同工作，因此 MIPS 可能獎勵需要更多簡單 instructions 的系統。MFLOPS/GFLOPS 只適合 floating-point work，還需明訂 precision、operation counting（例如 FMA 算幾個 FLOPs）與 correctness。peak FLOPS 是資源上限，不是任何 workload 的預測。",
          "percent improvement 和 speedup 的 denominator 不同。time reduction r=(Told−Tnew)/Told；speedup S=Told/Tnew=1/(1−r)。時間減少 20% 對應 1.25× speedup，而 20% speedup 代表 Tnew=Told/1.2，只減少約16.67%。比較報告應優先給 raw time、work 和完整 ratio，再附百分比。"
        ],
        figure: { type: "matrix", title: "常見派生指標的安全使用範圍", columns: ["指標", "公式", "適合", "不能單獨推出"], rows: [["IPC", "instructions/cycles", "同 workload 的 retire efficiency", "跨 ISA完成時間"], ["MIPS", "IC/time/10⁶", "同 ISA/程式的輔助值", "有用工作量"], ["GFLOPS", "FP ops/time/10⁹", "明訂 precision/op count 的 kernel", "accuracy 或 latency"], ["Percent of peak", "attained/peak", "同資源 ceiling 下利用率", "瓶頸原因"], ["Speedup", "Told/Tnew", "同 work/boundary 的相對時間", "絕對可接受性"]], caption: "任何 rate 都要交代 numerator 如何計數、denominator 是 CPU time 或 elapsed time，以及 correctness 是否相同。" },
        sourceRefs: ["S8", "S9", "S12"]
      },
      {
        title: "6. Benchmark suite 是 workload、規則與報告格式的合約",
        paragraphs: [
          "benchmark 的代表性取決於目標 workload。microbenchmark 隔離 function、instruction 或 memory pattern，適合建立機制上界，卻不代表整個 application；application suite較接近真實工作，但歸因較難。最可信的選擇順序是自己的 production workload，其次是行為相似的標準 suite，再以 microbenchmark 解釋機制。",
          "2026 年 5 月發布的 SPEC CPU 2026 包含 52 個 compute-intensive benchmarks，刻意著重 processor、memory hierarchy 和 compiler，不測 network、graphics 或一般 I/O。SPECspeed 執行每 benchmark 一份，使用 reference time/SUT time 表示 time-based performance；SPECrate 以多份 copies測 throughput。各 benchmark ratios 以 geometric mean 合成，且 base/peak、hardware/software/tuning 要完整揭露。",
          "MLPerf Inference 6.0 同時約束 model、dataset、quality target、load generation、latency 與 throughput。Server、Offline、SingleStream 等 scenarios 回答不同部署問題，不能把 Offline samples/s 當成 interactive p99 latency。標準結果可比較的原因不是名稱響亮，而是 input、correctness、run rules、audit/compliance 和 disclosure 共同限制自由度。"
        ],
        figure: { type: "matrix", title: "現代 benchmark contract 的差異", columns: ["Benchmark/scenario", "Workload boundary", "主要 metric", "必要共同條件", "不代表"], rows: [["SPECspeed 2026", "compute-intensive suite；每項一份", "reference/SUT time ratio", "validated output + disclosure", "network/I/O service"], ["SPECrate 2026", "多 copies throughput", "copies×reference/SUT time", "copies/rules/config", "single-request latency"], ["MLPerf Server", "Poisson-arrival inference", "max QPS under p99 limit", "quality + latency + LoadGen", "offline batch ceiling"], ["MLPerf Offline", "large batch at start", "samples/s", "quality + fixed data/rules", "tail latency"], ["Microbenchmark", "isolated operation", "ns/op or ops/s", "prevent dead-code + warm-up", "whole-application speed"]], caption: "suite 名稱、版本、scenario、division、metric 和 configuration 都是結果識別的一部分。" },
        sourceRefs: ["S1", "S2", "S3", "S13", "S14"]
      },
      {
        title: "7. PMU counters 提供事件證據，但不是自動因果分析",
        paragraphs: [
          "Performance Monitoring Unit（PMU）以有限 hardware counters 計數 cycles、instructions retired、branches、branch misses、cache/TLB events 或 model-specific microarchitectural events。RISC-V 定義 cycle、instret 與 hpmcounter CSRs，Intel/Arm 也有 architectural 和 model-specific events；同名 `cache-misses` 在不同平台未必代表同一 cache level或條件。",
          "Linux perf_events 讓工具設定 counting 或 sampling。若 requested events 超過 physical counter slots，kernel 會 multiplex；`time_enabled` 與 `time_running` 不同時，estimated count=value×time_enabled/time_running。scaled estimate 假設 sampled interval 具有代表性，短 phase 或 phase-changing workload 可能違反此假設。",
          "counter ratios 要先檢查 denominator：IPC=instructions/cycles；branch miss rate=branch-misses/branches；MPKI=misses/(instructions/1000)。user/kernel、per-thread/system-wide、CPU migration、SMT sibling、virtualization 和 frequency scaling 都會改變 boundary。PMU sampling還可能 skid，使 sample IP 落在觸發 event 之後；precise-event support 依架構而異。"
        ],
        figure: { type: "flow", title: "從硬體事件到可解釋 ratio", items: ["choose event + denominator", "bind process/CPU/domain", "PMU counts limited slots", "kernel may multiplex", "read value + enabled/running", "scale if justified", "derive IPC/miss rate/MPKI", "cross-check time + phases"], caption: "counter value離開 event definition、scope 與 running fraction 就沒有完整意義；ratio 也必須和 workload phase 對齊。" },
        sourceRefs: ["S10", "S11", "S15", "S16", "S17"]
      },
      {
        title: "8. Instrumentation、sampling 與 tracing 回答不同歸因問題",
        paragraphs: [
          "instrumentation 在 function entry/exit、basic block 或自訂 event 明確記錄資料，可取得 call count、exact path 或 duration，但每次事件都增加 instructions、cache traffic 和 timing perturbation。sampling 由 timer 或 PMU overflow 定期/按事件擷取 instruction pointer/call stack，以部分觀察估計 hot code；overhead較低但短函式可能沒有 sample。",
          "tracing 記錄帶 timestamp 的 event sequence，適合 scheduler、I/O、lock、interrupt 與 distributed request 的因果順序；資料量和 storage overhead 可能很大。statistical profile 顯示『樣本在哪裡』，call graph 顯示 caller/callee，trace 顯示『何時發生』。工具輸出必須回到問題：CPU hotspot、off-CPU wait、cache miss attribution 或 tail request path需要不同資料。",
          "sample proportion p̂ 的標準誤近似 √(p̂(1−p̂)/n)。若 100,000 samples 中 42%落在 function A，95% normal margin約 0.306 percentage points；但這只量化 random sampling error，不包含 biased sampling、unwinding failure、phase omission、symbol mismatch 和 profiler overhead。先比較 profiler on/off 的 total time，是基本 observer-effect check。"
        ],
        figure: { type: "matrix", title: "效能觀察工具的解析度與成本", columns: ["方法", "典型資料", "優勢", "主要成本/偏差", "適合問題"], rows: [["Wall timer", "start/end time", "簡單、低干擾", "無歸因", "是否更快"], ["Instrumentation", "exact calls/regions", "精確 count/path", "每事件 overhead", "哪個 region 花時"], ["PMU counting", "aggregate events", "低成本機制證據", "event/denominator歧義", "CPI/miss/branch"], ["Sampling", "IP/call stack samples", "低成本 hotspot", "sampling error/skid", "CPU time在哪裡"], ["Tracing", "timestamped sequence", "順序與等待因果", "大量資料/perturbation", "tail、lock、I/O path"]], caption: "更細的觀察通常付出更高 overhead；先用粗量測定位，再縮小範圍提高解析度。" },
        sourceRefs: ["S5", "S10", "S18", "S19"]
      },
      {
        title: "9. Memory performance 要同時看 latency、bandwidth 與資料重用",
        paragraphs: [
          "AMAT=hit time+miss rate×miss penalty 適合單一 blocking access 的平均模型；多層 cache 要逐層展開 local rates。現代 out-of-order core 可同時維持多個 misses，prefetch 也可能提前搬移，因而 application elapsed time 取決於 memory-level parallelism、bandwidth saturation 與 dependency critical path，不只孤立 DRAM latency。",
          "bandwidth=bytes/time，必須指明 useful payload、requested bytes 或 actual memory traffic。write allocate、eviction、coherence、page walk 和 prefetch 都可能增加 actual bytes。STREAM-like bandwidth ceiling 取決於 access pattern、NUMA placement、threads 和 memory channels；small working set 命中 cache時不能拿結果宣稱 DRAM bandwidth。",
          "Roofline 以 operational intensity I=operations/bytes moved through a chosen memory boundary，給出 attainable performance≤min(peak compute, bandwidth×I)。ridge point=peak/bandwidth。I 低時 memory-bound，增加 compute units 無助；tiling/fusion/reuse 可提高 I。模型是 ceiling 而非精確預測，instruction dependencies、latency、vector utilization 和 load imbalance 仍可使結果低於 roof。"
        ],
        figure: { type: "matrix", title: "Peak=1 TFLOP/s、bandwidth=100 GB/s 的 Roofline", columns: ["Operational intensity", "Bandwidth roof", "Compute roof", "Ceiling", "分類"], rows: [["1 FLOP/B", "100 GFLOP/s", "1000 GFLOP/s", "100 GFLOP/s", "memory-bound"], ["4 FLOP/B", "400 GFLOP/s", "1000 GFLOP/s", "400 GFLOP/s", "memory-bound"], ["6 FLOP/B", "600 GFLOP/s", "1000 GFLOP/s", "600 GFLOP/s", "memory-bound"], ["10 FLOP/B", "1000 GFLOP/s", "1000 GFLOP/s", "1000 GFLOP/s", "ridge"], ["20 FLOP/B", "2000 GFLOP/s", "1000 GFLOP/s", "1000 GFLOP/s", "compute-bound"]], caption: "單位使用十進位 GB/s、GFLOP/s；若 memory boundary改為 cache 或 HBM，bytes 與 bandwidth roof 都要重算。" },
        sourceRefs: ["S8", "S20", "S21"]
      },
      {
        title: "10. Pipeline 與 branch 最佳化必須回到 weighted cost",
        paragraphs: [
          "branch cost不是每條 instruction 固定加 penalty，而是 branch frequency×misprediction rate×recovery penalty。降低 miss rate 可藉 layout、profile-guided optimization、減少 unpredictable control flow或改善 data representation；branchless transformation 若增加 instructions、long dependency chain 或無條件做昂貴工作，可能反而變慢。",
          "data dependency限制 instruction-level parallelism。loop unrolling 可減少 branch overhead並暴露 independent operations，vectorization 可讓一條 instruction處理多 elements；但 register pressure、code size、alignment、tail handling 和 memory bandwidth可能抵消收益。optimization manual 的 latency/throughput table 是 microarchitecture-specific resource model，不是所有 CPU 的 ISA 保證。",
          "PGO 以代表性 training workload 收集 edge frequencies或samples，再讓 compiler調整 inlining、layout、branch weights等決策。profile 不代表部署 workload時會形成 profile mismatch。LLVM 文件特別強調 training benchmark 必須涵蓋實際使用；產生、merge、使用 profile 後仍需獨立 evaluation input，避免只對 training set最佳化。"
        ],
        figure: { type: "matrix", title: "20% branches、10% mispredict、3-cycle penalty 的平均影響", columns: ["尺度", "instructions", "branches", "mispredicts", "penalty", "extra cycles", "base cycles", "total"], rows: [["100 instructions", "100", "20", "2", "3 each", "6", "100", "106"], ["Per instruction", "1", "0.20", "0.02", "×3", "+0.06", "1.00", "CPI 1.06"]], caption: "期望值以大量 dynamic instructions 解讀；單次短程式的 mispredict count 仍是整數且可能偏離期望。" },
        sourceRefs: ["S9", "S22", "S23", "S24"]
      },
      {
        title: "11. Amdahl's Law 量化局部改善的全域上限",
        paragraphs: [
          "若原時間中 fraction F 可被加速 S 倍，其餘不變，normalized new time=(1−F)+F/S，overall speedup=1/((1−F)+F/S)。F 必須由原 baseline time 定義，不是 instruction fraction或新版本時間比例。若改善後瓶頸轉移，重新 profile 時 fractions 會改變。",
          "當 S→∞，maximum speedup=1/(1−F)。這表示 95% time 可無限加速的上限是20×，而 5%不可改善時間成為全部。optimization priority 可用可改善 time contribution排序；一個很慢但只占0.1%的函式，即使快100倍也只帶來約1.001× overall speedup。",
          "Amdahl也適用 cache、I/O、accelerator與compiler。若 accelerator kernel本身快20倍，但 transfer/setup仍在不可改善部分，end-to-end speedup受限。分段計時必須互斥且總和能 closure 到 end-to-end time；若 asynchronous overlap，簡單 fractions相加可能重複計時，需改用 critical path。"
        ],
        figure: { type: "hierarchy", title: "局部改善如何形成全域上限", items: [{ label: "Original time = 1", detail: "unaffected 0.65 + target 0.35" }, { label: "Target 4× faster", detail: "0.35/4 = 0.0875" }, { label: "New time", detail: "0.65 + 0.0875 = 0.7375" }, { label: "Overall speedup", detail: "1/0.7375 ≈ 1.3559×" }, { label: "Infinite target speed", detail: "limit = 1/0.65 ≈ 1.5385×" }], caption: "局部4×沒有變成全程4×；unaffected 65%決定明確上限。" },
        sourceRefs: ["S25", "S26"]
      },
      {
        title: "12. Parallel scaling 要分 strong、weak 與 contention",
        paragraphs: [
          "strong scaling固定 problem size；以 N workers執行時間 TN，speedup S=T1/TN，efficiency E=S/N。Amdahl理想式S=1/((1−p)+p/N)忽略 communication、synchronization、imbalance和resource contention，因此實測通常更低。superlinear speedup可能來自 aggregate cache容量改變，需解釋而非直接視為錯誤。",
          "weak scaling讓 problem size隨 workers增加，使每 worker work近似固定；理想時間保持不變。Gustafson's Law以固定parallel-run time中的serial fraction s估計scaled speedup SG=N−s(N−1)。它和Amdahl回答不同問題，不是互相推翻。報告必須寫清problem size、workers、threads/copies與baseline。",
          "scaling curve的kneepoint常由shared memory bandwidth、last-level cache、lock、queue、NUMA link或I/O飽和形成。throughput增加但p99 latency急升，表示queueing正在累積。只報aggregate CPU utilization無法分辨load imbalance；應同時看per-thread work、run queue、stall、bandwidth與barrier wait。"
        ],
        figure: { type: "matrix", title: "p=0.92 的理想 strong scaling", columns: ["Workers N", "Amdahl speedup", "Efficiency", "Ideal linear", "差距來源"], rows: [["1", "1.000", "100.0%", "1×", "baseline"], ["2", "1.852", "92.6%", "2×", "serial 8%"], ["4", "3.226", "80.6%", "4×", "serial term"], ["8", "5.128", "64.1%", "8×", "serial term"], ["16", "7.273", "45.5%", "16×", "serial term"], ["∞", "12.500", "→0", "∞", "1/0.08 ceiling"]], caption: "表是無額外overhead的上界；communication與contention加入後只會使同一workload更慢。" },
        sourceRefs: ["S25", "S26", "S27"]
      },
      {
        title: "13. 時間、能源與最佳化閉環必須一起驗證",
        paragraphs: [
          "energy=∫P(t)dt，若只用平均功率可寫E=Pavg×T。faster code可能提高instantaneous power卻因時間縮短而省energy；也可能race to idle失敗而同時增power與energy。performance per watt適合固定work/quality的throughput比較，energy per work適合單次成本；兩者都需相同measurement boundary。",
          "Energy-Delay Product（EDP）=E×T，同時懲罰energy與time；ED²P更重視latency。Linux powercap以`energy_uj`累積counter與`max_energy_range_uj`呈現wrap range，差值計算要處理counter wrap。SPEC CPU 2026可選擇報告performance與energy metrics，MLPerf也有QPS/W或joules/stream等scenario-specific power metrics。",
          "可靠最佳化循環是：保存baseline、提出機制假設、預測哪些metric/counter會變、只改一個可解釋因素、確認output、重複量測與uncertainty、檢查secondary metrics，最後才保留變更。若結果不符預測，先撤回並更新模型。速度提升但correctness、tail、memory、energy或portability退化，都必須明確作為tradeoff，不可藏在單一speedup後。"
        ],
        figure: { type: "flow", title: "可回復的效能最佳化閉環", items: ["versioned baseline", "profile + bottleneck model", "predict metric changes", "one controlled change", "correctness gate", "repeat + confidence", "time/tail/energy/memory check", "keep or revert + document"], caption: "closed loop要求每次變更都能回到baseline；『更快』只有在相同work與正確結果下才成立。" },
        sourceRefs: ["S3", "S6", "S28", "S29"]
      }
    ],
    workedExamples: [
      { title: "例題一：由 throughput 與 response time 求在途工作", prompt: "穩定服務平均完成 600 requests/s，平均 response time 25 ms。依 Little's Law 求平均在系統中的 requests。", steps: ["確認 throughput 與 response time 使用同一 system boundary。", "λ=600 requests/s。", "W=25 ms=0.025 s。", "L=λW=600×0.025。", "L=15 requests。", "這是長期平均，不表示每個瞬間或p99都恰好有15筆。"], result: "平均約15個requests同時在系統中。" },
      { title: "例題二：計算平均時間的95% confidence interval", prompt: "16次獨立量測平均100 ms、sample standard deviation 4 ms；使用t(0.975,15)=2.131，求mean的95% CI。", steps: ["n=16，√n=4。", "standard error=s/√n=4/4=1 ms。", "margin=t×SE=2.131×1=2.131 ms。", "lower=100−2.131=97.869 ms。", "upper=100+2.131=102.131 ms。", "interval依賴獨立/近似常態與固定protocol假設，不是tail latency interval。"], result: "95% CI約為[97.869, 102.131] ms。" },
      { title: "例題三：由IC、CPI與clock求CPU time", prompt: "程式retire 1.2×10^9 instructions，CPI=1.8，clock=3 GHz。求cycles與CPU time。", steps: ["IC=1.2×10^9。", "cycles=IC×CPI。", "cycles=1.2×10^9×1.8=2.16×10^9。", "f=3×10^9 cycles/s。", "CPU time=2.16×10^9/(3×10^9)=0.72 s。", "這不自動包含process未在CPU執行時的I/O或scheduler wait。"], result: "2.16×10^9 cycles，CPU time=0.72 s。" },
      { title: "例題四：求weighted CPI與branch改善", prompt: "ALU 50%@CPI1、load/store 30%@CPI2、branch 20%@CPI3；若branch CPI降為1，前後CPI與speedup是多少？", steps: ["old CPI=0.5×1+0.3×2+0.2×3。", "old CPI=0.5+0.6+0.6=1.7。", "new CPI=0.5×1+0.3×2+0.2×1=1.3。", "固定IC與clock時，speedup=old CPI/new CPI。", "speedup=1.7/1.3≈1.30769。", "branch局部3×只作用於20% instructions，整體不是3×。"], result: "CPI由1.7降至1.3，整體speedup約1.308×。" },
      { title: "例題五：建立CPI contribution stack", prompt: "base CPI=1；branch frequency=12%、mispredict=8%、penalty=12 cycles；memory instructions=25%、L1 miss=4%、effective penalty=40 cycles。求total CPI。", steps: ["branch events/instruction=0.12×0.08=0.0096。", "branch contribution=0.0096×12=0.1152 CPI。", "L1 misses/instruction=0.25×0.04=0.01。", "memory contribution=0.01×40=0.4 CPI。", "total=1+0.1152+0.4=1.5152。", "此加法假設兩類penalty不重疊，且effective penalty已處理下層命中與MLP。"], result: "簡化total CPI=1.5152。" },
      { title: "例題六：判斷MIPS為何會誤導", prompt: "CPU A以4 GHz、CPI2執行某ISA；CPU B以3 GHz、CPI1執行另一ISA。求MIPS，並說明何者完成同一工作較快仍缺什麼。", steps: ["MIPS=f/(CPI×10^6)。", "A=4×10^9/(2×10^6)=2000 MIPS。", "B=3×10^9/(1×10^6)=3000 MIPS。", "B的MIPS較高。", "但time=IC×CPI/f，仍缺每台完成同一工作所需dynamic IC。", "跨ISA的instruction語意/工作量不同，所以不能只由3000>2000判定end-to-end更快。"], result: "A=2000 MIPS、B=3000 MIPS；缺少同work的IC與實測時間，不能下最終結論。" },
      { title: "例題七：以geometric mean合成benchmark ratios", prompt: "三個benchmark相對baseline ratios為1.20、0.90、1.50。求geometric mean與arithmetic mean。", steps: ["geometric mean=(1.20×0.90×1.50)^(1/3)。", "乘積=1.62。", "cube root(1.62)≈1.17446。", "arithmetic mean=(1.20+0.90+1.50)/3=1.20。", "ratio資料用geometric mean可保持reciprocal/reference-scale性質。", "仍需報個別ratios，因0.90表示其中一項實際退化。"], result: "geometric mean≈1.1745，arithmetic mean=1.20。" },
      { title: "例題八：校正multiplexed PMU counter", prompt: "某event raw value=80 million，time_enabled=2.0 s、time_running=0.8 s。求scaled estimate與running fraction。", steps: ["running fraction=time_running/time_enabled。", "fraction=0.8/2.0=0.40=40%。", "scale factor=time_enabled/time_running=2.5。", "scaled value=80M×2.5=200M。", "60%時間counter未排到physical slot。", "若event rate隨phase劇烈改變，200M只是依代表性假設的估計。"], result: "running fraction=40%，scaled estimate=200 million events。" },
      { title: "例題九：由PMU counts求IPC與branch miss rate", prompt: "cycles=3.0×10^9、instructions=4.5×10^9、branches=8.0×10^8、branch misses=4.0×10^7。求IPC、CPI與miss rate。", steps: ["IPC=instructions/cycles=4.5/3.0=1.5。", "CPI=cycles/instructions=3.0/4.5≈0.6667。", "兩者互為倒數，1/1.5≈0.6667。", "branch miss rate=40M/800M。", "miss rate=0.05=5%。", "若counts scope或multiplexing不同，這些ratios不可直接相除。"], result: "IPC=1.5、CPI≈0.6667、branch miss rate=5%。" },
      { title: "例題十：估計sampling proportion的不確定性", prompt: "100,000個profile samples中42%位於function A，以normal approximation求約95% margin。", steps: ["p̂=0.42，n=100,000。", "SE=√(p̂(1−p̂)/n)。", "SE=√(0.42×0.58/100000)≈0.0015609。", "95% margin≈1.96×SE≈0.003059。", "換成percentage points約0.306。", "approx interval約41.694%到42.306%；這不包含systematic sampling bias。"], result: "random-sampling 95% margin約±0.306 percentage points。" },
      { title: "例題十一：用Roofline判斷瓶頸", prompt: "peak compute=1 TFLOP/s、memory bandwidth=100 GB/s、kernel intensity=6 FLOP/byte。求ceiling與ridge point。", steps: ["bandwidth roof=100 GB/s×6 FLOP/B。", "=600 GFLOP/s。", "compute roof=1000 GFLOP/s。", "ceiling=min(600,1000)=600 GFLOP/s。", "ridge intensity=1000/100=10 FLOP/B。", "6<10，所以kernel在此boundary屬memory-bound。"], result: "ceiling=600 GFLOP/s；ridge=10 FLOP/B，屬memory-bound。" },
      { title: "例題十二：Amdahl局部最佳化", prompt: "原時間35%部分加速4倍，其餘不變。求overall speedup與無限加速上限。", steps: ["F=0.35，S=4。", "new normalized time=(1−0.35)+0.35/4。", "=0.65+0.0875=0.7375。", "speedup=1/0.7375≈1.35593。", "S→∞時target term歸零。", "maximum=1/0.65≈1.53846。"], result: "4×局部改善得到約1.356×全域speedup；理論上限約1.538×。" },
      { title: "例題十三：比較時間、能源與EDP", prompt: "baseline為40 W、2.0 s；candidate為55 W、1.2 s，完成相同工作。求energy、speedup與EDP。", steps: ["baseline energy=40×2.0=80 J。", "candidate energy=55×1.2=66 J。", "speedup=2.0/1.2≈1.6667×。", "baseline EDP=80×2.0=160 J·s。", "candidate EDP=66×1.2=79.2 J·s。", "EDP reduction=(160−79.2)/160=50.5%；candidate功率較高但時間與energy都較低。"], result: "candidate為1.667×快、energy少17.5%，EDP少50.5%。" }
    ],
    misconceptions: [
      ["GHz較高的CPU一定執行程式較快。", "時間同時取決於IC、CPI與frequency；高frequency也可能伴隨不同CPI、throttling或ISA。"],
      ["Latency與throughput是同一個指標的倒數。", "只有特定serial/no-queue模型才可能如此；concurrency、batching與queueing會使兩者獨立。"],
      ["平均latency下降就代表所有request更快。", "分布可能改變，p95/p99或maximum仍可能惡化。"],
      ["重跑多次取最小值最能代表硬體能力。", "任意取best會產生selection bias；aggregation與run rule應事前固定並保留raw runs。"],
      ["Confidence interval表示真值有95%機率落在這個固定區間。", "95%描述重複抽樣方法的coverage；這次區間算出後真值固定。"],
      ["降低instruction count保證CPU time下降。", "CPI或cycle time可能同時上升，仍須重算完整乘積。"],
      ["IPC越高就能跨CPU直接判定越快。", "IPC依instruction population與workload；frequency、IC與每條instruction工作仍不同。"],
      ["MIPS能公平比較不同ISA。", "不同ISA完成同一工作所需instructions及每條語意不同。"],
      ["標準benchmark能代表所有應用。", "suite只代表規則定義的workloads；SPEC CPU明確不測network與一般I/O。"],
      ["PMU event名稱相同就跨CPU語意相同。", "architectural/model-specific event definitions、cache level與speculation條件可不同。"],
      ["Multiplexed counter縮放後就是精確真值。", "縮放假設counter運行片段代表未運行片段；phase變化會導致偏差。"],
      ["Profiler顯示最熱函式，所以它一定是根因。", "hotspot是時間位置；根因可能是callee、cache、lock、I/O或不必要工作。"],
      ["Cache misses乘DRAM latency一定等於stall cycles。", "MLP、prefetch、out-of-order overlap與下層cache會改變effective penalty。"],
      ["未通過Roofline compute roof就一定是memory-bound。", "只有位於bandwidth roof附近且intensity低才支持此判斷；其他bottlenecks也會低於兩個roofs。"],
      ["Branchless code一定比branch快。", "它可能增加IC、dependencies或無條件昂貴工作；結果取決於predictability與replacement cost。"],
      ["Amdahl fraction可以用instruction比例代替。", "F定義為原baseline time fraction；不同instructions耗時不同。"],
      ["更多threads會線性加速。", "serial work、communication、contention、imbalance與bandwidth都會降低efficiency。"],
      ["功率較高就一定耗能較多。", "energy=power×time；較高power若大幅縮短時間仍可能降低energy。"]
    ],
    exercises: [
      { level: "基礎", question: "Latency、throughput與utilization各回答什麼問題？", solution: ["latency是一筆work的完成時間；throughput是單位時間完成work數。", "utilization是資源busy比例，不保證busy期間完成useful work。"] },
      { level: "基礎", question: "為何cold-start與steady-state benchmark不能混成同一平均？", solution: ["cold start含page fault、JIT、cache fill與初始化；steady state觀察不同狀態。", "兩者若都是需求應分開報告；混合比例會任意改變平均。"] },
      { level: "基礎", question: "CPU time與elapsed time的boundary有何不同？", solution: ["CPU time計process實際在CPU上執行的時間。", "elapsed time從外部start到completion，包含schedule、I/O與blocking等待。"] },
      { level: "基礎", question: "SPECspeed與SPECrate 2026主要差異是什麼？", solution: ["SPECspeed每benchmark一份，主要比較完成時間ratio。", "SPECrate執行多copies，metric衡量單位時間work throughput。"] },
      { level: "基礎", question: "PMU counting與sampling各產生何種資料？", solution: ["counting給指定boundary內aggregate event totals。", "sampling在event overflow/period取得IP或call stack，用部分觀察估計hot locations。"] },
      { level: "基礎", question: "Amdahl's Law中的F為何必須以原時間定義？", solution: ["公式把原normalized time拆成F與1−F。", "改善後fractions已重新分配；instruction proportion也不等於time contribution。"] },
      { level: "計算", question: "800 QPS且平均response time 40 ms，依Little's Law平均在途requests多少？", solution: ["W=0.040 s。", "L=λW=800×0.040=32 requests。"] },
      { level: "計算", question: "IC=2.4×10^9、CPI=1.25、clock=2.5 GHz，CPU time多少？", solution: ["cycles=2.4×10^9×1.25=3.0×10^9。", "time=3.0×10^9/2.5×10^9=1.2 s。"] },
      { level: "計算", question: "Instruction mix為60%@CPI1、25%@CPI2、15%@CPI4，weighted CPI多少？", solution: ["CPI=0.60×1+0.25×2+0.15×4。", "=0.60+0.50+0.60=1.70。"] },
      { level: "計算", question: "時間由10 s降到8 s，time reduction與speedup各是多少？", solution: ["reduction=(10−8)/10=20%。", "speedup=10/8=1.25×。"] },
      { level: "計算", question: "Ratios 0.8、1.0、1.25的geometric mean是多少？", solution: ["乘積=0.8×1.0×1.25=1。", "cube root(1)=1，表示multiplicative中心為1，但個別結果仍有退化/改善。"] },
      { level: "計算", question: "Counter value=45M、enabled=1.5 s、running=0.5 s，scaled estimate多少？", solution: ["scale factor=1.5/0.5=3。", "scaled=45M×3=135M；running fraction=1/3。"] },
      { level: "計算", question: "Peak=2 TFLOP/s、bandwidth=250 GB/s、intensity=5 FLOP/B，Roofline ceiling多少？", solution: ["bandwidth roof=250×5=1250 GFLOP/s。", "min(2000,1250)=1250 GFLOP/s，ridge=2000/250=8 FLOP/B。"] },
      { level: "計算", question: "p=0.9、N=8的Amdahl ideal speedup與efficiency是多少？", solution: ["S=1/(0.1+0.9/8)=1/0.2125≈4.7059。", "E=S/8≈0.5882=58.82%。"] },
      { level: "計算", question: "50 W運行1.5 s與35 W運行2.0 s，哪個energy較少？", solution: ["第一個energy=50×1.5=75 J。", "第二個=35×2=70 J，所以低功率較慢方案仍少5 J。"] },
      { level: "進階", question: "為何PMU cache misses與stall cycles不應直接視為一對一因果？", solution: ["misses可能被prefetch、MLP或out-of-order重疊，未完全阻塞retirement。", "event也可能包含speculative、不同cache level或scope；需搭配latency、bandwidth與dependency evidence。"] },
      { level: "進階", question: "如何驗證loop tiling改善是由locality而非量測噪聲造成？", solution: ["事前預測miss/traffic/operational intensity變化，固定compiler與input，交錯重複baseline/candidate。", "確認output相同，再比較raw time uncertainty、cache misses、bytes與CPI closure。"] },
      { level: "整合", question: "Candidate平均快8%，但p99慢25%、energy少5%，應如何呈現結論？", solution: ["分別報mean、p99與energy的raw values/ratios及uncertainty，不合成單一『更快』。", "是否採用取決於workload SLO與能源目標；若p99是硬性限制，candidate目前不合格。"] }
    ],
    glossary: [
      ["System under test", "被量測的hardware、software與configuration完整邊界。"],
      ["Latency", "單筆operation/request從指定start到completion的時間。"],
      ["Response time", "包含service與queue/wait的端到端完成時間。"],
      ["Throughput", "單位時間完成的有效工作量。"],
      ["Utilization", "資源處於busy狀態的時間比例。"],
      ["Tail latency", "高percentile如p95/p99所代表的延遲尾端。"],
      ["Little's Law", "穩定系統中平均在途工作L=throughput λ×平均時間W。"],
      ["Warm-up", "在正式量測前建立欲觀察cache/JIT/thermal等狀態的執行期。"],
      ["Baseline", "所有candidate以相同work與protocol比較的版本/組態。"],
      ["Confidence interval", "以指定coverage程序估計population parameter的不確定範圍。"],
      ["Standard error", "sample statistic跨重複抽樣的估計標準差。"],
      ["Instruction count", "workload實際執行/retire的dynamic instructions數。"],
      ["CPI", "Cycles Per Instruction，平均每retired instruction所對應cycles。"],
      ["IPC", "Instructions Per Cycle，指定scope中的retired instructions/cycles。"],
      ["CPI stack", "把total CPI分解為base與各stall/event contributions的模型。"],
      ["MIPS", "Millions of Instructions Per Second，跨ISA代表性有限的rate。"],
      ["FLOPS", "Floating-Point Operations Per Second，需明訂precision與operation counting。"],
      ["Speedup", "相同工作下Told/Tnew的相對效能。"],
      ["Microbenchmark", "隔離小型operation或機制以量測latency/throughput的workload。"],
      ["SPECspeed", "SPEC CPU 2026以一份benchmark的reference/SUT time ratio建立的time-based metric。"],
      ["SPECrate", "SPEC CPU 2026以多copies衡量work-per-time的throughput metric。"],
      ["Geometric mean", "n個正ratios乘積的n次方根，適合合成normalized ratios。"],
      ["PMU", "Performance Monitoring Unit，以hardware counters觀察cycles與microarchitectural events。"],
      ["Multiplexing", "多events分享有限PMU slots、各自只在部分enabled time運行。"],
      ["MPKI", "Misses Per Kilo Instructions，每千instructions的event miss數。"],
      ["Skid", "sample recorded instruction位置落後於實際counter overflow觸發位置。"],
      ["Instrumentation", "插入明確measurement events以取得exact counts/regions的方法。"],
      ["Sampling", "以部分週期/event observations估計時間或事件分布的方法。"],
      ["Tracing", "保存timestamped event sequence以重建因果/等待路徑的方法。"],
      ["Observer effect", "量測工具本身改變被量測時間或行為。"],
      ["AMAT", "Average Memory Access Time，以hit/miss條件成本估算平均access time。"],
      ["Memory-level parallelism", "多筆memory misses同時outstanding並重疊latency的程度。"],
      ["Operational intensity", "指定memory boundary下operations/bytes moved。"],
      ["Roofline", "以min(peak compute, bandwidth×intensity)形成performance ceiling的模型。"],
      ["Amdahl's Law", "以原時間可改善fraction與局部speedup計算overall speedup上限。"],
      ["Strong scaling", "固定problem size增加workers以縮短時間。"],
      ["Weak scaling", "隨workers增加problem size、維持每worker work近似固定。"],
      ["Parallel efficiency", "speedup/workers，衡量線性scaling利用程度。"],
      ["Energy-delay product", "energy×delay，同時懲罰能耗與完成時間的複合metric。"],
      ["PGO", "Profile-Guided Optimization，以代表性execution profile引導compiler決策。"]
    ],
    sources: [
      { key: "S1", title: "SPEC CPU 2026 Overview", url: "https://www.spec.org/cpu2026/docs/overview.html", accessed: "2026-08-25", use: "最新CPU suite、SPECspeed/SPECrate、ratio、geometric mean、repeat selection、scope與限制。" },
      { key: "S2", title: "SPEC CPU 2026 Run and Reporting Rules", url: "https://www.spec.org/cpu2026/docs/runrules.html", accessed: "2026-08-25", use: "可重現性、build/run conditions、base/peak、disclosure、correctness、performance與energy metrics。" },
      { key: "S3", title: "MLPerf Inference v6.0 Rules", url: "https://github.com/mlcommons/inference_policies/blob/master/inference_rules.adoc", accessed: "2026-08-25", use: "Server/Offline/SingleStream scenarios、LoadGen、tail latency、throughput、quality與confidence rules。" },
      { key: "S4", title: "Google Benchmark User Guide", url: "https://google.github.io/benchmark/user_guide.html", accessed: "2026-08-25", use: "warm-up、minimum time、repetitions、random interleaving、manual timing、statistics與dead-code防護。" },
      { key: "S5", title: "NIST Engineering Statistics Handbook: Confidence Limits for the Mean", url: "https://itl.nist.gov/div898/handbook/eda/section3/eda352.htm", accessed: "2026-08-25", use: "t confidence interval、standard error、sample size與coverage正確解讀。" },
      { key: "S6", title: "NIST Confidence Intervals for Differences Between Means", url: "https://itl.nist.gov/div898/handbook/prc/section3/prc312.htm", accessed: "2026-08-25", use: "paired/unpaired comparisons、difference uncertainty與零差異判斷。" },
      { key: "S7", title: "TPC Current Benchmark Specifications", url: "https://www.tpc.org/tpc_documents_current_versions/current_specifications5.asp?mode=TPC-MEMBER", accessed: "2026-08-25", use: "2026 active transaction/database benchmark versions、fair use、audit與full disclosure context。" },
      { key: "S8", title: "UC Berkeley CS61C Course Notes: Performance Metrics", url: "https://notes.cs61c.org/content/pipeline/", accessed: "2026-08-25", use: "CPU performance equation、latency/throughput、speedup與instruction/cycle/time factorization。" },
      { key: "S9", title: "Intel 64 and IA-32 Optimization Reference Manual", url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel64-and-ia32-architectures-optimization.html", accessed: "2026-08-25", use: "current microarchitecture optimization、instruction latency/throughput、branch、memory與measurement principles。" },
      { key: "S10", title: "Intel 64 and IA-32 Software Developer Manuals, Version 092", url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html", accessed: "2026-08-25", use: "2026-08-19 performance monitoring architecture、PMU sharing、events與model-specific scope。" },
      { key: "S11", title: "Linux perf_event_open(2)", url: "https://www.man7.org/linux/man-pages/man2/perf_event_open.2.html", accessed: "2026-08-25", use: "counter groups、sampling、time_enabled/time_running、multiplex scaling、lost samples與PMU constraints。" },
      { key: "S12", title: "SPEC CPU 2026 Result Fields", url: "https://www.spec.org/cpu2026/Docs/result-fields.html", accessed: "2026-08-25", use: "metric名稱、time/throughput interpretation、benchmark counts、base/peak與result disclosure欄位。" },
      { key: "S13", title: "MLCommons Releases MLPerf Inference v6.0", url: "https://mlcommons.org/2026/04/mlperf-inference-v6-0-results/", accessed: "2026-08-25", use: "2026-04最新inference suite版本、更新workloads與current deployment context。" },
      { key: "S14", title: "MLPerf Inference Submission Guide", url: "https://docs.mlcommons.org/inference/submission/", accessed: "2026-08-25", use: "SUT、categories、scenarios、LoadGen、accuracy-only/performance-only與submission artifacts。" },
      { key: "S15", title: "RISC-V Privileged Architecture: Hardware Performance Monitor", url: "https://docs.riscv.org/reference/isa/_attachments/riscv-privileged.pdf", accessed: "2026-08-25", use: "cycle、instret、hpmcounter、mhpmevent、counter inhibit與privilege-mode counting semantics。" },
      { key: "S16", title: "Arm: Profile Firmware with the PMU", url: "https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/profile-firmware-with-performance-monitor-unit-in-armv8-a-cpu", accessed: "2026-08-25", use: "Armv8-A PMU cycle/event counters、Exception Level filters與firmware profiling。" },
      { key: "S17", title: "Linux Kernel: Perf Events and Tool Security", url: "https://docs.kernel.org/admin-guide/perf-security.html", accessed: "2026-08-25", use: "perf_events data categories、scope、PMU/uncore data與security access boundary。" },
      { key: "S18", title: "Linux Kernel: Workload Tracing", url: "https://docs.kernel.org/admin-guide/workload-tracing.html", accessed: "2026-08-25", use: "perf counting/sampling、kernel subsystem tracing與workload attribution workflow。" },
      { key: "S19", title: "Linux Kernel: User Events Tracing", url: "https://docs.kernel.org/trace/user_events.html", accessed: "2026-08-25", use: "application-defined trace events、timestamps、ftrace/perf integration與event overhead boundary。" },
      { key: "S20", title: "Roofline: An Insightful Visual Performance Model", url: "https://www2.eecs.berkeley.edu/Pubs/TechRpts/2008/Archive/EECS-2008-134.pdf", accessed: "2026-08-25", use: "operational intensity、compute roof、bandwidth roof、ridge point與bottleneck analysis原始模型。" },
      { key: "S21", title: "Berkeley Lab Roofline Model", url: "https://amcr.lbl.gov/departments/computer-science-department/ppan/roofline-performance-model/", accessed: "2026-08-25", use: "Roofline現代應用、data movement、attained performance與optimization interpretation。" },
      { key: "S22", title: "LLVM Profile-Guided Optimization", url: "https://llvm.org/docs/HowToBuildWithPGO.html", accessed: "2026-08-25", use: "instrumented profile generation、training benchmark代表性、merge/use/evaluation PGO workflow。" },
      { key: "S23", title: "LLVM llvm-profgen", url: "https://llvm.org/docs/CommandGuide/llvm-profgen.html", accessed: "2026-08-25", use: "perf/ETM sample-based profile generation、symbolization與sample PGO data flow。" },
      { key: "S24", title: "LLVM MemProf", url: "https://llvm.org/docs/MemProf.html", accessed: "2026-08-25", use: "allocation hotness/lifetime/access profile與memory-layout guided optimization。" },
      { key: "S25", title: "Gene Amdahl: Validity of the Single Processor Approach", url: "https://doi.org/10.1145/1465482.1465560", accessed: "2026-08-25", use: "固定workload局部改善與serial fraction上限的原始論文。" },
      { key: "S26", title: "John Gustafson: Reevaluating Amdahl's Law", url: "https://course.ece.cmu.edu/~ece600/fall16/references/gustafson.pdf", accessed: "2026-08-25", use: "fixed-time/scaled workload、Gustafson speedup與Amdahl假設差異的原始論文。" },
      { key: "S27", title: "OpenMP API Specification 6.0", url: "https://www.openmp.org/wp-content/uploads/OpenMP-API-Specification-6-0.pdf", accessed: "2026-08-25", use: "threads、worksharing、synchronization、timing routines與shared-memory scaling semantics。" },
      { key: "S28", title: "Linux Kernel Power Capping Framework", url: "https://docs.kernel.org/power/powercap/powercap.html", accessed: "2026-08-25", use: "energy_uj、counter range、power zones、RAPL與measurement/control boundaries。" },
      { key: "S29", title: "MLPerf Inference Audit Guidelines", url: "https://github.com/mlcommons/inference_policies/blob/master/MLPerf_Audit_Guidelines.adoc", accessed: "2026-08-25", use: "QPS/W、joules/stream、power/time alignment、scenario metrics、accuracy與audit consistency。" }
    ]
  },
  {
    chapter: 12,
    title: "網路組織與架構：從 frame 到端到端連線",
    english: "Network Organization and Architecture: From Frames to End-to-End Connections",
    revised: "2026-08-26",
    readingTime: "約 320–380 分鐘",
    intro: "網路不是一條把資料送到遠端的抽象管線，而是一連串具有不同位址、封裝、佇列與故障邊界的系統。應用程式交付 bytes 後，傳輸層建立程序到程序的語意，網路層選擇跨網路路徑，鏈路層在每一跳重建 frame，實體層才把位元轉成電或光訊號。本章由一個封包的生命週期出發，逐步推導 transmission、propagation、processing、queueing delay，建立 Ethernet switching、CIDR、IPv4/IPv6、ARP/Neighbor Discovery、longest-prefix forwarding 與 routing 的完整模型，再以 TCP sequence space、RTO、flow/congestion control、BDP 及現代 QUIC/TLS/HTTP 收束端到端效能。所有位址、長度、offset、window 與時間例題均可獨立重算。",
    outcomes: [
      "能沿 TCP/IP 分層追蹤 application data、segment、datagram 與 frame 的封裝與解除封裝。",
      "能分開計算 transmission、propagation、processing 與 queueing delay，並辨認 store-and-forward 影響。",
      "能用 Shannon capacity 說明 bandwidth、SNR 與理論 channel capacity 的關係。",
      "能解讀 Ethernet frame、MAC address、EtherType、MTU、FCS 與 on-wire overhead。",
      "能手算 learning switch 的 MAC table 更新、flooding、forwarding 與 filtering。",
      "能由 IPv4 prefix length 求 subnet mask、network、broadcast、host range 與 address count。",
      "能比較 IPv4 與 IPv6 header、TTL/Hop Limit、checksum、extension header 與 fragmentation。",
      "能判斷目的地在本地或遠端，並說明 ARP、IPv6 ND 與 default gateway 的角色。",
      "能依 longest-prefix match 從 forwarding table 選出 next hop 與 output interface。",
      "能以 Dijkstra 與 Bellman–Ford 的核心 recurrence 推導 link-state 與 distance-vector route。",
      "能解讀 UDP/TCP ports、TCP sequence/acknowledgment、receiver window 與連線狀態。",
      "能計算 TCP RTO、bandwidth-delay product、window-limited throughput 與 congestion window 的效果。",
      "能把 DNS、TLS、HTTP 與 QUIC 放回分層資料路徑，分析建立連線的 RTT 成本與安全邊界。"
    ],
    sections: [
      {
        title: "1. 分層是端點間的邏輯協定，也是相鄰層的服務契約",
        paragraphs: [
          "TCP/IP stack 常以 application、transport、internet 與 link 四層描述；OSI 七層可提供更細的功能名稱，但實際 Internet 協定不必逐層一一對應。peer layers 是邏輯關係：來源 TCP header 由目的 TCP 解讀；中間 Ethernet switch 不需要理解 HTTP body，普通 IP router 也不以 TCP port 決定基本轉送。",
          "encapsulation 是把上層 PDU 放進下層 payload。HTTP message 可成為 TCP byte stream 的一部分，TCP segment 成為 IP payload，IP datagram 再成為 Ethernet payload。每過一個 router，IP datagram通常保留端到端 source/destination address，但 link header 與 trailer會依下一段鏈路移除並重建；TTL/Hop Limit等逐跳欄位則改變。",
          "multiplexing 讓多個上層共用同一層：EtherType辨認IPv4、IPv6等payload，IP Protocol/IPv6 Next Header辨認TCP或UDP，transport destination port辨認socket所屬服務。demultiplexing依這些欄位逐層上送。header不是免費資訊；小payload會讓header比例升高，padding、preamble與inter-frame gap還會增加真正line occupancy。"
        ],
        figure: { type: "matrix", title: "一筆 HTTPS 資料的四層封裝", columns: ["層", "資料單位", "主要識別", "本層提供", "典型範圍"], rows: [["Application", "message", "URL / name", "資料語意", "process"], ["Transport", "segment/datagram", "ports + protocol", "process-to-process", "end hosts"], ["Internet", "IP datagram", "IP prefix/address", "跨網路轉送", "routers"], ["Link", "frame", "MAC + EtherType", "單一鏈路交付", "one hop"], ["Physical", "symbols/bits", "encoding/channel", "訊號傳輸", "medium"]], caption: "資料向下封裝、向上解除封裝；每層的位址與故障範圍不同。" },
        sourceRefs: ["S1", "S2"]
      },
      {
        title: "2. Packet switching 的時間由四種 delay 與每一跳 serialization 組成",
        paragraphs: [
          "一個 packet 在一條 link 的 nodal delay 可寫成 dnodal=dproc+dqueue+dtrans+dprop。processing包含header parse與table lookup；queueing取決於同時競爭output link的traffic；transmission delay=L/R，是把L bits逐一推上R bit/s鏈路所需時間；propagation delay=d/s，是訊號跨越距離d、以媒介速度s前進的時間。",
          "transmission和propagation最容易混淆。把1500-byte frame送入100 Mbit/s link需要120 microseconds，與線長無關；訊號穿越1000 km光纖，若速度近似2×10^8 m/s，需要5 ms，與packet長度無關。提高link rate只縮短L/R，不會消除跨洋propagation或router queueing。",
          "store-and-forward switch通常收完整packet後才由下一link傳出，所以同速、無排隊的k條links至少承擔k次L/R，加上每段propagation與中間processing。長訊息切成多個packets後可pipeline：第一包仍經完整end-to-end delay，後續包能同時占據不同links；總完成時間不能把每包延遲單純相乘。"
        ],
        figure: { type: "flow", title: "一跳 packet delay 的可加總部分", items: [{ label: "Process", detail: "parse + lookup" }, { label: "Queue", detail: "wait for output" }, { label: "Transmit", detail: "L/R" }, { label: "Propagate", detail: "distance/speed" }, { label: "Next node", detail: "repeat per hop" }], caption: "queueing通常最不穩定；其餘三項可由明示參數先建立下界。" },
        sourceRefs: ["S2", "S3"]
      },
      {
        title: "3. Physical channel 的 bit rate 受頻寬、訊號品質與編碼共同限制",
        paragraphs: [
          "媒介可為twisted pair、coaxial cable、fiber或wireless spectrum；bit不是以抽象0/1直接飛行，而是由voltage、light intensity、phase、frequency等symbols承載。bandwidth B以Hz描述通道可通過的頻率範圍，bit rate以bit/s描述資訊速率，兩者不是同一單位。調變讓一個symbol可代表多個bits，但可區分的levels越多，越容易受noise影響。",
          "對含additive noise的理想化channel，Shannon capacity C=B log2(1+S/N)給出可靠通訊的理論上限。S/N必須使用線性power ratio；若給SNRdB，先用10^(SNRdB/10)轉換。公式不指定實際modulation或error-correcting code，也不保證達到上限，只說任何可靠方案都不能長期超過此bound。",
          "line rate、payload throughput與goodput要分開。line rate包含frame header、FCS、preamble、coding overhead與idle規則；payload throughput扣除協定overhead；goodput再扣掉重傳與應用不需要的bytes。1 Gbit/s Ethernet不代表application每秒必定收到125 MB，CPU、switch、receiver window及storage也可能形成瓶頸。"
        ],
        figure: { type: "matrix", title: "通道與可觀察速率不可混用", columns: ["量", "單位", "決定因素", "包含overhead", "用途"], rows: [["Bandwidth", "Hz", "channel response", "不適用", "頻域範圍"], ["Symbol rate", "baud", "symbols/s", "encoding相關", "訊號變化"], ["Line rate", "bit/s", "PHY/MAC", "是", "link規格"], ["Payload throughput", "bit/s", "frame效率", "扣link overhead", "協定資料"], ["Goodput", "bit/s", "loss/retransmit/app", "只算有用資料", "應用效果"]], caption: "同一條link可同時具有1 Gbit/s line rate與較低的payload throughput、goodput。" },
        sourceRefs: ["S3", "S4"]
      },
      {
        title: "4. Ethernet frame 建立單一鏈路的位址、型別、邊界與錯誤偵測",
        paragraphs: [
          "Ethernet MAC frame的核心欄位是6-byte destination、6-byte source、2-byte Type/Length、payload與4-byte Frame Check Sequence。EtherType 0x0800表示IPv4，0x86DD表示IPv6。標準Ethernet payload通常至少46 bytes、最多1500 bytes；不足minimum時加入padding，但padding不屬於上層IP total length。",
          "FCS通常使用CRC偵測傳輸錯誤。sender把frame bits視為polynomial並附加remainder，receiver重算後以不符判定corruption；CRC是error detection，不是cryptographic integrity，也不自行修正錯誤。壞frame通常在link層丟棄，是否重傳由特定link protocol或較高層決定。",
          "on-wire occupancy還包括7-byte preamble、1-byte start frame delimiter及frame間至少12-byte time的interpacket gap。對1500-byte payload，從destination到FCS是1518 bytes，若把8-byte preamble/SFD與12-byte gap納入時槽則為1538 byte-times。VLAN tag會再加入4 bytes，因此計算必須先明示boundary。"
        ],
        figure: { type: "matrix", title: "標準 Ethernet frame 的欄位邊界", columns: ["欄位", "長度", "主要用途", "是否屬MAC frame", "每hop改變"], rows: [["Preamble + SFD", "8 B", "clock sync + start", "否", "是"], ["Destination MAC", "6 B", "link receiver", "是", "是"], ["Source MAC", "6 B", "link sender", "是", "是"], ["Type/Length", "2 B", "payload protocol", "是", "可能"], ["Payload + pad", "46–1500 B", "upper-layer PDU", "是", "內容通常保留"], ["FCS", "4 B", "CRC detection", "是", "重算"], ["Interpacket gap", "12 byte-times", "medium idle", "否", "每link"]], caption: "1518-byte frame與1538-byte slot不是矛盾，而是計量boundary不同。" },
        sourceRefs: ["S4", "S5"]
      },
      {
        title: "5. Learning bridge 由來源學習、目的查找與loop-free topology形成LAN",
        paragraphs: [
          "Ethernet switch/bridge收到frame時先把source MAC與ingress port寫入forwarding database；若destination已知且位於另一port，就只forward該port；若destination與source在同port則filter；未知unicast、broadcast及部分multicast會flood到同VLAN內除ingress外的ports。table entries會aging，讓移動主機可重新學習。",
          "switch不是router。它在bridged LAN內處理MAC frames，通常不遞減IP TTL；router終止一段link frame、查IP prefix，再為下一hop建立新frame。VLAN以邏輯broadcast domain分割同一switch fabric；802.1Q tag攜帶VLAN identifier與priority資訊，access/trunk的tag處理依配置而定。",
          "任意bridging loop會讓broadcast或unknown unicast不斷複製，因Ethernet header沒有像IP TTL的通用hop limit。Spanning Tree類控制機制會選出無loop的active topology，或現代fabric使用其他loop-aware forwarding。資料平面table lookup與控制平面topology建立必須分開理解。"
        ],
        figure: { type: "matrix", title: "Learning switch 的四種目的處理", columns: ["Destination狀態", "MAC table結果", "動作", "輸出範圍", "同時學習source"], rows: [["Known remote", "port ≠ ingress", "forward", "one port", "是"], ["Known local", "port = ingress", "filter", "none", "是"], ["Unknown unicast", "no entry", "flood", "VLAN內其他ports", "是"], ["Broadcast", "FF:FF:FF:FF:FF:FF", "flood", "VLAN內其他ports", "是"]], caption: "學習依source、轉送依destination；把兩個方向顛倒會得到錯誤table。" },
        sourceRefs: ["S4", "S6"]
      },
      {
        title: "6. CIDR prefix 把 IPv4 address 分成可聚合的network與host部分",
        paragraphs: [
          "IPv4 address是32 bits。CIDR表示法a.b.c.d/p指出前p bits為prefix，subnet mask即前p bits為1、其餘為0。network address=IP bitwise AND mask；同一prefix的address count=2^(32−p)。傳統subnet中all-zero host部分是network address，all-one host部分是directed broadcast，因此一般unicast host count為2^(32−p)−2；/31與/32有特殊用途，不能機械套用。",
          "subnetting從host部分再借bits建立較小prefix。例如/24切成四個/26，每段有64 addresses，起點在最後octet以64遞增。判斷192.0.2.130/26時，130落在128–191 block，所以network=192.0.2.128、broadcast=.191、一般host=.129到.190。",
          "aggregation把多個連續、對齊的prefix合成較短prefix，減少routing table entries。能否合併不只看address連續，還要看binary high bits相同及route policy/next hop一致。CIDR address不自帶class A/B/C；看到第一octet就使用classful default mask會破壞現代prefix判斷。"
        ],
        figure: { type: "bits", title: "192.0.2.130/26 的位元切分", totalBits: 32, items: [{ label: "Network prefix", bits: 26, detail: "11000000 00000000 00000010 10" }, { label: "Host field", bits: 6, detail: "000010 = host offset 2" }], caption: "prefix固定到192.0.2.128；6-bit host field提供64個address positions。" },
        sourceRefs: ["S9", "S12"]
      },
      {
        title: "7. IPv4 與 IPv6 都提供 best-effort datagram，但 header 與 fragmentation 邊界不同",
        paragraphs: [
          "IPv4 base header通常20 bytes，IHL允許options增加長度；Total Length含header與payload。router每hop遞減TTL，若成為0便丟棄並通常回ICMP Time Exceeded；因TTL改變，IPv4 header checksum也需更新。Protocol指出上層TCP、UDP或ICMP。IP本身不承諾交付、順序、唯一性或固定延遲。",
          "IPv4 router在DF未設定且next-hop MTU較小時可fragment。除最後一片外，fragment data長度必須是8-byte倍數，Fragment Offset也以8 bytes為單位；destination才reassemble。任一fragment遺失會讓整個upper-layer datagram無法完成，且middlebox處理使fragmentation脆弱，現代端點通常依Path MTU調整packet size。",
          "IPv6 fixed header為40 bytes，使用128-bit addresses、Next Header、Payload Length與Hop Limit，沒有IPv4 header checksum。intermediate routers不做IPv6 fragmentation；source可使用Fragment extension header。IPv6要求link MTU至少1280 bytes，並鼓勵application配合path MTU，不能把IPv4與IPv6 fragmentation行為混為一談。"
        ],
        figure: { type: "matrix", title: "IPv4 與 IPv6 forwarding-relevant 欄位", columns: ["特性", "IPv4", "IPv6", "每hop處理", "常見誤解"], rows: [["Address", "32 bits", "128 bits", "查prefix", "長度不等於安全性"], ["Base header", "通常20 B", "40 B", "parse", "IPv6不一定總overhead較少"], ["Loop bound", "TTL", "Hop Limit", "decrement", "不是精確秒數"], ["Header checksum", "16-bit", "none", "IPv4更新", "payload仍靠上層/link"], ["Fragmentation", "source/router", "source only", "IPv6 router不切片", "reassembly在destination"]], caption: "兩者都採逐datagram best-effort forwarding，但固定header與fragmentation責任不同。" },
        sourceRefs: ["S10", "S11", "S26"]
      },
      {
        title: "8. ARP 與 IPv6 Neighbor Discovery 只解析下一跳，不解析整條路徑",
        paragraphs: [
          "IPv4 sender先用prefix判斷destination是否on-link。若同subnet，next-hop IP就是destination IP；若off-link，next-hop IP是default gateway。ARP request以broadcast詢問某IPv4對應的link address，owner以ARP reply回覆，結果進入有期限的cache。真正Ethernet destination MAC永遠是當前link上的next hop，不是遠端Internet server的MAC。",
          "每經router，incoming frame被移除；router依destination IP做forwarding，再解析新next hop的MAC並建立outgoing frame。因此端到端IP destination通常不變，但source/destination MAC逐hop改變。NAT或tunnel會另外改寫/封裝network-layer欄位，那是不同機制。",
          "IPv6 Neighbor Discovery使用ICMPv6 Neighbor Solicitation/Advertisement與multicast，並整合router discovery、prefix discovery、neighbor reachability及redirect等功能。ND不只是把ARP換成IPv6 address；Router Advertisement還可提供on-link prefix與autoconfiguration相關資訊。ARP/ND cache miss會增加首包延遲，cache entry也不是永久真理。"
        ],
        figure: { type: "flow", title: "遠端目的地的下一跳解析", items: [{ label: "Host 10.0.1.10/24", detail: "dest 10.0.2.20" }, { label: "Prefix compare", detail: "off-link" }, { label: "ARP for gateway", detail: "10.0.1.1 → MAC R1" }, { label: "Ethernet frame", detail: "dst MAC R1" }, { label: "IP datagram", detail: "dst IP 10.0.2.20" }], caption: "host解析gateway的MAC；它不會在本地LAN詢問遠端host的MAC。" },
        sourceRefs: ["S7", "S8", "S1"]
      },
      {
        title: "9. Router 以 longest-prefix match 把 destination 映射到 next hop",
        paragraphs: [
          "forwarding plane對每個packet執行：驗證header、更新TTL/Hop Limit、以destination address查Forwarding Information Base、選output interface/next hop、處理MTU與queue，最後建立新link frame。routing plane則透過static configuration或routing protocols計算可達性，再把結果安裝進FIB。",
          "多個prefix都可能match同一destination，longest-prefix match選p最大的entry，因為它最specific。例如10.1.2.200同時match0.0.0.0/0、10.0.0.0/8、10.1.0.0/16與10.1.2.0/24，應選/24。default route /0只在沒有更specific route時接住其餘address。",
          "software可用prefix trie，high-speed routers常使用最佳化tree、hash組合或TCAM；實作不同不改變LPM語意。next hop可能是直接connected destination、另一router或discard action。routing table顯示的protocol/metric不一定等同hardware FIB實際entry，除錯時要辨認觀察的是RIB、FIB或neighbor table。"
        ],
        figure: { type: "hierarchy", title: "10.1.2.200 的 longest-prefix selection", items: [{ label: "0.0.0.0/0", detail: "match → default R0" }, { label: "10.0.0.0/8", detail: "match → R1" }, { label: "10.1.0.0/16", detail: "match → R2" }, { label: "10.1.2.0/24", detail: "match → R3" }, { label: "Selected", detail: "/24 is longest → R3" }], caption: "metric只在候選route的prefix等條件下比較；較短prefix不會因metric小而壓過較specific route。" },
        sourceRefs: ["S9", "S12"]
      },
      {
        title: "10. Link-state、distance-vector 與 path-vector 解決不同控制範圍",
        paragraphs: [
          "link-state protocol讓router散布local links與cost，區域內router建立相近topology database，再以Dijkstra從自己為root計算shortest-path tree。初始化D(source)=0，其餘∞；每次固定目前最小tentative distance的node，再relax其edges：D(v)=min(D(v),D(u)+c(u,v))。OSPF是典型link-state IGP。",
          "distance-vector不需完整topology；node x依鄰居v通告的distance更新Dx(y)=min_v{c(x,v)+Dv(y)}，本質是distributed Bellman–Ford。RIP以hop count為metric。資訊局部、實作簡單，但failure後可能形成loop與count-to-infinity，需split horizon、poisoning、hold-down等機制改善收斂。",
          "Internet由多個Autonomous Systems組成，跨AS不只追求numerically shortest path，還必須表達policy。BGP通告prefix與AS_PATH等attributes，屬path-vector；AS_PATH也協助loop detection。OSPF cost、RIP hops與BGP policy不可放進同一張數字表直接比較，因它們的scope與決策目標不同。"
        ],
        figure: { type: "matrix", title: "三類 routing control model", columns: ["模型", "交換資訊", "典型演算法/協定", "主要scope", "核心風險"], rows: [["Link-state", "links + costs", "Dijkstra / OSPF", "one AS/area", "flooding/database一致性"], ["Distance-vector", "distance via neighbors", "Bellman–Ford / RIP", "small domain", "loop/count-to-infinity"], ["Path-vector", "prefix + path attributes", "BGP", "between ASes", "policy與收斂"]], caption: "forwarding依FIB逐packet執行；這三類機制是在控制平面產生route。" },
        sourceRefs: ["S13", "S14", "S3"]
      },
      {
        title: "11. UDP 保留 message 邊界；TCP 建立有序可靠的 byte stream",
        paragraphs: [
          "UDP header只有source port、destination port、length與checksum，提供process multiplexing及datagram boundary，但不保證delivery、order、duplicate suppression或congestion response。application若需要這些語意必須自行建立或使用另一transport。port number是transport demultiplex key，不是process ID，也不代表流量可信。",
          "TCP connection由local/remote IP、local/remote port及protocol共同辨識。TCP把application bytes編號；segment Sequence Number通常是本segment第一個data byte的序號，Acknowledgment Number是receiver下一個期望byte。ACK是cumulative，表示此前連續bytes已收到；segment boundary不會保留給application，send兩次不保證receive兩次。",
          "three-way handshake以SYN交換initial sequence numbers並確認雙向可達，之後state machine處理ESTABLISHED與close。checksum涵蓋pseudo-header、TCP header與data；retransmission、sequence space、ACK與timer共同從不可靠IP建立可靠stream。可靠不等於低延遲，重傳與head-of-line blocking仍會延後後續bytes。"
        ],
        figure: { type: "flow", title: "TCP cumulative acknowledgment 的 byte-space", items: [{ label: "SYN seq=1000", detail: "SYN consumes one" }, { label: "Data seq=1001", detail: "500 bytes" }, { label: "Receiver", detail: "bytes 1001–1500" }, { label: "ACK=1501", detail: "next expected" }, { label: "Duplicate segment", detail: "discard data, repeat ACK" }], caption: "ACK值不是已收到最後byte，而是下一個期望byte；SYN與FIN各占一個sequence number。" },
        sourceRefs: ["S15", "S16", "S25"]
      },
      {
        title: "12. TCP 的 timer、flow control 與 congestion control 限制不同",
        paragraphs: [
          "RTO必須高於典型RTT又能追蹤變化。RFC 6298以SRTT與RTTVAR平滑samples：首次R時SRTT=R、RTTVAR=R/2；後續先以RTTVAR=(1−β)RTTVAR+β|SRTT−R'|，再以SRTT=(1−α)SRTT+αR'，α=1/8、β=1/4；RTO=SRTT+max(G,4RTTVAR)，且計算後RTO小於1秒可round up到1秒。timeout後採exponential backoff。",
          "receiver advertised window rwnd是flow control，防止sender超過receiver buffer；congestion window cwnd由sender依network feedback維護，保護共享path。實際可在途資料受min(rwnd,cwnd)及已發未ACK bytes限制。slow start、congestion avoidance、loss/ECN response調整cwnd；CUBIC是現代廣泛部署且已標準化的演算法，但不是TCP唯一合法控制器。",
          "BDP=path bottleneck bandwidth×RTT，近似填滿pipe所需in-flight bits。若window W小於BDP且application有足夠資料，window-limited throughput上限約W/RTT。高BDP path需要TCP window scale讓rwnd超過原16-bit欄位範圍；但盲目增大buffer/window可能提高queueing與tail latency，不能把最大in-flight等同最佳值。"
        ],
        figure: { type: "hierarchy", title: "TCP sender 的三重發送上限", items: [{ label: "Application data", detail: "是否有bytes可送" }, { label: "Receiver window rwnd", detail: "receiver buffer capacity" }, { label: "Congestion window cwnd", detail: "path capacity estimate" }, { label: "Flight size", detail: "sent but not acknowledged" }, { label: "Send allowance", detail: "min(rwnd,cwnd) − flight" }], caption: "rwnd保護receiver，cwnd保護network；任一較小都可能限制throughput。" },
        sourceRefs: ["S17", "S18", "S19", "S20"]
      },
      {
        title: "13. DNS、TLS、HTTP 與 QUIC 把名稱、安全與應用語意疊在傳輸之上",
        paragraphs: [
          "DNS把domain name查成resource records。stub resolver通常問recursive resolver；cache miss時resolver可依root、TLD、authoritative hierarchy取得答案並依TTL cache。DNS message可經UDP或TCP等transport；DNS TTL是cache lifetime，和IP TTL/Hop Limit完全不同。name解析成功也不保證後續route、port或application可用。",
          "TLS 1.3在reliable transport上提供peer authentication、confidentiality與integrity；certificate驗證把public key綁到name，並依trust anchors與validity等規則建立信任。HTTP Semantics定義method、status、fields與representation，不等於固定wire framing；HTTP/1.1、HTTP/2與HTTP/3可承載相近語意卻使用不同mapping。",
          "QUIC在UDP之上整合secure handshake、reliable streams、loss detection與congestion control，HTTP/3使用QUIC。streams有各自ordered delivery，可減少TCP connection層head-of-line blocking；但同一路徑的packet loss與congestion仍存在。分析網頁載入時應列出DNS cache、connection reuse、handshake、request/response、content transfer各自是否發生，而不是固定宣稱需要某個RTT數。"
        ],
        figure: { type: "flow", title: "一次新 HTTPS 名稱連線的條件式路徑", items: [{ label: "DNS", detail: "cache hit or hierarchy" }, { label: "Route + neighbor", detail: "FIB and ARP/ND" }, { label: "Transport", detail: "TCP or QUIC" }, { label: "Security", detail: "TLS authentication + keys" }, { label: "HTTP", detail: "request + representation" }], caption: "cache與connection reuse會略過部分階段；流程圖是依賴關係，不是固定封包數。" },
        sourceRefs: ["S21", "S22", "S23", "S24"]
      }
    ],
    workedExamples: [
      { title: "例題一：封裝後的payload效率", prompt: "1000-byte application data由20-byte TCP、20-byte IPv4、14-byte Ethernet header與4-byte FCS承載，忽略padding、preamble與gap。求總bytes與效率。", steps: ["application payload=1000 B。", "transport後為1000+20=1020 B。", "IPv4 datagram為1020+20=1040 B。", "MAC frame由14-byte header、1040-byte payload、4-byte FCS組成。", "總長=14+1040+4=1058 B。", "application efficiency=1000/1058≈94.52%。"], result: "此boundary下總長1058 B，application payload效率約94.52%。" },
      { title: "例題二：三條link的store-and-forward延遲", prompt: "1500-byte packet經3條100 Mbit/s links，總傳播距離1000 km、訊號速率2×10^8 m/s；2台中間switch各processing 20 µs，忽略queue。求第一包end-to-end delay。", steps: ["L=1500×8=12000 bits。", "每條transmission delay=L/R=12000/100,000,000=120 µs。", "3條links共3×120=360 µs。", "propagation=1,000,000/(2×10^8)=0.005 s=5 ms。", "processing=2×20=40 µs。", "total=360+5000+40=5400 µs=5.4 ms。"], result: "第一包store-and-forward end-to-end delay為5.4 ms。" },
      { title: "例題三：由SNR dB求Shannon capacity", prompt: "channel bandwidth為20 MHz，SNR=20 dB。求Shannon capacity。", steps: ["先把dB轉linear ratio。", "S/N=10^(20/10)=100。", "C=B log2(1+S/N)。", "C=20×10^6×log2(101)。", "log2(101)≈6.65821。", "C≈133.164×10^6 bit/s。"], result: "理論capacity約133.16 Mbit/s；實作可靠速率必須低於此上限。" },
      { title: "例題四：1500-byte Ethernet payload的on-wire效率", prompt: "Ethernet payload 1500 B，MAC header 14 B、FCS 4 B、preamble/SFD 8 B、interpacket gap 12 byte-times。求每frame slot與payload效率。", steps: ["MAC frame=14+1500+4=1518 B。", "preamble/SFD加8 byte-times。", "gap再加12 byte-times。", "slot occupancy=1518+8+12=1538 byte-times。", "payload efficiency=1500/1538。", "結果≈0.97529=97.53%。"], result: "每個最大payload frame占1538 byte-times，效率約97.53%。" },
      { title: "例題五：手算learning switch table", prompt: "三port switch初始table空。依序收到P1: A→B、P2: B→A、P3: C→A。寫出每步學習與輸出。", steps: ["A→B由P1進入：學A→P1。", "B未知，因此flood到P2、P3。", "B→A由P2進入：學B→P2。", "A已知在P1，因此只forward P1。", "C→A由P3進入：學C→P3。", "A仍在P1，因此只forward P1；最終A/P1、B/P2、C/P3。"], result: "只有第一個unknown destination需要flood；後兩個frame都能unicast forward。" },
      { title: "例題六：完整解出IPv4 /26 subnet", prompt: "求192.0.2.130/26的mask、network、broadcast、一般host範圍與數量。", steps: ["/26 mask前26 bits為1，即255.255.255.192。", "host bits=6，所以block size=2^6=64。", "最後octet blocks為0、64、128、192。", "130落在128–191，因此network=192.0.2.128。", "broadcast=192.0.2.191。", "host為.129–.190，共64−2=62個。"], result: "192.0.2.130/26屬192.0.2.128/26，一般可用host共62個。" },
      { title: "例題七：IPv4 fragmentation與offset", prompt: "IPv4 payload 4000 B、header 20 B，next-hop MTU 1500 B且DF=0。求fragments。", steps: ["每片含20-byte header，非末片data上限=1500−20=1480 B。", "1480可被8整除，所以不需再向下對齊。", "前兩片data各1480 B，剩餘4000−2960=1040 B。", "total lengths為1500、1500、1060 B。", "offset units為8 B，所以offsets=0、1480/8=185、2960/8=370。", "MF依序為1、1、0。"], result: "三片為(data, offset, MF)=(1480,0,1)、(1480,185,1)、(1040,370,0)。" },
      { title: "例題八：判斷ARP的target", prompt: "host 10.0.1.10/24要送至10.0.2.20，default gateway為10.0.1.1。它應ARP誰？", steps: ["local network=10.0.1.0/24。", "destination 10.0.2.20不match local /24。", "因此destination為off-link。", "IP destination仍填10.0.2.20。", "next-hop IP改選default gateway 10.0.1.1。", "ARP request詢問10.0.1.1的MAC，Ethernet destination使用gateway MAC。"], result: "ARP解析10.0.1.1，不是遠端10.0.2.20。" },
      { title: "例題九：longest-prefix forwarding", prompt: "routes為default→R0、10/8→R1、10.1/16→R2、10.1.2/24→R3。destination 10.1.2.200走哪裡？", steps: ["/0 match所有address。", "前8 bits為10，因此10/8 match。", "前16 bits為10.1，因此10.1/16 match。", "前24 bits為10.1.2，因此10.1.2/24 match。", "四個matches中/24 prefix最長。", "選R3；不以R0或較短prefix metric取代。"], result: "destination經R3轉送。" },
      { title: "例題十：Dijkstra shortest path", prompt: "undirected costs A–B=2、A–C=5、B–C=1、B–D=4、C–D=1。求A到D最短路徑。", steps: ["初始化D(A)=0，D(B)=2，D(C)=5，D(D)=∞。", "固定最小B=2。", "經B更新C=min(5,2+1)=3，D=min(∞,2+4)=6。", "固定C=3。", "經C更新D=min(6,3+1)=4。", "固定D=4，predecessors為D←C←B←A，所以path A-B-C-D。"], result: "A到D最短cost=4，路徑A→B→C→D。" },
      { title: "例題十一：TCP sequence與cumulative ACK", prompt: "sender以SYN seq=1000建立連線後，傳500 bytes。無遺失時data seq與ACK是多少？", steps: ["SYN本身消耗一個sequence number。", "第一個data byte seq=1001。", "500 bytes涵蓋sequence 1001到1500。", "receiver下一個期望byte為1501。", "因此回ACK=1501。", "若同一segment重複到達，data不重複交付，ACK仍為1501。"], result: "data segment seq=1001、length=500；cumulative ACK=1501。" },
      { title: "例題十二：依RFC 6298更新SRTT、RTTVAR與RTO", prompt: "clock granularity忽略。第一個RTT sample為120 ms，第二個為100 ms；α=1/8、β=1/4、K=4。求兩次估計與1-second lower bound後RTO。", steps: ["首次SRTT=120 ms。", "首次RTTVAR=120/2=60 ms。", "raw RTO=120+4×60=360 ms，依規則round up為1 s。", "第二次先更新RTTVAR=0.75×60+0.25×|120−100|=50 ms。", "再更新SRTT=0.875×120+0.125×100=117.5 ms。", "raw RTO=117.5+4×50=317.5 ms，仍round up為1 s。"], result: "第二個sample後SRTT=117.5 ms、RTTVAR=50 ms、規範下RTO=1 s。" },
      { title: "例題十三：BDP與window-limited throughput", prompt: "path bottleneck為1 Gbit/s、RTT=40 ms。求BDP；若window只有64 KiB，估計throughput上限。", steps: ["BDP=1×10^9 bit/s×0.040 s。", "=40,000,000 bits。", "除8得5,000,000 bytes=5 MB（十進位）。", "64 KiB=65,536 bytes，遠小於BDP。", "window-limited rate≈65,536/0.040=1,638,400 B/s。", "乘8約13.1072 Mbit/s，只占1 Gbit/s的約1.31%。"], result: "填滿path約需5 MB in flight；64 KiB window最多約13.11 Mbit/s。" }
    ],
    misconceptions: [
      ["OSI七層與TCP/IP四層必須逐層一一對應。", "OSI是reference model；Internet protocols的功能邊界不一定形成七個實作層。"],
      ["router轉送時會保留原Ethernet header。", "router終止incoming link frame，為next hop建立新的link header/FCS。"],
      ["bandwidth越高，propagation delay就越小。", "L/R受bit rate影響；distance/speed決定propagation。"],
      ["1 Gbit/s就是application可用125 MB/s。", "frame/coding/retransmission與端點瓶頸使goodput較低。"],
      ["CRC能修復所有bit errors。", "Ethernet FCS主要偵測錯誤；壞frame通常丟棄。"],
      ["switch依source MAC決定輸出port。", "source用於學習，destination才用於forward/flood/filter。"],
      ["VLAN tag就是一種IP subnet mask。", "VLAN分link-layer broadcast domain；IP prefix是network-layer routing boundary。"],
      ["/24就是class C，因此可忽略CIDR。", "現代routing依明示prefix length，不依舊classful default。"],
      ["每個IPv4 subnet永遠只能用2^h−2個host。", "/31 point-to-point與/32 host route等情況不能套一般規則。"],
      ["IPv6沒有fragmentation。", "IPv6 source可使用Fragment header；intermediate router不fragment。"],
      ["ARP會查到遠端server的MAC。", "off-link destination只解析local default gateway的MAC。"],
      ["IP TTL精確表示packet還能存活幾秒。", "實務上每hop至少減1，主要是loop bound。"],
      ["route metric較小一定勝過prefix較長的route。", "先做longest-prefix match，再依同prefix候選規則選route。"],
      ["routing protocol對每個packet執行Dijkstra。", "控制平面計算route並安裝FIB；資料平面只做快速lookup。"],
      ["UDP沒有連線，所以沒有port。", "UDP仍以source/destination ports demultiplex datagrams。"],
      ["TCP ACK=1501表示byte 1501已收到。", "ACK number表示下一個期望byte，先前連續bytes已收到。"],
      ["flow control與congestion control都是receiver window。", "rwnd保護receiver；cwnd由sender維護以保護network path。"],
      ["DNS TTL與IP TTL是同一欄位。", "DNS TTL控制record cache；IP TTL/Hop Limit限制forwarding hops。"]
    ],
    exercises: [
      { level: "基礎", question: "Application、transport、internet與link層各自最主要的識別欄位是什麼？", solution: ["application依協定使用name/URL等語意；transport以protocol與ports辨認端點程序。", "internet層依IP address/prefix轉送；link層以MAC與link-local type交付一跳。"] },
      { level: "基礎", question: "Transmission delay與propagation delay各由哪些變數決定？", solution: ["transmission=L/R，取決於packet bits與link bit rate。", "propagation=d/s，取決於距離與訊號在媒介中的速度。"] },
      { level: "基礎", question: "Learning switch收到unknown unicast時為何仍先學source？", solution: ["source address證明該sender可由ingress port到達，因此可更新table。", "destination尚未知才flood；學習與目的處理是兩個獨立步驟。"] },
      { level: "基礎", question: "IPv4 TTL與IPv6 Hop Limit的共同目的，以及header checksum的差異為何？", solution: ["兩者逐hop遞減，避免packet在routing loop中永久循環。", "IPv4有header checksum並因TTL變化更新；IPv6 base header沒有header checksum。"] },
      { level: "基礎", question: "RIB、FIB與neighbor table分別保存哪一類資訊？", solution: ["RIB保存routing protocols/static routes的控制平面候選。", "FIB保存可快速forward的prefix action；neighbor table把on-link next-hop IP映射到link address。"] },
      { level: "基礎", question: "TCP receiver window與congestion window分別保護什麼？", solution: ["rwnd避免sender淹沒receiver buffer。", "cwnd限制注入network的in-flight data，以回應path congestion。"] },
      { level: "計算", question: "900-byte application data加20-byte TCP、20-byte IPv4、14-byte Ethernet header與4-byte FCS，總長與application效率是多少？", solution: ["總長=900+20+20+14+4=958 B。", "效率=900/958≈93.95%。"] },
      { level: "計算", question: "2000-byte packet放入10 Mbit/s link需要多少transmission delay？", solution: ["L=2000×8=16000 bits。", "L/R=16000/10,000,000=0.0016 s=1.6 ms。"] },
      { level: "計算", question: "訊號跨越600 km、propagation speed為2×10^8 m/s，需要多久？", solution: ["600 km=600,000 m。", "d/s=600,000/(2×10^8)=0.003 s=3 ms。"] },
      { level: "計算", question: "10 MHz channel的SNR為15 dB，Shannon capacity約多少？", solution: ["linear S/N=10^(15/10)≈31.6228。", "C=10^7 log2(1+31.6228)≈50.278 Mbit/s。"] },
      { level: "計算", question: "完整解出198.51.100.77/27的mask、network、broadcast與一般host範圍。", solution: ["mask=255.255.255.224，block size=32；77落在64–95。", "network=.64、broadcast=.95、host=.65–.94，共30個。"] },
      { level: "計算", question: "IPv4 payload 3000 B、header 20 B、MTU 1280 B時，求fragment data sizes與offsets。", solution: ["非末片上限floor((1280−20)/8)×8=1256 B。", "data為1256、1256、488 B；offset為0、157、314，MF為1、1、0。"] },
      { level: "計算", question: "routes含172.16/12→A、172.16.8/21→B、172.16.8.128/25→C，目的172.16.8.200選誰？", solution: ["destination同時match /12、/21與/25。", "longest prefix為/25，因此選C。"] },
      { level: "計算", question: "graph A–B=4、A–C=1、C–B=2、B–D=1、C–D=7，A到D shortest path為何？", solution: ["A→C cost1，再由C→B累積3。", "B→D後總cost4，優於A-C-D的8與A-B-D的5，所以path A-C-B-D。"] },
      { level: "計算", question: "TCP segment seq=5000、data length=1200且連續收到，receiver應回多少ACK？", solution: ["data bytes序號為5000到6199。", "下一個期望byte為6200，所以ACK=6200。"] },
      { level: "計算", question: "200 Mbit/s path、RTT=50 ms的BDP是多少bits與bytes？", solution: ["BDP=200×10^6×0.050=10,000,000 bits。", "除8得1,250,000 bytes=1.25 MB（十進位）。"] },
      { level: "進階", question: "一個packet capture只看到目的MAC為router、目的IP為遠端server，這是否矛盾？說明兩個address的scope。", solution: ["不矛盾；MAC destination只標示目前link的next hop。", "IP destination標示端到端network-layer destination，通常跨router維持不變。"] },
      { level: "整合", question: "首次開啟HTTPS服務很慢，但後續request快。列出至少四個首次才可能發生的網路狀態，並指出應如何分層量測。", solution: ["可能包含DNS cache miss、ARP/ND miss、transport handshake、TLS certificate/key handshake、route/connection establishment。", "分別量DNS、neighbor、connect、TLS與time-to-first-byte；再檢查connection reuse與content transfer，不能只用單一ping推論。"] }
    ],
    glossary: [
      ["Protocol Data Unit", "某層依其協定格式處理的完整資料單位。"], ["Encapsulation", "把上層PDU放入下層payload並加入header/trailer。"], ["Demultiplexing", "依type、protocol、port等欄位把資料交給正確上層。"], ["Packet switching", "以離散packets共享links並逐packet轉送的架構。"], ["Transmission delay", "把L bits送上R bit/s link所需L/R。"], ["Propagation delay", "訊號走距離d、速度s所需d/s。"], ["Queueing delay", "packet等待output resource可用的時間。"], ["Store-and-forward", "node收到完整packet後才開始下一link傳輸。"], ["Bandwidth", "通道可承載的頻率範圍，單位Hz。"], ["Goodput", "單位時間真正交付給application的有用資料量。"], ["MAC address", "鏈路層介面識別，用於一個bridged domain內轉送。"], ["EtherType", "Ethernet欄位，用於識別payload protocol。"], ["FCS", "frame check sequence；Ethernet以CRC remainder偵測錯誤。"], ["MTU", "一條link可承載的最大network-layer packet size邊界。"], ["Learning bridge", "依incoming source MAC自動建立forwarding database的bridge。"], ["Flooding", "把frame複製到同domain內除ingress外的多個ports。"], ["VLAN", "在bridged network中建立邏輯broadcast domain的機制。"], ["CIDR", "以prefix length進行classless addressing與route aggregation。"], ["Subnet mask", "network prefix bits為1、host bits為0的32-bit mask。"], ["Prefix aggregation", "以共同high-order bits合併多個routes。"], ["Datagram", "由IP獨立處理的best-effort network-layer packet。"], ["TTL", "IPv4逐hop遞減的loop-limiting欄位。"], ["Hop Limit", "IPv6對應的逐hop loop-limiting欄位。"], ["Fragment Offset", "IPv4/IPv6 fragment在原payload中的位置，以8-byte units表示。"], ["ARP", "IPv4在link上把next-hop protocol address解析成link address的協定。"], ["Neighbor Discovery", "IPv6以ICMPv6進行neighbor、router、prefix與reachability discovery。"], ["Default gateway", "沒有更直接on-link route時使用的local router next hop。"], ["Longest-prefix match", "從所有matching routes選prefix length最大者。"], ["RIB", "Routing Information Base；控制平面route候選集合。"], ["FIB", "Forwarding Information Base；資料平面快速轉送表。"], ["Link-state", "散布link/cost並以完整topology計算route的模型。"], ["Distance-vector", "與鄰居交換distance並以Bellman–Ford更新的模型。"], ["Autonomous System", "在共同routing policy下管理的一組IP networks與routers。"], ["BGP", "Internet跨AS交換prefix與path attributes的path-vector protocol。"], ["Port", "transport層用來demultiplex endpoint service的16-bit欄位。"], ["Sequence Number", "TCP byte stream中segment第一個data byte的序號。"], ["Cumulative ACK", "確認某sequence之前所有連續bytes已收到的acknowledgment。"], ["RTO", "等待ACK後觸發retransmission的計時器值。"], ["Receiver window", "TCP receiver公告的flow-control buffer空間。"], ["Congestion window", "sender依path feedback維護的in-flight上限。"], ["Bandwidth-delay product", "bandwidth×RTT，近似填滿path的in-flight bits。"], ["DNS", "把domain names映射成resource records的分散式階層系統。"], ["TLS", "提供authentication、confidentiality與integrity的secure channel protocol。"], ["QUIC", "在UDP上整合secure handshake、reliable streams與congestion control的transport。"]
    ],
    sources: [
      { key: "S1", title: "RFC 1122: Requirements for Internet Hosts — Communication Layers", url: "https://www.rfc-editor.org/info/rfc1122/", accessed: "2026-08-26", use: "Internet host分層、link/IP/transport service、datagram forwarding與端點架構。" },
      { key: "S2", title: "Stanford CS144: Introduction to Computer Networking", url: "https://cs144.github.io/", accessed: "2026-08-26", use: "datagram、encapsulation、reliability、packet switching、routing與end-to-end教學模型。" },
      { key: "S3", title: "MIT 6.02 Digital Communication Systems Resources", url: "https://www.ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/download/", accessed: "2026-08-26", use: "channel capacity、packet switching、MAC、routing與reliable transport公開課程資料。" },
      { key: "S4", title: "IEEE Std 802.3-2022: Ethernet", url: "https://standards.ieee.org/ieee/802.3/10422/", accessed: "2026-08-26", use: "Ethernet MAC、PHY、speeds、frame與full/half-duplex標準範圍。" },
      { key: "S5", title: "RFC 894: IP Datagrams over Ethernet Networks", url: "https://www.rfc-editor.org/info/rfc894/", accessed: "2026-08-26", use: "EtherType 0x0800、Ethernet payload、padding、1500-byte MTU與IPv4 encapsulation。" },
      { key: "S6", title: "IEEE 802.1Q: Bridges and Bridged Networks", url: "https://1.ieee802.org/maintenance/", accessed: "2026-08-26", use: "MAC bridges、VLAN bridges、spanning tree與bridged-network architecture。" },
      { key: "S7", title: "RFC 826: Ethernet Address Resolution Protocol", url: "https://www.rfc-editor.org/info/rfc826/", accessed: "2026-08-26", use: "IPv4 protocol address到48-bit Ethernet address的ARP request/reply mapping。" },
      { key: "S8", title: "RFC 4861: Neighbor Discovery for IPv6", url: "https://www.rfc-editor.org/info/rfc4861/", accessed: "2026-08-26", use: "Neighbor/Router Discovery、prefix、reachability與link-layer address resolution。" },
      { key: "S9", title: "RFC 4632: Classless Inter-domain Routing", url: "https://www.rfc-editor.org/info/rfc4632/", accessed: "2026-08-26", use: "CIDR prefixes、address assignment、route aggregation與longest-prefix背景。" },
      { key: "S10", title: "RFC 791: Internet Protocol", url: "https://www.rfc-editor.org/info/rfc791/", accessed: "2026-08-26", use: "IPv4 header、TTL、checksum、fragment flags、8-byte offset與datagram service。" },
      { key: "S11", title: "RFC 8200: Internet Protocol Version 6", url: "https://www.rfc-editor.org/info/rfc8200/", accessed: "2026-08-26", use: "IPv6 fixed header、extension headers、Hop Limit、source fragmentation與1280-byte minimum MTU。" },
      { key: "S12", title: "RFC 1812: Requirements for IPv4 Routers", url: "https://www.rfc-editor.org/info/rfc1812/", accessed: "2026-08-26", use: "router forwarding、longest-prefix matching、TTL、MTU與next-hop behavior。" },
      { key: "S13", title: "RFC 2328: OSPF Version 2", url: "https://www.rfc-editor.org/info/rfc2328/", accessed: "2026-08-26", use: "link-state database、Dijkstra shortest-path tree、areas與OSPF route計算。" },
      { key: "S14", title: "RFC 4271: Border Gateway Protocol 4", url: "https://www.rfc-editor.org/info/rfc4271/", accessed: "2026-08-26", use: "BGP UPDATE、NLRI、AS_PATH、path attributes與inter-AS policy model。" },
      { key: "S15", title: "RFC 9293: Transmission Control Protocol", url: "https://www.rfc-editor.org/info/rfc9293/", accessed: "2026-08-26", use: "TCP byte stream、sequence/ACK、state machine、checksum、window與retransmission requirements。" },
      { key: "S16", title: "RFC 768: User Datagram Protocol", url: "https://www.rfc-editor.org/info/rfc768/", accessed: "2026-08-26", use: "UDP ports、length、checksum與transaction-oriented datagram service。" },
      { key: "S17", title: "RFC 6298: Computing TCP's Retransmission Timer", url: "https://www.rfc-editor.org/info/rfc6298/", accessed: "2026-08-26", use: "SRTT、RTTVAR、RTO initialization/update、1-second bound與backoff。" },
      { key: "S18", title: "RFC 7323: TCP Extensions for High Performance", url: "https://www.rfc-editor.org/info/rfc7323/", accessed: "2026-08-26", use: "window scale、timestamps、PAWS與high-BDP TCP behavior。" },
      { key: "S19", title: "RFC 5681: TCP Congestion Control", url: "https://www.rfc-editor.org/info/rfc5681/", accessed: "2026-08-26", use: "slow start、congestion avoidance、fast retransmit與fast recovery baseline。" },
      { key: "S20", title: "RFC 9438: CUBIC for Fast and Long-Distance Networks", url: "https://www.rfc-editor.org/info/rfc9438/", accessed: "2026-08-26", use: "current standardized CUBIC window growth、multiplicative decrease與high-BDP motivation。" },
      { key: "S21", title: "RFC 9000: QUIC", url: "https://www.rfc-editor.org/info/rfc9000/", accessed: "2026-08-26", use: "UDP-based secure transport、streams、packetization、flow/congestion control與connection migration。" },
      { key: "S22", title: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/info/rfc9110/", accessed: "2026-08-26", use: "HTTP methods、status、fields、representations與version-independent semantics。" },
      { key: "S23", title: "RFC 8446: TLS 1.3", url: "https://www.rfc-editor.org/info/rfc8446/", accessed: "2026-08-26", use: "authenticated key exchange、handshake、records、confidentiality與integrity。" },
      { key: "S24", title: "RFC 1034: Domain Names — Concepts and Facilities", url: "https://www.rfc-editor.org/info/rfc1034/", accessed: "2026-08-26", use: "DNS hierarchy、resolver、name server、resource records、caching與TTL。" },
      { key: "S25", title: "IANA Service Name and Port Number Registry", url: "https://www.iana.org/assignments/service-names-port-numbers", accessed: "2026-08-26", use: "current transport service names、TCP/UDP ports與system/user/dynamic ranges。" },
      { key: "S26", title: "RFC 8900: IP Fragmentation Considered Fragile", url: "https://www.rfc-editor.org/info/rfc8900/", accessed: "2026-08-26", use: "IPv4/IPv6 fragmentation operational failure modes、middleboxes與Path MTU guidance。" }
    ]
  },
  {
    chapter: 13,
    title: "儲存系統與介面：從 I/O 命令到雲端物件",
    english: "Storage Systems and Interfaces: From I/O Commands to Cloud Objects",
    revised: "2026-08-27",
    readingTime: "約 320–380 分鐘",
    intro: "儲存裝置不只是保存位元的媒體，而是一組跨越應用程式、檔案系統、作業系統佇列、主機介面、控制器韌體與實體媒體的契約。一次 read 或 write 的正確性，同時取決於名稱如何映射到 block、命令何時完成、資料是否真正成為 non-volatile、佇列是否允許重排，以及故障發生在哪一層。本章由端到端 I/O 路徑出發，建立 block、file、object 三種存取模型，再逐步解析 SCSI、SATA、SAS、PCI Express、NVMe、USB mass storage、SAN、iSCSI、NVMe over Fabrics 與雲端物件儲存。效能部分以 queue depth、Little's Law、IOPS、throughput 與 tail latency 推導；可靠性部分則區分 completion、ordering、durability、integrity、availability 與 backup。所有傳輸率、LBA、ring queue、flush/FUA 與分段上傳例題均明示邊界，可獨立重算。",
    outcomes: [
      "能區分 block、file 與 object storage 的命名、操作單位、共享方式與一致性邊界。",
      "能沿 application、filesystem、block layer、driver、host controller、device controller 與 media 追蹤完整 I/O。",
      "能由 byte offset、logical block size 與 physical block size 計算 LBA、block count、alignment 與 read-modify-write。",
      "能說明 SCSI initiator、target、logical unit、CDB、task、status 與 sense data 的關係。",
      "能比較 SATA/ATA、SAS 與 USB Attached SCSI 的命令、傳輸、拓撲與佇列能力。",
      "能由 PCIe generation、lane count 與 encoding overhead 計算單向理論資料率上限。",
      "能解讀 NVMe submission/completion queue、doorbell、command identifier、namespace 與 queue pair。",
      "能比較 SAN、NAS、iSCSI、Fibre Channel 與 NVMe over Fabrics 的 protocol stack 與故障邊界。",
      "能以 IOPS=Q/L 與 throughput=IOPS×I/O size 分析 queue depth、latency、bandwidth 與飽和點。",
      "能區分 command completion、cache flush、FUA、write ordering、power-loss protection 與真正 durable state。",
      "能說明 error detection、end-to-end protection、redundancy、snapshot、versioning 與 backup 各自處理的風險。",
      "能比較 local block、network block、network file 與 cloud object storage，依 workload 與 failure domain選擇架構。",
      "能辨認規格標示的 line rate、協定 payload ceiling 與實際 application goodput，避免把介面速度當成裝置速度。"
    ],
    sections: [
      {
        title: "1. 儲存介面先定義語意，再決定資料如何搬運",
        paragraphs: [
          "block storage把裝置呈現為固定大小、以logical block address（LBA）編號的區塊陣列。主機發出read、write、flush等命令，裝置通常不理解檔名或目錄；partition、filesystem、allocation與permissions由主機軟體建立。因此同一block device若被兩個主機未經協調地同時掛載，一般filesystem metadata可能互相覆寫。",
          "file storage把path或file handle、directory、byte range、locking與access control置於共享服務中。client不直接決定某個檔案位於哪些實體blocks，而是透過NFS、SMB等協定請server處理名稱與metadata。object storage則以bucket/container與object key識別整個object，metadata隨object保存；常見API以PUT/GET/HEAD/DELETE操作，通常不提供像local filesystem一樣的任意in-place byte overwrite。",
          "三種模型不是速度分級，而是不同契約。同一SSD可在server內提供block device，再由filesystem輸出NAS file service，或由object service切分、複寫並以HTTP API提供objects。分析架構時要先問：名稱由誰管理、最小操作單位是什麼、哪些主體可同時存取、atomicity落在哪裡、失敗後誰負責恢復。"
        ],
        figure: { type: "matrix", title: "Block、file 與 object 的服務契約", columns: ["模型", "主要名稱", "典型操作", "共享協調者", "常見使用"], rows: [["Block", "LBA / namespace", "read/write/flush blocks", "host filesystem或cluster layer", "OS volume、database"], ["File", "path / file handle", "open/read/write/rename", "file server", "home directory、共享檔案"], ["Object", "bucket + key", "PUT/GET/HEAD/DELETE", "object service", "media、backup、data lake"]], caption: "媒體可以相同；外部可觀察的名稱、原子性與共享方式才是模型差異。" },
        sourceRefs: ["S1", "S2", "S3"]
      },
      {
        title: "2. 一次 I/O 是跨越軟體佇列、DMA 與裝置韌體的端到端交易",
        paragraphs: [
          "application呼叫read、write或memory-mapped access後，page cache可能直接滿足read，write也可能先只修改記憶體中的dirty pages。真正需要device I/O時，filesystem把file offset映射成blocks，block layer合併、分割或排程requests，driver再把protocol command與scatter-gather記憶體區段放入host-controller queue。",
          "裝置取得命令後，通常以DMA在main memory與controller之間搬資料，不必讓CPU逐byte複製。IOMMU可限制裝置能存取的physical address範圍。controller韌體將logical request映射到media：HDD安排head movement，flash translation layer把LBA映射到NAND pages並執行garbage collection、wear leveling與error correction。",
          "完成路徑反向返回：device更新completion entry或interrupt狀態，driver回收tag與DMA mapping，block layer完成request，filesystem/page cache更新狀態，等待中的thread才被喚醒。同步system call返回只表示該軟體契約已完成；若中間存在volatile write-back cache，它不必然表示資料已通過斷電測試。"
        ],
        figure: { type: "flow", title: "端到端 storage I/O path", items: [{ label: "Application", detail: "read / write / fsync" }, { label: "Filesystem", detail: "name + offset to blocks" }, { label: "Block layer", detail: "merge + queue + tag" }, { label: "Driver / HBA", detail: "command + DMA" }, { label: "Device controller", detail: "mapping + cache + ECC" }, { label: "Media", detail: "magnetic / flash / remote" }, { label: "Completion", detail: "CQ / interrupt / wakeup" }], caption: "cache hit可在前段結束；真正device I/O則跨越全部邊界後再回報完成。" },
        sourceRefs: ["S4", "S5", "S6"]
      },
      {
        title: "3. LBA、logical sector 與 physical block 共同決定對齊成本",
        paragraphs: [
          "block command通常以起始LBA與transfer length描述範圍。若logical block size為B bytes，byte offset x必須先檢查x mod B；對齊時start LBA=x/B，長度n bytes所需block count=n/B。若offset或length不是logical block倍數，上層必須讀取涵蓋範圍、修改其中bytes再寫回，或使用能表達byte range的更高層介面。",
          "logical block是protocol可見單位，physical block是媒體實際更新或保護的較大單位。512e裝置可對外模擬512-byte logical sectors、內部以4096-byte physical sectors工作。若8個logical sectors沒有一起對齊到同一physical boundary，小寫入可能觸發read-modify-write；4Kn裝置則直接呈現4096-byte logical blocks，舊軟體若假設512 bytes會失敗。",
          "NAND flash還有page與erase block層級：page可程式寫入，較大的erase block必須先erase才能重用。SSD controller藉FTL進行out-of-place update，所以host的單次4 KiB write可能造成額外內部搬移；write amplification是media寫入量除以host寫入量。alignment能避免一類額外工作，但不能消除garbage collection與wear leveling。"
        ],
        figure: { type: "bits", title: "4096-byte physical block 上的 512e 映射", totalBits: 32768, items: [{ label: "LBA 8", bits: 4096, detail: "512 B · physical offset 0" }, { label: "LBA 9", bits: 4096, detail: "512 B · physical offset 512" }, { label: "LBA 10", bits: 4096, detail: "512 B · physical offset 1024" }, { label: "LBA 11", bits: 4096, detail: "512 B · physical offset 1536" }, { label: "LBA 12", bits: 4096, detail: "512 B · physical offset 2048" }, { label: "LBA 13", bits: 4096, detail: "512 B · physical offset 2560" }, { label: "LBA 14", bits: 4096, detail: "512 B · physical offset 3072" }, { label: "LBA 15", bits: 4096, detail: "512 B · physical offset 3584" }], caption: "8×4096 bits=32768 bits=4096 bytes；一個4 KiB physical block承載8個512-byte logical sectors。" },
        sourceRefs: ["S7", "S8"]
      },
      {
        title: "4. SCSI 是命令與裝置模型，不等於某一種接頭",
        paragraphs: [
          "SCSI architecture model以application client、initiator port、service delivery subsystem、target port與logical unit描述命令流。initiator建立task並傳送Command Descriptor Block（CDB）；target中的logical unit執行命令，回傳status與可能的sense data。LUN識別logical unit，並不等同filesystem partition。",
          "SCSI Primary Commands定義跨裝置共通的INQUIRY、REPORT LUNS、REQUEST SENSE等操作；SCSI Block Commands再定義READ、WRITE、SYNCHRONIZE CACHE等block-device命令。CDB中的opcode決定格式，LBA與transfer length欄位寬度依READ(10)、READ(16)等版本不同。完成狀態GOOD只說該task依當下契約成功；CHECK CONDITION會搭配sense key、additional sense code等資訊描述錯誤。",
          "SCSI命令可由不同transport承載：SAS在serial attached fabric中傳遞SCSI，iSCSI把SCSI protocol data units放入TCP，USB Attached SCSI在USB transport上傳遞，Fibre Channel也能承載FCP。把SCSI理解為命令語言與task model，才能分開比較命令能力、transport延遲、拓撲與安全。"
        ],
        figure: { type: "flow", title: "SCSI task 的角色與回應", items: [{ label: "Application client", detail: "requests block operation" }, { label: "Initiator", detail: "creates task + CDB" }, { label: "Transport", detail: "SAS / FC / TCP / USB" }, { label: "Target port", detail: "receives task" }, { label: "Logical unit", detail: "executes command" }, { label: "Status + sense", detail: "GOOD or error detail" }], caption: "CDB語意可維持一致，承載它的實體或網路transport則可以不同。" },
        sourceRefs: ["S9", "S10", "S11"]
      },
      {
        title: "5. SATA 將 ATA 命令放上 point-to-point serial link，NCQ 允許裝置重排",
        paragraphs: [
          "Serial ATA以host與device之間的point-to-point link取代parallel ATA排線。ATA command set定義IDENTIFY DEVICE、READ/WRITE DMA EXT、FLUSH CACHE等命令；AHCI則定義memory-mapped host controller、command list、command table與received FIS等軟體介面。connector、PHY、transport、command set與OS driver是不同層。",
          "Native Command Queuing（NCQ）讓host以tag提交多筆尚未完成的commands，裝置可依media狀態調整執行順序，再以tag指出哪一筆完成。對HDD，reordering可減少seek與rotation；對SSD，可提升內部parallelism。queue depth過大仍可能增加等待時間，且ordering-sensitive writes必須使用適當barrier、flush或FUA語意。",
          "SATA 6 Gb/s是serial line rate，不是6 GB/s，也不是應用程式保證值。即使只做8b/10b概略編碼上限，6 Gbit/s成為600 MB/s；frame information structures、commands、flow control與裝置本身還會降低goodput。較慢NAND、controller或小random I/O latency常比link更早成為瓶頸。"
        ],
        figure: { type: "matrix", title: "SATA 路徑中的四個不同規格層", columns: ["層", "例子", "主要責任", "可見單位", "常見混淆"], rows: [["Command", "ATA ACS", "read/write/flush semantics", "LBA + sectors", "不是connector"], ["Host interface", "AHCI", "queues + registers + DMA", "command slots", "不是media速度"], ["Transport/PHY", "SATA 3.x", "FIS + serial signaling", "Gb/s", "不是GB/s"], ["Device", "HDD / SSD", "mapping + cache + media", "latency/IOPS", "不由link保證"]], caption: "同一SATA connector後方可以是不同媒體；command、controller與PHY也各有獨立上限。" },
        sourceRefs: ["S12", "S13", "S14"]
      },
      {
        title: "6. SAS 以 ports、phys 與 expanders 建立可擴充的企業 block fabric",
        paragraphs: [
          "Serial Attached SCSI使用SCSI command model並以serial protocol連接end devices。SAS port可由一個或多個phys組成；多個phys形成wide port時可提供aggregate bandwidth與path resilience。expander把多個ports互連，讓initiator存取大量targets，而不必為每個drive提供獨立host connector。",
          "SAS drive常具有dual ports，可由兩條獨立paths連到controllers；multipath software依裝置識別合併paths，並在失效時切換。這種可用性來自端到端冗餘：兩個drive ports若最後仍共用同一HBA、電源或expander，就仍存在共同failure domain。",
          "SAS與SATA皆為serial storage interface，但command與拓撲能力不同。許多SAS controllers可連接SATA drives，反方向通常不成立；外觀相容不表示dual-port、SCSI task management、expander routing或end-to-end behavior等價。比較時應列出drive、backplane、controller與software stack，而不是只看接頭形狀。"
        ],
        figure: { type: "hierarchy", title: "SAS fabric 的拓撲與故障邊界", root: "Multipath host", branches: [{ label: "HBA A", children: ["Expander A", "Drive port A"] }, { label: "HBA B", children: ["Expander B", "Drive port B"] }, { label: "Shared risks", children: ["Power", "Enclosure", "Firmware"] }], caption: "dual path只有在HBA、cable、expander與power等關鍵元件也分離時，才能避免單點故障。" },
        sourceRefs: ["S9", "S15", "S16"]
      },
      {
        title: "7. PCI Express 是 packetized point-to-point interconnect，lane 數與 generation 共同定上限",
        paragraphs: [
          "PCIe連線由root complex、switch與endpoints構成。每條link是full-duplex point-to-point，x1、x4、x8、x16表示聚合的lanes數；每個lane同時有獨立send與receive differential pairs。transactions被分成Transaction Layer Packets，再經data link與physical layers傳送，因此它不是傳統共享parallel bus。",
          "GT/s表示每秒transfers，不可直接當成GB/s。PCIe 3.0到5.0使用128b/130b encoding；例如PCIe 4.0每lane 16 GT/s，x4的編碼後單向bit rate上限為16×4×128/130 Gbit/s，再除8得到約7.877 GB/s。TLP/DLLP headers、flow control與裝置行為會讓有效payload更低。",
          "PCIe規格世代與實際部署必須分開。PCI-SIG在2025年發布PCIe 7.0，達128 GT/s並使用PAM4與flit-based encoding，但某個系統仍可能只支援4.0或5.0；link training還會協商兩端共同支援的速度與寬度。標示x4的card插入可提供x4 electrical lanes的slot，也可能因平台lane sharing而降速。"
        ],
        figure: { type: "matrix", title: "PCIe 3.0–7.0 的每 lane signaling", columns: ["世代", "Transfer rate", "主要encoding", "每lane單向編碼後上限", "說明"], rows: [["3.0", "8 GT/s", "128b/130b", "約0.985 GB/s", "未扣packet overhead"], ["4.0", "16 GT/s", "128b/130b", "約1.969 GB/s", "x4約7.877 GB/s"], ["5.0", "32 GT/s", "128b/130b", "約3.938 GB/s", "未扣packet overhead"], ["6.0", "64 GT/s", "PAM4 + flit", "約7.56 GB/s", "含flit/FEC架構"], ["7.0", "128 GT/s", "PAM4 + flit", "約15.13 GB/s", "2025發布規格"]], caption: "表中是規格層級的單向上限；實際payload還取決於packet size、平台與endpoint。" },
        sourceRefs: ["S17", "S18"]
      },
      {
        title: "8. NVMe 以多組 submission/completion queues 配合 PCIe parallelism",
        paragraphs: [
          "NVMe controller至少提供admin submission/completion queues，主機再建立一或多組I/O queue pairs。submission queue（SQ）是host寫入的circular buffer；host填好command entry、更新tail doorbell後，controller取走命令。completion queue（CQ）由controller寫入completion entries，host依phase tag辨認新項目、處理command identifier（CID），再更新CQ head doorbell。",
          "queue pair讓不同CPU cores或workloads使用較少共享鎖的路徑。command可以out of order完成，所以CID用來把completion對回原request；SQ position不是completion順序保證。interrupt coalescing可降低interrupt overhead，但等待更多completions再通知也可能增加latency。polling則以CPU時間換取較低通知成本。",
          "namespace是controller提供的logical block address space，可有獨立size、format與identifier；它不是單純等同partition，partition是namespace之上的host metadata。NVMe是command與register/queue architecture，不是NAND的同義詞；同樣模型可經PCIe transport直連，也可由NVMe over Fabrics透過RDMA、Fibre Channel或TCP承載。2026年8月發布的NVMe Base 2.4仍延續模組化base、command set與transport specifications。"
        ],
        figure: { type: "flow", title: "NVMe queue pair 的 circular command path", items: [{ label: "Host writes SQE", detail: "opcode + NSID + CID + PRP/SGL" }, { label: "Ring SQ tail", detail: "MMIO doorbell" }, { label: "Controller fetches", detail: "DMA command + data" }, { label: "Controller writes CQE", detail: "CID + status + phase" }, { label: "Notify or poll", detail: "interrupt / polling" }, { label: "Ring CQ head", detail: "entries reusable" }], caption: "SQ與CQ各自有head/tail；CID把out-of-order completion對回原command。" },
        sourceRefs: ["S19", "S20", "S21"]
      },
      {
        title: "9. USB mass storage 的 BOT 與 UASP 決定命令併行能力，不會改變媒體本質",
        paragraphs: [
          "USB mass storage常在USB link上承載SCSI-style commands。傳統Bulk-Only Transport（BOT）以Command Block Wrapper、data stage與Command Status Wrapper形成較序列化的交易；USB Attached SCSI Protocol（UASP）則把command、data、status分成streams，允許多個commands outstanding並利用SCSI task management。",
          "UASP可降低等待與提升parallelism，但整條路徑仍受USB generation、host controller、hub、cable、bridge chip、device controller與media限制。一個10 Gbit/s USB link的raw ceiling為1.25 GB/s，尚未扣除USB packet與protocol overhead；接上只能持續寫入300 MB/s的flash device，UASP不會把media變成1.25 GB/s。",
          "USB-to-SATA或USB-to-NVMe enclosure同時存在兩個protocol domains。是否能正確轉送flush、discard/TRIM、SMART、sense data與power-management command取決於bridge implementation；拔除前的safe removal也涉及OS cache與outstanding writes，而不只是connector已停止閃爍。"
        ],
        figure: { type: "matrix", title: "BOT 與 UASP 的交易特性", columns: ["特性", "BOT", "UASP", "效能影響", "仍共同受限於"], rows: [["Outstanding commands", "通常較序列", "可多筆", "UASP提高queue use", "device queue depth"], ["Command model", "CBW/data/CSW", "SCSI streams", "較少serialization", "bridge correctness"], ["Task management", "有限", "SCSI task model", "較佳recovery", "firmware"], ["Media speed", "不改變", "不改變", "protocol不是media", "flash/HDD"]], caption: "UASP改善transport利用率；它不替換bridge後方的SATA、NVMe或flash限制。" },
        sourceRefs: ["S22", "S23"]
      },
      {
        title: "10. SAN、iSCSI 與 NVMe-oF 把 block service 延伸到 fabric",
        paragraphs: [
          "Storage Area Network是讓hosts經專用或受控fabric存取block storage的架構；LUN或namespace在host端看起來近似local block device。Fibre Channel可承載SCSI FCP或NVMe/FC，Ethernet/IP可承載iSCSI與NVMe/TCP，RDMA fabrics可承載NVMe/RDMA。SAN描述用途與拓撲，不指定唯一cable或protocol。",
          "iSCSI把SCSI commands與data封裝為iSCSI PDUs並使用TCP連線。initiator登入target、選擇logical unit並以CmdSN等欄位維持命令順序與window；TCP提供可靠ordered byte stream，但iSCSI本身不等於加密。authentication、IPsec或隔離網路需明確部署，且packet loss造成TCP recovery時可能放大tail latency。",
          "NVMe over Fabrics延伸NVMe queue model，讓remote subsystem提供namespaces。network round-trip、serialization、switch queues與host/network processing會加入local device latency；RDMA可減少copy與CPU處理，TCP則利用廣泛部署的IP network。multipath提升path可用性，但remote controller、array、power與site仍必須納入failure-domain分析。"
        ],
        figure: { type: "hierarchy", title: "Network block storage 的 protocol stacks", root: "Host block request", branches: [{ label: "SCSI path", children: ["iSCSI / TCP / IP / Ethernet", "FCP / Fibre Channel", "SAS fabric"] }, { label: "NVMe path", children: ["NVMe/TCP / IP / Ethernet", "NVMe/RDMA", "NVMe/FC"] }, { label: "Common services", children: ["Discovery", "Authentication", "Multipath"] }], caption: "上層block command、transport與physical fabric是可分開選擇的層次。" },
        sourceRefs: ["S24", "S25", "S26", "S27"]
      },
      {
        title: "11. Queue depth 以 concurrency 隱藏等待，也同時累積 latency",
        paragraphs: [
          "在穩定、已飽和且平均值適用的系統中，Little's Law給N=λW。若平均outstanding requests為Q、平均latency為L seconds，完成率可估為IOPS≈Q/L。這不是裝置保證，而是守恆關係：QD=32、平均200 microseconds時，上限估計為160,000 IOPS；若每筆4 KiB，資料率約625 MiB/s。",
          "throughput=IOPS×I/O size，但兩者受到不同瓶頸。小random I/O常受每命令latency與controller processing限制；大sequential I/O較快碰到link或media bandwidth。若算出的throughput超過介面上限，實際系統只能降低IOPS、增加latency或兩者同時發生，不能同時保留互相矛盾的數字。",
          "提高queue depth可讓controller、channels與NAND dies並行，卻也讓每筆request排在更多工作後面。平均latency不能代表99th/99.9th percentile；garbage collection、error recovery、network retransmission與queue buildup會拉長tail。benchmark必須明示read/write ratio、block size、randomness、queue depth、dataset、warm-up、duration與latency percentiles。"
        ],
        figure: { type: "factor", title: "Storage performance 的相互約束", center: "Observed I/O", factors: [{ label: "Latency", detail: "service + queue + network" }, { label: "Queue depth", detail: "outstanding requests" }, { label: "IOPS", detail: "Q / L at steady state" }, { label: "I/O size", detail: "bytes per completion" }, { label: "Bandwidth", detail: "IOPS × size" }, { label: "Tail", detail: "p99 / p99.9" }], caption: "單一sequential MB/s無法代表random latency，單一IOPS也未交代I/O size與queue depth。" },
        sourceRefs: ["S4", "S28"]
      },
      {
        title: "12. Completion、ordering、durability 與 integrity 是四個不同問題",
        paragraphs: [
          "write completion表示命令到達規格允許回報成功的階段；若device啟用volatile write-back cache，資料可能尚未進入non-volatile media。cache flush要求先前writes推進到規定的stable boundary，FUA則要求特定write直接符合forced-unit-access語意。filesystem或database會利用write、flush/FUA與metadata ordering建立crash consistency。",
          "ordering回答A與B誰先成為可觀察或durable；durability回答斷電後是否仍存在；atomicity回答failure時會看到完整舊值、完整新值或torn mixture；integrity回答內容是否被錯誤改變。這些性質不能由單一GOOD status推導。controller若有power-loss protection，可在斷電時把volatile state安全落盤，但必須由device規格與端到端測試確認。",
          "CRC/ECC可偵測或修正特定bit errors，SCSI sense與NVMe status可回報command failure；end-to-end checksum能跨越memory、transport、controller與media發現silent corruption。RAID處理部分device failure並維持服務，snapshot/versioning保存時間點或歷史版本，backup則應有獨立copy與restore驗證。任何一項都不能自動取代其餘項目。"
        ],
        figure: { type: "flow", title: "建立 crash-consistent 更新的順序", items: [{ label: "Write data A", detail: "may enter volatile cache" }, { label: "Flush", detail: "A reaches stable boundary" }, { label: "Write metadata B", detail: "references A" }, { label: "FUA or flush", detail: "B becomes durable" }, { label: "Acknowledge transaction", detail: "recovery sees valid order" }], caption: "若B先durable而A遺失，metadata可能指向未初始化資料；barrier只在各層正確傳遞時有效。" },
        sourceRefs: ["S6", "S11", "S29", "S30"]
      },
      {
        title: "13. NAS 與 cloud object storage 把一致性、耐久性與安全邊界移到服務端",
        paragraphs: [
          "NAS以file protocol輸出shared namespace；client看到directories、files、attributes與locking，server管理filesystem與底層blocks。object service則把key映射到opaque byte sequence與metadata，常透過HTTP API存取。large object可採multipart upload並平行傳送parts，但完成前的parts、失敗重試與最後commit都由API語意決定。",
          "雲端durability與availability不是同義詞。多副本、erasure coding與跨failure-domain placement可降低資料永久遺失機率；網路中斷、認證錯誤、區域故障或service throttling仍會使資料暫時不可用。以Amazon S3為例，成功PUT後對GET與LIST提供strong read-after-write consistency，單一key更新具atomic性，但這不建立跨多個keys的一般transaction。",
          "安全分析涵蓋identity、authorization、encryption in transit/at rest、key management、audit、tenant isolation與secure deletion。versioning與object lock可降低誤刪或勒索軟體覆寫風險，卻仍需測試restore、保護credentials並控制retention。最終選型應由access model、latency、throughput、sharing、consistency、failure domain、recovery objective、operation能力與成本共同決定。"
        ],
        figure: { type: "matrix", title: "四種部署模型的架構選擇", columns: ["模型", "Host看到", "典型延遲", "共享方式", "主要failure domain"], rows: [["Local block", "LBA device", "最低", "單host為主", "host/controller/device"], ["SAN block", "remote LUN/namespace", "低到中", "cluster需協調", "fabric/array/site"], ["NAS file", "shared paths", "中", "server協調files", "network/file server"], ["Cloud object", "bucket + keys", "中到高", "service協調objects", "identity/network/region/service"]], caption: "延遲只是條件之一；共享語意、復原能力與操作責任往往更決定架構。" },
        sourceRefs: ["S1", "S2", "S3", "S31", "S32", "S33", "S34"]
      }
    ],
    workedExamples: [
      { title: "例題一：辨認 block、file 與 object 邊界", prompt: "資料庫以16 KiB pages自行管理一致性，共享文件需支援path與rename，5 GiB備份檔只需整體上傳下載。各選哪種模型？", steps: ["先辨認每個workload希望由storage service管理的名稱與操作單位。", "資料庫需要自行安排pages與flush，適合在block volume上建立其資料格式。", "共享文件需要server管理path、directory與rename，選file service。", "備份以完整blob和key保存、不需in-place overwrite，選object service。", "三者仍可落在相同實體array，選擇依外部語意而非媒體名稱。"], result: "資料庫→block、共享文件→file、備份blob→object。" },
      { title: "例題二：加總端到端 I/O latency", prompt: "一次cache miss依序耗用filesystem 12 μs、block layer 10 μs、queue 80 μs、controller 15 μs、media 120 μs、completion 5 μs，總latency多少？", steps: ["各階段在此模型中串行，因此直接加總。", "12+10+80+15+120+5=242 μs。", "queue與media合計200 μs，占總時間82.64%。", "占比=200/242≈82.64%。", "若只把controller從15降到8 μs，總時間仍為235 μs。"], result: "總latency為242 μs；優化前先處理占比最大的queue/media。" },
      { title: "例題三：由 byte offset 求 LBA 與 block count", prompt: "logical block為512 B，從1 MiB offset寫入4096 B。求start LBA、block count；若physical block為4 KiB是否對齊？", steps: ["1 MiB=1,048,576 B。", "start LBA=1,048,576/512=2048。", "block count=4096/512=8。", "先檢查logical alignment：offset與length都能被512整除。", "physical alignment：1,048,576 mod 4096=0，長度也為4096，故涵蓋一個完整physical block。"], result: "起始LBA 2048、8個logical blocks，且4 KiB對齊。" },
      { title: "例題四：解讀 SCSI READ(10) transfer length", prompt: "READ(10)的start LBA為0x00102030，transfer length為128 blocks，每block 512 B。讀取多少bytes，最後LBA為何？", steps: ["bytes=128×512=65,536 B=64 KiB。", "128 blocks=0x80 blocks。", "起始LBA十六進位維持0x00102030即可做範圍運算。", "最後一個LBA=start+count−1。", "0x00102030+0x80−1=0x001020AF。"], result: "讀取64 KiB，範圍為LBA 0x00102030至0x001020AF。" },
      { title: "例題五：SATA 6 Gb/s 的raw transfer下界", prompt: "忽略所有協定overhead，只用6 Gbit/s傳送1 GiB資料，至少需要多久？若採8b/10b概略上限呢？", steps: ["1 GiB=2^30 B=1,073,741,824 B。", "bits=8,589,934,592。", "raw時間=8,589,934,592/(6×10^9)=1.4317 s。", "若有效資料率先乘0.8為4.8 Gbit/s，時間=1.7896 s。", "實際還有protocol與device限制，不能快於這些理想下界。"], result: "raw下界約1.432 s；只計8b/10b後約1.790 s。" },
      { title: "例題六：SAS wide port 的aggregate upper bound", prompt: "一個wide port含4條12 Gbit/s phys，求單向raw aggregate rate。為何單一command不保證達到？", steps: ["每條phy的標示速率為12 Gbit/s。", "raw aggregate=4×12=48 Gbit/s。", "除8得6 GB/s十進位raw ceiling。", "protocol encoding與frames會扣除payload。", "drive media、controller、command size與可平行工作數也可能先飽和。"], result: "單向raw上限48 Gbit/s=6 GB/s，但不是application throughput保證。" },
      { title: "例題七：PCIe 4.0 x4 的encoding ceiling", prompt: "PCIe 4.0為16 GT/s/lane、128b/130b encoding。求x4單向編碼後資料率。", steps: ["x4表示四條lanes聚合，且這裡只算一個方向。", "transfers=16×10^9×4=64×10^9 transfers/s。", "encoding後bit rate=64×10^9×128/130=63.01538 Gbit/s。", "除8得7.87692 GB/s。", "TLP/DLLP、flow control與endpoint processing尚未扣除。"], result: "單向編碼後理論上限約7.877 GB/s。" },
      { title: "例題八：追蹤 NVMe circular queues", prompt: "深度8的SQ目前tail=6，host連續提交3筆CID 20、21、22。新位置與tail為何？若CID 21先完成是否錯誤？", steps: ["CID 20寫SQ index 6。", "CID 21寫index 7。", "CID 22wrap到index 0。", "新tail=(6+3) mod 8=1。", "controller可out of order完成；CQE以CID 21對回request，所以先完成不構成錯誤。"], result: "使用SQ indices 6、7、0，新tail=1；CID 21可先完成。" },
      { title: "例題九：USB link 與 I/O latency 的雙重上限", prompt: "128 KiB I/O平均latency 80 μs、QD=1，USB raw line為10 Gbit/s。分別由latency與line rate估算上限。", steps: ["80 μs=80×10^-6 s。", "latency-limited IOPS=1/80 μs=12,500。", "要求資料率=12,500×128 KiB=1,638,400,000 B/s。", "USB raw ceiling=10 Gbit/s÷8=1,250,000,000 B/s。", "要求值高於line ceiling，因此兩者不可能同時成立；實際IOPS最多約1.25×10^9/131,072≈9,537，且protocol overhead後更低。"], result: "raw line先成為上限；實際低於約9,537 IOPS與1.25 GB/s。" },
      { title: "例題十：iSCSI request 的 serialization 下界", prompt: "在25 Gbit/s link傳送256 KiB data，忽略headers，單純serialization多久？若path RTT為120 μs，完成不可能低於多少？", steps: ["256 KiB=262,144 B=2,097,152 bits。", "link rate=25×10^9 bit/s。", "serialization=2,097,152/(25×10^9)=83.886 μs。", "若command需一個request/response round trip，另有至少120 μs。", "下界=83.886+120=203.886 μs，尚未含software、switch queue與target media。"], result: "理想下界約203.9 μs。" },
      { title: "例題十一：Little's Law、IOPS 與throughput", prompt: "平均QD=32、latency=200 μs、I/O size=4 KiB。估計穩態IOPS與throughput。", steps: ["L=200 μs=0.0002 s。", "IOPS≈Q/L=32/0.0002=160,000。", "throughput=160,000×4096=655,360,000 B/s。", "除2^20得625 MiB/s。", "若介面或media低於此值，latency會上升或完成率下降。"], result: "約160 kIOPS與625 MiB/s。" },
      { title: "例題十二：判斷 durable ordering", prompt: "transaction先write data A，再flush，再write metadata B with FUA，最後回覆成功。斷電後允許看到哪些狀態？", steps: ["flush完成後，A必須達到該stack定義的stable storage boundary。", "B使用FUA，成功completion前也必須符合non-volatile要求。", "若在A write後、flush完成前斷電，A可能不存在，B尚未發出。", "若B成功後斷電，A已由先前flush保護，B也應durable。", "因此不應出現B durable卻沒有A的狀態，前提是所有層正確傳遞flush/FUA。"], result: "protocol建立A durable before B；錯誤bridge或虛報flush會破壞此推論。" },
      { title: "例題十三：計算 multipart upload parts", prompt: "5 GiB object以64 MiB parts上傳，需要幾個parts？若最多8個並行且每批等時，至少幾批？", steps: ["5 GiB=5120 MiB。", "parts=ceil(5120/64)=80。", "5120可被64整除，所以最後一part也是64 MiB。", "每批最多8個，因此batches=ceil(80/8)=10。", "並行只縮短傳輸排程；最後仍需complete operation把parts組成object。"], result: "共80 parts，理想至少10批。" }
    ],
    misconceptions: [
      ["儲存介面就是connector。", "完整介面還包含command set、transport、controller registers、driver與durability semantics。"],
      ["Block device理解檔名與目錄。", "一般block device只處理LBA範圍；filesystem在主機端管理名稱。"],
      ["Object storage就是可掛載的遠端filesystem。", "object API通常以完整key/object操作，path、locking與in-place update語意不同。"],
      ["任何4 KiB write都一定physical aligned。", "offset也必須對齊；跨4 KiB boundary仍可能碰兩個physical blocks。"],
      ["LUN就是partition。", "LUN識別SCSI logical unit；partition是host在block address space上建立的metadata。"],
      ["SCSI只存在於舊式parallel cable。", "SCSI command model可由SAS、Fibre Channel、iSCSI與UASP承載。"],
      ["SATA 6 Gb/s等於6 GB/s。", "bit與byte相差8倍，且encoding與protocol overhead還會降低payload rate。"],
      ["SAS與SATA只差connector。", "command、dual-port、expander、multipath與task management能力均可能不同。"],
      ["PCIe的GT/s可直接寫成Gb/s或GB/s。", "transfer需依該generation encoding/flit規則換算，之後還要扣packet overhead。"],
      ["NVMe就是NAND flash。", "NVMe是command/queue architecture；media與transport是其他層。"],
      ["NVMe namespace等同partition。", "namespace由controller提供；partition由host建在namespace之上。"],
      ["NVMe commands一定依submission順序完成。", "多queue與controller parallelism允許out-of-order completion，CID負責配對。"],
      ["UASP會讓任何USB儲存裝置跑滿USB line rate。", "UASP改善queueing，media、bridge與host仍可能是瓶頸。"],
      ["SAN提供的是共享檔案路徑。", "SAN通常提供remote block devices；共享filesystem仍需額外協調。"],
      ["iSCSI使用TCP，所以資料自動加密。", "TCP提供可靠ordered stream，不提供機密性；須另行部署認證與加密。"],
      ["較高queue depth一定降低latency。", "它可能提高throughput，也會增加queue waiting與tail latency。"],
      ["Write command完成就表示已通過斷電。", "volatile cache可先回報；durability需flush/FUA與正確device承諾。"],
      ["RAID、snapshot或versioning其中一項就是完整backup。", "它們處理不同故障；backup還需獨立copy、retention與restore驗證。"],
      ["SMART顯示正常就不會故障。", "health telemetry不能預測所有突發、controller、firmware或外部故障。"],
      ["雲端高durability等於永遠可立即讀取。", "durability關於不永久遺失；availability仍受網路、identity與service failure影響。"]
    ],
    exercises: [
      { level: "基礎", question: "Block、file、object storage各由哪一層管理主要名稱？", solution: ["block以LBA由device/controller呈現，檔名通常由host filesystem管理。", "file service由server管理path與file handle；object service管理bucket/key與object metadata。"] },
      { level: "基礎", question: "DMA在storage I/O path中的作用是什麼？IOMMU又解決什麼問題？", solution: ["DMA讓controller直接在device與main memory間搬資料，避免CPU逐byte copy。", "IOMMU轉譯並限制device可存取的memory範圍，建立隔離。"] },
      { level: "基礎", question: "SCSI中的initiator、target與logical unit分別扮演什麼角色？", solution: ["initiator建立並送出tasks/CDB；target port接收命令。", "logical unit是target內真正執行命令、提供block等服務的實體。"] },
      { level: "基礎", question: "SATA NCQ為何能改善HDD與SSD效能？", solution: ["多筆tagged commands可同時outstanding。", "HDD可減少seek/rotation，SSD可使用內部channels/dies parallelism；但queueing也可能增長latency。"] },
      { level: "基礎", question: "NVMe SQ、CQ、doorbell與CID的關係為何？", solution: ["host把command寫入SQ並更新tail doorbell；controller執行後把CQE寫入CQ。", "CID把可能out-of-order的completion配對回原command，host更新CQ head doorbell回收entries。"] },
      { level: "基礎", question: "Durability與availability為何不能互換？", solution: ["durability關心成功保存的資料是否永久遺失。", "availability關心當下能否存取；資料仍存在時，網路或服務故障仍可使它暫時不可用。"] },
      { level: "計算", question: "logical block為4 KiB，offset 6 MiB、length 1 MiB。求start LBA與block count。", solution: ["6 MiB/4 KiB=(6×1024)/4=1536，所以start LBA=1536。", "1 MiB/4 KiB=256 blocks。"] },
      { level: "計算", question: "512e裝置的physical block為4 KiB。一筆512 B write從LBA 15開始，會碰到哪些physical blocks？", solution: ["每個physical block含8個logical sectors；LBA 8–15屬同一physical block。", "單一LBA 15仍只碰該block，但只改其中1/8，可能觸發read-modify-write；若長度2 sectors才會跨到LBA 16所在下一block。"] },
      { level: "計算", question: "SCSI READ從LBA 4096讀256個4 KiB blocks。總bytes與最後LBA是多少？", solution: ["bytes=256×4096=1,048,576 B=1 MiB。", "最後LBA=4096+256−1=4351。"] },
      { level: "計算", question: "PCIe 3.0 x8使用8 GT/s/lane、128b/130b。求編碼後單向GB/s。", solution: ["8×8×128/130=63.01538 Gbit/s。", "除8得7.87692 GB/s，尚未扣TLP/DLLP overhead。"] },
      { level: "計算", question: "QD=16、平均latency=500 μs時，依Little's Law估IOPS。若每筆64 KiB，需求throughput是多少？", solution: ["IOPS=16/0.0005=32,000。", "throughput=32,000×65,536=2,097,152,000 B/s，約1.953 GiB/s。"] },
      { level: "計算", question: "100 Gbit/s fabric傳送1 MiB data，忽略overhead的serialization delay多少？", solution: ["1 MiB=8,388,608 bits。", "delay=8,388,608/10^11=83.88608 μs。"] },
      { level: "計算", question: "裝置宣稱500 kIOPS、I/O size 4 KiB。計算資料率；它能否通過raw 16 Gbit/s link？", solution: ["500,000×4096=2,048,000,000 B/s=16.384 Gbit/s。", "已超過16 Gbit/s raw line，且尚未扣overhead，因此不可能同時達成這兩個條件。"] },
      { level: "計算", question: "一筆I/O含40 μs host、20 μs network serialization、150 μs RTT/queue、90 μs target media。總latency與各部分最大占比為何？", solution: ["總和=40+20+150+90=300 μs。", "network RTT/queue為150/300=50%，是最大部分。"] },
      { level: "計算", question: "3.3 GiB object使用128 MiB parts，需要幾個parts？最後一part多大？", solution: ["3.3 GiB若按3.3×1024=3379.2 MiB；前26個parts為3328 MiB。", "需要ceil(3379.2/128)=27 parts，最後約51.2 MiB。題目使用小數GiB，結果承襲其近似精度。"] },
      { level: "計算", question: "某transaction執行write data、write metadata、最後才flush。若第二個write後斷電，有何風險？", solution: ["兩筆都可能只在volatile cache，且device可能重排。", "可能看到舊資料、部分新資料，甚至metadata先落盤而data未落盤；需在相依更新間建立正確ordering與durability boundary。"] },
      { level: "進階", question: "同一SSD經PCIe直連時延遲低，經NVMe/TCP後較高。列出至少五個新增階段，並指出哪些不能靠提高SSD速度消除。", solution: ["新增socket/protocol processing、TCP/IP stack、NIC DMA、link serialization、switch queue、propagation、remote target processing與return path。", "這些network/host階段不會因SSD media更快而消失；需分層量測CPU、RTT、loss、queue與target。"] },
      { level: "整合", question: "設計一個需要低延遲database、多人共享documents與跨site immutable backups的storage配置，並說明一致性與復原邊界。", solution: ["database使用local或SAN block volume，由database/fsync與replication管理transaction durability。", "documents使用NAS file service，由server處理path、locking與ACL。", "backups寫入啟用versioning/object lock的object service並跨failure domain保存；另定期做restore test。", "三者分開是因access semantics不同，並非只依速度選擇。"] }
    ],
    glossary: [
      ["Block storage", "以固定大小logical blocks與LBA提供read/write的儲存服務。"], ["File storage", "由server管理path、directory、metadata與file operations的共享儲存。"], ["Object storage", "以bucket/key識別完整object及其metadata的儲存服務。"], ["LBA", "Logical Block Address；block address space中的區塊編號。"], ["Logical block", "host command可直接定址與傳輸的最小block單位。"], ["Physical block", "媒體實際更新、保護或配置的block單位。"], ["512e", "對外模擬512-byte logical sectors、內部使用較大physical sectors的格式。"], ["4Kn", "logical與physical sector通常都為4096 bytes的native格式。"], ["Read-modify-write", "先讀較大單位、修改部分內容再寫回的更新流程。"], ["Write amplification", "media實際寫入量與host請求寫入量之比。"], ["FTL", "Flash Translation Layer；把host LBA映射到flash locations。"], ["DMA", "Direct Memory Access；裝置不經CPU逐byte操作直接搬移memory data。"], ["IOMMU", "替I/O devices轉譯與限制memory addresses的硬體。"], ["Scatter-gather", "以多個不連續memory segments描述一筆連續I/O data。"], ["Tag", "識別多筆outstanding commands並配對completion的編號。"], ["HBA", "Host Bus Adapter；連接host I/O stack與storage transport的控制器。"], ["SCSI", "定義storage commands、tasks、devices與service delivery的架構族。"], ["CDB", "Command Descriptor Block；攜帶SCSI opcode、LBA與參數。"], ["Initiator", "建立並送出SCSI task或network storage request的端點。"], ["Target", "接收initiator commands並提供logical units的端點。"], ["LUN", "Logical Unit Number；SCSI domain中識別logical unit的位址。"], ["Sense data", "SCSI command失敗時描述error category與詳細原因的資料。"], ["ATA", "常用於SATA devices的command set與裝置register語意。"], ["AHCI", "Advanced Host Controller Interface；SATA host controller的memory/register模型。"], ["NCQ", "Native Command Queuing；允許多筆tagged ATA commands outstanding與重排。"], ["SAS", "Serial Attached SCSI；以serial links、ports與expanders承載SCSI。"], ["Phy", "serial fabric中單一physical transmitter/receiver link。"], ["Expander", "在SAS fabric中連接與路由多個ports的裝置。"], ["Multipath", "經多條I/O paths存取同一logical device並提供load balance或failover。"], ["PCIe", "以point-to-point links與packets連接root、switches與endpoints的interconnect。"], ["Lane", "PCIe的一組獨立transmit與receive differential pairs。"], ["GT/s", "每秒十億次transfers；須依encoding才能換算有效bits。"], ["TLP", "Transaction Layer Packet；PCIe承載memory、I/O或message transactions的packet。"], ["NVMe", "以多queue與低overhead commands設計的non-volatile memory express架構。"], ["Submission queue", "host放入NVMe commands的circular queue。"], ["Completion queue", "controller放入NVMe command results的circular queue。"], ["Doorbell", "host以MMIO通知controller queue head或tail已更新的register。"], ["CID", "NVMe Command Identifier；把completion對回outstanding command。"], ["Namespace", "NVMe controller提供的一個logical block address space。"], ["BOT", "USB Mass Storage Bulk-Only Transport；以CBW/data/CSW交換命令。"], ["UASP", "USB Attached SCSI Protocol；在USB上支援多command與SCSI task model。"], ["SAN", "Storage Area Network；讓hosts經fabric存取block storage的架構。"], ["NAS", "Network Attached Storage；經network提供file-level service的系統。"], ["iSCSI", "在TCP/IP上承載SCSI commands與data的protocol。"], ["NVMe-oF", "NVMe over Fabrics；把NVMe queue/command model延伸到network fabric。"], ["Fibre Channel", "常用於storage fabric的loss-managed serial networking技術。"], ["RDMA", "Remote Direct Memory Access；讓remote data movement減少CPU與copy介入。"], ["Queue depth", "同時尚未完成的I/O requests數量。"], ["IOPS", "每秒完成的I/O operations數。"], ["Tail latency", "高percentile如p99或p99.9的response time。"], ["Flush", "要求先前cache writes推進到規定stable storage boundary的操作。"], ["FUA", "Forced Unit Access；要求特定command依規格直接滿足non-volatile語意。"], ["Durability", "成功資料在故障後仍不永久遺失的性質。"], ["Availability", "需要時服務與資料可被成功存取的性質。"], ["Atomicity", "操作在failure邊界呈現完整前或完整後狀態的性質。"], ["Integrity", "資料未被未偵測錯誤或未授權方式改變的性質。"], ["Object versioning", "保留同一key歷史object versions的機制。"], ["Object lock", "以retention或legal hold限制object version刪除/覆寫的機制。"]
    ],
    sources: [
      { key: "S1", title: "SNIA Storage Networking Primer", url: "https://www.snia.org/education/storage_networking_primer", accessed: "2026-08-27", use: "block、file、object、DAS、networked storage與storage service基本分類。" },
      { key: "S2", title: "SNIA: What Is NAS?", url: "https://www.snia.org/educational-library/what-nas-network-attached-storage-and-why-nas-important-2022", accessed: "2026-08-27", use: "NAS file protocols、shared files、client/server與block storage差異。" },
      { key: "S3", title: "NIST SP 800-209 Rev. 1 Initial Public Draft", url: "https://csrc.nist.gov/pubs/sp/800/209/r1/ipd", accessed: "2026-08-27", use: "2026年初稿中的block/file/object、DAS/network/cloud storage、isolation、data protection、restore assurance與security controls。" },
      { key: "S4", title: "Linux Kernel: Multi-Queue Block IO Queueing Mechanism", url: "https://docs.kernel.org/block/blk-mq.html", accessed: "2026-08-27", use: "software staging queues、hardware dispatch queues、tags、driver completion與out-of-order behavior。" },
      { key: "S5", title: "Linux Kernel: DMA API HOWTO", url: "https://docs.kernel.org/core-api/dma-api-howto.html", accessed: "2026-08-27", use: "DMA mappings、coherent/streaming memory、scatter-gather與device-memory data path。" },
      { key: "S6", title: "Linux Kernel: I/O Barriers", url: "https://docs.kernel.org/core-api/wrappers/memory-barriers.html", accessed: "2026-08-27", use: "CPU/device ordering、DMA visibility與I/O access ordering邊界。" },
      { key: "S7", title: "T13 ATA Command Set 5 Documents", url: "https://t13.org/docsearch?title=ATA%20Command%20Set%20-5%20%28ACS-5%29", accessed: "2026-08-27", use: "ATA ACS-5文件、logical/physical sector concepts、identify data與storage commands。" },
      { key: "S8", title: "Microsoft: Advanced Format 4K Sector Hard Drives", url: "https://learn.microsoft.com/en-us/windows/win32/w8cookbook/advanced-format--4k--disk-compatibility-update", accessed: "2026-08-27", use: "512e、4Kn、logical/physical sector size與alignment/read-modify-write問題。" },
      { key: "S9", title: "INCITS T10: SCSI Architecture Model 6", url: "https://www.t10.org/members/w_sam6.htm", accessed: "2026-08-27", use: "initiator、target、logical unit、task、service delivery subsystem與SCSI architecture。" },
      { key: "S10", title: "INCITS T10: SCSI Primary Commands 6", url: "https://www.t10.org/members/w_spc6.htm", accessed: "2026-08-27", use: "common SCSI commands、status、sense、inquiry與logical unit management。" },
      { key: "S11", title: "INCITS T10: SCSI Block Commands 5", url: "https://www.t10.org/members/w_sbc5.htm", accessed: "2026-08-27", use: "READ/WRITE、CDB、LBA、cache、FUA、synchronize cache與block device semantics。" },
      { key: "S12", title: "SATA-IO: Purchase Specifications", url: "https://sata-io.org/developers/purchase-specification", accessed: "2026-08-27", use: "Serial ATA Revision 3.5a現行規格版本與規格分層。" },
      { key: "S13", title: "Serial ATA Revision 3.5", url: "https://sata-io.org/system/files/specifications/SerialATA_Revision_3_5_Gold.pdf", accessed: "2026-08-27", use: "SATA PHY、FIS、NCQ、commands、6 Gb/s signaling與transport behavior。" },
      { key: "S14", title: "Intel Serial ATA AHCI Specification 1.3.1", url: "https://www.intel.com/content/www/us/en/io/serial-ata/serial-ata-ahci-spec-rev1-3-1.html", accessed: "2026-08-27", use: "AHCI registers、command lists/tables、received FIS、DMA與host software interface。" },
      { key: "S15", title: "INCITS T10 Drafts and Standards", url: "https://www.t10.org/drafts.htm", accessed: "2026-08-27", use: "SAS Protocol Layer、SCSI standards家族與目前published/draft狀態。" },
      { key: "S16", title: "INCITS T10 Projects", url: "https://www.t10.org/projects.htm", accessed: "2026-08-27", use: "SAS/SCSI project範圍、standards關係與serial storage roadmap。" },
      { key: "S17", title: "PCI-SIG: PCI Express Base Specification", url: "https://pcisig.com/specification-overview/pci-express-base", accessed: "2026-08-27", use: "PCIe generations、lane rates、full-duplex links、encoding與base architecture。" },
      { key: "S18", title: "PCI-SIG: PCI Express 7.0 FAQ", url: "https://pcisig.com/faq?field_category_value%5B%5D=pci_express_7.0", accessed: "2026-08-27", use: "PCIe 7.0 128 GT/s、PAM4、flit encoding與x16 aggregate bandwidth。" },
      { key: "S19", title: "NVM Express Base Specification 2.4", url: "https://nvmexpress.org/specification/nvm-express-base-specification/", accessed: "2026-08-27", use: "2026-08-04發布Base 2.4、controller、namespace、queues、doorbells與modular architecture。" },
      { key: "S20", title: "NVM Express NVM Command Set Specification", url: "https://nvmexpress.org/specification/nvm-command-set-specification/", accessed: "2026-08-27", use: "NVM command set、read/write/flush、LBA formats、status與data pointers。" },
      { key: "S21", title: "NVM Express NVMe over PCIe Transport Specification 1.4", url: "https://nvmexpress.org/specification/nvme-over-pcie-transport-specification/", accessed: "2026-08-27", use: "2026-08-04發布的PCIe Transport 1.4、MMIO doorbells、queue memory與transport binding。" },
      { key: "S22", title: "USB-IF: USB Attached SCSI Protocol 1.0", url: "https://www.usb.org/document-library/usb-attached-scsi-protocol-uasp-v10-and-adopters-agreement", accessed: "2026-08-27", use: "UASP command/data/status streams、queueing與SCSI task management。" },
      { key: "S23", title: "USB-IF: Mass Storage Specifications", url: "https://www.usb.org/documents?search=Mass%20storage", accessed: "2026-08-27", use: "Bulk-Only Transport、mass storage class、command wrappers與USB storage documents。" },
      { key: "S24", title: "SNIA: What Is a Storage Area Network?", url: "https://www.snia.org/education/storage_networking_primer/san/what_san", accessed: "2026-08-27", use: "SAN block service、fabric、Fibre Channel/Ethernet/InfiniBand與host-visible storage。" },
      { key: "S25", title: "RFC 7143: Internet Small Computer System Interface", url: "https://www.rfc-editor.org/info/rfc7143/", accessed: "2026-08-27", use: "iSCSI initiator/target、TCP connections、sessions、CmdSN、tasks、security與error recovery。" },
      { key: "S26", title: "NVM Express TCP Transport Specification 1.3", url: "https://nvmexpress.org/specification/tcp-transport-specification/", accessed: "2026-08-27", use: "2026 NVMe/TCP transport、PDUs、queues、data transfer與TCP fabric behavior。" },
      { key: "S27", title: "NVM Express 2.4 Specification Set", url: "https://nvmexpress.org/specifications/", accessed: "2026-08-27", use: "Base 2.4中的Fabrics architecture，以及獨立PCIe、RDMA、TCP transports與remote namespaces。" },
      { key: "S28", title: "Little's Law", url: "https://doi.org/10.1287/opre.9.3.383", accessed: "2026-08-27", use: "穩態queue中平均items、arrival/completion rate與平均time之關係N=λW。" },
      { key: "S29", title: "Linux Kernel: Writeback Cache Control", url: "https://docs.kernel.org/6.10/block/writeback_cache_control.html", accessed: "2026-08-27", use: "volatile write-back cache、REQ_PREFLUSH、REQ_FUA、ordering與device completion semantics。" },
      { key: "S30", title: "NIST SP 800-209 Rev. 1 Initial Public Draft: Data Protection", url: "https://csrc.nist.gov/pubs/sp/800/209/r1/ipd", accessed: "2026-08-27", use: "2026年初稿中的integrity、availability、replication、backup、isolation、encryption與restore assurance。" },
      { key: "S31", title: "Amazon S3: Using Amazon S3 Objects", url: "https://docs.aws.amazon.com/console/s3/UsingObjects.html", accessed: "2026-08-27", use: "object、key、metadata、PUT/GET、single-key atomicity與strong consistency。" },
      { key: "S32", title: "Amazon S3 Data Durability", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html", accessed: "2026-08-27", use: "redundancy、versioning、replication、durability與availability區分。" },
      { key: "S33", title: "Amazon S3 Object Lock", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html", accessed: "2026-08-27", use: "WORM、retention periods、legal holds與version-level protection。" },
      { key: "S34", title: "Amazon S3 PutObject API", url: "https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html", accessed: "2026-08-27", use: "PUT object atomicity、checksums、conditional requests與concurrent write behavior。" }
    ]
  }
];
