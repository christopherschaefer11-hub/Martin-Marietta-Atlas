# Current validation — 0.9.1-review

November 16, 2026 (America/Chicago). **Code-only review site deployed; production data remains blocked.**

- Repository: https://github.com/christopherschaefer11-hub/Martin-Marietta-Atlas
- Live URL: https://christopherschaefer11-hub.github.io/Martin-Marietta-Atlas/
- Application commit tested: `955191985434cf9e41acc9d5fc82b8c3959db35f`.
- Pages source: `main`, repository root, HTTPS enabled. No client records or private-review files are committed.
- Code CI succeeded: https://github.com/christopherschaefer11-hub/Martin-Marietta-Atlas/actions/runs/43997921645
- Pages deployment succeeded: https://github.com/christopherschaefer11-hub/Martin-Marietta-Atlas/actions/runs/43998060020

## Checks completed in this continuation

| Check | Observed result |
| --- | --- |
| Core regression tests | 3,124 assertions passed, including 2,048 filter combinations and the scalar-semicolon regression |
| Syntax and structural checks | Passed; zero structural errors; production-data gate still blocked |
| GitHub source integrity | All 21 committed blob hashes matched local file bytes; no extra files |
| Hosted subdirectory startup | Map and UI initialized at the actual Pages project URL |
| Basemap | Esri street-map tiles visibly rendered with attribution and scale |
| Hosted review import | File picker imported the separate JSON: 42 records, 0 map pins, 42 verification flags; no source directory committed |
| Combined filters and case-insensitive search | KS + Scheduled or requested + QUARRY returned 2 records, matching an independent data check |
| Confidence filter | Complete semicolon-containing value remained one option and retained the 2 expected results |
| Missing-coordinate details | Selected record opened complete details, source conflict flags and disclaimer without a fabricated pin |
| Conditional action buttons | Zero resource buttons for the inspected record with no approved links |
| Keyboard Escape | Closed the detail panel |
| JSON and CSV downloads | Both browser downloads completed; independently parsed each exported file and confirmed 2 filtered records |
| Empty results | GLB-only constraint returned zero results, an explanatory message, and disabled exports |
| Restore registry | Cleared imported records, filters and details; returned to zero-record public registry |
| Browser console inspection | Returned log window contained extension metadata errors, with no observed application-origin error |
| Live UI evidence | Screenshot captured after clearing private review data |

Browser testing used the available desktop Chromium surface (1363 x 938 screenshot). No mobile-device or tablet claim is made. The map has no real site markers because no approved facility coordinates were supplied. Header collected/data count of 32 after import reflects unverified prototype statuses, not confirmed usable datasets.

## Still unverified / blocked

Workbook active-location completeness; facility coordinates and addresses; datum/CRS; collection dates/status and resource availability; client/management publication approval; clustering and map/list synchronization with actual coordinate records; mobile/tablet behavior and complete keyboard traversal; every filter combination in a browser; actual KML/GLB loading, geometry, units, orientation and scale; live resource links; custom domain; live 404 recovery; actual browser blocking of dependencies. Dependency failures and all filter subsets are covered only by the existing automated logic checks.

The historical initial-delivery report below records earlier checks and environment failures. Its blanket browser-access limitation is superseded only for the specific observed checks above. A documentation-only follow-up records these results without altering the tested application files.

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
