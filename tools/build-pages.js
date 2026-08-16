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

const units = [
  { title: "系統與效能基礎", weeks: [1, 2, 3], text: "建立抽象層、效能公式與資料表示能力，用來理解系統如何被描述與量測。" },
  { title: "MIPS 指令與程式", weeks: [4, 5, 6, 7, 8], text: "用 MIPS 連接高階程式與機器指令，涵蓋暫存器、記憶體存取、函式、算術與指令編碼。" },
  { title: "處理器資料路徑與 Pipeline", weeks: [10, 11, 12], text: "從單週期資料路徑進入 pipeline，分析控制訊號、效能、資料相依與分支代價。" },
  { title: "記憶體階層與 Cache", weeks: [13, 14, 15, 16], text: "理解 locality、AMAT、cache block、mapping、replacement policy 與實際效能折衷。" },
  { title: "整合與評量", weeks: [9, 17, 18], text: "安排期中、期末與專題整合，把公式、指令、資料路徑與 cache 放回完整系統。" }
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

function courseCard() {
  return `<section class="course-card">
        <p class="eyebrow">Computer Organization</p>
        <h2>何敏煌老師</h2>
        <dl>
          <div><dt>班級</dt><dd>四電子三</dd></div>
          <div><dt>時間</dt><dd>週一 BCD / ES004</dd></div>
          <div><dt>教室</dt><dd>ES004</dd></div>
          <div><dt>學分</dt><dd>3-0-3</dd></div>
          <div><dt>評量</dt><dd>平時 30%、期中 30%、期末專題 40%</dd></div>
        </dl>
      </section>`;
}

function weekNav(activeWeek, depth = 0, weekPrefix) {
  const prefix = weekPrefix ?? (depth ? "" : "weeks/");
  return `<label class="search-box">
        <span>搜尋週次</span>
        <input id="searchInput" type="search" placeholder="例如：CPI、hazard、cache">
      </label>
      <div class="week-list" id="weekList">
        ${lectures.map((lecture) => `
        <a class="week-button week-link ${lecture.week === activeWeek ? "active" : ""}" href="${prefix}${slug(lecture.week)}" data-search="${esc([lecture.title, lecture.english, lecture.tags.join(" "), lecture.goals.join(" "), lecture.notes.join(" ")].join(" ").toLowerCase())}">
          <strong>${String(lecture.week).padStart(2, "0")}</strong>
          <span>${esc(lecture.title)}<small>${esc(lecture.english)}</small></span>
        </a>`).join("")}
      </div>`;
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

function pageShell({ title, description, body, activeWeek = 0, depth = 0, weekPrefix }) {
  const prefix = depth ? "../" : "";
  return `${head(title, description, depth)}
<body>
  ${topbar(depth)}
  <main class="layout">
    <aside class="sidebar" aria-label="週次導覽">
      ${courseCard()}
      ${weekNav(activeWeek, depth, weekPrefix)}
    </aside>
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
  const cards = lectures.map((lecture) => `
    <a class="week-card" href="weeks/${slug(lecture.week)}" data-search="${esc([lecture.title, lecture.english, lecture.tags.join(" "), lecture.goals.join(" ")].join(" ").toLowerCase())}">
      <span>Week ${String(lecture.week).padStart(2, "0")}</span>
      <h3>${esc(lecture.title)}</h3>
      <p>${esc(lecture.english)}</p>
      <div class="tags">${lecture.tags.map((tag) => `<small class="tag">${esc(tag)}</small>`).join("")}</div>
    </a>`).join("");

  const unitCards = units.map((unit) => `
    <article>
      <h3>${esc(unit.title)}</h3>
      <p>${esc(unit.text)}</p>
      <p class="note">週次：${unit.weeks.map((w) => `第 ${w} 週`).join("、")}</p>
    </article>`).join("");

  return pageShell({
    title: "計算機組織線上講義 | 115-1 YunTech",
    description: "國立雲林科技大學 115 學年度第 1 學期計算機組織多頁式線上講義。",
    body: `<section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">從程式到硬體的可追蹤路徑</p>
          <h2>看懂一行指令如何穿過暫存器、ALU、Pipeline 與 Cache</h2>
          <p>本講義依據課綱 18 週進度展開。每週都有獨立 URL，可依序自學、反覆推導、完成練習、課後複習，並可列印成 PDF 離線閱讀。</p>
        </div>
        <div class="chip-visual" aria-label="處理器與記憶體階層示意圖" role="img">
          <div class="chip-core">CPU</div>
          <div class="chip-block b1">REG</div>
          <div class="chip-block b2">ALU</div>
          <div class="chip-block b3">CTRL</div>
          <div class="chip-block b4">L1</div>
          <div class="trace t1"></div><div class="trace t2"></div><div class="trace t3"></div><div class="trace t4"></div>
        </div>
      </section>
      <section class="overview-grid">${unitCards}</section>
      <section class="reference-note">
        <p class="eyebrow">Independent study edition</p>
        <h2>內容範圍與編寫原則</h2>
        <p>本站依課程大綱撰寫，並對照 Linda Null 與 Julia Lobur《The Essentials of Computer Organization and Architecture》第 4 版（2015，ISBN 9781284033144）的章節架構。所有中文敘述、例題、推導與圖表均為本站獨立編寫，不重製書中文字或原圖。</p>
        <div class="reference-actions"><a href="fourth-edition-map.html">第 4 版章節與週次對照</a><a href="chapters/chapter-01.html">閱讀第 1 章完整自學教材</a><a href="${fourthEdition.sources.chapters}" rel="noreferrer">出版社章節對照資料</a></div>
      </section>
      <section class="lecture-view">
        <h2>18 週講義索引</h2>
        <p>每週頁面都包含學習目標、自學導讀、原創圖表、概念推導、逐步例題、常見誤解、自我檢核、練習任務與公式速查。</p>
        <div class="week-card-grid">${cards}</div>
      </section>`,
    activeWeek: 0,
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
        <div class="lecture-grid">
          <div>
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
            <nav class="pager" aria-label="週次切換">
              ${prev ? `<a href="${slug(prev.week)}">← 第 ${prev.week} 週</a>` : `<span></span>`}
              ${next ? `<a href="${slug(next.week)}">第 ${next.week} 週 →</a>` : `<span></span>`}
            </nav>
          </div>
          <aside class="side-notes">
            <section class="tool-card"><h4>常用公式</h4>${table(formulas)}</section>
            <section class="tool-card"><h4>MIPS 暫存器速查</h4>${table(registers)}</section>
            <section class="tool-card"><h4>學習重點</h4><p>先掌握本週名詞，再追蹤資料或控制如何流動，最後用公式或例題檢查自己的理解。</p></section>
          </aside>
        </div>
      </article>`;
  return pageShell({
    title: `第 ${lecture.week} 週 ${lecture.title} | 計算機組織`,
    description: `計算機組織第 ${lecture.week} 週講義：${lecture.title}。`,
    body,
    activeWeek: lecture.week,
    depth: 1
  });
}

function fourthEditionPage() {
  const chapterCards = fourthEdition.chapters.map((chapter) => {
    const detail = chapterDetails.find((item) => item.chapter === chapter.chapter);
    return `<article class="chapter-card" id="chapter-${chapter.chapter}">
      <p class="eyebrow">Chapter ${chapter.chapter}</p>
      <h3>${esc(chapter.zh)}</h3>
      <p class="chapter-title">${esc(chapter.title)}</p>
      <p>${esc(chapter.summary)}</p>
      <p class="chapter-course"><strong>本站對應：</strong>${esc(chapter.courseUse)}</p>
      ${detail ? `<a class="chapter-detail-link" href="chapters/chapter-${String(chapter.chapter).padStart(2, "0")}.html">閱讀完整自學章節</a>` : `<span class="chapter-pending">詳細章節逐步建置中</span>`}
    </article>`;
  }).join("");

  const weekRows = fourthEdition.weekMap.map((mapping) => {
    const lecture = lectures.find((item) => item.week === mapping.week);
    const chapters = mapping.chapters.map((chapter) => `<a href="#chapter-${chapter}">第 ${chapter} 章</a>`).join("、");
    return `<tr><th>第 ${mapping.week} 週</th><td>${esc(lecture.title)}</td><td>${chapters}<small>${esc(mapping.sections)}</small></td><td>${esc(mapping.focus)}</td></tr>`;
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
    description: "計算機組織 18 週講義與 The Essentials of Computer Organization and Architecture 第 4 版的章節對照，以及 MARIE 與 MIPS 比較。",
    body: `<article class="edition-page">
        <nav class="breadcrumb" aria-label="麵包屑"><a href="index.html">課程首頁</a><span>第 4 版章節對照</span></nav>
        <header class="edition-hero">
          <p class="eyebrow">Textbook companion · Fourth edition</p>
          <h2>第 4 版中譯本章節對照</h2>
          <p>${esc(fourthEdition.authors.join("、"))}，${esc(fourthEdition.title)}，第 ${fourthEdition.edition} 版，${fourthEdition.year}，ISBN ${esc(fourthEdition.isbn)}。</p>
          <p>課程依正式課綱使用 MIPS 作為主要 ISA；第 4 版第 4 章則以 MARIE 建立 CPU 基本模型。兩條路徑共享 register transfer、instruction cycle、datapath 與 control 等核心概念。</p>
        </header>
        <section class="section" id="week-map">
          <h3>18 週與第 4 版節次對照</h3>
          <p>表中的章名為本站對照名稱；節次依第 4 版英文目錄標示，方便在中譯本中以章號與主題定位。</p>
          <div class="diagram-table-wrap"><table class="edition-map-table"><thead><tr><th>週次</th><th>本站主題</th><th>第 4 版</th><th>概念交集</th></tr></thead><tbody>${weekRows}</tbody></table></div>
        </section>
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
    activeWeek: 0,
    depth: 0
  });
}

function chapterPage(chapter) {
  const bookChapter = fourthEdition.chapters.find((item) => item.chapter === chapter.chapter);
  const sectionNav = chapter.sections.map((section, index) => `<a href="#section-${index + 1}">${esc(section.title)}</a>`).join("");
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
        <nav class="chapter-toc" aria-label="本章目錄"><h3>本章路徑</h3>${sectionNav}<a href="#worked-examples">逐步例題</a><a href="#exercises">分級練習與詳解</a><a href="#glossary">術語表</a></nav>
        <div class="chapter-reading">${sections}</div>
        <section class="chapter-worked-list" id="worked-examples"><h2>逐步例題</h2>${worked}</section>
        <section class="chapter-misconceptions misconception-panel"><h2>常見誤解與修正</h2><div>${misconceptions}</div></section>
        <section class="chapter-exercises self-check" id="exercises"><h2>分級練習與完整解答</h2><p>先完成 state、公式或推理，再展開答案核對。每題解答都列出判斷依據。</p>${exercises}</section>
        <section class="chapter-glossary" id="glossary"><h2>本章術語表</h2><div class="diagram-table-wrap"><table><tbody>${glossary}</tbody></table></div></section>
        <section class="chapter-sources"><h2>研究來源與查閱日期</h2><p>以下來源只用來核對技術事實與當前規格；本站文字、例題與圖表均為原創整理。</p><ol>${sources}</ol></section>
      </article>`,
    activeWeek: chapter.chapter === 1 ? 1 : 0,
    depth: 1,
    weekPrefix: "../weeks/"
  });
}

fs.mkdirSync(path.join(root, "weeks"), { recursive: true });
fs.mkdirSync(path.join(root, "chapters"), { recursive: true });
const cleanHtml = (html) => html.replace(/[ \t]+$/gm, "");

fs.writeFileSync(path.join(root, "index.html"), cleanHtml(indexPage()));
fs.writeFileSync(path.join(root, "fourth-edition-map.html"), cleanHtml(fourthEditionPage()));
for (const lecture of lectures) {
  fs.writeFileSync(path.join(root, "weeks", slug(lecture.week)), cleanHtml(weekPage(lecture)));
}
for (const chapter of chapterDetails) {
  fs.writeFileSync(path.join(root, "chapters", `chapter-${String(chapter.chapter).padStart(2, "0")}.html`), cleanHtml(chapterPage(chapter)));
}

console.log(`Generated ${lectures.length + chapterDetails.length + 2} pages.`);
