# Fix "Back to portal" origin after opening an Issued log entry

## Problem
Opening a requisition from the Doctor Portal's Issued log navigates to the shared patient link view. Its back button always returns to that patient's portal, so a clinician is dropped into the wrong role view.

## Change
Track where the requisition view was opened from and send the back button there.

- Add an optional `from` search param on the requisition route (`/r/$token?from=doctor`), validated alongside the existing `tab` param.
- The Issued log "Open →" link (and any other Doctor Portal link into a requisition) sets `from: "doctor"`.
- The back button becomes context-aware:
  - `from=doctor` → label "← Back to Doctor Portal", navigates to `/order`.
  - otherwise → unchanged "← Back to portal" to `/p/$patientId`.
- Preserve the param when switching between the Requisition and Results tabs so it survives in-page navigation.

## Notes
Presentation and navigation only — no data model, store, or business-logic changes.