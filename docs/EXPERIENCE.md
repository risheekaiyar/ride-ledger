# ODOme 0.5.0

This iteration follows the supplied app-experience brief. The main app now has six destinations: Dashboard, Rides, Route Lab, Insights, Community and Garage. Opening a ride leads directly to its Insights.

## Walkthrough

1. **Garage**: save the bike, phone placement and mount condition. Recording setup inherits these values and permits an override. Recorded rides retain their historical setup.
2. **Rides**: record on Android or import an existing ZIP/GPX. Create a journey, then use a ride's **•••** menu to assign or move it, classify the activity, or add a recurring label. Removing an assignment leaves the recording intact. Plan a ride is at the top.
3. **Insights**: choose a ride or journey. Journey totals deduplicate IDs. Each ride has a shared playhead for the actual route, speed dial, elevation and G radar. Drag the elevation to rotate, tap its surface or the route to seek, or select a major event. Playback rates also apply to every chapter of the insight video.
4. **Ask Meta**: opens a separate page. Review the bounded packet, enter a question and explicitly consent before sending. Saved setup and answered pause context accompany the request. No route coordinates are included. Replies are concise and evidence-linked; their summary appears in Insights after a response.
5. **Create a card**: select statistics, add up to three local photos, edit the headline, choose story or square, remix and export PNG. Route shape and speed start unchecked. Android uses its share sheet only on the explicit share action.

The preview contains a clearly marked fictional two-day journey. **My rides** exits it and preserves that choice across browser reloads. Demo records are never inserted into the user's ride database. Opening the preview app afresh starts its sample; the regular recorder build opens the user's dashboard.

## Implemented

- Configurable latest/all-time dashboard and statistic widgets.
- Journey containers, independent original rides, assignment/removal/moving and recurring labels.
- Garage defaults, recording overrides, and historical per-ride setup.
- Responsive six-item navigation at 320, 390, 768 and 1440 pixels.
- Shared playback and region selection; speed-band percentages on the dial arc; rotatable elevation with source metre scale; GPS event ranking with selectable 0.08/0.15/0.25 g thresholds and separate left/right colors when course evidence exists.
- Optional long-pause and planned-route-deviation questions. Recurring pauses require at least three distinct rides, matching labels, proximity and direction; one answer applies to the matched group. Answers, corrections and skips persist.
- Separate Muse Spark companion, bounded journey context of up to eight rides (also subject to the existing packet-size cap), explicit disclosure, no automatic retry.
- Photo/no-photo cards, story/square formats, exact local statistics, route/speed opt-ins and local export.
- Private planning guides and a plainly labelled community-feed prototype.

## Meta verification

One newly authorized **muse-spark-1.3** Standard-mode call completed through the browser's actual consent-and-request flow. It used only the synthetic Mountain crossing ride, `store:false`, no search tools and no retries. Usage: **1,432 input / 1,100 output tokens**, estimated **US$0.006465**, below the US$0.05 authorization. The test had an atomic one-attempt lock and a conservative serialized-request cost guard. The genuine request and response are in [`experience-spark-review.json`](../web/assets/experience-spark-review.json). The sample companion can replay that saved response offline, labelled as a replay and checked against the current evidence.

A read-only model-list request confirmed this ODOme key can see `muse-spark-1.3`, `muse-wonder-1.0`, `muse-image-1.0`, `sam-3.1` and `muse-voice-transcribe-1.0` at test time. Listing is not inference proof.

**Muse Image** is implemented as an optional background request with a fixed theme prompt, one image, explicit consent and the shared request allowance. Enable it on the gateway with `ODO_META_IMAGE_ENABLED=1` only when intended. Personal photos, ride facts and geometry are not sent for background generation. Numbers and routes are composited locally after generation. Provider parsing, failure and consent behavior were tested with a test double; no live image generation was authorized or performed in this iteration.

**Wonder, SAM and transcription remain disabled.** Current API support was checked, but adding inference that was not necessary to this flow would not demonstrate better results. There is no segmentation or transcription claim in the app.

API references checked: [models](https://dev.meta.ai/docs/models), [Muse Image](https://dev.meta.ai/docs/image-generation), [pricing](https://dev.meta.ai/docs/pricing-rate-limits). Spark Standard rates used for the estimate: US$1.25 input / US$4.25 output per million tokens.

## Persistence and compatibility

`odo-private-v1` and its recording schema are unchanged. Organization lives under `odo-prefs-v1.experience` with a versioned, additive migration from the prior field-journal journey titles. Original tracks are not copied or rewritten by journey moves. The existing field-journal store remains available through **Photos & video moments**. Its media/notes have their existing separate-store backup limitation. New experience preferences are included in web backup and restored through validation.

The regular build retains `app.rideledger`. The side-by-side preview uses **`app.rideledger.experience`**, version **0.5.0-preview**, code **12**, label **ODOme Preview**. It coexists with both the existing recorder and 0.4 Field Journal preview, avoiding a signing-key conflict with their private data. Import original ride exports into the new preview when needed. No API key or gateway token is shipped.

## Validation and limits

- **195 Node tests passed**, including the new organization, deduplication, event ranking, recurring-pattern, concise-response and image-consent tests.
- Browser walkthrough: all six destinations at four widths, real application persistence, journey assignment/moving/removal, synchronized play/pause/scrub, phone layout, editable photo card export, privacy defaults, native-bridge setup simulation, recording lock and model outage with no retry.
- Additional browser checks: saved live replay, every reel chapter's speed control, mock Muse Image rendering, partial import success with an invalid GPX, empty recordings and missing channels.
- Source-recording tests use deterministic synthetic phone/GPX fixtures. **No physical phone or new on-road recording was tested.** APK compilation is separate from device/runtime proof.
- Route Lab retains the existing detailed signal explanations and diagnostics. Source altitude is not total ascent; GPS-derived acceleration is not calibrated motorcycle IMU or lean. Missing samples remain gaps.
- Community publishing/accounts, turn-by-turn planning, cloud synchronization, Wonder, SAM and transcription are not delivered services. Competition eligibility and organizer approval are not claimed.

Rollback is the preceding branch commit; the new preview package can simply be left unused without altering the existing recorder's data.
