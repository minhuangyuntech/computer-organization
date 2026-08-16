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
  12: {
    sections: [
      ["分層與封裝", "網路分層把複雜通訊拆成具有明確介面的服務。應用資料向下傳遞時，各層加入自己的控制資訊；接收端再依相反順序解除封裝。這和 ISA 隱藏微架構細節的做法相同：上層依賴介面，不必知道所有實作。"],
      ["交換與路由", "交換器主要依區域網路中的鏈路層位址轉送 frame，路由器則依網路層位址在不同網路間選擇 packet 路徑。兩者都使用表格進行查找，但所處層次、位址語意與更新機制不同。"],
      ["延遲、頻寬與佇列", "總通訊時間不能只看鏈路頻寬。傳播延遲、傳輸延遲、處理延遲與排隊延遲會共同決定完成時間；當封包到達率接近服務率時，排隊延遲會快速增加。"]
    ],
    checks: [
      ["為何分層介面能降低系統複雜度？", "每一層只承諾可觀察的服務與資料格式，下層實作可以改變而不迫使所有上層一起修改。"],
      ["頻寬提高是否必然等比例縮短回應時間？", "不一定。若主要成本來自傳播、處理或排隊延遲，只提高傳輸頻寬的改善幅度會受到限制。"]
    ]
  },
  13: {
    sections: [
      ["儲存介面的角色", "儲存介面規範主機如何描述命令、定位資料、回報完成狀態與處理錯誤。裝置內部可以採用不同媒體與控制器，只要遵守介面契約，作業系統就能透過一致的驅動模型存取。"],
      ["命令、佇列與資料搬移", "現代儲存路徑通常把控制命令與大量資料傳輸分開。CPU 建立描述子與命令佇列，控制器再透過 DMA 搬移資料；佇列深度與並行度會影響吞吐量，也可能增加單一請求的等待時間。"],
      ["直連、網路與共享儲存", "直連介面讓裝置靠近單一主機；網路型儲存則把 block 或 file 服務放到可共享的網路端點。比較架構時應同時檢查延遲、頻寬、可用性、一致性、管理成本與故障範圍。"]
    ],
    checks: [
      ["為何 DMA 適合大量儲存資料傳輸？", "CPU 只需設定傳輸描述，控制器即可直接在裝置與主記憶體間搬移資料，減少逐字搬移所需的指令與中斷。"],
      ["較深的命令佇列一定能降低延遲嗎？", "不一定。較深佇列可以提高裝置利用率與吞吐量，但請求也可能等待更久，因此吞吐量與尾端延遲必須分別量測。"]
    ]
  }
};

function standaloneChapterSections(chapter) {
  const content = standaloneChapterContent[chapter.chapter];
  if (!content) return "";
  return `<section class="standalone-chapter-content">
    ${content.sections.map(([title, text], index) => `<section class="chapter-topic-block"><p class="eyebrow">Core topic ${String(index + 1).padStart(2, "0")}</p><h2>${esc(title)}</h2><p>${esc(text)}</p></section>`).join("")}
    <section class="self-check chapter-topic-check"><h2>自我檢核</h2>${content.checks.map(([question, answer], index) => `<details><summary>${index + 1}. ${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("")}</section>
  </section>`;
}

function courseSchedule() {
  const rows = lectures.map((lecture) => `<tr><th>第 ${lecture.week} 週</th><td>${esc(lecture.title)}</td><td>${esc(lecture.goals[0])}</td></tr>`).join("");
  return `<section class="chapter-schedule" id="course-schedule">
    <p class="eyebrow">Course schedule</p>
    <h2>18 週課程進度</h2>
    <p>週次僅用來呈現學期時間安排；教材本體仍依章節組織，閱讀時可直接使用頂部章節導覽。</p>
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
    <p>計算機組織線上講義 · 多頁式靜態網站 · 適用 GitHub Pages</p>
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
    description: "國立雲林科技大學 115 學年度第 1 學期計算機組織多頁式線上講義。",
    body: `<section class="cpu-hero">
        <header class="cpu-hero-copy">
          <p class="eyebrow">從程式到硬體的可追蹤路徑</p>
          <h2>看懂一行指令如何穿過暫存器、ALU、Pipeline 與 Cache</h2>
          <p>本講義以 13 個章節建立完整學習路徑。每章都有獨立 URL，可依序閱讀、反覆推導、完成練習，並可列印成 PDF 離線使用。</p>
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
      <section class="course-facts" aria-label="課程資訊">
        <div><span>班級</span><strong>四電子三</strong></div>
        <div><span>時間</span><strong>週一 BCD</strong></div>
        <div><span>教室</span><strong>ES004</strong></div>
        <div><span>學分</span><strong>3-0-3</strong></div>
        <div><span>評量</span><strong>平時 30% · 期中 30% · 期末專題 40%</strong></div>
      </section>
      <section class="chapter-index" id="chapters">
        <header class="index-heading">
          <div><p class="eyebrow">Chapter-based materials</p><h2>13 章教材</h2></div>
          <p>章次依《The Essentials of Computer Organization and Architecture》第 4 版編排；此處與頂部 CH 01–13 導覽前往完全相同的章節頁。</p>
        </header>
        <div class="home-chapter-grid">${homeChapterCards}</div>
      </section>
      <section class="reference-note">
        <p class="eyebrow">Independent study edition</p>
        <h2>內容範圍與編寫原則</h2>
        <p>本站依課程大綱撰寫，並對照 Linda Null 與 Julia Lobur《The Essentials of Computer Organization and Architecture》第 4 版（2015，ISBN 9781284033144）的章節架構。所有中文敘述、例題、推導與圖表均為本站獨立編寫，不重製書中文字或原圖。</p>
        <div class="reference-actions"><a href="#chapters">前往 13 章教材</a><a href="fourth-edition-map.html">第 4 版章節對照</a><a href="${fourthEdition.sources.chapters}" rel="noreferrer">出版社章節資料</a></div>
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
      <a class="chapter-detail-link" href="chapters/chapter-${String(chapter.chapter).padStart(2, "0")}.html">進入本章獨立頁面</a>
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
          <h3>版本依據</h3>
          <p>第 4 版作者、年份與 ISBN 依 WorldCat 書目；章名與第四、第五版對照依出版社公開 transition guide。本站只使用公開書目與章節名稱進行定位，講解與圖表均為獨立編寫。</p>
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
          <p class="eyebrow">Detailed self-study chapter · Revised ${esc(chapter.revised)}</p>
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
        <section class="chapter-sources"><h2>研究來源與查閱日期</h2><p>以下來源只用來核對技術事實與當前規格；本站文字、例題與圖表均為原創整理。</p><ol>${sources}</ol></section>
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
        <p class="eyebrow">Chapter ${chapter.chapter} · Independent page</p>
        <h2>第 ${chapter.chapter} 章<br>${esc(chapter.zh)}</h2>
        <p class="chapter-english">${esc(chapter.title)}</p>
        <p>${esc(chapter.summary)}</p>
      </header>
      <section class="chapter-overview-focus">
        <p class="eyebrow">Chapter guide</p>
        <h3>本章內容</h3>
        <p>本章直接整合核心概念、原創圖表、推導、例題與自我檢核。所有內容都在同一章內連續閱讀，不需要切換到另一套分類頁面。</p>
      </section>
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
