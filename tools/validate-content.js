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

assert(lectures.length === 18, "Expected 18 lectures");
assert(supplements.length === 18, "Expected 18 supplements");
assert(new Set(supplements.map((item) => item.week)).size === 18, "Supplement week numbers must be unique");

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

const htmlFiles = [path.join(root, "index.html"), ...Array.from({ length: 18 }, (_, index) => path.join(root, "weeks", `week-${String(index + 1).padStart(2, "0")}.html`))];
const prohibited = /教學建議|授課|請學生|讓學生|給學生|要求學生/;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  assert(!prohibited.test(html), `Teacher-facing wording found in ${path.relative(root, file)}`);
  if (file !== htmlFiles[0]) {
    assert(html.includes("class=\"learning-figure\""), `Missing learning figure in ${path.relative(root, file)}`);
    assert((html.match(/<details>/g) || []).length >= 2, `Missing self-check answers in ${path.relative(root, file)}`);
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:https?:|data:|#|mailto:)/.test(reference)) continue;
    const target = path.resolve(path.dirname(file), reference.split("#")[0]);
    assert(fs.existsSync(target), `Broken local reference ${reference} in ${path.relative(root, file)}`);
  }
}

console.log("Validated 18 supplements, diagram invariants, worked calculations, and 19 generated pages.");
