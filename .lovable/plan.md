# Results review inbox: group by what the patient can see

## Why the split looks odd today

The inbox splits cards on one thing only: whether a clinician clicked **Sign off & release**.

- Top list: every report where no clinician action has been recorded — including reports whose embargo already lapsed, so the patient can already see them. These show the green "Auto-released to patient" pill with an **Acknowledge** button.
- Collapsed "Released results" list: only reports a clinician explicitly signed off.

So Wei Zhang's CT Chest sits in the collapsed section because it was explicitly signed off, while the two Hemoglobin A1c reports auto-released on embargo lapse and are still waiting for an acknowledgement. Nothing is wrong with the data, but the labels contradict the grouping: three cards all say the patient has them, yet they live in two different places.

## Proposed change

Regroup by patient visibility instead of by clinician click:

1. Top list — "Awaiting your decision": only reports the patient cannot see yet (held for review, or still embargoed). Action stays **Sign off & release**.
2. Collapsed "Released results" section: everything the patient can already see — explicitly released *and* auto-released. Auto-released cards keep their green pill and their **Acknowledge** button inside this section, so the acknowledgement workflow is not lost.
3. Panel hint and the "Nothing awaiting sign-off" empty state count only true decision items.
4. Auto-released cards stay collapsed by default; held/embargoed stay expanded by default (unchanged).

Optionally, the released section header can read "Released to patient · N" and show a small count of ones not yet acknowledged, e.g. "2 unacknowledged", so nothing gets lost from view.

## Technical notes

Single file: `src/components/doctor-workspace.tsx`. Replace the `open` / `resolved` filters (currently `report.status === "released"`) with a visibility test using the existing `isVisibleToPatient(report, clock)` helper from `src/lib/results.ts`. Pass `onRelease` (Acknowledge) through to `ReportRow` in the resolved list for auto-released reports. The Extension requests section is untouched.
