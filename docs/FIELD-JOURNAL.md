# ODOme field journal

## Starting point

The starting tree is `main` at `08d3c6c5580300cdbfececf9550993fc4c206db9`, Android 0.3.7. The Android activity and desktop browser load the same `web/` dashboard.

| Status at intake | What the source contains |
| --- | --- |
| Working in the existing implementation | Native Start/Stop recorder with local ZIP export, timed GPX import, IndexedDB ride library, synchronized 3D replay, local photo garage, route posters and rendered ride films. See `RideService.java`, `web/gpx.js`, `web/track-ui.js` and `web/ride-film.js`. |
| Partial | The companion accepts bounded text evidence and can ask section-linked questions. The local runner and authenticated Android gateway already share a Spark runtime. Existing ride films are generated exports. They do not ingest a rider’s vlog. Private story drafts and simple trip plans exist. |
| Proposed at intake | Select a local frame, align it to ride time, inspect the consent packet, ask Spark a visual question, and save or correct a rider’s account. Add multi-day organization by referencing trips. |
| Not yet verified at intake | Live image input on this account, file picking on the owner’s handset, a supplied planned-route geometry, public community reports, and comparative quality of other models. The exact two-day Mountains to Coast fixture was absent from this tree. |

## Prototype and architecture

Start with a fictional mountain pause. A local illustrated clip shows a mountain road. The recording can establish a low-speed interval. The rider alone supplies the reason. Test the same editor with a saved ride, an unsynchronized clip, and no usable GPS. Keep the demo outside the rider’s recorded totals.

1. The shared dashboard selects a still or decodes an individual frame from local video. The rider anchors the frame to a specific time in the recording. A small re-encoded JPEG and a bounded set of ride facts form the consent preview.
2. The existing server or native gateway authenticates and reserves one request. Standard `muse-spark-1.3` gets that JPEG and allowlisted facts. The local client draws the map. No full clip, audio, route coordinates or account credential is included in the provider packet.
3. The rider can answer, edit, skip or remove the account of a moment offline. Review keeps the original evidence, any model suggestion and rider recollection distinct.
4. Evaluate SAM only on a rider-selected region if mask tracking improves a defined editing task versus the same frame without masks.
5. Group trip references into journeys and tag trips locally. Recording ownership remains with the ride library.
6. Evaluate shared reports with dated, approximate sections and explicit gaps. Compare Wonder against Spark on the same approved inputs before enabling a deeper review. Public publishing, transcription and image generation require separate product and consent work.

## Provider verification · 5 November 2026

| Model | Documented surface and pricing in USD | Role in this pass |
| --- | --- | --- |
| Muse Spark 1.3 Standard | `/v1/responses` accepts image and text. $1.25 per million uncached input tokens and $4.25 per million output. | One optional, quota-reserved request for a reviewed frame. |
| Muse Wonder 1.0 | Text and multimodal reasoning via Responses. $4/$20 per million input/output tokens. | Deferred until blind paired evaluations justify latency and cost. |
| SAM 3.1 | Responses API image/video segmentation. $0.0025 per image or $0.0002 per video frame, with a 50-frame minimum per video request. | Proposed mask experiment. No road-condition classification. |
| Muse Image 1.0 | `/v1/images/generations` and `/v1/images/edits`, $0.01 per generated image. | Optional artwork experiment. Route layout and measurements stay local. |
| Muse Voice Transcribe 1.0 | `/v1/asr/transcribe`, $0.18 per hour. Turn-level timestamps. | Optional opt-in narration experiment. The prototype excludes audio. |

