# Journal landing and overview

Returning riders now open directly to the Rides sheet, with the raised route previews from the supplied visual reference. An empty journal opens a compact welcome screen with recording/import actions and the Meta companion. The Odo home link follows the same rule. Initialization waits for the UI scripts to finish loading before reading the journal and announcing native readiness.

Overview remains available in the desktop navigation and mobile rider menu. It brings together the latest journey, its raised route preview, a direct Odo debrief, customizable statistics, the bike profile and recent rides. Replay opens in the ride detail page; Overview no longer starts a second WebGL replay scene or duplicates the complete technical dashboard. The motorcycle on the welcome screen is a bundled illustration, not a photograph or identification of the rider’s bike.

The latest-ride buttons explicitly target the displayed ride for replay, story export and debrief. The floating Odo button also uses the latest ride when opened from Overview. Model requests still require Send after evidence review; the overview only checks connection status.

Statistics retain their source limits:

- GPS distance totals include supported phone motorcycle recordings. Imported GPX mapped distance remains labelled as an estimate on its ride card.
- Recorded time/counts exclude walks and unclassified trips. Duration includes stops.
- Accepted GPS-fix percentage is distinct from connected GPS time coverage.
- The latest phone-peak widget follows the chronologically latest journey, not an earlier selected ride. GPX without phone motion stays unknown.
- The manually entered odometer preserves zero. GPS totals never increment it.

Stat selection and ordering remain customizable. The layout handles long names and titles from 320 to 1440 pixels. Home, profile-menu and track-expand icons use SVG paths to avoid missing font glyphs.

## Verification

`node scripts/overview-smoke.cjs` exercises empty and returning journals, no automatic model POSTs or replay canvas, source-aware totals, manual zero/blank readings, latest-ride actions, stat selection/reordering, long text, the home link and the native recording-setup readiness contract. Native readiness is mocked; physical-device behavior remains unverified.

Existing library, 3D track, companion/overlay, recording setup, garage, native import and distance-confidence browser checks pass after the landing change. All 119 Node tests pass; Android assembly and lint pass. This pass changes no Java code and makes no live model requests.

Reviewed synthetic previews:

- [Welcome on mobile](previews/overview-empty-mobile.png)
- [Welcome on desktop](previews/overview-empty-desktop.png)
- [Overview on mobile](previews/overview-mobile-synthetic.png)
- [Overview on desktop](previews/overview-desktop-synthetic.png)
