# Plan: Add test name to the extension request dialog header

## What to build
Update the patient-portal extension request popup so its title clearly identifies the requisition being extended. Show the test display name plus LOINC code (e.g., “Lipid panel with direct LDL — Serum or Plasma LOINC 57698-3”) at the top of the dialog.

## Scope
- Read the existing `extension-request-dialog.tsx` component to understand the current dialog/pill structure.
- Pass the requisition’s test details (test name, LOINC code, and optionally a test category) into the dialog when opened from a row in the Patient Portal table.
- Replace the generic dialog title with the entry-specific test name and LOINC code.
- Keep the existing behavior for the doctor-portal “Extend” button variant (it may keep a generic title or also show the test name, depending on what is simplest).
- No new packages or backend changes.

## Implementation notes
- Use the existing `Requisition` / `LabOrder` domain type to locate the test name.
- If the dialog currently receives only the `requisitionId`, pass the full `requisition` object (or at least the test object) so the title can be rendered without an extra lookup.
- Maintain the current dialog close behavior and button layout.

## Verification
- Open the Patient Portal for the demo patient.
- Click the amber “Extension available” pill on a qualifying row.
- Confirm the dialog header shows the correct test name and LOINC code for that row.
