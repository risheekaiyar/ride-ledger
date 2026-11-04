# Final 0.3.3 update — November 4, 2026

Rebuilt on `UI-Improvement` from `b10921e`; the rejected Sol branch `odo/replay-garage-0.3.2` was not merged. User authorized committing/pushing this final major update, not publishing or deployment.

Current details supersede the historical checkpoint notes below: [Animated insights](ANIMATED-INSIGHTS.md), [Garage](GARAGE.md), [Track Studio](TRACK-STUDIO.md). White exact-GPS route, manual isometric rotation, saved bike markers, analogue speed bands, slow G radar/map, continuous elevation, map-linked Meta follow-ups with auto-return/replay, family illustrations, interactive cluster, odometer reconciliation, public reference library and refreshed actions are implemented.

The cloud runtime has no Meta key. Provider/public map/photo responses are mocked in browser checks; actual video encoding and local graphics are exercised. OEM CAD, a true calibrated bike IMU, real engine telemetry and automatic photo-to-3D reconstruction are not implemented or claimed.

Validation: 162 Node tests; 17 Java tests; Android assemble/lint; route, recap, lifecycle, Garage, recording and Overview browser smokes pass. Actual H.264 output: 18 seconds, 432 frames, 720 × 1280. APK local copy: `dist/ride-ledger-0.3.3-debug.apk`. Current preview server is port 4178 (shell session 90128).

## Historical checkpoints (superseded where noted above)

# Odo UI-Improvement — animated insight checkpoint

The user resumed work because static explanation cards did not fulfill the requested Ryval-like animated insight experience. This checkpoint makes the visual recap a primary ride/Overview action and gives Meta runtime responsibility for chapter order, fact emphasis, interpretations and the next-step takeaway.

Regular commits and pushes to `UI-Improvement` remain authorized. No deployment, merge or environment publication is authorized. The cloud runtime currently has no Meta credential; this pass uses explicit provider mocks and does not claim live-model or physical-device verification.

## Current capabilities

- Animated insights: up to five source-gated 3D chapters (route, pace, time ring, saved speed-change flow and source altitude), animated metric reveals, play/pause/scrub, fixed mobile controls, exact candidate-to-sensor-window inspection, Meta-curated ordering and measurement emphasis, strict recap contracts, and a real 18-second / 432-frame H.264 story export. Reviewed synthetic artifacts and details are in ANIMATED-INSIGHTS.md. Current preview server is shell session 93789 on port 4178. Validation: 152 Node tests, animated-recap/lifecycle/overview/track browser checks, Android build/lint and decoded 720×1280 H.264 output all pass.

- Final pass: separate raw acceleration, linear acceleration and angular-speed traces, readable sub-unit scales, small nonzero readouts and exact phone-channel restoration through Meta citations. The companion has six context-sensitive insight directions, locally calculated evidence cards and styled model observation/follow-up cards. Requests remain explicit and Meta-only; pending questions cannot be edited away. Browser replies are mocked; the cloud preview has no configured Meta credential. See COMPANION-INSIGHTS.md and SIGNAL-INSPECTION.md.

- Motion Studio now exports Story 9:16 (720×1280), Portrait 4:5 (720×900) and Square 1:1 (720×720). Each has its own typography/layout, scene dimensions and camera framing; compact versions use a lower angle. Changing format invalidates old media, rechecks encoder dimensions and ignores stale asynchronous responses. Real 12-second / 288-frame H.264 clips and decoded frames are reviewed for every format. See RIDE-FILM.md and film-formats-smoke.cjs.

- Recorded moments now open their exact time in a 15-second speed or motion window from both ride details and Route Lab review. The source-labelled list starts with three candidates and appends six with keyboard focus. Invalid/duplicate/out-of-window candidates are excluded; source arrays, summary values and the live detail camera remain intact. Missing GPS or channels stay unknown. See SIGNAL-INSPECTION.md and moments-smoke.cjs.

- Focused Meta debriefs now attach a bounded complete-second summary from a selected trace window, with explicit payload review/send, one-ride scope and citations that restore the original range/channel. GPS coverage, phone-motion bin summaries and source-altitude fixes remain separate; recording-wide diagnostics are labelled. Fractional timing, zero GPS, private-field exclusion, server validation and responsive layouts are tested. See FOCUSED-DEBRIEF.md.

