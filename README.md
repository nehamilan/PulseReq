# PulseReq

**Paper lab requisitions, replaced by a governed link.**

PulseReq is a working frontend prototype of an e-requisition layer for Canadian ambulatory care. A clinician issues a LOINC-coded diagnostic order as a secure, expiring link; the patient books and checks in with it; the diagnostic centre resolves the token into structured data instead of re-keying a printed form; results flow back under an explicit release policy.

Built as a product portfolio project: the interesting work here is the decision logic and the governance model, not the CRUD.

---

## 1. The problem

In North American outpatient care, the handoff between a primary care physician and a diagnostic facility is still a piece of paper. That creates three measurable failures:

| Failure | Where it lands |
| --- | --- |
| Patients lose the requisition | Unbilled clinic re-work, delayed care, sometimes a repeat appointment |
| Techs re-key printed orders into the LIS (~5–7 min/patient) | Throughput bottleneck and wait times at the collection site |
| Manual transcription errors | Wrong panel drawn — a patient-safety event |

The underlying insight: **a paper requisition is a data handoff pretending to be a document.** Digitizing the document (PDF, portal upload) doesn't fix anything. Digitizing the handoff does.

## 2. Who it's for

| User | Job to be done | Surface |
| --- | --- | --- |
| **Ordering clinician** | Issue a coded order, keep custody of it, decide what the patient sees and when | `/order` — Doctor Portal |
| **Patient** | Find the order, book somewhere convenient, get in the door, see results | `/p/:patientId`, `/r/:token` |
| **Lab technician** | Resolve an arriving patient to a structured order in seconds, label the specimen, log it | `/lab` — Lab Tech Dashboard |
| **Compliance / audit** | Reconstruct who accessed what | Audit ledger on the lab dashboard |

The clinician is the buyer-adjacent user; the lab tech is where the ROI is provable. That asymmetry drives most of the design.

## 3. What the system actually decides

This is not a form that stores text. Five pieces of logic carry the product:

**a. Result release governance.** Every ordered test carries a `releasePolicy`:

- `IMMEDIATE` — routine outpatient chemistry, auto-released to the patient on publication.
- `CLINICIAN_HOLD` — sensitive or life-altering findings, withheld until the ordering clinician signs off.
- `EMBARGO_DELAY` — auto-releases after N days unless the clinician releases sooner.

This mirrors real provincial and facility rules (open-results legislation with carve-outs) and is the product's core opinion: *patient access is the default, clinician judgment is the exception, and the exception must be explicit and time-bounded.*

**b. Link lifetime and extension.** A requisition link expires after a clinician-chosen window (7 / 14 / 21 / 28 days, default 14) and can be revoked. Patients can *request* an extension from their portal; clinicians grant it. Custody of the order never leaves the prescriber — the patient gets access, not ownership.

**c. Token resolution at intake.** The lab tech types or scans a token and receives a structured order: patient identity, LOINC-coded tests, specimen requirements, tube type, and a generated accession number. Walk-ins are supported only where the centre's `walkInsAccepted` policy allows it; appointment-only sites say so explicitly.

**d. LOINC → operational transformation.** Codes drive downstream artifacts automatically — specimen tube mapping, prep instructions, label rendering — so the coded order is doing real work rather than sitting in a field.

**e. Quantified impact model.** The lab dashboard surfaces minutes saved versus manual transcription, with the calculation exposed rather than hidden. The number is a modeled estimate, and the UI says so.

## 4. Product decisions worth defending

- **Three roles, one artifact.** The token is the only shared object. Every view is a different lens on the same requisition, which keeps state reasoning honest.
- **Pills are never clickable.** Status is informational; actions are links. 
- **Fixed-width tables over content-sized ones.** Column positions must not move between rows — clinical scanning depends on positional memory.
- **Role-aware copy.** The same requisition page speaks differently to a clinician than to a patient. A clinician viewing a patient link sees read-only clinical framing, not "your appointment."
- **Non-colour priority differentiators.** STAT and URGENT carry distinct icons and weight, not just hue.
- **A simulated clock.** The lab dashboard can fast-forward demo time so embargo release is observable in a two-minute demo instead of seven days.

## 5. Trade-offs and what's deliberately missing

Honest scope boundaries — these are choices, not oversights:

| Not built | Why | What it would take |
| --- | --- | --- |
| Persistence / backend | The bottleneck to validate is the workflow, not storage | Lovable Cloud (Postgres + RLS); the domain model already maps to relational tables |
| Real authentication | Role switching by tab is faster to demo | SMART on FHIR / OAuth 2.0 launch inside a health authority portal |
| Live EMR egress | The hardest commercial problem in this space, and unsolvable in a prototype | HL7 v2 / FHIR interface engine work per EMR vendor |
| LIS write-back | Same | Vendor-specific integration |
| Real PHI handling | All data is synthetic (Synthea-style, real LOINC codes) | Provincial privacy review (PIPEDA, Alberta HIA) |
| Time is simulated | Anchored to a fixed demo date for deterministic screenshots | Real clock plus scheduled jobs |

The single largest unmitigated risk in the real product is **EMR data egress** — clinics can't easily push orders out of closed systems. A commercial version would likely start lab-side (where the time savings are provable) and work backwards toward the EMR.

## 6. Interoperability posture

Data shapes map 1:1 onto FHIR R4 — `Patient`, `Practitioner`, `Organization`, `ServiceRequest`, `DiagnosticReport` — so nothing needs re-modelling to integrate. Any requisition can be inspected as a FHIR R4 collection Bundle from the UI (*Inspect HL7 FHIR payload*). Tests are coded with real LOINC identifiers throughout.

## 7. Try the flow

1. **`/order`** — issue a requisition. Pick a patient, choose tests by LOINC, set priority (Routine / Urgent / STAT) and link lifetime. Inspect the FHIR payload in the success dialog.
2. **`/r/:token`** — the patient's link. Pick a centre, book a slot, get a check-in code.
3. **`/lab`** — resolve the token at intake, print the specimen label, complete intake. Watch the impact metric move.
4. Fast-forward the embargo clock, then return to **`/order`** to sign off results and **`/p/:patientId`** to see what the patient now sees.

## 8. Stack

TanStack Start (React 19, Vite 7), TypeScript, Tailwind CSS v4, shadcn/ui. State lives in a React context store seeded with synthetic data — see `src/lib/domain.ts` for the model, `src/lib/results.ts` for release logic, and `src/lib/fhir.ts` for the FHIR projection.

```sh
npm i
npm run dev
```

Built with [Lovable](https://lovable.dev) · [open in the editor](https://lovable.dev/projects/268daee6-3e09-415e-bf9b-2c5c67a533b0)
