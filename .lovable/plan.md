# PulseReq — Step 1: Foundation Only

Scope is limited to the foundational layout, mock data, and role shells. No booking flow, no QR generation, no lab check-in logic yet.

## What gets built

### 1. Design system (clinical, not generic)
- Slate Blue primary, Emerald success, Amber for expiring, muted slate borders on near-white canvas.
- All colors as semantic tokens in `src/styles.css` (no hardcoded Tailwind color utilities).
- Typography: a clear grotesque for UI, tabular numerals for PHN/token/date fields.
- Dense, form-like spacing — this should read like clinical software, not a SaaS landing page.

### 2. Domain types + seed data
- `Patient`, `Practitioner`, `DiagnosticCenter`, `Requisition`, `OrderedTest` (LOINC code + display), `RequisitionStatus`.
- Status vocabulary uses FHIR-aligned terms: `active`, `booked`, `completed`, `revoked`, `expired` — with human labels for the UI.
- One seed requisition: Jane Doe (PHN AB-982341), Dr. Sarah Jenkins (CPSA #45219), token `req-8f92a1`, status `active`, tests: LOINC 58410-2 (CBC w/ differential) and 2339-0 (Glucose, fasting), issued now, expires +72h.
- Two seed diagnostic centers so the later booking step has something to bind to.

### 3. FHIR R4 shape from the start
- A small mapper turning a `Requisition` into a FHIR R4 `ServiceRequest` inside a `Bundle`.
- Not user-visible yet, but it forces the data model to be interoperable rather than retrofitted later.

### 4. Root layout
- Persistent header: PulseReq wordmark, role navigation, and a status pill reading **"Frontend-only mock · Synthetic data · FHIR R4 · no real PHI"** (more credible than "SMART on FHIR Ready", which implies a live connection).
- Role navigation uses real routes, not local tab state, so each view is deep-linkable and shareable — which is the whole point of a tokenized requisition.

### 5. Routes (shells only)
- `/` — landing that explains the problem and links into the three roles.
- `/order` — Doctor Portal shell: shows the seeded requisition in a list, empty-state for the order form.
- `/r/$token` — Patient view shell: resolves the token, shows requisition summary or a "link invalid/expired" state.
- `/lab` — Lab Tech shell: token lookup field plus a queue table of requisitions.

Each route gets its own `head()` metadata (title, description, og tags).

## Key changes from your original command
- Middle tab renamed to **Patient View** on a tokenized route `/r/$token` — the patient receives a link, they don't "book" in the abstract.
- Routes instead of tab state, so the token link is genuinely shareable.
- Status pill wording changed to avoid implying real FHIR connectivity.
- Status values are FHIR-aligned enums rather than free-text strings like "Pending Booking".
- Data lives in a typed seed module + shared store rather than an ad-hoc array, so later steps don't require rewriting it.

## Technical notes
- Client-side state only for now (a small React context over the seed data). No backend, no Lovable Cloud in this step.
- Token resolution is a lookup against the seed array; invalid and expired tokens both render explicit states.
- LOINC codes are stored as `{ system: "http://loinc.org", code, display }` so the FHIR mapper is a direct pass-through.
