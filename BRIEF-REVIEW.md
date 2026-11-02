# Odo brief review — November 3, 2026

These are product candidates and constraints, not implemented features or an approved expansion of scope. The recorder and locked-screen walk test remain the immediate priority.

## Useful ideas to retain

- Editable journey diary: review a trip after parking, correct its mode/vehicle, add observations, and later split or merge a mistaken trip. Make uncertainty visible.
- One simple vehicle profile: start with the user's Xpulse 200. Separate user-entered odometer/service records from GPS estimates; importing a route cannot establish the bike's actual odometer history.
- Private defaults: explicit sharing, delayed publication and endpoint redaction when public sharing eventually exists. Hiding a small endpoint circle alone does not prove that home/work cannot be inferred from repeat routes.
- GPX import/export as a bounded interoperability feature. Google Timeline import could follow after testing representative export files; do not promise every historical format or recover missing history.
- A post-ride recap could eventually explain computed durations, stops and explicit rider observations, cite its evidence and accept corrections. Do not let a model invent the cause of a delay from GPS alone.

## Assumptions that need correction or evidence

- Google confirms Timeline is device-based and unavailable in Maps on a computer: https://support.google.com/maps/answer/6258979?hl=en . However, viewing exported Timeline data is already served by products such as There I Went: https://thereiwent.com/guides/export-google-maps-timeline/ . An importer or attractive map alone is not a demonstrated market gap.
- REVER already documents communities, tracking, photo attachments, statistics and live sharing: https://www.rever.co/faqs . Calling existing rider products socially weak needs comparative user evidence.
- A rotation vector describes the phone's orientation: https://developer.android.com/develop/sensors-and-location/sensors/sensors_position . With a phone free to move in a pocket/bag, it does not establish motorcycle lean. Raw vibration cannot substantiate potholes, road roughness or a calibrated riding-safety score.
- Under 4% battery per day is an untested target. Passive trip detection and a deliberate high-rate recording session are different power budgets. Benchmark on the Vivo before setting a promise: https://developer.android.com/develop/sensors-and-location/location/battery/optimize .
- Apple Visited Places import, fuel/carbon estimates and crash/SOS behavior require separate feasibility/data/validation work. They are not supported by this recorder.
- Smoothness, eco-efficiency and insurance rankings are not made valid merely by avoiding top-speed leaderboards. A metric must be validated for the intended phone placement and use before ranking people.

## Candidate sequence after the phone test

1. Reliable manual recording, local ride list, route preview, duration/distance uncertainty, export and rider notes.
2. Compare repeated, comparable commutes: travel time, candidate stopped time, data gaps and corrected notes. Test whether this explains a recurring annoyance better than current tools; no novelty claim yet.
3. Only if riders repeatedly find that useful, add GPX import, a simple garage and carefully redacted sharing. Decide whether a community solves a demonstrated need before building a feed.

Keep passive auto-start, cross-vehicle expansion, pro-driver rosters, live convoy, crash detection, road-condition crowdsourcing, insurer/fleet partnerships and books outside the first experiment. The broad brief is a longer-term option list, not a three-month delivery commitment for one person working 3–4 hours/day.
