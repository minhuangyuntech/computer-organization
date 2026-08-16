const lectures = [
  {
    week: 1,
    title: "計算機系統的抽象層次與課程介紹",
    english: "Introduction to Computer Systems and Levels of Abstraction",
    tags: ["abstraction", "ISA", "hardware/software interface"],
    goals: [
      "說明應用程式、系統軟體、指令集架構、微架構與電路之間的分工。",
      "理解計算機組織關心的是「指令如何被硬體執行」。",
      "建立本課程的學習地圖：效能、MIPS、算術、datapath、pipeline、memory hierarchy。"
    ],
    concepts: [
      ["抽象層次", "計算機系統不是單一黑盒子，而是從高階語言、編譯器、作業系統、指令集架構（ISA）、處理器資料路徑、控制單元、記憶體系統一路堆疊而成。每一層向上一層提供較簡單的介面，同時隱藏下層大量細節。"],
      ["ISA 與微架構", "ISA 定義程式能看見的指令、暫存器、記憶體位址模式與例外行為；微架構則是硬體如何實作 ISA。相同 ISA 可以有不同微架構，例如單週期、多週期、pipeline 或 superscalar。"],
      ["硬體/軟體介面", "組合語言是理解硬體行為的低階入口。高階程式的一個敘述可能變成多個機器指令，而每個機器指令會驅動 ALU、暫存器檔、記憶體與控制訊號。"]
    ],
    notes: [
      "本課程的核心問題是：一段程式如何變成可以在 CPU 上執行的二進位指令？CPU 又如何在有限硬體資源下快速且正確地完成這些指令？",
      "學習計算機組織時，請同時保留兩種視角。第一種是程式設計者視角：指令、暫存器、記憶體位址、效能。第二種是硬體設計者視角：資料路徑、控制訊號、pipeline stage、cache hit/miss。",
      "本學期前半段會建立 ISA 與算術基礎；後半段把指令放入處理器資料路徑，進一步分析 pipeline 與 cache 對效能的影響。"
    ],
    example: {
      title: "從 C 程式到硬體動作",
      code: "int a = b + c;\n// 可能對應到 MIPS:\nlw  $t0, 0($s1)   # 讀 b\nlw  $t1, 0($s2)   # 讀 c\nadd $t2, $t0, $t1 # ALU 加法\nsw  $t2, 0($s0)   # 寫回 a",
      explanation: "這四行指令已經牽涉 instruction fetch、decode、register read、ALU operation、data memory access、write back 等行為。"
    },
    activity: "請學生挑一行熟悉的 C 或 Python 敘述，推測它可能需要哪些硬體動作：讀指令、讀資料、算術、比較、分支或寫回。",
    checks: ["ISA 和微架構的差異是什麼？", "為什麼高階語言不能直接描述 CPU 內部所有動作？", "本課程中 performance、datapath、cache 彼此如何關聯？"]
  },
  {
    week: 2,
    title: "計算機效能評估",
    english: "Computer Performance Evaluation: CPU Time, Clock Rate, and CPI",
    tags: ["CPU time", "CPI", "Amdahl's Law"],
    goals: ["能計算 CPU execution time。", "能區分 response time 與 throughput。", "能用 Amdahl's Law 判斷最佳化上限。"],
    concepts: [
      ["CPU execution time", "CPU Time = Instruction Count × CPI × Clock Cycle Time，也等於 Instruction Count × CPI / Clock Rate。這個公式把軟體、ISA、編譯器與硬體設計放在同一張表中。"],
      ["CPI", "Cycles Per Instruction 是平均每個指令需要的時脈週期數。不同指令類型可能 CPI 不同，因此常用加權平均：CPI = Σ(指令類型比例 × 該類型 CPI)。"],
      ["Amdahl's Law", "若某部分佔總時間比例 F，被加速 S 倍，整體 speedup = 1 / ((1 - F) + F / S)。只加速少數部分，整體效能提升會很快遇到上限。"]
    ],
    notes: [
      "不要只看 clock rate。較高頻率若伴隨較高 CPI 或更多指令數，不一定更快。效能比較必須指定工作負載，並同時考慮 instruction count、CPI 與 clock rate。",
      "Response time 是單一任務完成時間，使用者通常直接感受到它；throughput 是單位時間完成多少工作，伺服器與批次系統常關心它。",
      "最佳化前應先量測。若記憶體等待佔 40%，ALU 變快 10 倍也不會讓整體快 10 倍。"
    ],
    example: {
      title: "CPU Time 計算",
      code: "Program A: 2.0e9 instructions, CPI = 1.5, clock = 3 GHz\nCPU time = 2.0e9 × 1.5 / 3.0e9 = 1.0 s",
      explanation: "若另一台 CPU clock 較低但 CPI 也更低，仍可能更快。"
    },
    activity: "分組比較兩個假想處理器：一個 clock 高、CPI 高；另一個 clock 低、CPI 低。要求學生用公式而不是直覺下結論。",
    checks: ["MIPS 指標為什麼可能誤導？", "Instruction count 受到哪些因素影響？", "Amdahl's Law 告訴我們最佳化時應先找什麼？"]
  },
  {
    week: 3,
    title: "數值表示法與資料儲存",
    english: "Data Representation and Information Storage in Computers",
    tags: ["binary", "two's complement", "endianness"],
    goals: ["熟悉二進位、十六進位與位元運算。", "能用 two's complement 表示有號整數。", "理解 byte addressing 與 endianness。"],
    concepts: [
      ["位元與編碼", "電腦儲存的是位元樣式；同一串位元可依情境解讀為整數、字元、指令或浮點數。資料型態不是位元本身，而是解讀規則。"],
      ["Two's complement", "n 位元 two's complement 範圍為 -2^(n-1) 到 2^(n-1)-1。負數可由正數取反加一得到。加減法硬體可共用同一個加法器。"],
      ["位元延伸", "有號數做 sign extension，無號數做 zero extension。若把有號/無號混用，常造成條件判斷錯誤。"],
      ["Endianness", "Little endian 與 big endian 決定多位元組資料在記憶體中的 byte 順序。它不改變暫存器中的數值，只影響記憶體表示與資料交換。"]
    ],
    notes: [
      "二進位與十六進位轉換是後續看 instruction encoding、cache address breakdown 的基本功。十六進位每一位剛好對應 4 bits，適合表達 32-bit 指令與位址。",
      "Overflow 只對固定寬度的有號運算有意義。兩個正數相加得到負數、或兩個負數相加得到正數，就是 two's complement overflow 的典型跡象。",
      "資料對齊（alignment）會影響硬體存取效率。MIPS word 通常要求 4-byte alignment，位址最低兩個 bit 應為 00。"
    ],
    example: {
      title: "8-bit two's complement",
      code: "+18 = 0001 0010\n-18 = 1110 1110  # invert 0001 0010 => 1110 1101, plus 1",
      explanation: "以 8-bit 來看，1110 1110 若解讀為 unsigned 是 238，若解讀為 signed 是 -18。"
    },
    activity: "給學生幾個 8-bit patterns，要求分別以 unsigned、signed、ASCII 解讀，體會「位元樣式」與「意義」的分離。",
    checks: ["為什麼 two's complement 的負數比正數多一個？", "Sign extension 為什麼要複製最高位元？", "Little endian 對 network protocol 會造成什麼問題？"]
  },
  {
    week: 4,
    title: "MIPS 組合語言與暫存器架構",
    english: "Introduction to MIPS Assembly Language and Register Organization",
    tags: ["MIPS", "registers", "assembly"],
    goals: ["認識 MIPS register convention。", "理解 load-store architecture。", "能讀懂基本 arithmetic 指令。"],
    concepts: [
      ["Load-store 架構", "MIPS 算術邏輯指令只操作暫存器，記憶體資料必須先用 lw 載入暫存器，計算後再用 sw 存回記憶體。這讓資料路徑較規則，便於 pipeline。"],
      ["暫存器", "MIPS 有 32 個 general-purpose registers。$zero 永遠為 0；$t0-$t9 常作暫時值；$s0-$s7 常保存跨函式呼叫仍需保留的值；$a0-$a3 用於參數；$v0-$v1 用於回傳。"],
      ["R-format 指令", "如 add、sub、and、or、slt，多數有三個 register operands：目的暫存器 rd、來源暫存器 rs 與 rt。"]
    ],
    notes: [
      "組合語言的價值不是取代 C，而是讓我們看見編譯器和硬體中間的指令層。理解 MIPS 後，學習 RISC-V、ARM 或其他 RISC ISA 會容易很多。",
      "暫存器數量有限，所以編譯器需要做 register allocation。當暫存器不夠時，資料會 spill 到 memory，效能通常下降。",
      "良好的組合語言閱讀習慣：先標出變數放在哪些暫存器，再追蹤每行指令改變了哪些狀態。"
    ],
    example: {
      title: "三運算元設計",
      code: "add $t0, $s1, $s2  # $t0 = $s1 + $s2\nsub $t1, $t0, $s3  # $t1 = $t0 - $s3\nslt $t2, $t1, $zero # if $t1 < 0 then $t2 = 1",
      explanation: "目的暫存器放在最前面是 MIPS 語法特色，讀程式時要避免和數學式順序混淆。"
    },
    activity: "把 `f = (g + h) - (i + j)` 翻成 MIPS，並說明每個變數對應的暫存器。",
    checks: ["MIPS 為什麼不允許 add 直接讀 memory？", "$zero 的硬體用途是什麼？", "$t 與 $s 暫存器慣例差在哪裡？"]
  },
  {
    week: 5,
    title: "MIPS 基本指令與記憶體存取",
    english: "MIPS Instructions and Memory Access Operations",
    tags: ["lw", "sw", "branch", "addressing"],
    goals: ["熟悉 lw/sw base+offset addressing。", "能撰寫 if/else 與 loop。", "理解 branch target 與 PC 更新。"],
    concepts: [
      ["Base + offset", "`lw $t0, 12($s1)` 的有效位址為 `$s1 + 12`。陣列元素位址常由 base address 加上 index × element size 得到。"],
      ["Branch", "`beq` 與 `bne` 根據兩個暫存器是否相等決定是否改變 PC。條件判斷常搭配 `slt` 產生 0/1 結果。"],
      ["Jump", "`j` 用於無條件跳躍；函式呼叫會使用 `jal` 儲存 return address 到 `$ra`，回傳用 `jr $ra`。"]
    ],
    notes: [
      "MIPS memory 是 byte-addressed，但 `lw` 一次讀 4 bytes。若處理 int 陣列，index 要乘以 4；若處理 char 陣列，index 不需乘以 4。",
      "組合語言沒有高階語言的區塊結構，只有 label 與 branch/jump。閱讀 loop 時，先找 label、條件跳出點與回跳指令。",
      "Pseudo-instructions 如 `move`、`li`、`blt` 方便書寫，但硬體真正執行的是 assembler 展開後的基本指令。"
    ],
    example: {
      title: "陣列讀寫",
      code: "# A[i] = A[i] + 1, base of A in $s0, i in $s1\nsll $t0, $s1, 2\nadd $t0, $s0, $t0\nlw  $t1, 0($t0)\naddi $t1, $t1, 1\nsw  $t1, 0($t0)",
      explanation: "`sll` 左移 2 位相當於乘以 4，因為 int 是 4 bytes。"
    },
    activity: "將 C 語言 `while (i < n) sum += A[i];` 翻成 MIPS，明確標出 loop label 與 exit label。",
    checks: ["`lw $t0, 8($s1)` 中 8 的單位是 byte 還是 word？", "Pseudo-instruction 對硬體設計有何影響？", "PC-relative branch 的好處是什麼？"]
  },
  {
    week: 6,
    title: "MIPS 程式設計與指令執行流程",
    english: "MIPS Programming and Instruction Execution Process",
    tags: ["procedure", "stack", "calling convention"],
    goals: ["理解函式呼叫與 stack frame。", "能追蹤 jal/jr 與 $ra。", "能將小型 C 函式翻成 MIPS。"],
    concepts: [
      ["Calling convention", "呼叫者負責傳參數與接收回傳值；被呼叫者若使用需保存的暫存器，必須在 stack 中保存並於回傳前恢復。"],
      ["Stack", "Stack 通常向低位址成長。函式進入時配置 frame，存放 return address、saved registers、local variables；離開時釋放 frame。"],
      ["Instruction cycle", "每一指令可概念性分成 fetch、decode/register read、execute、memory、write back。後續單週期與 pipeline 都會使用這個分解。"]
    ],
    notes: [
      "函式呼叫是最能串起軟硬體的例子：高階語言看起來是一個 function call，ISA 層面是 `jal`、參數暫存器與 stack 操作，硬體層面則是 PC 改變與暫存器寫入。",
      "遞迴函式必須特別注意 `$ra` 與參數保存，否則下一次呼叫會覆蓋上一層返回位置。",
      "追蹤 stack 時畫表格最清楚：列出位址、內容、何時 push、何時 pop。"
    ],
    example: {
      title: "簡單函式框架",
      code: "func:\n  addi $sp, $sp, -8\n  sw   $ra, 4($sp)\n  sw   $s0, 0($sp)\n  # function body\n  lw   $s0, 0($sp)\n  lw   $ra, 4($sp)\n  addi $sp, $sp, 8\n  jr   $ra",
      explanation: "這個 prologue/epilogue 確保函式回來後，呼叫者期待被保留的狀態仍正確。"
    },
    activity: "用 stack 圖追蹤一個呼叫另一個函式的 MIPS 程式，標示 `$sp`、`$ra`、參數與 local variable。",
    checks: ["為什麼 nested call 前要保存 `$ra`？", "Caller-saved 與 callee-saved 的差異是什麼？", "Instruction cycle 的五個階段各自做什麼？"]
  },
  {
    week: 7,
    title: "整數算術運算與浮點數表示法",
    english: "Integer Arithmetic and Floating-Point Representation",
    tags: ["ALU", "overflow", "IEEE 754"],
    goals: ["理解加減乘除的硬體概念。", "能判斷 signed overflow。", "理解 IEEE 754 floating-point 的 sign/exponent/fraction。"],
    concepts: [
      ["加減法器", "Two's complement 讓加法與減法可用同一加法器完成。減法 A - B 可轉成 A + (~B + 1)。"],
      ["乘除法", "硬體乘法可視為 shift-and-add；除法可視為 shift-and-subtract。速度與面積常需折衷，因此高效處理器會使用更複雜的乘法器。"],
      ["IEEE 754", "Single precision 由 1-bit sign、8-bit exponent、23-bit fraction 組成。Exponent 使用 bias 表示，能同時表示極大與極小數。"],
      ["浮點誤差", "浮點數不是實數；許多十進位小數無法用有限二進位精確表示。運算順序可能改變 rounding error。"]
    ],
    notes: [
      "整數 overflow 是位元寬度有限造成的結果。硬體可以用 operand sign 與 result sign 判斷加法 overflow。",
      "浮點數用科學記號的想法換取範圍，但犧牲精確度。越大的數，相鄰可表示數之間的間距也越大。",
      "學會辨認 special values：zero、subnormal、infinity、NaN。這些設計讓浮點運算能處理 underflow、overflow 與未定義結果。"
    ],
    example: {
      title: "浮點格式拆解",
      code: "IEEE 754 single:\nvalue = (-1)^sign × 1.fraction × 2^(exponent - 127)\n0 10000001 01000000000000000000000\n= +1.25 × 2^2 = 5.0",
      explanation: "Normalized number 的 leading 1 不儲存在 fraction 中，稱為 hidden bit。"
    },
    activity: "比較 `(1e20 + -1e20) + 3.14` 與 `1e20 + (-1e20 + 3.14)`，討論浮點加法為何不一定符合結合律。",
    checks: ["Signed overflow 與 carry out 是否相同？", "Bias exponent 的用途是什麼？", "NaN 和 infinity 分別表示哪些情況？"]
  },
  {
    week: 8,
    title: "指令編碼與 CPU 執行指令的基本流程",
    english: "Instruction Encoding and CPU Instruction Execution Cycle",
    tags: ["instruction encoding", "R/I/J format", "control"],
    goals: ["能辨識 MIPS R/I/J format。", "理解 opcode、rs、rt、rd、shamt、funct。", "銜接指令格式到 datapath 控制訊號。"],
    concepts: [
      ["Fixed-length encoding", "MIPS 指令固定 32 bits，讓 fetch 與 decode 較規則。硬體每次 PC + 4 取得下一個 sequential instruction。"],
      ["R-format", "用 opcode=0 搭配 funct 決定 ALU 操作，適合 register-register arithmetic/logical instructions。"],
      ["I-format", "包含 16-bit immediate，適合 load/store、branch 與 addi。Immediate 可能需要 sign extension 或 zero extension。"],
      ["J-format", "包含 26-bit target field，配合 PC 高位形成 jump target。"]
    ],
    notes: [
      "指令編碼不是單純背欄位，而是理解硬體如何從 bit pattern 產生控制訊號。Opcode 進入 control unit 後，決定 RegWrite、MemRead、MemWrite、ALUSrc、Branch 等訊號。",
      "Branch offset 通常以 word 為單位並相對於 PC+4，這讓短距離迴圈可用較少 bits 表示。",
      "期中考前請能手算：給一行 MIPS 指令，指出格式與主要欄位；給欄位，判斷它大致會啟動哪些資料路徑。"
    ],
    example: {
      title: "R-format 欄位",
      code: "add $t0, $s1, $s2\nopcode | rs  | rt  | rd  | shamt | funct\n000000 | $s1 | $s2 | $t0 | 00000 | 100000",
      explanation: "控制單元看到 opcode=0 知道是 R-format，再由 funct 決定 ALU 做 add。"
    },
    activity: "分組把 `lw`、`sw`、`beq`、`add` 四種指令填入格式表，並預測每種指令會不會讀 memory、寫 memory、寫 register。",
    checks: ["為什麼 MIPS 使用固定 32-bit 指令？", "R-format 的 opcode 與 funct 如何分工？", "Branch offset 為什麼通常不是 byte offset？"]
  },
  {
    week: 9,
    title: "期中考試週",
    english: "Midterm Examination",
    tags: ["review", "exam"],
    goals: ["整合第 1-8 週觀念。", "熟練效能公式、MIPS 指令、數值表示與指令格式。", "能用文字解釋而非只代公式。"],
    concepts: [
      ["複習主軸一：效能", "題目常要求比較兩台機器或兩種編譯結果。務必先寫出 CPU Time 公式，再代入 instruction count、CPI、clock rate。"],
      ["複習主軸二：MIPS", "能把陣列、迴圈、if/else、函式呼叫翻成 MIPS，也要能從 MIPS 還原程式意圖。"],
      ["複習主軸三：資料表示", "Two's complement、overflow、sign extension、IEEE 754 是常見觀念題。"],
      ["複習主軸四：指令編碼", "R/I/J format 與控制訊號是下半學期 datapath 的入口。"]
    ],
    notes: [
      "準備期中考時，不要只看答案。請把每題的假設寫清楚，例如單位是 GHz 還是 ns、offset 是 byte 還是 word、數值被解讀為 signed 還是 unsigned。",
      "組合語言題目可逐行加註解，尤其是 branch 的條件與跳躍方向。畫出暫存器內容變化表，錯誤會少很多。",
      "考前最後一輪複習可用三張紙：效能公式表、MIPS 指令表、數值表示規則表。"
    ],
    example: {
      title: "期中混合題練習",
      code: "CPU A: 1.2e9 inst, CPI 2.0, 4 GHz\nCPU B: 1.0e9 inst, CPI 1.8, 3 GHz\nA time = 0.6s, B time = 0.6s",
      explanation: "兩者執行時間相同。單看 clock rate 或 instruction count 都會得到不完整結論。"
    },
    activity: "用 20 分鐘完成一題效能、一題 MIPS、一題 two's complement、一題 instruction format，之後全班逐步對答案。",
    checks: ["你能不用看筆記寫出 CPU Time 公式嗎？", "你能清楚分辨 `lw` 和 `add` 的資料路徑差異嗎？", "你能解釋 signed overflow 判斷規則嗎？"]
  },
  {
    week: 10,
    title: "CPU 資料路徑與單週期處理器架構",
    english: "CPU Datapath and Single-Cycle Processor Architecture",
    tags: ["datapath", "single-cycle", "control signals"],
    goals: ["能追蹤單週期 datapath。", "理解 control signals 的角色。", "分析單週期設計的 clock period 限制。"],
    concepts: [
      ["Datapath", "資料路徑是資料流經的硬體元件與連線，包括 PC、instruction memory、register file、ALU、data memory、sign extend、shift-left、adder 與 multiplexers。"],
      ["Control", "控制單元根據 opcode/funct 產生控制訊號，決定 mux 選哪條路、ALU 做什麼、是否讀寫記憶體、是否寫暫存器與是否更新 PC 為 branch target。"],
      ["Single-cycle", "每個指令都在一個 clock cycle 完成。設計簡單，但 clock period 必須長到能容納最慢指令，通常是 load 指令。"]
    ],
    notes: [
      "分析 datapath 最重要的是問三個問題：資料從哪裡來？經過哪些元件？最後寫到哪裡？控制訊號如何讓這條路成立？",
      "`lw` 會使用 instruction memory、register file、ALU、data memory、write back mux。`add` 不用 data memory。`beq` 會使用 ALU 做比較並可能改變 PC。",
      "單週期處理器不是高效設計，但它把每個指令需要的硬體路徑攤在一張圖上，因此很適合作為處理器資料路徑的入門模型。"
    ],
    example: {
      title: "`lw $t0, 8($s1)` 的路徑",
      code: "1. Fetch instruction at PC\n2. Read $s1 from register file\n3. Sign-extend immediate 8\n4. ALU computes $s1 + 8\n5. Data memory reads effective address\n6. Write data back to $t0",
      explanation: "控制訊號包含 ALUSrc=1、MemRead=1、MemtoReg=1、RegWrite=1。"
    },
    activity: "給學生空白 datapath 圖，要求用不同顏色畫出 `add`、`lw`、`sw`、`beq` 使用的路徑。",
    checks: ["單週期 clock period 由哪個指令決定？", "MemtoReg mux 的用途是什麼？", "`beq` 為什麼需要額外 adder 計算 branch target？"]
  },
  {
    week: 11,
    title: "Pipeline 處理器的概念與效能分析",
    english: "Pipelined Processor Concepts and Performance Analysis",
    tags: ["pipeline", "IF ID EX MEM WB", "speedup"],
    goals: ["理解五階段 pipeline。", "能分辨 latency 與 throughput。", "估算 pipeline speedup 與限制。"],
    concepts: [
      ["五階段", "典型 MIPS pipeline 分為 IF、ID、EX、MEM、WB。不同指令在不同階段重疊執行，提升吞吐量。"],
      ["Pipeline registers", "IF/ID、ID/EX、EX/MEM、MEM/WB 暫存器保存每階段之間需要傳遞的資料與控制訊號。"],
      ["效能", "理想 k-stage pipeline 的 throughput 可接近 k 倍，但實際受 stage imbalance、pipeline overhead、hazard 與 branch penalty 限制。"]
    ],
    notes: [
      "Pipeline 不會讓單一指令的 latency 變短；它讓多個指令像生產線一樣重疊，因此完成一批指令的平均時間降低。",
      "Pipeline clock period 由最慢 stage 加上 pipeline register overhead 決定。若各 stage 延遲差距很大，切更多階段不一定划算。",
      "分析 pipeline 題目時，畫 cycle-by-cycle table 是最穩的方式。列是指令，欄是 cycle，填 IF/ID/EX/MEM/WB。"
    ],
    example: {
      title: "理想五階段 pipeline",
      code: "I1: IF ID EX MEM WB\nI2:    IF ID EX MEM WB\nI3:       IF ID EX MEM WB\nI4:          IF ID EX MEM WB",
      explanation: "填滿後每個 cycle 完成一個指令，但前方有 fill time，尾端有 drain time。"
    },
    activity: "比較 5 個指令在 non-pipelined 與 pipelined CPU 上的完成時間，加入 stage delay 後討論 speedup 為何小於 5。",
    checks: ["Pipeline 改善 latency 還是 throughput？", "Pipeline register 保存哪些資訊？", "為什麼 stage balance 很重要？"]
  },
  {
    week: 12,
    title: "Pipeline Hazard 的種類與基本解決方法",
    english: "Pipeline Hazards and Basic Resolution Techniques",
    tags: ["data hazard", "control hazard", "forwarding", "stall"],
    goals: ["辨識 structural、data、control hazards。", "理解 forwarding 與 stall。", "能處理 load-use hazard 與 branch penalty。"],
    concepts: [
      ["Structural hazard", "硬體資源不足造成衝突，例如同一 cycle 需要同一個 memory 同時取指令與讀資料。可用分離 instruction/data memory 或增加資源解決。"],
      ["Data hazard", "後續指令需要前一指令尚未寫回的結果。常見解法是 forwarding/bypassing；若資料仍來不及，如 load-use，就必須 stall。"],
      ["Control hazard", "branch/jump 改變 PC，使下一個要取的指令不確定。解法包含 stall、predict not taken、branch prediction 與延遲槽等。"]
    ],
    notes: [
      "Data hazard 的核心是 producer-consumer distance。ALU 結果通常 EX 後可 forward；load 的資料要到 MEM 後才可用，因此緊接使用通常需要一個 stall。",
      "Forwarding 不等於不用 hazard detection。硬體仍需比較 pipeline registers 中的 rs/rt/rd，判斷是否改 ALU input mux。",
      "Branch 越頻繁、prediction 越差，pipeline 效益越容易被 penalty 吃掉。"
    ],
    example: {
      title: "Load-use hazard",
      code: "lw  $t0, 0($s1)\nadd $t2, $t0, $s3  # needs loaded data immediately",
      explanation: "即使有 forwarding，load data 通常到 MEM stage 結束才可用，因此 add 的 EX stage 需要延後。"
    },
    activity: "給 6 行 MIPS 指令，請學生標出 RAW hazard、能 forwarding 的地方，以及必須 stall 的地方。",
    checks: ["RAW、WAR、WAW 在簡單五階段 MIPS 中哪一種最常見？", "Forwarding mux 會放在哪裡？", "Branch prediction 錯誤時 pipeline 要做什麼？"]
  },
  {
    week: 13,
    title: "記憶體階層架構與區域性原理",
    english: "Memory Hierarchy and the Principle of Locality",
    tags: ["memory hierarchy", "locality", "AMAT"],
    goals: ["理解 memory hierarchy 的成本/速度/容量折衷。", "能說明 temporal 與 spatial locality。", "能計算 Average Memory Access Time。"],
    concepts: [
      ["階層", "Register 最快最小，cache 次之，main memory 更大更慢，storage 最大也最慢。階層設計利用 locality 讓常用資料留在快的位置。"],
      ["Temporal locality", "最近用過的資料很可能很快再被使用，例如迴圈中的變數與指令。"],
      ["Spatial locality", "若某位址被使用，鄰近位址也可能很快被使用，例如 sequential instruction fetch 與陣列走訪。"],
      ["AMAT", "Average Memory Access Time = Hit Time + Miss Rate × Miss Penalty。降低 miss rate、miss penalty 或 hit time 都能改善。"]
    ],
    notes: [
      "Memory wall 是處理器速度提升遠快於主記憶體延遲改善造成的落差。Cache 是緩解 memory wall 的核心技術。",
      "區域性不是硬體保證，而是程式行為。資料結構與迴圈順序會大幅影響 cache 表現。",
      "AMAT 題目要小心單位。Hit time 可能是 cycles，miss penalty 也可能是 ns；計算前先統一。"
    ],
    example: {
      title: "AMAT",
      code: "Hit time = 1 cycle\nMiss rate = 5%\nMiss penalty = 80 cycles\nAMAT = 1 + 0.05 × 80 = 5 cycles",
      explanation: "即使命中只要 1 cycle，少量 miss 也可能主導平均存取時間。"
    },
    activity: "比較 row-major matrix traversal 的兩種迴圈順序，讓學生預測哪一種 spatial locality 較好。",
    checks: ["Temporal locality 與 spatial locality 各舉一例。", "為什麼 cache block 通常含多個 bytes？", "AMAT 中 miss penalty 包含哪些動作？"]
  },
  {
    week: 14,
    title: "Cache Memory 的基本運作原理",
    english: "Fundamentals of Cache Memory Operation",
    tags: ["cache", "tag", "valid bit", "write policy"],
    goals: ["理解 cache block、tag、index、offset。", "能判斷 hit/miss。", "理解 write-through 與 write-back。"],
    concepts: [
      ["Block", "Cache 與 memory 之間以 block 為單位搬移資料。Block size 越大可利用 spatial locality，但過大可能增加 miss penalty 與 pollution。"],
      ["Tag / index / offset", "位址切成 tag、index、block offset。Index 選 cache set/line，tag 比對是否為想要的 memory block，offset 選 block 內 byte/word。"],
      ["Valid bit", "表示 cache line 內容是否有效。剛開機或被清除後，即使 tag 相同也不能視為 hit。"],
      ["Write policy", "Write-through 每次寫 cache 同步寫 memory；write-back 只在 block 被替換時寫回，需要 dirty bit。Write allocate/no-write allocate 決定 write miss 時是否載入 block。"]
    ],
    notes: [
      "判斷 hit/miss 的標準流程：用 index 找 line/set，檢查 valid，拿 tag 比對。若 tag match 且 valid=1 才是 hit。",
      "Cache 設計沒有單一最佳答案。Block size、capacity、associativity、replacement、write policy 都會影響 hit time、miss rate、miss penalty 與硬體成本。",
      "Direct-mapped cache 簡單快速，但容易發生 conflict miss。Associative cache 較彈性，但 tag comparison 和 replacement 較複雜。"
    ],
    example: {
      title: "位址切割",
      code: "32-bit address, 4KB direct-mapped cache, block size 16B\nLines = 4096 / 16 = 256 => index = 8 bits\noffset = log2(16) = 4 bits\ntag = 32 - 8 - 4 = 20 bits",
      explanation: "Offset 選 block 內位置，index 選 cache line，tag 用於確認是否為正確 block。"
    },
    activity: "給一串 memory addresses，讓學生手動模擬小型 direct-mapped cache 的 hit/miss 與 line 內容變化。",
    checks: ["Valid bit 與 dirty bit 分別解決什麼問題？", "Write-through 和 write-back 各有何優缺點？", "Block size 變大一定會降低 miss rate 嗎？"]
  },
  {
    week: 15,
    title: "Cache Mapping 方法介紹",
    english: "Cache Mapping Techniques: Direct-Mapped, Set-Associative, and Fully Associative",
    tags: ["direct mapped", "set associative", "fully associative"],
    goals: ["能比較三種 mapping。", "能計算 set、way、index、tag bits。", "理解 conflict miss 與 associativity 的關係。"],
    concepts: [
      ["Direct-mapped", "每個 memory block 只能放到一個 cache line。硬體簡單、hit time 短，但不同 block 若映到同 line，會互相趕走。"],
      ["Fully associative", "任何 memory block 可放到任一 cache line。Conflict miss 最少，但需要同時比對很多 tags，硬體成本高。"],
      ["Set-associative", "折衷設計。Cache 分成多個 sets，每個 set 有多個 ways。Block 由 index 選 set，再在 set 內任一 way 放置。"],
      ["Miss 類型", "Compulsory miss 是第一次存取；capacity miss 是 cache 太小；conflict miss 是 mapping 限制使 blocks 互相衝突。"]
    ],
    notes: [
      "n-way set associative cache 的 sets = cache size / (block size × n)。Index bits = log2(sets)，offset bits = log2(block size)。",
      "Associativity 提高通常可降低 conflict miss，但也可能增加 hit time 與能耗。真實設計常以實驗工作負載評估。",
      "手算題請先寫出 cache size、block size、ways，再推 lines、sets、offset/index/tag，不要跳步。"
    ],
    example: {
      title: "4-way set associative",
      code: "Cache = 16KB, block = 32B, 4-way, address = 32 bits\nBlocks/lines = 16KB / 32B = 512\nSets = 512 / 4 = 128 => index = 7 bits\noffset = 5 bits\ntag = 32 - 7 - 5 = 20 bits",
      explanation: "每個 index 對應一個 set，set 內 4 個 ways 都要進行 tag 比對。"
    },
    activity: "使用同一串位址，比較 direct-mapped、2-way、fully associative 的 hit/miss 結果，觀察 conflict miss 如何改變。",
    checks: ["Associativity 增加會影響哪三個面向？", "Conflict miss 與 capacity miss 如何區分？", "Set-associative 的 tag comparator 數量和 ways 有何關係？"]
  },
  {
    week: 16,
    title: "Cache Replacement Policy 與效能分析",
    english: "Cache Replacement Policies and Performance Analysis",
    tags: ["LRU", "FIFO", "random", "cache performance"],
    goals: ["理解 replacement policy。", "能模擬 LRU/FIFO。", "以 AMAT 評估 cache 參數變化。"],
    concepts: [
      ["Replacement policy", "當 set 已滿且發生 miss 時，必須決定替換哪一個 way。Direct-mapped 不需要選擇；associative cache 才需要 policy。"],
      ["LRU", "Least Recently Used 替換最久沒被使用的 block，試圖利用 temporal locality。完全精確 LRU 在高 associativity 下成本較高。"],
      ["FIFO / Random", "FIFO 替換最早進入的 block，實作簡單但不一定符合近期使用情形；random 成本低，在某些工作負載下表現可接受。"],
      ["效能分析", "Cache 調整要同時看 hit time、miss rate、miss penalty。降低 miss rate 若讓 hit time 變長，整體未必更快。"]
    ],
    notes: [
      "考題常給位址序列與 cache 組態，要求模擬 replacement。請維護每個 set 的內容、valid、tag、最近使用順序或進入順序。",
      "Multi-level cache 的 AMAT 可展開：AMAT = L1 hit time + L1 miss rate × (L2 hit time + L2 miss rate × memory penalty)。",
      "Write-back cache 在替換 dirty block 時會增加額外寫回成本；分析 miss penalty 時不要漏掉。"
    ],
    example: {
      title: "兩層 Cache AMAT",
      code: "L1 hit = 1 cycle, L1 miss rate = 4%\nL2 hit = 10 cycles, L2 miss rate = 20%\nMemory penalty = 100 cycles\nAMAT = 1 + 0.04 × (10 + 0.20 × 100) = 2.2 cycles",
      explanation: "L2 降低了每次 L1 miss 直接去 memory 的平均成本。"
    },
    activity: "用 2-way cache 手動模擬 LRU 與 FIFO，找出兩者 hit/miss 不同的位址序列。",
    checks: ["LRU 為什麼不一定容易硬體實作？", "兩層 cache 的 miss rate 是 local 還是 global 要如何辨認？", "Dirty block 替換時發生什麼事？"]
  },
  {
    week: 17,
    title: "計算機組織整體架構總整理與應用案例",
    english: "Computer Organization Overview and Practical Applications",
    tags: ["integration", "case study", "optimization"],
    goals: ["整合 ISA、datapath、pipeline、cache。", "能用完整路徑解釋程式效能瓶頸。", "準備期末專題報告。"],
    concepts: [
      ["整體路徑", "一行程式經編譯成指令，指令由 PC 取出，經 decode 讀暫存器，在 ALU 計算，可能存取 cache/memory，最後寫回暫存器或記憶體。"],
      ["效能瓶頸", "瓶頸可能來自指令數太多、CPI 過高、branch misprediction、cache miss、資料相依造成 stall，或演算法本身不具 locality。"],
      ["軟硬體共同設計", "編譯器、資料結構、演算法與硬體設計會互相影響。例如 loop tiling 可改善 cache locality；branchless code 可減少 control hazard。"]
    ],
    notes: [
      "期末專題可選擇一段程式或一個硬體主題，分析它與本課程概念的連結。好的專題不是堆名詞，而是能清楚展示問題、假設、方法、結果與限制。",
      "真實系統中效能分析常用 profiling。先知道時間花在哪裡，再選擇從演算法、編譯、ISA 或記憶體行為下手。",
      "本週可把所有公式與圖整合成一頁總表：CPU Time、pipeline speedup、AMAT、address breakdown、hazard 類型。"
    ],
    example: {
      title: "矩陣乘法案例",
      code: "for (i)\n  for (j)\n    for (k)\n      C[i][j] += A[i][k] * B[k][j];",
      explanation: "若 B 以 row-major 儲存，內層固定 j、改變 k 會跨列存取，spatial locality 較差；調整迴圈或 blocking 可改善 cache 行為。"
    },
    activity: "學生用本課程詞彙分析一個慢程式：它慢在 instruction count、CPI、branch、cache 還是 memory access pattern？",
    checks: ["如何把 CPU Time 與 AMAT 放進同一個效能故事？", "Pipeline hazard 和 cache miss 都會增加 CPI 嗎？", "期末專題如何證明自己的分析是可信的？"]
  },
  {
    week: 18,
    title: "期末測驗",
    english: "Final Examination",
    tags: ["final", "project", "review"],
    goals: ["完成全學期整合複習。", "展示期末專題或完成期末測驗。", "能從硬體/軟體介面角度解釋系統行為。"],
    concepts: [
      ["總複習範圍", "第 10-17 週重點包含單週期 datapath、控制訊號、pipeline 效能、hazard、memory hierarchy、cache mapping、replacement 與 AMAT。"],
      ["解題策略", "Datapath 題先畫資料流；pipeline 題先畫 cycle table；cache 題先算 tag/index/offset；效能題先寫公式與單位。"],
      ["專題評量", "專題應呈現問題動機、系統背景、使用方法、核心分析、實驗或推導結果，以及與課程概念的明確連結。"]
    ],
    notes: [
      "期末題目通常要求跨章節整合。例如一段 loop 的效能可能同時牽涉指令數、branch、load-use hazard 與 cache miss。",
      "請避免只寫結論。每一步推導、每個控制訊號、每個 cache 位址切割都要有理由，這比背答案更可靠。",
      "完成本課程後，應能用精確但不神秘的語言說明：程式為什麼快或慢，CPU 為什麼需要 pipeline，記憶體階層為什麼不可或缺。"
    ],
    example: {
      title: "期末整合題架構",
      code: "1. Count instructions or dynamic instruction mix\n2. Identify pipeline stalls and branch penalties\n3. Estimate memory stalls using cache miss rate\n4. Combine into CPI and CPU Time",
      explanation: "完整效能分析通常不是單一公式，而是把不同來源的 cycle cost 加回 CPI。"
    },
    activity: "以 3 分鐘短講方式，請每組說明期末專題中一個最重要的計算機組織概念與證據。",
    checks: ["給一個位址，你能切出 tag/index/offset 嗎？", "給一段 MIPS，你能畫出 pipeline hazard 嗎？", "你能用一句話說明 hardware/software interface 嗎？"]
  }
];

