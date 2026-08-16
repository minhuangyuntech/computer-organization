const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const supplementSource = fs.readFileSync(path.join(root, "content", "supplements.js"), "utf8");
const fourthEditionSource = fs.readFileSync(path.join(root, "content", "fourth-edition.js"), "utf8");
const chapterSource = fs.readFileSync(path.join(root, "content", "chapters.js"), "utf8");

function extractConst(source, name) {
  const start = source.indexOf(`const ${name} = `);
  if (start === -1) throw new Error(`Cannot find ${name}`);
  const afterEquals = source.indexOf("=", start) + 1;
  const end = source.indexOf(";\n", afterEquals);
  return vm.runInNewContext(`(${source.slice(afterEquals, end).trim()})`);
}

const lectures = extractConst(appSource, "lectures");
const formulas = extractConst(appSource, "formulas");
const registers = extractConst(appSource, "registers");
const supplements = extractConst(supplementSource, "supplements");
const fourthEdition = extractConst(fourthEditionSource, "fourthEdition");
const chapterDetails = extractConst(chapterSource, "chapterDetails");

const favicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23006d77'/%3E%3Cpath d='M14 18h36v28H14z' fill='%23f6bd60' stroke='%2320231f' stroke-width='4'/%3E%3Cpath d='M22 28h20M22 36h14' stroke='%2320231f' stroke-width='4'/%3E%3C/svg%3E";

