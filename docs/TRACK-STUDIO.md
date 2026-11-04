# White 3D route studio — 0.3.3

Track Studio renders a white raised silhouette using the original projected GPS vertices. Its orthographic isometric camera shows the entire route. Horizontal dragging/arrow keys allow a full manual rotation during playback; **Isometric** and **Overhead** presets reset the view. There is no automatic orbit, chase camera, curve smoothing, kerb pattern, road marking or decorative race-circuit geometry.

The larger moving motorcycle uses the ride's saved model/family/color metadata, falling back to its associated garage profile for old recordings. It is a stylized family model, without claimed lean. Minimal, City and Hills backgrounds are optional peripheral illustrations. They do not infer the road environment or cover the route.

All horizontal axes use the same scale and bounding-box latitude projection as the 2D route. Dateline wrapping is preserved. Explicit segments and gaps remain separated; the marker disappears in missing intervals. Native connections are limited to three seconds and GPX to thirty. GPX holds its interval-ending speed estimate; native samples interpolate. Route width and wall height are illustrative.

Source elevation is off by default and available only with a complete valid altitude channel. Enabling it preserves horizontal shape and uses the source's metric scale. Altitude accuracy/datum remain unverified.

Expand retains the same renderer and playback state. PNG and video exports reuse this silhouette renderer. The same camera orientation survives every animated frame. Offline preview needs no external data. The separate geographic map requires loading the tile provider; WebGL failure retains a usable 2D fallback. Render resources/listeners are disposed when leaving.

Three.js 0.160.1 remains vendored under its MIT license. It is a graphics library, not an inference provider. Pixel ratio is capped at two. The full original source vertices form the mesh; the model's older simplified view is retained for compatibility but is not used to reshape this route.

`track-smoke.cjs` verifies full rotation retained across replay, actual rendering, source preservation, camera/elevation controls, PNG export, gaps, expanded view, geographic-map consent cancellation, mobile fitting, cleanup and fallback. Numerical tests cover projection, dateline, gaps and long recordings. Physical-phone graphics/performance still require device validation.

[Updated mobile route](previews/final-route-mobile-synthetic.png) · [Updated desktop route](previews/final-route-desktop-synthetic.png)
