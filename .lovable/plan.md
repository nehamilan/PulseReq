# Clinicians should always see the report on the Results tab

## What's happening

That requisition's report is under a **clinician hold** (sensitive panel), so it is still `preliminary` — not released to the patient portal. `PatientResults` gates the whole panel on `isVisibleToPatient(...)`, which is the *patient* rule. The clinician view reuses the same component, so the doctor gets the patient's "pending release" placeholder instead of the values they are the one meant to review and release.

Nothing is broken in the data — the observations exist; they're just hidden by a patient-facing gate applied to the wrong audience.

## The fix

1. **Clinicians bypass the patient gate.** In `PatientResults`, when `clinicianView` is true, always render the observations, narrative and FHIR inspector. The patient path is unchanged.

2. **Show release state instead of hiding content.** Above the values in clinician view, a short banner states why the patient can't see it yet:
   - Clinician hold: "Not yet visible to the patient — held for your review."
   - Embargo: "Auto-releases to the patient on <date>."
   - Released: "Released to the patient on <date>."

3. **Add a "Release to patient" action** in that banner for held or embargoed reports, wired to the existing `releaseResults` store action (same one the Doctor Portal results inbox uses), so the doctor can act from where they noticed it. After release the banner flips to the released state.

## Technical notes

- `src/components/patient-results.tsx`: compute `visible` as before, but branch on `clinicianView || visible` for rendering; add the release banner sub-block using `report.status`, `report.policy`, `report.embargoLiftsAt`, `report.releasedAt`.
- Pull `releaseResults` from `useRequisitions()` (already imported) and call it with an actor label consistent with the Doctor Portal inbox.
- Keep the existing `result.viewed` audit log on the patient path only.
