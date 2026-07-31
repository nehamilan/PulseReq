# Step 5 — Patient Booking Portal & Token Routing

Keeps the existing `/r/$token` route as the single patient URL. Adds centre selection, slot booking, and a confirmation screen.

## 1. Data model (`src/lib/domain.ts`, `src/lib/seed-data.ts`)

- Add `distanceKm: number` to `DiagnosticCenter`.
- Replace the two seed centres with three Calgary sites, keeping `ctr-*` ids:
  - `ctr-1` APL Chinook Centre — 1.2 km — Phlebotomy, Urinalysis, ECG — next slot today 14:30
  - `ctr-2` APL Foothills — 4.5 km — Phlebotomy, X-Ray, Ultrasound — next slot tomorrow 09:00
  - `ctr-3` DynaLIFE Sunridge — 6.1 km — Phlebotomy, Urinalysis — next slot today 16:15
- Helper `centerSupports(center, tests)` — a centre is bookable only if it covers every ordered modality (imaging orders need X-Ray/Ultrasound capability).
- Helper `slotsForCenter(center)` — generates 15-minute pills from the centre's next-available time (8 slots).

## 2. Patient view (`src/routes/r.$token.tsx`)

Booking state machine driven by requisition status:

- **`active` (awaiting booking)** — replaces the current "coming in the next build step" placeholder:
  - Requisition summary panel stays (patient, DOB, address, PHN, ordered tests with prep instructions, requesting clinician + clinic).
  - **Centre locator**: card list sorted by distance, each showing name, address, distance, capabilities, next available. Centres that can't perform the ordered tests render disabled with a "Cannot perform: Chest X-ray" note.
  - Selecting a centre expands **15-minute slot pills** below it.
  - **`Confirm & Link Requisition`** button, disabled until centre + slot are chosen.
- **`booked`** — confirmation screen (also what a returning patient sees).
- **expired / revoked / invalid** — unchanged.

## 3. Confirm behaviour

On confirm: `updateRequisition(id, { status: "booked", centerId, appointmentAt })`, plus a sonner toast. No page reload — the view re-renders into the confirmation screen.

## 4. Confirmation screen (`src/components/booking-confirmation.tsx`)

- Appointment header: centre name, address, date and 24h time.
- **Check-in code**: deterministic SVG block-matrix generated from the token, labelled "Mock check-in code — not a scannable barcode", with the token printed in monospace underneath.
- Prep reminders pulled from the ordered tests (e.g. "Fasting 12 hours required").
- **Get directions** — external link to Google Maps directions for the centre address.
- **Change appointment** — returns to `active` so the flow can be re-demoed.

## 5. Copy alignment

Patient-facing status labels read "Awaiting booking" / "Appointment booked"; the FHIR enum values stay `active` / `booked` underneath. The lab dashboard picks the booked centre and appointment time up automatically through the shared store.

## Technical notes

- No new dependencies; the check-in code is inline SVG.
- All state lives in the existing `RequisitionProvider` context — still frontend-only, synthetic data.
- Directions are an outbound Maps link, not an embedded map (no API key needed).
