# Build verification — November 3, 2026 (IST)

## Version 0.2.0

Local APK `dist/ride-ledger-0.2.0-debug.apk`: SHA-256 `FE225C5338A3A424FAEAA7494CC1E062F3CAA097D6B69C07873457C20EE2DEDF`.

Build, lint (no issues) and nine unit tests (six GPS plus three sensor-statistics tests) passed locally. APK signature verified and matches the original local 0.1.0 debug certificate. No new permissions. Additional sensor selection, streaming magnitude/timing summaries, screen-state broadcast logging and availability/range metadata implemented. Android-specific interactions and optional sensors still require a phone test. Historical cloud build evidence below applies to 0.1.0; inspect Actions separately for 0.2.0.

Private walk recordings were inspected locally; no recordings, coordinates or private analysis output are included in source publication.

## Version 0.1.0 historical verification

Local debug APK: `dist/ride-ledger-0.1.0-debug.apk`.

SHA-256: `1424B0C28122B3F75BE6D088F6236FBE5007A82F3193077A3213BC572D89481E`.

- JDK 17.0.20.1, Gradle 8.9, Android Gradle Plugin 8.7.3, compile/target SDK 35, minimum SDK 26.
- `assembleDebug lintDebug testDebugUnitTest --no-daemon`: **BUILD SUCCESSFUL**.
- Lint: **No issues found**.
- GPS filter unit tests: **6 passed; 0 failures/errors/skipped**. Covers good/bad uncertainty, missing uncertainty, stale/future/mock/out-of-order fixes, invalid numeric values, ordinary movement, jitter, long gaps and jumps.
- Android `apksigner verify --verbose`: **Verifies**, v2 signature, one signer. This is a debug signature; no release key is included in the repository.
- Android `aapt dump permissions`: location (fine/coarse), location foreground service, foreground service, notifications and wake lock. **No INTERNET or background-location permission**.
- Gradle wrapper generated. **GitHub Actions passed** build, lint, unit tests and APK artifact upload for commit `8d256c6f08ea83ecdac1d2392f37cd320ed4bee2`: https://github.com/risheekaiyar/ride-ledger/actions/runs/41516492201 . Initial SDK setup failed because the setup action requested the obsolete `tools` package; explicit SDK package configuration fixed it.
- Private source repository created through the browser on November 3: https://github.com/risheekaiyar/ride-ledger . GitHub connection verified with push access after the user configured access; source publication uses that connection. Local `origin` configured, but local Git has no saved authentication. No collaborator invitation sent. Remote CI status must be checked separately from the local successful build above.

## Limits of this verification

No APK has been installed or exercised on the Vivo X300 Pro. Notification Stop, permission UI, file picker export, process interruption, immediate start/stop, screen rotation, and screen-off recording have been reviewed in source but are **not device-tested**. GPS unit tests do not exercise Android services or sensors. Local ADB could not start its server in this environment, so it provided no device evidence.

The service serializes writes/finalization on one worker, keeps recording marked active until destruction to avoid starting over partially closed files, uses a bounded partial wake lock, flushes about every five seconds and does not restart automatically after process death. These choices reduce known failure modes but do not prove runtime reliability on this phone.

Follow PHONE-TEST.md before the office commute. Preserve private route ZIPs locally and never add them to GitHub.
