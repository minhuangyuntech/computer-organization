const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const chapters = vm.runInNewContext(fs.readFileSync(path.join(root, "content/chapters.js"), "utf8") + ";chapterDetails");

// Assemble and execute the actual code shown to students, rather than just 4-1+6.
const exercise = chapters[3].exercises.find(item => item.level === "實作");
const rows = exercise.solution[0].split("\n");
const symbols = new Map();
const statements = [];
let address = 0;
for (const row of rows) {
  const match = row.match(/^(?:(\w+),\s*)?(\w+)(?:\s+(.+))?$/);
  assert(match, `Invalid MARIE source line: ${row}`);
  const [, label, mnemonic, operand] = match;
  if (mnemonic === "ORG") { address = parseInt(operand, 16); continue; }
  if (label) { assert(!symbols.has(label)); symbols.set(label, address); }
  statements.push({ address: address++, mnemonic, operand });
}
const opcodes = { Load: 1, Store: 2, Add: 3, Subt: 4, Output: 6, Halt: 7, Skipcond: 8, Jump: 9, AddI: 11 };
const memory = new Uint16Array(4096);
for (const statement of statements) {
  const { address, mnemonic, operand } = statement;
  if (mnemonic === "DEC" || mnemonic === "HEX") {
    memory[address] = parseInt(operand, mnemonic === "DEC" ? 10 : 16) & 0xffff;
  } else {
    assert(Object.hasOwn(opcodes, mnemonic), `Unknown opcode ${mnemonic}`);
    const field = !operand ? 0 : symbols.has(operand) ? symbols.get(operand) : parseInt(operand, 16);
    assert(Number.isInteger(field) && field >= 0 && field <= 0xfff);
    memory[address] = (opcodes[mnemonic] << 12) | field;
  }
}
assert.equal(memory[symbols.get("Ptr")], symbols.get("Array"), "Displayed pointer must address the actual array");
let pc = statements[0].address, ac = 0, halted = false, executed = 0;
const output = [];
while (!halted && executed++ < 1000) {
  const instruction = memory[pc++], opcode = instruction >>> 12, field = instruction & 0xfff;
  switch (opcode) {
    case 1: ac = memory[field]; break;
    case 2: memory[field] = ac; break;
    case 3: ac = (ac + memory[field]) & 0xffff; break;
    case 4: ac = (ac - memory[field]) & 0xffff; break;
    case 6: output.push(ac); break;
    case 7: halted = true; break;
    case 8: {
      const signed = (ac << 16) >> 16, condition = field >>> 10;
      if ([signed < 0, signed === 0, signed > 0][condition]) pc++;
      break;
    }
    case 9: pc = field; break;
    case 11: ac = (ac + memory[memory[field] & 0xfff]) & 0xffff; break;
    default: assert.fail(`Unexpected opcode ${opcode} at ${pc - 1}`);
  }
}
assert(halted, "MARIE loop must terminate");
assert.deepEqual(output, [9]);
assert.equal(memory[symbols.get("Sum")], 9);
assert.equal(memory[symbols.get("Ctr")], 0);
assert.equal(memory[symbols.get("Ptr")], symbols.get("Array") + 3);
assert(exercise.solution[1].includes(`Ptr=0x${memory[symbols.get("Ptr")].toString(16)}`));

// Every edge samples old state. Reset release and the first functional update differ.
function resetTrace(edges, deassert) {
  let first = 0, second = 0, firstRelease, secondRelease, update;
  for (const edge of edges) {
    if (second && update === undefined) update = edge;
    const oldFirst = first;
    first = edge > deassert ? 1 : 0;
    second = oldFirst;
    if (first && firstRelease === undefined) firstRelease = edge;
    if (second && secondRelease === undefined) secondRelease = edge;
  }
  return [firstRelease, secondRelease, update];
}
assert.deepEqual(resetTrace([10,20,30,40], 12), [20,30,40]);
assert.deepEqual(resetTrace([5,15,25,35], 6), [15,25,35]);
const reset = chapters[2].sections[12].figure.rows.find(row => row.label === "functional state");
assert(reset.cells[3].startsWith("held"));
assert.equal(reset.cells[4], "first update");
assert(chapters[2].workedExamples[9].result.includes("40 ns"));
assert(chapters[2].exercises[17].solution.join().includes("35 ns"));