The API requires a separately entitled, billed team. The published Spark team limits are 3,000 requests and four million tokens per minute. The project sets a much lower allowance. Standard-mode content is excluded from model training. `store:false` concerns response storage; it does not establish account-level zero data retention. The team has not verified ZDR. [Model catalog](https://dev.meta.ai/docs/models) · [Image inputs and limits](https://dev.meta.ai/docs/image-understanding) · [Pricing and team limits](https://dev.meta.ai/docs/pricing-rate-limits) · [Terms](https://dev.meta.ai/legal/terms-of-service) · [ZDR eligibility](https://dev.meta.ai/help/policies-and-privacy/zero-data-retention).


## Try the built version

1. Open **Field journal** in Odo or launch the separately installable **ODOme Field Journal** preview. On desktop run `node scripts/serve.cjs` and open `http://127.0.0.1:4178/?journal=demo`.
2. At **The overlook**, choose **Replay tested Spark review**. The app checks the packaged JPEG’s SHA-256 and the ride facts before showing the saved live response. The sample stays outside the rider’s library. Choose **Taking photographs** and save it. Edit or remove it to see which parts of the story change.
3. To inspect the original flow, remove the example frame and open **Open sample clip**. Scrub the six-second clip, match its frame to the ride time, then keep it locally. **Review for Spark** shows the actual JPEG, dimensions, size and all ride fields. Sending requires a separate checkbox and button. A fresh live send needs a separately configured gateway and allowance. Removing a frame removes its model interpretation and preserves independently written memories.
4. **Replay journey** plays both days in chronological order, with a moving motorcycle marker, source speed and altitude. Scrub, pause and choose **Review this time**. Gaps hide the marker and unavailable values. Recorded time excludes the overnight interval between trips.
5. Under **Planned and ridden**, select a candidate to inspect its time, local map and route-choice question. On a saved recording, select your intended GPX or remove it. The dashed trace represents the supplied plan. Local comparison uses a 300 m tolerance and requires three connected fixes and 300 m traced outside the corridor. The reported kilometers trace the recorded section. Additional distance relative to an alternative route is unknown.
6. Under **My journal → Organize a trip**, give two recordings the same journey title and add comma-separated collections. Filter by journey or collection. Removing membership preserves the recording. The sample’s dated community section illustrates disagreements and unreported distance using fictional reports.

## What shipped

| Stage | Implementation and evidence | Model, latency and cost |
| --- | --- | --- |
| 1 · media | Dashboard and Android WebView share the file picker, seekable preview and explicit alignment. Photos and individual video frames are redrawn at up to 640 px with metadata removed. Only a local JPEG up to 96 KiB is saved. | Local. Zero provider requests. |
| 2 · visual question | The standard Spark model reads one approved frame and a fixed ride window. Its structured result chooses a visible cue, a follow-up intent and evidence IDs. ODOme maps those codes to reviewed interface text. The local server, native bridge and authenticated HTTPS gateway have a dedicated bounded route and share the companion quota. | **One genuine synthetic generation**, 6.945 s, 540 input and 558 output tokens. Estimated **US$0.0030465** using published Standard rates. No retries. Billing invoice unverified. [Sanitized receipt](../web/assets/field-spark-review.json) · [Exact JPEG](../web/assets/field-overlook.jpg). |
| 3 · rider correction | Choosing or writing a reason immediately updates the debrief and survives reload. The source observation, visual candidate and rider’s words remain separately labeled. Skip leaves the cause open. | Local correction. Zero follow-up requests. |
| 4 · masking | The tested baseline answered the scenic-pause question from one still. No tracking or mask is needed for that question. A separate opt-in clip/object selection experiment would need labeled masks, a baseline and an approved budget. | SAM was not run. Mask quality, cost and latency were not measured. |
| 5 · multi-day | Local trip references, multi-collection tags, date-based day count, known-distance totals and combined playback. Journey cover uploads, journey-level note editing and cross-device journal synchronization are future work. | Deterministic local behavior. |
| 6 · community and other models | A synthetic report example calculates exclusive smooth, rough, conflicting and unreported coverage. Real contributions, moderation and public sharing need a backend. Wonder comparisons, generated art and vlog transcription remain experiments. | No live community data or other model calls. |

New journal attachments, notes, plans and collection assignments live in a separate local IndexedDB. The existing recorder ZIP and legacy private backup do not include these journal additions. No real routes or videos were used for this review. A saved model result can be replayed without a key. Live operation on the handset still requires configuring its separately authenticated gateway in Settings.

## Evaluation cases

| Input | Expected result |
| --- | --- |
| Scenic pause that could be traffic | The synthetic window contains 180 s below 5 km/h. The live model selected mountain scenery and a pause question. Only a rider answer supplies a reason. |
| A visible fuel station | A visual candidate can prompt a question. A fuel purchase cannot be marked confirmed by the model. |
| Rough-looking frame with quiet sensors | The visual observation remains a candidate. Phone evidence stays independent. |
| High phone vibration from a loose mount | The app can show a phone peak. Mount movement becomes a rider explanation only after confirmation. |
| Two supplied planned-route deviations | One synthetic recorded section per day clears the local thresholds. The app offers a cause question. |
| No planned route | The plan status is unknown, with zero invented deviations. |
| Camera and recording clocks differ | Matching the exact displayed frame and ride time is explicit. Unconfirmed alignment cannot be saved. |
| Conflicting community reports | Two fictional dated reports cover 24 unique km of day one, including 9 conflicting km. 181 km have no report. |
| Missing GPS, elevation, motion or video | Missing measurements remain unknown. A rider can write a memory with no frame. No frame means no visual request. |
| Multi-day mountain and beach tags | The two independent timed tracks round to 205 and 187 km. The same trip can appear in more than one collection without duplication. |

The live result applies only to the synthetic overlook case. The remaining model-response checks validate the application’s response contract with controlled inputs. They do not establish real-model quality across all ten cases.

## Reproduce

- Node 24 and OpenSSL on PATH: `node --test --test-isolation=none scripts
