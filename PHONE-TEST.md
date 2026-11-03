# Test 0.3.0 first

Export old rides, then install dist/ride-ledger-0.3.0-debug.apk as Update. Keep existing app/storage. Saved rides load into Odo when recording is stopped; classify older generic recordings before using totals. The top Recorder controls link retains original controls/export.

While parked, select activity/placement, start a short walk, lock the screen, then stop while stationary from notification or home-screen widget. Confirm dashboard import and original ZIP export. Add the widget via Android's home-screen widget picker (Ride Ledger). First use may request precise location and notifications. The widget opens the app before recording; no overlay permission is needed.

For web review, import the same ZIPs into the private website. Each browser has its own records. Load optional map tiles only if you want OpenStreetMap to receive the viewed area. Globe/tilt does not provide satellite/terrain imagery. Bike lean, impact severity and safety scoring are not validated.

These Android dashboard/bridge/widget changes compiled and passed static checks but still need a real-phone trial. See docs/RELEASE-0.3.md.

## Earlier 0.2.0 testing notes

# Install and test on the Vivo X300 Pro

This is a debug prototype. A successful build does not prove that your phone records reliably with its screen locked.

## Version 0.2.0 sensor test

Install `dist/ride-ledger-0.2.0-debug.apk` over the previous local APK, after exporting your recordings. Choose sensors before Start: accelerometer, gyro, rotation, gravity and linear acceleration are useful for a motion test; magnetic field and light are optional. Pressure is recorded only if available. There are no additional Android permissions in this update.

While stationary, record 30 seconds on a table, then 30 seconds of gentle phone movement, then leave it still again. Repeat a short walk with the screen locked, using the same placement. Stop and view saved rides for a sensor summary. Exported ZIPs additionally contain `sensor_summary.json` and `events.csv`; the latter should contain the screen transition and ongoing sensor rows should cover the interval. A light sensor in a pocket can read near zero or produce no changes. Never infer sensor gaps from on-change sensors alone.

Mean/RMS/peak describe phone-sensor vector magnitude, not road quality or a riding score. Accelerometer magnitude includes gravity (roughly 9.8 m/s² at rest), linear acceleration ideally approaches zero at rest but can retain bias/filtering error, and gyro measures phone rotation rate in rad/s. Magnetic fields can be distorted indoors or near metal; light measures illumination at the phone, not the road. Optional outputs must be validated on this phone before interpreting them.

## Install

1. Copy `dist/ride-ledger-0.2.0-debug.apk` to your phone using USB or your usual file transfer method. Install over the earlier local APK; do not routinely uninstall or clear storage, which erases private recordings.
2. Open the APK in the phone's Files app. If Android asks, allow that file app to install this APK. Follow Android's installation prompts yourself.
3. Open **Ride Ledger**. Turn on phone Location. Tap **Start commute**, allow notifications, then tap Start again and allow **Precise location / While using the app**. Tap Start once more if prompted. Approximate location is insufficient for this trial.
4. If a permission was denied permanently, enable it through Android Settings → Apps → Ride Ledger → Permissions or Notifications. The app deliberately requires visible notifications for recording.

No login, internet connection, Meta key, payment, or bike connection is needed. First GPS acquisition outdoors can take time. This app records the phone's motion, not Xpulse engine or bike telemetry.

## Five-minute walk before the commute

1. Outside, while stationary, choose **Pocket** or **Bag** to match where the phone will actually stay.
2. Start. Wait for GPS fixes in the status. Check the GPS uncertainty; a fix worse than ±30 m is retained but flagged.
3. Note the time, lock the display, and walk for five minutes. Keep the same pocket or bag throughout. Do not force-stop the app or use Android's Stop-app control.
4. Stand still, unlock if needed, open the notification shade and tap **Stop & save**. Confirm the recording notification disappears.
5. Open Ride Ledger → **View saved rides**. A normal walk should show `end_reason: user_stopped`, roughly five minutes plus the setup/wait period, and nonzero GPS/motion counts. The displayed summary is basic diagnostic text in this version.
6. Tap **Export a saved ride (ZIP)** and choose the walk. Save the ZIP using Android's document picker. Check the app reports **Export saved**.
7. The ZIP should contain `gps.csv`, `motion.csv`, `metadata.json`, and `summary.json`. Inspect time coverage through the locked interval. GPS can drop out; a large sensor gap outdoors while walking needs investigation. The number of rows depends on which sensors this Vivo exposes; pressure may be absent or emit slowly.

If screen-off data stops, inspect the phone's app battery settings for Ride Ledger. Vivo's menu labels vary; allow background activity / avoid restrictive battery optimization for the trial, then repeat the walk. There is no on-device validation yet that proves this setting is required or sufficient.

## Lifecycle checks, while stationary

- Tap Start twice quickly: only one recording should appear.
- Start, immediately tap Stop, wait for the notification to disappear, then Start again: two separate recordings, no mixed samples.
- During recording, return Home and reopen: status should still show recording. Rotate the screen if rotation is enabled; recording should continue.
- Turn Location off briefly: motion should continue; GPS resumes after Location is re-enabled and fixes return.
- Stop from the notification and separately from the app; both should produce a finalized summary.
- Cancel the export picker: original data remains. Repeat export. Rotating during the picker should preserve the selected ride.
- Optional interruption test using only a disposable walk: Android Settings → Apps → Ride Ledger → Force stop, then reopen. Previously flushed raw files may remain but a final summary may be missing. This app does not auto-resume or invent a successful ending. Up to the last five seconds of buffered data, and possibly more after abrupt filesystem/device failure, may be lost.

## First office commute

Proceed only after the locked walk passes. Start and stop while parked; never interact while riding. Use consistent placement and export privately after parking. Keep expectations to time-stamped GPS and phone motion. GPS distance is preliminary and may undercount because short/noisy segments are filtered. Pocket/bag vibration does not establish potholes, road roughness, motorcycle lean, crashes, braking safety, or calibrated scores.

The four-hour timer stops an uninterrupted service; Android/OEM termination can happen sooner. A partial wake lock helps retain samples but consumes battery. The recorder does not restart after process death, force-stop, reboot or a crash. A missing summary indicates an unfinished or failed recording.

## Privacy and updates

Exports contain precise routes and device model. Keep them out of GitHub, screenshots, public demos and source ZIPs. Saving to a cloud provider manually sends that ZIP to that provider. App data is private, with backups/transfers excluded in the manifest; manually exported copies are separate.

Uninstalling or clearing storage erases private rides. Export before either action. Debug APKs built on different machines may use different signing keys and fail to update an existing installation. Do not uninstall to resolve that until your rides are exported. This is not a Play Store release build.

## Share source with your brother

The **private** source repository is https://github.com/risheekaiyar/ride-ledger . See COLLABORATION.md for remote development. Publish only source files tracked by Git; `tools/`, `dist/`, caches, APKs and local paths are ignored.

Once the repository exists, VarunAiyar can use his own GitHub and Codex account to work from a clone after you separately grant the appropriate repository access. No invitation has been sent. His Pro subscription does not itself grant access to your private repository. Confirm competition team/contribution eligibility before using another person's work in an entry.
