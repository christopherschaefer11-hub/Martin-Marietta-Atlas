# Current implementation checkpoint — 0.9.1-review

November 16, 2026 (America/Chicago). The dedicated GitHub repository has been created. Code commit, hosted verification and Pages deployment are pending at this pre-commit checkpoint.

- Re-ran the test suite: **3,124 assertions passed**, including the observed scalar-filter semicolon defect. Structural validator: **0 errors**. Production-data gate remains blocked.
- Opened the app in the available Chromium browser at the managed local preview. Observed successful startup, visible Esri street-map tiles, zoom/fit/layer controls and application disclaimer.
- Imported the separate 42-record review JSON using the browser file picker. Observed **42 results, 0 mapped, 42 requiring verification**, all listed under Missing coordinates; 32 source statuses count as collected/data and remain unverified.
- Observed the new Open review file control after reload.
- Browser log inspection found a browser-extension metadata error, with no application-origin error in that inspected log window.
- Not yet verified: GitHub Actions execution, GitHub Pages deployment, hosted-origin session import, clustering with actual coordinates, mobile/tablet behavior, resource viewers, custom domain, live 404 recovery or authoritative source correctness.

The initial report below is historical evidence; its browser-access limitations have been partly superseded by the checks above.

---

# Validation report

**Release 0.9.0-review — November 16, 2026 (America/Chicago).** No public deployment was performed. This report distinguishes source inspection and automated data checks from browser rendering and authoritative verification.

## Performed checks

| Check | Result | Scope |
| --- | --- | --- |
| Read supplied prototype inputs | Completed | index.html, sites.js, README.md and KML README.txt |
| Parse and count source registry | Passed | 42 objects, unique IDs; no workbook processed |
| Preserve review-record identities | Passed | Same 42 IDs/names in separate review JSON |
| Withhold unsupported coordinates | Passed | 42 original approximations replaced with null pairs |
| Remove raw contacts/notes/constraints/URLs from review derivative | Passed | Sensitive source text not copied; raw source left unchanged |
| JavaScript syntax | Passed | Application, core and regression test files checked by Node |
| Core regression checks | Passed | 3,120 assertions; 2,048 matching filter subsets plus mismatch cases |
| Search logic | Passed | Case-insensitive name, identifiers, city/state, capture, dataset and notes fixtures |
| Combined filter logic | Passed | Six category filters plus five boolean/resource filters; not a browser interaction test |
| Coordinate normalization | Passed | Null/blank/invalid/range/source checks; explicit zero handled separately |
| Status/verification separation | Passed | Normal status retained; header count uses exact collected/data statuses |
| Approved resource logic | Passed | Missing approval, unsafe paths/schemes and wrong GLB format rejected in core tests |
| CSV encoding and JSON round-trip | Passed | Multivalues, leading zeros, quotes/newlines and formula-prefix escaping; actual browser download not tested |
| Startup dependency failure code paths | Passed | Simulated DOM: missing Leaflet, clustering and registry produce visible alert state; inline watchdog tested |
| 250-record filtering | Passed | 1,000 filter passes, each 125 expected results; approximately 0.16 seconds in this environment; not a browser/rendering benchmark |
| Exact-case paths and dependency order | Passed | Local file inventory and HTML parser inspection; relative runtime asset references resolve within repository |
| Runtime secret/path scan | Passed | No detected credentials, local/network paths or unapproved source records in shipped runtime; heuristic scan, not a guarantee |
| Structural release validator | Passed | Zero structural errors; public registry intentionally empty |
| Production release gate | Blocked as intended | Zero approved records; workbookReconciled false |
| Archive manifest | Passed at packaging | Repository files included; private review JSON separate from repository root |

The regression fixtures are explicitly synthetic, located only in the optional test file, and are never loaded into the site registry. Their coordinates are for data-logic tests only, not fabricated facility data.

## Attempted but blocked

- A local Python HTTP server was started. Browser access to localhost timed out; a command-side connection returned an access-denied network error.
- Headless Edge exited before a page could be opened.
- In-app browser tab creation failed with a session error.
- Chrome was connected, but it could not reach the local HTTP preview. Its browser policy rejected a file-protocol fallback. No bypass was attempted.
- Direct command-side CDN retrieval failed. This is not evidence that the pinned CDN resources or map services are unavailable to ordinary users.

## Not verified

Actual map initialization/tile rendering, all marker rendering, clustering/spiderfying, map/list synchronization in a browser, list detail focus/scrolling, conditional action button interaction, CSV/JSON file chooser/download behavior, KML parsing/rendering and cancellation in a browser, GLB loading/orbit/pan/zoom/reset/fullscreen, mobile/tablet layout or touch targets, keyboard behavior, horizontal overflow, visual contrast with actual tiles, actual blocked-dependency browser behavior, browser Console, deployed GitHub Pages subdirectory behavior, custom domain behavior and live 404 recovery.

Also not verified: workbook active-location completeness, source addresses, facility coordinates, coordinate systems/datums, collection status/dates, dataset usability, actual resources, geometry, model units/scale/orientation, external resource destinations, client/management approval or public publication rights.

No map pins or model/geometry assets were invented to make the visual checks appear complete. No screenshot is offered as a substitute for a tested application.

## Required acceptance checks

Run the documented local server on an environment that permits browser access; import the private review JSON locally and verify all 42 records under Missing coordinates. Then test approved, authoritative coordinate/asset records and finish `QA_QC_CHECKLIST.md`. Update this report with actual browser/version, viewport, date and evidence before calling the atlas production-ready.