const chapterNavLabels = [
  "導論", "資料表示", "數位邏輯", "MARIE", "ISA", "記憶體", "I/O",
  "系統軟體", "替代架構", "嵌入式", "效能", "網路", "儲存介面"
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug(week) {
  return `week-${String(week).padStart(2, "0")}.html`;
}

function relLink(fromWeek, week) {
  return fromWeek ? slug(week) : `weeks/${slug(week)}`;
}

function head(title, description, depth = 0) {
  const prefix = depth ? "../" : "";
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" href="${favicon}">
  <link rel="stylesheet" href="${prefix}styles.css">
</head>`;
}

function topbar(depth = 0) {
  const prefix = depth ? "../" : "";
  return `<a class="skip-link" href="#content">跳到主要內容</a>
  <header class="topbar">
    <a class="brand brand-link" href="${prefix}index.html">
      <span class="brand-mark" aria-hidden="true">CO</span>
      <div>
        <p>YunTech 115-1 / EL3021</p>
        <h1>計算機組織線上講義</h1>
      </div>
    </a>
    <nav class="top-actions" aria-label="工具列">
      <button id="toggleTheme" type="button" title="切換明暗色調">◐</button>
      <button id="printPage" type="button" title="列印目前內容">⎙</button>
    </nav>
  </header>`;
}

function chapterNav(activeChapter = 0, depth = 0, activeView = "") {
  const prefix = depth ? "../" : "";
  const chapterLinks = fourthEdition.chapters.map((chapter, index) => {
    const href = `${prefix}chapters/chapter-${String(chapter.chapter).padStart(2, "0")}.html`;
    const current = chapter.chapter === activeChapter;
    return `<a class="chapter-nav-link${current ? " active" : ""}" href="${href}"${current ? " aria-current=\"page\"" : ""} title="第 ${chapter.chapter} 章 ${esc(chapter.zh)}">
        <strong>CH ${String(chapter.chapter).padStart(2, "0")}</strong><span>${esc(chapterNavLabels[index])}</span>
      </a>`;
  }).join("");

  return `<nav class="chapter-nav" aria-label="課程章節導覽">
    <div class="chapter-nav-inner">
      <a class="chapter-nav-home${activeView === "home" ? " active" : ""}" href="${prefix}index.html"${activeView === "home" ? " aria-current=\"page\"" : ""}>首頁</a>
      ${chapterLinks}
    </div>
  </nav>`;
}

function table(rows) {
  return `<table class="mini-table"><tbody>${rows.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join("")}</tbody></table>`;
}

function conceptMap(lecture) {
  const nodes = lecture.concepts.map(([term]) => `<span>${esc(term)}</span>`).join("");
  return `<div class="concept-map" aria-label="本週概念地圖">
    <strong>概念流</strong>
    ${nodes}
  </div>`;
}

function studentExercise(text) {
  return text
    .replace(/請學生/g, "請")
    .replace(/讓學生/g, "請")
    .replace(/給學生/g, "請使用")
    .replace(/要求學生/g, "請")
    .replace(/全班/g, "完成後")
    .replace(/分組/g, "練習");
}

function learningPath(lecture) {
  return `<ol class="sequence-list">
    <li><strong>觀察問題：</strong>先辨認本週主題要解決的現象，例如程式變慢、指令相依、cache miss 或位元解讀錯誤。</li>
    <li><strong>建立模型：</strong>把問題抽象成本週核心術語，並畫出資料、控制或位址如何流動。</li>
    <li><strong>套用方法：</strong>使用公式、指令格式、pipeline 時序表或 cache 位址切割完成分析。</li>
    <li><strong>檢查結果：</strong>確認單位、暫存器內容、控制訊號、hit/miss 或 cycle 數是否一致。</li>
    <li><strong>連回效能：</strong>說明這個主題如何影響 CPU time、CPI、correctness 或 memory behavior。</li>
  </ol>`;
}

function diagram(figure) {
  if (!figure) return "";
  let content = "";

  if (figure.type === "flow") {
    content = `<div class="flow-diagram">${figure.items.map((item, index) => `${index ? `<span class="flow-arrow" aria-hidden="true">→</span>` : ""}<span class="flow-node">${esc(item)}</span>`).join("")}</div>`;
  } else if (figure.type === "factor") {
    content = `<div class="factor-diagram">${figure.items.map((item, index) => `${index ? `<span class="factor-op" aria-hidden="true">×</span>` : ""}<div><strong>${esc(item.label)}</strong><span>${esc(item.detail)}</span></div>`).join("")}</div>`;
  } else if (figure.type === "bits") {
    content = `<div class="bit-diagram" style="--total-bits:${figure.totalBits}">${figure.items.map((item) => `<div class="bit-field" style="--field-bits:${item.bits}"><strong>${esc(item.label)}</strong><span>${esc(item.bits)} bit${item.bits > 1 ? "s" : ""}</span><small>${esc(item.detail)}</small></div>`).join("")}</div>`;
  } else if (figure.type === "hierarchy") {
    content = `<div class="hierarchy-diagram">${figure.items.map((item, index) => `<div style="--level:${index}"><strong>${esc(item.label)}</strong><span>${esc(item.detail)}</span></div>`).join("")}</div>`;
  } else if (figure.type === "matrix") {
    content = `<div class="diagram-table-wrap"><table class="diagram-table"><thead><tr>${figure.columns.map((column) => `<th>${esc(column)}</th>`).join("")}</tr></thead><tbody>${figure.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  } else if (figure.type === "timeline") {
    content = `<div class="diagram-table-wrap"><table class="timeline-table"><thead><tr><th>Instruction</th>${figure.columns.map((column) => `<th>Cycle ${esc(column)}</th>`).join("")}</tr></thead><tbody>${figure.rows.map((row) => `<tr><th>${esc(row.label)}</th>${row.cells.map((cell) => `<td class="stage-${esc(cell || "empty").toLowerCase()}">${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  return `<figure class="learning-figure">
    <h4>${esc(figure.title)}</h4>
    ${content}
    <figcaption>${esc(figure.caption)}</figcaption>
  </figure>`;
}

function supplementSections(lecture) {
  const supplement = supplements.find((item) => item.week === lecture.week);
  if (!supplement) return "";
  return `<section class="section study-entry">
      <h3>本週自學導讀</h3>
      <p class="study-lead">${esc(supplement.bridge)}</p>
      ${diagram(supplement.diagram)}
    </section>
    <section class="section">
      <h3>概念推導</h3>
      <div class="deep-dive-grid">${supplement.sections.map((section) => `<section class="deep-dive"><h4>${esc(section.title)}</h4>${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</section>`).join("")}</div>
    </section>
    <section class="section worked-example">
      <p class="eyebrow">Worked example</p>
      <h3>${esc(supplement.worked.title)}</h3>
      <p>${esc(supplement.worked.prompt)}</p>
      <ol>${supplement.worked.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
      <p class="worked-result"><strong>結論：</strong>${esc(supplement.worked.result)}</p>
    </section>
    <section class="section misconception-panel">
      <h3>常見誤解</h3>
      <ul>${supplement.pitfalls.map((pitfall) => `<li>${esc(pitfall)}</li>`).join("")}</ul>
    </section>
    <section class="section self-check">
      <h3>自我檢核</h3>
      <p>先在紙上作答，再展開核對。能說明理由，才算真正掌握。</p>
      ${supplement.selfTest.map((item, index) => `<details><summary>${index + 1}. ${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
    </section>`;
}

function chapterText(value) {
  return String(value)
    .replaceAll("本週", "本節")
    .replace(/第\s*\d+\s*週/g, "本課程");
}

function integratedChapterTopic(lecture, topicIndex) {
  const supplement = supplements.find((item) => item.week === lecture.week);
  return `<section class="chapter-topic" id="topic-${topicIndex}">
    <header class="chapter-topic-head">
      <p class="eyebrow">Core topic ${String(topicIndex).padStart(2, "0")}</p>
      <h2>${esc(chapterText(lecture.title))}</h2>
      <p>${esc(chapterText(supplement.bridge))}</p>
    </header>
    ${diagram(supplement.diagram)}
    <section class="chapter-topic-block">
      <h3>學習成果</h3>
      <ul>${lecture.goals.map((goal) => `<li>${esc(chapterText(goal))}</li>`).join("")}</ul>
    </section>
    <section class="chapter-topic-block">
      <h3>核心概念</h3>
      <ul class="concept-list">${lecture.concepts.map(([term, text]) => `<li><strong>${esc(term)}：</strong>${esc(chapterText(text))}</li>`).join("")}</ul>
    </section>
    <section class="chapter-topic-block">
      <h3>概念推導</h3>
      <div class="deep-dive-grid">${supplement.sections.map((section) => `<section class="deep-dive"><h4>${esc(section.title)}</h4>${section.paragraphs.map((paragraph) => `<p>${esc(chapterText(paragraph))}</p>`).join("")}</section>`).join("")}</div>
    </section>
    <section class="chapter-topic-block">
      <h3>補充說明</h3>
      ${lecture.notes.map((note) => `<p>${esc(chapterText(note))}</p>`).join("")}
    </section>
    <section class="worked-example chapter-topic-worked">
      <p class="eyebrow">Worked example</p>
      <h3>${esc(supplement.worked.title)}</h3>
      <p>${esc(chapterText(supplement.worked.prompt))}</p>
      <ol>${supplement.worked.steps.map((step) => `<li>${esc(chapterText(step))}</li>`).join("")}</ol>
      <p class="worked-result"><strong>結論：</strong>${esc(chapterText(supplement.worked.result))}</p>
    </section>
    <section class="chapter-topic-block">
      <h3>程式與計算例題</h3>
      <h4>${esc(lecture.example.title)}</h4>
      <pre><code>${esc(lecture.example.code)}</code></pre>
      <p>${esc(chapterText(lecture.example.explanation))}</p>
    </section>
    <section class="misconception-panel chapter-topic-misconceptions">
      <h3>常見誤解</h3>
      <ul>${supplement.pitfalls.map((pitfall) => `<li>${esc(chapterText(pitfall))}</li>`).join("")}</ul>
    </section>
    <section class="self-check chapter-topic-check">
      <h3>自我檢核</h3>
      ${supplement.selfTest.map((item, index) => `<details><summary>${index + 1}. ${esc(chapterText(item.q))}</summary><p>${esc(chapterText(item.a))}</p></details>`).join("")}
    </section>
  </section>`;
}

const standaloneChapterContent = {
  7: {
    sections: [
      ["I/O 模組與裝置暫存器", [
        "處理器不直接理解鍵盤、網路卡或儲存裝置的物理細節，而是透過 I/O 模組讀寫一組定義良好的暫存器。常見暫存器包含 data、status 與 control：data 保存要傳送或剛收到的資料，status 呈現 ready、busy、error 等狀態，control 則指定啟動、重設或傳輸模式。",
        "在 memory-mapped I/O 中，裝置暫存器占用一般位址空間，CPU 可用 load/store 指令存取；這能重用既有指令與位址計算電路，但快取與亂序執行必須尊重裝置存取的副作用與順序。程式不能把讀取 status 當成可任意刪除的普通記憶體讀取，因為一次讀取可能同時清除事件旗標。"
      ]],
      ["Programmed I/O、Interrupt 與 DMA", [
        "Programmed I/O 由 CPU 反覆輪詢 status，裝置就緒後再由 CPU 搬移資料。它的控制流程簡單、反應時間容易估計，卻會在慢速裝置等待期間消耗大量處理器週期。Interrupt-driven I/O 允許 CPU 先執行其他工作，事件到達後再保存現場、進入中斷服務常式並處理資料。",
        "DMA 適合區塊資料傳輸。CPU 先設定來源、目的、長度與方向，DMA controller 再成為 bus master，直接在裝置與主記憶體間搬移資料，完成後才通知 CPU。例如傳送 4096 bytes，若 CPU 每次搬 4 bytes，需要執行 1024 次資料搬移；DMA 則把 CPU 工作縮減為建立描述子、啟動傳輸與處理完成事件。"
      ]],
      ["中斷處理與優先權", [
        "中斷發生時，處理器必須保留足以恢復程式的 architectural state，辨認來源，再跳到 interrupt service routine。中斷延遲包含完成或暫停目前指令、保存狀態、仲裁優先權、取得向量以及執行服務常式前置碼；因此裝置送出中斷到真正處理資料之間並非零時間。",
        "多個裝置同時請求服務時，需要 priority、mask 與 nesting 規則。高優先權事件可搶先處理，但若高優先權事件持續到達，低優先權事件可能長期得不到服務。設計時必須同時檢查最壞情況延遲、服務常式執行時間與事件到達率，而不是只檢查平均情況。"
      ]],
      ["吞吐量、延遲與佇列", [
        "I/O 效能至少包含 latency 與 throughput。Latency 是單一請求從提交到完成的時間；throughput 是單位時間內完成的資料量或請求數。批次、較深佇列與較大傳輸通常能攤平固定成本並提高吞吐量，卻可能讓單一請求等待更久。",
        "當平均到達率逐漸接近裝置服務率時，佇列長度與等待時間會迅速上升。系統即使仍能處理所有請求，互動體感也可能先因 tail latency 惡化。評估 I/O 時應分開量測平均延遲、百分位延遲、持續吞吐量與 CPU overhead。"
      ]],
      ["可靠性與錯誤邊界", [
        "I/O 路徑跨越應用程式、作業系統、驅動程式、控制器、連線與裝置媒體，每一層都可能產生 timeout、資料毀損或部分完成。Parity、CRC 與 error-correcting code 用來偵測或修正位元錯誤；timeout 與 retry 則處理未收到完成回應的情況。",
        "重試並非永遠安全。讀取通常可重送，但具有副作用的寫入或控制命令若不具 idempotence，重送可能執行兩次。可靠的介面必須讓軟體分辨尚未執行、已完成與結果未知三種狀態，並明確定義錯誤回報與復原責任。"
      ]]
    ],
    checks: [
      ["為何 memory-mapped I/O 讀取不能一律當成普通記憶體讀取？", "裝置暫存器可能具有副作用、不可快取，且讀寫順序具有外部可觀察意義；編譯器與處理器必須遵守介面要求的順序。"],
      ["4096-byte 區塊若由 CPU 每次搬 4 bytes，需要幾次資料搬移？", "4096 / 4 = 1024 次。DMA 可把大量逐字搬移交給控制器，CPU 只處理設定與完成事件。"],
      ["Interrupt-driven I/O 為何不代表沒有 CPU 成本？", "CPU 仍要保存與恢復狀態、執行中斷服務常式，頻繁中斷也會破壞快取區域性並增加排程成本。"],
      ["較大的批次為何可能同時提高吞吐量並增加延遲？", "批次可攤平每次命令的固定成本，但早到的請求必須等待批次湊齊或等待前方更多工作完成。"]
    ],
    sources: [
      ["Linux Kernel · Dynamic DMA Mapping Guide", "https://docs.kernel.org/core-api/dma-api-howto.html"],
      ["Arm · Memory access ordering, barriers and the Linux kernel", "https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/memory-access-ordering-part-2---barriers-and-the-linux-kernel"]
    ]
  },
  10: {
    sections: [
      ["MCU、MPU 與 SoC", [
        "微控制器（MCU）通常把 CPU core、SRAM、nonvolatile memory、timer、GPIO 與通訊周邊整合在單一晶片，適合成本、功耗與空間受限的控制工作。微處理器（MPU）常依賴外部 DRAM 與儲存裝置，能支援更完整的虛擬記憶體與作業系統。SoC 是更廣義的整合方式，可同時包含多核心 CPU、GPU、DSP、NPU 與專用 I/O。",
        "判斷平台時不應只比較時脈。記憶體容量、啟動時間、周邊數量、即時反應、能源預算、軟體生態與單位成本都可能成為主要限制。相同 ISA 的兩個處理器，也可能因快取、bus、accelerator 與 power state 不同而適合完全不同的產品。"
      ]],
      ["Memory-mapped peripheral 與韌體控制", [
        "嵌入式周邊通常以 memory-mapped register 暴露功能。韌體先設定 clock、pin mux 與方向，再依規格寫入 control register，最後以 polling 或 interrupt 觀察狀態。每個位元欄位可能代表 read-only、write-one-to-clear 或保留位元，寫錯值會造成無法由一般程式邏輯推測的硬體行為。",
        "volatile 只能告訴編譯器每次都要真的發出存取，不能自動保證多核心同步或完整的裝置順序。當 CPU、DMA 與周邊共同存取 buffer 時，還要處理 memory barrier、cache coherence、ownership 與完成通知。"
      ]],
      ["Interrupt、Timer 與即時期限", [
        "即時系統的正確性同時取決於計算結果與完成時間。Hard real-time 工作一旦錯過 deadline 就可能造成不可接受的失效；soft real-time 工作偶爾逾期會降低品質，但系統仍能運作。Timer 提供週期性 tick、one-shot deadline 與輸入捕捉，是排程、逾時與精確控制的時間基準。",
        "最壞情況反應時間可分解為 blocking time、等待更高優先權工作的 interference、自己的 worst-case execution time，以及中斷與切換成本。平均執行很快不足以證明 deadline 一定達成；分析必須覆蓋最不利的到達組合與資源競爭。"
      ]],
      ["功耗、能量與效能", [
        "動態功耗可用 P_dynamic ≈ αCV²f 建立心智模型：切換活動 α、負載電容 C、供應電壓 V 與頻率 f 都會影響功耗，其中電壓是平方關係。降低頻率可減少單位時間功耗，但程式執行更久，因此總能量不一定同比例下降。",
        "Race to sleep 策略讓核心快速完成工作後進入低功耗狀態；另一種策略則以較低電壓與頻率持續執行。哪一種較省能取決於工作負載、漏電、喚醒成本與 deadline。比較設計時要區分 instantaneous power、energy per task 與電池可用時間。"
      ]],
      ["資源限制、看門狗與故障復原", [
        "嵌入式系統常沒有充裕的 DRAM、swap 或人工維護，因此 stack 深度、heap fragmentation、buffer 上限與 worst-case path 都需要明確界線。靜態配置可提高可預測性，動態配置則提供彈性；選擇取決於生命週期、碎片風險與失敗處理能力。",
        "Watchdog timer 要求軟體在期限內證明自己仍正常運作；若控制流程卡死，watchdog 觸發重設或進入安全狀態。完善的復原還包括 brownout detection、錯誤記錄、雙映像韌體與回滾機制，使更新中斷或電源異常不致讓設備永久失效。"
      ]]
    ],
    checks: [
      ["MCU 與 MPU 最重要的差異是否只是時脈？", "不是。整合的記憶體與周邊、虛擬記憶體能力、功耗、成本、啟動時間與軟體環境通常更具決定性。"],
      ["volatile 能否取代 memory barrier？", "不能。volatile 處理編譯器是否省略存取；memory barrier 處理 CPU 與互連可觀察到的存取順序。"],
      ["平均執行時間低於 deadline，能否證明 hard real-time 工作正確？", "不能。必須檢查最壞情況執行時間、阻塞、中斷與高優先權工作的干擾。"],
      ["降低時脈為何不一定讓每項工作更省能？", "功率雖可能下降，但執行時間會增加；總能量是功率對時間的累積，還受到電壓、漏電與睡眠狀態影響。"]
    ],
    sources: [
      ["Arm CMSIS-RTOS2 · Overview", "https://arm-software.github.io/CMSIS_6/latest/RTOS2/index.html"],
      ["Arm CMSIS-RTOS2 · OS Tick API", "https://arm-software.github.io/CMSIS_6/latest/RTOS2/group__CMSIS__RTOS__TickAPI.html"],
      ["Arm CMSIS-RTOS2 · Thread Watchdogs", "https://arm-software.github.io/CMSIS_6/main/RTOS2/rtos_process_isolation_thread_wdt.html"]
    ]
  },
  12: {
    sections: [
      ["分層、服務與封裝", [
        "網路分層把複雜通訊拆成具有明確介面的服務。應用資料向下傳遞時，各層加入自己的控制資訊；接收端再依相反順序解除封裝。這和 ISA 隱藏微架構細節的做法相同：上層依賴介面，不必知道所有實作。",
        "封裝後的每個 header 只對相應層次有意義。鏈路層處理同一鏈路上的 frame 傳送，網路層處理跨網路的 packet 轉送，傳輸層則在端點程序間提供可靠 byte stream 或 message delivery。除錯時必須先辨認問題發生在哪一層。"
      ]],
      ["交換、路由與位址", [
        "交換器主要依區域網路中的鏈路層位址轉送 frame，路由器則依網路層位址在不同網路間選擇 packet 路徑。兩者都使用表格進行查找，但所處層次、位址語意與更新機制不同。",
        "交換器學習來源 MAC address 與輸入埠的關係；路由器使用 prefix matching 選擇下一跳。IP address 描述可路由的網路位置，port number 則辨認同一主機上的程序端點。完整連線因此需要同時考慮來源與目的 IP、傳輸協定及來源與目的 port。"
      ]],
      ["延遲、頻寬與頻寬延遲積", [
        "總通訊時間不能只看鏈路頻寬。傳播延遲、傳輸延遲、處理延遲與排隊延遲會共同決定完成時間。長度 L bit 的封包通過速率 R bit/s 的鏈路，傳輸延遲為 L/R；傳播延遲則約為距離除以訊號在媒介中的傳播速度。",
        "頻寬延遲積等於 bandwidth 乘以 round-trip time，代表在收到確認前可同時位於路徑上的資料量。高速長距離連線若 window 太小，發送端會在鏈路尚可承載更多資料時停下等待，因此實際吞吐量仍可能遠低於額定頻寬。"
      ]],
      ["可靠傳輸、錯誤偵測與重傳", [
        "鏈路可能遺失、重複、毀損或重新排序封包。Checksum 或 CRC 用來偵測資料是否改變；sequence number 辨認順序與重複；acknowledgment 與 timeout 則讓發送端決定何時重傳。這些機制共同把不可靠通道轉換成較可靠的端到端服務。",
        "Timeout 太短會對只是延遲的封包進行不必要重傳，太長則讓真正遺失的復原變慢。可靠協定因而需要根據觀察到的 round-trip time 調整估計，並使用 duplicate acknowledgment 等訊號加快部分遺失的偵測。"
      ]],
      ["壅塞、流量控制與端到端效能", [
        "Flow control 保護接收端，避免發送速度超過接收 buffer 的處理能力；congestion control 保護網路路徑，避免過多流量讓中間佇列溢位。兩者限制來源不同，卻都會改變發送端當下允許傳送的資料量。",
        "當封包到達率接近服務率時，排隊延遲會快速增加，buffer 填滿後則開始丟包。端到端效能要同時檢查應用產生資料的速度、傳輸視窗、每段鏈路容量、router queue、丟包重傳與接收端處理速度；最慢或最受限的一段形成瓶頸。"
      ]]
    ],
    checks: [
      ["為何分層介面能降低系統複雜度？", "每一層只承諾可觀察的服務與資料格式，下層實作可以改變而不迫使所有上層一起修改。"],
      ["1500-byte frame 通過 100 Mbit/s 鏈路的傳輸延遲是多少？", "1500 × 8 / 100,000,000 = 120 microseconds。這不包含傳播、排隊與處理延遲。"],
      ["頻寬提高是否必然等比例縮短回應時間？", "不一定。若主要成本來自傳播、處理或排隊延遲，只提高傳輸頻寬的改善幅度會受到限制。"],
      ["Flow control 與 congestion control 分別保護誰？", "Flow control 保護接收端不被淹沒；congestion control 保護共享網路路徑不因過載而排隊或丟包。"]
    ],
    sources: [
      ["RFC 9293 · Transmission Control Protocol", "https://www.rfc-editor.org/rfc/rfc9293.html"],
      ["RFC 5681 · TCP Congestion Control", "https://www.rfc-editor.org/info/rfc5681/"],
      ["RFC 2914 · Congestion Control Principles", "https://www.rfc-editor.org/info/rfc2914/"]
    ]
  },
  13: {
    sections: [
      ["儲存介面的角色", [
        "儲存介面規範主機如何描述命令、定位資料、回報完成狀態與處理錯誤。裝置內部可以採用不同媒體與控制器，只要遵守介面契約，作業系統就能透過一致的驅動模型存取。",
        "一次讀取會穿過 system call、file system、block layer、device driver、controller 與實體媒體。每一層都可能切分、合併、重新排序或快取請求，所以應用觀察到的延遲不是單一媒體的原始存取時間。"
      ]],
      ["命令、佇列與 DMA", [
        "現代儲存路徑通常把控制命令與大量資料傳輸分開。CPU 建立描述子與 submission queue，控制器取得命令後透過 DMA 搬移資料，再把結果寫入 completion queue 或觸發中斷。",
        "佇列讓主機在前一請求尚未完成時繼續提交工作，控制器便能利用內部平行性。較深佇列通常提高 throughput，但請求在佇列中停留更久，tail latency 也可能上升；因此 queue depth 應依服務目標調整。"
      ]],
      ["Block、File 與 Object 抽象", [
        "Block storage 提供固定大小、可定址的區塊，檔案系統負責把檔名、目錄與權限映射到區塊。File storage 直接提供共享檔案與目錄命名空間；object storage 則以 object identifier、metadata 與整體物件操作為主要介面。",
        "三種抽象不能只用快慢排序。Block 介面讓主機控制資料布局，file 介面便於多用戶共享，object 介面易於跨節點擴充與保存大量非結構資料。選擇取決於更新粒度、共享方式、一致性需求與管理規模。"
      ]],
      ["直連、網路與共享儲存", [
        "直連介面讓裝置靠近單一主機，路徑短且故障邊界清楚；網路型儲存則把 block、file 或 object 服務放到可共享的網路端點，允許集中管理與多主機存取。",
        "網路儲存把 network latency、packet loss 與交換器壅塞加入儲存路徑，也能透過多路徑、複寫與故障移轉提高可用性。比較架構時應同時檢查 latency、bandwidth、availability、consistency、管理成本與 failure domain。"
      ]],
      ["持久性、順序與故障復原", [
        "寫入完成可能只代表資料到達作業系統 cache、控制器 volatile buffer，或真正落到 nonvolatile media；這些語意不能混用。Flush、force-unit-access 或 barrier 類命令用來建立必要的持久化與順序邊界。",
        "檔案系統可透過 write-ahead logging、journaling 或 copy-on-write，確保當電源在多步更新中間中斷時仍能恢復一致狀態。RAID、replication 與 erasure coding 則處理裝置或節點故障，但它們不能取代備份，因為誤刪與軟體錯誤可能同步破壞所有副本。"
      ]]
    ],
    checks: [
      ["為何 DMA 適合大量儲存資料傳輸？", "CPU 只需設定傳輸描述，控制器即可直接在裝置與主記憶體間搬移資料，減少逐字搬移所需的指令與中斷。"],
      ["Block storage 與 file storage 的責任界線有何不同？", "Block storage 暴露可定址區塊，由主機檔案系統管理命名與布局；file storage 直接暴露檔名、目錄與檔案操作。"],
      ["較深的命令佇列一定能降低延遲嗎？", "不一定。較深佇列可以提高裝置利用率與吞吐量，但請求也可能等待更久，因此吞吐量與尾端延遲必須分別量測。"],
      ["為何 RAID 或 replication 不能取代備份？", "它們主要維持硬體故障下的可用性；誤刪、惡意修改或軟體錯誤仍可能同步到所有副本，備份需要獨立版本與故障邊界。"]
    ],
    sources: [
      ["NVM Express · Base Specification Revision 2.2", "https://nvmexpress.org/wp-content/uploads/NVM-Express-Base-Specification-Revision-2.2-2025.03.11-Ratified-1.pdf"],
      ["NVM Express · Specification Archives", "https://nvmexpress.org/nvm-express-specification-archives/"]
    ]
  }
};

function standaloneChapterSections(chapter) {
  const content = standaloneChapterContent[chapter.chapter];
  if (!content) return "";
  return `<section class="standalone-chapter-content">
    ${content.sections.map(([title, text], index) => {
      const paragraphs = Array.isArray(text) ? text : [text];
      return `<section class="chapter-topic-block"><p class="eyebrow">Core topic ${String(index + 1).padStart(2, "0")}</p><h2>${esc(title)}</h2>${paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</section>`;
    }).join("")}
    <section class="self-check chapter-topic-check"><h2>自我檢核</h2>${content.checks.map(([question, answer], index) => `<details><summary>${index + 1}. ${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("")}</section>
    ${content.sources ? `<section class="chapter-sources"><h2>技術來源與延伸閱讀</h2><ol>${content.sources.map(([title, url]) => `<li><a href="${esc(url)}" rel="noreferrer">${esc(title)}</a></li>`).join("")}</ol></section>` : ""}
  </section>`;
}

function courseSchedule() {
  const rows = lectures.map((lecture) => `<tr><th>第 ${lecture.week} 週</th><td>${esc(lecture.title)}</td><td>${esc(lecture.goals[0])}</td></tr>`).join("");
  return `<section class="chapter-schedule" id="course-schedule">
    <p class="eyebrow">Course schedule</p>
    <h2>18 週課程進度</h2>
    <p>進度由抽象層次與效能開始，接續資料表示、MIPS、datapath、pipeline 與記憶體階層，最後以跨層效能分析整合全課。</p>
    <div class="diagram-table-wrap"><table class="course-schedule-table"><thead><tr><th>週次</th><th>主題</th><th>核心成果</th></tr></thead><tbody>${rows}</tbody></table></div>
  </section>`;
}

function editionAlignment(lecture) {
  const mapping = fourthEdition.weekMap.find((item) => item.week === lecture.week);
  const chapters = mapping.chapters.map((chapter) => {
    const item = fourthEdition.chapters.find((entry) => entry.chapter === chapter);
    return `第 ${chapter} 章 ${item.zh}`;
  }).join("、");
  const detailLinks = mapping.chapters.map((chapter) => chapterDetails.find((item) => item.chapter === chapter)).filter(Boolean).map((detail) => `<a href="../chapters/chapter-${String(detail.chapter).padStart(2, "0")}.html">閱讀第 ${detail.chapter} 章完整自學教材</a>`).join("");
  return `<section class="edition-alignment">
      <p class="eyebrow">Textbook map · Fourth edition</p>
      <h3>第 4 版對照：${esc(chapters)}</h3>
      <p><strong>節次：</strong>${esc(mapping.sections)}</p>
      <p>${esc(mapping.focus)}</p>
      <div class="edition-links"><a href="../fourth-edition-map.html#week-map">查看完整章節對照與 MARIE–MIPS 概念橋接</a>${detailLinks}</div>
    </section>`;
}

function pageShell({ title, description, body, activeChapter = 0, activeView = "", depth = 0 }) {
  const prefix = depth ? "../" : "";
  return `${head(title, description, depth)}
<body>
  ${topbar(depth)}
  ${chapterNav(activeChapter, depth, activeView)}
  <main class="page-main">
    <section id="content" class="content" tabindex="-1">
      ${body}
    </section>
  </main>
  <footer class="footer">
    <p>計算機組織 · Computer Organization · YunTech 115-1</p>
  </footer>
  <script src="${prefix}site.js"></script>
</body>
</html>
`;
}

function indexPage() {
  const homeChapterCards = fourthEdition.chapters.map((chapter) => `
    <a class="home-chapter-card" href="chapters/chapter-${String(chapter.chapter).padStart(2, "0")}.html">
      <span>Chapter ${String(chapter.chapter).padStart(2, "0")}</span>
      <h3>${esc(chapter.zh)}</h3>
      <p>${esc(chapter.summary)}</p>
      <small>${esc(chapter.title)}</small>
    </a>`).join("");

  return pageShell({
    title: "計算機組織線上講義 | 115-1 YunTech",
    description: "國立雲林科技大學 115 學年度第 1 學期計算機組織完整章節教材。",
    body: `<section class="cpu-hero">
        <header class="cpu-hero-copy">
          <p class="eyebrow">從程式到硬體的可追蹤路徑</p>
          <h2>看懂一行指令如何穿過暫存器、ALU、Pipeline 與 Cache</h2>
          <p>程式執行始於指令取出與解碼，經過暫存器重新命名、排程與執行單元，再由快取與主記憶體供應資料。ISA、pipeline、hazard、CPI 與 memory hierarchy 都能沿著這條路徑放入同一個分析模型。</p>
        </header>
        <figure class="modern-cpu-diagram">
          <div class="diagram-heading">
            <div><span>Conceptual microarchitecture</span><strong>Modern out-of-order CPU core</strong></div>
            <p>指令流由左向右；記憶體存取由核心向下進入快取階層。</p>
          </div>
          <div class="core-boundary">
            <div class="boundary-label">單一高效能核心</div>
            <div class="pipeline-flow">
              <section class="architecture-zone frontend-zone">
                <h3><span>01</span> Front end</h3>
                <div class="unit-grid">
                  <div><strong>Branch predictor</strong><small>預測下一個取指位址</small></div>
                  <div><strong>L1 I-cache</strong><small>提供低延遲指令</small></div>
                  <div><strong>Fetch</strong><small>取得指令位元</small></div>
                  <div><strong>Decode</strong><small>轉為內部操作</small></div>
                </div>
              </section>
              <span class="stage-arrow" aria-hidden="true">→</span>
              <section class="architecture-zone rename-zone">
                <h3><span>02</span> Rename / Dispatch</h3>
                <div class="unit-grid compact-units">
                  <div><strong>Register rename</strong><small>移除假相依</small></div>
                  <div><strong>Dispatch</strong><small>送入執行視窗</small></div>
                </div>
              </section>
              <span class="stage-arrow" aria-hidden="true">→</span>
              <section class="architecture-zone backend-zone">
                <h3><span>03</span> Out-of-order back end</h3>
                <div class="unit-grid backend-units">
                  <div><strong>Issue queues</strong><small>等待運算元就緒</small></div>
                  <div><strong>Reorder buffer</strong><small>依程式順序退休</small></div>
                  <div><strong>Integer ALUs</strong><small>整數與位址運算</small></div>
                  <div><strong>FP / Vector</strong><small>浮點與向量運算</small></div>
                  <div class="load-store-unit"><strong>Load / Store</strong><small>排序並執行記憶體操作</small></div>
                </div>
              </section>
            </div>
            <div class="cache-path">
              <div class="data-cache"><span>Load / Store path</span><strong>L1 D-cache</strong><small>核心私有資料快取</small></div>
              <span class="cache-arrow" aria-hidden="true">↓</span>
              <div class="private-cache"><span>Instruction + data misses</span><strong>Private L2</strong><small>容量較大、延遲較高</small></div>
            </div>
          </div>
          <div class="hierarchy-drop"><span aria-hidden="true">↓</span><strong>L2 miss / coherence traffic</strong></div>
          <div class="memory-hierarchy">
            <div><span>On-chip fabric</span><strong>Coherent interconnect + Shared LLC</strong><small>在多核心間維持可見性並承接 L2 miss</small></div>
            <span class="memory-arrow" aria-hidden="true">→</span>
            <div><span>Off-core access</span><strong>Memory controller</strong><small>排程 DRAM 命令與資料傳輸</small></div>
            <span class="memory-arrow" aria-hidden="true">→</span>
            <div><span>Main memory</span><strong>DRAM</strong><small>容量最大，存取延遲也最高</small></div>
          </div>
          <figcaption>這是用於建立心智模型的通用示意圖，不代表特定晶片的實體 floorplan。不同處理器會改變管線寬度、佇列大小、快取層級與共享方式；圖中的 front end、out-of-order execution 與記憶體階層已依 <a href="https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html" rel="noreferrer">Intel 官方架構手冊</a>、<a href="https://developer.arm.com/community/arm-community-blogs/b/announcements/posts/cortex-x4-cpu-performance" rel="noreferrer">Arm Cortex-X4 說明</a>與 <a href="https://www.amd.com/en/technologies/zen-core.html" rel="noreferrer">AMD Zen 核心資料</a>交叉核對。</figcaption>
        </figure>
      </section>
      <section class="chapter-index" id="chapters">
        <header class="index-heading">
          <div><p class="eyebrow">Chapter-based materials</p><h2>13 章教材</h2></div>
          <p>章次依《The Essentials of Computer Organization and Architecture》第 4 版編排，從資料表示、數位邏輯與 ISA，逐步進入處理器、記憶體、I/O、效能與系統介面。</p>
        </header>
        <div class="home-chapter-grid">${homeChapterCards}</div>
      </section>
      `,
    activeChapter: 0,
    activeView: "home",
    depth: 0
  });
}

function weekPage(lecture) {
  const prev = lectures.find((item) => item.week === lecture.week - 1);
  const next = lectures.find((item) => item.week === lecture.week + 1);
  const body = `<article class="lecture-view">
        <nav class="breadcrumb" aria-label="麵包屑"><a href="../index.html">課程首頁</a><span>第 ${lecture.week} 週</span></nav>
        <header class="lecture-head">
          <div class="week-num">${String(lecture.week).padStart(2, "0")}</div>
          <div>
            <p class="eyebrow">Week ${lecture.week}</p>
            <h2>${esc(lecture.title)}</h2>
            <p>${esc(lecture.english)}</p>
            <div class="tags">${lecture.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
          </div>
        </header>
        <div class="lecture-content">
            ${conceptMap(lecture)}
            <section class="section">
              <h3>本週學習目標</h3>
              <ul>${lecture.goals.map((goal) => `<li>${esc(goal)}</li>`).join("")}</ul>
            </section>
            ${editionAlignment(lecture)}
            <section class="section">
              <h3>核心概念</h3>
              <ul class="concept-list">${lecture.concepts.map(([term, text]) => `<li><strong>${esc(term)}：</strong>${esc(text)}</li>`).join("")}</ul>
            </section>
            ${supplementSections(lecture)}
            <section class="section">
              <h3>講義筆記</h3>
              ${lecture.notes.map((note) => `<p>${esc(note)}</p>`).join("")}
            </section>
            <section class="section">
              <h3>學習路徑</h3>
              ${learningPath(lecture)}
              <div class="callout"><strong>練習任務：</strong>${esc(studentExercise(lecture.activity))}</div>
            </section>
            <section class="section">
              <h3>例題與講解</h3>
              <h4>${esc(lecture.example.title)}</h4>
              <pre><code>${esc(lecture.example.code)}</code></pre>
              <p>${esc(lecture.example.explanation)}</p>
            </section>
            <section class="section">
              <h3>課後檢核</h3>
              <ol>${lecture.checks.map((check) => `<li>${esc(check)}</li>`).join("")}</ol>
            </section>
            <section class="reference-tools">
              <h3>本週速查</h3>
              <div class="reference-tools-grid">
                <section class="tool-card"><h4>常用公式</h4>${table(formulas)}</section>
                <section class="tool-card"><h4>MIPS 暫存器速查</h4>${table(registers)}</section>
                <section class="tool-card"><h4>學習重點</h4><p>先掌握本週名詞，再追蹤資料或控制如何流動，最後用公式或例題檢查自己的理解。</p></section>
              </div>
            </section>
            <nav class="pager" aria-label="週次切換">
              ${prev ? `<a href="${slug(prev.week)}">← 第 ${prev.week} 週</a>` : `<span></span>`}
              ${next ? `<a href="${slug(next.week)}">第 ${next.week} 週 →</a>` : `<span></span>`}
            </nav>
        </div>
      </article>`;
  return pageShell({
    title: `第 ${lecture.week} 週 ${lecture.title} | 計算機組織`,
    description: `計算機組織第 ${lecture.week} 週講義：${lecture.title}。`,
    body,
    activeChapter: 0,
    activeView: "weeks",
    depth: 1
  });
}

function fourthEditionPage() {
  const chapterCards = fourthEdition.chapters.map((chapter) => {
    return `<article class="chapter-card" id="chapter-${chapter.chapter}">
      <p class="eyebrow">Chapter ${chapter.chapter}</p>
      <h3>${esc(chapter.zh)}</h3>
      <p class="chapter-title">${esc(chapter.title)}</p>
      <p>${esc(chapter.summary)}</p>
      <a class="chapter-detail-link" href="chapters/chapter-${String(chapter.chapter).padStart(2, "0")}.html">閱讀第 ${chapter.chapter} 章</a>
    </article>`;
  }).join("");

  const marie = fourthEdition.marie;
  const marieFormat = diagram({
    type: "bits",
    title: "MARIE 16-bit 指令格式",
    totalBits: marie.format.totalBits,
    items: marie.format.fields,
    caption: "4-bit opcode 選擇操作，12-bit address 可定位 2^12 = 4096 個 memory words。"
  });
  const registerRows = marie.registers.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th>${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
  const comparisonRows = marie.comparison.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th>${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");

  return pageShell({
    title: "第 4 版章節對照與 MARIE–MIPS 概念橋接 | 計算機組織",
    description: "計算機組織章節與 The Essentials of Computer Organization and Architecture 第 4 版的對照，以及 MARIE 與 MIPS 比較。",
    body: `<article class="edition-page">
        <nav class="breadcrumb" aria-label="麵包屑"><a href="index.html">課程首頁</a><span>第 4 版章節對照</span></nav>
        <header class="edition-hero">
          <p class="eyebrow">Textbook companion · Fourth edition</p>
          <h2>第 4 版中譯本章節對照</h2>
          <p>${esc(fourthEdition.authors.join("、"))}，${esc(fourthEdition.title)}，第 ${fourthEdition.edition} 版，${fourthEdition.year}，ISBN ${esc(fourthEdition.isbn)}。</p>
          <p>課程依正式課綱使用 MIPS 作為主要 ISA；第 4 版第 4 章則以 MARIE 建立 CPU 基本模型。兩條路徑共享 register transfer、instruction cycle、datapath 與 control 等核心概念。</p>
        </header>
        <section class="section">
          <h3>第 4 版 13 章學習地圖</h3>
          <div class="chapter-grid">${chapterCards}</div>
        </section>
        <section class="section marie-section" id="marie-mips">
          <p class="eyebrow">Chapter 4 concept bridge</p>
          <h3>MARIE 與 MIPS：相同狀態問題，不同 ISA 表達</h3>
          <p>${esc(marie.overview)}</p>
          ${marieFormat}
          <div class="marie-grid">
            <section>
              <h4>主要暫存器</h4>
              <div class="diagram-table-wrap"><table class="diagram-table"><thead><tr><th>Register</th><th>寬度</th><th>角色</th></tr></thead><tbody>${registerRows}</tbody></table></div>
            </section>
            <section>
              <h4>Fetch 狀態轉移</h4>
              <ol class="state-transfer">${marie.fetch.map((step) => `<li><code>${esc(step)}</code></li>`).join("")}</ol>
              <p>前四步完成取指與 PC 更新；最後一步才根據 opcode 決定 execute phase 需要哪些資料路徑。</p>
            </section>
          </div>
          <h4>架構對照</h4>
          <div class="diagram-table-wrap"><table class="edition-map-table"><thead><tr><th>面向</th><th>MARIE</th><th>MIPS</th></tr></thead><tbody>${comparisonRows}</tbody></table></div>
        </section>
        <section class="section worked-example">
          <p class="eyebrow">Worked example</p>
          <h3>${esc(marie.worked.prompt)}</h3>
          <div class="code-compare">
            <section><h4>MARIE</h4><pre><code>${esc(marie.worked.marie.join("\n"))}</code></pre></section>
            <section><h4>MIPS</h4><pre><code>${esc(marie.worked.mips.join("\n"))}</code></pre></section>
          </div>
          <p>${esc(marie.worked.conclusion)}</p>
        </section>
        <section class="section self-check">
          <h3>MARIE 自我檢核</h3>
          <p>先寫出 register transfer 或位址單位，再展開答案。</p>
          ${marie.checks.map((item, index) => `<details><summary>${index + 1}. ${esc(item[0])}</summary><p>${esc(item[1])}</p></details>`).join("")}
        </section>
        <section class="reference-note compact-reference">
          <h3>參考書目</h3>
          <p>第 4 版作者、年份與 ISBN 依 WorldCat 書目；章名與版本對照依出版社公開 transition guide。</p>
          <div class="reference-actions"><a href="${fourthEdition.sources.catalog}" rel="noreferrer">WorldCat 第 4 版書目</a><a href="${fourthEdition.sources.chapters}" rel="noreferrer">出版社章節對照</a></div>
        </section>
      </article>`,
    activeChapter: 0,
    activeView: "map",
    depth: 0
  });
}

function chapterPage(chapter) {
  const bookChapter = fourthEdition.chapters.find((item) => item.chapter === chapter.chapter);
  const sectionNav = chapter.sections.map((section, index) => `<a href="#section-${index + 1}">${esc(section.title)}</a>`).join("");
  const schedule = chapter.chapter === 1 ? courseSchedule() : "";
  const scheduleNav = chapter.chapter === 1 ? `<a href="#course-schedule">18 週課程進度</a>` : "";
  const sections = chapter.sections.map((section, index) => `<section class="chapter-section" id="section-${index + 1}">
      <h3>${esc(section.title)}</h3>
      ${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
      ${section.figure ? diagram(section.figure) : ""}
      <p class="source-ref">資料基礎：${section.sourceRefs.map((ref) => `<a href="#source-${esc(ref)}">${esc(ref)}</a>`).join("、")}</p>
    </section>`).join("");
  const worked = chapter.workedExamples.map((example, index) => `<section class="worked-example chapter-worked">
      <p class="eyebrow">Worked example ${index + 1}</p>
      <h3>${esc(example.title)}</h3>
      <p><strong>題目：</strong>${esc(example.prompt)}</p>
      <ol>${example.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
      <p class="worked-result"><strong>結論：</strong>${esc(example.result)}</p>
    </section>`).join("");
  const misconceptions = chapter.misconceptions.map(([claim, correction]) => `<article><h4>${esc(claim)}</h4><p>${esc(correction)}</p></article>`).join("");
  const exercises = chapter.exercises.map((exercise, index) => `<details>
      <summary><span>${esc(exercise.level)}</span>${index + 1}. ${esc(exercise.question)}</summary>
      <div><h4>完整解答</h4><ol>${exercise.solution.map((step) => `<li>${esc(step)}</li>`).join("")}</ol></div>
    </details>`).join("");
  const glossary = chapter.glossary.map(([term, definition]) => `<tr><th>${esc(term)}</th><td>${esc(definition)}</td></tr>`).join("");
  const sources = chapter.sources.map((source) => `<li id="source-${esc(source.key)}"><a href="${esc(source.url)}" rel="noreferrer">${esc(source.key)} · ${esc(source.title)}</a><p>${esc(source.use)}（查閱：${esc(source.accessed)}）</p></li>`).join("");

  return pageShell({
    title: `第 ${chapter.chapter} 章 ${chapter.title} | 計算機組織完整自學教材`,
    description: `計算機組織第 ${chapter.chapter} 章完整自學教材：${chapter.title}，包含推導、圖表、例題、練習與詳解。`,
    body: `<article class="chapter-page">
        <nav class="breadcrumb" aria-label="麵包屑"><a href="../index.html">課程首頁</a><a href="../fourth-edition-map.html">第 4 版對照</a><span>第 ${chapter.chapter} 章</span></nav>
        <header class="chapter-hero">
          <p class="eyebrow">Chapter ${chapter.chapter} · Revised ${esc(chapter.revised)}</p>
          <h2>第 ${chapter.chapter} 章<br>${esc(chapter.title)}</h2>
          <p class="chapter-english">${esc(chapter.english)}</p>
          <p>${esc(chapter.intro)}</p>
          <dl class="chapter-meta"><div><dt>教材對照</dt><dd>第 ${chapter.chapter} 章 ${esc(bookChapter.title)}</dd></div><div><dt>預估時間</dt><dd>${esc(chapter.readingTime)}</dd></div><div><dt>更新日期</dt><dd>${esc(chapter.revised)}</dd></div></dl>
        </header>
        <section class="chapter-outcomes">
          <h3>完成本章後應能做到</h3>
          <ol>${chapter.outcomes.map((outcome) => `<li>${esc(outcome)}</li>`).join("")}</ol>
        </section>
        ${schedule}
        <nav class="chapter-toc" aria-label="本章目錄"><h3>本章路徑</h3>${scheduleNav}${sectionNav}<a href="#worked-examples">逐步例題</a><a href="#exercises">分級練習與詳解</a><a href="#glossary">術語表</a></nav>
        <div class="chapter-reading">${sections}</div>
        <section class="chapter-worked-list" id="worked-examples"><h2>逐步例題</h2>${worked}</section>
        <section class="chapter-misconceptions misconception-panel"><h2>常見誤解與修正</h2><div>${misconceptions}</div></section>
        <section class="chapter-exercises self-check" id="exercises"><h2>分級練習與完整解答</h2><p>先完成 state、公式或推理，再展開答案核對。每題解答都列出判斷依據。</p>${exercises}</section>
        <section class="chapter-glossary" id="glossary"><h2>本章術語表</h2><div class="diagram-table-wrap"><table><tbody>${glossary}</tbody></table></div></section>
        <section class="chapter-sources"><h2>技術來源與延伸閱讀</h2><p>各節所引用的架構、規格與技術資料如下。</p><ol>${sources}</ol></section>
      </article>`,
    activeChapter: chapter.chapter,
    depth: 1
  });
}

function chapterOverviewPage(chapter) {
  const topicLectures = fourthEdition.weekMap
    .filter((mapping) => mapping.chapters.includes(chapter.chapter) && ![9, 18].includes(mapping.week))
    .map((mapping) => lectures.find((item) => item.week === mapping.week))
    .filter((lecture, index, items) => lecture && items.findIndex((item) => item.week === lecture.week) === index);
  const integratedTopics = topicLectures.map((lecture, index) => integratedChapterTopic(lecture, index + 1)).join("");
  const standaloneTopics = standaloneChapterSections(chapter);

  const adjacent = fourthEdition.chapters.filter((item) => Math.abs(item.chapter - chapter.chapter) === 1);
  return pageShell({
    title: `第 ${chapter.chapter} 章 ${chapter.zh} | 計算機組織`,
    description: `計算機組織第 ${chapter.chapter} 章 ${chapter.zh}完整章節教材。`,
    body: `<article class="chapter-overview-page">
      <nav class="breadcrumb" aria-label="麵包屑"><a href="../index.html">課程首頁</a><a href="../fourth-edition-map.html">第 4 版對照</a><span>第 ${chapter.chapter} 章</span></nav>
      <header class="chapter-overview-hero">
        <p class="eyebrow">Chapter ${chapter.chapter}</p>
        <h2>第 ${chapter.chapter} 章<br>${esc(chapter.zh)}</h2>
        <p class="chapter-english">${esc(chapter.title)}</p>
        <p>${esc(chapter.summary)}</p>
      </header>
      <div class="chapter-integrated-reading">${integratedTopics}${standaloneTopics}</div>
      <nav class="chapter-adjacent" aria-label="相鄰章節">
        ${adjacent.map((item) => `<a href="chapter-${String(item.chapter).padStart(2, "0")}.html"><span>第 ${item.chapter} 章</span><strong>${esc(item.zh)}</strong></a>`).join("")}
      </nav>
    </article>`,
    activeChapter: chapter.chapter,
    depth: 1
  });
}

fs.rmSync(path.join(root, "weeks"), { recursive: true, force: true });
fs.mkdirSync(path.join(root, "chapters"), { recursive: true });
const cleanHtml = (html) => html.replace(/[ \t]+$/gm, "");

fs.writeFileSync(path.join(root, "index.html"), cleanHtml(indexPage()));
fs.writeFileSync(path.join(root, "fourth-edition-map.html"), cleanHtml(fourthEditionPage()));
for (const chapter of fourthEdition.chapters) {
  const detail = chapterDetails.find((item) => item.chapter === chapter.chapter);
  const html = detail ? chapterPage(detail) : chapterOverviewPage(chapter);
  fs.writeFileSync(path.join(root, "chapters", `chapter-${String(chapter.chapter).padStart(2, "0")}.html`), cleanHtml(html));
}

console.log(`Generated ${fourthEdition.chapters.length + 2} chapter-first pages.`);
