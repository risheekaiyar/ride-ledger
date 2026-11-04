# Odo animated ride insights

Open a saved ride and choose **Play ride insights**, or use the same action on Overview. The recap is a playable, source-aware visual debrief rather than a collection of chat cards. It runs locally, including without a network connection.

## What is implemented

| Chapter | Visual | Supported insight |
| --- | --- | --- |
| The journey | Moving rider on the raised, lit 3D road model | Recorded route, duration and estimated distance; missing route intervals stay open |
| Your pace | Animated 3D speed-band columns | Time-weighted speed distribution, leading band, observed average and peak |
| Time well spent | Sculpted three-part time ring | Moving, low-speed and unobserved time, plus the longest continuously observed moving stretch |
| Ride flow | Moving scan across a 3D speed trace with event beacons | Saved GPS speed-reduction/increase candidates; **Inspect nearest moment** opens its original signal and time |
| The vertical story | Animated altitude sculpture | Source altitude range and extrema; missing display bins stay open |

Chapters appear only when their measurements are available. GPX imports use interval speed estimates and never acquire phone-sensor events. Ride flow uses existing candidates with an available GPS speed observation; it does not introduce a new event detector. Display geometry is bounded to 96 time bins; numerical summaries use all eligible intervals. Event marks are grouped by time bin, while inspection uses the original event time.

Playback advances through ten-second chapters, with pause, previous/next, direct chapter selection and scrubbing. Metric reveals, camera motion and chapter transitions animate. Mobile playback controls stay visible. Reduced-motion preferences disable automatic playback and camera orbit; facts remain readable without WebGL. Backgrounding pauses playback, and closing disposes the private renderer and restores the original ride viewer.

## Meta does runtime work

**Make it mine · Meta** opens four intent choices: the whole ride, pace/rhythm, highlights/fun facts, and confidence/next ride. The rider can inspect the payload before explicitly choosing **Generate with Meta**.

The existing Meta-only gateway calls **`muse-spark-1.3`** at **`https://api.meta.ai/v1/responses`**, with `store:false`. For a recap, the model receives a bounded fact catalog, source type, time-weighted speed bands and the existing bike/placement/sensor-health context. No route coordinates, raw samples, ride identifiers, titles or notes enter the request. The provider key remains on the server.

The model acts as the recap's editor: it orders the available visual chapters, chooses which supported measurements to emphasize, writes each headline and interpretation, and proposes a useful next step. This is a separate strict structured-output contract from ordinary companion chat. Both server and browser validate the returned scenes and fact references. The application renders all numerical values from local measurements; model prose containing digits is rejected. Missing, duplicate or unsupported scenes and inconsistent input time totals are rejected. Only one whole ride enters a recap request.

Model interpretations are labeled **META / PERSONALIZED**. The offline alternative is labeled **ON-DEVICE / RIDE FACTS**. Replies are cached only in memory for the same ride and evidence fingerprint. Closing a recap prevents a late reply from overwriting another view. Runtime requests still consume the configured bounded allowance.

This checkpoint was tested with **mock provider replies**, not a live Meta call: the current cloud runtime has no Meta credential configured. A real model call in the finished project's runtime remains necessary for hackathon eligibility. See [the runtime setup](UI-IMPROVEMENT.md) and [the companion gateway](COMPANION-GATEWAY.md) for connection details. No environment or application was published during this work.

## Share the animated insight

Expand **Export an animated story**, explicitly include the route shape, displayed stats and captions, then render. The result is an **18-second, 720 × 1280** film using the current local or Meta-curated chapter sequence and captions. Supported browsers render all **432 frames at 24 fps** into H.264 MP4; the existing real-time codec fallback remains available. Saving stays local; Android uses the existing native share-sheet transport.

The renderer is reused for one chapter at a time, with no simultaneous main-view scene. Cancellation, backgrounding or closing cancels the encoder, removes temporary renderers, revokes obsolete media URLs, and restores the recap. Changing narration invalidates a previous export. Physical Android codecs and receiving apps still need device trials.

## Demo and reviewed artifacts

1. Import a timed GPX or phone recording and open **Play ride insights**.
2. Play through the route, pace and time ring; use a recording with saved speed-change candidates for Ride flow.
3. Select **Make it mine · Meta**, choose an intent and generate. In a configured runtime, show how the model changes the order, measurement emphasis, explanations and takeaway.
4. Inspect a Ride flow marker in the original signal timeline.
5. Export and play the animated story.

The committed [synthetic MP4](previews/insight-recap-synthetic.mp4) uses explicitly mocked model captions and a synthetic circuit, not a rider's private data or evidence of a live model call. Desktop and mobile previews include `insight-route-desktop-synthetic.png`, `insight-pace-mobile-synthetic.png`, `insight-flow-mobile-synthetic.png` and `insight-meta-mobile-synthetic.png`.

## Validation

- Node coverage includes weighted intervals, threshold crossings, missing intervals, stationary/empty trips, GPX provenance, candidate filtering, bounded long-ride geometry, strict model contracts and privacy exclusions.
- `scripts/insight-reel-smoke.cjs` checks actual rendered frame changes, pause/scrub, all chapter types available to its GPX fixture, responsive controls, model-directed order/fact emphasis and a real decoded video export.
- `scripts/insight-reel-lifecycle-smoke.cjs` checks the native Ride flow scene, exact event inspection, cancellation/background/close, late model replies, WebGL fallback and Overview entry.
- Existing overview/track browser regressions and Android `assembleDebug lintDebug` cover integration.

No chapter claims calibrated lean, throttle technique, road cause, legal-speed adherence or an overall riding-skill/safety score. Altitude range is not accumulated ascent. The model can explain recorded pace and rhythm and suggest a useful follow-up, but the supplied phone evidence does not establish those unsupported measurements.
