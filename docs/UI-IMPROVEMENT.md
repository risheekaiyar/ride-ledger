# Odo ride studio

The UI-Improvement branch adds a warm charcoal/orange design with editorial typography, a prominent Odo companion entry, mobile controls, a rider-context editor, road-observation labels and a motorsport poster exporter (9:16, 4:5, 1:1). PNGs contain rounded distance and duration; route silhouettes are explicit opt-in because even an unlabelled shape can reveal locations. The Android app shares generated PNGs through a private read-only content provider and the system share sheet. Browsers use Web Share when supported and download otherwise. Only the generated image is granted to the chosen receiver, never the ride database or raw exports. Nothing is posted automatically.

## Imports and measurement

Ride Ledger ZIP imports remain supported. Timed GPX track exports from manufacturer apps, Calimoto and similar tools can be imported when those apps provide GPX. This is file interoperability, not an authenticated provider connection. Route-only planning GPX, missing timestamps, invalid coordinates, nonmonotonic times and tracks over 24 hours are rejected. GPX records use deterministic content IDs in a separate namespace from native start-time IDs; renaming an export does not duplicate it. Source GPS accuracy is unknown, gaps are excluded from geometric distance, and imported trips begin unclassified. No ABS, fuel, tyre pressure or calibrated bike lean is invented. GPX has no raw phone motion.

Phone placement, bike identity/type and mount stability are rider-entered context. The Android record form captures these before starting and stores them in ZIP metadata; the analysis pipeline preserves them. Existing deterministic filtering remains responsible for measurements. This change does not validate a new sensor-fusion or calibration algorithm. Road-memory labels belong to the rider and are not independently confirmed potholes. They persist locally; automatic longitudinal road-memory learning is not implemented.

## Meta at runtime

The local Node server calls only Meta `muse-spark-1.3` through `https://api.meta.ai/v1/responses`, with `store:false`, bounded input, a request allowance, a timeout and schema validation. The model explains deterministic ride evidence, considers bike/placement/mount context and rider observations, and proposes a follow-up question. A comparison includes a second ride only if recurring label, placement, known bike identity, phone model and bike type match, with stable mounts reported for both. This is a comparability gate, not physical calibration. Bike identity and phone model remain local and are not sent to Meta. Exact route, timestamp, raw samples and freeform ride notes are excluded from the evidence packet. The user previews the fields before sending; the typed question is sent as written. Model output remains evidence-linked and is escaped for display.

Configure `ODO_META_API_KEY` securely on the server and an explicit `ODO_META_MAX_REQUESTS` allowance. Run `node scripts/serve.cjs`. The environment used for this implementation had neither variable, so provider requests were tested with the existing mock, not a live API call. The allowance is in-memory and resets on restart. There is no production authentication or persistent billing control; keep this server loopback-only.

Demo: import a ride, classify it, set its bike/phone context, label a candidate observation, choose **Debrief with Odo**, review the packet and submit. Show the Meta response and linked evidence alongside the locally calculated values. A demo with the model disabled does not establish hackathon runtime eligibility. No non-Meta runtime models are called. Bounded follow-up conversation is implemented: the last two question/summary pairs are previewed and sent as untrusted history. The current evidence is authoritative; conversations reset when the evidence changes. Clicking an observation’s evidence link opens that ride. Conversations stay in memory until reload. A model-directed tool loop remains future work.

## Platform limits

Android includes an explicitly enabled draggable chat overlay with a foreground notification, collapse and dismissal actions. It loads only local app assets and uses the native HTTPS transport. Overlay permission is granted in system settings; permission revocation is checked while running. Hardware validation, keyboard/task-switch testing and a live gateway connection are still required. iOS has no equivalent arbitrary cross-app overlay. The Android transport and authenticated HTTPS gateway are implemented; see [gateway setup](COMPANION-GATEWAY.md). Settings opens a native connection dialog. The client token is encrypted using an Android Keystore key and is never returned to JavaScript. Provider keys remain on the server. No reachable production gateway or live provider credentials have been configured here, so live model behavior inside the APK remains unverified.

The default route view is now the offline [3D Track Studio](TRACK-STUDIO.md), with a road mesh, kerbs, lighting, replay cameras and opt-in source altitude. An optional geographic MapLibre view remains available. Satellite terrain and video export are not implemented. Direct manufacturer/CaliMoto account sync, community accounts, real-time routing and bike telemetry require separate integrations and representative exports or API access.

