## Goal
Once a diagnostic report exists for a requisition, the Requisition tab should stop presenting live booking controls and instead show a compact, read-only appointment history, pointing the patient to Results.

## What changes

**1. `src/components/booking-confirmation.tsx`** — add an optional `completed` mode:
- Panel title becomes "Appointment completed" (hint: "This visit is done") instead of "Appointment confirmed" / "Show this at check-in".
- Hide the check-in code panel entirely (the QR/mock barcode has no purpose after the visit).
- Hide "Change appointment" and "Get directions".
- Hide the "Before you arrive" prep instructions block (prep is retrospective now).
- Keep: centre name/address and the appointment date-time, rendered in neutral (border/muted) styling rather than emerald "success" styling; keep the tests list as a compact summary.
- Layout collapses from two columns to one full-width panel in completed mode.

**2. `src/routes/r.$token.tsx`** — drive that mode:
- When `report` exists, render `BookingConfirmation` with `completed` and no `onChange` handler, for both `booked` and `completed` statuses.
- Change the page title/description in that case to "Your appointment is complete" / "This visit has been processed by the lab. Your report is in the Results tab."
- Add a primary **View results** button under the completed summary that switches to the Results tab (same `setTab("results")` used by the tab strip), so the main next action is obvious.
- If a report exists but the requisition is still `active` (never booked — edge case), leave the current booking flow untouched.

## Technical notes
- No domain, store, or results logic changes — presentation only.
- `completed` is a new optional boolean prop on `BookingConfirmation`; `onChange` becomes optional so callers in completed mode don't need a no-op.
- The expiry notice and extension-request control stay as they are; they're independent of report existence.
