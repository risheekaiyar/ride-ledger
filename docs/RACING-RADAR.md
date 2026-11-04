# Racing replay and elevation — 0.3.7

Open a saved ride → **Play ride insights** → **The journey**. The route is now a real WebGL diorama: solid white road surfaces, shaded sidewalls, a beveled charcoal platform, subtle grid and real cast shadows. A faceted racing arrow follows the source path, with cyan progress painted along the road. Start/finish flags mark the endpoints. Choose **Isometric 3D** or **Overhead**, drag through 360° during playback, and use **Recenter** to restore the default angle. The camera stays where you put it.

`track-scene.js` is shared by the insight player, Track Studio and the exported film. The previous 2D canvas route renderer has been removed. `route-mesh.js` builds the top surface and both sidewalls around every source centerline vertex, with bounded joins at sharp turns and repeated stationary positions. A time attribute and shader reveal the cyan strip continuously without rebuilding geometry per frame. Static shadows are cached; manual camera changes do not change the recorded path. Renderers, meshes, textures and shadow maps are disposed on close or chapter changes.

If WebGL is unavailable, insights show readable facts and a graphics-unavailable explanation. Track Studio retains its SVG fallback.

## Continuous story playback

The journey chapter and its exported film no longer display a central “Recording gap” banner or stop the arrow at a missing interval. `route-presentation.js` connects successive known positions for the animation only. It keeps the original GPS fixes, timestamps and source arrays intact, and returns null speed for unsupported intervals. It never extrapolates outside the recording's time domain. The measurement pipeline, distance, speed, G estimates, coverage and Meta evidence still use the original source data. A short source note explains that playback connects fixes visually. These connectors are not road-network map matching or recovered GPS measurements.

The road shape comes from the selected recording, with every source vertex retained. The platform is a visual support, not a street map or terrain survey. No neighboring streets are fabricated around private recordings.

## Road-shaped demo

The new review fixture in `scripts/road-fixture.cjs` traces city blocks, rounded junctions and winding sections in a continuous loop. It replaces the simple wave-shaped fixture in the showcased demo. It is **fictional**, never loaded by the product, and labeled **DEMO / ILLUSTRATED** in the recap and exported video. Actual imported and recorded rides retain their own geometry. The older interrupted fixture remains available for regression tests.

Run `ODO_ROAD_DEMO=1 node scripts/insight-reel-smoke.cjs` with the local server on port 4178 to reproduce the road demo, mocked Meta personalization and real MP4 export.

## Elevation in meters

The 3D graph shows the highest source altitude in each complete time window, bounded to 96 windows. Missing windows split the ribbon. Reference lines and evenly spaced meter ticks bracket the source range. The axis is fitted together with its text, including negative and five-digit altitudes. A cyan → white → red scale represents low, middle and high source altitude; section colors and legend values come from the same numeric mapping in `elevation-scale.js`. The top surface is unlit so its color agrees with the legend; shaded sides communicate depth. The meter axis and legend are included in exported videos.

Altitude remains a source measurement with unverified datum and accuracy. The vertical display scale is exaggerated. Altitude range is not accumulated climbing or road grade.

## Shared dark palette

`theme.css` defines neutral black/charcoal surfaces and white type, with cyan for data and focus and red for recording/action accents. Owned stylesheets use these tokens across the overview, ride library, detail, Garage, companion, recording, settings and sharing flows. Canvas/SVG plots and story exports use the same palette. The launcher icon and Android widget use it too. Garage bike paint and model-inspired instrument faces remain representations of the selected bike.

Meta retains the existing runtime chapter ordering, supported interpretations and map-linked questions. This visual update adds no model providers or outbound data. Regression responses are explicitly mocked; a live key is still required to verify the demo runtime.

## Review and validation

All preview routes are synthetic; the video uses mock Meta captions.

- [Road-shaped journey, mobile](previews/diorama-mobile-synthetic.png)
- [Road-shaped journey, desktop](previews/diorama-desktop-synthetic.png)
- [Elevation axis, mobile](previews/elevation-axis-mobile-synthetic.png)
- [Elevation axis, desktop](previews/elevation-axis-desktop-synthetic.png)
- [Dark overview](previews/dark-overview-synthetic.png)
- [Rendered story](previews/diorama-insights-synthetic.mp4)

Checks include solid-mesh geometry and presentation-continuity unit tests; numeric elevation ticks, colors and gap segmentation; the shared WebGL renderer and readable graphics fallbacks; 320–1440px layout and axis visibility; shared palette across app pages; mocked Meta personalization; actual MP4 rendering; disposal/backgrounding; and Overview/Garage interactions. Physical Android recording and playback performance still need the demo device check.
