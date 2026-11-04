# Odo UI-Improvement — ongoing work

The user explicitly wants iterative improvements to aesthetics and technical data-reading functions while asleep. Continue useful local work and push tested checkpoints regularly to `origin/UI-Improvement`, without force. Preserve user changes and use the existing checkout. No deployment or environment publication is authorized by this continuation.

**Do not pause the entire goal for missing Meta credentials, documentation access or hardware.** Those prerequisites block only their corresponding live checks. UI, analysis, import, export, accessibility and regression improvements remain actionable. Pick the next useful local improvement below, implement it, verify it and push.

## Current capabilities

- Offline 3D Track Studio: raised road mesh, red/white kerbs, lit plinth, orbit/flyover/chase/overhead cameras, gap-aware replay, source altitude and opt-in PNG export. Browser screenshots were inspected on desktop and portrait, and are committed under docs/previews. WebGL fallback and scene cleanup are tested.

- Dark motorsport/editorial mobile presentation, real route thumbnails, explicit source badges and mobile Settings navigation.
- Ride instrument panel with playhead speed, channel tabs, time-weighted speed histogram, known/unknown interval breakdown and gap-aware charts. GPX estimates are distinguished from unknown source accuracy; source altitude is not claimed as measured ascent.
- Shared route geometry for thumbnails and replay, including dateline crossings. GPS samples outside the recorded time window are excluded.
- Strict GPX XML/namespace validation, timezone-aware timestamps, duplicate handling and per-file batch errors. Invalid optional altitude stays unknown.
- Timed GPX import with content-based IDs separate from native IDs. Native ZIP import preserves bike/placement/mount metadata and user annotations.
- Redesigned motorsport poster editor with orange/ice editions and opt-in 3D route models. Exported PNGs inspected at all three aspect ratios.
- Story PNGs in three formats, explicit route-silhouette opt-in, browser download/share and native Android share-sheet transport through a read-only provider.
- Meta companion evidence preview, bounded follow-ups and citations; compatible-ride selection requires known matching bike/phone/setup.
- Authenticated HTTPS gateway with persistent SQLite request reservations; encrypted Android token storage and a draggable chat overlay. These are built and locally tested; live/hardware behavior remains unverified.

## Next local improvements — no external prerequisites

2. Improve chart accessibility and keyboard inspection; keep route, telemetry cursor and visible sample readouts synchronized.
3. Refine garage, recording-setup and empty-state layouts on narrow screens. Audit contrast and touch targets.
4. Improve story composition and editable captions; inspect exported images and their privacy defaults.
5. Add useful local comparison views with explicit comparability rules and time/coverage-aware calculations. Keep raw sensor measurements separate from inferred bike dynamics.
6. Improve rendering performance for long recordings without connecting gaps or discarding extrema silently.

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
```

Latest checks: 54 Node tests pass; Android assembly/lint pass with 12 Java tests; browser checks pass for companion, sharing, recording bridge, telemetry, route library and mobile/desktop overflow. Run only checks relevant to each next change. Chromium scripts use synthetic data and mock model responses. Screenshots are temporary review artifacts, not product example rides.

## External checks, kept separate from local progress

- Official Meta documentation at dev.meta.ai is rejected by the managed CONNECT proxy. A model-directed tool loop must wait for verified schema access; don't claim it exists.
- The draft contains additive dev.meta.ai/api.meta.ai network requirements and ODO_META_API_KEY metadata only. No values were supplied, no publication occurred and no paid API calls were made. Managed Node calls need `--use-env-proxy` with inherited trust configuration.
- Live native behavior requires a reachable trusted-TLS gateway, secure client token, provider credential and explicit request allowance. Setup is in COMPANION-GATEWAY.md.
- No Android device is attached. Keystore, overlays, keyboard/rotation, permission revocation and actual sharing receivers need hardware trials.
- Sensor calibration needs labelled real rides. Manufacturer-specific adapters need representative exports. Terrain/satellite rendering needs a selected source with suitable licensing/access.

These external checks do not block the local improvement queue above.
