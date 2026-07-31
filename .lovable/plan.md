## Why this is worth building

An expiring link creates a real dead-end: the patient sees "expired" and the only recovery today is phoning the clinic. A request-extension button turns that into a tracked, in-app loop. Key design principle: the patient **requests**, the clinician **grants** — never self-serve, because link lifetime is a clinical/consent decision and self-extension would make the expiry meaningless.

## Behaviour

**Patient side (`/p/$patientId` and `/r/$token`)**
- Show a "Request more time" button when a requisition is `active` and either already expired or expiring within 48 hours. Hidden for `booked`, `completed`, `revoked`.
- Clicking opens a small form: extra days (3 / 7 / 14) and an optional one-line reason ("away for work", "missed the window").
- After submitting, the card shows a pending pill: "Extension requested · +7 days · awaiting clinician". Button disabled while pending.
- Expired requisitions keep their existing "link expired" screen, but gain the request button so the page is no longer a dead end.

**Doctor side (`/order`)**
- New "Extension requests" panel above the issued list, showing only pending requests: patient name, current expiry, days requested, reason, and how long the request has been waiting. Panel hidden when empty; header count badge when not.
- Two actions per request: **Approve** (pushes `expiresAt` forward by the requested days from the current expiry, or from now if already expired, and returns status to `active`) and **Decline** (with the request marked declined).
- Approved/declined outcome reflects back on the patient card as "Extended to Aug 12, 2026" or "Extension declined — contact the clinic".
- Each issued requisition card gets a small "extended once/twice" note so the history is visible.

## Technical notes

- `src/lib/domain.ts`: add an `ExtensionRequest` type (`id`, `requisitionId`, `requestedDays`, `reason?`, `status: pending|approved|declined`, `requestedAt`, `resolvedAt?`) and helper `extendExpiry(req, days, now)` that computes the new `expiresAt` from `max(now, expiresAt)`. Add `extensionCount` to `Requisition`. This maps cleanly onto FHIR: an extension is an amendment to `ServiceRequest.occurrencePeriod.end`, so the FHIR mapper in `src/lib/fhir.ts` picks it up with no shape change.
- `src/lib/requisition-store.tsx`: hold `extensionRequests` in the same context state; add `requestExtension`, `approveExtension`, `declineExtension`, and a `pendingExtensionFor(requisitionId)` lookup. Still frontend-only, in-memory.
- New components: `src/components/extension-request-dialog.tsx` (patient form) and `src/components/extension-requests-panel.tsx` (doctor queue). Wire into `src/routes/p.$patientId.tsx`, `src/routes/r.$token.tsx`, and `src/routes/order.tsx`.
- Sonner toasts on request submit and on approve/decline. Seed one pending request so the doctor panel is populated on first load.
