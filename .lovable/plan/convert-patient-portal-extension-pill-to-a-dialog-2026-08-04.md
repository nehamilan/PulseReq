# Convert Patient Portal Extension Pill to a Dialog

## What changes

When the patient clicks the amber **Extension available** pill in the Patient Portal requisitions table, open a centered dialog overlay instead of expanding the form inline inside the table row. This keeps every row at a fixed height and width, and the dialog gets an X close button in the top-right corner.

## Scope

- Only the patient-portal pill variant changes. The inline "Request Extension" button used elsewhere (e.g., doctor or detail views) stays as-is.
- The form contents remain the same: day options (+7, +14, +21, +28), optional reason field, and Send/Cancel actions.

## Files

1. `src/components/extension-request-dialog.tsx`
   - Wrap the pill variant's open form in the existing `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter` components.
   - Keep the same day-pill selection, reason input, and submit/cancel controls inside the dialog body.
   - The built-in `DialogPrimitive.Close` button in `DialogContent` provides the X on the top right.
   - Keep the amber pill trigger as the `DialogTrigger`.

2. `src/routes/p.$patientId.tsx`
   - No structural changes needed; the action cell continues to render `ExtensionRequestControl` with `compact hidePill variant="pill"`.
   - The cell will remain fixed-width because the dialog renders in a portal, not inside the row.

## Verification

- Open the Patient Portal, click an amber **Extension available** pill, and confirm a dialog appears centered with the day options and reason field.
- Confirm the table row width does not change when the dialog opens.
- Confirm the X button and the Cancel button both close the dialog.
- Confirm that submitting a request still updates the store and shows the pending extension pill.
