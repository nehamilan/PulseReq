# Role-aware copy on the requisition page

## Problem

`/r/$token` is one shared page. When a clinician opens it from the Doctor Portal
(`?from=doctor`), the controls are already read-only, but every heading and
sentence still addresses the patient — "Your appointment is complete", "This
visit has been processed by the lab. Your report is in the Results tab.",
"My diagnostic results", "Discuss them with your clinician". Reading that as the
ordering physician is confusing.

## Change

Keep the patient wording exactly as it is today on the real patient link. When
`from=doctor`, swap in clinician-voice copy for the same states.

Requisition tab:

| State | Patient (unchanged) | Clinician |
| --- | --- | --- |
| Completed visit | "Your appointment is complete" / "This visit has been processed by the lab. Your report is in the Results tab." | "Visit complete" / "The lab has processed this visit. The report is in the Results tab." |
| Booked | "Your appointment is booked" / "Bring the check-in code below…" | "Appointment booked" / "The patient has booked this requisition at the centre below." |
| Not yet booked | "Your diagnostic requisition" / "No paper form to carry. Show this link…" | "Requisition detail" / "The patient has not booked yet. This is the link they received." |
| Link expired notice | "This booking link has expired" / "Contact your clinic…" | "This booking link has expired" / "The patient can no longer book. Extend or reissue from the Doctor Portal." |
| Expired / withdrawn full-page states | current patient copy | "This link has expired" / "The booking window closed on this requisition. Extend or reissue it from the Doctor Portal." and "This requisition was withdrawn" / "This order was revoked, so the patient link is disabled." |

Results tab:

- Page description "Results released to you by your clinic…" becomes "Released
  report for this patient, with the reference ranges the lab used."
- Panel title "My diagnostic results" becomes "Patient's diagnostic results".
- Pending-release copy "unless your clinician releases it sooner" becomes
  "unless released sooner".
- The footer disclaimer "Discuss them with your clinician before acting on
  anything you see here" is dropped in clinician view.
- Everything else — observation table, interpretation badges, FHIR inspector,
  audit logging — stays identical.

Booking confirmation card in clinician view: keep the panel as-is, only relabel
the "Before you arrive" prep heading to "Patient preparation" (that block only
renders in patient view today, so this is a small guard for consistency).

The existing "Clinician preview — read-only" notice stays.

## Technical notes

- `src/routes/r.$token.tsx`: `isClinicianView` already exists. Introduce a small
  local copy map keyed by role so each `PageShell` title/description, the expired
  notice, and the `LinkProblem` strings pick the right text. `LinkProblem` also
  needs its hardcoded `eyebrow="Role · Patient"` made role-aware.
- `src/components/patient-results.tsx`: add an optional `clinicianView` prop that
  switches the panel title, the pending text, the page-level phrasing, and hides
  the patient disclaimer. Audit entries and release gating are untouched.
- No changes to `src/lib/*`, store logic, or the Doctor Portal.
