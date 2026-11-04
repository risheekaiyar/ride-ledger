# Current branch build: 0.3.6

The journey recap now uses a wide road-map composition with subtle relief, a racing arrow and cyan progress. Its central recording-gap banner and visual discontinuities are removed. Display-only interpolation keeps the story moving between known positions while source measurements, speed availability and Meta evidence remain unchanged. The new showcased demo traces fictional city blocks and winding roads, clearly labeled **DEMO / ILLUSTRATED**. See [RACING-RADAR.md](docs/RACING-RADAR.md).

Work is on `UI-Improvement`; no deployment, merge or environment publication was performed. The APK is `app/build/outputs/apk/debug/app-debug.apk`, copied locally to `dist/ride-ledger-0.3.6-debug.apk` (**version code 9**). Packaged entry point, renderer, presentation helper and film/UI code match source. The fictional demo fixture is not packaged into the app or added to user journals automatically.

Verified locally: **175 Node tests**, Android assemble/lint and the **17-test Java target** (unchanged Java tests were up-to-date). Lint has **0 errors and 9 existing warnings**. Browser checks passed for continuity through missing samples, removal of the central overlay, preserved source data, reverse scrubbing, full rotation, 320–1440px layout, actual MP4 output, mocked Meta personalization and lifecycle cleanup. The reviewed H.264 story is 18 seconds / 432 frames / 720 × 1280.

Meta responses and external reference tiles were mocked in regression checks. The cloud has no live Meta key. Physical Android recording and playback still need the demo device check. The main Track Studio and measurement views retain their source-quality reporting; continuous interpolation is confined to story playback.

Local APK SHA-256: `6ccba91d71caa100ce26cac737436e4b50c5af61009d75fb5b4348cbffd6a122`.

## Historical releases

# Current release: 0.3.0

Independent GitHub build, lint, 10 Java tests, 10 Node tests and APK upload passed: https://github.com/risheekaiyar/ride-ledger/actions/runs/41663136844 .

See docs/RELEASE-0.3.md for scope and validation limits. Android assemble/lint/10 Java tests and 10 Node tests passed locally. Dashboard/WebView/widget still need the owner's on-device trial.

APK SHA-256: `43DB48FDBA05F11BDA0CE3A18DC768577B0087D68C2A8ADF42651DB18251614E`.
Certificate SHA-256: `8dd9bf63ecfacb6425a09d08fa4b6dbb532e2c34fb483646005da749d4fe25b5`, matching prior local APKs.

Internet permission was added for optional user-triggered map tiles. Raw recording has no automatic upload. Muse/community/Bluetooth/speed-limit services remain unconnected. No credentials or private recordings are in hosted source.

## Historical recorder notes (0.2.0 and earlier)

# Build verification — November 3, 2026 (IST)

Repository access update: the owner confirmed sharing with VarunAiyar. A GitHub collaborator invitation was sent and verified as pending acceptance on November 3, 2026. Developer handoff is in VARUN-HANDOFF.md. No raw recordings or credentials were shared in the repository.

## Version 0.2.0

Cloud build, lint, unit tests and APK artifact upload also passed: https://github.com/risheekaiyar/ride-ledger/actions/runs/41519934587 .

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

The owner installed 0.1.0 on the Vivo and supplied short screen-on/off indoor exports. Their files, sample counts and timestamp coverage were checked locally. This supplies limited evidence for short-session recording and export, not calibration, a full commute or every lifecycle interaction. No private recordings are committed. Version 0.2.0's additional options, summary UI and screen-state logger await device testing. GPS/sensor unit tests do not exercise Android services or hardware. Local ADB provided no device evidence.

The service serializes writes/finalization on one worker, keeps recording marked active until destruction to avoid starting over partially closed files, uses a bounded partial wake lock, flushes about every five seconds and does not restart automatically after process death. These choices reduce known failure modes but do not prove runtime reliability on this phone.

Follow PHONE-TEST.md before the office commute. Preserve private route ZIPs locally and never add them to GitHub.
