// Lightweight regression checks for the fictional desk workflow.
// Run: node tests/workflow.test.cjs  (Node 18+, no dependencies).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function harness(initialStorage = null) {
  const storage = {
    data: initialStorage,
    setItem(_key, value) { this.data = value; },
    getItem() { return this.data; },
  };
  const handlers = {};
  const elements = {};
  for (const name of [
    "[data-clock]", "[data-shift-title]", "[data-shift]",
    '[data-action="advance"]', "[data-nav]", "[data-page]",
    "[data-status]", "[data-metrics]", "[data-priority]",
  ]) {
    elements[name] = { textContent: "", innerHTML: "", hidden: false };
  }
  const root = {
    querySelector(selector) { return elements[selector] || null; },
    addEventListener(event, callback) { handlers[event] = callback; },
  };
  const document = { getElementById() { return root; } };
  function FakeFormData(form) {
    this.get = (name) => form.values[name];
  }
  new Function("document", "localStorage", "FormData", source)(
    document, storage, FakeFormData,
  );
  return {
    elements,
    get state() { return storage.data ? JSON.parse(storage.data) : null; },
    get saved() { return storage.data; },
    click(action, val = "") {
      handlers.click({
        target: { closest() { return { dataset: { action, val: String(val) } }; } },
      });
    },
    submit(kind, values) {
      const form = {
        values,
        feedback: { textContent: "" },
        matches(selector) { return selector === "[data-" + kind + "]"; },
        querySelector() { return this.feedback; },
      };
      handlers.submit({ preventDefault() {}, target: form });
      return form.feedback.textContent;
    },
  };
}
function issue(app, asset, req = "RQ-214") {
  app.click("new");
  app.submit("issue", { req, asset, who: "Kabir Sen", due: "Fri 8 pm" });
}
function setupFilmKit(app) {
  app.click("tab", "Loan register");
  issue(app, "PR-04");
  issue(app, "SP-02");
  issue(app, "AD-12");
}
function verify(app, num, asset, returnedBy = "Kabir Sen") {
  app.click("verify", num);
  return app.submit("verify", { slip: String(num), unit: asset, returnedBy });
}

test("original request and shift story are available", () => {
  const app = harness();
  assert.match(app.elements["[data-page]"].innerHTML, /Approved requests/);
  assert.match(app.elements["[data-shift]"].textContent, /Kabir/);
});
test("approved kit issues three independent unit slips", () => {
  const app = harness(); setupFilmKit(app);
  const film = app.state.loans.filter((l) => l.req === "RQ-214");
  assert.deepEqual(film.map((l) => l.asset), ["PR-04", "SP-02", "AD-12"]);
  assert.equal(new Set(film.map((l) => l.num)).size, 3);
});
test("unapproved equipment is rejected", () => {
  const app = harness(); app.click("tab", "Loan register");
  issue(app, "CA-03");
  assert.equal(app.state.loans.length, 1);
});
test("equipment under repair cannot be issued", () => {
  const app = harness(); app.click("tab", "Loan register");
  issue(app, "PR-06");
  assert.equal(app.state.loans.length, 1);
});
test("a second outstanding unit of the same approved type is blocked", () => {
  const app = harness(); app.click("tab", "Loan register");
  issue(app, "AD-12");
  issue(app, "AD-15");
  assert.equal(app.state.loans.length, 2);
});
test("partial returns preserve the outstanding adapter", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  verify(app, 402, "PR-04");
  verify(app, 403, "SP-02");
  assert.deepEqual(
    app.state.loans.filter((l) => l.req === "RQ-214" && !l.back).map((l) => l.asset),
    ["AD-12"],
  );
});
test("physical ID mismatch never closes a slip", () => {
  const app = harness(); setupFilmKit(app);
  const feedback = verify(app, 404, "AD-15");
  assert.match(feedback, /Mismatch/);
  assert.equal(app.state.loans.find((l) => l.num === 404).back, false);
});
test("handover preserves borrower while recording new holder and expected time", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  app.click("handover", 404);
  app.submit("handover", {
    slip: "404", custodian: "Leela Das", expected: "Sat 9 am",
    context: "Leela has the USB-C adapter.",
  });
  const loan = app.state.loans.find((l) => l.num === 404);
  assert.equal(loan.who, "Kabir Sen");
  assert.equal(loan.due, "Fri 8 pm");
  assert.equal(loan.custodian, "Leela Das");
  assert.equal(loan.expected, "Sat 9 am");
  assert.ok(app.state.notes.some((n) => n.linked === 404));
});
test("Saturday banner names the actual outstanding model and holder", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  verify(app, 402, "PR-04"); verify(app, 403, "SP-02");
  app.click("handover", 404);
  app.submit("handover", {
    slip: "404", custodian: "Leela Das", expected: "Sat 9 am",
    context: "Leela will return the adapter.",
  });
  app.click("advance");
  assert.match(app.elements["[data-priority]"].innerHTML, /AD-12/);
  assert.match(app.elements["[data-priority]"].innerHTML, /Belkin/);
  assert.match(app.elements["[data-priority]"].innerHTML, /Leela Das/);
});
test("correct verified return closes exactly the targeted slip", () => {
  const app = harness(); setupFilmKit(app);
  verify(app, 404, "ad-12", "Leela Das");
  assert.equal(app.state.loans.find((l) => l.num === 404).back, true);
  assert.equal(app.state.loans.find((l) => l.num === 404).returnedBy, "Leela Das");
  assert.equal(app.state.loans.find((l) => l.num === 402).back, false);
});
test("desk activity is auditable in the desk book", () => {
  const app = harness(); setupFilmKit(app);
  verify(app, 402, "PR-04");
  app.click("tab", "Desk book");
  assert.match(app.elements["[data-page]"].innerHTML, /Desk activity/);
  assert.match(app.elements["[data-page]"].innerHTML, /Verified return/);
});
test("saved state survives reload", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  verify(app, 402, "PR-04");
  const reloaded = harness(app.saved);
  assert.equal(reloaded.state.phase, 1);
  assert.equal(reloaded.state.loans.find((l) => l.num === 402).back, true);
});
test("restart removes changes and restores original Tara slip", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  app.click("restart");
  assert.equal(app.state.phase, 0);
  assert.equal(app.state.loans.length, 1);
  assert.equal(app.state.loans[0].asset, "MI-09");
});
