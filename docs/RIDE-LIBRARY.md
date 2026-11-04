# Ride library

The library follows the supplied Ryval reference: a dark map cover, a rounded ride sheet, compact white raised route silhouettes, date/time and bike-or-title metadata, and a muted teal peak-speed column. The mobile dock keeps Rides, Route lab and Garage readable; the rider avatar opens all destinations, including Settings and private story drafts. The Odo companion sits beside the dock without covering the speed column.

![Mobile library with synthetic test routes](previews/ride-library-mobile-synthetic.png)

[Desktop preview](previews/ride-library-desktop-synthetic.png). All displayed rides are synthetic fixtures used only by the browser check; the product does not seed sample recordings.

## Route previews and data

`route-relief.js` projects each actual route with geographic proportions, a fixed perspective and translucent vertical sides. The white rim, extrusion and glow are presentation styling, not altitude or terrain measurements. Separate GPS segments stay disconnected. Dateline crossings retain their local shape. Subpixel simplification and cached geometry keep previews lightweight without a WebGL context per row.

Peak speed comes from the same accepted source samples used by the detailed telemetry panel. GPX interval speeds are labelled EST. PEAK and distance remains an approximate geometric estimate. Missing speed displays an em dash and NO SPEED. GPS measurement accuracy and manufacturer-only channels are never inferred from the thumbnail.

The cover shows a faint local route by default. Map background asks before loading actual OpenStreetMap tiles around the latest ride; the provider then sees the viewed area and connection. The map has attribution and a Hide map action. Tile failures preserve the offline route. Map instances are released on navigation and page hide.

## Growing journals

The library initially renders 20 journeys. **Show more** appends the next 20 without rebuilding existing route silhouettes or the consented map, announces progress and moves keyboard focus to the first newly available ride. The final partial batch is supported. Opening a ride and returning retains the current batch; reloading starts with 20 again.

Search matches saved titles, bike names and recurring route labels locally, ignoring case and surrounding whitespace. It combines with the activity filter and resets the visible batch when changed. Matching titles and route labels appear in the result rows. Active criteria remain visible when the search panel is collapsed, with a Clear all action. Text composition and selection are preserved, and a late import that changes the ordering safely refreshes the first batch.

[Mobile search](previews/library-search-mobile-synthetic.png) · [Desktop search](previews/library-search-desktop-synthetic.png) · [Batch footer](previews/library-batch-mobile-synthetic.png). These are synthetic browser fixtures, not product demo data.

This bounds initial preview rendering, **not journal storage or analysis memory**: startup still loads the saved analyzed records from IndexedDB, and local search scans those records. A 1,200-entry in-memory fixture with separate track arrays rendered its first 20 previews in approximately 22 ms in cloud Chromium. That measurement excludes database loading and is not a physical-phone benchmark.

## Verified

- 119 Node tests, including connected geometry, dateline crossings, empty/stationary routes, altitude-independent styling and a 150,000-point projection.
- Chromium library checks at 320, 390, 650, 680, 768 and 1440 px: source labels, missing speed, filters, rider-menu access, detail navigation, consent cancellation and map failure/disposal.
- `library-batches-smoke.cjs`: 47 stored journeys, complete/partial batches, unique SVG identifiers, retained DOM/map instances, focus and text composition, case-insensitive combined search, navigation/reload, late-import ordering and 1,200 in-memory records. Search and the footer were visually inspected at mobile and desktop sizes. Browsing makes no POST/model requests.
- Companion, telemetry and native overlay browser smoke checks pass; model responses are mocked in these checks.
- Android debug assembly and lint pass with the new assets packaged. Physical-device appearance and GPU performance still need an on-device check.
