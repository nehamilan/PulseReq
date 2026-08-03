## Goal
Reorganize the Doctor Portal's right-hand column into a two-tab workspace: "Needs attention" (actionable work) and "Issued log" (a compact, filterable table). The left "New requisition" column is untouched.

## Tab strip
- Segmented control at the top of the right column, styled with the existing chip/badge tokens (border, surface, primary-tint active state) — no new visual language.
- Real tablist semantics: `role="tablist"` / `role="tab"` with `aria-selected`, arrow-key + Tab focus movement, visible focus ring. Local `useState`, instant switch.
- Badges: "Needs attention" = pending extension requests + reports not yet released; "Issued log" = total requisitions.

## Tab 1 — Needs attention
One scrollable-free stacked list containing two subheadings in the current order:

**Extension requests** — sorted by the requisition's `expiresAt`, soonest first. Compact row: patient name + token, one line ("+7 days · expires Aug 6 · waiting 3 days", plus reason if present), inline Approve / Decline buttons on the right.

**Results review inbox** — pending items first, sorted by soonest embargo lift (`embargoLiftsAt`, then published date). Compact row: patient name + test panel names, release-state and policy chips, inline "Sign off & release" and "Inspect FHIR DiagnosticReport" buttons. Observation values and narrative move into a collapsible "View observations" details block so rows stay short; abnormal counts stay visible on the summary line.

**Recently auto-released / released** items collapse into a de-emphasized sub-section at the bottom (reduced opacity, one line per report, no action buttons) instead of full cards.

All existing badge components (`ReleaseStateChip`, `PolicyChip`, `InterpretationBadge`, extension pills) are reused verbatim — same colors, same labels.

## Tab 2 — Issued log
- Compact table: Patient (name + PHN), Test (LOINC panel display names), Status, Issued date, and an "Open" link to `/r/$token`.
- Status column shows the existing `StatusBadge` plus a small `PriorityBadge` beside it for STAT/URGENT only.
- Filter chips above the table, single-select, "All" default: All, Awaiting booking, Appointment booked, Checked in, Intake complete, Link expired, Revoked by clinician — each with a live count, matched on `effectiveStatus(req)`.
- Search input ("Search patient or test") filtering as you type on patient name, PHN, token, and test display names; combines with the active chip.
- Empty state line when filters match nothing. No nested scroll containers — the panel grows with content.

## Technical notes
- New `src/components/doctor-workspace.tsx` owning the tab state and rendering the two tab panels; `src/routes/order.tsx` renders it in place of the three stacked panels.
- `extension-requests-panel.tsx` and `results-inbox.tsx` are refactored into the compact row components used inside Tab 1 (their `Panel` wrappers are dropped in favour of the subheadings); `FhirReportDialog` and all store actions (`approveExtension`, `declineExtension`, `releaseResults`, `logAudit`) are wired through unchanged.
- New "Issued log" table lives in the same component; existing card markup in `order.tsx` is removed.
- Presentation only — no changes to `src/lib/domain.ts`, `results.ts`, `seed-data.ts`, or the store.
