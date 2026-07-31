Goal
Make the global header's "Patient Portal" tab open a patient selector instead of always linking to the sample patient `pat-1`. Selecting a patient navigates to `/p/$patientId` so the user can switch between synthetic patients from anywhere in the app.

Current state
- `src/components/app-header.tsx` renders three role tabs as TanStack `<Link>` elements in a segmented control.
- The Patient Portal tab is hardcoded to `/p/$patientId` with `params: { patientId: "pat-1" }`.
- Four synthetic patients exist in `src/lib/seed-data.ts`: `pat-1` Jane Doe, `pat-2` Marc Tremblay, `pat-3` Priya Nair, `pat-4` Owen Whitecalf.
- The project already has `src/components/ui/dropdown-menu.tsx` and `src/components/ui/select.tsx` from shadcn.
- Utility helpers `patientName(p)` and `formatDob(dob)` already exist in `src/lib/domain.ts`.

Proposed approach
Replace the Patient Portal tab with a DropdownMenu trigger styled to match the existing segmented tab. The dropdown lists every patient with enough identity context (name, PHN, DOB) so the selector is unambiguous. Selecting a patient calls `navigate({ to: "/p/$patientId", params: { patientId: patient.id } })`.

Why DropdownMenu instead of Select:
- A Select looks like a form field and would clash with the tab bar aesthetic.
- A DropdownMenu lets each row show richer patient context (name + PHN + DOB) and keeps the trigger looking identical to the Doctor Portal / Lab Tech Dashboard tabs.

Files to modify
1. `src/components/app-header.tsx`
   - Remove the Patient Portal entry from the static `ROLES` array.
   - Render the Doctor Portal and Lab Tech Dashboard tabs exactly as they are now.
   - Add a separate Patient Portal DropdownMenu block in the same `<nav>`.
   - Import `useNavigate` from `@tanstack/react-router` to handle selection.
   - Import `PATIENTS` from `@/lib/seed-data` to populate the list.
   - Import `patientName` and `formatDob` from `@/lib/domain` to format rows.
   - Import the DropdownMenu primitives from `@/components/ui/dropdown-menu`.
   - Detect the active route (`/p/$patientId`) using `useMatch({ from: "/p/$patientId" })` or `useRouterState`, and apply the same active/inactive visual classes as the other tabs.
   - Dropdown trigger: a button styled like the existing tab links (`rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors`).
   - Dropdown content: a compact clinical menu with one item per patient.
     - Primary label: `Jane Doe`
     - Secondary label: `PHN AB-982341 · Mar 14, 1987 (39y)`
   - On item click, navigate to the selected patient's portal.

UI/UX details
- Keep the tab bar width and alignment unchanged; the Patient Portal trigger should be the same height and padding as the other tabs.
- The active state should fire whenever the current route is `/p/$patientId`, regardless of which patient is selected, matching how TanStack Link's `activeProps` behaves for the other tabs.
- Add keyboard accessibility: `DropdownMenuTrigger` receives focus, arrow keys move through patients, Enter/Space selects.
- No changes to the patient portal route (`src/routes/p.$patientId.tsx`) are required; it already handles any `patientId`.
- No state changes are needed because the selector reads the static seed list and navigates via the router.

Out of scope
- Adding a "new patient" option (would require a form and data changes).
- Sorting/filtering patients (only four synthetic patients exist; a flat list is sufficient).
- Persisting the last-selected patient (pure navigation is enough for the prototype).

Verification
After implementation, clicking the Patient Portal tab in the header should open a dropdown, and choosing a patient should navigate to `/p/pat-2`, `/p/pat-3`, etc., with the header tab remaining active on those routes.