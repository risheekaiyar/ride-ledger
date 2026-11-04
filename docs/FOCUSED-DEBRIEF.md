# Ask Odo about a trace window

Choose a 15-second, one-minute or five-minute window in ride details, then select **Ask Odo about this window**. The companion identifies the selected channel and elapsed range, shows the evidence before sending, and pre-fills a question about coverage and phone setup. Opening the dialog makes no model request. **Send to Meta** uses the existing Meta-only runtime (`muse-spark-1.3`), server-held credential and explicit request allowance.

A focused request includes one recording. It does not automatically add a compatible second ride. The whole-recording context remains available, with the focused summary clearly separated. A new window or channel resets the conversation scope. Follow-ups retain that scope, and a reply's evidence link restores the selected channel, exact range and midpoint in the ride inspector.

## Evidence and interpretation

The summary includes only complete seconds inside the selected bounds, up to 300 seconds. A fractional end can therefore produce a shorter range, which the companion displays explicitly.

- Acceleration and linear acceleration summarize the existing one-second **peaks**; rotation summarizes one-second **medians**. Each channel includes its valid-bin count, median, interpolated P95 and maximum. Duplicate bins are excluded; missing values remain missing and measured zero stays zero. These counts do not establish continuous raw-sensor coverage.
- Speed uses the existing valid connected intervals, clipped to the selected range. It reports observed seconds, a time-weighted average and a peak. Native GPS uses at most three-second connections; GPX interval estimates use at most thirty seconds. Segment boundaries, invalid values, overlapping intervals and larger gaps are excluded.
- Source altitude reports the count and range of original fixes inside the selection. This is not an ascent, road-grade or vertical-accuracy measurement.
- Phone motion remains available during GPS gaps and in recordings with no usable GPS fixes. GPX imports cannot acquire invented phone-motion channels.

The server validates bounds, coverage, metric ordering and channel counts, assigns trusted units and strips additional properties. Relative elapsed seconds are included; routes, calendar timestamps, raw sample rows, local ride identifiers and private notes are excluded. Free text is shared as written.

The model instructions distinguish focused measurements from recording-wide sensor-health and route-profile diagnostics. They prohibit attributing a recording-wide clipping flag or event to this interval, and require uncertainty and setup context before an interpretation. Phone measurements do not become calibrated motorcycle forces, lean angles or confirmed road defects.

## Verification

- 134 Node tests pass. Ten focused-evidence tests cover clipping, gaps, partial seconds, duplicate bins, quantiles, source distinctions, privacy, server validation, fractional timing and a mocked provider receiving the focused packet.
- `node scripts/focused-companion-smoke.cjs` checks explicit submission, pair suppression, follow-ups, scope changes, citation restoration, fractional endpoints, zero-GPS motion and 320–1440px layouts. It validates outgoing requests with the actual server packet validator and mocks model replies.
- Existing comparison, general UI, trace-window and overlay browser checks pass. Android assembly and lint pass with the new asset bundled.

This pass made no live Meta request and performed no physical-phone calibration. Current local preview credentials are unconfigured. The screenshots use a synthetic recording with a motion spike inside a GPS gap.

[Window entry on mobile](previews/focused-entry-mobile-synthetic.png) · [Companion on mobile](previews/focused-companion-mobile-synthetic.png) · [Companion on desktop](previews/focused-companion-desktop-synthetic.png)
