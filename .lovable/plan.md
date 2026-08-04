# Patient Portal: requisition table like the Issued Log

## What changes

The patient portal (`/p/:patientId`) stops showing stacked cards and shows a compact table, styled like the doctor's Issued Log:

| Test | Status | Issued | Expired Status | Action |

- **Test** — test names with LOINC codes underneath, plus the STAT/urgent badge stacked below the status like the Issued Log.
- **Status** — current lifecycle badge (Active, Booked, Checked in, Intake complete, Expired, Withdrawn).
- **Issued** — issue date.
- **Expired Status** — the expiry line already used today (e.g. "Expires in 5 days" / "Expired 2 days ago"), plus any pending/approved/declined extension pill.
- **Action** — **Open** (renamed from "Open Requisition"), **Request Extension** (renamed from "Request more time") when the requisition is eligible, and **View results** when a released report exists (kept, since it is the patient's only path to results).

## Sorting

Status, Issued, and Expired Status headers get the same click-to-cycle asc → desc → none control as the Issued Log, with the arrow indicator always visible. Expired Status sorts by actual expiry timestamp, not the label text.

## Technical notes

- Rewrite the list body in `src/routes/p.$patientId.tsx` as a table; reuse `effectiveStatus`, `expiryLabel`, `StatusBadge`, `PriorityBadge`, and the existing results-visibility logic.
- Lift the `SortHeader` component and sort-state pattern out of `src/components/doctor-workspace.tsx` into a shared component (e.g. `src/components/sort-header.tsx`) so both tables share one implementation; doctor behaviour unchanged.
- `ExtensionRequestControl` in `src/components/extension-request-dialog.tsx`: rename the trigger label to "Request Extension" and allow it to render inline in a table cell (drop the `mt-3` block wrapper via a prop or compact variant). The pending/resolved pill moves into the Expired Status cell.
- On narrow screens the table scrolls horizontally, same as the Issued Log.
