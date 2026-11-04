# Journey radar — 0.3.4

Open a saved ride → **Play ride insights** → **The journey**. The journey now plays inside a dark circular radar inspired by the supplied racing-game minimaps. Recorded roads are pale; the replayed portion lights cyan. A compass, path-direction arrow, start/finish marks and a precise GPS anchor make the current position readable.

Drag horizontally to rotate through 360° while playback continues. **Radar** shows the route overhead; **Isometric** tilts the map plane. **Recenter** restores north-up. Keyboard users can rotate with the arrow keys, zoom with +/−, and reset with 0. Reduced-motion preferences start the recap paused.

## Bike artwork

Seven original, locally drawn illustrations distinguish adventure, rally, sport, naked, touring, classic and scooter families. Tall screens, beaks, spoke wheels and panniers distinguish adventure bikes; sport bikes have swept fairings, cast wheels and compact tails. Paint follows the saved ride profile. Existing garage fallback rules apply to older rides. These are family illustrations, not manufacturer-specific CAD or stock photographs.

The motorcycle stays upright and recognizable while the map rotates. The small arrow conveys **GPS path direction**, not measured motorcycle attitude, lean or steering. The artwork is rendered into the video too. No stock image, watermark, external image fetch or image-generation service is needed.

## Source fidelity

The renderer uses every projected GPS vertex, including short corners. It applies one horizontal scale and rotation without spline smoothing or closing open routes. The playhead interpolates only within connected source intervals; native recording gaps over three seconds and GPX gaps over thirty seconds stay open. The marker disappears inside a gap, with a visible recording-gap label. Backward seeking rebuilds progress correctly.

Range rings and the grid are display guides. Surrounding streets and terrain are not inferred from the route. Street-map context remains available in the personalization section map. This Canvas renderer works without WebGL; other 3D chapters retain their existing renderers.

Meta still performs the existing runtime analysis, orders chapters, links questions to supported sections and personalizes captions. This visual update does not add model providers or broaden the data sent to Meta. The attached future ODOme brief is roadmap context; its video-analysis and community proposals are not claimed as implemented here.

## Review artifacts and checks

All routes shown below are synthetic. The exported story's model captions use a mocked Meta response.

- [Mobile radar](previews/radar-mobile-synthetic.png)
- [Desktop radar](previews/radar-desktop-synthetic.png)
- [Isometric view](previews/radar-isometric-synthetic.png)
- [Original bike artwork examples](previews/radar-bike-art.png)
- [18-second rendered story](previews/radar-insights-synthetic.mp4)

`journey-radar.test.cjs` checks shape-preserving rotations, path direction, gaps, resumed segments, stationary segments and dateline crossings. `journey-radar-smoke.cjs` checks all seven bike families, color differences, exact interpolation, forward/backward seeking, full rotation, responsive controls, disposal and rendering without WebGL. The existing insight and lifecycle checks exercise all chapters, mocked Meta personalization, actual MP4 output, backgrounding and cancellation. No live Meta credential or physical Android device was available for this pass.
