# Ride Ledger — developer handoff

Current Android version: **0.2.0**, native Java, minimum Android 8 / API 26, target/compile API 35. Rider's test device: Vivo X300 Pro; bike: Xpulse 200. Phone is carried in a **pocket or bag**, not a rigid mount.

## Start here

1. Accept the repository invitation on GitHub when received. Clone https://github.com/risheekaiyar/ride-ledger using your own GitHub account.
2. Open the clone in Android Studio or your own development environment. Use JDK 17 and Android SDK platform 35. The Gradle 8.9 wrapper is included.
3. Read README.md, BUILD-STATUS.md and PHONE-TEST.md. Build with `./gradlew assembleDebug lintDebug testDebugUnitTest` (Windows: `.\gradlew.bat assembleDebug lintDebug testDebugUnitTest`).
4. Create a feature branch and submit changes through a pull request. Do not push unrelated experiments over the owner's current recorder.

## Implemented

- Explicit Start/Stop; location foreground service with notification Stop; no automatic restart or background-location permission.
- Offline GPS CSV plus selected accelerometer, gyro, rotation-vector, gravity, linear-acceleration, magnetic-field, light and pressure streams where available.
- Approximately 25 Hz maximum per motion sensor and approximately 1 Hz GPS request; actual rates vary. Light/pressure can be on-change signals.
- Private internal files, buffered writes, metadata, summary, sensor magnitude/timing diagnostics, screen-state broadcasts and manual ZIP export.
- Four-hour limit and bounded partial wake lock. No internet permission, account, AI calls or upload service.
- Local 0.2.0 build/lint/nine unit tests passed. Cloud run also passed: https://github.com/risheekaiyar/ride-ledger/actions/runs/41519934587 .

## Test state and next milestone

The owner supplied short screen-on and screen-off indoor recordings from 0.1.0. ZIPs and row counts were consistent, and accelerometer/gyro/rotation timestamps covered the short sessions without long gaps. This is limited continuity evidence, not calibration or proof of a full commute's reliability. Private recordings are deliberately absent from the repository.

Version 0.2.0 optional sensors, summary UI and screen-event logger are awaiting a phone trial. The owner plans to supply office-commute data after testing. Wait for actual recordings before choosing derived metrics or claiming movement classification works. A short stationary → gentle motion → stationary test is useful before relying on a longer trip.

When data is supplied privately, check finalization, CSV row counts, per-sensor monotonic timestamps and coverage, screen-off intervals, GPS uncertainty/gaps, unavailable sensors and abnormal values. On-change sensor gaps are not automatically failures. Compare the same phone placement across trips. Never upload precise routes or raw samples into an issue, pull request, log or source commit.

## Limits and development priorities

1. Retain reliable screen-off recording, notification Stop, safe storage/export and clear failure reporting.
2. Improve readable ride review and data-quality visibility, then consider an offline map preview and explicit rider notes.
3. Evaluate repeated-commute comparisons only after outdoor data is available. Separate computed duration/stops from a rider's explanation of the cause.

Pocket/bag motion describes the phone and rider, not calibrated motorcycle lean, potholes, road roughness, braking safety or crashes. RMS/peak values are phone-sensor summaries, not safety scores. Do not integrate accelerometer data into an asserted indoor distance estimate. Pressure availability cannot be assumed; light in a pocket is not ambient road visibility.

The broader Odo brief is an option list (see BRIEF-REVIEW.md), not an approved social-feed, navigation, crash-SOS, insurer or fleet scope. Confirm competition team/contribution eligibility before counting another person's work in an entry.

## Preserve the owner's data and build

Install a matching-signed update over the existing app; do not tell the owner to uninstall routinely. Export rides first. Debug APKs built on another machine or GitHub can use a different signing key, so they may not update the owner's locally built APK. Never share or commit signing keys to work around this.

No credentials are needed for the recorder. Do not read or reuse credentials from any other project. Each developer uses their own tool account and GitHub authentication. GitHub Actions exposes an APK artifact, but it is distinct from the owner's local signed build. Start from a fresh clone: the original owner's local Git checkout was published through the connected app and does not yet have normal authenticated Git history synchronization.
