Add a secondary "Back to patient portal" link to the `/r/$token` requisition detail page so a patient can return to their list without relying on the header.

Changes:
- `src/routes/r.$token.tsx`:
  - Import `Link` from `@tanstack/react-router`.
  - In the main requisition view (active/booking state), add a `Link` to `/p/$patientId` with `params={{ patientId: req.patientId }}` as a `PageShell` `action` or as a small secondary link just under the title.
  - Repeat the same back link in the `booked`/`completed` confirmation state so the patient can return after viewing the appointment.
- `src/components/booking-confirmation.tsx` (optional): if the back link is better placed alongside the booking confirmation title, render it as a small button here.
- Ensure the styling uses existing clinical tokens (`text-muted-foreground`, hover to `text-foreground`) and keeps the page's visual hierarchy intact.

The route remains `/r/$token` and the patient portal list remains `/p/$patientId`.