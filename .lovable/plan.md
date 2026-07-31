## Sequencing (my recommendation)

Ship this status-wording fix **before** the results workflow. It's a ~30-minute change, and the results feature will sit directly on top of it:

```text
Booked → Checked in → Intake complete → [results workflow: Resulted → Released to patient]
```

If "Intake complete" is still labelled "Specimen collected" when results land, the lifecycle reads as two competing terminal states. Fix the base first, then send your results prompt.

## Why the current label is wrong

In a real outpatient lab, specimen collection is a *milestone*, not the end: the order isn't finished until results are verified and released. It's also meaningless for imaging — an X-ray order has no specimen. PulseReq today uses "Specimen collected" as the terminal label for both.

## What to build

**1. Status labels (`src/lib/domain.ts`)**
- `completed` label → `"Intake complete"`. FHIR mapping unchanged (`checked-in → in-progress`, `completed → completed`).
- Add `handoffDetail(tests)` returning a modality-aware sub-line: *"Specimen collected · handed to LIS"* for lab work, *"Exam ready · released to imaging worklist"* for imaging, and a combined line for mixed orders.

**2. Two-step intake flow (`src/components/intake-drawer.tsx`)**
- On a `booked` order the primary action becomes **"Check in patient"** → status `checked-in`, logs a `patient.checked-in` audit event, no print.
- Once `checked-in`, primary action becomes **"Print labels & complete intake"** → status `completed`, logs `labels.printed` + `intake.completed`, triggers `window.print()`.
- Imaging-only orders hide the label block; the action reads **"Release to imaging worklist"**.

**3. Store (`src/lib/requisition-store.tsx`)**
- Split `completeCheckIn` into `checkInPatient(id, actor)` and `completeIntake(id, actor)`; update seeded audit detail strings to the new wording.

**4. Lab queue (`src/routes/lab.tsx`)**
- Surface the `Checked in` badge state in the queue so a partially processed patient is visible.

**5. Patient portal (`src/routes/p.$patientId.tsx`)**
- Replace the hard-coded `Specimen collected` string with the modality-aware handoff line.

**6. Seed data (`src/lib/seed-data.ts`)**
- Leave one seeded requisition in `checked-in` so the two-step flow is visible on first load.

No changes to routing, layout, or FHIR payload shapes. Results delivery (doctor vs patient presentation, authorization) is explicitly out of scope here — that's your next prompt.
