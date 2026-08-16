const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function extractConst(file, name) {
  const source = fs.readFileSync(file, "utf8");
  const start = source.indexOf(`const ${name} = `);
  if (start === -1) throw new Error(`Cannot find ${name} in ${file}`);
  const afterEquals = source.indexOf("=", start) + 1;
  const end = source.indexOf(";\n", afterEquals);
  return vm.runInNewContext(`(${source.slice(afterEquals, end).trim()})`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const lectures = extractConst(path.join(root, "app.js"), "lectures");
const supplements = extractConst(path.join(root, "content", "supplements.js"), "supplements");
const fourthEdition = extractConst(path.join(root, "content", "fourth-edition.js"), "fourthEdition");
const chapterDetails = extractConst(path.join(root, "content", "chapters.js"), "chapterDetails");

assert(lectures.length === 18, "Expected 18 lectures");
assert(supplements.length === 18, "Expected 18 supplements");
assert(new Set(supplements.map((item) => item.week)).size === 18, "Supplement week numbers must be unique");
assert(fourthEdition.edition === 4, "Textbook mapping must target the fourth edition");
assert(fourthEdition.year === 2015, "Fourth edition publication year must be 2015");
assert(fourthEdition.authors.join("|") === "Linda Null|Julia Lobur", "Fourth edition author attribution is incorrect");
assert(fourthEdition.isbn === "9781284033144", "Fourth edition ISBN is incorrect");
assert(fourthEdition.chapters.length === 13, "Fourth edition must contain 13 mapped chapters");
assert(new Set(fourthEdition.chapters.map((item) => item.chapter)).size === 13, "Fourth edition chapter numbers must be unique");
assert(fourthEdition.weekMap.length === 18, "Every course week needs a fourth edition mapping");
assert(new Set(fourthEdition.weekMap.map((item) => item.week)).size === 18, "Fourth edition week mappings must be unique");
assert(chapterDetails.length >= 1, "At least one detailed self-study chapter is required");
assert(new Set(chapterDetails.map((item) => item.chapter)).size === chapterDetails.length, "Detailed chapter numbers must be unique");

for (const chapter of chapterDetails) {
  assert(fourthEdition.chapters.some((item) => item.chapter === chapter.chapter), `Detailed chapter ${chapter.chapter} is not in the fourth edition map`);
  assert(chapter.intro.length >= 180, `Chapter ${chapter.chapter} introduction is too short`);
  assert(chapter.outcomes.length >= 5, `Chapter ${chapter.chapter} needs at least five outcomes`);
  assert(chapter.sections.length >= 8, `Chapter ${chapter.chapter} needs at least eight full sections`);
  assert(chapter.sections.filter((item) => item.figure).length >= 3, `Chapter ${chapter.chapter} needs at least three diagrams`);
  assert(chapter.sections.every((item) => item.paragraphs.length >= 3), `Chapter ${chapter.chapter} sections need at least three paragraphs`);
  assert(chapter.workedExamples.length >= 4, `Chapter ${chapter.chapter} needs at least four worked examples`);
  assert(chapter.workedExamples.every((item) => item.steps.length >= 5), `Chapter ${chapter.chapter} worked examples need at least five steps`);
  assert(chapter.misconceptions.length >= 5, `Chapter ${chapter.chapter} needs at least five misconception corrections`);
  assert(chapter.exercises.length >= 10, `Chapter ${chapter.chapter} needs at least ten exercises with solutions`);
  assert(chapter.exercises.every((item) => item.solution.length >= 2), `Chapter ${chapter.chapter} exercise solutions are incomplete`);
  assert(chapter.glossary.length >= 12, `Chapter ${chapter.chapter} glossary is too short`);
  assert(chapter.sources.length >= 4, `Chapter ${chapter.chapter} needs at least four authoritative sources`);
  const sourceKeys = new Set(chapter.sources.map((source) => source.key));
  assert(sourceKeys.size === chapter.sources.length, `Chapter ${chapter.chapter} source keys must be unique`);
  assert(chapter.sources.every((source) => /^https:\/\//.test(source.url)), `Chapter ${chapter.chapter} source URLs must use HTTPS`);
  for (const section of chapter.sections) {
    assert(section.sourceRefs.every((key) => sourceKeys.has(key)), `Chapter ${chapter.chapter} section references an unknown source`);
  }
}

for (const mapping of fourthEdition.weekMap) {
  assert(mapping.chapters.length >= 1, `Week ${mapping.week} needs at least one fourth edition chapter`);
  assert(mapping.sections && mapping.focus, `Week ${mapping.week} fourth edition mapping is incomplete`);
  for (const chapter of mapping.chapters) {
    assert(fourthEdition.chapters.some((item) => item.chapter === chapter), `Week ${mapping.week} references missing chapter ${chapter}`);
  }
}

const marie = fourthEdition.marie;
assert(marie.format.totalBits === 16, "MARIE instruction width must be 16 bits");
assert(marie.format.fields.reduce((sum, field) => sum + field.bits, 0) === 16, "MARIE instruction fields must sum to 16 bits");
assert(marie.format.fields[0].bits === 4 && marie.format.fields[1].bits === 12, "MARIE format must use a 4-bit opcode and 12-bit address");
assert(2 ** marie.format.fields[1].bits === 4096, "MARIE address field must select 4096 words");
assert(marie.fetch.length === 5, "MARIE fetch sequence is incomplete");
assert(marie.worked.mips[0].includes("0($s0)") && marie.worked.mips[3].includes("8($s0)"), "MIPS comparison must use explicit base-plus-offset addressing");

for (let week = 1; week <= 18; week += 1) {
  const item = supplements.find((supplement) => supplement.week === week);
  assert(item, `Missing supplement for week ${week}`);
  assert(item.bridge.length >= 45, `Week ${week} bridge is too short`);
  assert(item.sections.length >= 2, `Week ${week} needs at least two derivation sections`);
  assert(item.worked.steps.length >= 3, `Week ${week} worked example needs at least three steps`);
  assert(item.pitfalls.length >= 3, `Week ${week} needs at least three misconceptions`);
  assert(item.selfTest.length >= 2, `Week ${week} needs at least two self-check questions`);

  const figure = item.diagram;
  assert(figure && figure.title && figure.caption, `Week ${week} diagram metadata is incomplete`);
  if (figure.type === "bits") {
    const sum = figure.items.reduce((total, field) => total + field.bits, 0);
    assert(sum === figure.totalBits, `Week ${week} bit fields sum to ${sum}, expected ${figure.totalBits}`);
  }
  if (figure.type === "timeline") {
    for (const row of figure.rows) {
      assert(row.cells.length === figure.columns.length, `Week ${week} timeline row ${row.label} has incorrect length`);
    }
  }
  if (figure.type === "matrix") {
    for (const row of figure.rows) {
      assert(row.length === figure.columns.length, `Week ${week} matrix row has incorrect length`);
    }
  }
}

const mipsAdd = ((17 << 21) | (18 << 16) | (8 << 11) | 32) >>> 0;
assert(mipsAdd === 0x02324020, "MIPS add encoding check failed");

const cacheSize = 16 * 1024;
const blockSize = 64;
const ways = 4;
const sets = cacheSize / (blockSize * ways);
assert(sets === 64, "Cache set count check failed");
const address = 0x12345678;
assert((address & 0x3f) === 56, "Cache offset check failed");
assert(((address >>> 6) & 0x3f) === 25, "Cache index check failed");
assert((address >>> 12) === 0x12345, "Cache tag check failed");

assert(5 + 5 - 1 === 9, "Ideal pipeline cycle check failed");
assert(Math.abs((1 + 0.04 * (10 + 0.20 * 100)) - 2.2) < 1e-12, "Two-level AMAT check failed");
assert(Math.abs((1 + 0.15 * 0.08 * 3 + 0.30 * 0.04 * 50) - 1.636) < 1e-12, "Integrated CPI check failed");
assert(Math.abs((8e8 * 1.4 / 2.5e9) - 0.448) < 1e-12, "Chapter 1 processor P time check failed");
assert(Math.abs((8e8 * 1.0 / 2.0e9) - 0.4) < 1e-12, "Chapter 1 processor Q time check failed");
assert(Math.abs((2e9 * 1.2 / 3e9) - 0.8) < 1e-12, "Chapter 1 exercise CPU A time check failed");
assert(Math.abs((1.5e9 * 1.8 / 3.6e9) - 0.75) < 1e-12, "Chapter 1 exercise CPU B time check failed");

const homepage = path.join(root, "index.html");
const editionPage = path.join(root, "fourth-edition-map.html");
const weekFiles = Array.from({ length: 18 }, (_, index) => path.join(root, "weeks", `week-${String(index + 1).padStart(2, "0")}.html`));
const chapterFiles = fourthEdition.chapters.map((chapter) => path.join(root, "chapters", `chapter-${String(chapter.chapter).padStart(2, "0")}.html`));
const detailedChapterFiles = chapterDetails.map((chapter) => path.join(root, "chapters", `chapter-${String(chapter.chapter).padStart(2, "0")}.html`));
const htmlFiles = [homepage, editionPage, ...weekFiles, ...chapterFiles];
const prohibited = /教學建議|授課|請學生|讓學生|給學生|要求學生/;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  assert(!prohibited.test(html), `Teacher-facing wording found in ${path.relative(root, file)}`);
  assert(html.includes("class=\"chapter-nav\""), `Missing chapter navigation in ${path.relative(root, file)}`);
  assert((html.match(/class=\"chapter-nav-link/g) || []).length === 13, `Chapter navigation must contain 13 chapters in ${path.relative(root, file)}`);
  assert(!html.includes("<aside"), `Sidebar markup found in ${path.relative(root, file)}`);
  assert(!html.includes("class=\"sidebar\""), `Legacy sidebar found in ${path.relative(root, file)}`);
  assert(!html.includes("class=\"side-notes\""), `Legacy weekly sidebar found in ${path.relative(root, file)}`);
  if (weekFiles.includes(file)) {
    assert(html.includes("class=\"learning-figure\""), `Missing learning figure in ${path.relative(root, file)}`);
    assert((html.match(/<details>/g) || []).length >= 2, `Missing self-check answers in ${path.relative(root, file)}`);
    assert(html.includes("class=\"edition-alignment\""), `Missing fourth edition alignment in ${path.relative(root, file)}`);
    assert(html.includes("class=\"chapter-nav-weeks active\""), `Week navigation is not active in ${path.relative(root, file)}`);
    assert(!html.includes("class=\"chapter-nav-link active\""), `A week page incorrectly identifies itself as a chapter in ${path.relative(root, file)}`);
  }
  if (detailedChapterFiles.includes(file)) {
    assert(html.includes("class=\"chapter-page\""), `Missing detailed chapter layout in ${path.relative(root, file)}`);
    assert((html.match(/class=\"chapter-nav-link active\"/g) || []).length === 1, `Detailed chapter must activate exactly one chapter navigation item in ${path.relative(root, file)}`);
    assert((html.match(/class=\"chapter-section\"/g) || []).length >= 8, `Detailed chapter sections are incomplete in ${path.relative(root, file)}`);
    assert((html.match(/<details>/g) || []).length >= 10, `Detailed chapter exercises are incomplete in ${path.relative(root, file)}`);
  } else if (chapterFiles.includes(file)) {
    assert(html.includes("class=\"chapter-overview-page\""), `Missing independent chapter overview in ${path.relative(root, file)}`);
    assert((html.match(/class=\"chapter-nav-link active\"/g) || []).length === 1, `Chapter overview must activate exactly one chapter navigation item in ${path.relative(root, file)}`);
    assert(html.includes("class=\"chapter-week-card\"") || html.includes("class=\"chapter-extension\""), `Missing chapter learning path in ${path.relative(root, file)}`);
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:https?:|data:|#|mailto:)/.test(reference)) continue;
    const target = path.resolve(path.dirname(file), reference.split("#")[0]);
    assert(fs.existsSync(target), `Broken local reference ${reference} in ${path.relative(root, file)}`);
  }
}

const homepageHtml = fs.readFileSync(homepage, "utf8");
const editionHtml = fs.readFileSync(editionPage, "utf8");
assert(homepageHtml.includes("第 4 版（2015，ISBN 9781284033144）"), "Homepage fourth edition metadata is missing");
assert(!homepageHtml.includes("第六版"), "Homepage still references the sixth edition");
assert(homepageHtml.includes("class=\"modern-cpu-diagram\""), "Homepage modern CPU diagram is missing");
assert(!homepageHtml.includes("class=\"chip-visual\""), "Homepage still contains the legacy CPU image");
assert(homepageHtml.includes("週次不等於章次"), "Homepage does not distinguish course weeks from textbook chapters");
assert((homepageHtml.match(/class=\"home-chapter-card\"/g) || []).length === 13, "Homepage must show 13 chapter entry cards");
const navChapterHrefs = [...homepageHtml.matchAll(/<a class=\"chapter-nav-link[^\"]*\" href=\"([^\"]+)\"/g)].map((match) => match[1]);
const homeChapterHrefs = [...homepageHtml.matchAll(/<a class=\"home-chapter-card\" href=\"([^\"]+)\"/g)].map((match) => match[1]);
assert(JSON.stringify(navChapterHrefs) === JSON.stringify(homeChapterHrefs), "Homepage chapter cards and top chapter navigation must target identical pages");
assert(navChapterHrefs.every((href, index) => href.endsWith(`chapter-${String(index + 1).padStart(2, "0")}.html`)), "Chapter navigation order or destination is incorrect");
assert((homepageHtml.match(/<strong>CH \d{2}<\/strong>/g) || []).length === 13, "Chapter navigation labels must identify chapter numbers explicitly");
for (const label of ["Branch predictor", "L1 I-cache", "Fetch", "Decode", "Register rename", "Reorder buffer", "Integer ALUs", "FP / Vector", "Load / Store", "L1 D-cache", "Private L2", "Shared LLC", "Memory controller", "DRAM"]) {
  assert(homepageHtml.includes(label), `Homepage CPU diagram is missing ${label}`);
}
assert(editionHtml.includes("MARIE 16-bit 指令格式"), "Fourth edition page is missing the MARIE format diagram");
assert(editionHtml.includes("MAR ← PC"), "Fourth edition page is missing the MARIE fetch sequence");
assert((editionHtml.match(/class=\"chapter-card\"/g) || []).length === 13, "Fourth edition page must show 13 chapter cards");
assert((editionHtml.match(/<details>/g) || []).length === 3, "Fourth edition page must show three MARIE self-checks");
assert(chapterFiles.every((file) => fs.existsSync(file)), "Every chapter navigation item needs an independent HTML page");

console.log(`Validated 18 supplements, ${chapterDetails.length} detailed chapter, 13 independent chapter pages, fourth edition mapping, worked calculations, and ${htmlFiles.length} generated pages.`);
