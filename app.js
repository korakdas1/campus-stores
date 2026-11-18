(() => {
  const storageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 1,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    verifying: null,
    handoverNum: null,
    activity: [],
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, good = false) =>
    '<span class="tag' + (good ? " good" : "") + '">' + esc(t) + "</span>";

  const deskTime = () => shifts[s.phase].time;
  const holder = (loan) => loan.custodian || loan.who;
  const expectedBack = (loan) => loan.expected || loan.due;
  const activity = (text) => {
    s.activity.unshift({ time: deskTime(), text });
    s.activity = s.activity.slice(0, 30);
  };
  function syncIssueForm(updateDue = false) {
    const form = q("[data-issue]");
    if (!form) return;
    const req = getReq(form.elements.namedItem("req").value);
    const assetSelect = form.elements.namedItem("asset");
    for (const option of assetSelect.options) {
      if (!option.value) continue;
      const asset = getAsset(option.value);
      option.disabled = !req || !req.items.includes(asset.type);
    }
    if (assetSelect.selectedOptions[0]?.disabled) assetSelect.value = "";
    if (req && updateDue) form.elements.namedItem("due").value = req.due;
    const hint = form.querySelector("[data-issue-hint]");
    if (hint) hint.textContent = req
      ? "Only equipment approved for " + req.club + " can be issued."
      : "Choose an approved request to see the matching available units.";
  }
  function nextWork() {
    const film = s.loans.filter((l) => l.req === "RQ-214");
    const types = getReq("RQ-214").items;
    const notIssued = types.filter((type) => !film.some((l) => getAsset(l.asset).type === type));
    const pendingReturns = film.filter((l) => !l.back && getAsset(l.asset).type !== "USB-C → HDMI adapter");
    const adapter = film.find((l) => getAsset(l.asset).type === "USB-C → HDMI adapter");
    const outstanding = film.filter((l) => !l.back);
    if (notIssued.length) return {
      title: "Prepare the Film Society kit",
      summary: film.length + " of 3 items issued · Kabir needs the full kit for the screening.",
      label: film.length ? "Issue next item" : "Start pickup",
      action: "issue-film",
    };
    if (s.phase === 0) return {
      title: "Pickup recorded",
      summary: "All 3 items are checked out. Move to the evening return.",
      label: "Continue to returns",
      action: "advance",
    };
    if (s.phase === 1 && pendingReturns.length) return {
      title: "Check in the returned equipment",
      summary: pendingReturns.length + " item" + (pendingReturns.length === 1 ? "" : "s") +
        " to verify · Kabir brought back the projector and speaker.",
      label: "Verify a return",
      action: "verify-next",
      slip: pendingReturns[0].num,
    };
    if (s.phase === 1 && adapter && !adapter.back && !adapter.custodian) return {
      title: "Hand over the missing adapter",
      summary: "Leela has the adapter. Record who has it and when it is due back.",
      label: "Record handover",
      action: "handover-adapter",
      slip: adapter.num,
    };
    if (s.phase === 1) return {
      title: "Evening shift accounted for",
      summary: adapter && !adapter.back
        ? "The adapter is linked to Leela for the morning shift."
        : "There is no unresolved Film Society return.",
      label: "Continue to Saturday",
      action: "advance",
    };
    if (outstanding.length) return {
      title: adapter && !adapter.back ? "Verify Leela's adapter" : "Finish the outstanding return",
      summary: adapter && !adapter.back
        ? adapter.asset + " · " + getAsset(adapter.asset).model +
          " · Confirm the label before returning it to stock."
        : outstanding.length + " Film Society item(s) still need a verified return.",
      label: "Verify physical item",
      action: "verify-next",
      slip: (adapter && !adapter.back ? adapter : outstanding[0]).num,
    };
    return {
      title: "Film Society kit complete",
      summary: "All 3 items have verified returns. The register is ready for the next shift.",
      label: "View completed loans",
      action: "review-loans",
    };
  }

  function overview() {
    const open = s.loans.filter((l) => !l.back);
    const onShelf = assets.filter((a) => !a.repair && !out(a.id));
    const metrics = q("[data-metrics]");
    if (metrics) metrics.innerHTML =
      '<div class="metric"><strong>' + open.length + '</strong><span>Out on loan</span></div>' +
      '<div class="metric"><strong>' + onShelf.length + '</strong><span>Ready to issue</span></div>' +
      '<div class="metric"><strong>' + assets.filter((a) => a.repair).length + '</strong><span>Under repair</span></div>';
    const priority = q("[data-priority]");
    if (!priority) return;
    const openFilm = s.loans.filter((l) => l.req === "RQ-214" && !l.back);
    priority.hidden = s.phase === 0 || !openFilm.length;
    if (priority.hidden) {
      priority.innerHTML = "";
      return;
    }
    priority.innerHTML = '<div class="priority-heading"><span class="attention-dot" aria-hidden="true"></span>' +
      '<strong>Still outstanding</strong><span class="priority-count">' + openFilm.length + '</span></div>' +
      '<div class="priority-list">' + openFilm.map((l) => {
        const a = getAsset(l.asset);
        return '<span class="priority-item"><b>' + esc(l.asset) + '</b> · ' + esc(a.model) +
          ' <span>With ' + esc(holder(l)) + '</span></span>';
      }).join("") + '</div>';
  }
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        r.id +
        " · Approved</small><h3>" +
        r.event +
        "</h3><p>" +
        r.club +
        " · Filed by " +
        r.owner +
        "</p><p><b>Return by</b> " +
        r.due +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items.map((x) => "<li>" + x + "</li>").join("") +
        "</ul><p>" +
        r.note +
        "</p>" + btn("Issue equipment", "issue-selected", r.id, "primary") + "</div>";
    } else {
      const film = requests.find((r) => r.id === "RQ-214");
      html += '<article class="featured-request">' +
        '<span class="eyebrow">Your current request</span>' +
        '<h3>' + esc(film.event) + '</h3>' +
        '<p>' + esc(film.club) + ' · 3 approved items · Due ' + esc(film.due) + '</p>' +
        btn("Review approved kit", "request", film.id, "primary") + '</article>';
      html += '<h3 class="subsection-title">Other approved requests</h3>';
      html += requests.filter((r) => r.id !== "RQ-214")
        .map((r) => row(r.event, r.id + " · " + r.club, btn("View", "request", r.id)))
        .join("");
    }
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const status = a.repair
        ? "In repair"
        : out(a.id)
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · Bin " + a.bin + (out(a.id) ? " · With " + holder(out(a.id)) : ""),
        badge(status, status === "On shelf"),
      );
    }
    return html;
  }
  function register() {
    let html = head(
      "Loan register",
      "Issue, track, and safely check in equipment",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("Issue an item", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        '<label><span>' + label + '</span><select name="' + key +
        '" required><option value="">Select…</option>' + opts(options) + '</select></label>';
      return html + '<div class="workflow-panel"><span class="eyebrow">Equipment checkout</span>' +
        '<p>Choose an approved item and who is collecting it.</p>' +
        '<form data-issue><div class="form">' +
        select("Approved request", "req", requests.map((r) => [r.id, r.id + " · " + r.club])) +
        select("Unit leaving the desk", "asset", available.map((a) => [a.id, a.id + " · " + a.model + " (" + a.type + ")"])) +
        select("Collected by", "who", people.map((p) => [p, p])) +
        select("Return by", "due", ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].map((d) => [d, d])) +
        '</div><p class="field-help" data-issue-hint></p>' +
        '<button type="submit" class="primary">Save issue slip</button></form></div>';
    }
    if (s.verifying !== null) {
      const l = s.loans.find((x) => x.num === s.verifying && !x.back);
      if (l) {
        const a = getAsset(l.asset);
        html += '<div class="workflow-panel" id="verify-return"><span class="eyebrow">Return verification</span>' +
          '<h3>Check the label on the returned item</h3>' +
          '<div class="verification-target"><small>EXPECTED UNIT</small><strong>' + esc(a.id) +
          '</strong><span>' + esc(a.model) + ' · Bin ' + esc(a.bin) + '</span></div>' +
          '<details class="detail-disclosure"><summary>View loan details</summary><p>' +
          esc("Slip L-" + l.num + " · Request " + l.req + " · Collected by " + l.who +
            " · Currently with " + holder(l)) + '</p></details>' +
          '<form data-verify><input type="hidden" name="slip" value="' + l.num + '">' +
          '<div class="form"><label><span>Asset ID on the item in front of you</span>' +
          '<input name="unit" required autocomplete="off" placeholder="e.g. AD-12" aria-describedby="verify-help"></label>' +
          '<label><span>Returned by</span><select name="returnedBy" required>' +
          '<option value="">Select person…</option>' + opts(people.map((p) => [p, p])) +
          '</select></label></div><p class="field-help" id="verify-help">A different unit must not silently close this slip.</p>' +
          '<p role="alert" class="validation" data-verify-feedback></p>' +
          '<div class="action-row"><button class="primary" type="submit">Confirm verified return</button>' +
          btn("Cancel", "cancel-flow") + '</div></form></div>';
      }
    }
    if (s.handoverNum !== null) {
      const l = s.loans.find((x) => x.num === s.handoverNum && !x.back);
      if (l) {
        const candidates = ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"];
        const due = l.expected || "Sat 9 am";
        html += '<div class="workflow-panel" id="record-handover"><span class="eyebrow">Linked handover</span>' +
          '<h3>Who has ' + esc(l.asset) + ' now?</h3>' +
          '<p>Record who has it now and when they will return it.</p>' +
          '<form data-handover><input type="hidden" name="slip" value="' + l.num + '">' +
          '<div class="form"><label><span>Current holder</span><select name="custodian" required>' +
          opts(people.map((p) => [p, p])) + '</select></label>' +
          '<label><span>Expected hand-in</span><select name="expected" required>' +
          opts(candidates.map((d) => [d, d])) + '</select></label>' +
          '<label class="full"><span>Handover context</span><textarea name="context" maxlength="300" rows="2" required>' +
          esc(l.handoverNote || "Outstanding after partial return; confirm the physical asset ID on arrival.") +
          '</textarea></label></div><div class="action-row">' +
          '<button class="primary" type="submit">Save linked handover</button>' +
          btn("Cancel", "cancel-flow") + '</div></form></div>';
      }
    }
    html += '<div class="buttons">' +
      ["Outstanding", "All slips"].map((v, i) =>
        '<button type="button" data-action="scope" data-val="' + i + '" aria-pressed="' +
        (s.onlyOpen === (i === 0)) + '">' + v + '</button>').join("") + '</div>';
    const shown = s.loans.filter((l) => !s.onlyOpen || !l.back).slice().reverse();
    if (!shown.length) html += '<div class="empty-state">No outstanding slips. Choose “All slips” to review returned items.</div>';
    for (const l of shown) {
      const a = getAsset(l.asset);
      html += '<article class="loan-card"><div class="loan-details"><span class="eyebrow">L-' +
        l.num + ' · ' + esc(l.req) + '</span><h3>' + esc(a.type) + ' <span class="unit-id">' + esc(l.asset) +
        '</span></h3><p>' + esc(a.model + ' · ' + getReq(l.req).club) +
        '</p><p class="loan-custody">' +
        (!l.back ? '<strong>With ' + esc(holder(l)) + '</strong> · Expected ' + esc(expectedBack(l)) :
          'Returned · Originally due ' + esc(l.due)) +
        '</p>' + (l.handoverNote && !l.back ? '<p class="inline-note">Handover: ' + esc(l.handoverNote) + '</p>' : '') +
        (l.back ? '<p class="return-proof">' + esc("Verified by asset ID · Returned by " +
          (l.returnedBy || "not recorded") + " · " + (l.returnedAt || "Earlier shift")) + '</p>' : '') +
        '</div><div class="loan-actions">' +
        badge(l.back ? "Returned" : "Outstanding", l.back) +
        (!l.back ? btn("Verify return", "verify", String(l.num), "primary") +
          (s.phase > 0 ? btn("Add handover", "handover", String(l.num)) : "") : "") +
        '</div></article>';
    }
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, n.linked ? "Linked to slip L-" + n.linked : "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    if (s.activity.length) html += '<div class="activity"><h3>Desk activity</h3>' + s.activity.slice(0, 8).map((item) => '<p><small>' + esc(item.time) + '</small> · ' + esc(item.text) + '</p>').join("") + '</div>';
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    q("[data-step-label]").textContent = "STEP " + (s.phase + 1) + " OF 3";
    const work = nextWork();
    q("[data-next-title]").textContent = work.title;
    q("[data-next-summary]").textContent = work.summary;
    q("[data-next-action]").textContent = work.label;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next || work.action === "advance";
    advance.textContent = "Skip ahead · " + (s.phase === 0 ? "Return time" : "Next morning");
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          (n === "Loan register" ? "Loans" : n === "Desk book" ? "Handover" : n) +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    overview();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    if (q("[data-issue]")) {
      if (s.selected) q("[data-issue]").elements.namedItem("req").value = s.selected;
      syncIssueForm(true);
    }
    if (q("[data-handover]")) {
      const l = s.loans.find((x) => x.num === s.handoverNum);
      q("[data-handover]").elements.namedItem("custodian").value = l.custodian || "Leela Das";
      q("[data-handover]").elements.namedItem("expected").value = l.expected || "Sat 9 am";
    }
    q("[data-status]").textContent = s.notice;
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.notice = "Shift time updated.";
        break;
      case "next": {
        const work = nextWork();
        if (work.action === "advance") {
          if (s.phase < 2) s.phase++;
        } else if (work.action === "issue-film") {
          s.tab = "Loan register";
          s.selected = "RQ-214";
          s.editing = true;
          s.verifying = null;
          s.handoverNum = null;
        } else if (work.action === "verify-next") {
          s.tab = "Loan register";
          s.onlyOpen = true;
          s.editing = false;
          s.verifying = work.slip;
          s.handoverNum = null;
        } else if (work.action === "handover-adapter") {
          s.tab = "Loan register";
          s.editing = false;
          s.verifying = null;
          s.handoverNum = work.slip;
        } else {
          s.tab = "Loan register";
          s.onlyOpen = false;
          s.editing = false;
          s.verifying = null;
          s.handoverNum = null;
        }
        break;
      }
      case "issue-selected":
        s.selected = v;
        s.tab = "Loan register";
        s.editing = true;
        s.verifying = null;
        s.handoverNum = null;
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.verifying = null;
        s.handoverNum = null;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "open-register":
        s.tab = "Loan register";
        s.editing = false;
        break;
      case "verify":
        s.verifying = Number(v);
        s.handoverNum = null;
        s.tab = "Loan register";
        break;
      case "handover":
        s.handoverNum = Number(v);
        s.verifying = null;
        s.tab = "Loan register";
        break;
      case "cancel-flow":
        s.verifying = null;
        s.handoverNum = null;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches('[data-issue] select[name="req"]')) syncIssueForm(true);
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-verify]")) {
      const l = s.loans.find((item) => item.num === Number(form.get("slip")) && !item.back);
      if (!l) return;
      const entered = String(form.get("unit") || "").trim().toUpperCase();
      const returnedBy = String(form.get("returnedBy") || "");
      if (!people.includes(returnedBy)) return;
      if (entered !== l.asset) {
        const feedback = f.querySelector("[data-verify-feedback]");
        feedback.textContent = "Mismatch: this slip expects " + l.asset +
          ", but the item entered is " + (entered || "blank") + ". No return was recorded.";
        return;
      }
      l.back = true;
      l.returnedBy = returnedBy;
      l.returnedAt = deskTime();
      activity("Verified return of " + l.asset + " on L-" + l.num + " from " + returnedBy);
      s.verifying = null;
      commit("Verified " + l.asset + ". Slip L-" + l.num + " safely closed.");
      return;
    }
    if (f.matches("[data-handover]")) {
      const l = s.loans.find((item) => item.num === Number(form.get("slip")) && !item.back);
      const custodian = String(form.get("custodian") || "");
      const expected = String(form.get("expected") || "");
      const context = String(form.get("context") || "").trim();
      if (!l || !people.includes(custodian) ||
          !["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].includes(expected) ||
          !context || context.length > 300) return;
      l.custodian = custodian;
      l.expected = expected;
      l.handoverNote = context;
      s.notes.push({ phase: s.phase, linked: l.num,
        text: l.asset + " is with " + custodian + ", expected " + expected + ". " + context });
      activity("Updated handover for " + l.asset + ": " + custodian + ", expected " + expected);
      s.handoverNum = null;
      commit("Linked handover saved for L-" + l.num + ".");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false });
    activity("Issued " + asset + " to " + who + " on L-" + num);
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 1 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l && getReq(l.req) && getAsset(l.asset) && Number.isInteger(l.num),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      loans: d.loans.map((l) => ({ ...l })),
      notes: d.notes.map((n) => ({ ...n })),
      activity: Array.isArray(d.activity) ? d.activity.filter((x) => x && typeof x.time === "string" && typeof x.text === "string").slice(0, 30) : [],
      verifying: Number.isInteger(d.verifying) ? d.verifying : null,
      handoverNum: Number.isInteger(d.handoverNum) ? d.handoverNum : null,
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
