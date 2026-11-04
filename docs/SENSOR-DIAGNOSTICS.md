# Phone signal diagnostics

Evidence algorithm `odo-evidence-5` expands each imported channel's review with accepted sample counts, mean rate, largest sample gap, time before the first and after the last sample, native-unit magnitudes, reported hardware range and Android status counts. These describe the phone recording; they are not calibrated motorcycle accuracy.

Range checks apply to accelerometer, gyroscope and linear acceleration axes when metadata supplies a finite positive range. An accepted row is flagged once if any axis reaches at least 99.5% of that range. This suggests possible clipping, not a confirmed impact. The magnitude shown in the card is a vector length and can exceed the range even when no individual axis approaches it. Other channels, absent/invalid ranges and legacy summaries without range provenance show **Not assessed**. Single samples cannot establish rate or an inter-sample gap.

Android's no-contact, unreliable, low, medium and high statuses remain qualitative vendor reports. Blank, malformed and unrecognized statuses count as **Not reported** without discarding otherwise usable measurements. Invalid counts in older persisted summaries become unknown. Rejected motion rows do not contribute to these status or range counts.

Median and 95th-percentile magnitudes now use linear interpolation between sorted finite values (R-7). This fixes small-sample cases where the previous lower-index percentile could fall below the upper-index median. Blank or whitespace timestamps/axes cannot turn into measured zeros. Old journal summaries are preserved; reimporting the original ZIP recalculates them with the new algorithm while retaining annotations.

The Meta debrief receives bounded summaries for acceleration, gyro and linear acceleration: accepted counts, mean rate, gaps, near-range counts and status counts. It receives no raw vectors, precise timestamps, sensor names or hardware identifiers through this addition. Opening **Check signal with Odo** fills a question and displays the evidence; sending remains explicit. The server validates channel uniqueness, count totals and time bounds, and instructs Meta to distinguish vendor status and possible clipping from calibrated bike measurements.

Validation: 95 Node tests pass, including malformed metadata, legacy compatibility, small-sample percentiles, backup validation and a mocked Meta provider request. `scripts/sensor-health-smoke.cjs` imports a synthetic ZIP through the actual worker, checks narrow/desktop layouts and submits a mocked debrief. Native ZIP, sample-inspector and confidence browser checks pass. Android assembly and lint pass. No live model request or physical sensor trial was made for this change.

Reviewed synthetic previews: [mobile](previews/sensor-health-mobile-synthetic.png) and [desktop](previews/sensor-health-desktop-synthetic.png).
