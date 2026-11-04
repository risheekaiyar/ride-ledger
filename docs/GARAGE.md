# Bike profile and recording context

The garage combines a local bike photo, manual odometer, saved ride summaries and the latest recording setup. The default drawing is labelled as an illustration, not a rendering of the selected model. Profile photos remain local, are converted to JPEG and are bounded to 1200 × 900 pixels; files above 8 MB are rejected.

The odometer is entered manually, including a valid zero. GPS distances never increment it. Ride counts and time include only motorcycle journeys whose saved bike name exactly matches the profile. Distance totals include only rides that pass the existing evidence checks, with a contributing-ride count. An unsupported total remains unknown. Renaming the profile preserves historical bike names.

The saved bike type supplies the next recording's default, including an explicit Unknown choice. Placement and mount condition shown in the garage come from the latest associated ride. Its debrief button selects that ride and opens the Meta companion's evidence review; it does not send a model request. Missing bike telemetry is stated explicitly.

If a journey is already recording, the garage's recording actions leave it running and direct the rider to the top recording control. They never reinterpret a stale **Record this bike** action as Stop.

`node scripts/garage-smoke.cjs` checks editing/reload, whitespace names, zero odometers, bike-specific totals, debrief selection, recording defaults, local photo sizing/removal/reselection and widths from 320 to 1440 pixels. The screenshots below contain synthetic test rides and no user photos. They are never loaded as product data.

- [Mobile](previews/garage-mobile-synthetic.png)
- [Desktop](previews/garage-desktop-synthetic.png)

Native photo-picker behavior and persistent storage limits still need an actual phone trial.
