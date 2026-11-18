# Campus Stores

Campus Stores is a Product Engineer work sample set at a fictional campus media equipment desk. Work through a club’s screening, from equipment pickup to a partial return and the next morning’s handover. Open **Candidate brief** in the app for the assignment.

---

## My submission: keep the loan honest after a partial return

**Short answer to "Would you keep this product?"** Yes. Its core model is right: one slip per physical unit, checked against the approved request. But it loses track of a loan the moment the kit comes back in pieces. I changed that moment and the screens around it, and kept the rules.

Open the app and click **What I changed** (top right) for the one-screen version. Start with the **single suggested next action** above the records; it guides you through pickup, partial return, and the Saturday verification. Use **Restart sample shift** to begin again.

### The shift I played on the starter (evidence)

| Time | What I did | What happened |
| --- | --- | --- |
| Fri 3:45 pm | Tried to issue the camera CA-03 on RQ-214, then a second speaker SP-05 | Both refused with a reason. PR-06 (in repair) was never offered. |
| Fri 3:45 pm | Issued PR-04, SP-02, AD-12 to Kabir | 3 separate forms, 12 dropdown picks. "Return by" didn't default to Fri 8 pm. Nothing confirmed the kit was complete. |
| Fri 7:30 pm | Closed L-402 and L-403; adapter L-404 stayed out | L-404 still said **Kabir Sen · Due Fri 8 pm**. No way to record that Leela had it or that it was promised for Sat 9 am. The only option was a free-text desk-book note. |
| Sat 9:00 am | Leela walks in with "an adapter" | L-404 was 13 h overdue but looked the same as Tara’s mic, which wasn't due yet. The register showed only "AD-12". I had to open Inventory to learn it’s a **Belkin AVC002**, on the same shelf (C4) as **AD-15, an Anker** of the same type. |
| Sat 9:00 am | Clicked Record return | Closed in one click: no check, no "returned by", no time, no late flag. If she’d brought the Anker, the record would say the Belkin was home. |

**A moment it handles well (kept):** issuing at 3:45 pm. The app refused CA-03 and the second speaker, and hid PR-06. Per-unit slips are also what made the partial return possible to record at all: I could close two slips and leave one open.

**The moment I'd change:** Saturday 9 am, closing L-404. The record stopped matching reality at Friday 7:30 pm. The morning shift then closed a 13-hour-late loan against the wrong person's name, without being told which physical adapter to look for.

### The change, walked through the same job

1. **Fri 3:45 pm, Issue the kit (on the request).** The request page lists each approved item with an available unit pre-picked, shown with its model and bin. *Collected by* defaults to Kabir, because Isha authorised him in the desk book, and the app says so. *Return by* defaults to the request's Fri 8 pm. One click creates L-402, L-403 and L-404. The same rules apply as before.
2. **Fri 7:30 pm, Take a return (on the request).** Tick what's on the counter: the projector and speaker. For the unticked adapter, the form **won't save** until you say *Still out with* **Leela Das**, *coming back by* **Sat 9 am**. L-404 now reads *With Leela Das · issued to Kabir Sen · Due Sat 9 am*, with a history line, and the desk book entry is written automatically.
3. **Sat 9:00 am, Loan register.** L-404 is at the top: *Due now · AD-12 · Belkin AVC002 · home bin C4 · with Leela Das*. If nobody had recorded the still-out, it would read **Overdue 13 h** in red, with a count on the nav.
4. **Record return** opens a check instead of closing: *"Check the label reads AD-12. It should be a Belkin AVC002 … Easy to confuse with AD-15 (Anker A8312, bin C4)."* *Returned by* is pre-filled with Leela.
   - **Type the physical asset ID**, then choose **Matches · close slip**. A blank or incorrect ID cannot close the slip. Matching AD-12 records: *Returned Sat 9:00 am by Leela Das · 13 h after original due time*.
   - **It's a different unit** keeps L-404 open and flags it: *"AD-12 is still missing"*. It also writes to the desk book.
   - **Undo** in the status bar reverses the last issue or return.

### What I kept

