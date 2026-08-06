# PulseReq

I would like to build prototype for following problem. Read it and just give your honest views on this potential solution ( no coding please). I'll give you detailed instructions to build it step-by-step.
The Business Problem

In North American ambulatory and outpatient care, the primary administrative friction point between primary care physicians and diagnostic facilities (labs, imaging centers) is the reliance on physical paper requisitions.

When a physician orders blood work, imaging, or specialized diagnostic tests, the order is generated inside an Electronic Medical Record (EMR) system (e.g., TELUS Med Access, QHR Accuro, Epic) and printed out for the patient. The patient is tasked with storing this document, locating a diagnostic provider, and presenting the paper form at the time of service.

This creates three critical operational breakdowns:

Patient Care Delays & Unfunded Administrative Re-work: Patients frequently misplace paper requisitions. Retrieving a lost form requires contacting the originating clinic, creating unbilled administrative overhead for clinic staff or requiring unnecessary re-assessment appointments.

Frontline Operational Bottlenecks: Diagnostic lab technicians spend between 5 and 7 minutes per patient manually re-keying printed requisition data into Laboratory Information Systems (LIS) to produce specimen tube labels or scan orders. Across hundreds of daily appointments per site, this creates massive throughput bottlenecks and inflates patient wait times.

Clinical Data Risk: Manual transcription from paper to LIS introduces human entry errors, misinterpreting physician orders or selecting incorrect test panels, which directly threatens patient safety.

2. The Industry Logic

To solve this gap, a developer learns how to bridge closed primary care systems and external diagnostic providers without attempting to rebuild complex legacy EMRs.

Domain-Specific Knowledge & Regulations:

Healthcare Interoperability (HL7 FHIR): Understanding the global standard for health data exchange. Rather than passing unstructured PDFs or proprietary raw database entries, clinical requests are represented as standardized FHIR ServiceRequest resources.

Health Information Privacy Compliance: Navigating provincial/national health privacy regulations (e.g., PIPEDA, Alberta Health Information Act) by using tokenized, short-lived URLs and zero-trust data access patterns rather than storing unencrypted Patient Health Information (PHI) in an unsecured database.

SMART on FHIR Integration Pattern: Learning how third-party app modules securely launch inside existing health authority portals (e.g., MyChart/Connect Care) using OAuth 2.0 authentication.

Architectural Pattern:

Event-Driven API Gateway / Data Transformer: The system acts as a middleware pipeline. It ingests an outbound webhook or payload from an EMR, converts the internal clinical data into an HL7 FHIR ServiceRequest resource, stores a tokenized reference, generates a secure dynamic link for the patient, and exposes an API endpoint for the destination lab system to consume and pre-fill the order automatically.

3. The Data Source

For building a prototype via AI-assisted development ("vibe coding"), no access to live production health networks is required. The prototype can be powered using standardized, synthetic healthcare data:

Synthea Synthetic Patient Generator: A free, open-source synthetic patient generator that outputs realistic, non-proprietary patient medical records and clinical requisitions formatted natively in HL7 FHIR JSON structures.

Standard LOINC Codes (Logical Observation Identifiers Names and Codes): A free, publicly accessible international database for identifying medical laboratory observations. Standard LOINC codes (e.g., 2339-0 for Fasting Blood Glucose, 5769-8 for Lipid Panel) populate test selection dropdowns in the prototype.

Mock JSON Database / Local SQLite: A lightweight schema mapping Patients, Doctors, Diagnostic Centers, and Requisition Tokens to simulate the data handoff between the Doctor, Patient, and Lab Technician views.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/268daee6-3e09-415e-bf9b-2c5c67a533b0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
