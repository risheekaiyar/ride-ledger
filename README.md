# Odo — Strava for bikers

**Android download:** [Odo 0.3.7 APK](https://github.com/risheekaiyar/ride-ledger/raw/refs/heads/main/downloads/ride-ledger-0.3.7-debug.apk) · [Install notes and checksum](downloads/README.md).

The `main` branch includes the [ride studio and runtime companion workflow](docs/UI-IMPROVEMENT.md): a motorsport-inspired interface, timed GPX imports, rider context, road observations and exportable story cards. See that guide for verified behavior, Meta runtime setup and platform limitations.

[Animated ride insights](docs/ANIMATED-INSIGHTS.md) now open with a [racing-game road preview](docs/RACING-RADAR.md): a true WebGL diorama with solid white roads, shaded sidewalls, a beveled dark base, real shadows, a racing arrow, cyan replay progress and manual 360° rotation. Story playback connects missing positions visually without changing the measured statistics. Other chapters include an analogue speed dial, slow G-force radar beside the route, and a 3D elevation ribbon with meter ticks and altitude-based colors. The app uses a shared black, white, red and cyan palette. Meta `muse-spark-1.3` directs the recap and asks questions linked to highlighted map sections. [Watch the updated synthetic story](docs/previews/diorama-insights-synthetic.mp4) (mock model captions; configure live Meta access for the hackathon demo).

The offline [3D Track Studio](docs/TRACK-STUDIO.md) turns each recorded route into a lit, raised white road diorama with cyan progress and isometric/overhead cameras, synchronized telemetry and PNG export. No tile service is required.

[Ride films](docs/RIDE-FILM.md) add local 3D video export in story, portrait and square formats, with a motorsport overlay, explicit route/speed sharing choices and Android share-sheet transport. Modern browsers render each frame into a 24 fps MP4. [Watch the synthetic demo](docs/previews/ride-film-synthetic.mp4).

The [ride library](docs/RIDE-LIBRARY.md) follows the supplied Ryval reference with white raised route silhouettes, a dark rounded ride sheet, and source-aware peak-speed readouts. Local title/bike/route search and 20-journey batches keep growing journals easy to browse. Geographic map tiles remain opt-in. [Ride details](docs/RIDE-DETAIL.md) lead with the animated-insight entry, the track, a large distance summary and an Odo debrief card, followed by the full measurement evidence.

The [recording setup](docs/RECORDING-SETUP.md) now checks Android sensor availability and permissions, supports GPS-only capture, and keeps bike/placement context consistent.

[Garage studio](docs/GARAGE.md) adds family/color-matched 360° motorcycle illustrations, interactive ignition-style clusters, separate actual/projected odometers, bounded distance corrections and Meta-curated public reference photos.

[Distance confidence](docs/DISTANCE-CONFIDENCE.md) now survives annotation edits and backup restores; missing distance remains unknown and accepted-fix percentage is checked separately from GPS time coverage.

[Screen-state evidence](docs/SCREEN-STATE-EVIDENCE.md) distinguishes observed intervals from missing logs and carries bounded coverage into Meta debriefs.

[Phone signal diagnostics](docs/SENSOR-DIAGNOSTICS.md) expose sample gaps, reported Android statuses and possible range clipping, with bounded motion-channel summaries in the Meta debrief.

[Ride comparison](docs/RIDE-COMPARISON.md) puts two phone recordings side by side, checks setup and sensor quality, and sends the selected pair’s bounded evidence to Meta only on request.

[Signal inspection](docs/SIGNAL-INSPECTION.md) keeps long recordings readable, preserves extrema and gaps, and offers focused 5-minute, 1-minute and 15-second views. Recorded event candidates open their original timestamp and sensor channel directly. Touch and keyboard inspection read original samples, including phone motion from recordings with no usable GPS fixes.

[Focused Meta debriefs](docs/FOCUSED-DEBRIEF.md) let riders ask about a selected trace window. Odo sends bounded motion, observed-speed and source-altitude summaries after explicit review and submission; reply citations return to that interval.

[Odo insight briefs](docs/COMPANION-INSIGHTS.md) present Meta explanations as linked observation cards, with local evidence tiles and six directions covering ride patterns, sensor confidence, setup, comparisons or focused windows, next recordings, and story ideas. Raw, linear and angular phone channels retain their distinct measurements throughout the experience.

The [journal landing and overview](docs/OVERVIEW.md) now open returning riders directly to Rides and keep the latest ride, Odo debrief, source-aware totals and bike profile together.

# Odo / Ride Ledger — private riding journal

A local Muse runtime has been tested against Meta using synthetic cases and an owner-approved, location-free summary of two real commutes. See [Muse runtime status](docs/MUSE-RUNTIME-STATUS.md). The published website and installed APK are not yet connected to that local runtime.

Independent GitHub build, lint, 10 Java tests, 10 Node tests and APK upload passed: https://github.com/risheekaiyar/ride-ledger/actions/runs/41663136844 .

Version **0.3.7** updates a modern Android and web dashboard around the private sensor recorder. Read [the release guide](docs/RELEASE-0.3.md) for implemented features, installation, testing and measurement limits; [VARUN-HANDOFF.md](VARUN-HANDOFF.md) for development; and [MUSE-INTEGRATION.md](docs/MUSE-INTEGRATION.md) for the prepared Meta runtime and coding prompts.

The personal workflow works: record on Android, review saved rides, import/export ZIPs, replay an offline 3D track model, customize stat cards, organize recurring or one-time trips, and maintain a bike profile/manual odometer. Web imports stay in the browser; the hosted interface contains no private recordings. Optional map tiles require an explicit load action and reveal the viewed map area to OpenStreetMap. Android now has Internet permission for these tiles; recording remains local with no automatic upload.

The Meta-only companion requires a configured runtime key. Live multi-user community, automatic cross-device sync, bike Bluetooth and road speed-limit data remain unconnected. Private community drafts omit route/speed/sensor details. Lean, calibrated bike g, confirmed potholes, fuel and safety scores are unavailable. A slipping mount and a pocket both mix phone movement with the riding signal.

Local Android assemble/lint, the 17-test Java target and 174 Node tests passed. The new Android dashboard and home-screen widget require an on-device trial. Install the matching local APK as **Update**, after exporting old rides; keep the existing installation/storage. Older generic recordings remain unclassified until edited.

**Hackathon eligibility is unresolved:** the authenticated event rules list sports analyzers/coaches among generic categories to avoid. See [HACKATHON-CHECKLIST.md](docs/HACKATHON-CHECKLIST.md) before presenting riding coaching as an entry. The source repository remains private.

## Build and preview

Use JDK 17, Android SDK platform 35/build-tools 34.0.0, and the included Gradle 8.9 wrapper: `./gradlew assembleDebug lintDebug testDebugUnitTest` (Windows: `.\gradlew.bat`). Android's syncDashboard task copies web/ into generated APK assets. Owner's helper tools and signing keys are ignored, never distributed.

Run `node --test scripts/analysis.test.cjs` for the evidence pipeline tests. Run `node scripts/serve.cjs`, then open http://127.0.0.1:4178 for the local web interface. It needs no package installation. `?review=1` loads dist/private-review.json only on the local preview, if privately prepared; that file is never included in the deployed site.

The APK is generated at app/build/outputs/apk/debug/app-debug.apk. The verified main build is committed at [downloads/ride-ledger-0.3.7-debug.apk](downloads/ride-ledger-0.3.7-debug.apk), with [installation notes and a checksum](downloads/README.md). Cloud debug builds can use a different signing key and might not update over the owner's local APK. See [BUILD-STATUS.md](BUILD-STATUS.md) and [PHONE-TEST.md](PHONE-TEST.md).

Raw ZIP exports contain metadata.json, summary.json, gps.csv, motion.csv, events.csv and sensor_summary.json. GPS/motion columns remain compatible with the older recorder. No road/safety/calibration claim follows from a successful recording.

## Collaboration and privacy

Private source: https://github.com/risheekaiyar/ride-ledger . VarunAiyar was invited November 3; invitation acceptance is separate from hackathon eligibility. Use your own GitHub account, feature branches and reviewed changes. Never commit raw routes, odometer/bike photos, credentials, local tools or signing keys. The owner's local checkout was originally published through the connected app; terminal Git authentication/history synchronization requires separate setup.

The private web interface is hosted at https://odo-ride-ledger-risheek.risheekaiyar.chatgpt.site . Each browser stores its own imported data; it is not cross-device synchronization. Export a private backup before clearing browser data.
