# Issued log: "Resulted" becomes a "View results" link

## Change

In the Doctor Portal → Issued log table, the "Resulted" text (shown in the actions
column where Revoke would otherwise be, once a report exists) becomes an
actionable "View results" link. Clicking it opens that requisition's clinician
read-only page with the **Results** tab already selected, instead of landing on
the Requisition tab.

Because the results are now one click away from the log, the "View results"
button at the bottom of the completed-appointment card on the requisition detail
page is removed. The Requisition / Results tab strip stays, so results remain
reachable from inside the page.

## Technical notes

- `src/components/doctor-workspace.tsx`: replace the `<span>Resulted</span>` with
  a `<Link to="/r/$token" params={{ token: req.token }} search={{ tab: "results",
  from: "doctor", fromTab: "log" }}>View results</Link>`, styled like the other
  primary row actions. Keep the tooltip note that a published report needs an
  amendment rather than a revocation.
- `src/routes/r.$token.tsx`: stop passing `onViewResults` to
  `BookingConfirmation`.
- `src/components/booking-confirmation.tsx`: drop the `onViewResults` prop and
  the button it renders.

No store, domain, or results-logic changes.
