# Hide Patient View from the header while keeping the route

## Why it appears now
`/r/$token` is a single-requisition deep link, not a top-level role. The header is currently treating it as a primary tab, which is confusing now that there is a Patient Portal (`/p/$patientId`) where the patient picks a requisition and clicks **Open requisition** to reach `/r/$token`. The header should be a role switcher, not a list of every reachable page.

## What this plan does
1. Remove the "Patient View" entry from the header role tabs in `src/components/app-header.tsx`.
2. Keep `src/routes/r.$token.tsx` fully functional — it is still the requisition detail/booking page, now reached through the Patient Portal or a direct link.
3. Keep the Patient Portal's "Open requisition" links unchanged.

## What is left alone
- The home page "Patient View" sample card remains as a demo entry point, so visitors can still see what a patient link looks like without going through the portal.
- No route files, store logic, or data model changes.

## Result
Header tabs become: **Doctor Portal | Patient Portal | Lab Tech Dashboard**. The patient still opens any requisition from the portal, and `/r/$token` continues to work as before.