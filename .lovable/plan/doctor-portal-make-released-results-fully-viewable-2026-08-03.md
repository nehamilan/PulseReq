# Doctor Portal: make released results fully viewable

## What's happening

Nothing is broken in the data — it's the presentation. In the "Needs attention" tab, the Results review inbox splits reports in two:

- **Awaiting release** rows are full cards: patient, tests, a "View observations" expander, and an "Inspect FHIR DiagnosticReport" button.
- **Recently released** rows (including anything auto-released once the embargo lapsed and was confirmed) collapse into a dimmed one-line summary with only a status chip — no expander, no inspect button, nothing clickable.

So once a report reaches released state, the clinician loses the ability to read it from the portal. That's wrong: clinicians need to re-read released reports.

## The change

Presentation-layer only, in the Doctor Portal workspace component. Data model, release logic, patient views, and lab views stay untouched.

1. Rename the collapsed group from "Recently released" to "Released results" and drop the blanket dimming so the rows read as normal content rather than disabled leftovers.
2. Give each released row the same content the open rows have:
   - patient name, ordered tests, published/released timestamps, observation count, and abnormal count
   - a "View observations" expander with the observation table (value, unit, LOINC, reference range, interpretation badge) and the narrative
   - an "Inspect FHIR DiagnosticReport" button that opens the existing FHIR dialog and writes the same `result.viewed` audit entry
3. Released rows keep their release-state chip and policy chip, and do **not** get a release/sign-off button — that action is already done.
4. Extract the shared row body so open and released rows render from one component instead of two divergent copies.

## Notes

- Group stays inside a `<details>` so the inbox still leads with work that needs action; released reports are one click away rather than unreachable.
- Same typography, borders, spacing, and badge tokens already used in the inbox — no new visual language.
- Keyboard accessible: summary and buttons keep native focus behavior.
