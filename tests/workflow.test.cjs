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
    "[data-step-label]", "[data-next-title]", "[data-next-summary]", "[data-next-action]",
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

test("the first screen gives one plain-language next action", () => {
  const app = harness();
  assert.match(app.elements["[data-next-title]"].textContent, /Prepare the Film Society kit/);
  assert.equal(app.elements["[data-next-action]"].textContent, "Start pickup");
  app.click("next");
  assert.equal(app.state.tab, "Loan register");
  assert.equal(app.state.editing, true);
});
test("the main action guides the entire 3-stage scenario", () => {
  const app = harness(); setupFilmKit(app);
  assert.equal(app.elements["[data-next-action]"].textContent, "Continue to returns");
  app.click("next");
  assert.equal(app.state.phase, 1);
  app.click("next");
  assert.equal(app.state.verifying, 402);
  app.submit("verify", {slip:"402",unit:"PR-04",returnedBy:"Kabir Sen"});
  app.click("next");
  assert.equal(app.state.verifying, 403);
  app.submit("verify", {slip:"403",unit:"SP-02",returnedBy:"Kabir Sen"});
  assert.equal(app.elements["[data-next-action]"].textContent, "Record handover");
  app.click("next");
  assert.equal(app.state.handoverNum, 404);
  app.submit("handover", {
    slip:"404",custodian:"Leela Das",expected:"Sat 9 am",
    context:"Adapter will return tomorrow."
  });
  app.click("next");
  assert.equal(app.state.phase, 2);
  app.click("next");
  assert.equal(app.state.verifying, 404);
  app.submit("verify", {slip:"404",unit:"AD-12",returnedBy:"Leela Das"});
  assert.equal(app.elements["[data-next-action]"].textContent, "View completed loans");
});
test("top-level screen stays compact: three metrics, one prominent request", () => {
  const app = harness();
  const metrics = app.elements["[data-metrics]"].innerHTML;
  assert.equal((metrics.match(/class="metric"/g) || []).length, 3);
  assert.match(app.elements["[data-page]"].innerHTML, /Current task · Film Society/);
  assert.match(app.elements["[data-page]"].innerHTML, /See approved items/);
});

test("Friday evening marks still-out equipment due soon", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  app.click("tab", "Loan register");
  assert.match(app.elements["[data-page]"].innerHTML, /Due soon/);
});
test("unchanged Friday due becomes overdue on Saturday", () => {
  const app = harness(); setupFilmKit(app);
  app.click("advance"); app.click("advance"); app.click("tab", "Loan register");
  assert.match(app.elements["[data-page]"].innerHTML, /Overdue/);
});
test("handover expected Saturday 9 am shows Due now, not overdue for that unit", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  app.click("handover", 404);
  app.submit("handover", {
    slip:"404",custodian:"Leela Das",expected:"Sat 9 am",
    context:"Leela returns the adapter at 9 am."
  });
  app.click("advance"); app.click("tab", "Loan register");
  const list = app.elements["[data-page]"].innerHTML;
  const ad12 = list.match(/<article class="loan-card">(?:(?!<\/article>)[\s\S])*?AD-12(?:(?!<\/article>)[\s\S])*?<\/article>/);
  assert.ok(ad12);
  assert.match(ad12[0], /Due now/);
  assert.equal(ad12[0].includes("Overdue"), false);
});
test("status bar gives Film Society progress in one line", () => {
  const app = harness(); setupFilmKit(app); app.click("advance");
  verify(app, 402, "PR-04");
  verify(app, 403, "SP-02");
  assert.match(app.elements["[data-status]"].textContent, /2 back · 1 still out/);
});
