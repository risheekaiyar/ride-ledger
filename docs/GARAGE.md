# Garage studio — 0.3.3

The garage has a fourteen-model catalog plus a custom motorcycle, family/color controls, a locally rendered 360° bike illustration, an interactive cluster, public reference photos and a Meta garage insight.

The 3D model is a **parametric family illustration, not manufacturer CAD or a reconstruction from a photograph**. Adventure, rally, sport, naked, classic, touring and scooter silhouettes differ. Drag, use arrow keys or the angle slider to rotate it. New native recordings save the model, family and paint color, preserving the historical marker if the garage later changes.

Selecting a catalog model searches Wikimedia Commons for image references. Only supported image formats, public/CC licenses and approved Wikimedia image/source hosts are accepted. Metadata is cached locally; attribution accompanies the photo. When connected, Meta `muse-spark-1.3` selects a candidate by title and explains the garage context through a separate strict runtime schema. It cannot claim to have inspected image content or generated OEM geometry. Custom bikes can use a local photo. Local uploads remain bounded to 1200 × 900 pixels and 8 MB. Failed public lookup leaves the 3D illustration available.

## Interactive cluster and odometer

The Xpulse-inspired LCD and TFT variant use actual SVG segments and an ignition sweep each time Garage opens. Replay ignition, MODE and SET work. ODO shows the app estimate; TRIP shows supported distance since the reading; RIDES shows the associated count. The display explicitly identifies its preview: engine RPM, actual gear, fuel and ABS state are not connected.

**Set/correct odometer** creates a timestamped baseline. The last actual reading remains separate from tracked GPS distance and the projected app reading. Only completed supported rides for the same saved bike name, starting after the baseline, contribute. Older imports and other bikes never inflate the new ledger. Zero is a valid reading; a lower reading requires an explicit new baseline.

A distance adjustment is eligible only when the rider confirms complete travel, at least five kilometers have supported distance, there are no uncertain-distance recordings, and device/placement/mount/bike setup match. The ratio of odometer delta to GPS distance must fall between 0.8 and 1.2. Applying it is a rider choice. It affects future app odometer projections only; original tracks, speeds, G values and manual readings are preserved. **This does not calibrate phone axes or motorcycle lean.** Meta receives the bounded check result and explains a useful next step.

Catalog profiles keep separate readings/colors when switching bikes. Renaming preserves historical recording names and requires a fresh matching odometer baseline. Garage never turns a stale start action into Stop during an active recording.

[Mobile garage](previews/final-garage-mobile-synthetic.png) · [Desktop garage](previews/final-garage-desktop-synthetic.png)

`garage-smoke.cjs` verifies real 3D rotation, cluster controls, profile persistence, zero readings, eligible corrections, unchanged source distance, public-reference/Meta contracts, local photo handling, the recording guard and layouts from 320 to 1440 pixels. Public imagery and Meta responses are mocked in the cloud check. Live Commons availability and on-device performance remain demo checks; no live Meta key is configured here.
