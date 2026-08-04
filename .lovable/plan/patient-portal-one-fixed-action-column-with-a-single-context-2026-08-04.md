# Patient Portal: one fixed action column with a single contextual pill

## What changes

Each row in the Requisitions table gets a predictable action area:

- **View** — renamed from "Open", always present, always in the same right-hand position.
- **One optional pill**, immediately to its left, chosen by this priority:
  1. Results released to the patient → green **Results ready** pill, opens the results view.
  2. Otherwise, if an extension can be requested — within 48 hours of expiry **or already expired** — amber **Extension available** pill, opens the existing Request Extension flow.
  3. Otherwise → nothing.

No disabled or greyed-out controls remain in the column: the pending-release "View results" and the disabled "Request Extension" both disappear when the action isn't available.

Under the panel header, one line of helper copy: "Extensions open 48 hours before a requisition expires."

Status and Expired Status columns are untouched. Row height stays constant whether or not a pill renders (fixed-height action row, pill slot reserved).

## Technical notes

- `src/routes/p.$patientId.tsx`: replace the action cell contents with a fixed two-slot layout (`justify-end`, fixed min-height). Compute `pill = resultsVisible ? "results" : (canRequestExtension(req, now()) && !pendingExtension) ? "extension" : null` — `canRequestExtension` already covers both the 48-hour window and already-expired active orders. Remove the tooltip-wrapped disabled "View results" branch. Rename the primary link label to "View".
- Pill styling reuses the existing badge tokens: `rounded-full border px-2.5 py-1 text-xs font-medium`, `border-success/35 bg-success/15 text-success` for results, `border-warning/35 bg-warning/15 text-warning-foreground` for extension — same palette as `ExtensionPill` / `StatusBadge`, rendered as `Link` / `button`.
- `src/components/extension-request-dialog.tsx`: add a `renderTrigger` (or `variant="pill"`) option so the control renders the amber pill as its trigger and nothing at all when ineligible; drop the disabled-span + tooltip path from the patient table usage. The inline expand-in-place form stays as-is, and the doctor-side usage is unchanged.
- The pending/approved/declined `ExtensionPill` stays where it is in the Expired Status cell (a pending request therefore suppresses the action pill).
- Helper copy goes next to the `Panel` title in `p.$patientId.tsx` as muted 12px text.
- Frontend only; no store, domain, or data changes.
