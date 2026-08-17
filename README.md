# PulseReq

**Paper diagnostic requisitions, replaced by a tokenized, expiring link.**

PulseReq is a working frontend prototype of an e-requisition layer for Canadian ambulatory care. A clinician issues a LOINC-coded diagnostic order as a secure, expiring link; the patient books and checks in with it; the diagnostic centre resolves the token into structured data instead of re-keying a printed form; results flow back under an explicit release policy.

Built as a product portfolio project: the interesting work here is the decision logic and the governance model, not the CRUD.

**Prototype:** https://paperless-patient-pass.lovable.app/

**Substack:** https://nehamilan756304.substack.com/p/pulsereq-when-rules-beat-ai

---

## What it is

A physician orders blood work or imaging, prints a requisition, and hands it to the patient — who then has to store it, find a diagnostic centre, and present the paper at the appointment. Lost forms cause unbilled clinic rework; lab staff spend 5–7 minutes per patient re-keying order details that already exist upstream, because nothing arrives structured — time that should go to confirming and collecting, not transcribing. Manual transcription also introduces order errors.

PulseReq removes the paper. The clinician issues a LOINC-coded order and an expiring link; the patient picks where and when and receives that link; the diagnostic centre resolves it at intake as a structured order, not a document to re-interpret.

Full problem framing, decision logic, metrics, and trade-offs: [Product_Brief.md](/docs/Product-Brief.md)

## Screenshots
| Portal             | Role                           | Prototype screenshots             |
| ------------------ | ------------------------------ |--------------|
| Clinician Portal   | Ordering clinician             |[Clinicians Portal](/docs/screenshots/Doctors_portal.md) |
| Lab Tech Dashboard | Diagnostic centre intake       |[Lab Tech Dashboard](/docs/screenshots/Lab_tech_dashboard.md) |
| Patient Portal     | Patient, all orders            |[Patient Portal](/docs/screenshots/Patient_portal.md)|
| Homepage           | PulseReq Homepage              |[Homepage](/docs/screenshots/PulseReq_Homepage.md)|

## How it works
Three actors, one handoff:
- **Clinician** orders by LOINC code, sets urgency (Routine / Urgent / STAT) and a link lifetime (7–28 days), and issues a tokenized link instead of a printout.
- **Patient** opens the link, picks a diagnostic centre that can actually perform the ordered modality, books a slot, and gets a check-in code. Results are visible only once a release policy allows it — immediate, after an embargo window lapses, or once the ordering clinician signs off.
- **Diagnostic centre** resolves the token (or, where a centre's walk-in policy allows it, enters a requisition manually), and receives a structured order — the clinical details are confirmed, not re-typed from scratch. (Specimen labeling and patient ID confirmation still happen at intake, as they should — PulseReq removes the transcription, not the safety check.)

Internally, orders project to FHIR R4 `ServiceRequest` / `DiagnosticReport` / `Observation` resources.

## What's real vs. simulated
This is a frontend-only prototype built to demonstrate product decisions, not a production system. Worth knowing before reading too much into it:
- **No backend, no persistence.** All state lives in memory; a refresh resets to seed data.
- **No authentication.** Role is determined by which URL is opened, not a login. A patient link renders full (synthetic) patient detail to anyone holding the token.
- **The audit ledger is illustrative, not cryptographic.** It demonstrates the concept of a tamper-evident log, not the property.
- **All data is synthetic**, including edge cases placed deliberately (e.g. a result seeded near its embargo boundary) so the policy logic is visible in a short demo.
- **Time is simulated.** A clock offset control exists specifically so embargo/expiry rules are observable without waiting real days.

## Documentation
- [`Product_Brief.md`](/docs/Product-Brief.md) — problem framing, decision logic, success metrics, human-in-the-loop design, guardrails, iteration log, and trade-offs, mapped explicitly to each.
- [`Product_Roadmap.md`](/docs/product-roadmap.md) — what's next, grouped by disclosed gaps being closed vs. new capability vs. explicitly not planned.

## Stack
Built in Lovable (React + TypeScript). Test catalog is LOINC-coded. Data shapes follow FHIR R4. 
All patient, clinician, and centre data is synthetic — no real PHI at any point.

```sh
npm i
npm run dev
```
Built with [Lovable](https://lovable.dev) · [open in the editor](https://lovable.dev/projects/268daee6-3e09-415e-bf9b-2c5c67a533b0)
