# Campus Stores — Know what is still out

**Product Engineer work sample:** verified physical-unit returns and a handover that the next shift can act on, built on the original offline Campus Stores simulation.

## Review this in 90 seconds

1. Open [index.html](index.html) in a modern browser, or run the local server:

        python3 -m http.server 8000 --bind 127.0.0.1

   Then visit http://localhost:8000.
2. Open **Candidate brief** to read the original prompt. Use **Restart sample shift** for a clean run.
3. Follow the [pickup → partial return → handover walkthrough](#walkthrough).
4. Inspect [app.js](app.js), [styles.css](styles.css) and [tests/workflow.test.cjs](tests/workflow.test.cjs).

**No dependencies, build system, backend or account needed.** Fictional desk records are stored in this browser, not a shared database.

## Product judgment

### What I would keep: accountability per physical unit

On Friday at 3:45 pm, the Film Society's approved form asks for a projector, speaker and USB-C→HDMI adapter. I tried issuing a second unit of an already-loaned equipment type and choosing the projector in repair (PR-06). The starter correctly rejects these actions. Each **physical unit gets its own loan slip**, rather than one ambiguous "kit" record.

**Keep:** per-unit slips, availability filtering, approved-request validation, and the three-stage shift story. These are foundations for a trustworthy return.

### What I would change: the adapter cannot safely cross shifts

At Friday's 7:30 pm partial return, Kabir brings back the projector and speaker but Leela still has the adapter. Two near-identical adapters, **AD-12 (Belkin)** and **AD-15 (Anker)**, share bin C4. In the starter, a generic note can mention Leela but is not linked to the particular loan slip. Worse, **Record return** closes whichever slip was clicked immediately, without checking that the item in front of staff is the correct physical unit.

On Saturday at 9 am, the incoming shift must reconstruct custody from separate screens and may accidentally close the wrong adapter slip. This is a **data-trust problem**, not merely an extra-click problem.

**Design principle:** keep returns fast, but never silently sacrifice physical-unit correctness.

## The change: verified returns + linked handover

- **Verify the actual unit:** the return flow shows its expected **asset ID, model, bin, request, original collector, and current holder**. Staff enter the ID printed on the returned item and choose who returned it. An ID mismatch **does not close the slip** and displays feedback.
- **Preserve responsibility:** a handover records a **new holder, expected hand-in and context on the outstanding slip**, preserving the original collector and original due time.
- **Make the next action obvious:** shift-priority panel, live desk metrics, and linked desk-book notes make outstanding equipment visible to incoming staff.
- **Reduce pickup friction:** available unit choices follow the selected approved request; its original due time is preselected.
- **Make it usable:** a clear visual hierarchy, responsive layout, readable statuses, focus styling and explicit actions. All four original tabs remain.

## Design for a five-second glance

The desk worker should immediately answer **where am I, what is outstanding, and what do I do now?** To reduce unnecessary reading, the interface prioritizes:

1. **One next action** at the top, written as an instruction rather than a vague command.
2. **Short outcome-oriented status:** the Film Society summary says how many items came back and how many are still out.
3. **Status beside the item name** so "Due soon", "Due now", and "Overdue" remain visible on a narrow screen.
4. **Details on demand:** the returned item's asset ID is large, while its full slip context sits behind "View loan details".
5. **Accessible confirmation:** asset-ID mismatch prevents closure and provides text feedback instead of relying on colour alone.

"Five-second glance" is a **design heuristic, not a measured usability result**. The actual field measure remains the clarification questions counted during handover, described below. I did not invent time-savings, click reductions or user-test scores.

## Walkthrough

| Shift | Action | Expected result |
|---|---|---|
| **Friday 3:45 pm** | Read **Requests → Courtyard screening** and the **Desk book** pickup message. | Film Society needs a projector, speaker and adapter; Kabir can collect. |
| **Pickup** | In **Loan register**, create three slips under **RQ-214**: **PR-04**, **SP-02**, **AD-12**, collected by **Kabir Sen**. | Three independent slips; original approval and stock safeguards remain. |
| **Friday 7:30 pm** | Advance time. **Verify return** on **PR-04** and **SP-02**, entering each matching ID and choosing Kabir. | Only those two slips close; **AD-12** remains outstanding. |
| **Handover** | On **AD-12**, use **Set handover**: **Leela Das**, **Sat 9 am**, with a short note. | The adapter slip and desk book carry the linked handover; the original collector is preserved. |
| **Saturday 9 am** | Advance time, inspect the priority panel, and start **Verify return** for AD-12. First enter **AD-15**. | Mismatch is refused; AD-12 remains open. |
| **Correct return** | Enter **AD-12** and choose **Leela Das**. | Only the correct slip closes; the Film Society kit is accounted for. |

Refresh the browser to confirm persistence. **Restart sample shift** restores original fictional records.

## Before and after

| | Original | Improved |
|---|---|---|
| Friday partial return | Generic note disconnected from the slip | Handover linked to **AD-12**, including holder and expected time |
| Saturday morning | Staff cross-reference messages and register | Priority panel identifies the exact outstanding unit |
| Item arrives | Clicking **Record return** closes the selected slip | Verify the **physical asset ID** before closing |
| Wrong adapter | Wrong unit's slip can be closed silently | Mismatch is blocked with clear feedback |

## How would I know it helped?

**One real-counter observation:** count how often incoming morning staff have to interrupt the previous shift or the club to identify **which physical unit is outstanding**. Compare handover-related clarification questions per shift before and after introducing linked custody. A reduction, without incorrect closures, would support the product hypothesis.

This is a proposed test, **not a measured result**. No real staff or equipment were studied.

## Checks

Run with Node 18+ (no packages to install):

    node --check app.js
    node --test tests/workflow.test.cjs

The tests cover approvals, repair exclusions, duplicate equipment, partial returns, wrong-ID rejection, linked custody, morning visibility, activity, persistence, and reset. Browser checks should additionally verify the responsive layout and keyboard interaction.

## Boundaries and tradeoffs

This is still a **single-browser, fictional prototype**. localStorage is neither shared nor authoritative. Return verification assumes a readable physical asset label and accurate entry; lost labels and barcode scanning would require an exception workflow. I deliberately did **not** add a backend, authentication, notifications, or unrelated inventory features. Those would add risk without proving the central handover improvement.

## Submission

Forked from [virinchi-healthcare/campus-stores](https://github.com/virinchi-healthcare/campus-stores). The final exact commit link is submitted in the [official Google Form](https://docs.google.com/forms/d/e/1FAIpQLScvzoh1R4WS-SkiwAVBQbMvniieJYSoOEfLMyVo5CyjOvYUgQ/viewform). The requested roll number and email belong **only in the form**, not in repository files.

Icon license notices: [third-party/lucide-LICENSE.txt](third-party/lucide-LICENSE.txt).
