# Plan: Relocate embargo clock helper to a tooltip

## Goal
Clean up the Embargo clock control row by moving the helper caption off the button row and into an info-icon tooltip next to the section label.

## Current state
- `src/routes/lab.tsx` renders the Embargo clock section with a caption below the +3 days / reset buttons: "Fast-forward demo time to see embargoed results become visible to patients."
- The project already has `src/components/ui/tooltip.tsx` and Shadcn `TooltipProvider` is used elsewhere (e.g., doctor-workspace, extension-request-dialog).

## Changes

1. **Remove the caption below the buttons**
   - Delete the `<p>` helper text under the embargo clock button row.

2. **Add an info icon tooltip next to the label**
   - Import `Info` (or `CircleHelp`) from `lucide-react` and the Shadcn tooltip primitives in `src/routes/lab.tsx`.
   - Wrap a small icon next to the "Embargo clock" label with `TooltipTrigger` / `TooltipContent`.
   - Tooltip text: "Fast-forward demo time to see embargoed results become visible to patients."
   - Style the icon as muted, same size as the label, to match the clinical aesthetic.

3. **Provider check**
   - Verify the lab page is already inside a `TooltipProvider` (app-level in `src/routes/__root.tsx` or similar). If not, add a local `TooltipProvider` around the icon.

## Out of scope
- No changes to the embargo simulation logic or the +3 days / reset behavior.
- No changes to other routes or components.
