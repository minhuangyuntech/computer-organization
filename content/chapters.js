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
  }
];
