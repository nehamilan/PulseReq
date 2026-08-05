# Walk-in intake mini-feature for the Lab Tech Dashboard

## Scope

A "walk-in" in PulseReq means a requisition that the doctor already issued (the patient has a token), but the patient never booked an appointment online. They arrive at the lab with the requisition form/token, and the lab tech checks them in directly.

This is **not** a full patient-registration or requisition-creation flow. The ordering clinician still creates the requisition in the Doctor Portal; the Lab Tech only resolves it by token and accepts the patient at the counter.

## Recommendation

Keep the existing status lifecycle and add a small UI affordance rather than a new status:

- `active` → `checked-in` is allowed when the patient is physically present at the lab (skip the `booked` step).
- At check-in, stamp the current center and the current simulated time as the appointment.
- Show a "Walk-in" pill in the queue for any order that was checked in without a prior appointment.

This mirrors real Canadian lab workflows: a booked patient and a walk-in patient end up in the same queue; the only difference is whether they reserved a slot beforehand.

## Work items

1. **Allow check-in from `active` status in the Intake Drawer**
   - Change the primary action on an `active` requisition from disabled to "Check in as walk-in".
   - On click, set `centerId` to the currently selected lab center and `appointmentAt` to the simulated `now()`.
   - Transition status to `checked-in` and write an audit event: `patient.checked-in` with detail noting "walk-in · no prior appointment".

2. **Update the appointment queue logic**
   - Ensure walk-in rows (checked-in with an appointmentAt equal to the check-in time) appear in the "Today" tab and the main queue.
   - Add a "Walk-in" pill next to the Priority badge when `appointmentAt` is roughly the same as the check-in audit event time.

3. **Tighten the intake lookup experience**
   - When a token is resolved and the requisition is `active`, show a clear message: "No appointment booked — check in as walk-in".
   - Keep the same button that opens the intake drawer and performs the check-in.

4. **Demo seed data (optional)**
   - Add one pre-existing active requisition for the current demo center that has no appointment, so the walk-in path is visible immediately.

## Out of scope

- Creating a requisition from scratch in the lab view.
- New patient registration (patients still come from the seeded patient list).
- Any changes to the Doctor Portal, Patient Portal, or Extension request flows.

## Files likely touched

- `src/components/intake-drawer.tsx`
- `src/routes/lab.tsx`
- `src/lib/requisition-store.tsx`
- `src/lib/domain.ts` (audit detail helper only)
- `src/lib/seed-data.ts` (optional demo row)

## Open question

Should the walk-in row in the queue be visually grouped or sorted separately from pre-booked appointments? The proposal above keeps them in one chronological list but marks them with a "Walk-in" pill.
