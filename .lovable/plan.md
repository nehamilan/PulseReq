# Lab Technician Dashboard — review + build plan

Your prompt is solid. Seven changes I'd make before building.

## What I'd change in your prompt

1. **Scope the queue to one centre and to "today".** Today `/lab` lists every requisition in the system, including unscheduled ones. A real tech sees only APL Chinook's booked appointments. Add a centre selector (defaults to APL Chinook) plus tabs: Today / Upcoming / All. Seed slot times need to land on today's date so the dashboard isn't empty.

2. **Don't hardcode the impact metrics.** "0 mins re-keying / 5–7 mins saved" reads as marketing if it's static text. Compute it: fields auto-populated from FHIR (identity, PHN, DOB, address, ordering physician, LOINC codes) × a stated per-field keying estimate, × patients in today's queue. Show the assumption inline ("est. 12s/field, 26 fields") so it's an honest model, not a claim.

3. **'Completed' needs a real status, not just a badge.** Current enum is FHIR `ServiceRequest.status`. I'd add `checked-in` (arrived, specimen pending) and `completed`, mapping to FHIR `in-progress` and `completed`. That keeps the interoperability story consistent and gives the doctor/patient views a truthful end state.

4. **Keep the token lookup — it's the strongest demo moment.** Rather than replacing it, wire it to the drawer: entering `req-8f92a1` opens the same intake drawer that a row click opens. That's the "patient walks in with a link" story.

5. **Make the audit ledger event-driven, not a single static line.** Render actual lifecycle events from the store — issued by Dr., link opened, appointment booked, intake read at check-in, labels printed, check-in completed — each with timestamp, actor and a mock hash chain (`prev → sha256…`) to convey immutability. Keep your HIA line as the disclosure row, worded as *simulated*: PHI accessed under Alberta HIA s.35(1) (simulated audit entry — no real PHI).

6. **Specimen labels should be per-tube, not generic.** Map each LOINC test to a tube type/colour (e.g. lipid panel → gold SST, CBC → lavender EDTA, HbA1c → lavender). Group tests by tube so a 3-test order prints 2 labels, and de-duplicate. Each label: patient, DOB, PHN, accession, collection date, LOINC list, barcode. Print via a print-only stylesheet.

7. **STAT ordering.** You saved STAT queue sorting as a future item — I'll leave sort order as appointment time, but keep STAT rows visually flagged, since the badge already exists.

## Build steps

**Domain / data**
- `src/lib/domain.ts`: add `checked-in` + `completed` to `RequisitionStatus`, labels, FHIR mapping; add `TUBE_BY_LOINC` map and `labelsForTests()` grouping; add `savingsForQueue()` metric helper.
- `src/lib/seed-data.ts`: shift booked slots to today across morning/afternoon, add 2–3 more booked appointments at APL Chinook (one STAT, one imaging), one already `completed`.
- `src/lib/requisition-store.tsx`: `auditEvents` state seeded from requisition lifecycle, `logAudit()`, `completeCheckIn(id)` that sets status and appends events.

**Components**
- `src/components/lab-impact-banner.tsx` — three computed metric tiles + "how this is calculated" footnote.
- `src/components/intake-drawer.tsx` — slide-over: identity block, ordering clinician, LOINC test table with prep notes, tube-label previews, Audit & Privacy Ledger, primary action **Complete check-in & print labels** (toast + status flip), secondary **Print labels only**.
- `src/components/specimen-label.tsx` — printable label card with barcode (reuse the deterministic SVG barcode from booking confirmation).
- `src/components/audit-ledger.tsx` — monospace event list with hash chain.

**Route**
- `src/routes/lab.tsx`: centre selector + Today/Upcoming/All tabs + search box (name, PHN, token) driving one filtered table (Time, Priority, Patient, PHN, DOB, Tests, Status); clickable rows and token lookup both open the drawer.

## Technical notes
- Frontend-only; drawer state is local, status changes go through the existing context store so Doctor and Patient views stay in sync.
- Drawer uses the existing shadcn `sheet`/`dialog` primitive; ESC/overlay close, focus trap, `aria-label` on rows.
- Print uses a `@media print` block in `src/styles.css` that hides app chrome and shows only `.print-labels`.
- I'll add a line to `/about` noting the audit ledger and HIA citation are simulated for demo purposes.
