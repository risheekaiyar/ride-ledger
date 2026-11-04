# Current main build: 0.3.7

The journey recap now uses an actual WebGL 3D road diorama: white road surfaces, solid shaded sidewalls, a beveled dark platform, grid, cast shadows, cyan progress and a racing arrow. The default isometric camera rotates manually through 360° during playback. Track Studio, the journey chapter and exported films use the same renderer. The former flat Canvas route renderer is removed. See [RACING-RADAR.md](docs/RACING-RADAR.md).

The story still connects successive fixes visually with no central gap banner. Original coordinates, timestamps, measured statistics and Meta evidence remain source-based. The technical inspection view retains its source-quality reporting. The review fixture is fictional and labeled **DEMO / ILLUSTRATED**; it is not packaged into the product or automatically added to user journals.

`UI-Improvement` was merged into the freshly fetched `main` without conflicts at `30fe486`. Main's existing code was already included in the UI branch; its merge history is preserved. The previously rejected `odo/replay-garage-0.3.2` experiment remains separate. The verified APK is committed at [downloads/ride-ledger-0.3.7-debug.apk](downloads/ride-ledger-0.3.7-debug.apk) (**version code 10**), with [download instructions and checksum](downloads/README.md). Packaged renderer, mesh builder, presentation helper, entry point and film/UI code match source. The deleted 2D route renderer is absent from the APK.

Rechecked on the merged main tree: **174 Node tests**, Android assemble/lint and the **17-test Java target** (unchanged Java tests were up-to-date). Lint has **0 errors and 9 existing warnings**. Browser checks cover the actual WebGL scene, full camera rotation, forward/reverse scrubbing, preserved source geometry, story continuity and technical gap handling, 320–1440px layout, source-altitude views, PNG export, shader/runtime errors, context-loss/no-WebGL fallback, cleanup, video cancellation/backgrounding, all insight chapters and mocked Meta personalization. The inspected H.264 story contains **18 seconds / 432 frames / 720 × 1280**.

Review [the phone preview](docs/previews/diorama-mobile-synthetic.png), [desktop preview](docs/previews/diorama-desktop-synthetic.png), [exported frame](docs/previews/diorama-film-synthetic.png) and [animated story](docs/previews/diorama-insights-synthetic.mp4).

Meta responses and external reference tiles were mocked in regression checks. The cloud has no live Meta key. Physical Android recording and playback performance still need the demo device check.

Repository APK SHA-256: `aa5717a4295cc8234399509bd1646535a9ec51c7af3cf2536b07624451ac0646`.

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
