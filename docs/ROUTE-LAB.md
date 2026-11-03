# Route Lab preview

Open Route Lab, select an imported ride, then use the offline speed-colored route, timeline and event controls. Slow-zone buttons seek to sustained segments at or below 5 km/h. The speed chart and ride profile come from the same filtered GPS data. The full-trip average includes time spent stopped and should be shown as an estimate.

Left and right are the largest qualifying estimates of equilibrium lean on a level road. The calculation uses the mean GPS speed and rate of course change over five consecutive good fixes, then computes `atan(speed × course_rate / gravity)`. Reject gaps, unstable speed, conflicting turn direction, poor location accuracy and missing speed uncertainty. Show the number of qualifying windows. This is a sparse, uncalibrated proxy. Bike lean can differ with banking, rider body position and transient motion.

Pace labels describe a single recording. Require at least 70% speed coverage and a minute observed. Use Stop-and-go when low-speed observations are at least 20% of coverage, Frequent speed changes when detected changes reach 0.75 per observed minute, and Mostly steady pace otherwise. These are provisional thresholds for local review. They do not classify safety or rider temperament.

Phone impacts are screened on mounted recordings. The reported magnitude includes gravity and mount vibration. A slow zone is an observation, with signals, stops, turns and congestion all possible causes. Compare multiple same-direction rides with consistent placement before interpreting recurring zones. Ask the rider to confirm an event before labeling a road defect.

Ask Muse presents the exact fields available for sending. The app sends the question and allowlisted numerical summaries only after the rider chooses Send to Meta and analyze. The server rejects malformed profiles and replies that reference unknown trips. Exact routes and sensor rows stay local. Result cards use Odo's computed numbers, while Muse explains what they can support. If Muse fails validation or is unavailable, the evidence cards still appear with an explicit status.

For every Muse test, capture a visual preview showing the evidence and the result or failure status. Use fictional rides for shareable previews. Keep images of real rides in ignored local storage unless the owner explicitly chooses to share them. Run `node --test scripts/analysis.test.cjs scripts/muse-runtime.test.cjs scripts/ride-insights.test.cjs`. Validate the updated local browser UI before packaging a phone APK.

Useful follow-on Muse tasks include comparing slow zones across matched commutes, asking the rider to label ambiguous events and retaining those labels, generating a travel recap from the rider's chosen evidence, and checking whether a ride was recorded well enough for comparison. Each can use computed evidence and rider confirmation, without guessing road conditions from a single trace.
