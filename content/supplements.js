const supplements = [
  {
    week: 1,
    bridge: "本週先建立一條不會迷路的主線：程式所看見的是 ISA，處理器內部實作的是微架構，而微架構最終由暫存器、組合邏輯與時脈電路構成。後續所有公式與圖都可以放回這條主線定位。",
    sections: [
      {
        title: "Architecture 與 Organization 的分界",
        paragraphs: [
          "Architecture 描述程式設計者可觀察的規格，例如指令、暫存器、資料型態、位址空間與例外。Organization 描述這些規格如何由資料路徑、控制器、pipeline 與記憶體階層實現。兩顆處理器可以執行相同機器碼，卻有不同的 pipeline 深度與 cache 大小。",
          "判斷一項特徵屬於哪一層時，可問：既有機器碼是否必須知道它？若答案是肯定的，通常屬於 ISA；若只影響速度、功耗或面積，而不改變程式結果，通常屬於微架構。"
        ]
      },
      {
        title: "von Neumann 模型與指令週期",
        paragraphs: [
          "典型儲存程式電腦把指令與資料放在可定址的記憶體中。CPU 以 PC 指向下一個指令位址，取出指令後解碼，讀取運算元，執行運算，必要時存取資料記憶體，最後更新架構狀態。",
          "這個模型的重要性不在於每顆現代處理器都只有一條匯流排，而在於它提供了可追蹤的狀態轉移：每完成一個指令，PC、暫存器或記憶體中的某些值被更新。Pipeline 只是讓多個指令的不同階段重疊，不能破壞 ISA 所要求的結果。"
        ]
      }
    ],
    diagram: {
      type: "flow",
      title: "從程式語意到電路狀態",
      items: ["高階程式", "編譯器與組譯器", "ISA 機器指令", "微架構資料路徑", "數位邏輯與電路"],
      caption: "向右是逐步降低抽象層次；向左則是下層為上層提供穩定介面。"
    },
    worked: {
      title: "追蹤 x = x + A[i]",
      prompt: "假設 x、i 與陣列基底位址已在暫存器中，辨認這個敘述需要的硬體動作。",
      steps: [
        "用 i × 元素大小計算位移，再與 A 的基底位址相加。",
        "由資料記憶體讀出 A[i]，暫時放入暫存器。",
        "ALU 將 x 與 A[i] 相加，結果寫回保存 x 的暫存器。",
        "每一條機器指令本身也必須先由 PC 指定的位置取出並解碼。"
      ],
      result: "一行高階敘述至少跨越位址計算、記憶體讀取與算術運算；這正是 ISA 連接程式與硬體的作用。"
    },
    pitfalls: ["把 ISA 當成特定處理器內部電路圖。", "以為 pipeline 會改變程式可觀察到的指令順序與結果。", "只記元件名稱，卻沒有追蹤哪些架構狀態被更新。"],
    selfTest: [
      { q: "同一份 MIPS 機器碼能在單週期與 pipeline 處理器執行嗎？", a: "可以，只要兩者都正確實作相同 MIPS ISA。它們的執行時間與內部時序可以不同。" },
      { q: "PC 屬於程式可觀察的架構狀態嗎？", a: "PC 決定下一個指令位址，控制流程與例外行為會依賴它，因此在概念上屬於架構狀態。" }
    ]
  },
  {
    week: 2,
    bridge: "效能不是單一規格值，而是工作量、每項工作所需週期與每個週期長度的乘積。先把因素拆開，才能判斷最佳化真正改變了哪一項。",
    sections: [
      {
        title: "三個乘數各由誰影響",
        paragraphs: [
          "Instruction Count 受演算法、程式、編譯器與 ISA 影響；CPI 受指令組合、資料路徑、pipeline hazard 與 memory stall 影響；Clock Cycle Time 受最慢組合邏輯路徑與電路技術影響。",
          "比較處理器時必須使用同一工作負載。若程式、編譯器選項或輸入資料不同，三個乘數可能一起改變，單看 clock rate 或核心數沒有足夠資訊。"
        ]
      },
      {
        title: "平均值、Speedup 與 Amdahl 上限",
        paragraphs: [
          "平均 CPI 是動態指令比例的加權平均，不是各類 CPI 的普通平均。若 load 佔 25% 且成本很高，它對總時間的影響必須乘上 0.25。",
          "Amdahl's Law 把總時間分為可改善與不可改善兩部分。即使可改善部分變成無限快，整體 speedup 仍不會超過 1/(1-F)。因此最佳化的第一步是量測時間比例，而不是先挑看起來最先進的元件。"
        ]
      }
    ],
    diagram: {
      type: "factor",
      title: "CPU 執行時間的三個乘數",
      items: [
        { label: "Instruction Count", detail: "演算法、編譯器、ISA" },
        { label: "CPI", detail: "指令組合、hazard、cache miss" },
        { label: "Cycle Time", detail: "關鍵路徑、電路技術" }
      ],
      caption: "CPU Time = Instruction Count × CPI × Clock Cycle Time。三項任一降低都可能加速，但也可能彼此牽制。"
    },
    worked: {
      title: "先求平均 CPI，再求 CPU Time",
      prompt: "某程式有 10^9 條指令：ALU 50%（CPI 1）、load/store 30%（CPI 2）、branch 20%（CPI 3），clock rate 為 2 GHz。",
      steps: [
        "平均 CPI = 0.50×1 + 0.30×2 + 0.20×3 = 1.7。",
        "總 cycles = 10^9 × 1.7 = 1.7×10^9 cycles。",
        "CPU Time = 1.7×10^9 / 2×10^9 = 0.85 秒。",
        "若只把 branch CPI 從 3 降到 1，新的平均 CPI 為 1.3，CPU Time 為 0.65 秒。"
      ],
      result: "Speedup = 0.85/0.65 ≈ 1.31，而不是 3 倍，因為 branch 只佔全部指令的 20%。"
    },
    pitfalls: ["將 GHz 直接當成程式效能。", "對不同指令類型的 CPI 做未加權平均。", "把 speedup 30% 誤寫成執行時間減少 30%；兩者分母不同。"],
    selfTest: [
      { q: "一段程式變成原來的 2 倍快，新時間是多少？", a: "Speedup = Told/Tnew = 2，所以 Tnew = Told/2，時間減少 50%。" },
      { q: "若可改善部分 F=0.8，即使它無限快，最大 speedup 是多少？", a: "1/(1-0.8)=5。剩下 20% 的不可改善時間形成上限。" }
    ]
  },
  {
    week: 3,
    bridge: "位元沒有天生的資料型態。正確解讀必須同時知道位元寬度、signedness、編碼規則與 byte 順序；少掉任何一項都可能得到另一個完全不同的值。",
    sections: [
      {
        title: "Two's complement 的權重觀點",
        paragraphs: [
          "n-bit two's complement 的最高位權重是 -2^(n-1)，其餘位元仍是正的 2 的冪。這個觀點可直接解讀負數，不必每次都取反加一。例如 11010110 的值是 -128+64+16+4+2=-42。",
          "Carry out 是無號加法超出 n bits 的訊號；signed overflow 則表示有號結果超出可表示範圍。兩者判斷的數學模型不同，不能互換。"
        ]
      },
      {
        title: "Byte address 與 Endianness",
        paragraphs: [
          "Byte-addressed memory 中每個位址指向 8 bits。32-bit word 會佔用四個連續位址。Little endian 把最低有效 byte 放在最低位址，big endian 則把最高有效 byte 放在最低位址。",
          "Endianness 不會顛倒一個 byte 內的 bit，也不會改變暫存器看到的數值。它只在多 byte 資料被拆到記憶體或通訊封包時產生差異。"
        ]
      }
    ],
    diagram: {
      type: "bits",
      title: "8-bit two's complement 權重",
      items: [
        { label: "b7", bits: 1, detail: "-128" }, { label: "b6", bits: 1, detail: "64" },
        { label: "b5", bits: 1, detail: "32" }, { label: "b4", bits: 1, detail: "16" },
        { label: "b3", bits: 1, detail: "8" }, { label: "b2", bits: 1, detail: "4" },
        { label: "b1", bits: 1, detail: "2" }, { label: "b0", bits: 1, detail: "1" }
      ],
      totalBits: 8,
      caption: "最高位不是單純的正負標記，而是具有 -128 權重；因此 8-bit 範圍為 -128 到 127。"
    },
    worked: {
      title: "同一位元樣式的三種解讀",
      prompt: "解讀 8-bit pattern 11010110，並排列 0x12345678 在 little-endian memory 的四個 bytes。",
      steps: [
        "Unsigned：128+64+16+4+2 = 214。",
        "Signed two's complement：214-256 = -42。",
        "若只當作單一 8-bit code，其語意還需由字元集或通訊協定決定。",
        "0x12345678 的 bytes 為 12、34、56、78；little endian 由低位址起依序存 78、56、34、12。"
      ],
      result: "位元樣式相同不代表值相同；metadata 與使用情境決定解讀。"
    },
    pitfalls: ["把 sign bit 當成 signed-magnitude 的正負號。", "用 carry out 判斷 signed overflow。", "把 little endian 誤解為每個 byte 的 bits 也反向。"],
    selfTest: [
      { q: "8-bit 11111111 分別代表多少 unsigned 與 signed 值？", a: "Unsigned 是 255；two's complement signed 是 -1。" },
      { q: "兩個負數相加得到正數時，carry out 一定能指出 overflow 嗎？", a: "不能只看 carry out。Signed overflow 應看兩個 operand 同號而結果異號。" }
    ]
  },
  {
    week: 4,
    bridge: "MIPS 將複雜程式拆成少數規則一致的基本操作。學習重點不是背語法，而是每行指令讀了哪些暫存器、寫了哪個暫存器，以及何時必須經過記憶體。",
    sections: [
      {
        title: "Register file 與三運算元指令",
        paragraphs: [
          "典型 MIPS register file 可同時讀兩個來源暫存器並寫一個目的暫存器，正好支援 add rd, rs, rt。目的與來源分離，可保留原始 operand，也讓編譯器更容易安排中間值。",
          "$zero 的讀值固定為 0，寫入會被忽略。它讓 move、清零、比較與無條件分支可由既有指令組合完成，減少特殊硬體路徑。"
        ]
      },
      {
        title: "Load-store 的規則性",
        paragraphs: [
          "算術指令只讀寫暫存器；只有 load/store 在暫存器與記憶體之間搬移資料。這使 ALU 指令具有一致的 operand 位置與執行流程，也降低 pipeline 控制複雜度。",
          "代價是高階語言的一個運算可能需要額外的 load 與 store。效能取決於編譯器是否能把常用值留在暫存器，以及 memory hierarchy 是否能快速提供資料。"
        ]
      }
    ],
    diagram: {
      type: "flow",
      title: "Load-store 資料流",
      items: ["Memory 中的變數", "lw 載入", "Register operands", "ALU 運算", "Register result", "sw 儲存"],
      caption: "ALU 不直接讀寫主記憶體；資料先進暫存器，計算後才由 store 寫回。"
    },
    worked: {
      title: "將 f = (g + h) - i 翻成 MIPS",
      prompt: "令 f、g、h、i 分別位於 $s0、$s1、$s2、$s3。",
      steps: [
        "先計算 g+h：add $t0, $s1, $s2。",
        "再減去 i：sub $s0, $t0, $s3。",
        "$t0 是短暫中間值；最後結果才寫入保存 f 的 $s0。"
      ],
      result: "兩條 R-format 指令足以完成，且每條都只有 register operands。"
    },
    pitfalls: ["把目的暫存器放在指令最後。", "以為 $t 與 $s 是硬體功能不同的暫存器；差異主要是 calling convention。", "讓 add 直接使用 memory address 當 operand。"],
    selfTest: [
      { q: "為何 move $t0,$t1 可由 add $t0,$t1,$zero 表示？", a: "$zero 的值固定為 0，所以加零不改變 $t1，結果寫入 $t0。" },
      { q: "Register allocation 失敗而 spill 時，會增加哪些指令？", a: "需要額外的 load/store 在暫存器與 stack memory 之間搬移值。" }
    ]
  },
  {
    week: 5,
    bridge: "記憶體存取與控制流程看似是兩組指令，其實都依賴 ALU 做位址計算。掌握 base+offset、PC-relative 與 byte addressing，陣列和迴圈就能用同一套方法分析。",
    sections: [
      {
        title: "有效位址與資料大小",
        paragraphs: [
          "lw rt, offset(base) 先將 16-bit offset 做 sign extension，再由 ALU 與 base register 相加，所得結果是 byte address。Offset 可以是負數，因此 stack frame 兩側或結構欄位都能表示。",
          "陣列 index 必須先乘上元素大小。int32 元素相差 4 bytes，因此 A[i] 位址是 base+4i；byte array 的元素則相差 1。Alignment 規則可讓硬體以較少次數完成存取。"
        ]
      },
      {
        title: "Branch 與 PC-relative 位址",
        paragraphs: [
          "MIPS branch target 通常是 PC+4 + (sign-extended immediate << 2)。左移兩位是因為指令 4-byte aligned，欄位不需儲存永遠為 00 的最低兩位。",
          "Loop 的可靠閱讀方式是先找 back edge，再判斷 branch 是繼續迴圈還是離開。把每個 label 視為控制流程圖節點，比逐字翻譯更不容易顛倒條件。"
        ]
      }
    ],
    diagram: {
      type: "flow",
      title: "lw 的有效位址計算",
      items: ["Base register", "16-bit offset", "Sign extension", "ALU 加法", "Byte address", "Data memory"],
      caption: "Offset 的單位是 byte；lw 一次傳回 4 bytes，但位址仍以 byte 編號。"
    },
    worked: {
      title: "計算 A[7] 的位址",
      prompt: "A 是 int32 陣列，base address = 0x10010000，求 A[7] 位址並寫出核心指令。",
      steps: [
        "每個元素 4 bytes，因此位移 = 7×4 = 28 = 0x1C。",
        "有效位址 = 0x10010000 + 0x1C = 0x1001001C。",
        "若 base 在 $s0，可用 lw $t0, 28($s0)。"
      ],
      result: "Offset 28 是 byte 數，不是第 28 個 word。"
    },
    pitfalls: ["忘記 index 乘上元素大小。", "將 branch immediate 直接當 byte offset。", "把 pseudo-instruction 當成新增的硬體指令格式。"],
    selfTest: [
      { q: "為何 offset 需要 sign extension？", a: "有效位址可能位於 base 前方，負 offset 常見於 stack 與資料結構存取。" },
      { q: "若 char array base 在 $s0，讀 A[7] 的 offset 是多少？", a: "是 7，因為每個 char 佔 1 byte。" }
    ]
  },
  {
    week: 6,
    bridge: "函式呼叫的本質是跨越控制流程邊界仍要維持狀態契約。Calling convention 規定誰保存什麼；instruction cycle 則說明每個保存與跳躍動作如何由硬體完成。",
    sections: [
      {
        title: "Stack frame 是有生命週期的記憶體區域",
        paragraphs: [
          "函式進入時先降低 $sp 配置 frame，再把必須保留的 $ra、$s registers 與 local values 寫入固定 offset。回傳前必須以相反順序恢復內容並將 $sp 加回原值。",
          "Caller-saved 表示呼叫者若仍需要某值，必須在 jal 前保存；callee-saved 表示被呼叫者只要改動該暫存器，就必須先保存、後恢復。兩者共同避免不必要的全部保存。"
        ]
      },
      {
        title: "Fetch-Decode-Execute 的狀態轉移",
        paragraphs: [
          "Fetch 使用 PC 讀 instruction memory 並形成 PC+4；Decode 解析 opcode 與 register fields；Execute 由 ALU 運算或計算位址；Memory 階段處理 load/store；Write back 更新 register file。",
          "不是每種指令都需要所有結果。例如 sw 不寫 register，R-format 不讀 data memory。將流程拆成共同階段，是後續 pipeline 能重疊執行的基礎。"
        ]
      }
    ],
    diagram: {
      type: "flow",
      title: "一個函式呼叫的控制與狀態",
      items: ["Caller 準備參數", "jal 寫入 $ra", "配置 stack frame", "執行 callee", "恢復 frame", "jr $ra 回傳"],
      caption: "任何巢狀呼叫都可能覆寫 $ra，因此需要由 stack 保存尚未使用的 return address。"
    },
    worked: {
      title: "為何 nested call 必須保存 $ra",
      prompt: "main 以 jal f 呼叫 f，而 f 內又以 jal g 呼叫 g。",
      steps: [
        "main 的 jal 把 main 返回位置寫入 $ra。",
        "f 若直接執行 jal g，$ra 會被 g 的返回位置覆蓋。",
        "因此 f 在呼叫 g 前先把原 $ra 存入自己的 stack frame。",
        "g 返回後，f 從 stack 恢復原 $ra，最後才能回到 main。"
      ],
      result: "$ra 只有一個；遞迴與巢狀呼叫需要 stack 保存每一層尚未完成的返回位置。"
    },
    pitfalls: ["配置 frame 後仍使用配置前的 offset。", "恢復 $sp 的大小與配置大小不一致。", "有 nested call 卻沒有保存 $ra。"],
    selfTest: [
      { q: "若 leaf function 不呼叫其他函式，是否一定要保存 $ra？", a: "不一定。若它不改寫 $ra 且不需使用 stack，可直接 jr $ra。" },
      { q: "sw 指令的五階段中，WB 會寫什麼？", a: "不寫 register；對 sw 而言，真正的架構更新在 MEM 階段寫入資料記憶體。" }
    ]
  },
  {
    week: 7,
    bridge: "固定寬度整數追求精確但範圍有限；浮點數以有限有效位數換取極大動態範圍。理解兩者的錯誤條件，才能知道硬體旗標與程式數值何時可信。",
    sections: [
      {
        title: "Adder、Carry 與 Overflow",
        paragraphs: [
          "A-B 可由 A+(~B)+1 完成，因此加法器只需用控制訊號決定是否反相 B 並設定初始 carry-in。Unsigned overflow 看最高位 carry out；signed overflow 看同號 operands 是否產生異號結果。",
          "乘法的完整結果可能需要兩倍位元寬度。若只保留低 n bits，程式必須知道高位是否被捨棄；除法則同時產生 quotient 與 remainder。"
        ]
      },
      {
        title: "IEEE 754 的範圍與精度",
        paragraphs: [
          "Normalized single precision 的值為 (-1)^s × 1.f × 2^(E-127)。隱藏的 leading 1 不佔 fraction 欄位，因此 23-bit fraction 提供 24 bits 的有效精度。",
          "Exponent 全 0 用於 zero 與 subnormal；全 1 用於 infinity 與 NaN。浮點加法前必須對齊 exponent，較小數的 significand 右移後可能失去低位，這是吸收與 rounding error 的來源。"
        ]
      }
    ],
    diagram: {
      type: "bits",
      title: "IEEE 754 single precision",
      items: [
        { label: "Sign", bits: 1, detail: "正負" },
        { label: "Exponent", bits: 8, detail: "bias 127" },
        { label: "Fraction", bits: 23, detail: "有效位數" }
      ],
      totalBits: 32,
      caption: "Normalized value = (-1)^sign × 1.fraction × 2^(exponent-127)。"
    },
    worked: {
      title: "解讀 0xC1200000",
      prompt: "將 IEEE 754 single pattern 0xC1200000 轉為十進位。",
      steps: [
        "最高位 sign=1，所以結果為負。",
        "Exponent bits 對應 130，因此實際 exponent = 130-127 = 3。",
        "Fraction 形成 significand 1.25。",
        "值 = -1.25×2^3 = -10.0。"
      ],
      result: "欄位拆解順序應固定為 sign、biased exponent、significand，最後才合成數值。"
    },
    pitfalls: ["把 carry out 當 signed overflow。", "忘記 normalized number 的 hidden 1。", "假設浮點加法符合實數的結合律。"],
    selfTest: [
      { q: "兩個正的 8-bit signed 數相加得到負數，發生什麼事？", a: "發生 signed overflow；真實數學結果超過 127。" },
      { q: "Exponent 全 1 且 fraction 非 0 代表什麼？", a: "代表 NaN；若 fraction 為 0 則是正或負 infinity。" }
    ]
  },
  {
    week: 8,
    bridge: "指令格式是控制器讀取的契約。每個欄位不只代表一個數字，也決定 register file 讀寫埠、immediate 延伸方式、ALU 功能與下一個 PC 的來源。",
    sections: [
      {
        title: "固定長度與欄位折衷",
        paragraphs: [
          "固定 32-bit 讓 PC 通常每次加 4，也讓 instruction memory 與 decode 邊界規則一致。代價是 opcode、register 與 immediate 必須共享固定空間，immediate 範圍受到限制。",
          "R-format 以 funct 擴充 opcode=0 的 ALU 操作；I-format 犧牲一個 register 欄位換取 16-bit immediate；J-format 以更大的 target field 支援較遠跳躍。"
        ]
      },
      {
        title: "Decode 到控制訊號",
        paragraphs: [
          "Opcode 先決定大類控制，例如是否讀 data memory、是否寫 register、ALU 第二個 operand 來自 register 或 immediate。R-format 再用 funct 決定 add、sub、and、or 或 slt。",
          "編碼題最穩定的方法是先填十進位 register number，再依欄位寬度轉成二進位，最後每四 bits 分組轉十六進位。不要直接心算整個 32-bit pattern。"
        ]
      }
    ],
    diagram: {
      type: "bits",
      title: "MIPS R-format 欄位",
      items: [
        { label: "opcode", bits: 6, detail: "大類" }, { label: "rs", bits: 5, detail: "來源 1" },
        { label: "rt", bits: 5, detail: "來源 2" }, { label: "rd", bits: 5, detail: "目的" },
        { label: "shamt", bits: 5, detail: "位移量" }, { label: "funct", bits: 6, detail: "ALU 功能" }
      ],
      totalBits: 32,
      caption: "6+5+5+5+5+6=32 bits；每個 5-bit register field 可指定 32 個暫存器。"
    },
    worked: {
      title: "編碼 add $t0,$s1,$s2",
      prompt: "$s1=17、$s2=18、$t0=8，add funct=32。",
      steps: [
        "opcode=000000；rs=10001；rt=10010。",
        "rd=01000；shamt=00000；funct=100000。",
        "串接為 000000 10001 10010 01000 00000 100000。",
        "每四 bits 分組得到 0x02324020。"
      ],
      result: "Decode 時 opcode=0 指向 R-format，再由 funct=32 選擇加法。"
    },
    pitfalls: ["把組合語言 operand 順序直接當成 rs、rt、rd 順序。", "忘記 register number 必須補足 5 bits。", "將 branch offset 當成絕對位址。"],
    selfTest: [
      { q: "5-bit register field 最多能指定多少暫存器？", a: "2^5=32 個。" },
      { q: "為何 lw 的 immediate 要 sign extension？", a: "Base+offset addressing 需要支援 base 前後的位址，所以 offset 可為負數。" }
    ]
  },
  {
    week: 9,
    bridge: "期中整合的核心不是多做相同題型，而是建立固定解題流程：先辨認模型，再列出已知量與單位，逐步更新狀態，最後用另一種觀點檢查答案。",
    sections: [
      {
        title: "四類題目的共同策略",
        paragraphs: [
          "效能題先寫 CPU Time 公式；資料表示題先寫位元寬度與 signedness；MIPS 題先建立變數到暫存器的對照；編碼題先畫欄位邊界。把假設寫在答案上，能避免大多數單位與解讀錯誤。",
          "完成計算後要做量級檢查：GHz 的 cycle time 應在 ns 等級，32-bit 指令應恰好 8 個 hex digits，aligned word address 最低兩 bits 應為 00。"
        ]
      },
      {
        title: "從結果反推合理性",
        paragraphs: [
          "若 clock 更快但程式反而更慢，檢查 instruction count 或 CPI 是否增加；若負數 sign extension 後變正，檢查最高位是否複製；若 loop 永不結束，檢查 branch 條件與 index 更新。",
          "自學時先遮住答案完整做一次，再用答案只定位第一個分歧步驟。直接閱讀完整解答容易產生熟悉感，卻無法驗證自己是否能獨立建立模型。"
        ]
      }
    ],
    diagram: {
      type: "matrix",
      title: "期中題型與可驗證證據",
      columns: ["題型", "第一步", "最後檢查"],
      rows: [
        ["效能", "寫 CPU Time", "單位與 speedup"],
        ["資料表示", "標位元寬度", "範圍與符號"],
        ["MIPS", "標暫存器用途", "逐行狀態"],
        ["指令編碼", "畫欄位", "總和 32 bits"]
      ],
      caption: "每類題目都要留下可回查的中間證據，而不是只寫最後數字。"
    },
    worked: {
      title: "整合比較兩個編譯結果",
      prompt: "A：1.2×10^9 instructions、CPI 2、4 GHz；B：1.0×10^9 instructions、CPI 1.8、3 GHz。",
      steps: [
        "A cycles = 1.2×10^9×2 = 2.4×10^9，時間 = 0.6 秒。",
        "B cycles = 1.0×10^9×1.8 = 1.8×10^9，時間 = 0.6 秒。",
        "A clock rate 較高，但 instruction count 與 CPI 的乘積也較高。"
      ],
      result: "兩者同快。任何只引用 clock rate、instruction count 或 CPI 單一數值的結論都不完整。"
    },
    pitfalls: ["跳過公式直接代數字。", "把 register 名稱與 register number 混用。", "看到熟悉題目便略過位元寬度或單位。"],
    selfTest: [
      { q: "3 GHz 的 clock cycle time 是多少？", a: "1/(3×10^9) 秒，約 0.333 ns。" },
      { q: "32-bit 指令完整寫成十六進位需要幾位？", a: "8 位，因為每個 hex digit 代表 4 bits。" }
    ]
  },
  {
    week: 10,
    bridge: "單週期 datapath 是一張因果圖：指令欄位提供位址與控制輸入，資料穿過 register file、ALU 與 memory，mux 在每個分岔點選擇正確來源。追蹤一條指令時，只保留它真正使用的路徑。",
    sections: [
      {
        title: "由 Register Transfer 描述指令",
        paragraphs: [
          "R-format 可寫成 R[rd] ← R[rs] op R[rt]；lw 可寫成 R[rt] ← Mem[R[rs]+signext(imm)]；sw 則是 Mem[R[rs]+signext(imm)] ← R[rt]。這些描述直接指出來源、運算與目的。",
          "Datapath 圖中的每個 mux 都對應一個選擇問題：目的 register 是 rt 或 rd？ALU operand 來自 rt 或 immediate？寫回資料來自 ALU 或 memory？下一個 PC 是 PC+4 或 branch target？"
        ]
      },
      {
        title: "關鍵路徑決定 Clock Period",
        paragraphs: [
          "單週期設計要求最慢指令也在一個 cycle 內完成。lw 通常依序經 instruction memory、register read、ALU、data memory 與 write-back mux，因此比只經 ALU 的 add 更慢。",
          "即使 add 提早得到結果，也必須等共同 cycle 結束才能開始下一指令。單週期的簡單控制換來較長 clock period，這正是 pipeline 要改善的限制。"
        ]
      }
    ],
    diagram: {
      type: "flow",
      title: "lw 在單週期資料路徑中的主路徑",
      items: ["PC", "Instruction Memory", "Register File", "ALU 算位址", "Data Memory", "MemtoReg Mux", "Register File 寫回"],
      caption: "PC+4 與控制訊號在旁路同步產生；此圖只畫 lw 的資料主路徑。"
    },
    worked: {
      title: "為四種指令判斷關鍵控制",
      prompt: "比較 add、lw、sw、beq 的 RegWrite、MemRead、MemWrite 與 ALUSrc。",
      steps: [
        "add：RegWrite=1、ALUSrc=0，不讀寫 data memory。",
        "lw：RegWrite=1、MemRead=1、ALUSrc=1，寫回來源為 memory。",
        "sw：RegWrite=0、MemWrite=1、ALUSrc=1。",
        "beq：RegWrite=0、ALUSrc=0，ALU 比較兩個 registers，Branch=1。"
      ],
      result: "控制訊號不是獨立背誦項目，而是由 register-transfer 行為反推。"
    },
    pitfalls: ["把 instruction memory 與 data memory 的角色混在一起。", "認為 sw 需要 RegWrite。", "忽略 lw 的最長路徑對所有指令 clock period 的影響。"],
    selfTest: [
      { q: "為何 lw 的 ALUSrc 通常為 1？", a: "ALU 第二個 operand 是 sign-extended immediate，用來和 base register 相加。" },
      { q: "beq 需要 data memory 嗎？", a: "不需要。它用 ALU 比較 registers，並以比較結果決定 PC。" }
    ]
  },
  {
    week: 11,
    bridge: "Pipeline 將一條長組合路徑切成多段，讓不同指令同時占用不同 stage。它主要提高穩態 throughput；單一指令仍要穿過所有 stage，latency 不會因理想五級 pipeline 直接縮成五分之一。",
    sections: [
      {
        title: "Pipeline register 的必要性",
        paragraphs: [
          "每個 stage 結束時，pipeline register 保存下一 stage 所需的 data 與 control。若只保存 ALU operand 卻漏掉目的 register number，後面的 WB 就不知道寫到哪裡。",
          "Pipeline clock period 約等於最慢 stage delay 加 pipeline-register overhead。切得更深可縮短組合邏輯，但 register overhead、hazard 與 branch penalty 也會增加。"
        ]
      },
      {
        title: "Fill、Steady State 與 Drain",
        paragraphs: [
          "理想 k-stage pipeline 執行 n 條指令需要 k+n-1 cycles。前 k-1 cycles 正在填滿，之後可達每 cycle 完成一條，最後再排空。",
          "當 n 很大且 stages 平衡，speedup 才接近 k。短程式、stage 不平衡與 stalls 都會使實際 speedup 低於理想值。"
        ]
      }
    ],
    diagram: {
      type: "timeline",
      title: "理想五級 Pipeline 時序",
      columns: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      rows: [
        { label: "I1", cells: ["IF", "ID", "EX", "MEM", "WB", "", "", "", ""] },
        { label: "I2", cells: ["", "IF", "ID", "EX", "MEM", "WB", "", "", ""] },
        { label: "I3", cells: ["", "", "IF", "ID", "EX", "MEM", "WB", "", ""] },
        { label: "I4", cells: ["", "", "", "IF", "ID", "EX", "MEM", "WB", ""] },
        { label: "I5", cells: ["", "", "", "", "IF", "ID", "EX", "MEM", "WB"] }
      ],
      caption: "5 條指令在理想五級 pipeline 中需要 5+5-1=9 cycles。"
    },
    worked: {
      title: "計算含 Pipeline-register overhead 的 Speedup",
      prompt: "非 pipeline 每條指令需 5×200 ps。Pipeline 每 stage 邏輯 200 ps，register overhead 20 ps；執行 100 條指令。",
      steps: [
        "非 pipeline 時間 = 100×1000 ps = 100,000 ps。",
        "Pipeline clock = 200+20 = 220 ps。",
        "Pipeline cycles = 5+100-1 = 104。",
        "Pipeline 時間 = 104×220 = 22,880 ps。"
      ],
      result: "Speedup ≈ 100,000/22,880 = 4.37，低於理想 5 倍。"
    },
    pitfalls: ["把 throughput 改善直接當成單指令 latency 改善。", "忘記 k+n-1 的 fill/drain cycles。", "只傳 data，不把 control signals 帶過 pipeline registers。"],
    selfTest: [
      { q: "理想 5-stage pipeline 執行 20 條指令需幾 cycles？", a: "5+20-1=24 cycles。" },
      { q: "為何 stage 不平衡會限制 clock rate？", a: "所有 stages 共用同一 clock period，必須容納最慢 stage 加 register overhead。" }
    ]
  },
  {
    week: 12,
    bridge: "Hazard 是下一條指令在預定 cycle 無法取得正確資料或正確 PC。處理方式只有三類：提早提供結果、延後使用者，或推測後在錯誤時清除。",
    sections: [
      {
        title: "RAW 與 Forwarding 的時序條件",
        paragraphs: [
          "五級 in-order MIPS 最常見的是 read-after-write。ALU 結果在 EX 後可從 EX/MEM 或 MEM/WB register forwarding 到下一指令的 EX input，不必等到 WB 寫回 register file。",
          "Load 的資料到 MEM 結束才取得。緊接的使用者在下一 cycle 進 EX 時仍太早，因此即使有 forwarding，典型 load-use pair 仍需一個 stall。"
        ]
      },
      {
        title: "Control Hazard 與精確狀態",
        paragraphs: [
          "Branch 結果確定前，fetch 不知道正確下一個 PC。Predict-not-taken 可先取 PC+4；若判斷錯誤，必須 flush 已進入 pipeline 的錯誤路徑指令。",
          "Flush 的關鍵是阻止錯誤指令更新架構狀態，例如將它們的 RegWrite、MemWrite 控制變為 0。只丟棄指令文字而未清除控制，仍可能破壞結果。"
        ]
      }
    ],
    diagram: {
      type: "timeline",
      title: "Load-use Hazard 的一個 Stall",
      columns: ["1", "2", "3", "4", "5", "6", "7", "8"],
      rows: [
        { label: "lw", cells: ["IF", "ID", "EX", "MEM", "WB", "", "", ""] },
        { label: "add", cells: ["", "IF", "ID", "STALL", "EX", "MEM", "WB", ""] },
        { label: "next", cells: ["", "", "IF", "STALL", "ID", "EX", "MEM", "WB"] }
      ],
      caption: "lw 資料在 cycle 4 的 MEM 結束後可 forwarding 給 add 在 cycle 5 的 EX。"
    },
    worked: {
      title: "估算 Branch Misprediction 對 CPI 的影響",
      prompt: "Branch 佔 20%，misprediction rate 10%，每次錯誤 penalty 3 cycles，base CPI=1。",
      steps: [
        "每條指令成為錯誤 branch 的機率 = 0.20×0.10 = 0.02。",
        "平均額外 cycles/instruction = 0.02×3 = 0.06。",
        "新 CPI = 1+0.06 = 1.06。"
      ],
      result: "Penalty 必須乘 branch frequency 與 misprediction rate，不能對所有指令直接加 3。"
    },
    pitfalls: ["認為 forwarding 能消除所有 RAW hazards。", "把 stall 與 flush 當成相同動作。", "計算 branch cost 時漏乘 branch frequency。"],
    selfTest: [
      { q: "為何 lw 後立刻使用通常仍需 stall？", a: "Load data 到 MEM 結束才可用，比下一指令原定 EX 所需時間晚一個 cycle。" },
      { q: "Flush 應如何避免錯誤指令改變狀態？", a: "將錯誤指令後續會寫 register 或 memory 的控制訊號清為 0。" }
    ]
  },
  {
    week: 13,
    bridge: "Memory hierarchy 利用 locality，讓少量快速儲存體保存近期最可能使用的 blocks。它不是讓所有存取都變快，而是讓常見路徑很快、少數 miss 承擔較大代價。",
    sections: [
      {
        title: "Temporal 與 Spatial Locality",
        paragraphs: [
          "Temporal locality 表示最近使用的資料可能再次使用，例如 loop counter；spatial locality 表示鄰近位址可能很快被使用，例如循序掃描陣列。Cache 以 block 為傳輸單位，同時利用兩者。",
          "Locality 是程式行為，不是 cache 自動保證。隨機追蹤大型 linked structure 可能缺乏 spatial locality；working set 大於 cache 時，temporal reuse 也可能在重用前被替換。"
        ]
      },
      {
        title: "AMAT 與 Miss 分類",
        paragraphs: [
          "AMAT = hit time + miss rate × miss penalty。Hit time 每次存取都支付；miss penalty 只在 miss 時支付，通常指超出 hit time 的額外延遲。",
          "Compulsory miss 是 block 第一次出現；capacity miss 是工作集合超過 cache 容量；conflict miss 是 mapping 限制讓仍有總空間的 cache 發生碰撞。增加 associativity 主要降低 conflict misses。"
        ]
      }
    ],
    diagram: {
      type: "hierarchy",
      title: "Memory Hierarchy 的相對關係",
      items: [
        { label: "Registers", detail: "最小、最快、由指令直接指定" },
        { label: "L1 / L2 Cache", detail: "以 block 自動搬移" },
        { label: "Main Memory", detail: "容量較大、miss penalty 明顯" },
        { label: "SSD / Storage", detail: "持久保存、延遲最高" }
      ],
      caption: "由上而下容量增加、每 bit 成本降低、延遲上升；圖示為概念相對關係，不代表固定硬體數值。"
    },
    worked: {
      title: "AMAT 與單位檢查",
      prompt: "Cache hit time=1 ns、miss rate=5%、miss penalty=40 ns。",
      steps: [
        "將 5% 寫成 0.05。",
        "平均 miss 額外成本 = 0.05×40 ns = 2 ns。",
        "AMAT = 1+2 = 3 ns。",
        "結果應介於 1 ns 與 41 ns 之間，3 ns 的量級合理。"
      ],
      result: "若把 5 直接代入會得到 201 ns，量級檢查能立即發現百分比錯誤。"
    },
    pitfalls: ["把 miss rate 的百分比直接當整數代入。", "以為 block 越大一定越好。", "把 conflict miss 誤認為 cache 總容量不足。"],
    selfTest: [
      { q: "循序讀取大型陣列主要利用哪種 locality？", a: "Spatial locality，因為連續元素位址相鄰。" },
      { q: "提高 associativity 最直接減少哪類 miss？", a: "Conflict miss。Compulsory miss 通常不因此消失。" }
    ]
  },
  {
    week: 14,
    bridge: "Cache line 不只有 data。Tag 說明它代表哪個 memory block，valid 說明內容是否可用，dirty 說明 write-back line 是否比 memory 新。寫入策略必須同時回答 hit 與 miss 兩種情況。",
    sections: [
      {
        title: "Read Hit、Read Miss 與 Line Fill",
        paragraphs: [
          "Read hit 先以 index 找 set，再比較 valid line 的 tag，命中後由 block offset 選出 byte/word。Read miss 則選 victim，必要時先寫回 dirty victim，再從下一層取整個 block 並更新 tag、valid 與 data。",
          "Block size 增加可利用 spatial locality，但會提高 fill 時間、減少 line 數，並可能帶入未使用資料。最佳大小取決於程式存取模式與 memory burst 行為。"
        ]
      },
      {
        title: "Write Policy 必須成對描述",
        paragraphs: [
          "Write-through 在 hit 時同時更新下一層，流量較大但一致性簡單；write-back 只更新 cache 並設 dirty，等替換時才寫回。",
          "Write miss 還要選 write-allocate 或 no-write-allocate。常見搭配是 write-back + write-allocate，以及 write-through + no-write-allocate，但硬體也可依需求採其他組合。"
        ]
      }
    ],
    diagram: {
      type: "matrix",
      title: "Cache 寫入策略比較",
      columns: ["策略", "Write hit", "主要代價"],
      rows: [
        ["Write-through", "Cache 與下一層都更新", "寫入流量較高"],
        ["Write-back", "只更新 cache，設 dirty", "替換 dirty line 時寫回"],
        ["Write-allocate", "Miss 時先取 block", "多一次 line fill"],
        ["No-write-allocate", "Miss 時繞過 cache", "可能失去後續 locality"]
      ],
      caption: "Through/back 回答 hit 如何更新；allocate/no-allocate 回答 miss 是否把 block 帶入 cache。"
    },
    worked: {
      title: "Write-back Line 的狀態變化",
      prompt: "某 line 起初 invalid；先 read miss 載入 block，接著 write hit，最後被替換。",
      steps: [
        "Read miss 完成後：valid=1、dirty=0、tag 設為新 block tag。",
        "Write hit 更新 cache data：valid=1、dirty=1。",
        "替換前發現 dirty=1，先把整個 line 寫回下一層。",
        "載入新 block 後更新 tag，dirty 回到 0。"
      ],
      result: "Dirty bit 只表示 cache 內容是否比下一層新，不表示 line 是否命中；命中仍需 valid 與 tag。"
    },
    pitfalls: ["用 dirty bit 取代 valid bit。", "只寫 write-back，卻未說明 write miss 是否 allocate。", "替換 dirty victim 時漏算 write-back cost。"],
    selfTest: [
      { q: "Cold cache 中 tag 剛好相等就算 hit 嗎？", a: "不算，還必須 valid=1。" },
      { q: "Write-through cache 是否需要 dirty bit？", a: "一般不需要，因為下一層在每次 write hit 時同步更新。" }
    ]
  },
  {
    week: 15,
    bridge: "Mapping 題先由容量求 sets，再由 sets 求 index bits，由 block size 求 offset bits，剩下才是 tag。這個順序能避免把 ways、sets 與 lines 混在一起。",
    sections: [
      {
        title: "Direct、Set-associative 與 Fully Associative",
        paragraphs: [
          "Direct-mapped 每個 memory block 只有一個候選 line；N-way set-associative 有 N 個候選；fully associative 可放在任何 line。候選越多，conflict miss 越少，但 tag comparators、hit mux 與 replacement metadata 越多。",
          "Set-associative cache 先用 index 選出一個 set，再平行比較該 set 每一 way 的 tag。Ways 不是 index 的額外 bits；它們是同一 index 下的多個候選位置。"
        ]
      },
      {
        title: "位址切割公式",
        paragraphs: [
          "Sets = Cache data size / (block size × associativity)。Offset bits = log2(block size bytes)，index bits = log2(sets)，tag bits = address bits - index - offset。",
          "容量題通常指 data capacity，不含 tag、valid、dirty 與 replacement bits。若題目問實際硬體儲存量，必須再把 metadata 加回每一 line。"
        ]
      }
    ],
    diagram: {
      type: "bits",
      title: "32-bit 位址：16 KiB、4-way、64 B block",
      items: [
        { label: "Tag", bits: 20, detail: "辨認 memory block" },
        { label: "Set index", bits: 6, detail: "64 sets" },
        { label: "Block offset", bits: 6, detail: "64 bytes" }
      ],
      totalBits: 32,
      caption: "Sets=16384/(64×4)=64，所以 index=6 bits；offset=log2(64)=6 bits；tag=20 bits。"
    },
    worked: {
      title: "切割位址 0x12345678",
      prompt: "使用上圖 cache 組態，求 offset、set index 與 tag。",
      steps: [
        "Offset = address & 0x3F = 0x38 = 56。",
        "Set index = (address >> 6) & 0x3F = 25。",
        "Tag = address >> 12 = 0x12345。",
        "檢查：20+6+6=32 bits。"
      ],
      result: "此 block 只能放入 set 25，但可放在該 set 的任一個 4 ways。"
    },
    pitfalls: ["用 cache lines 數直接當 sets 數，漏除 associativity。", "認為 way number 來自 address bits。", "把 cache data capacity 與含 metadata 的總儲存量混用。"],
    selfTest: [
      { q: "同容量與 block size 下，4-way 相較 direct-mapped 的 index bits 如何變化？", a: "Sets 減為四分之一，所以 index bits 少 2；相應地 tag bits 多 2。" },
      { q: "64-byte block 需要幾個 offset bits？", a: "log2(64)=6 bits。" }
    ]
  },
  {
    week: 16,
    bridge: "Replacement policy 只在一個 set 有多個 valid 候選且需要騰出空間時生效。多層 cache 分析則要分清 local miss rate 與 global miss rate，才能正確組合平均成本。",
    sections: [
      {
        title: "LRU、FIFO、Random 與近似策略",
        paragraphs: [
          "True LRU 選最久未使用的 line，對 temporal locality 直觀有效，但 ways 增加時需要更多排序狀態與更新邏輯。實際硬體常採 pseudo-LRU 或 random，在成本與命中率間折衷。",
          "FIFO 追蹤進入順序，不等於最近使用順序。某 line 即使剛被 hit，FIFO 仍可能最先替換它。手算時必須明確維護 policy 所需的 metadata。"
        ]
      },
      {
        title: "Local 與 Global Miss Rate",
        paragraphs: [
          "L1 local miss rate 以所有 L1 accesses 為分母；L2 local miss rate 只以送到 L2 的 accesses 為分母。L2 global miss rate 等於 L1 miss rate × L2 local miss rate。",
          "兩層 AMAT 可寫成 L1 hit time + L1 miss rate × (L2 hit time + L2 local miss rate × memory penalty)。括號內是發生 L1 miss 後的條件平均成本。"
        ]
      }
    ],
    diagram: {
      type: "hierarchy",
      title: "兩層 Cache 的條件成本",
      items: [
        { label: "L1 access", detail: "每次 memory access 都支付" },
        { label: "L2 access", detail: "只在 L1 miss 時支付" },
        { label: "Main memory", detail: "只在 L1 與 L2 都 miss 時支付" }
      ],
      caption: "越往下的成本要乘上抵達該層的機率；L2 local miss rate 以 L1 misses 為條件。"
    },
    worked: {
      title: "兩層 Cache AMAT",
      prompt: "L1 hit=1 cycle、L1 miss rate=4%；L2 hit=10 cycles、L2 local miss rate=20%；memory penalty=100 cycles。",
      steps: [
        "發生 L1 miss 後的平均成本 = 10 + 0.20×100 = 30 cycles。",
        "平均 L1 miss 貢獻 = 0.04×30 = 1.2 cycles。",
        "AMAT = 1+1.2 = 2.2 cycles。",
        "L2 global miss rate = 0.04×0.20 = 0.008 = 0.8%。"
      ],
      result: "Memory penalty 只由同時 miss L1 與 L2 的 0.8% accesses 支付。"
    },
    pitfalls: ["Direct-mapped cache 也套用 replacement policy。", "把 FIFO 命中後的 line 移到最新位置。", "將 L2 local miss rate 直接當成所有 accesses 的 miss rate。"],
    selfTest: [
      { q: "為何 true LRU 在高 associativity 時成本高？", a: "需要追蹤與更新同一 set 各 ways 的相對使用順序，狀態與邏輯隨 ways 增加。" },
      { q: "若 L1 miss 10%、L2 local miss 5%，L2 global miss 是多少？", a: "0.10×0.05=0.005，也就是所有 accesses 的 0.5%。" }
    ]
  },
  {
    week: 17,
    bridge: "完整系統分析要把程式、動態指令、pipeline 與 memory behavior 串成同一條證據鏈。先量測瓶頸，再改變一個可解釋因素，最後用 CPU Time 或 AMAT 驗證改善。",
    sections: [
      {
        title: "從 Profile 到因果假設",
        paragraphs: [
          "Profile 告訴我們時間集中在哪些函式、指令或 memory events，但相關不等於因果。若 cache misses 與慢函式同時出現，仍需檢查存取模式、working set 與 stall cycles 是否一致。",
          "好的最佳化假設應能預測可觀察變化，例如 loop interchange 應降低跨列存取、提高 spatial locality，進而降低 miss rate 或 memory stall CPI。"
        ]
      },
      {
        title: "跨層折衷",
        paragraphs: [
          "降低 instruction count 不一定降低 CPU time；較複雜指令可能提高 CPI 或 clock period。提高 block size 可能降低 compulsory miss，卻增加 miss penalty 與 cache pollution。",
          "因此每次結論都要指出固定了哪些條件。效能數字若沒有 workload、輸入大小、編譯選項與硬體組態，就難以重現或比較。"
        ]
      }
    ],
    diagram: {
      type: "flow",
      title: "跨層效能證據鏈",
      items: ["Source 與演算法", "Compiler 產生指令", "ISA 動態指令流", "Pipeline stalls", "Cache / Memory stalls", "CPI 與 CPU Time"],
      caption: "每一層都能提出假設，但最後要回到可量測的時間、CPI、miss rate 或 instruction count。"
    },
    worked: {
      title: "Row-major 矩陣的存取順序",
      prompt: "C 程式以 row-major 儲存 B，內層迴圈固定 j、遞增 k，存取 B[k][j]。",
      steps: [
        "相鄰 k 會跨到 B 的下一列，位址間距是一整列大小。",
        "若一列大於 cache block，連續 iterations 很少使用同一 block 的鄰近元素。",
        "交換迴圈或使用 blocking，可讓短時間內重用一小塊 A、B、C。",
        "驗證時比較最佳化前後的 miss rate、memory stall cycles 與總 CPU time。"
      ],
      result: "最佳化的理由不是『巢狀迴圈比較快』，而是存取順序更符合 memory layout 與 cache block。"
    },
    pitfalls: ["只報 speedup，沒有說明 workload 與 baseline。", "把 profile 的相關性直接當成因果。", "一次改很多因素，導致無法解釋改善來源。"],
    selfTest: [
      { q: "Loop blocking 主要改善哪一種行為？", a: "讓一小塊資料在被替換前重複使用，提升 temporal locality，也常改善 spatial locality。" },
      { q: "Instruction count 降低是否保證 CPU time 降低？", a: "不保證；CPI 或 clock cycle time 可能同時增加。" }
    ]
  },
  {
    week: 18,
    bridge: "期末整合時，先把所有額外成本換成 cycles per instruction，再與 base CPI 相加；最後乘 instruction count 與 cycle time。這能把 branch、data hazard 與 cache miss 放進同一個可驗證模型。",
    sections: [
      {
        title: "建立整合 CPI",
        paragraphs: [
          "CPI_total = CPI_base + data-stall CPI + control-stall CPI + memory-stall CPI。每一項都應由事件頻率乘每次事件 penalty 得到，例如 branch frequency × misprediction rate × penalty。",
          "若 instruction 與 data cache 都可能 miss，需分別依 instruction fetch frequency 與 load/store frequency 計算。所有指令都有一次 instruction fetch，但只有部分指令存取 data cache。"
        ]
      },
      {
        title: "答案的三層檢查",
        paragraphs: [
          "結構檢查：bit fields 是否加總正確、pipeline 是否維持程式相依、cache set 是否由 index 唯一決定。數學檢查：機率是否介於 0 與 1、時間單位是否一致。語意檢查：最終 register 與 memory 結果是否符合原程式。",
          "自學完成的標準不是能認出圖，而是能從空白紙重建：畫出必要元件、標出資料方向、寫出控制條件，再用一個具體指令或位址走完整條路。"
        ]
      }
    ],
    diagram: {
      type: "flow",
      title: "期末整合解題順序",
      items: ["辨認 workload", "計算動態指令", "加入 pipeline penalties", "加入 cache penalties", "得到 CPI", "換算 CPU Time", "檢查單位與狀態"],
      caption: "先把各類事件轉為平均 cycles/instruction，再合併成同一時間模型。"
    },
    worked: {
      title: "整合 Branch 與 Cache Stall",
      prompt: "10^9 instructions、2 GHz、base CPI=1；branch 15%、mispredict 8%、penalty 3；load/store 30%、L1 miss 4%、penalty 50。",
      steps: [
        "Branch stall CPI = 0.15×0.08×3 = 0.036。",
        "Memory stall CPI = 0.30×0.04×50 = 0.60。",
        "Total CPI = 1+0.036+0.60 = 1.636。",
        "CPU Time = 10^9×1.636/(2×10^9) = 0.818 秒。"
      ],
      result: "此例 memory stalls 遠大於 branch stalls，因此優先降低 cache miss 或 miss penalty 較有潛力。"
    },
    pitfalls: ["把 penalty 直接加到 CPI，沒有乘事件頻率。", "對所有指令套用 data-cache miss rate，漏掉 load/store frequency。", "算出時間後沒有回查最終架構狀態是否正確。"],
    selfTest: [
      { q: "為何 instruction-cache miss 不需再乘 load/store frequency？", a: "每條執行中的指令都需要 instruction fetch，因此其基準頻率是每 instruction 一次。" },
      { q: "本例應先改善 branch 還是 memory？", a: "在其他成本相近時，memory stall CPI=0.60，遠大於 branch stall CPI=0.036，優先改善 memory 較可能得到較大整體收益。" }
    ]
  }
];