- Full 3D Track Studio now has brighter asphalt, taller contrasting side walls, wider kerbs and a lower overview angle for phone readability. Open segment ends are capped, and coincident route endpoints use a continuous closed curve with matching normals. Tall story posters use a dedicated camera angle; source samples/elevation are preserved. Track, poster and real 24 fps MP4 checks pass; reviewed track/open-route/film/poster artifacts are refreshed. See TRACK-STUDIO.md.

- Ride-detail traces now offer fixed whole/5-minute/1-minute/15-second windows, pan and recenter controls, shared replay seeking and original-sample inspection. Connected lines clip at the edges without filling gaps; ride-wide summaries stay unchanged; focused Meta debriefs add a separate bounded summary. Zero-GPS recordings now allow phone-motion chart/keyboard inspection. Range changes preserve the live 3D canvas and camera. See SIGNAL-INSPECTION.md and trace-window-smoke.cjs.

- Ride library now renders 20 previews at a time with local title/bike/recurring-route search. Batches append without replacing existing SVGs or the consented map; filter/search updates preserve input focus and composition. Active criteria, result labels, keyboard focus, partial final batches, late import ordering and return navigation are covered by library-batches-smoke.cjs. Storage still loads all analyzed records. Reviewed synthetic search/footer previews are in docs/previews. See RIDE-LIBRARY.md.

- Returning riders now land on the Ryval-style Rides sheet; empty journals get a new welcome with a bundled motorcycle illustration. Overview shows the latest ride, Meta debrief, customizable source-aware totals and manual odometer (zero preserved), without a duplicate WebGL scene. Its floating companion and story/debrief actions target the displayed latest ride. Startup waits for DOMContentLoaded before native readiness. SVG arrows replace missing glyphs. See OVERVIEW.md.

- Signal charts now render bounded min/max ranges for long traces, mark subpixel missing intervals and preserve original samples for touch/keyboard inspection. Comparison shows both actual time bins at the same elapsed percentage; single-ride motion no longer bridges missing bins. 86,399-bin comparison and 50,000-fix browser fixtures pass. Large altitude arrays avoid argument limits; hour-long timestamps use h:mm:ss. Companion history resets when the selected pair changes even if summaries match. See SIGNAL-INSPECTION.md.

- Route Lab now has explicit two-ride comparison, setup and coarse same-direction GPS checks, three gap-aware phone-signal charts, equal-weight complete-second median/P95 summaries, and blocked deltas for insufficient diagnostics. The selected pair and failed checks enter bounded Meta evidence without identifiers or coordinates. Context editing preserves pair selection. See RIDE-COMPARISON.md.

- Motion Studio renders local 12/18-second 3D clips in three aspect ratios. Preferred H.264 encoding renders every frame into a 24 fps MP4; real-time MP4/WebM fallback rejects insufficient render frames. Route inclusion is required explicitly and speed defaults off. Cancellation/background/close cleanup, native share callbacks, old APK behavior and 320–1440px layouts are browser-tested. Java validates bounded local media before read-only sharing; physical codec/receiver trials remain pending. Reviewed synthetic MP4 and screenshots are in docs/previews. See RIDE-FILM.md.
- Evidence v5 adds source-aware sensor cards, endpoint gaps, vendor-status distributions and validated per-axis near-range checks. Invalid ranges no longer flag every sample; interpolated percentiles fix small-sample ordering; blank timestamps/axes remain missing. The Meta packet includes validated motion-channel diagnostics, exercised with a mock provider. Local preview restarted with the focused evidence validator (shell session 19273, port 4178).
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

## Potential future work — only if the user resumes

1. Continue improving large-library storage and import performance. Initial preview rendering now uses 20-row batches; IndexedDB still loads all analyzed recordings. Consider loading lightweight journal metadata separately from full sample arrays while preserving backups and evidence access.
2. Continue refining long-recording inspection. Recorded candidates now open their exact timestamp and focused signal window. Consider a clearer overview of recording gaps or gap navigation; raw, linear and angular phone channels are now individually selectable; actual bike calibration still needs labelled recordings.
3. Improve motion/story composition using actual exported frames and clips. Video export is now implemented and inspected; all three aspect ratios are implemented; consider more camera treatments or stronger open-route compositions while retaining source labels and opt-in speed. Keep native hardware behavior explicitly unverified until a physical test.
4. Refine garage and empty-state layouts on narrow screens. Audit contrast and touch targets.
5. Improve story composition and editable captions; inspect exported images and their privacy defaults.
6. Improve comparison interpretation and evidence inspection. Keep raw phone signals separate from inferred bike dynamics.
7. Continue checking large imports and route-list performance. Long signal traces now use bounded range displays without changing statistics or original-sample inspection.