const formulas = [
  ["CPU Time", "Instruction Count × CPI × Clock Cycle Time"],
  ["Clock Cycle Time", "1 / Clock Rate"],
  ["Average CPI", "Σ(Frequency_i × CPI_i)"],
  ["Speedup", "Old Execution Time / New Execution Time"],
  ["Amdahl", "1 / ((1 - F) + F / S)"],
  ["AMAT", "Hit Time + Miss Rate × Miss Penalty"],
  ["Cache Sets", "Cache Size / (Block Size × Associativity)"],
  ["Address Bits", "Tag + Index + Block Offset"]
];

const registers = [
  ["$zero", "常數 0"],
  ["$v0-$v1", "回傳值"],
  ["$a0-$a3", "函式參數"],
  ["$t0-$t9", "暫時暫存器，caller-saved"],
  ["$s0-$s7", "保存暫存器，callee-saved"],
  ["$sp", "stack pointer"],
  ["$ra", "return address"]
];

const weekList = document.querySelector("#weekList");
const lectureView = document.querySelector("#lectureView");
const searchInput = document.querySelector("#searchInput");
const themeButton = document.querySelector("#toggleTheme");
const printButton = document.querySelector("#printPage");

let activeWeek = Number(location.hash.replace("#week-", "")) || 1;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderWeekList(items = lectures) {
  weekList.innerHTML = items.map((lecture) => `
    <button class="week-button ${lecture.week === activeWeek ? "active" : ""}" type="button" data-week="${lecture.week}">
      <strong>${String(lecture.week).padStart(2, "0")}</strong>
      <span>${escapeHtml(lecture.title)}<small>${escapeHtml(lecture.english)}</small></span>
    </button>
  `).join("");
}

