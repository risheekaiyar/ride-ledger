# Racing replay and elevation — 0.3.5

Open a saved ride → **Play ride insights** → **The journey**. A faceted racing arrow follows a raised white GPS silhouette. Shaded walls provide depth; cyan marks the replayed portion. The default view is **3D silhouette** with an **Overhead** option. Drag through 360° while playback continues, or use the arrow keys. Recenter resets the map rotation. The main Track Studio also uses a racing arrow. Bike markers have been removed from both replay views.

The route uses every projected GPS vertex. Display extrusion adds visual depth without changing horizontal shape, smoothing corners or closing open trails. The marker interpolates within connected fixes and disappears in recording gaps. Trailing arrow echoes use previous GPS positions within the same segment. Their direction represents the recorded path, not measured steering or lean. Native gaps over three seconds and GPX gaps over thirty seconds stay open. Reverse scrubbing rebuilds progress correctly. Radar relief geometry is cached between camera changes and works without WebGL.

## Elevation in meters

The 3D graph shows the highest source altitude in each complete time window, bounded to 96 windows. Missing windows split the ribbon. Reference lines and evenly spaced meter ticks bracket the source range. The axis is fitted together with its text, including negative and five-digit altitudes. A cyan → white → red scale represents low, middle and high source altitude; section colors and legend values come from the same numeric mapping in `elevation-scale.js`. The top surface is unlit so its color agrees with the legend; shaded sides communicate depth. The meter axis and legend are included in exported videos.

Altitude remains a source measurement with unverified datum and accuracy. The vertical display scale is exaggerated. Altitude range is not accumulated climbing or road grade.

## Shared dark palette

`theme.css` defines neutral black/charcoal surfaces and white type, with cyan for data and focus and red for recording/action accents. Owned stylesheets use these tokens across the overview, ride library, detail, Garage, companion, recording, settings and sharing flows. Canvas/SVG plots and story exports use the same palette. The launcher icon and Android widget use it too. Garage bike paint and model-inspired instrument faces remain representations of the selected bike.

Meta retains the existing runtime chapter ordering, supported interpretations and map-linked questions. This visual update adds no model providers or outbound data. Regression responses are explicitly mocked; a live key is still required to verify the demo runtime.

## Review and validation

All preview routes are synthetic; the video uses mock Meta captions.

- [Raised route and arrow, mobile](previews/arrow-mobile-synthetic.png)
- [Elevation axis, mobile](previews/elevation-axis-mobile-synthetic.png)
- [Elevation axis, desktop](previews/elevation-axis-desktop-synthetic.png)
- [Dark overview](previews/dark-overview-synthetic.png)
- [Rendered story](previews/arrow-insights-synthetic.mp4)

Checks include projection/direction/gap unit tests; numeric elevation ticks, colors and gap segmentation; both route renderers; 320–1440px layout and axis visibility; shared palette across app pages; mocked Meta personalization; actual MP4 rendering; disposal/backgrounding; and Overview/Garage interactions. Physical Android recording and playback performance still need the demo device check.
