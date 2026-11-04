# Distance confidence and annotation integrity

Introduced in evidence pipeline `odo-evidence-3` and retained in subsequent versions. A ride title, activity classification or note cannot erase a failed import-integrity check. The importer retains `distanceIntegrity` separately from the editable activity; the edit function accepts only annotation fields and recalculates the display flag from the retained evidence.

A native distance enters totals, standard share summaries and Meta evidence only when:

- The summary provides a finite, nonnegative distance within the recorder's possible distance bound. Native distance steps reject speeds at or above 70 m/s, so total distance cannot exceed `70 × duration + 1 metre` (rounding allowance).
- CSV row counts agree with the summary and the recording ended with a normal Stop.
- The activity is classified as a motorcycle ride, at least 90% of supplied fixes pass the existing GPS checks, and connected accepted fixes cover at least 90% of recorded time.

The two 90% gates are conservative display heuristics, not validated accuracy scores or proof of full route reconstruction. Distance remains a preliminary recorder estimate. Temporal coverage sums intervals of up to three seconds between accepted fixes in the same segment; missing time, pre-fix time, trailing time and overlapping/backward intervals are excluded. This is separate from the telemetry panel's speed coverage, which also needs usable speed samples.

Missing, blank, string, negative and impossible summary distance values remain null, including their distance-derived full-trip average. A valid zero is retained. GPX keeps its existing approximate connected-segment distance and never becomes a native reliable-distance measurement through classification.

Explicit native activity metadata takes precedence over filenames. Filename hints remain available for older exports that supplied no recognized activity; a `ride` named “boardwalk” no longer becomes a walk, and explicit `unclassified` remains unclassified.

## Existing journals and backups

Existing journal entries are rechecked in memory on load and when saved. Their measurements and annotations are retained. Older backups remain importable; unsupported confidence is reduced without deleting source values, track points or notes. New backups reject contradictory integrity/confidence flags. Legacy uncertainty cannot be promoted by editing; reimport the original recording to establish the missing integrity evidence.

Reimporting a corrected, intact original recalculates integrity while preserving the app's existing annotation merge behavior. Totals show an em dash when rides exist but none supports a distance estimate. When a supported subtotal exists, its card states how many rides contributed. No source ZIP is modified.

## Verified

77 Node tests pass, including count mismatch, annotation injection attempts, reversible classification with intact evidence, valid zero/missing/invalid distance, explicit activity, time coverage, abnormal finalization and legacy backup preservation. `node scripts/confidence-smoke.cjs` exercises ZIP import, the actual edit form, save/reload, totals/Meta exclusion, corrected reimport and persisted legacy data. Native-import and companion/share browser checks also pass. The corrected web assets build into the Android APK.
