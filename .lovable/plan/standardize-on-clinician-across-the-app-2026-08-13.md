# Standardize on "Clinician" across the app

Pick one term for the ordering provider and use it everywhere the user can see it. "Doctor Portal" becomes "Clinician Portal", and the homepage flow diagram stays "Clinician → Link → Lab".

## Visible copy changes

- Header nav label: "Doctor Portal" → "Clinician Portal"
- Homepage launcher card: title "Doctor Portal" → "Clinician Portal"
- Ordering page: heading "Doctor Portal" → "Clinician Portal"; page title and social preview text updated to "Clinician Portal — PulseReq"
- Requisition page (clinician preview of a patient link):
  - "← Back to Doctor Portal" → "← Back to Clinician Portal"
  - Expired/withdrawn copy "Extend or reissue it from the Doctor Portal." → "…from the Clinician Portal."
- README screenshot table label updated to "Clinician Portal"

Everything else — patient-facing copy, lab dashboard, statuses — is untouched.

## Not changed

- URLs stay `/order` and the `?from=doctor` query flag stays as-is; these are internal identifiers, not user-visible wording, and changing them would break existing links.
- Internal code names (`DoctorWorkspace`, file names) stay; renaming them adds churn without user-visible benefit.
- The eyebrow already reads "Role · Ordering clinician", which is consistent with the new label.

## Files touched

`src/components/app-header.tsx`, `src/routes/index.tsx`, `src/routes/order.tsx`, `src/routes/r.$token.tsx`, `README.md`.
