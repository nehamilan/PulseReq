# Step 2 — Doctor Portal order composer

## Scope
Turn `/order`'s placeholder "Order form" panel into a working requisition composer that writes into the existing in-memory store, then surfaces the result in a confirmation overlay.

## Catalogue corrections
Expand `LOINC_CATALOG` in `src/lib/seed-data.ts` into a categorized structure with corrected codes:

```text
Blood panels
  2339-0    Glucose [Mass/volume] in Blood        fasting 12h, Serum
  24331-1   Lipid 1996 panel                      fasting 12h, Serum
  58410-2   CBC panel with differential           Whole blood (EDTA)
  4548-4    Hemoglobin A1c                        Whole blood
  3016-3    Thyrotropin (TSH)                     Serum
Imaging
  36643-5   Chest X-ray                           no prep
  24916-9   Ultrasound abdomen                    NPO 6h before scan
```

Each entry carries `category`, `code`, `display`, optional `instruction`, `specimen`, and a `modality` of `lab | imaging` so downstream screens can route correctly.

## Form
Right-hand panel in `src/routes/order.tsx` becomes `<OrderForm>` (new file `src/components/order-form.tsx`):

- **Patient** — select over store `patients` (Jane Doe · AB-982341, Marc Tremblay · AB-114907), showing PHN inline.
- **Ordering clinician** — fixed to Dr. Sarah Jenkins with licence shown (single practitioner in seed).
- **Tests** — checkbox list grouped by category heading; each row shows the LOINC code in mono and any prep instruction as a muted sub-line.
- **Urgency** — two-state segmented control mapping to the existing `priority` union: Normal → `routine`, STAT → `stat`.
- **Clinical notes** — optional textarea, maps to `clinicalNotes`.
- **Submit** — `Generate Tokenized Requisition`, disabled until a patient and ≥1 test are selected.

## Token + persistence
New `src/lib/tokens.ts`: `newToken()` returns `req-` plus 6 hex chars, retried against existing tokens for uniqueness. On submit, build a `Requisition` with `status: "active"`, `issuedAt: now`, `expiresAt: now + 72h`, selected tests mapped to `OrderedTest`, and push it through `addRequisition`. It appears immediately at the top of the issued list.

## Confirmation overlay
New `src/components/requisition-created-dialog.tsx`, a shadcn `Dialog` with two tabs:

- **Patient copy** — displays `https://pulsereq.ca/requisition/<token>` with a Copy Link button (sonner toast on success), plus a working in-app "Open patient view" link to `/r/$token`. A one-line note states the display domain is illustrative and the demo link is local.
- **Inspect HL7 FHIR payload** — `toFhirBundle({ requisition, patient, practitioner })` rendered as pretty-printed JSON in a scrollable mono block, with Copy JSON. Caption: `FHIR R4 · Bundle (collection) · ServiceRequest.status=active · intent=order · system=http://loinc.org`.

## Technical notes
- Frontend-only; no Cloud, no server functions. State lives in the existing `RequisitionProvider`, so a page refresh resets to seed — that's expected for the mock.
- Imaging orders set `modality: "imaging"` on their tests so Step 3 can filter centres by capability; no centre selection happens in this step (the patient chooses).
- Reuse existing `Panel`/`Field`/`StatusBadge` primitives and semantic tokens only — no hardcoded colours.
- Add shadcn `dialog`, `tabs`, `select`, `checkbox`, `textarea`, `label` if not already present, and mount sonner's `<Toaster />` once in `__root.tsx`.
