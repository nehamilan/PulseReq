# Show the extension pill in Priya Nair's portal

## What's happening

The amber "Extension available" pill is working as built: it only renders for requisitions still in **active** status that are expired or within 48 hours of expiring. Priya Nair's three demo rows are **Revoked**, **Checked in**, and **Intake complete** — none of them qualify. The "expires in 2 days" line on the top row belongs to the revoked order, which is why it looks like a miss.

## Fix

Add two demo requisitions for Priya so both pill states are visible immediately:

1. **Active, expiring soon** — issued ~5 days ago, expires in roughly 30 hours. Shows the amber "Extension available" pill next to View.
2. **Active, already lapsed** — expired ~1 day ago, never booked. Also shows the pill, covering the expired case.

Both use real LOINC codes (Lipid panel 57698-3 and Ferritin 2276-4), routine priority, and a 14-day link lifetime to match current defaults. No results attached, so the pill priority order (results first, then extension) still reads correctly.

No changes to the eligibility rule, the pill component, or the table layout.

## Technical detail

Append two `Requisition` entries with `patientId: "pat-3"` to the seed array in `src/lib/seed-data.ts`, using the existing `relDayAt` helper for relative issue/expiry timestamps.