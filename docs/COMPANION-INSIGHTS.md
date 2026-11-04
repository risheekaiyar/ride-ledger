# Odo insight briefs

Odo's Meta companion now combines a visual evidence panel with an editorial insight brief. Evidence tiles are calculated locally from the actual request context. The larger summary, numbered observation cards and follow-up question come from the runtime model response. Every observation links back to its recording; focused replies restore the exact time range and phone channel.

The six entry points adapt to the selected context:

- **Debrief my ride** — patterns supported by the recording and remaining uncertainty.
- **Sensor confidence** — observation coverage, gaps, missing channels and diagnostic limits.
- **Check my setup** — phone placement, mount condition and bike-type context.
- **Compare rides**, **Explain this window** or **Ride rhythm** — the relevant pair, interval or whole-ride pattern.
- **Next recording** — a specific setup check or repeat recording that could reduce uncertainty.
- **Shape my story** — a title and caption grounded in supplied evidence.

Choosing a direction only fills the editable question. **Send to Meta** makes the request. The input is disabled while that request is pending so a reply cannot silently overwrite a newly typed draft. A follow-up remains another explicit model call; changing evidence or selected scope resets the conversation. The directions collapse after a reply and can be reopened.

## What the visuals mean

Whole-recording cards show duration, supplied GPS time coverage and phone placement. Focused cards show observed GPS time and the selected channel's actual bin count and peak/median summary, or speed/altitude context. Paired cards show setup matches and how many phone channels passed comparison screening. Unknown values stay unknown. Coverage, setup matches and signal magnitude are not safety, skill or calibration scores.

Raw acceleration includes gravity; linear acceleration uses estimated gravity removal; angular speed is phone rotation magnitude. The model receives those distinctions and cannot treat them as calibrated motorcycle acceleration or lean. Recording-wide diagnostics remain separate from a focused interval. GPX source accuracy and phone motion are not invented.

## Runtime model and validation

The existing server/gateway calls Meta's `muse-spark-1.3` through `https://api.meta.ai/v1/responses`. It interprets bounded source evidence, explains uncertainty, asks for context and suggests useful next steps or story wording. Credentials remain server-side, model replies are schema-validated, and observation citations must reference supplied recordings. No non-Meta runtime model or automatic model call was added.

`companion-brief-smoke.cjs` verifies all six prompt directions, explicit-send-only behavior, local evidence values, formatted replies, focused citation restoration, comparison screening, GPX unknowns and 320–1440px layouts. Existing general UI, paired comparison, focused-debrief and native-overlay flows also pass. The complete Node suite has 143 passing tests; Android assembly and lint pass.

The previews below use synthetic data and **mocked Meta responses** to verify the UI. This pass did not make a live model call, and the current cloud preview has no configured Meta credential. Hardware calibration and physical Android overlay/share trials remain separate checks. The implementation needs a configured runtime credential and request allowance to demonstrate live Meta work.

- [Insight brief on mobile](previews/companion-insights-mobile-synthetic.png)
- [Insight brief on desktop](previews/companion-insights-desktop-synthetic.png)
- [Evidence panel on mobile](previews/companion-evidence-mobile-synthetic.png)
- [Evidence panel on desktop](previews/companion-evidence-desktop-synthetic.png)
