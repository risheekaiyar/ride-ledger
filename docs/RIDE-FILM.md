# Offline ride films

**Make clip** in Track Studio opens a local motion editor with a slowly orbiting 3D road model, moving rider marker, recorded-time timeline and motorsport typography. Choose an orange or ice edition, edit the headline, scrub the preview and render a 12- or 18-second clip.

| Format | Encoded dimensions |
| --- | --- |
| Story 9:16 | 720 × 1280 |
| Portrait 4:5 | 720 × 900 |
| Square 1:1 | 720 × 720 |

Each format has its own composition: headline size, track viewport, timeline and stat positions adapt to the available height. Compact frames use a lower camera angle to make the raised road and kerbs clearer. The scene is rendered at the new viewport size, preserving its geometry proportions. Changing format keeps the headline, edition, preview position and sharing choices, clears the old rendered clip and checks encoder support for the new dimensions. Late support responses from earlier selections are ignored; a frame encoder with mismatched dimensions is rejected.

Route inclusion must be selected before rendering. Replay speed starts off; enabling it preserves GPS/GPX source labels and leaves gaps unknown. Distances retain the app's existing confidence checks. The entire recorded duration maps onto the clip, including intervals before/after usable GPS. No coordinates, original timestamps, bike identifier, raw sensor rows or private notes are printed. The model uses stylized road width and flat source elevation, not reconstructed terrain.

Modern browsers use WebCodecs H.264 plus a bundled MP4 muxer. Each frame is rendered explicitly, producing 288 frames for 12 seconds or 432 for 18 seconds at 24 fps, regardless of the time the device takes to render. Frame generation has a three-minute deadline and a 12 MB output cap, with limited encoder queue depth and a fifteen-second timeout for each encoder flush. Older compatible browsers can use real-time MediaRecorder MP4/WebM; exports with too few drawn frames are rejected. If no encoder is available, the editor explains that PNG posters remain usable.

Rendering can be cancelled and stops when Odo is backgrounded. Closing releases the video URL, encoder/stream and private WebGL scene, then restores the ride playhead. Camera, microphone and remote map services are not used. Static track shadows are recomputed only when the geometry changes, reducing repeated work in both the viewer and exporter.

The browser saves a file or opens an available file-sharing target. Android receives a bounded video data URI, checks its container signature and decoded metadata, and opens the system share sheet through the read-only story provider. It accepts only silent clips with supported dimensions and a duration between one and thirty seconds. The UI reports share-sheet opening rather than claiming a post succeeded. Generated files remain in app-private cache; files older than a day are removed on a later story/clip share. Original ride exports are outside this provider's scope.

The current APK is required for Android video sharing. Real device codec support, thermal performance and receiving-app compatibility still need a physical-phone trial.

## Review and validation

The committed clips and decoded frames use the higher-contrast track treatment, wider illustrative kerbs and closed-loop geometry refinement. Route and speed sharing remain explicit choices.

- [Actual exported MP4](previews/ride-film-synthetic.mp4) — synthetic test circuit, 12 seconds, H.264, 720 × 1280, exactly 288 frames at 24 fps, no audio.
- [Decoded video frame](previews/ride-film-frame-synthetic.png)
- [Mobile editor](previews/ride-film-editor-mobile.png) · [Desktop editor](previews/ride-film-editor-desktop.png)
- [Portrait MP4](previews/ride-film-portrait-synthetic.mp4) · [Decoded portrait frame](previews/ride-film-portrait-frame-synthetic.png)
- [Square MP4](previews/ride-film-square-synthetic.mp4) · [Decoded square frame](previews/ride-film-square-frame-synthetic.png)
- [Square editor on mobile](previews/ride-film-square-editor-mobile.png) · [Portrait editor on desktop](previews/ride-film-portrait-editor-desktop.png)

The 18-second option was also rendered and verified as 432 frames at 24 fps, with speed explicitly included; both durations stayed below the 12 MB cap. The fixture is never loaded as product data. `scripts/ride-film-smoke.cjs` renders the clip and verifies it with `ffprobe`, exercises route/speed defaults, cancellation, backgrounding, native success/error callbacks, old-APK/unsupported states and resource cleanup. `scripts/film-codec-smoke.cjs` checks a playable silent WebM fallback and stopped capture tracks. Existing track and poster browser checks pass. Node tests cover provenance, gaps, codec negotiation and early cancellation; Java tests cover native media naming, container signatures and decoded bounds. No model API call or external upload is used by these checks.

`scripts/film-formats-smoke.cjs` additionally renders real portrait and square H.264 clips and inspects their dimensions, 288 frames, exact 12-second duration and lack of audio. It checks all three preview layouts at 320–1440px, independent scene/canvas sizing, invalidation of old media and out-of-order codec responses. The current full Node suite has 139 passing tests. Android assembly and lint pass; native video dimension bounds already permit all three formats, but physical sharing receivers remain unverified.

## Bundled dependency

`mp4-muxer` 5.2.2 is bundled from the official npm package, with its MIT license at `web/vendor/mp4-muxer-LICENSE.txt`. Package integrity: `sha512-dhozjTywI0h2qFzeShagt8YYw811fh1XlwiDCE2f6Aeqf6xG2CyuShoSa5E0AZDO8pPF0JOZ3wOmWBNWIGdSpQ==`. It packages encoded frames into MP4; it is not a model provider. There is no runtime package fetch, and model calls remain Meta-only.