- One slip per physical unit.
- Approved-items-only, approved-quantity-only, nothing from repair (same rules, clearer messages shown next to the form).
- The plain register list, the Inventory and Requests screens, the desk book for free-form messages, and the visual style.

### One observation at a real counter

On the morning after a partial return, watch whether the incoming staffer **checks the label on the returned unit against the slip before closing it**, straight from the register. It works if they do that without opening the desk book or asking a colleague who had it. It hasn't helped if they still go hunting through notes, or close it without looking.

### Everything that changed

- **Request page:** status per request (*Ready to issue*, *3 of 3 out*, *1 still out*, *1 overdue*, *All returned*), desk-book messages for that request, one-step kit issue, kit return with required still-out details.
- **Loan register:** unit model and home bin on every slip, current holder vs issued-to, *Overdue / Due now / Due in …* from the desk clock, overdue first, **Still out** and a checked **Record return**, flagged mismatches, returned-by/when/late on closed slips. Action buttons sit on their own row, so a return doesn't shift the next button under your cursor.
- **Inventory:** who holds each unit and on which slip, overdue badge, counts in the filter.
- **Desk book:** an *Open loans right now* summary kept up to date from the register, request tags, automatic entries for partial returns and mismatches.
- **Visual design:** colour carries one meaning each. Teal is navigation and the single primary action on a screen, red is only "overdue / something's wrong", amber is "due soon" and notes written by the desk (matching the shift memo), green is "done", and coral is kept for the logo. Asset IDs are drawn like the sticker on the physical unit, so "check the label" has something to match. The active task (a return check, a still-out update) gets a highlighted panel. Secondary actions are outlined or text-only, so only one solid button competes for attention. The palette was designed for readable contrast in light and dark; a full independent contrast audit is still outstanding.
- **Designed for a 5-second glance:** a stage-aware action guide answers *what do I do next?* without forcing navigation. Someone is standing at the counter, so each screen answers one question at a glance: *what needs me?* (register), *is this the right unit?* (check), *what's missing?* (request). Each slip shows only the label, the model, who has it and its status. Slip number, request, issue time and history sit behind **Details**. Desk-book messages on a request fold away. Panels use short questions ("Does the label match?", "Who has it?") instead of instructions. These are design choices, not measured user-time savings or a real-world usability study.
- **General:** errors shown next to the form instead of in the status bar, Undo, Escape closes panels, focus moves into opened panels, overdue badge on the nav, mobile layout checked at 375 px.

Changed files: `app.js` (same sample data, integrated issue and return flows, next-action guide, ID validation), `styles.css` (responsive glance-first layout), `index.html` (helpful context, next-action guide, Undo), and `tests/integration.test.cjs` (dependency-free workflow regression cases). Saved shifts use `campus-stores.shift.v2`, so old version-one browser state starts fresh.

---

## Verification and tradeoffs

The focused improvement has been exercised through **11 simulated regression checks** covering kit issuance, authorization and repair safeguards, partial returns, custody handover, guided next actions, incorrect physical IDs, wrong-unit exceptions, return audit, persistence, and reset. Run the committed test suite locally with Node 18+:

```sh
node --check app.js
node --test tests/integration.test.cjs
```

A **real browser visual and keyboard walkthrough** should still be performed before relying on it in production. This is a fictional, single-browser work sample without backend synchronization, authentication, physical barcode scanning, or real equipment records. The kit return checklist records staff assertions for the projector and speaker; the Saturday individual return adds the stronger requirement to type the adapter's actual asset ID. The interface cannot independently validate a physical label without connected hardware.

---

## Run the app

Open `index.html` in a modern browser. The app includes its scripts, styles, and icons and can run offline.

To serve it over local HTTP, run this from the repository folder and visit `http://localhost:8000`.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Each browser stores its own sample shift locally when browser storage is available. **Restart sample shift** restores the fictional starting records.

## Source

- `index.html` contains the desk layout, candidate brief, "What I changed" note, and bundled icons.
- `app.js` contains the sample records and interactions.
- `styles.css` defines the desktop and mobile layouts.

Icon license notices are in [third-party/lucide-LICENSE.txt](third-party/lucide-LICENSE.txt).
