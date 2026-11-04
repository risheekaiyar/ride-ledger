# Screen-state evidence

Evidence pipeline `odo-evidence-4` handles screen-state timing independently from route and motion channels. A missing `events.csv`, an empty log or no usable interval leaves screen-off duration unknown. A valid screen-on interval can still produce an observed screen-off duration of zero.

Only the recorder's four known event names are interpreted: initial_screen_on, initial_screen_off, screen_on and screen_off. Events outside the recording window and identical timestamp/state duplicates are excluded. Backward timestamps, conflicting states at the same timestamp, invalid timestamps or malformed CSV make screen-state durations unknown; other valid ride channels remain available.

`screenObservedSeconds` covers time from the first usable event through the recording end. Time before that event stays unobserved. `screenOffSeconds` counts only off intervals within that coverage. The detail page shows both observed screen-off duration and screen-state coverage. These remain estimates from Android broadcasts, not continuous display monitoring.

GPX supplies neither field. Older native journal entries without coverage metadata remain unavailable to the companion for screen-state interpretation; reimporting the original ZIP can establish the new timing evidence. Raw files and existing annotations are retained.

## Meta runtime

The client sends `screen_observed_seconds` alongside `screen_off_seconds`, or nulls when usable coverage is unavailable. The gateway bounds observed time by ride duration and off time by observed time. The new field is optional for older clients. Runtime instructions tell Meta not to infer screen-on time from unobserved intervals. No event timestamps or raw rows are added to model input.

Provider tests use a mock and verify that the observed-time metric and updated instructions reach the Meta request. No paid model calls were made. The local loopback preview was restarted to load the revised validator; no hosted service or environment was published.

## Validation

84 Node tests pass, covering partial coverage, genuine zero, missing logs, duplicate/out-of-window events, contradictory/malformed timing, backup bounds, companion filtering and runtime validation. Native-import, confidence and companion/share browser checks pass. Android assembly succeeds with the revised assets. Android lint and 14 Java tests remain passing from the recording-setup checkpoint; this change does not modify native Java code.
