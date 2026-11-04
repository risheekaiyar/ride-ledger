# Ride detail and mobile navigation

Opening a saved ride now leads with its interactive Track Studio. The ride summary follows in a rounded sheet with date, editable title, the ride's own bike/placement context, a large distance readout, duration, source-labelled peak speed and GPS quality. GPX accuracy stays unknown, and its distance/speed remain explicitly estimated.

Odo's Meta companion has a dedicated debrief card immediately after the summary. It opens the existing evidence-preview and runtime request flow; opening a ride does not automatically send a model request. The telemetry dashboard, accessible sample inspector, recording-support table, notes, road observations and setup editor remain available below. Source warnings and sensor health are grouped in an expandable section.

The three-destination mobile dock is consistent across pages, with the companion beside it. The rider avatar opens Overview, Rides, Route lab, Garage, Story drafts and Settings. Desktop keeps the full sidebar. The track viewport adapts to phone height so playback controls clear the dock at the checked 390×844 viewport; expanded replay keeps its separate full-screen layout.

[Mobile ride summary](previews/ride-detail-summary-synthetic.png) · [Odo debrief and telemetry](previews/ride-detail-odo-synthetic.png)

These are synthetic test fixtures, never preloaded into the product.

Verified in Chromium: WebGL rendering and fallback, camera changes, playback/inspection synchronization, GPS gaps, source altitude, PNG export, nested dialogs, companion evidence navigation, context recording, mobile menu access, sharing, overlay isolation and 320px layout. Android assembly and lint pass. The live provider and physical Android rendering remain separate checks.
