// Run: node --test tests/workflow.test.cjs (Node 18+, no dependencies).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function desk(saved = null) {
  const events = {}, nodes = {};
  const storage = { value: saved,
    getItem() { return this.value; },
    setItem(_k, value) { this.value = value; },
  };
  for (const key of [
    "[data-clock]", "[data-shift-title]", "[data-shift]",
    '[data-action="advance"]', "[data-nav]", "[data-page]",
    "[data-status]", '[data-action="undo"]',
  ]) nodes[key] = {
    innerHTML: "", textContent: "", hidden: false, focus() {}, setAttribute() {},
  };
  let error = "";
  const feedback = { hidden: true, querySelector() {
    return { set textContent(value) { error = value; } };
  } };
  const root = { querySelector(key) { return nodes[key] || null; },
    addEventListener(key, callback) { events[key] = callback; },
  };
  function FormDataMock(form) {
    this.get = key => form.values[key] ?? null;
    this.getAll = key => form.arrays[key] || [];
  }
  new Function("document", "localStorage", "FormData", source)(
    { getElementById() { return root; } }, storage, FormDataMock,
  );
  const app = {
    nodes,
    get state() { return JSON.parse(storage.value); },
    get saved() { return storage.value; },
    get error() { return error; },
    click(action, val = "") { events.click({ target: {
      closest() { return { dataset: { action, val: String(val) } }; },
    } }); },
    submit(kind, values = {}, arrays = {}, req = "RQ-214", num = "") {
      error = "";
      events.submit({ preventDefault() {}, target: {
        dataset: { form: kind, req, num }, values, arrays,
        querySelector(key) { return key === ".formerror" ? feedback : null; },
      } });
      return error;
    },
  };
  app.click("tab", "Requests"); // Persist a starting state.
  return app;
}
function issueFilm(app) {
  app.click("request", "RQ-214");
  app.submit("kit", {
    who: "Kabir Sen", due: "Fri 8 pm",
    unit_0: "PR-04", unit_1: "SP-02", unit_2: "AD-12",
  }, { use: ["0", "1", "2"] });
}
function partial(app) {
  app.click("advance");
  app.click("kit-return");
  app.submit("kit-return", {
    label_402: "pr04", label_403: "SP 02", label_404: "",
    by: "Kabir Sen", holder_404: "Leela Das", until_404: "Sat 9 am",
  });
}
const adapter = app => app.state.loans.find(l => l.asset === "AD-12");

test("starter requests remain visible", () => {
  const app = desk();
  assert.match(app.nodes["[data-page]"].innerHTML, /Approved requests/);
});
test("kit form uses the authorized collector and request due time", () => {
  const app = desk(); app.click("request", "RQ-214");
  const html = app.nodes["[data-page]"].innerHTML;
  assert.match(html, /value="Kabir Sen" selected/);
  assert.match(html, /value="Fri 8 pm" selected/);
});
test("one kit action issues three individual unit slips", () => {
  const app = desk(); issueFilm(app);
  assert.deepEqual(app.state.loans.filter(l => l.req === "RQ-214").map(l => l.asset),
    ["PR-04", "SP-02", "AD-12"]);
});
test("unapproved, repair, and duplicate units are refused", () => {
  const app = desk();
  assert.match(app.submit("issue", { req: "RQ-214", asset: "CA-03",
    who: "Kabir Sen", due: "Fri 8 pm" }), /isn.t on RQ-214/);
  assert.match(app.submit("issue", { req: "RQ-214", asset: "PR-06",
    who: "Kabir Sen", due: "Fri 8 pm" }), /repair/);
  issueFilm(app);
  assert.match(app.submit("issue", { req: "RQ-214", asset: "AD-15",
    who: "Kabir Sen", due: "Fri 8 pm" }), /already out/);
  assert.equal(app.state.loans.length, 4);
});
test("batch return rejects an incorrect physical label without partial writes", () => {
  const app = desk(); issueFilm(app); app.click("advance");
  const msg = app.submit("kit-return", {
    label_402: "PR-04", label_403: "AD-15", label_404: "",
    by: "Kabir Sen", holder_404: "Leela Das", until_404: "Sat 9 am",
  });
  assert.match(msg, /not SP-02/);
  assert.equal(app.state.loans.find(l => l.num === 402).back, false);
});
test("missing unit cannot be handed over without a holder", () => {
  const app = desk(); issueFilm(app); app.click("advance");
  const msg = app.submit("kit-return", {
    label_402: "PR-04", label_403: "SP-02", label_404: "",
    by: "Kabir Sen", until_404: "Sat 9 am",
  });
  assert.match(msg, /not back: who has it/);
});
test("partial return preserves original due and updates physical custody", () => {
  const app = desk(); issueFilm(app); partial(app);
  assert.equal(adapter(app).who, "Kabir Sen");
  assert.equal(adapter(app).holder, "Leela Das");
  assert.equal(adapter(app).origDue, "Fri 8 pm");
  assert.equal(adapter(app).due, "Sat 9 am");
  assert.equal(adapter(app).back, false);
  assert.ok(app.state.log.some(n => n.text.includes("Leela Das")));
});
test("Saturday shows the adapter due now with its model", () => {
  const app = desk(); issueFilm(app); partial(app);
  app.click("advance"); app.click("tab", "Loan register");
  assert.match(app.nodes["[data-page]"].innerHTML, /Due now/);
  assert.match(app.nodes["[data-page]"].innerHTML, /Belkin AVC002/);
});
test("unknown label cannot close a loan", () => {
  const app = desk(); issueFilm(app); partial(app); app.click("advance");
  assert.match(app.submit("check", { label: "ZZ-99", by: "Leela Das" }, {}, "RQ-214", "404"),
    /No unit called/);
  assert.equal(adapter(app).back, false);
});
test("wrong adapter is flagged and Undo reverses the flag", () => {
  const app = desk(); issueFilm(app); partial(app); app.click("advance");
  app.submit("check", { label: "AD-15", by: "Leela Das" }, {}, "RQ-214", "404");
  assert.equal(adapter(app).back, false);
  assert.equal(adapter(app).flags.length, 1);
  app.click("undo");
  assert.equal(adapter(app).flags.length, 0);
});
test("correct ID closes the loan and records return audit", () => {
  const app = desk(); issueFilm(app); partial(app); app.click("advance");
  app.submit("check", { label: "ad12", by: "Leela Das" }, {}, "RQ-214", "404");
  assert.equal(adapter(app).back, true);
  assert.equal(adapter(app).returnedBy, "Leela Das");
  assert.equal(adapter(app).lateBy, 780);
});
test("refresh and restart preserve and reset the intended state", () => {
  const app = desk(); issueFilm(app); partial(app);
  const restored = desk(app.saved);
  assert.equal(adapter(restored).holder, "Leela Das");
  restored.click("restart");
  assert.equal(restored.state.phase, 0);
  assert.deepEqual(restored.state.loans.map(l => l.asset), ["MI-09"]);
});
