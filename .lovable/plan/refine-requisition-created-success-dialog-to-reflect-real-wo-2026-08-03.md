Refine Requisition Created success dialog to reflect real-world patient delivery

Problem
The current `RequisitionCreatedDialog` frames the clinician as the person who must share the requisition link with the patient. In a real Canadian deployment, the link would be delivered automatically to the patient's registered channel (patient portal, email, SMS, or provincial health-network integration). The dialog should reflect that reality and only offer manual sharing as a fallback.

Changes
1. Update the dialog header copy in `src/components/requisition-created-dialog.tsx` so the success message explains that the patient will be notified automatically, with the token and lifetime shown as supporting metadata.
2. Keep the shareable link field but relabel its action button from "Copy Link" to "Copy link to share manually" to signal it is a fallback.
3. Rename the "Open patient view" link to "Preview patient view" and add a short line below it explaining that this is a clinician preview, not the patient delivery channel.
4. Add a one-line mock indicator such as "In production: link sent via patient portal / email" so the demo does not imply manual clinician delivery is the default workflow.
5. Preserve the existing "Inspect HL7 FHIR payload" tab and the full FHIR Bundle preview.

Out of scope
- No real email or SMS backend integration.
- No new routes or state changes.
- The left-side "New requisition" panel on the Doctor Portal remains untouched.

Files affected
- `src/components/requisition-created-dialog.tsx`
