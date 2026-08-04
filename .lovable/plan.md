# Update Extension Day Options to +7 / +14 / +21 / +28 Days

## Goal
Change both the doctor's "Extend" action and the patient's "Request more time" control to offer +7, +14, +21, and +28 day options, with 14 days as the default.

## Files to Modify

1. `src/lib/domain.ts`
   - Update `EXTENSION_DAY_OPTIONS` from `[3, 7, 14]` to `[7, 14, 21, 28]`.
   - Update the `ExtensionRequest.requestedDays` type from `3 | 7 | 14` to `7 | 14 | 21 | 28`.

2. `src/lib/requisition-store.tsx`
   - Update the `requestExtension` parameter type for `requestedDays` to match the new union.

3. `src/components/extension-request-dialog.tsx`
   - Update the `useState<3 | 7 | 14>` for `days` to `useState<7 | 14 | 21 | 28>` and set the default value to `14`.

4. `src/lib/seed-data.ts`
   - Change any existing seed extension requests with `requestedDays: 3` to `7` so the mock data remains type-safe.

## Verification
- Typecheck the project to confirm no `requestedDays` type mismatches remain.
- Open the Doctor Portal's "Issued log" and click "Extend" on an expired requisition to confirm the four pill options render correctly and 14 days is pre-selected.
- Open the Patient Portal and click "Request more time" on an expired requisition to confirm the same four pill options render correctly.
