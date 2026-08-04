## Short answer

There is no revoke action today. "Revoked by clinician" only exists as a status value in the data model (`RequisitionStatus`), rendered by the badge and used by one seeded requisition in `src/lib/seed-data.ts`. The patient view already blocks a revoked order, and the FHIR mapper already maps it to `revoked` — but nothing in the Doctor Portal can set it.

## Proposed: add a clinician revoke action

**Where it appears**
- Issued log table (Tab 2): a "Revoke" text button next to "Open →", shown only for requisitions that are still open (`active`, `booked`, `checked-in`). Hidden for completed, expired, and already-revoked rows.

**Confirmation step**
- Small confirm dialog: "Revoke this requisition?" with patient name, test panel names, and a short explanation that the patient link stops working immediately and the lab queue entry is withdrawn.
- Optional reason field (free text, short) — e.g. "ordered in error", "duplicate order", "clinical decision changed".
- Buttons: Cancel / Revoke requisition (destructive styling).

**What revoking does**
- Sets `status: "revoked"` on the requisition.
- Writes an audit event `order.revoked` into the hash-chained ledger, with the reason in the detail line.
- Any pending extension request for that requisition is auto-declined (it is meaningless once the order is withdrawn).
- The row moves under the "Revoked by clinician" filter chip; count updates live.

**Downstream effects (already handled, no changes needed)**
- Patient link `/r/$token` shows the blocked state.
- Patient portal hides "View results" for revoked orders.
- Lab dashboard drops the order from the actionable queue.

**Not revocable**
- Once results exist, revoking the order does not retract the report — so revoke is disabled for requisitions with a published DiagnosticReport, with a tooltip explaining that a released report requires an amendment, not a revocation. This matches real FHIR behaviour.

## Technical notes
- `src/lib/domain.ts`: add `"order.revoked"` to `AuditAction` and `AUDIT_LABEL` ("ORDER REVOKED"); add a small helper `canRevoke(req, hasReport)`.
- `src/lib/requisition-store.tsx`: add `revokeRequisition(id, actor, reason?)` that patches status, appends the audit event, and declines pending extensions.
- `src/components/doctor-workspace.tsx`: add the Revoke button column action plus a local confirm dialog component.
- Presentation + store action only; no seed data or results changes.
