# Campus Stores

A small, offline product-engineering work sample for a fictional campus equipment desk. The challenge: issue the Film Society's screening kit on Friday, accept a partial return, and give Saturday's shift enough information to close the **right physical-unit loan**.

Open **Candidate brief** and **What I changed** in the app.

## Product decision

**Keep:** The starter's one-slip-per-physical-unit model. It rejects equipment outside an approved request, blocks duplicate outstanding units of the same type, and excludes the projector in repair. These safeguards matter more than cosmetic changes.

**Change:** Partial returns previously left a generic handover note disconnected from the actual loan. When the adapter came back, **Record return** closed a slip without checking its physical label. That is risky: two similar USB-C adapters, **AD-12 (Belkin)** and **AD-15 (Anker)**, share bin C4.

The improvement links **current holder, expected return time, and history** to the correct slip, prioritizes overdue items, and asks staff to type the physical asset ID before closing a return. Wrong units remain flagged and outstanding.

## Try the complete shift

1. **Friday, 3:45 pm — Pickup:** Open **Requests → Courtyard screening**. The **Issue kit** form preselects available approved equipment, authorized collector Kabir Sen, and the original Friday 8 pm due time. Issuing creates separate slips for PR-04, SP-02 and AD-12.
2. **Friday, 7:30 pm — Partial return:** Advance desk time, open the Film Society request, and choose **Take a return**. Enter **PR-04** and **SP-02** as the returned unit labels. Leave AD-12 blank, set **Leela Das** as the holder, and set **Sat 9 am** as its expected return. The app updates the slip and handover notes.
3. **Saturday, 9:00 am — Verification:** Advance time and open **Loan register**. The remaining loan shows AD-12, its Belkin model, Leela as holder, and **Due now**. Select **Record return**. Try typing **AD-15**: the app flags the wrong unit rather than closing AD-12. Then use the correct label **AD-12** to close the slip. Original due time and late-return history remain visible.

**What I deliberately retained:** the approved-item and stock checks, physical-unit slips, inventory, free-form desk book, and offline sample-shift reset.

**What I simplified:** batch kit issue, one partial-return operation, short status labels, inline form errors, asset-ID stickers, compact loan cards, and details that expand only when needed. Undo can reverse the last issue/return-related operation.

## What would demonstrate improvement?

At a real equipment counter, **observe whether morning staff verify the returned physical label against the outstanding slip without searching other notes or asking the previous shift**. Count avoidable clarification questions and incorrect attempted closures before and after use. This is a proposed field observation, **not a claimed measured outcome**.

## Run and test

Open [index.html](index.html) in a modern browser. No installation or internet connection is needed. Optionally run:

~~~sh
python3 -m http.server 8000 --bind 127.0.0.1
~~~

Then visit http://localhost:8000.

Run dependency-free regression checks with Node 18+:

~~~sh
node --check app.js
node --test tests/workflow.test.cjs
~~~

**Limits:** This is a fictional, single-browser prototype using localStorage, not a multi-user inventory service. Physical-label verification depends on staff entering the label; there is no barcode scanner, server-side authentication, or real-world usability evidence. A full manual browser, mobile, and accessibility review is still recommended.

Source: [app.js](app.js) (workflow), [styles.css](styles.css) (interface), [tests/workflow.test.cjs](tests/workflow.test.cjs) (checks). Bundled Lucide icon license: [third-party/lucide-LICENSE.txt](third-party/lucide-LICENSE.txt).
