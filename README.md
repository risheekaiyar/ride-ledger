# Ride Ledger — Android commute recorder

Prototype for an Xpulse 200 rider using a Vivo X300 Pro, initially carried in a pocket or bag. Records only after explicit Start; user stops after parking. No network permission, account, AI calls or automatic uploads in the recorder.

## Current state

Debug APK built locally on November 3, 2026. `assembleDebug`, `lintDebug`, and all six GPS-filter unit tests passed. APK signature/permission verification is recorded in BUILD-STATUS.md. On-device and screen-off testing are still required. See [PHONE-TEST.md](PHONE-TEST.md) for install and five-minute walk instructions.

Capabilities implemented in source: location foreground service with visible notification and Stop action; GPS fixes with accuracy, mock and age flags; accelerometer, gyro, rotation vector (xyz plus optional scalar/heading accuracy) and pressure when available; private internal storage; buffered CSV writes; metadata and end summary; user-selected ZIP export through Android document picker. No auto-start or background-location permission. Four-hour recording limit. Process death may retain previously flushed files but leave no final summary. Unavailable sensor components are empty CSV fields. Motion is capped at approximately 25 Hz per sensor; GPS requests are approximately 1 Hz, without a guaranteed delivery rate.

Raw exports contain precise routes. Never commit real commute data, API keys, build caches or signing keys. The existing job-dashboard .env.local belongs to a separate project and must not be copied here.

## Build

Requires JDK 17 and Android SDK platform 35; Gradle wrapper 8.9 is included. On Windows, configure `JAVA_HOME` for JDK 17 and `ANDROID_HOME` for your SDK, then use `.\gradlew.bat assembleDebug lintDebug testDebugUnitTest`. On macOS/Linux use `bash ./gradlew assembleDebug lintDebug testDebugUnitTest`. Android Studio can import this folder and configure the SDK. AGP 8.7.3 selects build-tools 34.0.0, installed locally alongside 35.0.0. Local helper tools and build caches are ignored under tools/.

The generated APK is `app/build/outputs/apk/debug/app-debug.apk`, copied for phone transfer as `dist/ride-ledger-0.1.0-debug.apk`. A source-only ZIP is also placed in dist/. Neither distribution file is committed. The GitHub Actions workflow will run the same build/lint/unit-test tasks and expose an APK artifact after repository publication; it has not run remotely yet.

The recorder uses an explicit location foreground service and is started while the Activity is visible, following [Android foreground-service guidance](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start). Android recommends foreground-service sensor collection for continuous sensors ([sensor overview](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview)). These platform rules do not establish Vivo-specific screen-off reliability.

Schema version 2: `gps.csv` contains raw fixes, location uncertainty, optional speed uncertainty, mock flag, age and acceptance flag. Acceptance means the fix passed a preliminary quality filter, not that a distance segment was counted. The distance preview rejects long gaps, implausible jumps and small jitter; this may undercount real movement. `motion.csv` records monotonic sensor timestamps, receipt wall time, Android sensor type, up to five values and Android sensor accuracy. Units and registration availability are in metadata. `summary.json` indicates finalization; absent summary means incomplete. No stop/delay comparison, AI explanation or road-condition inference is implemented.

## Validation before commute

1. Install debug APK; grant precise location and notification access.
2. Start outside while parked. Confirm GPS fixes appear and notification remains visible.
3. Walk five minutes with the display locked. Stop from notification after stopping movement.
4. View summary; export ZIP and verify timestamps, plausible route, GPS uncertainty, and sensor rows covering the locked interval.
5. Repeat a normal commute with consistent phone placement. Do not interact while riding.

Device battery management may interrupt recording: validate on this Vivo before relying on it. Export is manual; a copy in Downloads or a cloud provider is outside the app's private storage.

## Product direction to evaluate

Broad Strava-for-motorcycles already exists: REVER (tracking/community), calimoto (route planning), Detecht (tracking/navigation/community), Slipangle (phone telemetry). Do not claim the concept or smartphone road sensing is novel.

Possible narrower hypothesis: a private repeated-commute diary that explains travel-time changes and repeat location-linked observations. Compare only like-for-like routes and sampling conditions. Pocket/bag motion includes body movement and cannot substantiate road roughness, potholes, lean angle, braking safety, or crashes. Road-condition inference needs later fixed-mount calibration and repeated-pass validation.

Meta model role for a later hackathon slice: turn computed route/stop statistics and explicit rider notes into an evidence-linked post-ride explanation, distinguish observed from unknown, and let riders correct it. Keep numerical measurement deterministic. No AI currently implemented. Community/feed is future scope, not required for the first sensor test. No speed competitions or unvalidated safety scoring.

## Collaboration

Private source repository: https://github.com/risheekaiyar/ride-ledger . User GitHub: risheekaiyar. Brother: VarunAiyar. Local `origin` points to this repository. Source is published using the connected GitHub app; local Git authentication must be configured separately before terminal fetch/push will work. No collaborator invitations sent. Competition eventually requires public source with no personal data; do not change visibility without authorization. See COLLABORATION.md for the remote development workflow.

Competition deadline carried from this conversation: November 4, 2026 at 9pm ET (November 5, 7:30am IST). Available user time 3–4 hours/day. Prioritize working recorder + real test + meaningful evidence over a full social network. Verify team eligibility for human coding contributions; do not assume brother qualifies automatically.
