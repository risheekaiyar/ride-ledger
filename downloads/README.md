# Download Odo for Android

## Field Journal review build · 0.4.0

[Download the standalone ODOme Field Journal APK](ODOme-Field-Journal-0.4.0.apk?raw=true) for Android 8 or later. It has its own package and opens the **Mountains to Coast** synthetic sample. Your installed recorder can stay on the phone. [Watch the 36-second walkthrough](../docs/previews/field-journal-walkthrough.mp4) · [Read the field-journal guide](../docs/FIELD-JOURNAL.md).

[Download the complete judge kit](ODOme-Field-Journal-Kit.zip?raw=true) for the APK, walkthrough, importable synthetic rides, live Spark receipt and engineering handoff.

The APK comes from private [build 41920681992](https://github.com/risheekaiyar/ride-ledger/actions/runs/41920681992), source commit `cbf60e4526b36d21380012ccd03be62044bd9838`. Google’s APK verifier confirmed the v2 signature. All 82 packaged dashboard files match that commit. The manifest declares `app.rideledger.fieldjournal`, version `0.4.0-preview`, code 11. The SHA-256 is `64e40932fee87dd9bc02bdcef8680df4f1618de2acc7e56fac0142fe097bcaf1`.

## Recorder release · 0.3.7

[**Download Odo 0.3.7 APK**](https://github.com/risheekaiyar/ride-ledger/raw/refs/heads/main/downloads/ride-ledger-0.3.7-debug.apk)

Sign in with a GitHub account that has access to this private repository.

- Version **0.3.7**, version code **10**; Android **8.0+**.
- Debug build from merged main commit `30fe486d742f90d6a537cb655e503072c8f41ffb`.
- Includes the white/cyan 3D route diorama, racing arrow, manual 360° playback, animated insights, Garage and recorder.
- SHA-256: `aa5717a4295cc8234399509bd1646535a9ec51c7af3cf2536b07624451ac0646`. Also available in [SHA256SUMS](SHA256SUMS).

Download the APK on the phone and open it to install. For an existing installation, export rides first and install as an update. If Android reports a signing-key mismatch, keep the existing app and its data; build with its original signing key instead of uninstalling.

Meta personalization requires a configured companion gateway; no provider key is bundled. Physical phone performance still needs checking. The merged source passed 174 Node tests, Android build/lint and the 17-test Java target. See [build details](../BUILD-STATUS.md) and [the 3D preview](../docs/previews/diorama-insights-synthetic.mp4).
