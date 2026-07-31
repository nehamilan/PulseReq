Scope: Add a configurable link lifetime selector to the PulseReq Doctor Portal. This is requirement #1 only — no other changes from the broader list (issued date, STAT badge, demographics) are included.

User-facing change
- In the "New requisition" form, the clinician can now choose how long the patient-facing link remains valid: 3 days, 7 days (default), 14 days, or 21 days.
- The chosen lifetime is stored on the requisition and surfaced in the success dialog and the issued-list metadata.

Files to change

1. `src/lib/domain.ts`
   - Add `linkLifetimeDays: 3 | 7 | 14 | 21` to the `Requisition` interface.

2. `src/lib/seed-data.ts`
   - Change `EXPIRES_AT` so the seed requisition is +7 days from `ISSUED_AT` instead of +72h.
   - Set `linkLifetimeDays: 7` on both seed requisitions.

3. `src/components/order-form.tsx`
   - Add local state `linkLifetimeDays` defaulting to `7`.
   - Render a second segmented control below "Urgency" labeled "Link lifetime" with options: 3, 7, 14, 21 days.
   - On submit, compute `expiresAt` from `issuedAt + linkLifetimeDays * 24h` and include `linkLifetimeDays` in the created `Requisition`.

4. `src/components/requisition-created-dialog.tsx`
   - Replace the hard-coded "valid 72 hours" copy with the actual stored lifetime, e.g. "valid 7 days".

5. `src/routes/order.tsx`
   - Update the global hint pill from "Links expire 72h after issue" to "Link lifetime: 7 days default".
   - In the issued requisitions list, replace "expires in Xh" with a clearer label that includes both the issued date and the configured lifetime: e.g. "Issued 30 Jul 2026 · expires 6 Aug 2026 · 7 days".
   - Update the Interoperability panel's "Link lifetime" field to "3 / 7 / 14 / 21 days, configurable at issue".

Out of scope for this plan
- Displaying issuedAt dates in isolation (requirement #2).
- STAT badge or STAT queue sorting (requirement #3).
- Adding patient DOB/address (requirement #4).

Implementation notes
- Keep the existing `effectiveStatus` / `isExpired` helpers unchanged; they already derive status from `expiresAt`, so the new lifetimes will automatically drive expiry logic.
- Use the existing segmented-control UI pattern already present for the urgency toggle so the new selector feels visually consistent.
- No backend changes are needed; the app remains frontend-only with in-memory state.