## Validation

`node --test --test-isolation=none scripts/*.test.cjs`

`source /workspace/ride-ledger-tools/activate.sh && ./gradlew assembleDebug lintDebug testDebugUnitTest --no-daemon --max-workers=4`

Run `node scripts/ui-smoke.cjs` with Playwright, `/usr/bin/chromium` and the local server on port 4178. Browser checks cover mobile overflow, GPX import, mocked Meta follow-ups and evidence navigation, story formats and the native recording-context bridge contract. Earlier browser checks also exercised PNG download and road-memory empty states. Physical sensor accuracy, overlay lifecycle and phone sharing need on-device trials. The environment draft now contains additive requirements for dev.meta.ai and api.meta.ai access plus an ODO_META_API_KEY secret binding. These requirements are saved for review only; no secret value was entered, runtime application verified or environment published.

## Ride instruments and technical reading

The ride detail screen now places a broadcast-inspired instrument panel below route replay. The playhead speed, channel tabs (speed, source elevation and raw phone motion), time-at-speed histogram and observation coverage share the same timeline. The plot can seek to the nearest recorded sample. Mobile Settings remains visible in the navigation.

Histogram durations are time-weighted and split at speed-band crossings. Native GPS intervals require valid endpoint speeds, matching segments and at most three seconds between samples. Imported GPX uses its geometric interval estimate, with a maximum connected interval of thirty seconds. Missing values, segment breaks, out-of-ride timestamps and overlapping intervals are excluded. Unknown time is not labelled stopped; under-five-km/h observations are explicitly low speed. Coverage reports available speed intervals, not positional accuracy. Source altitude is a raw profile with unknown vertical accuracy; it is not accumulated as a claimed ascent value.

GPX summary cards show mapped distance and estimated interval speeds while stating that fix accuracy is unknown. Empty motion channels and missing raw sensors have explicit empty states. `node scripts/telemetry-smoke.cjs` checks channel selection, timeline seeking, GPX traces, mobile Settings and mobile/desktop overflow. Synthetic traces test the interval calculations; they do not establish real-world sensor accuracy.

The ride library now shows real route thumbnails and explicit import/phone-source labels. A shared local projection keeps thumbnails and replay aligned and unwraps dateline crossings. GPS samples outside recording duration are rejected before entering event evidence. `node scripts/library-smoke.cjs` checks synthetic route thumbnails, long-title wrapping and mobile replay geometry.

## Poster studio

Share cards now have racing typography, finish-line details, orange/ice editions and responsive compositions for all three social formats. The route-free edition is the default. Explicitly enabling the route builds the same offline 3D track model into the poster; WebGL failure uses the shared gap-aware/dateline-aware 2D projection. Source altitude stays off for these exports. No coordinates, dates, bike identifiers or raw samples are printed. GPX mapped distance is rounded and labelled an estimate; unavailable native distance remains blank.

The editor releases its temporary WebGL scene after rendering each format. Downloads and native image sharing use the existing PNG transport. `node scripts/story-smoke.cjs` verifies route opt-in, real 3D image creation, three sizes, two editions, export, mobile layout and cleanup. The exported PNGs were visually reviewed. [Story preview](previews/poster-story-synthetic.png) and [square preview](previews/poster-square-synthetic.png) use the synthetic circuit fixture, not a user recording.

## GPX input validation

GPX parsing now reads only direct GPX track/segment/point fields from supported 1.0/1.1 namespaces (or legacy unnamespaced GPX). Blank, missing and non-decimal coordinates are rejected. Times require a valid calendar date and explicit UTC/offset timezone; local-time ambiguity is not silently resolved using the importing device. Exact duplicate samples are removed and reported. Conflicting equal timestamps and backwards time fail with the point number. Invalid optional altitude becomes unknown with a warning while valid route positions remain usable. Each file in a batch has its own outcome, so a malformed file does not erase successful imports.

`node scripts/gpx-smoke.cjs` tests namespace/extension boundaries, malformed fields, duplicate handling, segment preservation and mixed batch outcomes in Chromium. `scripts/gpx.test.cjs` covers decimal and calendar/timezone validation.
