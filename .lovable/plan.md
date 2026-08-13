# Keep the "P" tile, make the favicon match

The top-left mark stays as-is: a rounded slate-blue tile with a bold white "P" next to the PulseReq wordmark. No header changes. The only gap is the browser tab icon, which is still the default Lovable favicon.

## What changes

- Create a square brand icon that mirrors the header tile exactly: slate-blue (primary) rounded square, bold white "P" centred, sized to stay legible at 16-32px.
- Serve it as the site favicon so the tab, bookmarks, and link previews show the PulseReq mark.
- Remove the leftover default icon so nothing stale is served.

## Technical notes

- Generate the mark, downscale to a 64x64 square, and save as `public/favicon.png`.
- Replace the `{ rel: "icon", href: "/favicon.ico" }` entry in `src/routes/__root.tsx` `head().links` with `{ rel: "icon", type: "image/png", href: "/favicon.png" }`.
- Delete `public/favicon.ico`.
- `src/components/app-header.tsx` is untouched.