This is a backlog for a future user-authorized session, not an instruction to continue after this checkpoint.

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
node scripts/library-batches-smoke.cjs
node scripts/track-smoke.cjs
node scripts/story-smoke.cjs
node scripts/gpx-smoke.cjs
node scripts/inspector-smoke.cjs
node scripts/trace-window-smoke.cjs
node scripts/moments-smoke.cjs
node scripts/focused-companion-smoke.cjs
node scripts/motion-channels-smoke.cjs
node scripts/companion-brief-smoke.cjs
node scripts/native-import-smoke.cjs
node scripts/recording-smoke.cjs
node scripts/confidence-smoke.cjs
node scripts/garage-smoke.cjs
node scripts/sensor-health-smoke.cjs
node scripts/ride-film-smoke.cjs
node scripts/film-formats-smoke.cjs
node scripts/film-codec-smoke.cjs
node scripts/compare-smoke.cjs
node scripts/comparison-inspector-smoke.cjs
node scripts/long-trace-smoke.cjs
node scripts/overview-smoke.cjs
```

Latest checks: 143 Node tests pass; Android assembly/lint pass. Individual motion channels, small values, no-GPS seeking, selected-channel Meta citations, six insight directions and evidence/response cards pass responsive Chromium checks. General UI, paired comparison, focused debrief, sample inspection and native overlay regressions also pass. Model responses are mocked. Actual story, portrait and square H.264 exports pass dimensions/frame-count/duration checks. Format changes, stale codec callbacks, old-media invalidation and closed-dialog cleanup pass; the real-time WebM fallback also passes. Moment navigation covers chronological batches, exact seeking, camera/source retention, gaps, missing channels and short recordings in 320–1440px Chromium layouts. Existing trace-window, focused-companion and comparison checks pass. The focused debrief passes explicit-send, privacy, interval restoration, fractional timing, zero-GPS and responsive browser checks, plus existing comparison, general UI, trace-window and overlay regressions. No live model request was made in this pass. The 3D refinement passes track, poster and actual H.264 export browser checks, with reviewed open-route and refreshed motion artifacts. The preceding focused-window pass verified original-sample, telemetry, long-trace and 3D replay regressions. The preceding library batching/search pass also passed library, overview and UI browser checks. Previous checkpoints ran 17 Java tests successfully; this focused-window pass changes no Java. Comparison browser checks cover pair selection, context editing, explicit mocked Meta requests, citation navigation and 320–1440px widths. Motion export, 3D track and poster browser checks pass, including actual H.264 frame count/duration inspection and explicit sharing. Earlier checks cover sensor diagnostics, native ZIP import, sample inspection, confidence persistence, companion, recording setup and route library. Run only checks relevant to each next change. Chromium scripts use synthetic data and mock model responses. Screenshots and clips are review artifacts, not product example rides.

## External checks, kept separate from local progress

- Official Meta documentation at dev.meta.ai is rejected by the managed CONNECT proxy. A model-directed tool loop must wait for verified schema access; don't claim it exists.
- The draft contains additive dev.meta.ai/api.meta.ai network requirements and ODO_META_API_KEY metadata only. No values were supplied, no publication occurred and no paid API calls were made. Managed Node calls need `--use-env-proxy` with inherited trust configuration.
- Live native behavior requires a reachable trusted-TLS gateway, secure client token, provider credential and explicit request allowance. Setup is in COMPANION-GATEWAY.md.
- No Android device is attached. Keystore, overlays, keyboard/rotation, permission revocation and actual sharing receivers need hardware trials.
- Sensor calibration needs labelled real rides. Manufacturer-specific adapters need representative exports. Terrain/satellite rendering needs a selected source with suitable licensing/access.

These are remaining validation/integration tasks for a future session. The current session stops at the user-requested final checkpoint.
