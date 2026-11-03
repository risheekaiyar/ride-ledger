# Odo / Ride Ledger 0.3.0 — private preview

Independent GitHub build, lint, 10 Java tests, 10 Node tests and APK upload passed: https://github.com/risheekaiyar/ride-ledger/actions/runs/41663136844 .

Prepared 3 November 2026. This is a functional personal journal and recorder preview, not a production social network or a validated riding coach.

## Working in this release

- Shared responsive dark interface for Android and web: Overview, Journeys, Route lab, Garage, Community draft studio and Settings.
- ZIP imports are parsed in a bounded worker on the device. Browser records use IndexedDB; preferences use local storage. Duplicate recording IDs update existing records rather than inflate totals. Legacy recordings with no known activity remain unclassified until edited.
- Dashboard cards can be selected and reordered by drag or accessible arrow buttons. Real imported ride totals update after imports and edits; walks stay separate.
- Offline neon GPS trace, time replay, private GPS speed chart, coordinates/course, raw phone acceleration peaks, sensor timing diagnostics and screen-off coverage. GPS gaps split route lines. GPS course is not a magnetic compass.
- Optional OpenStreetMap tiles rendered by bundled MapLibre GL JS, with 2D, tilted map and globe modes. Loading tiles is an explicit action with a viewed-area disclosure. Globe/tilt is not photorealistic terrain or satellite imagery.
- Editable recurring labels, ride notes, one-time and recurring trip plans; same-direction/placement repeated-location candidates require at least three distinct rides. This is proximity matching, not road map matching or confirmed hazard detection.
- Bike profile, manual odometer, local photo, and milestones based on imported records. No invented lifetime mileage, states visited or network coverage.
- Private share-card drafts omit route, timestamps, speeds and sensor values. A live multi-user feed, following and group invitations are not connected.
- Android retains the foreground recorder and original ZIP export. Dashboard Start/Stop calls it through a restricted bridge. A home-screen widget opens a visible activity before recording, using the last dashboard placement and default motion sensors; first use may request permissions. The notification can stop recording. No floating-overlay permission is required.
- Fixed scalar sensor summaries: Vivo light-sensor vendor extra channels are preserved in raw exports but ignored when calculating lux. Pressure also uses x only.

## Measurement boundaries

Distance is the recorder's preliminary GPS estimate. Its old jitter filter undercounts slow walking, so walking distance is marked uncertain. Speeds are GPS estimates, not an odometer or legal compliance judgement. Altitude lacks recorded vertical accuracy; no verified elevation record is awarded.

Speed-change events use three-sample medians and a centered approximately four-second derivative, requiring contiguous GPS data, acceptable accuracy and speed uncertainty. Thresholds are screening parameters (absolute acceleration at least 1.5 m/s²), not safe/aggressive classification. Missing speed uncertainty suppresses events. Phone impact candidates use resultant accelerometer peaks above 3 g, include gravity, and are capped/deduplicated; they are not confirmed potholes or crash severity. Linear acceleration is the phone vendor's fused estimate.

The supplied handlebar holder slips slightly and receives single-cylinder vibration. The snug pocket still follows rider/body motion. Motorcycle lean, calibrated cornering/braking/acceleration g, road roughness, fuel economy, safe-speed zones and safety scores remain unavailable. Sensor range proximity is surfaced; a clipped peak cannot establish physical impact severity. The approximately 18–20 Hz streams cannot characterize all high-frequency engine vibration; a software filter cannot recover missing information.

## Connections still needed

Muse integration prompts, evidence/tool contracts and evaluation requirements are in MUSE-INTEGRATION.md. No Muse call has been made by this release and no other project's credential is reused. Live model work needs server-only Odo configuration, a bounded budget and a successful non-private test. Deterministic code does filtering/calculation; Muse interprets approved evidence and asks contextual questions.

Google road speed limits require eligible provider access and coverage; Google documents Asset Tracking license availability and data limitations. Do not scrape the Maps UI or invent a speed-limit field. Bike RPM/gears/fuel require a documented compatible telemetry device/protocol. No Bluetooth permission or pairing feature is included yet.

Production community and cross-device synchronization need an authenticated shared service, ownership checks, explicit sharing, moderation/reporting and storage controls. Browser-local drafts and manual ZIP transfers are the current implemented workflow.

## Install and review

Export existing rides, then install the matching locally signed 0.3.0 APK using **Update**. Do not uninstall or clear storage. Open the app; saved original phone rides are imported into its local dashboard when not recording. Classify older generic recordings as ride or walk. Original files remain under the recorder's private storage and can be exported using the top Recorder controls link.

Add the widget from the Android home-screen widget picker: Ride Ledger → Start journey. Test one short parked → walk → parked recording, Stop from the widget or notification, and verify a saved ZIP before the next commute. The new Android WebView/bridge/widget flow has compiled and passed static checks but has not been tested on the owner's phone yet.

Web: import the supplied ZIPs into the private site. They stay in that browser. Another browser/phone has its own records. Export a private JSON backup before clearing browser storage. Hosted source contains no recordings or preloaded private routes.

## Validation

- Android assemble, lint and all 10 Java unit tests passed locally.
- All 10 Node analysis tests passed: GPS rejection/gaps, scalar units, screen-off timing, uncertain walking distance, safe-share field isolation, unique/direction/placement repeat matching, invalid metadata, nonmonotonic sensors, hostile backup IDs and unclassified legacy recordings.
- Browser checks: imported real recording dashboard, widget selection save, timeline playback, walking filter, private share preview and globe rendering using an empty test workspace. Desktop/mobile layout inspected. No real route was sent to a tile service during QA.
- No on-device 0.3.0 test, real Muse response, Bluetooth telemetry, verified speed-limit result or multi-user service is claimed.

## Hackathon

See HACKATHON-CHECKLIST.md. The authenticated rules explicitly list sports analyzers/coaches among generic categories to avoid. Requested track/riding coaching creates a material eligibility concern. Obtain the organizer's determination; renaming the same behavior does not resolve it. No organizer message has been sent. The repository remains private; a public submission must use sanitized source and demo data, with explicit authorization to publish.

## Sources

- [MapLibre globe example](https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-an-atmosphere/)
- [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/)
- [Google Roads speed-limit access and limitations](https://developers.google.com/maps/documentation/roads/speed-limits)
- [Authenticated hackathon rules](https://discord.com/channels/1557169028080869426/1557169028626251800/1564048494178861066)

Bundled dependencies: MapLibre GL JS 5.13.0 and fflate 0.8.2; license files are retained in web/vendor. The static website needs no package installation. Run `node scripts/serve.cjs` for a local preview or `node --test scripts/analysis.test.cjs` for analysis checks. Android's syncDashboard build task copies the same web source into generated APK assets.
