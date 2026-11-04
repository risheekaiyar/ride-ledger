# Ride comparison

Route Lab opens a two-recording comparison, alongside the existing Ride review tab. Cream and teal cards preserve each route’s raised silhouette. The rider chooses the pair explicitly and can edit its context without losing that selection. One-recording and empty libraries have an import path.

The local setup checks require distinct normally stopped motorcycle phone recordings, known matching bike and phone-model labels, bike type, placement and recurring direction label. Rigid mounts must be marked Stable; Pocket/Bag must be Not mounted. A coarse route screen compares 33 equally spaced connected-distance positions in the recorded direction: median separation at most 50 m, 90th percentile at most 100 m, and endpoints within 100 m. Insufficient supported GPS returns unknown. This is not road matching or proof of the same conditions. A phone-model label cannot establish that both rides used the same physical device.

Each chart shows phone measurements over normalized elapsed time, with missing seconds left disconnected. Equal progress can represent different physical locations. The metrics equally weight complete one-second bins: acceleration and angular-speed medians, and linear-acceleration peaks after Android’s estimated gravity removal. Summary median/P95 use interpolated quantiles; duplicate bins, missing values and the partial final second are excluded. Zero remains a real measurement.

A displayed B–A median difference requires all setup/route checks, at least 30 bins each, 90% complete-second coverage, detailed source diagnostics, no sample/endpoint gap above one second, known ranges within 1%, no near-range samples, no missing/unreliable/no-contact vendor statuses, and mean sample rates within 25%. These provisional gates support descriptive phone-signal comparison only. They do not establish calibration, statistical significance, road causes or better/safer riding.

**Ask Odo about these rides** opens the selected pair’s debrief without sending. On Send, Meta receives bounded summaries, boolean/unknown context checks and failed channel checks, alongside the existing ride evidence. Identifiers, route coordinates, raw samples and private notes remain local. The server validates the schema and derives applicable failures from supplied diagnostics; the prompt requires limitations before conclusions. Provider credentials remain server-side. Current checks use a mock Meta provider, not a new live request.

Run `node --test --test-isolation=none scripts/ride-compare.test.cjs scripts/companion.test.cjs` and `node scripts/compare-smoke.cjs` against the localhost preview. Browser checks cover both empty and populated states, pair selection, context normalization, withheld changes, explicit requests, evidence citations, conversation reset and 320–1440px layouts. The screenshots below contain synthetic recordings only:

- [Desktop comparison](previews/compare-desktop-synthetic.png)
- [Mobile comparison](previews/compare-mobile-synthetic.png)
- [Phone signal card](previews/compare-signals-synthetic.png)

[Signal inspection](SIGNAL-INSPECTION.md) adds readable mobile axes, original-bin scrubbing and bounded min/max rendering for long recordings. The two rides follow the same elapsed-time percentage, not a spatial alignment.
