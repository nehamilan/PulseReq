---
title: Product Brief — PulseReq
Positioning: PulseReq demonstrates the deterministic-workflow-logic pole of a single decisioning pattern
---


## 1. Problem Statement

A diagnostic order today moves between three parties — the ordering clinician, the patient, and the diagnostic centre — who use three different systems and are bridged by a printed requisition. The paper causes three failures: patients lose it and clinics absorb unbilled re-contact work; lab staff re-key 5–7 minutes of structured data per patient because nothing arrives structured; and manual transcription introduces order-selection errors that reach patient care.

PulseReq replaces the paper with a tokenized, expiring link. The clinician issues a LOINC-coded order; the patient books where and when and receives the link; the diagnostic centre receives a structured order it can confirm at intake instead of re-keying from scratch. Specimen accessioning and patient ID confirmation still happen, as they should — PulseReq removes the transcription step, not the safety check. Primary user: diagnostic centre intake staff, who carry the re-keying burden today. Secondary users: the ordering clinician and the patient, each with a distinct portal and a distinct set of allowed actions.

Alberta Precision Laboratories — the province's sole public lab provider since 2023 — already suppresses paper printing for orders placed through Connect Care, since the lab can see the order electronically before the patient arrives. That's a real precedent, reached through province-wide consolidation to one lab vendor and one clinical record system. Most of the country doesn't have that path available: Ontario alone routes orders across multiple competing labs (LifeLabs, Dynacare, Alpha), and no clinician EMR can know in advance which one a patient will pick, so orders default back to paper. PulseReq targets that harder, more common case — a patient-driven choice of destination, resolved after the order is issued rather than requiring the clinician to route it upfront.

**Goals (v1):** eliminate lab re-keying at intake; make a requisition unlosable (recoverable by token or from a patient-facing list); model who is allowed to see a sensitive result and when.
**Non-goals (v1):** EMR ingest (orders are entered by hand in this prototype, not received via webhook); LIS egress (PulseReq hands off to the lab; it never results a test); authentication (role is determined by URL, not login); an auditor or compliance-officer view of the audit ledger.

## 2. Defining the system's job precisely (no ML — deterministic decision logic)

PulseReq makes no predictions and runs no inference. Every decision is a rule evaluated against known fields, chosen because each one is clinically or legally consequential and must be reproducible in an audit — exactly the condition under which this portfolio's own decision rule says rules beat a model. The controlled decision set:

- **Result visibility to patient:** IMMEDIATE / CLINICIAN_HOLD / EMBARGO_DELAY(7d) per LOINC code; when an order mixes tests with different policies, the most restrictive policy governs the whole result.
- **Extension eligibility:** only within 48 hours of expiry, or after expiry — never earlier.
- **Revocation eligibility:** only before a report exists, and only while the order is active, booked, or checked-in.
- **Centre eligibility:** a centre is only offered for an order if it has the required modality capability.
- **Walk-in eligibility:** gated per centre by a policy flag, never assumed globally.

What it must never do: release a held or embargoed result without an explicit clinician action or an elapsed embargo window; offer a centre that cannot perform the ordered modality; permit an extension request outside its eligibility window.

## 3. Evaluation and success metrics

There's no accuracy, precision, or recall to report — the equivalent obligation is that the rules are correct by construction and testable: most-restrictive-policy resolution across a mixed order, the extension-eligibility window, and centre-capability matching are each unit-testable conditions with one defined right answer, not a learned approximation. The one quantitative claim on the surface — 5.2 minutes saved per patient — is explicitly labeled in the UI as "a model, not a measurement": 26 structured fields × 12 seconds/field, both constants estimated rather than sourced from a time-motion study, and scoped to order-detail transcription specifically — the estimate does not include specimen accessioning or patient ID confirmation, which remain as intake steps regardless of order format. 

**Target:** keeping this framed as a directionally credible, honestly caveated estimate — not a validated outcome. A real deployment would need an actual time-motion baseline before defending this number past a demo.

## 4. Handling uncertainty — confidence and escalation

