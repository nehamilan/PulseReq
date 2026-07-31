# Patient Portal List View

## Current state

- Each requisition is its own patient-facing link at `/r/$token`.
- A patient with multiple requisitions currently receives multiple separate links.
- The index page links straight to one sample token.

## What this plan adds

A patient portal route at `/p/$patientId` that lists every requisition for that patient in one place, while leaving `/r/$token` as the single-requisition view.

## Changes

### 1. New route: `/p/$patientId`

File: `src/routes/p.$patientId.tsx`

- Looks up the patient by `patientId` from the shared store.
- Lists all requisitions where `patientId` matches.
- Sorts by `issuedAt` descending (newest first).
- Each row shows:
  - Ordered test names (truncated if many)
  - `StatusBadge` (effective status)
  - `PriorityBadge`
  - `issuedAt` date
  - `expiryLabel` (e.g., "expires in 7 days")
  - Link to `/r/$token` labelled "Open requisition"
- Empty state: "No requisitions found for this patient."
- Invalid patient ID: friendly error message.

### 2. Store support

File: `src/lib/requisition-store.tsx` (if needed)

- Add a `findByPatientId(patientId)` helper that returns all matching requisitions.

### 3. Navigation entry points

File: `src/routes/index.tsx`

- Add a fourth card to the role grid: "Patient Portal".
- Link it to `/p/$patientId` with the seed patient's ID as sample params.
- Keep the existing "Patient View" sample link card as-is.

File: `src/components/app-header.tsx` (if appropriate)

- Consider adding a "Patient Portal" link in the header role tabs, or keep it as a demo-only route reachable from the home page.

### 4. Route metadata

File: `src/routes/p.$patientId.tsx`

- Add `head()` with a patient-specific title and description.

## Technical notes

- No new dependencies.
- Uses the existing `RequisitionProvider` context and `PageShell` / `Panel` / `StatusBadge` / `PriorityBadge` components.
- No authentication: the patient portal is accessed by a patient ID in the URL, consistent with the frontend-only mock.
- `/r/$token` remains the single-requisition view and is not replaced.