// A callee may spill all four arguments: they must not overwrite F's saved state.
const procedure = chapters[4].workedExamples[5];
const frameSize = Number(procedure.prompt.match(/配置 (\d+)-byte/)[1]);
const savedS0 = Number(procedure.prompt.match(/\$s0 存 (\d+)\(/)[1]);
const savedRa = Number(procedure.prompt.match(/\$ra 存 (\d+)\(/)[1]);
assert.equal(frameSize % 8, 0);
assert(savedS0 >= 16 && savedRa >= 16 && savedRa + 4 <= frameSize);
const frame = new Uint32Array(frameSize / 4);
frame[savedS0 / 4] = 0x12345678;
frame[savedRa / 4] = 0x00400108;
for (let i = 0; i < 4; i++) frame[i] = 0xeeeeeeee;
assert.equal(frame[savedS0 / 4], 0x12345678);
assert.equal(frame[savedRa / 4], 0x00400108);
assert(procedure.steps[0].includes(`0x${(0x7ffffff0-frameSize).toString(16).toUpperCase()}`));

// Both permitted RVV selection strategies must cover the array without overruns.
function stripMine(n, max, balanced) {
  const lengths = [];
  while (n > 0) {
    const vl = n <= max ? n : n >= 2 * max ? max : balanced ? Math.ceil(n / 2) : max;
    assert(vl > 0 && vl <= max && vl <= n);
    lengths.push(vl); n -= vl;
  }
  return lengths;
}
const vector = chapters[8].workedExamples[3];
const count = Number(vector.prompt.match(/\bN=(\d+)/)[1]);
const maximum = stripMine(count, 8, false), balanced = stripMine(count, 8, true);
assert.equal(maximum.reduce((a,b)=>a+b,0), count);
assert.equal(balanced.reduce((a,b)=>a+b,0), count);
assert.equal(maximum.length, 126); assert.equal(maximum.at(-1), 3);
assert.equal(balanced.length, 126); assert.equal(balanced.at(-1), 5);
assert(vector.prompt.includes("最大合法 VL"));
assert(vector.result.includes("最後可為 5"));
assert.deepEqual(stripMine(130,8,false).slice(-2), [8,2]);
assert.deepEqual(stripMine(130,8,true).slice(-2), [5,5]);

// Enumerate all disk-failure subsets to distinguish one six-way mirror from RAID 10.
let mirrorMinLoss = 7, raid10MinLoss = 7;
for (let failures = 0; failures < 64; failures++) {
  const lost = Array.from({length:6}, (_,i)=>!!(failures & (1 << i)));
  const count = lost.filter(Boolean).length;
  if (lost.every(Boolean)) mirrorMinLoss = Math.min(mirrorMinLoss,count);
  if ([0,2,4].some(i=>lost[i] && lost[i+1])) raid10MinLoss = Math.min(raid10MinLoss,count);
}
assert.equal(mirrorMinLoss - 1, 5); assert.equal(raid10MinLoss - 1, 1);
assert(chapters[6].workedExamples[8].result.includes("24/4/20/16/12"));
const raidRow = chapters[6].sections[11].figure.rows.find(row=>row[0].startsWith("RAID 1（"));
assert.equal(raidRow[1], "S");

// Theme and print controls remain usable when localStorage throws.
for (const blocked of [false, true]) {
  const classes = new Set(), callbacks = {}, attributes = {};
  const classList = { add: x=>classes.add(x), contains: x=>classes.has(x), toggle: x=>classes.has(x)?classes.delete(x):classes.add(x) };
  let printed = 0;
  const button = name=>({addEventListener:(event,callback)=>{callbacks[name]=callback;},setAttribute:(key,value)=>{attributes[key]=value;}});
  vm.runInNewContext(fs.readFileSync(path.join(root,"site.js"),"utf8"), {
    document: {body:{classList},querySelector:button},
    localStorage: {getItem:()=>{if(blocked)throw Error("blocked");return "dark";},setItem:()=>{if(blocked)throw Error("blocked");}},
    window:{print:()=>printed++}
  });
  const before = classes.has("dark");
  callbacks["#toggleTheme"]();
  assert.notEqual(classes.has("dark"),before);
  assert.equal(attributes["aria-pressed"],String(classes.has("dark")));
  callbacks["#printPage"](); assert.equal(printed,1);
}
console.log("Validated executable MARIE source, reset sampling, MIPS argument spills, legal RVV tails, RAID failures, and restricted-storage controls.");