function renderTable(rows) {
  return `
    <table class="mini-table">
      <tbody>
        ${rows.map(([a, b]) => `<tr><th>${escapeHtml(a)}</th><td>${escapeHtml(b)}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function renderLecture(week) {
  const lecture = lectures.find((item) => item.week === week) || lectures[0];
  activeWeek = lecture.week;
  document.title = `第 ${lecture.week} 週 ${lecture.title} | 計算機組織`;
  history.replaceState(null, "", `#week-${lecture.week}`);
  renderWeekList(filterLectures(searchInput.value));

  lectureView.innerHTML = `
    <header class="lecture-head">
      <div class="week-num">${String(lecture.week).padStart(2, "0")}</div>
      <div>
        <p class="eyebrow">Week ${lecture.week}</p>
        <h2>${escapeHtml(lecture.title)}</h2>
        <p>${escapeHtml(lecture.english)}</p>
        <div class="tags">${lecture.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
    </header>
    <div class="lecture-grid">
      <div>
        <section class="section">
          <h3>本週學習目標</h3>
          <ul>${lecture.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("")}</ul>
        </section>
        <section class="section">
          <h3>核心概念</h3>
          <ul class="concept-list">
            ${lecture.concepts.map(([term, text]) => `<li><strong>${escapeHtml(term)}：</strong>${escapeHtml(text)}</li>`).join("")}
          </ul>
        </section>
        <section class="section">
          <h3>講義筆記</h3>
          ${lecture.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
          <div class="callout"><strong>練習任務：</strong>${escapeHtml(lecture.activity)}</div>
        </section>
        <section class="section">
          <h3>例題</h3>
          <h4>${escapeHtml(lecture.example.title)}</h4>
          <pre><code>${escapeHtml(lecture.example.code)}</code></pre>
          <p>${escapeHtml(lecture.example.explanation)}</p>
        </section>
        <section class="section">
          <h3>課後檢核</h3>
          <ol>${lecture.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("")}</ol>
        </section>
      </div>
      <aside class="side-notes">
        <section class="tool-card">
          <h4>常用公式</h4>
          ${renderTable(formulas)}
        </section>
        <section class="tool-card">
          <h4>MIPS 暫存器速查</h4>
          ${renderTable(registers)}
        </section>
        <section class="tool-card">
          <h4>學習重點</h4>
          <p>這週內容銜接「程式如何變成指令」與「指令如何驅動硬體」。閱讀時請把每個術語放回資料流中，而不是孤立背誦。</p>
        </section>
      </aside>
    </div>
  `;
  document.querySelector("#content").focus({ preventScroll: true });
}

function filterLectures(query) {
  const q = query.trim().toLowerCase();
  if (!q) return lectures;
  return lectures.filter((lecture) => {
    const haystack = [
      lecture.title,
      lecture.english,
      ...lecture.tags,
      ...lecture.goals,
      ...lecture.concepts.flat(),
      ...lecture.notes,
      lecture.example.title,
      lecture.example.code,
      lecture.example.explanation,
      lecture.activity,
      ...lecture.checks
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

weekList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-week]");
  if (!button) return;
  renderLecture(Number(button.dataset.week));
});

searchInput.addEventListener("input", () => {
  const items = filterLectures(searchInput.value);
  renderWeekList(items);
  if (items.length && !items.some((item) => item.week === activeWeek)) {
    renderLecture(items[0].week);
  }
});

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("co-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

printButton.addEventListener("click", () => window.print());

if (localStorage.getItem("co-theme") === "dark") {
  document.body.classList.add("dark");
}

renderWeekList();
renderLecture(activeWeek);