There's no confidence score to threshold, because there's no model output — but the same escalation instinct applies at rule boundaries. Any result whose policy resolves to CLINICIAN_HOLD or EMBARGO_DELAY routes to a human decision (the Needs Attention queue) rather than auto-releasing; a mixed order takes the most restrictive of its component policies rather than averaging; walk-in intake is refused outright, not guessed at, when a centre's policy doesn't clearly allow it. The system's version of "escalate when unsure": when a rule doesn't clearly authorize an action, default to hold and require a human decision.

## 5. Human-in-the-loop design

- Three review points, each a real approval gate, not a notification: the ordering clinician approves or declines extension requests and signs off on held/embargoed results before a patient can see them; the clinician can revoke an order outright while it's still actionable; lab intake staff confirm a walk-in or scheduled check-in and complete intake rather than it happening automatically from a token resolve. Every one of these is a decision a human makes, not a step the system completes unattended.

## 6. Guardrails and risk

Stated plainly rather than glossed over — the point of this section is showing the risk was seen, not hidden.

- **No authentication.** Role is determined by which URL is opened; the patient link renders full synthetic patient detail to anyone holding the token, with no server-side expiry enforcement, no rate limiting, no session. "Zero-trust, tokenized access" is aspirational at this stage — the prototype has the token, not the trust model. This is the largest gap between narrative and artifact and is disclosed here on that basis.
- **Audit ledger is illustrative, not cryptographic.** Chain-hashed entries use a non-cryptographic hash, labeled in-code as simulated. It demonstrates the concept of tamper-evidence, not the property.
- **All data is synthetic**, and edge cases were hand-placed (results seeded near embargo boundaries, values drawn from a widened sample window so abnormal flags actually appear) — disclosed in-app, not a representative clinical sample.
- **The embargo/release-hold exists to prevent a specific real harm:** a patient seeing an abnormal result with no clinical context before their clinician can discuss it.

## 7. Iteration from evidence

**Initial build:** the Results review inbox grouped items by whether the clinician had clicked "release." 

**Error found:** this produced a wrong system state — a result whose embargo window had already lapsed was visible to the patient regardless of clinician action, but the inbox still showed it as unresolved, contradicting what the patient could already see. The inbox was organized around an internal action (has staff clicked a button) rather than the outcome that actually matters (can the patient see this right now). 

**Change made:** regrouped the inbox around patient-facing visibility — "Awaiting decision" vs. "Released to patient" — so the queue reflects reality instead of internal process state. 

**Result:** the strongest product-thinking artifact in the build — a modeling error, not a code error, caught by asking what the other portal's user actually sees, fixed by changing the grouping key rather than patching the symptom.

## 8. Tradeoff articulation

Depth over breadth, deliberately: extension governance, release policy, and walk-in intake are modeled at high fidelity; billing, insurance/coverage validation, result trending over time, multi-clinic routing, and identity verification at the counter are absent entirely — the differentiated PM work is in the governance and state model around who sees what and when, not breadth of feature coverage. Zero backend and zero persistence (state resets on refresh) buys instant demoability and removes real PHI liability, at the cost of any claim about durability, concurrency, or a real multi-device flow. Walk-in intake reuses the existing active→checked-in status plus a flag rather than adding a new lifecycle state — keeps the status enum small at the cost of walk-ins being invisible to status-based queries, a trade worth revisiting if walk-in volume ever needed its own reporting. The clinician's read-only preview of the patient view is a query parameter on the same route rather than a separate authorization path — cheap to build, not a real permission boundary, which would matter if this left prototype status.

_____________________________________________

**Domain-agnostic pattern:** a time-bound, policy-gated disclosure workflow — a sensitive artifact becomes visible to its subject only when a rule-defined release condition is met, a human can override in either direction, and every state change is logged.

**Fintech analog:** an ACH fraud hold that auto-releases a flagged transaction after a review window lapses unless an analyst intervenes — the customer sees the transaction only once released, structurally the same as PulseReq's embargo-then-auto-release logic.

**Security analog:** coordinated vulnerability disclosure — a reported issue is embargoed from public disclosure until a fix ships or a fixed clock (commonly 90 days) lapses, with the affected vendor able to request an extension — the same embargo / extension-request / release shape as PulseReq.
