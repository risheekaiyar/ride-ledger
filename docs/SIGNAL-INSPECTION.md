# Signal inspection and long recordings

Comparison charts now keep readable CSS-sized labels on phones, show a separate missing-data rail for each ride, and expose the original one-second values through touch and keyboard inspection. Selecting elapsed time in ride A selects the same percentage of elapsed time in B; the readout shows both actual intervals. This does not align physical locations. Missing bins show an em dash, measured zero remains zero, and a partial final second remains excluded from comparison summaries. Arrow keys step one second in A, Shift/arrows or Page keys step ten, and Home/End select the limits.

Long traces switch from connected sample lines to minimum/maximum ranges per time column: 640 columns for comparison and 600 for individual ride charts. The switch happens above twice the column count. Every valid sample still contributes to its column’s extrema, while statistics and inspection use the original evidence. Columns are drawn independently; no connecting line is invented between them. A rail marks any column containing a missing interval, including gaps narrower than one column. At this overview scale, a marked column can contain both observations and a gap; the range does not locate each extremum within that column.

Individual speed/elevation traces retain the existing connection limits: three seconds for native GPS and thirty seconds for GPX. Phone-motion lines now require consecutive one-second bins. Values outside the ride window no longer distort chart limits. Isolated samples remain visible. The altitude summary avoids spreading large arrays into function arguments, so large recordings do not overflow the JavaScript argument stack.

The inspection cursor continues to read source samples, not display-reduced points. Comparison quantiles sort each channel once without changing the median or percentile method. Timeline labels use `h:mm:ss` for rides over an hour. Leaving Route Lab releases its derived comparison arrays.

The Odo conversation fingerprint also includes the locally selected ride IDs. Switching to another ride resets prior replies even when its numerical summaries happen to be identical. These IDs are not added to the model request.

## Focused time windows

Ride details offer Whole ride, 5 min, 1 min and 15 sec trace windows. A focused window starts around the replay cursor and stays fixed while you inspect or replay. Previous/next move by one window; Center on playhead returns to the current moment. Changing the window pauses replay and updates the chart without replacing the 3D canvas or its camera. The range is explicit, and an out-of-window playhead is labelled rather than drawn at a misleading edge position.

The same range carries across speed, source elevation and phone motion. Chart clicks map to that range; Home/End seek its bounds and arrow keys stay inside it. Returning to the whole ride restores its full limits. Changing rides resets the range, while the older Route Lab single-ride chart remains a whole-ride view. Empty windows keep the controls available.

Clipping uses only already-connected source line segments. It never bridges missing values, segment changes or excessive sampling gaps. A line clipped at the window edge is a display interpolation; the sample inspector still shows original source values and timestamps. Window-specific chart limits do not alter ride-wide averages, coverage, histograms or saved samples. The optional [focused Meta debrief](FOCUSED-DEBRIEF.md) adds a separate window summary to the unchanged whole-recording context.

Motion bins can also be inspected when there are **no usable GPS fixes**. GPS fields and speed remain unavailable, while the recorded motion values—including zero—stay inspectable by chart click and keyboard. This does not create a route, calibrated bike forces or motorcycle lean.

[Focused view on mobile](previews/trace-window-mobile-synthetic.png) · [Focused view on desktop](previews/trace-window-desktop-synthetic.png). These fixtures deliberately include a phone acceleration spike inside a GPS gap.

## Moments to inspect

Ride details and Route Lab's single-ride review now show existing event candidates in time order. The compact list starts with three; **Show more moments** appends six at a time, announces progress and moves keyboard focus to the first added row without replacing the 3D scene. Phone raw peaks and GPS speed-change estimates have separate source labels. No new detection thresholds or road-cause classifications are introduced.

Selecting a candidate opens its original timestamp in the corresponding phone-motion or speed channel, with a surrounding 15-second window. Windows clamp at recording boundaries; rides of 15 seconds or less use the whole recording. Selection within ride details preserves the camera and canvas. Route Lab selection opens the same inspector. A phone peak can still be inspected inside a GPS gap; absent channels remain unavailable. The candidate's value and context appear only while inspecting that time and channel, and reset when the page is rendered again.

This view excludes invalid times/magnitudes, unsupported kinds and ambiguous duplicate IDs. GPX imports do not inherit native recorder candidates. It does not change stored samples, detection results or ride-wide summaries. The focused Meta entry remains an explicit review-and-send action.

[Moments on mobile](previews/moments-mobile-synthetic.png) · [Moments on desktop](previews/moments-desktop-synthetic.png) · [Selected moment and trace](previews/moment-window-mobile-synthetic.png)

## Verification

- `node --test --test-isolation=none scripts/*.test.cjs`: 137 tests pass, including full-day bounds, retained extrema, gap marking, measured zero, partial intervals, focused-window clipping, focused Meta evidence, candidate validation and a 150,000-point altitude array.
- `node scripts/moments-smoke.cjs`: chronological batches, source labels, keyboard focus, exact event timestamps, camera/canvas retention, unchanged source evidence, Route Lab navigation, missing channels, short recordings, focused Meta entry and 320–1440px layouts. No model request is made.
- `node scripts/trace-window-smoke.cjs`: a one-hour recording with GPS/motion gaps; window controls, actual source inspection, click/keyboard range mapping, camera/canvas retention, unchanged full-ride summaries, empty windows, zero-GPS motion inspection and layouts from 320 to 1440 pixels.
- `node scripts/comparison-inspector-smoke.cjs`: different-duration mapping, touch/keyboard controls, original-bin values, gaps/endpoints, narrow layouts and 86,399 valid bins per full-day trace.
- `node scripts/long-trace-smoke.cjs`: 50,000 GPS fixes and 25,000 motion bins, original-sample seeking, extremes, gaps and layouts from 320 to 1440 pixels.
- Existing comparison, telemetry and sample-inspector browser checks pass. Android assembly and lint pass; Java code is unchanged in this pass.

The large synthetic cases rendered in roughly 300–430 ms in this cloud Chromium run, including the work measured by each script. These are development measurements, not a physical-phone performance claim. No live model request or hardware calibration was performed.

Reviewed synthetic previews:

- [Comparison inspection on mobile](previews/signal-inspector-mobile-synthetic.png)
- [Full-day comparison](previews/signal-full-day-desktop-synthetic.png)
- [Long-ride motion trace on mobile](previews/long-trace-mobile-synthetic.png)
