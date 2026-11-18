// Run with: node --test tests/integration.test.cjs (Node 18+, no packages).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function harness(snapshot = null) {
  const handlers = {}, el = {};
  let error = "";
  const storage = { data: snapshot,
    getItem() { return this.data; },
    setItem(_key, value) { this.data = value; } };
  const selectors = [
    "[data-clock]", "[data-shift-title]", "[data-shift]",
    '[data-action="advance"]', "[data-nav]", "[data-page]",
    "[data-status]", '[data-action="undo"]', "[data-guide-kicker]",
    "[data-guide-title]", "[data-guide-description]", "[data-guide-button]",
  ];
  for (const s of selectors) el[s] = {
    innerHTML: "", textContent: "", hidden: false,
    setAttribute() {}, focus() {},
  };
  const errorBox = { hidden: true, querySelector() {
    return { set textContent(message) { error = message; } };
  } };
  el[".panel.check"] = {
    querySelector(sel) { return sel === ".formerror" ? errorBox : null; },
  };
  el['.panel.check input[name="assetId"]'] = { value: "", focus() {} };
  el['.panel.check select[name="by"]'] = { value: "Leela Das" };
  const root = { querySelector(s) { return el[s] || null; },
    addEventListener(event, fn) { handlers[event] = fn; } };
  function FormDataShim(f) {
    this.get = (k) => f.values[k] ?? null;
    this.getAll = (k) => f.arrays[k] || [];
  }
  new Function("document", "localStorage", "FormData", source)(
    { getElementById() { return root; } }, storage, FormDataShim,
  );
  const app = {
    el,
    get state() { return JSON.parse(storage.data); },
    get saved() { return storage.data; },
    get error() { return error; },
    click(action, val = "") {
      handlers.click({ target: {
        closest() { return { dataset: { action, val: String(val) } }; },
      } });
    },
    submit(kind, values = {}, arrays = {}, req = "RQ-214") {
      error = "";
      const f = { dataset: { form: kind, req }, values, arrays,
        querySelector(s) { return s === ".formerror" ? errorBox : null; } };
      handlers.submit({ preventDefault() {}, target: f });
      return error;
    },
    label(id) { error = ""; el['.panel.check input[name="assetId"]'].value = id; },
  };
  // First navigation gives us a saved baseline, as in an actual user session.
  app.click("tab", "Requests");
  return app;
}
function issueKit(app) {
  app.click("request", "RQ-214");
  return app.submit("kit", {
    who: "Kabir Sen", due: "Fri 8 pm",
    unit_0: "PR-04", unit_1: "SP-02", unit_2: "AD-12",
  }, { use: ["0", "1", "2"] });
}
function returnPart(app) {
  app.click("advance");
  app.click("kit-return");
  return app.submit("kit-return", {
    by: "Kabir Sen", holder_404: "Leela Das", until_404: "Sat 9 am",
  }, { back: ["402", "403"] });
}
test("task-first screen opens approved kit without hunting through tabs", () => {
  const x = harness();
  assert.match(x.el["[data-guide-title]"].textContent, /Prepare the screening kit/);
  x.click("guide");
  assert.equal(x.state.selected, "RQ-214");
});
test("one kit issue creates three physical-unit slips", () => {
  const x = harness(); issueKit(x);
  assert.deepEqual(x.state.loans.filter(l => l.req === "RQ-214").map(l => l.asset),
    ["PR-04", "SP-02", "AD-12"]);
});
test("approval, repair, and duplicate-type safeguards remain", () => {
  const x = harness();
  assert.match(x.submit("issue", { req: "RQ-214", asset: "CA-03",
    who: "Kabir Sen", due: "Fri 8 pm" }), /isn.t on/);
  assert.match(x.submit("issue", { req: "RQ-214", asset: "PR-06",
    who: "Kabir Sen", due: "Fri 8 pm" }), /repair/);
  issueKit(x);
  assert.match(x.submit("issue", { req: "RQ-214", asset: "AD-15",
    who: "Kabir Sen", due: "Fri 8 pm" }), /already out/);
  assert.equal(x.state.loans.length, 4);
});
test("guide moves from pickup to the partial-return panel", () => {
  const x = harness(); issueKit(x);
  assert.equal(x.el["[data-guide-button]"].textContent, "Continue to returns");
  x.click("guide");
  assert.equal(x.state.phase, 1);
  x.click("guide");
  assert.equal(x.state.panel, "kit-return");
});
test("partial return refuses to lose who holds missing equipment", () => {
  const x = harness(); issueKit(x); x.click("advance");
  const error = x.submit("kit-return", { by: "Kabir Sen",
    until_404: "Sat 9 am" }, { back: ["402", "403"] });
  assert.match(error, /not back: who has it/);
  assert.equal(x.state.loans.find(l => l.num === 402).back, false);
});
test("partial return preserves original due while moving custody to Leela", () => {
  const x = harness(); issueKit(x); returnPart(x);
  const a = x.state.loans.find(l => l.asset === "AD-12");
  assert.equal(a.back, false);
  assert.equal(a.holder, "Leela Das");
  assert.equal(a.due, "Sat 9 am");
  assert.equal(a.origDue, "Fri 8 pm");
  assert.ok(x.state.log.some(n => n.text.includes("Leela")));
});
test("Saturday guide opens the outstanding adapter verification", () => {
  const x = harness(); issueKit(x); returnPart(x);
  x.click("guide"); x.click("guide");
  assert.equal(x.state.phase, 2);
  assert.equal(x.state.panel, "check:404");
  assert.match(x.el["[data-page]"].innerHTML, /ID printed on the item/);
});
test("wrong or missing physical asset ID can never close the slip", () => {
  const x = harness(); issueKit(x); returnPart(x); x.click("advance");
  x.click("tab", "Loan register"); x.click("check", 404);
  x.label("AD-15"); x.click("confirm-return", 404);
  assert.equal(x.state.loans.find(l => l.num === 404).back, false);
  assert.match(x.error, /expects AD-12/);
  x.label(""); x.click("confirm-return", 404);
  assert.equal(x.state.loans.find(l => l.num === 404).back, false);
});
test("wrong-unit exception and undo do not corrupt stock", () => {
  const x = harness(); issueKit(x); returnPart(x); x.click("advance");
  x.click("tab", "Loan register"); x.click("check", 404);
  x.click("mismatch", 404);
  assert.equal(x.state.loans.find(l => l.num === 404).flags.length, 1);
  assert.equal(x.state.loans.find(l => l.num === 404).back, false);
  x.click("undo");
  assert.equal(x.state.loans.find(l => l.num === 404).flags.length, 0);
});
test("correct verified return closes only matching slip with late audit", () => {
  const x = harness(); issueKit(x); returnPart(x); x.click("advance");
  x.click("tab", "Loan register"); x.click("check", 404);
  x.label("ad-12"); x.click("confirm-return", 404);
  assert.equal(x.state.loans.find(l => l.num === 404).back, true);
  assert.equal(x.state.loans.find(l => l.num === 404).returnedBy, "Leela Das");
  assert.equal(x.state.loans.find(l => l.num === 404).lateBy, 780);
  assert.match(x.el["[data-guide-title]"].textContent, /accounted for/);
});
test("saved state restores and restart resets the fictional shift", () => {
  const x = harness(); issueKit(x); returnPart(x); x.click("advance");
  const reloaded = harness(x.saved);
  assert.equal(reloaded.state.phase, 2);
  assert.equal(reloaded.state.loans.find(l => l.num === 404).holder, "Leela Das");
  reloaded.click("restart");
  assert.equal(reloaded.state.phase, 0);
  assert.deepEqual(reloaded.state.loans.map(l => l.asset), ["MI-09"]);
});
