(() => {
  const storageKey = "campus-stores.shift.v2";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);

  // ---------------------------------------------------------------------------
  // Sample records (unchanged from the starter, plus desk-book metadata)
  // ---------------------------------------------------------------------------
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
  // `at` is minutes from Friday 00:00, so the desk can tell what is overdue.
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      short: "Fri 3:45 pm",
      at: 945,
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      short: "Fri 7:30 pm",
      at: 1170,
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      short: "Sat 9:00 am",
      at: 1980,
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const dueTimes = {
    "Fri 8 pm": 1200,
    "Sat 9 am": 1980,
    "Sat 10 am": 2040,
    "Sat noon": 2160,
  };
  const messages = [
    {
      at: 920,
      time: "Friday · 3:20 pm",
      author: "Isha Rao · Film Society",
      req: "RQ-214",
      authorizes: "Kabir Sen",
      text: "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
    },
    {
      at: 930,
      time: "Friday · 3:30 pm",
      author: "Tara Shah · Debate Union",
      req: "RQ-209",
      text: "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
    },
    {
      at: 1170,
      time: "Friday · 7:30 pm",
      author: "Kabir Sen · Film Society",
      req: "RQ-214",
      text: "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];

  const original = () => ({
    version: 2,
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
        holder: "Tara Shah",
        due: "Sat 10 am",
        origDue: "Sat 10 am",
        issuedAt: "Fri 3:30 pm",
        back: false,
        history: [],
        flags: [],
      },
    ],
    log: [],
    panel: "",
    onlyOpen: true,
    undo: null,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  let focusNext = "";

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const now = () => shifts[s.phase].at;
  const clone = (x) => JSON.parse(JSON.stringify(x));
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
  const opts = (list, selected = "") =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === selected ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const icon = (name) =>
    '<svg aria-hidden="true" class="store-icon"><use href="#icon-' +
    name +
    '"></use></svg>';
  const btn = (label, act, val = "", style = "", extra = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '"' +
    extra +
    ">" +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    esc(title) +
    "</h2><small>" +
    esc(sub) +
    "</small></div>" +
    control +
    "</div>";
  const badge = (t, kind = "") =>
    '<span class="tag' + (kind ? " " + kind : "") + '">' + esc(t) + "</span>";
  // Asset IDs are styled like the sticker on the physical unit.
  const chip = (id, big = false) =>
    '<span class="assetid' + (big ? " big" : "") + '">' + esc(id) + "</span>";
  const select = (label, name, options, selected = "", extra = "") =>
    "<label><span>" +
    esc(label) +
    '</span><select name="' +
    name +
    '" required' +
    extra +
    '><option value="">Select…</option>' +
    opts(options, selected) +
    "</select></label>";
  const errorBox = () =>
    '<p class="formerror" role="alert" hidden>' +
    icon("alert") +
    "<span></span></p>";
  const peopleOpts = people.map((p) => [p, p]);
  const dueOpts = Object.keys(dueTimes).map((d) => [d, d]);
  const fmtDur = (m) => {
    const h = Math.floor(m / 60),
      r = m % 60;
    return h ? (r ? h + " h " + r + " min" : h + " h") : r + " min";
  };
  const dueState = (l) => {
    const d = dueTimes[l.due] - now();
    if (d < 0) return { kind: "late", text: "Overdue " + fmtDur(-d) };
    if (d === 0) return { kind: "soon", text: "Due now" };
    if (d <= 60) return { kind: "soon", text: "Due in " + fmtDur(d) };
    return { kind: "", text: "Due " + l.due };
  };
  const openLoans = () =>
    s.loans
      .filter((l) => !l.back)
      .sort((a, b) => dueTimes[a.due] - dueTimes[b.due] || a.num - b.num);
  const overdue = () => openLoans().filter((l) => dueTimes[l.due] < now());
  // Who has the unit right now, at a glance: person icon + name.
  const holderHtml = (l) =>
    '<span class="who">' +
    icon("user") +
    "<b>" +
    esc(l.holder) +
    "</b>" +
    (l.holder === l.who ? "" : '<span class="from">from ' + esc(l.who) + "</span>") +
    "</span>";
  const snap = (label) => ({
    label,
    loans: clone(s.loans),
    log: clone(s.log),
  });
  const visibleMessages = () =>
    [
      ...messages.filter((m) => m.at <= now()),
      ...s.log.map((n) => ({
        at: shifts[n.phase].at,
        time: shifts[n.phase].time,
        author: n.author,
        req: n.req,
        text: n.text,
        auto: n.auto,
        desk: !n.auto,
      })),
    ]
      .map((m, i) => ({ ...m, i }))
      .sort((a, b) => b.at - a.at || b.i - a.i);
  const authorizedFor = (r) =>
    messages.find((m) => m.req === r.id && m.authorizes && m.at <= now());
  const loanForItem = (r, type) => {
    const ls = s.loans.filter(
      (l) => l.req === r.id && getAsset(l.asset).type === type,
    );
    return ls.find((l) => !l.back) || ls[ls.length - 1];
  };
  const itemsToIssue = (r) => r.items.filter((t) => !loanForItem(r, t));

  function requestState(r) {
    const all = s.loans.filter((l) => l.req === r.id);
    const open = all.filter((l) => !l.back);
    if (!all.length) return { text: "Ready to issue", kind: "" };
    if (!open.length) return { text: "All returned", kind: "good" };
    if (open.some((l) => dueTimes[l.due] < now()))
      return { text: open.length + " overdue", kind: "late" };
    if (open.length < all.length)
      return { text: open.length + " still out", kind: "soon" };
    return { text: open.length + " of " + r.items.length + " out", kind: "" };
  }

  // Same rules the starter enforced, with messages that say what to do next.
  function issueError(reqId, assetId, who, pending = []) {
    const r = getReq(reqId),
      unit = getAsset(assetId);
    if (!r) return "Choose a request.";
    if (!unit) return "Choose a unit.";
    if (unit.repair) return unit.id + " is in repair.";
    if (out(unit.id)) return unit.id + " is already out.";
    if (!people.includes(who)) return "Choose who’s collecting.";
    if (!r.items.includes(unit.type))
      return (
        unit.type + " isn’t on " + r.id + ". Approved: " + r.items.join(", ") + "."
      );
    const approved = r.items.filter((t) => t === unit.type).length;
    const already =
      s.loans.filter(
        (l) => l.req === r.id && !l.back && getAsset(l.asset).type === unit.type,
      ).length + pending.filter((t) => t === unit.type).length;
    if (already >= approved)
      return r.id + "’s " + unit.type + " is already out.";
    return "";
  }

  function issue(reqId, assetId, who, due) {
    const num = Math.max(400, ...s.loans.map((l) => l.num)) + 1;
    s.loans.push({
      num,
      req: reqId,
      asset: assetId,
      who,
      holder: who,
      due,
      origDue: due,
      issuedAt: shifts[s.phase].short,
      back: false,
      history: [],
      flags: [],
    });
    return num;
  }

  function closeLoan(l, by) {
    l.back = true;
    l.returnedBy = by;
    l.returnedAt = shifts[s.phase].short;
    l.lateBy = Math.max(0, now() - dueTimes[l.origDue]);
  }

  function stillOut(l, holder, until) {
    const was = [];
    if (holder !== l.holder) was.push(l.holder);
    if (until !== l.due) was.push(l.due);
    l.history.push({
      at: shifts[s.phase].short,
      text:
        "Now with " +
        holder +
        ", back by " +
        until +
        (was.length ? " (was " + was.join(", ") + ")" : ""),
    });
    l.holder = holder;
    l.due = until;
  }

  const addLog = (text, req = "") =>
    s.log.push({
      phase: s.phase,
      author: "Auto · loan register",
      text,
      req,
      auto: true,
    });

  // ---------------------------------------------------------------------------
  // Requests
  // ---------------------------------------------------------------------------
  function requestPage() {
    if (s.selected) return requestDetail(getReq(s.selected));
    let html = head(
      "Approved requests",
      requests.length + " approved by Student Activities",
    );
    for (const r of requests) {
      const st = requestState(r);
      html +=
        '<div class="row"><div><strong>' +
        esc(r.event) +
        "</strong><small>" +
        esc(r.club + " · due " + r.due) +
        '</small></div><div class="side">' +
        badge(st.text, st.kind) +
        btn("Open", "request", r.id) +
        "</div></div>";
    }
    return html;
  }

  function entry(m) {
    return (
      '<article class="record ' +
      (m.auto ? "auto" : m.desk ? "from-desk" : "from-club") +
      '"><div class="recordhead"><small>' +
      esc(m.time) +
      "</small>" +
      (m.req ? badge(m.req, "ref") : "") +
      "</div><h3>" +
      esc(m.author) +
      "</h3><p>" +
      esc(m.text) +
      "</p></article>"
    );
  }

  function requestDetail(r) {
    const st = requestState(r);
    let html =
      btn("← All requests", "close", "", "linkish") +
      '<div class="record request-card"><div class="recordhead"><small>' +
      esc(r.id) +
      " · Approved</small>" +
      badge(st.text, st.kind) +
      "</div><h3>" +
      esc(r.event) +
      '</h3><div class="facts"><span><b>' +
      esc(r.club) +
      "</b> · " +
      esc(r.owner) +
      "</span><span>Due <b>" +
      esc(r.due) +
      "</b></span></div><p>" +
      esc(r.note) +
      "</p></div>";

    // Background reading folds away; the kit is what the counter acts on.
    const msgs = visibleMessages().filter((m) => m.req === r.id);
    if (msgs.length)
      html +=
        '<details class="more fold"><summary>Desk book · ' +
        msgs.length +
        " message" +
        (msgs.length > 1 ? "s" : "") +
        "</summary>" +
        msgs.map(entry).join("") +
        "</details>";

    const issued = r.items.filter((t) => loanForItem(r, t));
    if (issued.length) {
      html += '<h3 class="subhead">Kit</h3>';
      for (const type of issued) {
        const l = loanForItem(r, type),
          a = getAsset(l.asset);
        let sub, right;
        if (l.back) {
          sub = esc("Back " + l.returnedAt);
          right = badge(
            l.lateBy ? "Back late" : "Back",
            l.lateBy ? "soon" : "good",
          );
        } else {
          const d = dueState(l);
          sub = holderHtml(l);
          right = badge(d.text, d.kind);
        }
        html +=
          '<div class="row"><div><strong>' +
          chip(a.id) +
          esc(a.model) +
          "</strong><small>" +
          sub +
          '</small></div><div class="side">' +
          right +
          "</div></div>";
      }
    }

    const toIssue = itemsToIssue(r);
    if (toIssue.length) html += kitIssueForm(r, toIssue);

    const open = s.loans.filter((l) => l.req === r.id && !l.back);
    if (open.length)
      html +=
        s.panel === "kit-return"
          ? kitReturnForm(r, open)
          : '<div class="buttons">' +
            btn("Take a return", "kit-return", r.id, "primary") +
            "</div>";
    return html;
  }

  function kitIssueForm(r, types) {
    const auth = authorizedFor(r);
    const who = auth ? auth.authorizes : r.owner;
    let html =
      '<form data-form="kit" data-req="' +
      esc(r.id) +
      '" class="panel"><h3>Issue the kit</h3>';
    types.forEach((type, i) => {
      const avail = assets.filter(
        (a) => a.type === type && !a.repair && !out(a.id),
      );
      const repair = assets.filter((a) => a.type === type && a.repair);
      const note =
        (avail.length ? avail.length + " on shelf" : "None on shelf") +
        (repair.length ? " · " + repair.length + " in repair" : "");
      html +=
        '<div class="checkrow"><label class="tick"><input type="checkbox" name="use" value="' +
        i +
        '"' +
        (avail.length ? " checked" : " disabled") +
        "><span><strong>" +
        esc(type) +
        "</strong><small>" +
        esc(note) +
        "</small></span></label>";
      if (avail.length)
        html +=
          '<label><span class="sr">Unit for ' +
          esc(type) +
          '</span><select name="unit_' +
          i +
          '">' +
          opts(avail.map((a) => [a.id, a.id + " · " + a.model + " · bin " + a.bin])) +
          "</select></label>";
      html += "</div>";
    });
    html +=
      '<div class="form">' +
      select("Collected by", "who", peopleOpts, who) +
      select("Return by", "due", dueOpts, r.due) +
      "</div>";
    html += auth
      ? '<p class="hint">' +
        icon("check") +
        "<span>" +
        esc("Authorised by " + auth.author.split(" · ")[0]) +
        "</span></p>"
      : "";
    html +=
      errorBox() +
      '<button type="submit" class="primary">Issue kit</button></form>';
    return html;
  }

  function kitReturnForm(r, open) {
    const until = dueOpts.filter(([d]) => dueTimes[d] >= now());
    let html =
      '<form data-form="kit-return" data-req="' +
      esc(r.id) +
      '" class="panel task"><h3>Take a return</h3><p class="hint">Tick what’s on the counter.</p>';
    open.forEach((l, i) => {
      const a = getAsset(l.asset);
      html +=
        '<div class="checkrow stacked"><label class="tick"><input type="checkbox" name="back" value="' +
        l.num +
        '" data-toggle="' +
        l.num +
        '"' +
        (i === 0 ? " data-autofocus" : "") +
        "><span><strong>" +
        chip(a.id) +
        esc(a.model) +
        "</strong><small>" +
        esc(a.type) +
        '</small></span></label><div class="stillout form" data-stillout="' +
        l.num +
        '">' +
        select("Not back — who has it?", "holder_" + l.num, peopleOpts) +
        select("Back by", "until_" + l.num, until) +
        "</div></div>";
    });
    html +=
      '<div class="form">' +
      select("Returned by", "by", peopleOpts, open[0].holder) +
      "</div>" +
      errorBox() +
      '<div class="buttons"><button type="submit" class="primary">Save</button>' +
      btn("Cancel", "cancel", "", "ghost") +
      "</div></form>";
    return html;
  }

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------
  function inventory() {
    const status = (a) =>
      a.repair ? "In repair" : out(a.id) ? "On loan" : "On shelf";
    const counts = {};
    for (const a of assets) counts[status(a)] = (counts[status(a)] || 0) + 1;
    let html = head(
      "Inventory",
      (counts["On shelf"] || 0) + " of " + assets.length + " on the shelf",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [
          f,
          f === "All items" ? f + " (" + assets.length + ")" : f + " (" + (counts[f] || 0) + ")",
        ]),
        s.filter,
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const st = status(a);
      if (s.filter !== "All items" && s.filter !== st) continue;
      let sub = esc(a.type + " · bin " + a.bin);
      let tag = badge(st, st === "On shelf" ? "good" : "");
      if (st === "On loan") {
        const l = out(a.id),
          d = dueState(l);
        sub = holderHtml(l);
        if (d.kind === "late") tag = badge("Overdue", "late");
      }
      html +=
        '<div class="row"><div><strong>' +
        chip(a.id) +
        esc(a.model) +
        "</strong><small>" +
        sub +
        '</small></div><div class="side">' +
        tag +
        "</div></div>";
    }
    return html;
  }

  // ---------------------------------------------------------------------------
  // Loan register
  // ---------------------------------------------------------------------------
  function register() {
    const open = openLoans(),
      late = overdue();
    let html = head(
      "Loan register",
      open.length + " out" + (late.length ? " · " + late.length + " overdue" : ""),
      s.panel === "issue"
        ? btn("Cancel", "cancel", "", "ghost")
        : btn("New issue slip", "new"),
    );
    if (s.panel === "issue") return html + issueSlipForm();
    html +=
      '<div class="segmented" role="group" aria-label="Which slips">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.onlyOpen
      ? open
      : [...open, ...s.loans.filter((l) => l.back).reverse()];
    if (!shown.length)
      html += '<p class="empty">No outstanding slips. Everything is home.</p>';
    for (const l of shown) html += slipRow(l);
    return html;
  }

  function issueSlipForm() {
    const available = assets.filter((a) => !a.repair && !out(a.id));
    return (
      '<form data-form="issue" class="panel task"><h3>New issue slip</h3><div class="form">' +
      select(
        "Request",
        "req",
        requests.map((r) => [r.id, r.id + " · " + r.club]),
        "",
        " data-autofocus",
      ) +
      select(
        "Unit",
        "asset",
        available.map((a) => [a.id, a.id + " · " + a.model + " · bin " + a.bin]),
      ) +
      select("Collected by", "who", peopleOpts) +
      select("Return by", "due", dueOpts) +
      "</div>" +
      errorBox() +
      '<button type="submit" class="primary">Issue</button></form>'
    );
  }

  function slipRow(l) {
    const a = getAsset(l.asset),
      r = getReq(l.req);
    const d = l.back ? null : dueState(l);
    let html =
      '<div class="slip' +
      (d && d.kind === "late" ? " is-late" : "") +
      '"><div class="slipmain"><div class="sliptitle">' +
      chip(a.id) +
      "<strong>" +
      esc(a.model) +
      "</strong></div>";
    // One glanceable line: who has it (or when it came back).
    html += l.back
      ? '<small class="holder">' +
        esc(
          "Back " +
            l.returnedAt +
            " · " +
            l.returnedBy +
            (l.lateBy ? " · " + fmtDur(l.lateBy) + " late" : ""),
        ) +
        "</small>"
      : '<small class="holder">' + holderHtml(l) + "</small>";
    for (const f of l.flags)
      html +=
        '<p class="flag">' + icon("alert") + "<span>" + esc(f.text) + "</span></p>";
    // Everything else is there when you need it, not in the way.
    html +=
      '<details class="more"><summary>Details</summary><ul>' +
      "<li>" +
      esc("Slip L-" + l.num + " · " + r.id + " " + r.club) +
      "</li><li>" +
      esc(a.type + " · home bin " + a.bin) +
      "</li><li>" +
      esc("Issued " + l.issuedAt + " to " + l.who + " · due " + l.origDue) +
      "</li>" +
      l.history.map((h) => "<li>" + esc(h.at + " · " + h.text) + "</li>").join("") +
      l.flags.map((f) => "<li>" + esc(f.at + " · flagged") + "</li>").join("") +
      "</ul></details>";
    html += '</div><div class="side">';
    html += l.back
      ? badge(l.lateBy ? "Back late" : "Back", l.lateBy ? "soon" : "good")
      : badge(d.text, d.kind);
    html += "</div>";
    if (!l.back && !s.panel.endsWith(":" + l.num))
      html +=
        '<div class="actions">' +
        btn("Still out", "still", String(l.num), "ghost", ' aria-label="Still out: update who has L-' + l.num + '"') +
        btn("Record return", "check", String(l.num), "", ' aria-label="Record return of L-' + l.num + '"') +
        "</div>";
    if (s.panel === "check:" + l.num) html += checkPanel(l);
    if (s.panel === "still:" + l.num) html += stillPanel(l);
    return html + "</div>";
  }

  function checkPanel(l) {
    const a = getAsset(l.asset);
    const twins = assets.filter((x) => x.type === a.type && x.id !== a.id);
    return (
      '<div class="panel task check" role="group" aria-label="Check the returned unit"><h3>Does the label match?</h3>' +
      '<div class="labelcheck">' +
      chip(a.id, true) +
      "<div><strong>" +
      esc(a.model) +
      "</strong><small>" +
      esc(a.type + " · bin " + a.bin) +
      "</small></div></div>" +
      (twins.length
        ? '<p class="hint warn">' +
          icon("alert") +
          "<span>" +
          esc(
            "Not " +
              twins.map((t) => t.id + " (" + t.model.split(" ")[0] + ")").join(", ") +
              " · same shelf",
          ) +
          "</span></p>"
        : "") +
      '<div class="form">' +
      select("Returned by", "by", peopleOpts, l.holder, " data-autofocus") +
      '</div><div class="buttons">' +
      btn("Matches · close slip", "confirm-return", String(l.num), "primary") +
      btn("Wrong unit", "mismatch", String(l.num)) +
      btn("Cancel", "cancel", "", "ghost") +
      "</div></div>"
    );
  }

  function stillPanel(l) {
    const until = dueOpts.filter(([d]) => dueTimes[d] >= now());
    return (
      '<form class="panel task" data-form="still" data-num="' +
      l.num +
      '"><h3>Still out</h3>' +
      '<div class="form">' +
      select("Who has it?", "holder", peopleOpts, "", " data-autofocus") +
      select("Back by", "until", until) +
      "</div>" +
      errorBox() +
      '<div class="buttons"><button type="submit" class="primary">Save</button>' +
      btn("Cancel", "cancel", "", "ghost") +
      "</div></form>"
    );
  }

  // ---------------------------------------------------------------------------
  // Desk book
  // ---------------------------------------------------------------------------
  function deskbook() {
    let html = head(
      "Desk book",
      "Club messages and shift notes",
    );
    const open = openLoans();
    html +=
      '<section class="snapshot" aria-label="Out right now"><h3>Out right now</h3>' +
      (open.length
        ? "<ul>" +
          open
            .map((l) => {
              const a = getAsset(l.asset),
                d = dueState(l);
              return (
                "<li><span><strong>" +
                chip(a.id) +
                esc(a.model) +
                "</strong><small>" +
                holderHtml(l) +
                "</small></span>" +
                badge(d.text, d.kind) +
                "</li>"
              );
            })
            .join("") +
          "</ul>"
        : "<p>Nothing out.</p>") +
      "</section>";
    html += visibleMessages().map(entry).join("");
    return (
      html +
      '<form data-form="note" class="panel"><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label>' +
      '<label><span>About</span><select name="req"><option value="">General</option>' +
      opts(requests.map((r) => [r.id, r.id + " · " + r.club])) +
      "</select></label></div>" +
      errorBox() +
      '<button type="submit">Add handover note</button></form>'
    );
  }

  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };

  // ---------------------------------------------------------------------------
  // Render + persistence
  // ---------------------------------------------------------------------------
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    const late = overdue().length;
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, ic]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '">' +
          icon(ic) +
          "<span>" +
          n +
          "</span>" +
          (n === "Loan register" && late
            ? '<span class="count" aria-label="' + late + ' overdue">' + late + "</span>"
            : "") +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    q("[data-status]").textContent = s.notice;
    const undo = q('[data-action="undo"]');
    undo.hidden = !s.undo;
    if (s.undo) undo.setAttribute("aria-label", "Undo " + s.undo.label);
    if (focusNext) {
      const el = q(focusNext);
      if (el) el.focus();
      focusNext = "";
    }
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

  function fail(form, msg) {
    const box = form.querySelector(".formerror");
    box.querySelector("span").textContent = msg;
    box.hidden = false;
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
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
        s.panel = "";
        s.undo = null;
        s.notice = "Now " + shifts[s.phase].time + ".";
        break;
      case "tab":
        if (s.tab === v && v === "Requests") s.selected = "";
        s.tab = v;
        s.panel = "";
        break;
      case "close":
        s.selected = "";
        s.panel = "";
        break;
      case "request":
        s.selected = v;
        s.panel = "";
        break;
      case "new":
        s.panel = "issue";
        focusNext = "[data-autofocus]";
        break;
      case "kit-return":
        s.panel = "kit-return";
        focusNext = "[data-autofocus]";
        break;
      case "check":
        s.panel = "check:" + v;
        focusNext = "[data-autofocus]";
        break;
      case "still":
        s.panel = "still:" + v;
        focusNext = "[data-autofocus]";
        break;
      case "cancel":
        s.panel = "";
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "confirm-return": {
        const l = s.loans.find((x) => x.num === Number(v));
        if (!l || l.back) return;
        const sel = q('.panel.check select[name="by"]');
        const by = sel && people.includes(sel.value) ? sel.value : l.holder;
        const a = getAsset(l.asset);
        s.undo = snap("closing L-" + l.num);
        closeLoan(l, by);
        if (l.history.length || l.lateBy)
          addLog(
            a.id +
              " back from " +
              by +
              ", label checked." +
              (l.lateBy ? " " + fmtDur(l.lateBy) + " late." : ""),
            l.req,
          );
        s.panel = "";
        s.notice =
          a.id +
          " back → bin " +
          a.bin +
          "." +
          (l.lateBy ? " " + fmtDur(l.lateBy) + " late." : "");
        break;
      }
      case "mismatch": {
        const l = s.loans.find((x) => x.num === Number(v));
        if (!l || l.back) return;
        const sel = q('.panel.check select[name="by"]');
        const by = sel && people.includes(sel.value) ? sel.value : l.holder;
        const a = getAsset(l.asset);
        s.undo = snap("flagging L-" + l.num);
        const text = "Wrong unit from " + by + ". " + a.id + " still missing.";
        l.flags.push({ at: shifts[s.phase].short, text });
        addLog(text, l.req);
        s.panel = "";
        s.notice = a.id + " flagged: wrong unit returned.";
        break;
      }
      case "undo":
        if (!s.undo) return;
        s.loans = s.undo.loans;
        s.log = s.undo.log;
        s.notice = "Undone: " + s.undo.label + ".";
        s.undo = null;
        s.panel = "";
        break;
    }
    commit();
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && s.panel) {
      s.panel = "";
      commit();
    }
  });

  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-filter]")) {
      s.filter = t.value;
      commit();
      return;
    }
    if (t.matches("[data-toggle]")) {
      syncToggle(t);
      return;
    }
    // Single-slip form: default "Return by" to the request's own due time.
    if (t.matches('[data-form="issue"] [name="req"]')) {
      const r = getReq(t.value),
        due = t.form.elements.due;
      if (r && !due.value) due.value = r.due;
    }
    const err = t.form && t.form.querySelector(".formerror");
    if (err) err.hidden = true;
  });

  function syncToggle(box) {
    const area = q('[data-stillout="' + box.dataset.toggle + '"]');
    if (!area) return;
    area.hidden = box.checked;
    area.querySelectorAll("select").forEach((x) => (x.disabled = box.checked));
  }

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    const kind = f.dataset.form;

    if (kind === "note") {
      const text = String(form.get("note")).trim();
      if (!text) return fail(f, "Write a note first.");
      const req = getReq(form.get("req")) ? form.get("req") : "";
      s.log.push({ phase: s.phase, author: "Counter handover", text, req, auto: false });
      commit("Handover note saved.");
      return;
    }

    if (kind === "issue") {
      const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
        form.get(k),
      );
      const err = issueError(req, asset, who) || (dueTimes[due] ? "" : "Choose a return time.");
      if (err) return fail(f, err);
      s.undo = snap("issuing " + asset);
      const num = issue(req, asset, who, due);
      s.panel = "";
      commit(asset + " out to " + who + " (L-" + num + ").");
      return;
    }

    if (kind === "kit") {
      const r = getReq(f.dataset.req);
      if (!r) return;
      const types = itemsToIssue(r);
      const picks = form
        .getAll("use")
        .map(Number)
        .filter((i) => types[i])
        .map((i) => ({ type: types[i], asset: String(form.get("unit_" + i)) }));
      const who = String(form.get("who")),
        due = String(form.get("due"));
      if (!picks.length) return fail(f, "Tick at least one item.");
      if (!dueTimes[due]) return fail(f, "Choose a return time.");
      const pending = [];
      for (const p of picks) {
        const err = issueError(r.id, p.asset, who, pending);
        if (err) return fail(f, err);
        pending.push(p.type);
      }
      s.undo = snap("issuing the " + r.club + " kit");
      picks.forEach((p) => issue(r.id, p.asset, who, due));
      const left = itemsToIssue(r);
      commit(
        (left.length ? picks.length + " out to " + who + ". " + left.length + " still to issue." : "Kit out to " + who + ". Complete."),
      );
      return;
    }

    if (kind === "kit-return") {
      const r = getReq(f.dataset.req);
      if (!r) return;
      const open = s.loans.filter((l) => l.req === r.id && !l.back);
      const backNums = form.getAll("back").map(Number);
      const by = String(form.get("by"));
      const plan = [];
      for (const l of open) {
        if (backNums.includes(l.num)) {
          if (!people.includes(by)) return fail(f, "Who brought it back?");
          plan.push({ l, back: true });
        } else {
          const holder = String(form.get("holder_" + l.num)),
            until = String(form.get("until_" + l.num));
          if (!people.includes(holder) || !dueTimes[until])
            return fail(f, getAsset(l.asset).id + " not back: who has it, and when?");
          plan.push({ l, holder, until });
        }
      }
      s.undo = snap("the " + r.club + " return");
      const backs = [],
        still = [];
      for (const p of plan) {
        const a = getAsset(p.l.asset);
        if (p.back) {
          closeLoan(p.l, by);
          backs.push(a.id);
        } else {
          stillOut(p.l, p.holder, p.until);
          still.push(a.id + " still out → " + p.holder + ", back by " + p.until + ".");
        }
      }
      if (still.length)
        addLog(
          (backs.length ? backs.join(", ") + " back. " : "") + still.join(" "),
          r.id,
        );
      s.panel = "";
      commit(
        (backs.length ? backs.length + " back" : "Nothing back") +
          (still.length ? ", " + still.length + " still out." : "."),
      );
      return;
    }

    if (kind === "still") {
      const l = s.loans.find((x) => x.num === Number(f.dataset.num));
      if (!l || l.back) return;
      const holder = String(form.get("holder")),
        until = String(form.get("until"));
      if (!people.includes(holder) || !dueTimes[until])
        return fail(f, "Who has it, and when is it back?");
      const a = getAsset(l.asset);
      s.undo = snap("updating L-" + l.num);
      stillOut(l, holder, until);
      addLog(
        a.id + " still out → " + holder + ", back by " + until + ".",
        l.req,
      );
      s.panel = "";
      commit(a.id + " → " + holder + ", back by " + until + ".");
    }
  });

  // ---------------------------------------------------------------------------
  // Restore a saved shift
  // ---------------------------------------------------------------------------
  function restore(d) {
    if (
      !d ||
      d.version !== 2 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      typeof d.panel !== "string" ||
      !Array.isArray(d.log) ||
      !d.log.every((n) => n && shifts[n.phase] && typeof n.text === "string") ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          dueTimes[l.due] &&
          dueTimes[l.origDue] &&
          people.includes(l.holder) &&
          Array.isArray(l.history) &&
          Array.isArray(l.flags),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      loans: clone(d.loans),
      log: clone(d.log),
      undo: null,
      panel: "",
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
