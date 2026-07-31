Update the Patient Portal dropdown in `src/components/app-header.tsx` to add an explanatory label inside the dropdown menu, so users understand this is a prototype convenience rather than a real-world patient authentication pattern.

Changes:
- Add a `DropdownMenuLabel` with the text **"Select a demo patient"**.
- Add a short helper line below it with the text **"In a real deployment, patients log in and only see their own records."** styled in muted/secondary text.
- Keep the existing patient list and navigation behavior unchanged.

No other files need to change.