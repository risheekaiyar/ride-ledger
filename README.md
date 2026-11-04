# Odo — Strava for bikers

The `UI-Improvement` branch adds the [ride studio and runtime companion workflow](docs/UI-IMPROVEMENT.md): a motorsport-inspired interface, timed GPX imports, rider context, road observations and exportable story cards. See that guide for verified behavior, Meta runtime setup and platform limitations.

The offline [3D Track Studio](docs/TRACK-STUDIO.md) turns each recorded route into a lit, raised road model with racing kerbs, orbit/chase/overhead cameras, synchronized telemetry and PNG export. No tile service is required.

[Ride films](docs/RIDE-FILM.md) add local 3D portrait video export with a motorsport overlay, explicit route/speed sharing choices and Android share-sheet transport. Modern browsers render each frame into a 24 fps MP4. [Watch the synthetic demo](docs/previews/ride-film-synthetic.mp4).

The [ride library](docs/RIDE-LIBRARY.md) follows the supplied Ryval reference with white raised route silhouettes, a dark rounded ride sheet, and source-aware peak-speed readouts. Geographic map tiles remain opt-in. [Ride details](docs/RIDE-DETAIL.md) lead with the track, a large distance summary and an Odo debrief card, followed by the full measurement evidence.

The [recording setup](docs/RECORDING-SETUP.md) now checks Android sensor availability and permissions, supports GPS-only capture, and keeps bike/placement context consistent.

The [garage](docs/GARAGE.md) keeps a local bike profile, manual odometer and source-aware ride totals together, with recording defaults and a debrief of that bike's latest ride.

[Distance confidence](docs/DISTANCE-CONFIDENCE.md) now survives annotation edits and backup restores; missing distance remains unknown and accepted-fix percentage is checked separately from GPS time coverage.

[Screen-state evidence](docs/SCREEN-STATE-EVIDENCE.md) distinguishes observed intervals from missing logs and carries bounded coverage into Meta debriefs.

[Phone signal diagnostics](docs/SENSOR-DIAGNOSTICS.md) expose sample gaps, reported Android statuses and possible range clipping, with bounded motion-channel summaries in the Meta debrief.

# Odo / Ride Ledger — private riding journal

A local Muse runtime has been tested against Meta using synthetic cases and an owner-approved, location-free summary of two real commutes. See [Muse runtime status](docs/MUSE-RUNTIME-STATUS.md). The published website and installed APK are not yet connected to that local runtime.

Independent GitHub build, lint, 10 Java tests, 10 Node tests and APK upload passed: https://github.com/risheekaiyar/ride-ledger/actions/runs/41663136844 .

Version **0.3.0** adds a modern Android and web dashboard around the private sensor recorder. Read [the release guide](docs/RELEASE-0.3.md) for implemented features, installation, testing and measurement limits; [VARUN-HANDOFF.md](VARUN-HANDOFF.md) for development; and [MUSE-INTEGRATION.md](docs/MUSE-INTEGRATION.md) for the prepared Meta runtime and coding prompts.

The personal workflow works: record on Android, review saved rides, import/export ZIPs, replay an offline 3D track model, customize stat cards, organize recurring or one-time trips, and maintain a bike profile/manual odometer. Web imports stay in the browser; the hosted interface contains no private recordings. Optional map tiles require an explicit load action and reveal the viewed map area to OpenStreetMap. Android now has Internet permission for these tiles; recording remains local with no automatic upload.

This release does not yet connect Muse, a live multi-user community, automatic cross-device sync, bike Bluetooth or road speed-limit data. Private community drafts omit route/speed/sensor details. Lean, calibrated bike g, confirmed potholes, fuel and safety scores are unavailable. A slipping mount and a pocket both mix phone movement with the riding signal.

Local Android assemble/lint/10 Java tests and 10 Node analysis tests passed. The new Android dashboard and home-screen widget require an on-device trial. Install the matching local APK as **Update**, after exporting old rides; keep the existing installation/storage. Older generic recordings remain unclassified until edited.

**Hackathon eligibility is unresolved:** the authenticated event rules list sports analyzers/coaches among generic categories to avoid. See [HACKATHON-CHECKLIST.md](docs/HACKATHON-CHECKLIST.md) before presenting riding coaching as an entry. The source repository remains private.

## Build and preview

Use JDK 17, Android SDK platform 35/build-tools 34.0.0, and the included Gradle 8.9 wrapper: `./gradlew assembleDebug lintDebug testDebugUnitTest` (Windows: `.\gradlew.bat`). Android's syncDashboard task copies web/ into generated APK assets. Owner's helper tools and signing keys are ignored, never distributed.

Run `node --test scripts/analysis.test.cjs` for the evidence pipeline tests. Run `node scripts/serve.cjs`, then open http://127.0.0.1:4178 for the local web interface. It needs no package installation. `?review=1` loads dist/private-review.json only on the local preview, if privately prepared; that file is never included in the deployed site.

The APK is generated at app/build/outputs/apk/debug/app-debug.apk and copied locally to dist/ride-ledger-0.3.0-debug.apk. Cloud debug builds can use a different signing key and might not update over the owner's local APK. See [BUILD-STATUS.md](BUILD-STATUS.md) and [PHONE-TEST.md](PHONE-TEST.md).

Raw ZIP exports contain metadata.json, summary.json, gps.csv, motion.csv, events.csv and sensor_summary.json. GPS/motion columns remain compatible with the older recorder. No road/safety/calibration claim follows from a successful recording.

## Collaboration and privacy

Private source: https://github.com/risheekaiyar/ride-ledger . VarunAiyar was invited November 3; invitation acceptance is separate from hackathon eligibility. Use your own GitHub account, feature branches and reviewed changes. Never commit raw routes, odometer/bike photos, credentials, local tools or signing keys. The owner's local checkout was originally published through the connected app; terminal Git authentication/history synchronization requires separate setup.

The private web interface is hosted at https://odo-ride-ledger-risheek.risheekaiyar.chatgpt.site . Each browser stores its own imported data; it is not cross-device synchronization. Export a private backup before clearing browser data.
