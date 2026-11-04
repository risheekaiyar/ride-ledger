# Odo UI-Improvement — ongoing work

The user explicitly wants iterative improvements to aesthetics and technical data-reading functions while asleep. Continue useful local work and push tested checkpoints regularly to `origin/UI-Improvement`, without force. Preserve user changes and use the existing checkout. No deployment or environment publication is authorized by this continuation.

**Do not pause the entire goal for missing Meta credentials, documentation access or hardware.** Those prerequisites block only their corresponding live checks. UI, analysis, import, export, accessibility and regression improvements remain actionable. Pick the next useful local improvement below, implement it, verify it and push.

## Current capabilities

- Responsive garage with local photo handling, manual odometer (including zero), bike-specific evidence totals, saved bike-type recording defaults and the correct associated-ride Meta debrief. Profile rename leaves historical recording names unchanged; photo remove/reselection and persistence are browser-tested. Reviewed synthetic screenshots are in docs/previews/garage-*.png.
- Offline 3D Track Studio: raised road mesh, red/white kerbs, lit plinth, orbit/flyover/chase/overhead cameras, expanded presentation view with preserved playback, gap-aware replay, source altitude and opt-in PNG export. Browser screenshots were inspected on desktop and portrait, and are committed under docs/previews. WebGL fallback and scene cleanup are tested.

- Ryval-style dark ride library with white raised route silhouettes, date/time/details and teal source-aware peak speeds. Map background is opt-in, filters and rider menu work at narrow widths, and the companion sits beside a readable three-item library dock. Reviewed screenshots are in docs/previews/ride-library-*.png.
- Route-first detail page with a large distance summary, direct Meta debrief card, preserved recording support/context editors and expandable sensor health. The three-item mobile dock and rider menu now work consistently across all pages.
- Sample inspector with explicit measurement provenance, keyboard-accessible chart seeking and elapsed-time inspection of phone motion during GPS gaps.
- Ride instrument panel with playhead speed, channel tabs, time-weighted speed histogram, known/unknown interval breakdown and gap-aware charts. GPX estimates are distinguished from unknown source accuracy; source altitude is not claimed as measured ascent.
- Shared route geometry for thumbnails and replay, including dateline crossings. GPS samples outside the recorded time window are excluded.
- Recording setup now checks native sensor availability and GPS/permission state, permits GPS-only capture, normalizes Pocket/Bag to Not mounted and resets mount security for each ride. The idle widget opens setup after dashboard readiness; active recording Stop remains direct. Browser checks use mock hardware; actual phone behavior needs a trial.
- Evidence v4 keeps missing/malformed screen-state timing unknown, measures only observed intervals and supplies bounded screen coverage to the Meta runtime. Native-import and mock-provider checks pass; no new live requests were made. The localhost:4178 preview was restarted with the updated runtime validator.
- Evidence v3 retains distance-integrity provenance across edits and restores, requires connected GPS time coverage, leaves malformed distance unknown and respects explicit activity over filenames. Legacy journal entries are rechecked without deleting source values/notes; unsupported totals show an em dash. Corrected reimport preserves annotations and can restore evidence-backed confidence.
- Native recordings now export an exact monotonic end timestamp; analysis uses elapsed duration and explicitly labels legacy wall-clock fallbacks. Motion row validation rejects missing axes and out-of-window data.
- Strict GPX XML/namespace validation, timezone-aware timestamps, duplicate handling and per-file batch errors. Invalid optional altitude stays unknown.
- Timed GPX import with content-based IDs separate from native IDs. Native ZIP import preserves bike/placement/mount metadata and user annotations.
- Redesigned motorsport poster editor with orange/ice editions and opt-in 3D route models. Exported PNGs inspected at all three aspect ratios.
- Story PNGs in three formats, explicit route-silhouette opt-in, browser download/share and native Android share-sheet transport through a read-only provider.
- Meta companion evidence preview, bounded follow-ups and citations; compatible-ride selection requires known matching bike/phone/setup.
- Authenticated HTTPS gateway with persistent SQLite request reservations; encrypted Android token storage and a draggable chat overlay. These are built and locally tested; live/hardware behavior remains unverified.

## Next local improvements — no external prerequisites

1. Continue polishing the remaining overview and empty states. Library, route-first details, recording setup and garage now have reviewed mobile layouts.
2. Expose per-channel reported sensor accuracy and clipping diagnostics with clear units. Treat Android status as vendor-reported sensor diagnostics, not calibrated motorcycle accuracy; consider bounded summaries for the Meta debrief.
3. Offline replay video export is feasible: Chromium reported MP4/H.264 and WebM encoders available. This was capability detection only; no video exporter is implemented yet. Verify encoding and native transport before claiming support.
4. Refine garage and empty-state layouts on narrow screens. Audit contrast and touch targets.
5. Improve story composition and editable captions; inspect exported images and their privacy defaults.
6. Add useful local comparison views with explicit comparability rules and time/coverage-aware calculations. Keep raw sensor measurements separate from inferred bike dynamics.
7. Improve rendering performance for long recordings without connecting gaps or discarding extrema silently.

Use judgment to choose other meaningful aesthetic/data-reading work; this queue is not a reason to wait for the user.

## Validation

```
node --test --test-isolation=none scripts/*.test.cjs
source /workspace/ride-ledger-tools/activate.sh
./gradlew assembleDebug lintDebug testDebugUnitTest --no-daemon --max-workers=4
# Start separately: node scripts/serve.cjs
node scripts/ui-smoke.cjs
node scripts/overlay-smoke.cjs
node scripts/telemetry-smoke.cjs
node scripts/library-smoke.cjs
node scripts/track-smoke.cjs
node scripts/story-smoke.cjs
node scripts/gpx-smoke.cjs
node scripts/inspector-smoke.cjs
node scripts/native-import-smoke.cjs
node scripts/recording-smoke.cjs
node scripts/confidence-smoke.cjs
node scripts/garage-smoke.cjs
```

Latest checks: 84 Node tests pass; Android assembly/lint pass with 14 Java tests; browser checks pass for companion, sharing, recording bridge, telemetry, route library and mobile/desktop overflow. Run only checks relevant to each next change. Chromium scripts use synthetic data and mock model responses. Screenshots are temporary review artifacts, not product example rides.

## External checks, kept separate from local progress

- Official Meta documentation at dev.meta.ai is rejected by the managed CONNECT proxy. A model-directed tool loop must wait for verified schema access; don't claim it exists.
- The draft contains additive dev.meta.ai/api.meta.ai network requirements and ODO_META_API_KEY metadata only. No values were supplied, no publication occurred and no paid API calls were made. Managed Node calls need `--use-env-proxy` with inherited trust configuration.
- Live native behavior requires a reachable trusted-TLS gateway, secure client token, provider credential and explicit request allowance. Setup is in COMPANION-GATEWAY.md.
- No Android device is attached. Keystore, overlays, keyboard/rotation, permission revocation and actual sharing receivers need hardware trials.
- Sensor calibration needs labelled real rides. Manufacturer-specific adapters need representative exports. Terrain/satellite rendering needs a selected source with suitable licensing/access.

These external checks do not block the local improvement queue above.
