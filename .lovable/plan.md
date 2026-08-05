Plan: Make the embargo simulation clock demonstrably functional

## Problem
The Lab Tech Dashboard has an "Embargo clock" control (+3 days / reset) that advances the simulated system time so embargoed results can be demoed. Right now, users report that clicking it produces no visible change. The logic is wired, but the demo data does not contain a report that is close enough to its embargo lift for a single +3-day click to visibly flip its state.

## Goal
Make the embargo clock a clear, interactive demo feature: one click should visibly change at least one report's release status, and the UI should give immediate feedback about what changed.

## Changes

1. Add a demo report near the embargo boundary
   - Create a new seed report (or adjust an existing one) whose embargo lifts within a few hours of the simulated "now".
   - For example, a report published 6 days and 20 hours ago with a 7-day embargo: clicking +3 days will cause it to auto-release to the patient.

2. Surface the current simulated time
   - In the Lab Tech Dashboard, display the current simulated date/time next to the embargo clock controls so users understand the time machine they are operating.

3. Provide visible feedback on clock advancement
   - When the clock advances, show a transient summary/toast of how many reports changed state:
     - "Embargo lifted: 1 report now visible to patients"
     - "Auto-released: 1 report"
   - Keep the summary dismissible and non-blocking.

4. Ensure downstream views react consistently
   - Verify the lab queue "Results" chip updates (e.g., from "Embargoed until ..." to "Embargo lapsed · visible to patient" or "Auto-released to patient").
   - Verify the Doctor Portal "Results" tab reflects the same status change.
   - Verify the Patient Portal "View results" button becomes enabled for the affected requisition.

5. Add a helper label explaining the control
   - Small caption under the embargo clock: "Fast-forward demo time to see embargoed results become visible to patients."

## Out of scope
- No real-time server clock; this remains a frontend simulation.
- No changes to the actual FHIR payload generation logic beyond what the existing time shift already provides.
- No new pages or routes; changes stay within the Lab Tech Dashboard and shared data/state.
