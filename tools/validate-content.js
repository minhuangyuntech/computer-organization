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
assert(chapterDetails.length >= 8, "At least eight detailed self-study chapters are required");
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
  assert(chapter.exercises.every((item) => item.question && item.question.length >= 12), `Chapter ${chapter.chapter} exercise questions are missing or too short`);
  assert(chapter.exercises.every((item) => item.solution.length >= 2), `Chapter ${chapter.chapter} exercise solutions are incomplete`);
  assert(chapter.glossary.length >= 12, `Chapter ${chapter.chapter} glossary is too short`);
  assert(chapter.sources.length >= 4, `Chapter ${chapter.chapter} needs at least four authoritative sources`);
  const sourceKeys = new Set(chapter.sources.map((source) => source.key));
  assert(sourceKeys.size === chapter.sources.length, `Chapter ${chapter.chapter} source keys must be unique`);
  assert(chapter.sources.every((source) => /^https:\/\//.test(source.url)), `Chapter ${chapter.chapter} source URLs must use HTTPS`);
  for (const section of chapter.sections) {
    assert(section.sourceRefs.every((key) => sourceKeys.has(key)), `Chapter ${chapter.chapter} section references an unknown source`);
    const figure = section.figure;
    if (!figure) continue;
    assert(figure.title && figure.caption, `Chapter ${chapter.chapter} figure metadata is incomplete`);
    if (figure.type === "bits") {
      assert(figure.items.reduce((sum, item) => sum + item.bits, 0) === figure.totalBits, `Chapter ${chapter.chapter} bit figure fields have the wrong total width`);
    }
    if (figure.type === "matrix") {
      assert(figure.rows.every((row) => row.length === figure.columns.length), `Chapter ${chapter.chapter} matrix figure has an inconsistent row width`);
    }
    if (figure.type === "timeline") {
      assert(figure.rows.every((row) => row.cells.length === figure.columns.length), `Chapter ${chapter.chapter} timeline figure has an inconsistent row width`);
    }
  }
}

const chapterTwo = chapterDetails.find((chapter) => chapter.chapter === 2);
assert(chapterTwo, "Chapter 2 detailed data-representation material is missing");
assert(chapterTwo.sections.length >= 10, "Chapter 2 needs at least ten complete concept sections");
assert(chapterTwo.sections.filter((item) => item.figure).length >= 9, "Chapter 2 needs at least nine verifiable diagrams");
assert(chapterTwo.workedExamples.length >= 5, "Chapter 2 needs at least five worked examples");
assert(chapterTwo.exercises.length >= 13, "Chapter 2 needs at least thirteen exercises with solutions");
assert(chapterTwo.sources.length >= 8, "Chapter 2 needs broad authoritative source coverage");

const chapterThree = chapterDetails.find((chapter) => chapter.chapter === 3);
assert(chapterThree, "Chapter 3 detailed digital-logic material is missing");
assert(chapterThree.sections.length >= 10, "Chapter 3 needs at least ten complete concept sections");
assert(chapterThree.sections.filter((item) => item.figure).length >= 9, "Chapter 3 needs at least nine verifiable diagrams");
assert(chapterThree.workedExamples.length >= 5, "Chapter 3 needs at least five worked examples");
assert(chapterThree.exercises.length >= 13, "Chapter 3 needs at least thirteen exercises with solutions");
assert(chapterThree.sources.length >= 8, "Chapter 3 needs broad authoritative source coverage");

const chapterFour = chapterDetails.find((chapter) => chapter.chapter === 4);
assert(chapterFour, "Chapter 4 detailed MARIE material is missing");
assert(chapterFour.sections.length >= 11, "Chapter 4 needs at least eleven complete concept sections");
assert(chapterFour.sections.filter((item) => item.figure).length >= 10, "Chapter 4 needs at least ten verifiable diagrams");
assert(chapterFour.workedExamples.length >= 6, "Chapter 4 needs at least six worked examples");
assert(chapterFour.exercises.length >= 15, "Chapter 4 needs at least fifteen exercises with solutions");
assert(chapterFour.sources.length >= 9, "Chapter 4 needs broad authoritative source coverage");

const chapterFive = chapterDetails.find((chapter) => chapter.chapter === 5);
assert(chapterFive, "Chapter 5 detailed ISA material is missing");
assert(chapterFive.sections.length >= 11, "Chapter 5 needs at least eleven complete concept sections");
assert(chapterFive.sections.filter((item) => item.figure).length >= 11, "Chapter 5 needs at least eleven verifiable diagrams");
assert(chapterFive.workedExamples.length >= 7, "Chapter 5 needs at least seven worked examples");
assert(chapterFive.exercises.length >= 16, "Chapter 5 needs at least sixteen exercises with solutions");
assert(chapterFive.sources.length >= 12, "Chapter 5 needs broad authoritative source coverage");

const chapterSix = chapterDetails.find((chapter) => chapter.chapter === 6);
assert(chapterSix, "Chapter 6 detailed memory-hierarchy material is missing");
assert(chapterSix.sections.length >= 13, "Chapter 6 needs at least thirteen complete concept sections");
assert(chapterSix.sections.filter((item) => item.figure).length >= 13, "Chapter 6 needs at least thirteen verifiable diagrams");
assert(chapterSix.workedExamples.length >= 9, "Chapter 6 needs at least nine worked examples");
assert(chapterSix.exercises.length >= 18, "Chapter 6 needs at least eighteen exercises with solutions");
assert(chapterSix.sources.length >= 15, "Chapter 6 needs broad authoritative source coverage");

const chapterSeven = chapterDetails.find((chapter) => chapter.chapter === 7);
assert(chapterSeven, "Chapter 7 detailed I/O and storage material is missing");
assert(chapterSeven.sections.length >= 13, "Chapter 7 needs at least thirteen complete concept sections");
assert(chapterSeven.sections.filter((item) => item.figure).length >= 13, "Chapter 7 needs at least thirteen verifiable diagrams");
assert(chapterSeven.workedExamples.length >= 10, "Chapter 7 needs at least ten worked examples");
assert(chapterSeven.exercises.length >= 18, "Chapter 7 needs at least eighteen exercises with solutions");
assert(chapterSeven.sources.length >= 15, "Chapter 7 needs broad authoritative source coverage");

const chapterEight = chapterDetails.find((chapter) => chapter.chapter === 8);
assert(chapterEight, "Chapter 8 detailed system-software material is missing");
assert(chapterEight.sections.length >= 13, "Chapter 8 needs at least thirteen complete concept sections");
assert(chapterEight.sections.filter((item) => item.figure).length >= 13, "Chapter 8 needs at least thirteen verifiable diagrams");
assert(chapterEight.workedExamples.length >= 10, "Chapter 8 needs at least ten worked examples");
assert(chapterEight.exercises.length >= 18, "Chapter 8 needs at least eighteen exercises with solutions");
assert(chapterEight.sources.length >= 15, "Chapter 8 needs broad authoritative source coverage");

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

const neg37 = ((~37 + 1) & 0xff);
assert(neg37 === 0xdb, "Chapter 2 two's-complement encoding for -37 failed");
assert(((neg37 + 54) & 0xff) === 17, "Chapter 2 signed addition example failed");
assert(((100 + 60) & 0xff) === 0xa0, "Chapter 2 overflow result bits failed");
assert((109 / 16) === 6.8125, "Chapter 2 Q4.4 decoding failed");
const binary32 = Buffer.alloc(4);
binary32.writeFloatBE(13.25, 0);
assert(binary32.readUInt32BE(0) === 0x41540000, "Chapter 2 IEEE 754 encoding for 13.25 failed");
assert(Buffer.from("中", "utf8").toString("hex") === "e4b8ad", "Chapter 2 UTF-8 encoding for U+4E2D failed");
assert((2 ** 3) < (8 + 3 + 1) && (2 ** 4) >= (8 + 4 + 1), "Chapter 2 Hamming parity-bit bound failed");

for (let inputs = 0; inputs < 8; inputs += 1) {
  const a = (inputs >>> 2) & 1;
  const b = (inputs >>> 1) & 1;
  const c = inputs & 1;
  const majority = Number(a + b + c >= 2);
  assert(Number(Boolean((a && b) || (a && c) || (b && c))) === majority, "Chapter 3 majority simplification failed");
  assert((a ^ b ^ c) === ((a + b + c) & 1), "Chapter 3 full-adder sum failed");
  assert(majority === Number(a + b + c >= 2), "Chapter 3 full-adder carry failed");
}
assert(0b1011 + 0b0110 === 0b10001, "Chapter 3 ripple-carry example failed");
const chapterThreePeriodPs = 80 + 620 + 100 + 50;
assert(chapterThreePeriodPs === 850, "Chapter 3 setup period failed");
assert(Math.abs((1e3 / chapterThreePeriodPs) - 1.1764705882352942) < 1e-12, "Chapter 3 maximum frequency failed");
assert((60 + 40 - 70) === 30, "Chapter 3 hold slack failed");
assert(Math.ceil(Math.log2(5)) === 3, "Chapter 3 FSM state encoding failed");

assert((2 ** 12) === 4096 && ((2 ** 12) * 16 / 8) === 8192, "Chapter 4 MARIE memory capacity failed");
assert(((0x1 << 12) | 0x3a5) === 0x13a5, "Chapter 4 Load encoding failed");
assert((0xb207 >>> 12) === 0xb && (0xb207 & 0x0fff) === 0x207, "Chapter 4 AddI decoding failed");
assert(((-5) & 0xffff) === 0xfffb, "Chapter 4 signed Load value failed");
assert(((7 + (-3)) & 0xffff) === 0x0004, "Chapter 4 add-and-store example failed");
assert((0 - (-6)) === 6, "Chapter 4 absolute-value example failed");
assert((4 + (-1) + 6) === 9, "Chapter 4 indirect array sum failed");
assert((0x102 + 1) === 0x103 && (0x110 + 1) === 0x111, "Chapter 4 JnS call/return addresses failed");
assert(((0x1 << 12) | 0x104) === 0x1104, "Chapter 4 assembler Load word failed");
assert(((0x3 << 12) | 0x105) === 0x3105, "Chapter 4 assembler Add word failed");
assert(((0x2 << 12) | 0x106) === 0x2106, "Chapter 4 assembler Store word failed");

const mipsRAdd = ((0 << 26) | (17 << 21) | (18 << 16) | (8 << 11) | (0 << 6) | 0x20) >>> 0;
assert(mipsRAdd === 0x02324020, "Chapter 5 R-format add encoding failed");
const mipsAddiNegative = ((0x08 << 26) | (17 << 21) | (8 << 16) | ((-12) & 0xffff)) >>> 0;
assert(mipsAddiNegative === 0x2228fff4, "Chapter 5 negative addi encoding failed");
const mipsLoad = ((0x23 << 26) | (17 << 21) | (8 << 16) | 20) >>> 0;
assert(mipsLoad === 0x8e280014, "Chapter 5 load encoding failed");
const mipsStore = ((0x2b << 26) | (29 << 21) | (8 << 16) | ((-8) & 0xffff)) >>> 0;
assert(mipsStore === 0xafa8fff8, "Chapter 5 store encoding failed");
const branchPc = 0x00400020;
const branchTarget = 0x00400010;
const branchDisplacement = (branchTarget - (branchPc + 4)) / 4;
assert(branchDisplacement === -5, "Chapter 5 branch displacement failed");
const mipsBeq = ((0x04 << 26) | (8 << 21) | (9 << 16) | (branchDisplacement & 0xffff)) >>> 0;
assert(mipsBeq === 0x1109fffb, "Chapter 5 branch encoding failed");
const jumpPc = 0x00400040;
const jumpTarget = 0x00401234;
const jumpIndex = (jumpTarget >>> 2) & 0x03ffffff;
const mipsJump = ((0x02 << 26) | jumpIndex) >>> 0;
assert(jumpIndex === 0x0010048d && mipsJump === 0x0810048d, "Chapter 5 jump encoding failed");
assert(((((jumpPc + 4) & 0xf0000000) | (jumpIndex << 2)) >>> 0) === jumpTarget, "Chapter 5 pseudo-direct target reconstruction failed");
assert((((0x0f << 26) | (8 << 16) | 0x1234) >>> 0) === 0x3c081234, "Chapter 5 LUI encoding failed");
assert((((0x0d << 26) | (8 << 21) | (8 << 16) | 0xabcd) >>> 0) === 0x3508abcd, "Chapter 5 ORI encoding failed");
assert(((0x1234 << 16) | 0xabcd) >>> 0 === 0x1234abcd, "Chapter 5 constant construction failed");
const chapterFivePipelineClock = Math.max(250, 150, 200, 300, 180) + 20;
const chapterFivePipelineCycles = 5 + 8 - 1;
assert(chapterFivePipelineClock === 320 && chapterFivePipelineCycles === 12, "Chapter 5 pipeline clock/cycle calculation failed");
assert((8 * (250 + 150 + 200 + 300 + 180)) === 8640, "Chapter 5 sequential timing failed");
assert((chapterFivePipelineClock * chapterFivePipelineCycles) === 3840, "Chapter 5 pipeline timing failed");
assert(Math.abs(8640 / 3840 - 2.25) < 1e-12, "Chapter 5 pipeline speedup failed");
assert(Math.abs(1 + 0.20 * 0.30 - 1.06) < 1e-12, "Chapter 5 load-use CPI failed");

const chapterSixCapacity = 32 * 1024;
const chapterSixBlockSize = 64;
const chapterSixWays = 4;
const chapterSixLines = chapterSixCapacity / chapterSixBlockSize;
const chapterSixSets = chapterSixLines / chapterSixWays;
const chapterSixOffsetBits = Math.log2(chapterSixBlockSize);
const chapterSixIndexBits = Math.log2(chapterSixSets);
const chapterSixTagBits = 32 - chapterSixOffsetBits - chapterSixIndexBits;
assert(chapterSixLines === 512 && chapterSixSets === 128, "Chapter 6 cache geometry failed");
assert(chapterSixOffsetBits === 6 && chapterSixIndexBits === 7 && chapterSixTagBits === 19, "Chapter 6 cache address split failed");
const chapterSixAddress = 0x12345678;
assert((chapterSixAddress & 0x3f) === 56, "Chapter 6 cache offset extraction failed");
assert(((chapterSixAddress >>> 6) & 0x7f) === 89, "Chapter 6 cache index extraction failed");
assert((chapterSixAddress >>> 13) === 0x91a2, "Chapter 6 cache tag extraction failed");
assert((((0x91a2 << 13) | (89 << 6) | 56) >>> 0) === chapterSixAddress, "Chapter 6 cache address reconstruction failed");
const chapterSixMetadataBits = chapterSixLines * (chapterSixTagBits + 1 + 1) + chapterSixSets * 3;
assert(chapterSixMetadataBits === 11136 && chapterSixMetadataBits / 8 === 1392, "Chapter 6 cache metadata calculation failed");

const chapterSixDirectTrace = [0, 4, 8, 0, 16, 4, 20, 0];
const chapterSixDirectLines = Array(4).fill(null);
let chapterSixDirectHits = 0;
for (const traceAddress of chapterSixDirectTrace) {
  const block = Math.floor(traceAddress / 4);
  const index = block % chapterSixDirectLines.length;
  const tag = Math.floor(block / chapterSixDirectLines.length);
  if (chapterSixDirectLines[index] === tag) chapterSixDirectHits += 1;
  else chapterSixDirectLines[index] = tag;
}
assert(chapterSixDirectHits === 2, "Chapter 6 direct-mapped trace failed");

function replacementHits(policy) {
  const trace = [0, 2, 0, 4, 2, 0];
  const resident = [];
  let hits = 0;
  for (const block of trace) {
    const position = resident.indexOf(block);
    if (position !== -1) {
      hits += 1;
      if (policy === "LRU") resident.push(resident.splice(position, 1)[0]);
      continue;
    }
    if (resident.length === 2) resident.shift();
    resident.push(block);
  }
  return hits;
}
assert(replacementHits("LRU") === 1 && replacementHits("FIFO") === 2, "Chapter 6 replacement-policy trace failed");
assert(1000 * 4 === 4000 && 40 * 64 === 2560, "Chapter 6 write-traffic calculation failed");
assert(Math.abs((1 + 0.05 * (8 + 0.10 * 100)) - 1.9) < 1e-12, "Chapter 6 two-level AMAT failed");
assert(Math.abs(0.05 * 0.10 - 0.005) < 1e-12, "Chapter 6 global miss rate failed");
assert(Math.abs((1 + 0.02 * 50 + 0.30 * 0.04 * 50) - 2.6) < 1e-12, "Chapter 6 memory-stall CPI failed");

const chapterSixVirtualAddress = 0x12345abc;
assert((chapterSixVirtualAddress >>> 12) === 0x12345 && (chapterSixVirtualAddress & 0xfff) === 0xabc, "Chapter 6 virtual-address split failed");
assert((((0x2abcd << 12) | 0xabc) >>> 0) === 0x2abcdabc, "Chapter 6 physical-address reconstruction failed");
const chapterSixSv32Address = 0xcafebabe >>> 0;
assert(((chapterSixSv32Address >>> 22) & 0x3ff) === 0x32b, "Chapter 6 Sv32 VPN[1] failed");
assert(((chapterSixSv32Address >>> 12) & 0x3ff) === 0x3eb, "Chapter 6 Sv32 VPN[0] failed");
assert((chapterSixSv32Address & 0xfff) === 0xabe, "Chapter 6 Sv32 page offset failed");
assert(Math.abs((0.95 * 101 + 0.05 * 201) - 106) < 1e-12, "Chapter 6 TLB effective access time failed");
assert((1e-6 * 5_000_000) === 5, "Chapter 6 page-fault expected penalty failed");
assert((2 ** 20) * 4 === 4 * 1024 * 1024, "Chapter 6 dense page-table size failed");

const chapterSevenClockHz = 1e9;
const chapterSevenPollCycles = 200;
const chapterSevenPollInterval = chapterSevenPollCycles / chapterSevenClockHz;
const chapterSevenPollChecks = 1e-3 / chapterSevenPollInterval;
assert(chapterSevenPollInterval === 200e-9, "Chapter 7 polling interval failed");
assert(chapterSevenPollChecks === 5000 && chapterSevenPollChecks * chapterSevenPollCycles === 1_000_000, "Chapter 7 polling work failed");
assert(Math.abs(10_000 * 1.2e-6 - 0.012) < 1e-12, "Chapter 7 interrupt utilization failed");
assert(Math.abs((1 / 4e-6) * 80e-9 - 0.02) < 1e-12, "Chapter 7 periodic-polling utilization failed");

const chapterSevenTransferBytes = 8 * (2 ** 20);
const chapterSevenPioCycles = (chapterSevenTransferBytes / 8) * 4;
assert(chapterSevenTransferBytes === 8_388_608 && chapterSevenPioCycles === 4_194_304, "Chapter 7 PIO copy calculation failed");
assert(Math.abs(chapterSevenPioCycles / 2400 - 1747.6266666666668) < 1e-9, "Chapter 7 DMA CPU reduction failed");
assert(Math.abs(50_000 * 6e-6 - 0.30) < 1e-12, "Chapter 7 per-event interrupt load failed");
assert((50_000 / 8) === 6250 && Math.abs(6250 * 10e-6 - 0.0625) < 1e-12, "Chapter 7 moderated interrupt load failed");

const chapterSevenPayloadEfficiency = 256 / (256 + 28);
assert(Math.abs(chapterSevenPayloadEfficiency - 0.9014084507042254) < 1e-12, "Chapter 7 transaction efficiency failed");
assert(Math.abs(8 * chapterSevenPayloadEfficiency - 7.211267605633803) < 1e-12, "Chapter 7 payload throughput failed");
assert(Math.abs(64 / (64 + 28) - 0.6956521739130435) < 1e-12, "Chapter 7 small-payload efficiency failed");
assert(80_000 * 250e-6 === 20, "Chapter 7 Little's Law queue depth failed");
assert(8 / 250e-6 === 32_000, "Chapter 7 queue-depth throughput bound failed");

const chapterSevenRotationMs = (60 / 7200 / 2) * 1000;
const chapterSevenTransferMs = (64 * 1024 / 180_000_000) * 1000;
const chapterSevenHddAccessMs = 8.5 + chapterSevenRotationMs + chapterSevenTransferMs;
assert(Math.abs(chapterSevenRotationMs - 4.166666666666667) < 1e-12, "Chapter 7 HDD rotation calculation failed");
assert(Math.abs(chapterSevenTransferMs - 0.3640888888888889) < 1e-12, "Chapter 7 HDD transfer calculation failed");
assert(Math.abs(chapterSevenHddAccessMs - 13.030755555555557) < 1e-12, "Chapter 7 HDD access time failed");

assert(180 / 120 === 1.5, "Chapter 7 SSD WAF failed");
assert(600_000 / 120 === 5000, "Chapter 7 SSD endurance-days calculation failed");
assert(6 * 4 === 24 && (6 - 1) * 4 === 20 && (6 - 2) * 4 === 16 && (6 / 2) * 4 === 12, "Chapter 7 RAID capacity calculation failed");
const chapterSevenAmdahlTime = (1 - 0.35) + 0.35 / 5;
assert(Math.abs(chapterSevenAmdahlTime - 0.72) < 1e-12, "Chapter 7 Amdahl time failed");
assert(Math.abs(1 / chapterSevenAmdahlTime - 1.3888888888888888) < 1e-12, "Chapter 7 Amdahl speedup failed");
assert(Math.abs((0.35 / 5) / chapterSevenAmdahlTime - 0.09722222222222222) < 1e-12, "Chapter 7 post-improvement I/O fraction failed");
assert(Math.abs(1 / (1 - 0.35) - 1.5384615384615383) < 1e-12, "Chapter 7 Amdahl upper bound failed");

assert(7500 / 2.5e9 === 3e-6 && Math.abs(20_000 * 3e-6 - 0.06) < 1e-12, "Chapter 7 interrupt exercise failed");
assert(4096 * 100_000 / 1e6 === 409.6, "Chapter 7 IOPS-throughput exercise failed");
assert(60_000 * 400e-6 === 24, "Chapter 7 Little's Law exercise failed");
assert((60 / 10_000 / 2) * 1000 === 3, "Chapter 7 10k RPM exercise failed");
assert(200 / 80 === 2.5 && (8 - 2) * 6 === 36, "Chapter 7 SSD/RAID exercises failed");
assert(Math.abs(1 / (0.6 + 0.4 / 4) - 1.4285714285714286) < 1e-12, "Chapter 7 integrated Amdahl exercise failed");

const chapterEightSwitchSeconds = 12_000 / 2e9;
assert(chapterEightSwitchSeconds === 6e-6, "Chapter 8 context-switch time failed");
assert(Math.abs(1000 * chapterEightSwitchSeconds - 0.006) < 1e-12, "Chapter 8 context-switch utilization failed");
const chapterEightBranchBase = 0x1004 + 4;
const chapterEightBranchTarget = 0x1010;
const chapterEightBranchImmediate = (chapterEightBranchTarget - chapterEightBranchBase) / 4;
assert(chapterEightBranchImmediate === 2, "Chapter 8 two-pass branch displacement failed");
const chapterEightRelocation = 0x2400 - 4 - 0x1010;
assert(chapterEightRelocation === 0x13ec, "Chapter 8 S+A-P relocation failed");

function alignUp(value, alignment) {
  return Math.ceil(value / alignment) * alignment;
}
const chapterEightTextEnd = 0x1000 + 0x1a0;
const chapterEightRodataStart = alignUp(chapterEightTextEnd, 0x100);
const chapterEightRodataEnd = chapterEightRodataStart + 0x90;
const chapterEightDataStart = alignUp(chapterEightRodataEnd, 0x100);
assert(chapterEightTextEnd === 0x11a0, "Chapter 8 text placement failed");
assert(chapterEightRodataStart === 0x1200 && chapterEightRodataEnd === 0x1290, "Chapter 8 rodata placement failed");
assert(chapterEightDataStart === 0x1300, "Chapter 8 data alignment failed");
assert(1536 + 4096 === 5632, "Chapter 8 ELF memory-size calculation failed");

const chapterEightSharedMemory = 3 + 10 * 0.5;
const chapterEightPrivateMemory = 10 * (3 + 0.5);
assert(chapterEightSharedMemory === 8 && chapterEightPrivateMemory === 35, "Chapter 8 shared-library memory calculation failed");
assert(chapterEightPrivateMemory - chapterEightSharedMemory === 27, "Chapter 8 shared-library savings failed");
const chapterEightOriginalTime = 1e9 * 1.5 / 3e9;
const chapterEightOptimizedTime = 0.75e9 * 1.7 / 3e9;
assert(chapterEightOriginalTime === 0.5 && chapterEightOptimizedTime === 0.425, "Chapter 8 compiler timing failed");
assert(Math.abs(chapterEightOriginalTime / chapterEightOptimizedTime - 1.1764705882352942) < 1e-12, "Chapter 8 compiler speedup failed");
assert(Math.abs(40e-3 / (10e-6 - 2e-6) - 5000) < 1e-9, "Chapter 8 JIT break-even failed");

const chapterEightGuestVirtualAddress = 0x12345abc;
const chapterEightPageOffset = chapterEightGuestVirtualAddress & 0xfff;
const chapterEightGuestPhysicalAddress = ((0x45678 << 12) | chapterEightPageOffset) >>> 0;
const chapterEightSupervisorPhysicalAddress = ((0x9abcd << 12) | chapterEightPageOffset) >>> 0;
assert(chapterEightPageOffset === 0xabc, "Chapter 8 guest page offset failed");
assert(chapterEightGuestPhysicalAddress === 0x45678abc, "Chapter 8 VS-stage translation failed");
assert(chapterEightSupervisorPhysicalAddress === 0x9abcdabc, "Chapter 8 G-stage translation failed");
assert(9000 / 3e9 === 3e-6 && Math.abs(20_000 * 3e-6 - 0.06) < 1e-12, "Chapter 8 context-switch exercise failed");
assert((0x1ff0 - (0x2000 + 4)) / 4 === -5, "Chapter 8 branch exercise failed");
assert(0x5000 + 8 - 0x4800 === 0x808, "Chapter 8 relocation exercise failed");
assert(alignUp(0x237a, 0x100) === 0x2400 && 0x2400 - 0x237a === 0x86, "Chapter 8 alignment exercise failed");
assert(0x1500 - 0x900 === 0xc00, "Chapter 8 zero-fill exercise failed");
assert(Math.abs(24e-3 / (9e-6 - 3e-6) - 4000) < 1e-9, "Chapter 8 JIT exercise failed");

const homepage = path.join(root, "index.html");
const editionPage = path.join(root, "fourth-edition-map.html");
const chapterFiles = fourthEdition.chapters.map((chapter) => path.join(root, "chapters", `chapter-${String(chapter.chapter).padStart(2, "0")}.html`));
const detailedChapterFiles = chapterDetails.map((chapter) => path.join(root, "chapters", `chapter-${String(chapter.chapter).padStart(2, "0")}.html`));
const htmlFiles = [homepage, editionPage, ...chapterFiles];
const prohibited = /教學建議|授課|請學生|讓學生|給學生|要求學生/;
const siteGuidance = /獨立頁面|獨立 URL|多頁式靜態網站|適用 GitHub Pages|不需要切換|如何使用|使用方法|網站特色|內容範圍與編寫原則|本站文字|本站只使用/;
const visibleWeekClassification = /Week\s*\d|第\s*\d+\s*週|週次|weeks\//;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  assert(!prohibited.test(html), `Teacher-facing wording found in ${path.relative(root, file)}`);
  assert(!siteGuidance.test(html), `Website usage guidance found in ${path.relative(root, file)}`);
  assert(html.includes("class=\"chapter-nav\""), `Missing chapter navigation in ${path.relative(root, file)}`);
  assert((html.match(/class=\"chapter-nav-link/g) || []).length === 13, `Chapter navigation must contain 13 chapters in ${path.relative(root, file)}`);
  assert(!html.includes("<aside"), `Sidebar markup found in ${path.relative(root, file)}`);
  assert(!html.includes("class=\"sidebar\""), `Legacy sidebar found in ${path.relative(root, file)}`);
  assert(!html.includes("class=\"side-notes\""), `Legacy weekly sidebar found in ${path.relative(root, file)}`);
  assert(!html.includes("class=\"chapter-nav-weeks"), `Week navigation found in ${path.relative(root, file)}`);
  if (detailedChapterFiles.includes(file)) {
    assert(html.includes("class=\"chapter-page\""), `Missing detailed chapter layout in ${path.relative(root, file)}`);
    assert((html.match(/class=\"chapter-nav-link active\"/g) || []).length === 1, `Detailed chapter must activate exactly one chapter navigation item in ${path.relative(root, file)}`);
    assert((html.match(/class=\"chapter-section\"/g) || []).length >= 8, `Detailed chapter sections are incomplete in ${path.relative(root, file)}`);
    assert((html.match(/<details>/g) || []).length >= 10, `Detailed chapter exercises are incomplete in ${path.relative(root, file)}`);
  } else if (chapterFiles.includes(file)) {
    assert(html.includes("class=\"chapter-overview-page\""), `Missing independent chapter overview in ${path.relative(root, file)}`);
    assert((html.match(/class=\"chapter-nav-link active\"/g) || []).length === 1, `Chapter overview must activate exactly one chapter navigation item in ${path.relative(root, file)}`);
    assert(html.includes("class=\"chapter-topic\"") || html.includes("class=\"standalone-chapter-content\""), `Missing integrated chapter content in ${path.relative(root, file)}`);
    assert(!html.includes("class=\"chapter-overview-focus\""), `Website guide block found in ${path.relative(root, file)}`);
    assert(!visibleWeekClassification.test(html), `Week classification found outside the introduction in ${path.relative(root, file)}`);
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
assert(editionHtml.includes("2015，ISBN 9781284033144"), "Fourth edition metadata is missing");
assert(!homepageHtml.includes("第六版"), "Homepage still references the sixth edition");
assert(homepageHtml.includes("class=\"modern-cpu-diagram\""), "Homepage modern CPU diagram is missing");
assert(!homepageHtml.includes("class=\"chip-visual\""), "Homepage still contains the legacy CPU image");
assert(!homepageHtml.includes("class=\"course-facts\""), "Homepage still contains administrative course facts");
assert(!homepageHtml.includes("class=\"reference-note\""), "Homepage still contains editorial website guidance");
assert((homepageHtml.match(/class=\"home-chapter-card\"/g) || []).length === 13, "Homepage must show 13 chapter entry cards");
assert(!homepageHtml.includes("class=\"week-card\""), "Homepage still contains week cards");
assert(!visibleWeekClassification.test(homepageHtml), "Homepage still exposes week classification");
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
assert(!visibleWeekClassification.test(editionHtml), "Fourth edition page still exposes week classification");
assert((editionHtml.match(/class=\"chapter-card\"/g) || []).length === 13, "Fourth edition page must show 13 chapter cards");
assert((editionHtml.match(/<details>/g) || []).length === 3, "Fourth edition page must show three MARIE self-checks");
assert(chapterFiles.every((file) => fs.existsSync(file)), "Every chapter navigation item needs an independent HTML page");
for (const chapterNumber of [10, 12, 13]) {
  const chapterHtml = fs.readFileSync(chapterFiles[chapterNumber - 1], "utf8");
  const standaloneStart = chapterHtml.indexOf("class=\"standalone-chapter-content\"");
  const standaloneEnd = chapterHtml.indexOf("class=\"chapter-adjacent\"", standaloneStart);
  const standaloneHtml = chapterHtml.slice(standaloneStart, standaloneEnd);
  assert(standaloneStart >= 0, `Chapter ${chapterNumber} needs extended standalone content`);
  assert((standaloneHtml.match(/class=\"chapter-topic-block\"/g) || []).length >= 5, `Chapter ${chapterNumber} needs at least five extended core topics`);
  assert((standaloneHtml.match(/<details>/g) || []).length >= 4, `Chapter ${chapterNumber} needs at least four extended self-checks`);
}
const introductionHtml = fs.readFileSync(chapterFiles[0], "utf8");
assert(introductionHtml.includes("class=\"chapter-schedule\""), "Introduction must contain the course schedule");
assert((introductionHtml.match(/<tr><th>第 \d+ 週<\/th>/g) || []).length === 18, "Introduction course schedule must contain 18 weeks");
assert(!fs.existsSync(path.join(root, "weeks")), "Legacy week pages must not be generated");

console.log(`Validated chapter-first navigation, 18 source supplements, 13 chapter pages, introduction-only schedule, worked calculations, and ${htmlFiles.length} generated pages.`);
