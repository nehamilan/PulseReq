Add a "View Results" action to patient portal entries, and decouple result access from link expiry.

## Rationale

Link expiry exists to stop a stale booking token being used to schedule an appointment. It should not lock a patient out of a diagnostic report for a test that was already performed. Result access is therefore gated only by the release policy (IMMEDIATE / CLINICIAN_HOLD / EMBARGO_DELAY), never by `expiresAt`.

## Changes

### 1. `src/routes/r.$token.tsx` — tabbed requisition page, expiry no longer blocks results

- Add a `tab` search param (`"requisition" | "results"`, default `"requisition"`) validated on the route, so `/r/$token?tab=results` deep-links straight to results.
- Move the current expired/revoked early-return so it no longer short-circuits when a report exists:
  - **Revoked**: still blocks everything. A withdrawn order is a clinical retraction.
  - **Expired with a report**: render the tabbed page. The Requisition tab shows a muted "This link has expired — contact your clinic to reissue" notice plus the extension-request control instead of the centre picker. The Results tab works normally.
  - **Expired with no report**: keep the existing `LinkProblem` screen unchanged.
- Render the tab strip only when a report exists for the requisition (`reportFor(req.id)`).
- Requisition tab holds the existing content: details panel, tests panel, and either the booking confirmation or the centre picker depending on status.
- Results tab renders `<PatientResults req={req} />`.
- Remove the inline `<PatientResults req={req} />` that currently sits under `<BookingConfirmation>`, per the earlier decision to move results out of the detail view.

### 2. `src/routes/p.$patientId.tsx` — the list action

- Add a "View Results" button beside "Open requisition" on each entry.
- Look up `reportFor(req.id)` and evaluate `isVisibleToPatient(report, now())`.
- **Report exists and is visible**: enabled button linking to `/r/$token` with `search={{ tab: "results" }}`, styled with the emerald/success accent so it reads as a distinct outcome from the primary booking action.
- **Report exists but is held or embargoed**: disabled button with amber styling and an inline hint — "Pending clinician release" or "Available [date]" from `embargoLiftsAt`.
- **No report**: button is hidden entirely.
- The button is shown regardless of expiry status; only a revoked requisition suppresses it.
- Replace the existing standalone "Results available" / "Results pending clinician release" text line, since the button now carries that state.

### 3. `src/components/patient-results.tsx` — unchanged

Continues to gate on `isVisibleToPatient` and log the `result.viewed` audit event when opened.

## Interoperability note

This mirrors real behaviour: in FHIR terms, `ServiceRequest.occurrencePeriod.end` lapsing does not retract the `DiagnosticReport`. Worth a one-line comment in the route so the intent is legible to anyone reading the code.

## Verification

- Build and typecheck.
- Preview: an expired requisition with a released report shows an enabled "View Results" button; clicking it opens the Results tab with the expiry notice visible on the Requisition tab; a revoked requisition shows no results action.