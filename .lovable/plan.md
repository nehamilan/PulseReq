## Verdict on the release-policy idea

Agreed — this is the right refinement and it fixes the contradiction in the original prompt. A single per-test `ReleasePolicy` enum, resolved to a per-report decision, is exactly how real portals behave and it demonstrates clinical governance without extra machinery.

Two adjustments:

**1. Policy belongs on the test (LOINC), not the report.** A requisition can mix a lipid panel (immediate) with an ultrasound (embargo). Attach the policy to each test in the catalogue, then resolve the *report's* policy as the most restrictive one present: `EMBARGO_DELAY > CLINICIAN_HOLD > IMMEDIATE`. One mixed order then correctly holds the whole report rather than half-leaking it.

**2. Make `EMBARGO_DELAY` actually time-based, or drop it.** If it behaves identically to `CLINICIAN_HOLD` it's a label, not a mechanism. Implement it as: auto-release after N days *unless* the clinician releases earlier — and show the patient a live countdown ("Available to view Aug 7 unless your clinician releases it sooner"). Because this is a mock, add a "fast-forward embargo clock" dev control so the behaviour is demoable without waiting a week. Clinician early-release is the escape hatch that makes the distinction visible in a 60-second demo.

Also worth keeping from my earlier review: results are a **separate lifecycle from the order**, not a new `RequisitionStatus`. Order stays `Intake complete`; the report carries its own state.

```text
Order:  Booked → Checked in → Intake complete
Report:            (none) → Preliminary → Released to patient
                              └─ policy decides whether release is automatic
```

## What to build

**Domain (`src/lib/domain.ts`)**
- `type ReleasePolicy = "IMMEDIATE" | "CLINICIAN_HOLD" | "EMBARGO_DELAY"` plus `releasePolicy` (and `embargoDays` for the third) on `OrderedTest`.
- `resolveReleasePolicy(tests)` → most restrictive policy in the order.
- `Observation { testId, coding, value, unit, refLow, refHigh, interpretation }` and `DiagnosticReportRecord { id, requisitionId, status: "preliminary" | "released", policy, publishedAt, embargoLiftsAt?, releasedAt?, releasedBy?, observations, narrative? }`.
- `interpret(value, low, high)` → `N | H | L`; `isVisibleToPatient(report, now)` — true when released, or when the embargo has lapsed; `patientResultStateLabel(report)` for the pending copy.
- LOINC catalogue extension: mock value range, UCUM unit, reference interval, plain-language explainer, and policy per test. Seeded so a lipid panel emits multiple Observations.

**Seed policies** — Fasting glucose / lipids / CBC / electrolytes → `IMMEDIATE`. Pathology, biopsy, tumour markers → `CLINICIAN_HOLD`. X-ray / ultrasound / CT / MRI → `EMBARGO_DELAY` (7 days). Rationale strings stored alongside so the UI can explain *why* a result is held.

**Store (`src/lib/requisition-store.tsx`)**
- `reports` state, `reportFor(requisitionId)`.
- `publishResults(reqId, actor)` — generates Observations, sets policy-resolved state; `IMMEDIATE` reports land released in one step.
- `releaseResults(reqId, actor)` — clinician review & release; works as early-release for embargoed reports.
- Audit chain gains `result.published`, `result.auto-released`, `result.released`, `result.viewed`.

**FHIR (`src/lib/fhir.ts`)**
- `toFhirObservation()` with `code`, `valueQuantity` (UCUM), `referenceRange`, `interpretation`, `basedOn` → ServiceRequest.
- `toFhirDiagnosticReport()` with `status` (`preliminary` / `final`), `result[]` references, `performer`.
- `toFhirResultBundle()` shared by both inspect drawers.

**Lab dashboard (`src/routes/lab.tsx`, `src/components/intake-drawer.tsx`)**
- On `Intake complete` rows: **"Simulate result generation"**. After publishing, the row shows the resolved policy chip — *Auto-released to patient* / *Held for clinician review* / *Embargoed until 7 Aug*.

**Doctor portal (`src/routes/order.tsx`)**
- New **Results review inbox** panel, grouped by patient, abnormal-first. Amber/red tags derived from `interpretation`.
- Held and embargoed reports get **"Review & release to patient"**; already-auto-released ones show *Released automatically · routine panel* with an acknowledge action, so the clinician still sees everything.
- **Inspect FHIR DiagnosticReport** drawer reusing the existing JSON viewer.

**Patient views (`src/routes/r.$token.tsx`, `src/routes/p.$patientId.tsx`)**
- Not yet visible → badge *"Results received by clinic — pending physician review"*, or for embargo, *"Available 7 Aug unless your clinician releases it sooner"*, each with a one-line plain-language reason.
- Visible → **My diagnostic results**: test name, value + unit, reference range, In range / Out of range badge, collapsible plain-language explainer, and a "not a diagnosis — discuss with your clinician" note.
- Toggle between patient view and raw FHIR DiagnosticReport JSON.
- Portal list gains a "Results available" marker.

**Demo aids** — seed one released routine panel, one clinician-held pathology report, one embargoed ultrasound; plus a small "advance embargo clock" control on the lab page so the timed path is demoable immediately.

Frontend-only, synthetic values, no routing or layout changes.
