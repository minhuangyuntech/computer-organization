const chapterDetails = [
  {
    chapter: 1,
    title: "從抽象層次到可執行的計算機",
    english: "From Abstraction Layers to an Executing Computer",
    revised: "2026-08-16",
    readingTime: "約 90–120 分鐘",
    intro: "一部計算機不是單一元件，而是一組彼此遵守介面的層次。程式設計者看見變數、函式與執行緒；ISA 看見指令、暫存器與記憶體；處理器內部則用資料路徑、控制訊號、pipeline 與 cache 實作這些承諾。本章建立一套可反覆使用的追蹤方法：先指出目前觀察的層次，再列出該層可見的狀態，最後說明一次操作如何讓狀態由 S(t) 轉為 S(t+1)。後續學習 MIPS、datapath、pipeline 與 cache 時，都會回到這個方法。",
    outcomes: [
      "能由應用程式一路說明到 transistor 的抽象層次，並指出相鄰層之間的 interface。",
      "能區分 instruction set architecture 與 microarchitecture，不再把 ISA 名稱當成某一顆 CPU 的內部結構。",
      "能用 PC、registers、memory 與 device state 描述 stored-program computer 的狀態。",
      "能逐步追蹤 fetch–decode–execute，辨認每一步讀取與更新的狀態。",
      "能區分 pipeline、SIMD/SIMT、multicore 與 distributed computing 所利用的平行層次。",
      "能以 correctness、latency、throughput 與 energy 等不同觀察指標評估實作。"
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
        sourceRefs: ["S1", "S2"]
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
      }
    ],
    misconceptions: [
      ["Architecture 就是 CPU 方塊圖。", "方塊圖多半呈現 organization；ISA 才是 software-visible architecture contract。廣義用語可能涵蓋兩者，分析時仍要明確命名。"],
      ["clock rate 高的 CPU 一定比較快。", "CPU Time 同時受 instruction count、CPI 與 clock period 影響；workload 與 memory stall 也必須相同才能比較。"],
      ["von Neumann machine 只能有一條實體 bus。", "核心是 stored-program 與 instruction/data 的概念模型。現代 CPU 可有分離 L1、multiple buses 與 network-on-chip。"],
      ["Pipeline 同時做五條指令，所以單一指令快五倍。", "Pipeline 主要改善 throughput；單一 instruction latency 仍包含所有 stages 與 pipeline-register overhead。"],
      ["ISA 相同代表 cache、pipeline 與核心數相同。", "這些多半是 microarchitecture 選擇。同一 ISA 可有非常小或非常高效能的不同 implementations。"],
      ["程式與資料都是 bits，所以任何資料都能安全執行。", "stored-program 允許 bits 被解讀為 instruction，但 privilege、page permission、alignment 與 valid encoding 仍限制合法 execution。"]
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
      ["Interconnect", "在 CPU、memory、I/O 或 cores 間傳遞 request、address、data 與 response 的連接結構。"]
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
        accessed: "2026-08-16",
        use: "目前 CUDA programming model 與工具鏈版本脈絡。"
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
  }
];
