# Odo ride insights — 0.3.3

Open a saved ride and choose **Play ride insights**. This update was rebuilt from `UI-Improvement`; the rejected `odo/replay-garage-0.3.2` branch was not merged.

| Chapter | Visualization | What it explains |
| --- | --- | --- |
| The journey | White raised GPS silhouette, orthographic isometric camera, garage-matched motorcycle | The exact recorded horizontal route, with visible recording gaps |
| Your pace | Analogue needle, colored speed ranges, per-band percentages | Actual replay speed and time-weighted speed distribution |
| G-force lab | Load radar, recent trace and adjacent synchronized route | GPS-derived forward/braking and, when supported, lateral acceleration |
| The vertical story | Continuous colored 3D elevation ribbon and legend | Source altitude range; gaps remain open |

Default recaps exclude the moving/under-five time donut and the old event-count chapter. Stop/gap questions remain available in the companion. A flat altitude channel does not produce an empty elevation chapter. Recordings without usable measurements show a useful recording-quality explanation.

The route uses every projected GPS vertex. There is no curve smoothing, racing kerb, fake circuit closure or chase camera. Drag horizontally through a full rotation while playback continues; the camera stays where you put it. **Isometric** resets the angle. Optional City/Hills backdrops are peripheral illustrations, not detected geography. The bike family and color come from the recording's saved metadata, with the associated garage profile as a fallback for older recordings.

Pace percentages use observed intervals only and round to a total of one hundred. The needle uses the source speed at the playhead. G-force playback defaults to **2×**, with 1×, 5× and 10× choices, scrubbing and **Jump to strongest estimate**. Other chapters play for ten seconds. Reduced-motion mode starts paused and still permits manual scrubbing and rotation. Controls remain visible on phones and tablets.

## Measurement boundaries

G estimates use consecutive accepted GPS observations: change in speed divided by elapsed time and standard gravity; lateral load uses average speed times heading-change rate divided by gravity. Native intervals must be connected within three seconds and pass location/speed uncertainty limits. Lateral estimates additionally require usable course, tighter fix accuracy and sufficient speed. GPX supplies only a longitudinal estimate. Missing lateral data is shown as unavailable and a horizontal forward/brake indicator, not a zero-lateral dot. Gaps are not bridged. These are **GPS estimates, not motorcycle IMU readings** or riding-skill scores.

Elevation uses a bounded, gap-aware source envelope and an exaggerated display scale. Color denotes source altitude, not road grade. Range does not establish total climbing or a verified altitude datum. Numerical summaries use all supported intervals; visual elevation bins are bounded to ninety-six. The radar's route backdrop is cached and its recent trail uses a bounded lookup.

## Meta performs runtime work

**Make it mine · Meta** opens intent choices, a map section selector, rider-reported stop reason and weather. Selecting a section highlights its actual time range and clock time. **Street map** loads OpenStreetMap roads and landmarks; the offline highlight remains usable without tiles. The Meta model can attach its chapters or follow-up question to one of these validated sections. It receives the elapsed section references, not coordinates or street-map imagery, and must not claim to know a junction or a stop's cause.

The Meta-only gateway calls **`muse-spark-1.3`** at **`https://api.meta.ai/v1/responses`**, with `store:false` and a server-side key. The model orders chapters, selects supported measurement emphasis, interprets patterns, asks map-linked questions and supplies the next-step takeaway. Server and browser validate scene/fact/section references. The app renders quantities from local measurements; model prose cannot introduce new numbers. Raw samples, coordinates, private bike nicknames, ride titles and notes are excluded.

After successful personalization the details collapse, the phone scrolls to the top, and the new recap plays. Reduced-motion preferences keep it paused. Pending or stale replies cannot overwrite a closed recap. Local facts and model interpretations have distinct attribution.

No live Meta credential is configured in this cloud environment. Provider behavior was tested with explicit mocks. Configure the [companion gateway](COMPANION-GATEWAY.md) and perform a real runtime request before demonstrating hackathon eligibility.

## Sharing and validation

The current chapters and captions export locally as an **18-second, 720 × 1280, 24 fps** story. The reviewed MP4 contains **432 H.264 frames**. Route inclusion remains explicit, and no social post is made. Closing, cancelling or backgrounding disposes the private renderer/encoder and restores the ride view.

- [White route, mobile](previews/final-route-mobile-synthetic.png)
- [Analogue pace, mobile](previews/final-pace-mobile-synthetic.png)
- [G radar and route, desktop](previews/final-gforce-desktop-synthetic.png)
- [Elevation ribbon, mobile](previews/final-elevation-mobile-synthetic.png)
- [Watch the updated story](previews/final-insights-synthetic.mp4)

All preview data is synthetic. Model captions and external service responses in regression checks are mocked. `insight-reel-smoke.cjs` exercises all chapters, slow G playback, full manual rotation, 320–1440px layouts, map-linked requests, automatic return/playback, a real video export and reduced motion. `insight-reel-lifecycle-smoke.cjs` covers cancellation, backgrounding, stale replies and rendering fallback. Physical Android performance and live public-map behavior still need the demo device check.
