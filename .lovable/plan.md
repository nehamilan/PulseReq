# "Resulted" becomes a "View results" link

## What changes

1. **Issued log (Doctor Portal)** — the greyed-out `Resulted` label in the actions column becomes a clickable **View results** link. Clicking it opens that requisition with the Results tab already selected, instead of landing on the Requisition tab and needing a second click. The existing meaning (a published report can't be revoked, only amended) is preserved as a tooltip.

2. **Requisition detail page** — the **View results** button at the bottom of the completed-visit card is removed, since the tab strip at the top already exposes Results and the log now deep-links there. The surrounding historical summary copy stays as-is.

## Technical notes

- `src/routes/r.$token.tsx` already validates a `tab` search param (`tab: "results"`), so the log link only needs `search={{ tab: "results", from: "doctor", fromTab: "log" }}`.
- `src/components/doctor-workspace.tsx`: replace the `<span>Resulted</span>` branch in the issued-log actions cell with a `<Link to="/r/$token">`.
- `src/components/booking-confirmation.tsx`: drop the `onViewResults` prop and its button; remove the prop pass-through in `src/routes/r.$token.tsx` (~line 319).