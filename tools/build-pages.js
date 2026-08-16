const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");

function extractConst(name) {
  const start = appSource.indexOf(`const ${name} = `);
  if (start === -1) throw new Error(`Cannot find ${name}`);
  const afterEquals = appSource.indexOf("=", start) + 1;
  const end = appSource.indexOf(";\n", afterEquals);
  return vm.runInNewContext(`(${appSource.slice(afterEquals, end).trim()})`);
}

const lectures = extractConst("lectures");
const formulas = extractConst("formulas");
const registers = extractConst("registers");

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

function weekNav(activeWeek, depth = 0) {
  const prefix = depth ? "" : "weeks/";
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

function expandedDiscussion(lecture) {
  return lecture.concepts.map(([term, text]) => `
    <section class="detail-block">
      <h4>${esc(term)}的重點說明</h4>
      <p>${esc(text)}</p>
      <p>在計算機組織中，這個概念通常同時牽涉程式、指令、硬體與效能四個層次。理解時要注意它改變了哪些狀態、使用了哪些硬體資源，以及最後如何影響正確性或執行時間。</p>
    </section>`).join("");
}

function pageShell({ title, description, body, activeWeek = 0, depth = 0 }) {
  const prefix = depth ? "../" : "";
  return `${head(title, description, depth)}
<body>
  ${topbar(depth)}
  <main class="layout">
    <aside class="sidebar" aria-label="週次導覽">
      ${courseCard()}
      ${weekNav(activeWeek, depth)}
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
          <p>本講義依據課綱 18 週進度展開。新版採多頁式架構，每週有獨立 URL，方便課前派讀、課中投影、課後複習、列印成 PDF 與後續增補。</p>
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
      <section class="lecture-view">
        <h2>18 週講義索引</h2>
        <p>每週頁面都包含學習目標、核心概念、深入說明、學習路徑、例題、練習任務、課後檢核與公式速查。</p>
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
            <section class="section">
              <h3>核心概念</h3>
              <ul class="concept-list">${lecture.concepts.map(([term, text]) => `<li><strong>${esc(term)}：</strong>${esc(text)}</li>`).join("")}</ul>
            </section>
            <section class="section">
              <h3>講義筆記</h3>
              ${lecture.notes.map((note) => `<p>${esc(note)}</p>`).join("")}
            </section>
            <section class="section">
              <h3>深入說明</h3>
              ${expandedDiscussion(lecture)}
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

fs.mkdirSync(path.join(root, "weeks"), { recursive: true });
const cleanHtml = (html) => html.replace(/[ \t]+$/gm, "");

fs.writeFileSync(path.join(root, "index.html"), cleanHtml(indexPage()));
for (const lecture of lectures) {
  fs.writeFileSync(path.join(root, "weeks", slug(lecture.week)), cleanHtml(weekPage(lecture)));
}

console.log(`Generated ${lectures.length + 1} pages.`);
