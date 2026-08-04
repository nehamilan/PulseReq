Strengthen Revoke confirmation warning when the patient has already booked

## Goal
Keep the Revoke action available for booked and checked-in requisitions, but make the confirmation dialog clearly warn that the patient has already scheduled an appointment and that revoking will cancel the lab visit.

## Current state
- Revoke is shown in the Issued log for `active`, `booked`, and `checked-in` statuses (unless a published report exists).
- The `RevokeDialog` component in `src/components/doctor-workspace.tsx` currently shows a generic warning: "The patient link stops working immediately and the order is withdrawn from the lab queue. Any pending extension request is declined."
- Requisitions store `appointmentAt` and `centerId` when the patient has booked.

## Changes

### 1. Compute booking-aware warning in the Issued log
When opening the Revoke dialog, pass a derived `hasBooking` boolean (based on `req.status === "booked" || req.status === "checked-in"` and the presence of `appointmentAt` and `centerId`).

### 2. Update `RevokeDialog` UI
- Keep the same header and patient/test summary.
- Add a conditional alert block when `hasBooking` is true:
  - Use a warning/amber accent (e.g., `bg-warning/10 border-warning` or `bg-destructive/10 border-destructive`) to make it visually distinct.
  - Text: "The patient has already booked an appointment at [center name] on [date] at [time]. Revoking will cancel the appointment and withdraw the order from the lab queue."
- Keep the generic warning text for non-booked requisitions.
- Make the reason input still optional, but add a hint when booked: "Please record why this booked order is being cancelled."
- Keep Cancel / Revoke requisition buttons unchanged.

### 3. Domain helpers
- Add a small helper `formatSlotTime` or reuse `formatClinicalDateTime` to render the booked appointment date/time in the dialog. The existing `formatClinicalDateTime` in `src/lib/domain.ts` is sufficient.
- Resolve the centre name via `getCenter(req.centerId)` from the store.

## Files to edit
- `src/components/doctor-workspace.tsx`: pass booking details to `RevokeDialog`, and render the conditional warning inside the dialog.
- `src/lib/domain.ts`: no new type needed; use existing `formatClinicalDateTime` and `STATUS_LABEL`.

## Out of scope
- No change to which rows show Revoke.
- No change to the audit event or `revokeRequisition` store logic.
- No change to patient portal behaviour.
