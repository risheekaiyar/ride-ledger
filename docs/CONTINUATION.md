# UI-Improvement continuation checkpoint

Work is on the local `UI-Improvement` branch. The user now authorizes regular remote checkpoints. Tested commits have been pushed to origin/UI-Improvement; continue regular non-force pushes after validation. No environment publication or backend deployment has been performed. Use the existing checkout; preserve user changes.

Completed iterations:
- Motorsport/editorial mobile presentation, GPX import and story PNGs with explicit route-silhouette opt-in.
- User-labelled road observations and recording-time bike/mount context carried through Android ZIP metadata.
- Meta companion with explicit evidence preview, bounded follow-ups, clickable ride citations, clear unavailable states and strict comparable-ride selection.
- GPX identity separated from native recording IDs; unknown GPS/source metrics remain unknown in companion requests.
- Node 24 CI executes all test files. Reproducible local Chromium smoke script includes mock responses and never spends API credits.

Validation commands:
```
node --test --test-isolation=none scripts/*.test.cjs
source /workspace/ride-ledger-tools/activate.sh
./gradlew assembleDebug lintDebug testDebugUnitTest --no-daemon --max-workers=4
# In another session: node scripts/serve.cjs
node scripts/ui-smoke.cjs
```

Next substantial work:
1. Native transport and authenticated HTTPS gateway are now implemented (COMPANION-GATEWAY.md). Configure a reachable trusted-TLS endpoint and secure credentials, then validate live Meta behavior. The gateway has a SQLite lifetime request cap; it is not a dollar or multi-user budget service. The web preview server remains loopback-only.
2. The Android shortcut is now a draggable chat overlay using the native transport. Test lifecycle, Keystore persistence, permission revocation, task switching, keyboard, rotation and dismissal on a device. iOS cannot offer the same arbitrary cross-app overlay.
3. Meta model-directed tool calls: verify the current Meta Responses tool schema against official docs, then add a bounded, tested evidence-retrieval loop. Current runtime uses Meta for evidence interpretation and conversation, but does not claim tool use.
4. Real ride validation: require labelled recordings with known bike/placement/setup to assess sensor-fusion accuracy. Do not tune an algorithm to make unvalidated lean or road-condition claims.
5. Manufacturer-specific import adapters require representative exports and documented formats; timed GPX already works where supported. FIT/TCX/provider account sync are not implemented.
6. Terrain/satellite replay and video exports require a real terrain source, attribution/licensing decisions and rendering work. Current replay is an offline trace or tilted raster map.

External prerequisites: no ODO_META_API_KEY or ODO_META_MAX_REQUESTS is configured here. Live Meta calls and hackathon runtime eligibility remain unverified. Use secure configuration for credentials, never chat or tracked files. No paid live API calls have been made during these iterations.

Work can continue in an active cloud session without the user's computer awake, but automatic indefinite execution, session restart and weekly-quota exhaustion are not guaranteed. This file records resumption state; it is not a scheduled task.

Latest verified checkpoint: 28 Node tests passed; 10 Java tests passed with no failures or skips; Android assembleDebug and lintDebug passed (7 warnings: JavaScript-enabled WebView review, small widget text and localization). Chromium smoke tests passed for companion follow-ups, evidence navigation, story formats, mobile width and recording-context bridge arguments. All model responses in these checks were mocks. APK is app/build/outputs/apk/debug/app-debug.apk.

Native transport/overlay checkpoint: 34 Node tests passed, 12 Java tests passed, Android assembly/lint passed, and both Chromium smoke scripts passed. These include real local TLS authentication tests with an explicitly trusted test CA, persistent quota tests and mocked provider responses. No real Meta call, reachable hosted gateway or Android hardware trial has been performed. Server and client setup requirements are in COMPANION-GATEWAY.md. The user requests regular tested remote commits; push to UI-Improvement without force.

Native story-sharing checkpoint: the APK now hands generated PNGs to Android's chooser through a non-exported, read-only URI provider. Browser PNG download and native-share bridge contract checks passed, and Android assembly/lint/unit tests passed. Actual receiving-app behavior still needs a device.

Concrete external blockers observed during continuation:
- dev.meta.ai documentation access fails at the managed CONNECT proxy (HTTP 403); the model-directed tool-call schema remains unverified. Network requirements for dev.meta.ai and api.meta.ai were saved additively in the draft, with ODO_META_API_KEY metadata only. Nothing was published and no credential value was supplied.
- No Android devices are attached (`adb devices` returned an empty list). Keystore, overlay lifecycle and receiving-app sharing cannot be validated on hardware here.
- No reachable native gateway endpoint, trusted deployment certificate or client access token has been provisioned.
- Live Meta validation still needs the provider credential and an explicit request allowance. A managed cloud run must use Node 24's --use-env-proxy and the platform CA trust.
- Calibration validation needs labelled real rides; provider-specific adapters need representative exports; true terrain/satellite replay needs a selected licensed source and access.

Resume after these prerequisites are supplied. Do not claim eligibility, sensor accuracy, provider compatibility or hardware behavior from mock/browser tests. Regular tested pushes to UI-Improvement are authorized.
