# Clinician view of a requisition should be read-only

## Problem
`/r/$token` is one shared page. When a clinician opens a requisition from the Doctor Portal (`?from=doctor`), they get the full patient booking experience: the "Choose a diagnostic centre" panel, time-slot pills, and "Confirm & link requisition". Booking on the patient's behalf is not a clinician workflow, and the page even says "Role · Patient".

## Change
Treat `from=doctor` as a clinician read-only preview of the same requisition.

When opened from the Doctor Portal:
- Hide the "Choose a diagnostic centre" panel, slot pills, and the confirm button entirely.
- Hide the patient-only "Request extension" control (the clinician acts on extensions from their own portal).
- On a booked/completed requisition, keep the appointment summary visible but read-only: no "Change appointment" and no check-in code actions.
- Change the page framing from "Role · Patient" to "Role · Clinician · read-only preview", with a one-line note: "This is what the patient sees. Booking actions are disabled in clinician view."
- Keep everything informational: requisition details, tests ordered, status badge, expiry, the Results tab, and the existing back-to-portal behaviour.

When opened without `from=doctor` (the real patient link), nothing changes — full booking flow as today.

## Technical notes
- `src/routes/r.$token.tsx`: derive `const isClinicianView = from === "doctor"` and gate the centre-picker block, `ExtensionRequestControl`, and the `onChange` prop passed to `BookingConfirmation`; swap the `PageShell` eyebrow/description.
- `src/components/booking-confirmation.tsx`: accept a `readOnly` flag that suppresses the check-in code and appointment-modification actions, reusing the existing `completed` presentation path.
- No store, domain, or seed-data changes.
