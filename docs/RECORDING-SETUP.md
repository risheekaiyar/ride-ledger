# Recording setup

The Android recording sheet groups bike/activity, phone placement and device checks before Start. Pocket, Bag and Rigid mount have large accessible radio controls and explain how phone movement enters the readings. The sheet stays usable at 320px and keeps Start visible while scrolling.

[Mobile setup](previews/recording-setup-mobile-mock.png) · [Desktop setup](previews/recording-setup-desktop-mock.png)

Screenshots use mocked hardware responses; they are not a device-validation result.

## Hardware and context

- The restricted Android bridge reports default-sensor presence, name, resolution and maximum range, GPS-provider state, precise-location permission and notification permission. No sensor sampling, location fix or remote request is needed for this check.
- Unavailable channels are disabled. A GPS-only recording is supported when every phone channel is unavailable or deselected. The actual recording metadata still reports registration success; available hardware is not a guarantee of a live channel.
- GPS disabled prevents Start in the sheet. Open location settings is an explicit user action. The check refreshes on return or with Refresh. Missing permissions are requested by the existing Android start flow.
- Older bridges and unreadable capability responses show an unchecked state. Missing permission fields remain not reported; they do not become granted.
- Pocket/Bag are normalized to Not mounted both in the UI and native bridge. Rigid mount begins each new recording with Unknown security, even if the last ride used Stable or Slipping. Bike type and placement are remembered locally; the rider still reviews the current setup.
- Setup guidance is deterministic copy. The recorded bike/placement context accompanies the ride and can be sent in Odo's existing Meta debrief flow after the ride; setup makes no model request and does not claim calibrated lean or bike-frame acceleration.

## Widget

An idle home-screen widget now opens this setup after the dashboard is ready, rather than starting with stale/default activity and bike context. Its label is Set up journey. When a recording is active it still invokes Stop & save directly. No overlay permission is needed for this widget flow. The separate companion overlay is unchanged.

## Checks

`node scripts/recording-smoke.cjs` covers browser/native behavior, absent hardware, GPS settings refresh, selected channels passed to Android, placement normalization, resetting mount security, GPS-only recording, a stale UI recording flag, malformed/old bridge fallback and narrow layout. Companion, sharing and overlay regression checks pass. Android assemble/lint and 14 Java tests pass.

A physical Android trial is still needed for actual sensor enumeration/registration, permission dialogs, widget cold launch and activity resume. Hardware preflight does not validate sensor-fusion accuracy; labelled rides with known setup remain necessary.
