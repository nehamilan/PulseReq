# Align link lifetime options with 7 / 14 / 21 / 28

## What changes
The "Link lifetime" selector on the new requisition form currently offers 3, 14, 21 days. It should offer 7, 14, 21 and 28 days, with 14 pre-selected — matching the doctor "Extend" and patient "Request more time" controls.

## Technical details
- `src/lib/domain.ts`: change the `linkLifetimeDays` union from `3 | 7 | 14 | 21` to `7 | 14 | 21 | 28`.
- `src/components/order-form.tsx`: update the `LINK_LIFETIME_DAYS` option list to 7/14/21/28 and the local state type; default stays 14.
- `src/lib/seed-data.ts`: two seeded requisitions use `linkLifetimeDays: 3`; migrate those to 7 so the seed data satisfies the new union.
- No behavioural change to expiry math, extension flow, or the expired-link copy.

## Verification
Typecheck, then confirm in the preview that the order form shows 7 / 14 / 21 / 28 with 14 selected.
