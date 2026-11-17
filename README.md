# Martin Marietta Data Collection Atlas

**Delivery status: working application source; production data release blocked.** The workbook, actual KML files, GLB models and publication approvals were not supplied. Desktop map startup and the 42-record review import have now been exercised in a browser. The application is not yet a verified production data release. See `VALIDATION_REPORT.md` for performed checks and remaining checks.

The public repository contains **no unapproved site records**. All **42** supplied prototype records are preserved in the separately delivered `mm-atlas-private-review.json`, after removing approximate coordinates, personal contacts, operating notes and unapproved resource URLs. That private review file must remain outside this repository and its Git history. This is not a substitute for workbook reconciliation. The empty bundled registry is an explicit release boundary, not a smaller sample directory.

## Purpose

A static, responsive discovery and visualization index for geospatial collection locations. This is not an authoritative survey map, property-boundary map, legal exhibit, source of record, or replacement for approved survey, LAS/LAZ/E57/COPC, CAD, GIS or project records.

The navy dashboard, sidebar, search, status colors, filters, map and detail concept retain the supplied HTML prototype’s design. Improvements include strict coordinate handling, discoverable records without map pins, persistent detail panels, combined filters, approved resource actions, lazy KML/GLB loading, CSV/JSON import/export, mobile drawer, keyboard controls and visible startup failures.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html` | Application and ordered library loading |
| `data/sites.js` | Approved public export only; currently empty |
| `assets/css/atlas.css` | Dashboard, map, drawer and dialog styling |
| `assets/js/atlas-core.js` | Validation, filtering, resource rules and export helpers |
| `assets/js/atlas.js` | Leaflet UI, selection, import/export, KML and GLB |
| `assets/icons/atlas.svg` | Original atlas icon |
| `assets/images/README.md` | Image publication guidance |
| `kml/README.txt` | Approved KML placement instructions |
| `models/README.md` | Approved GLB placement instructions |
| `404.html` | Helpful missing-page recovery |
| `DATA_DICTIONARY.md` | Fields, types and publication classification |
| `DATA_PREPARATION_REPORT.md` | Source inventory, counts, exclusions and conflicts |
| `QA_QC_CHECKLIST.md` | Data and functional release checks |
| `VALIDATION_REPORT.md` | Actual test results and limits |
| `CHANGELOG.md` | Release history |
| `tools/validate_release.py` | Optional Python release checks; not an application dependency |
| `tests/core.test.cjs` | Optional developer regression checks; Node is not required to run or deploy the atlas |
| `.github/workflows/checks.yml` | Automated syntax, data logic and structural checks on pushes and pull requests |
| `.gitignore`, `.nojekyll` | Source exclusions and plain static Pages publishing |

## Browser review without installing Python

Once hosted, open the atlas and choose **Open review file**, then select the separately supplied JSON from your device. The application reads the file into this tab; it does not upload the import or change GitHub. Refresh or choose **Restore bundled registry** to clear it. Publication approval remains required for records committed to `data/sites.js`. Only use source data approved for this browser environment. External CDN scripts execute in the page; this is a convenience workflow, not an approved confidential-data enclave.

## Local testing

From the repository directory:

```sh
python -m http.server 8000
```

Open **http://localhost:8000**. Python serves static files for testing; it is not required by GitHub Pages or the deployed application. No npm, Node, build step, database, API key or server-side processing is required for deployment.

To inspect the supplied directory locally, expand **Import / export**, choose the separately delivered `mm-atlas-private-review.json`, and select a site. All 42 records are discoverable in **Missing coordinates**. Their original collection statuses remain visible and are explicitly unverified. Imports are in-memory only and disappear on refresh. They are not uploaded or stored in localStorage. Session imports may contain records awaiting publication review and are clearly labeled. The bundled registry still rejects unapproved records. The application does not send imported file contents to a server; CDN scripts execute in the page, so import only information approved for this browser environment.

To test a project subdirectory, serve the parent directory instead and open `http://localhost:8000/REPOSITORY/`. Inspect Network and Console in browser developer tools. Repeat using the live Pages URL after approval. Opening the HTML directly is not a supported test for KML/GLB because browser file-origin restrictions differ.

## GitHub Pages publication

For a code-only review deployment, the empty registry may remain in place: the map and file-review controls work, and no source directory is published. For a complete production-data release, follow these steps.

1. Resolve the blockers in `DATA_PREPARATION_REPORT.md`; obtain client/management approval for the audience and every included field/resource.
2. Replace `data/sites.js` with the complete reconciled, reviewed public export. Do not copy the private review file, workbook or original prototype registry into the repository.
3. Run the release validator and complete the QA checklist, including browser testing.
4. Commit the repository contents with `index.html` at the root of branch **main**.
5. In GitHub, open **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**.
6. Visit the actual published URL and repeat deployment checks. Public GitHub Pages may be accessible to anyone, even if a source repository is private. Do not assume private access without a separately confirmed approved access-control arrangement.

Relative application paths support both a `USERNAME.github.io/REPOSITORY/` deployment and a custom domain. No `CNAME` is included because a domain was not supplied. Configure a custom domain and HTTPS through GitHub after approval. GitHub publishing guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Replace the site registry

The workbook remains the primary active-location directory. Export a reviewed JSON array and assign it to `window.MM_ATLAS_SITES` in `data/sites.js`. Keep `window.MM_ATLAS_META` current. Set `workbookReconciled:true` only after a row-by-row check; set each included record’s `publicationReviewed:true` only after approval. These flags record a decision, not a security mechanism.

Do not geocode missing coordinates automatically. Use `null` for both latitude and longitude until an approved source is available. Convert coordinates only after establishing CRS/datum. Do not copy the prototype’s rounded coordinate pairs into production. A valid numeric pair does not establish positional accuracy.

For duplicates, match by Lamp project number, then MM site number, normalized site name, then city and state. A city/state match alone may be ambiguous; escalate multiple matches rather than merging. Keep a controlled reconciliation log with authoritative and alternate values, source, reason and owner. Preserve source identifiers as strings, including leading zeros. Duplicate IDs are rejected rather than overwritten. Assign a stable reviewed internal ID when source IDs are absent; never invent an official project or site number.

## Expected CSV and JSON fields

Required: `id`, `siteName`. Full field definitions are in `DATA_DICTIONARY.md`. Other fields include identifiers, address, WGS 84 coordinates, source/confidence, collection status/date, capture methods, datasets, availability, resources, flags and publication/resource approvals.

JSON accepts an array or an object with a `sites` array. CSV requires exact camelCase header names; multi-values use `|` or `;`. Booleans accept `true/false`, `yes/no`, or `1/0`; prefer JSON booleans. Blank coordinate cells become `null`. CSV `approvedResources` must be a JSON object encoded in a properly quoted CSV field. Papa Parse loads only for CSV import. Exports reflect **filtered results**, include the normalized fields and preserve identifier strings. CSV cells with spreadsheet-formula prefixes are escaped with a leading apostrophe; JSON is preferred for a lossless round-trip. Imports larger than 5 MB or 5,000 records are rejected. The intended working range is 50–250 records.

## Add or update a location

Update the authoritative directory first, reconcile IDs, verify the active flag and sources, record conflicts, obtain publication approval, then regenerate the complete public export. Do not maintain a second uncontrolled master in browser imports. Confirm that the source status means what the atlas says; a delivered document alone does not prove a current usable dataset. Preserve collection status when adding a verification flag. A red outline supplements the normal status fill.

Keep ownership explicit: directory owner maintains active locations; project lead confirms collection/dataset status; GIS/survey reviewer validates coordinates and geometry; client/management approves publication; repository maintainer packages the approved export and records release evidence. These are proposed responsibilities, not assigned staff commitments.

## Attach KML

Place an approved file in `kml/`, keep its capitalization exact, use a relative `kmlUrl`, and set `approvedResources.kmlUrl:true`. Register an action only after confirming that the file exists and opens. No actual KML was supplied in this delivery, so no site KML actions are exposed.

The lazy loader supports Point, LineString, Polygon with inner rings, and simple collections within placemarks. It ignores external NetworkLinks and GroundOverlays, reports omissions, rejects malformed XML/geometry and enforces a 10 MB limit. It does not support KMZ, altitude/terrain behavior, styled Google Earth content or authoritative topology. One KML overlay is active at a time; use Show overlay or Remove KML. Styling is purple and dashed. The warning is always shown: **“Approximate location or extent. Not an authoritative property boundary.”** A placemark is not a facility boundary. Polygon altitude is ignored in this 2D display.

## Attach GLB

Place an approved derivative in `models/`, set `glbUrl` and `approvedResources.glbUrl:true`, and validate it separately. Models and the pinned model-viewer library load only when requested. Orbit, pan, zoom, reset, load/error status and fullscreen (where supported) are provided. Reset restores target, orbit and field of view. Escape closes the dialog and returns focus.

Target approximately **5–25 MB** per browser model. Flag files over approximately **50 MB** for optimization. Translate large projected survey coordinates to a documented local origin; record the transform, CRS, units, orientation and derivation in the authoritative record. Validate orientation, scale, units and geometry against that record. Optimization may change geometry. GLB is separate from authoritative LAS/LAZ/E57/COPC/CAD resources; the preview accepts `.glb` only.

**“Visualization derivative. Refer to the authoritative survey, point-cloud, CAD, GIS, or project record for technical use.”**

## Browser, CORS and network limitations

Internet access is required for CDN libraries and Esri tiles. Same-origin relative resources are preferred. Cross-origin KML and GLB must allow browser CORS access; the app fetches KML without credentials. External project links open a new tab and may require authorized sign-in. Link presence or a successful download does not validate content or permissions. There is no background link crawler or dataset download. Missing files and blocked libraries produce visible errors; no offline basemap is bundled. Use current Chromium, Edge, Firefox or Safari; browser/device validation remains a release task.

## Basemaps and dependencies

| Dependency | Pinned version / service | Loading |
| --- | --- | --- |
| Leaflet | 1.9.4, jsDelivr | Startup |
| Leaflet.markercluster | 1.5.3, jsDelivr | After Leaflet |
| Papa Parse | 5.4.1, jsDelivr | CSV import only |
| Google model-viewer | 4.0.0, jsDelivr | GLB preview only |
| Esri World Street Map | `World_Street_Map/MapServer` | Default tiles |
| Esri World Imagery | `World_Imagery/MapServer` | Alternate tiles |
| Esri World Topographic Map | `World_Topo_Map/MapServer` | Alternate tiles |

No credentials or API keys are embedded. Pin versions; review licenses and service terms for the intended deployment. CDN availability is a runtime dependency; no Subresource Integrity hashes are asserted in this delivery. Before organizational production, evaluate approved vendoring or verified SRI. Network providers receive ordinary browser requests. Leaflet license BSD-2-Clause; markercluster and Papa Parse MIT; model-viewer Apache-2.0. Libraries are linked, not redistributed.

Esri documents World Street Map and World Topo Map legacy raster retirement for **December 31, 2029**, and lack of updates since 2021. These requested basemaps are retained; plan a reviewed migration. Do not use their imagery/cartography to infer current conditions without appropriate source checks.

Sources: https://leafletjs.com/reference-1.9.4.html · https://github.com/Leaflet/Leaflet.markercluster/tree/v1.5.3 · https://modelviewer.dev/docs/ · https://www.papaparse.com/docs · https://support.esri.com/en-us/products/arcgis-location-services/arcgis-basemaps-life-cycle

## Publication review and governance

**Every original directory field is unknown for public publication until reviewed.** Public facility information does not automatically authorize publishing the Lamp Rynearson client/site association or project history. `requiresVerification` concerns data quality; `publicationReviewed` concerns release permission. One does not substitute for the other. A startup guard cannot conceal bytes already committed or hosted.

| Classification | Fields / resources | Required action |
| --- | --- | --- |
| Safe for public publication | Original application code, generic UI labels, disclaimer text, empty registry, original SVG icon | Technical/release review |
| Unknown; approval required | `id`, `siteName`, `mmSiteNumber`, `lampProjectNumber`, address/city/state/ZIP, coordinates, source/confidence, collection status/date, methods, dataset types, availability, constraints/notes if rewritten for publication, flags, all resource links, directory membership and client association | Verify source, redact as needed, record client/management approval and permitted audience |
| Internal-only; excluded | Personal emails/contacts, source operating notes, scope/delivery and stockpile details, contractual information, protected URLs, credentials/tokens, internal paths and technical project records | Keep in approved internal systems; never in public repo/history |
| Unknown; explicit asset approval required | Every KML, GLB, image and technical derivative | Review geometry/content, ownership and publication rights before committing |

Resource action fields require both a safe URL and the matching `approvedResources` flag. URL validation rejects local/network paths, non-HTTPS external schemes, root-absolute paths, traversal, SharePoint/OneDrive links, URL credentials, query strings and fragments. This conservative rule may exclude legitimate public URLs; prefer stable, approved clean links. For protected resources use **Available internally** only after their existence is confirmed; never expose the internal URL. The supplied review registry uses **Not reviewed**, since dataset/resource availability was not established.

Do not commit a source workbook, original prototype registry, personal contacts or private review imports. `.gitignore` does not sanitize Git history or provide access control. If a secret is committed, revoke it and follow the organization’s incident procedure; a later deletion does not undo disclosure.

## Release, rollback and QA/QC

Use a reviewed change/PR with the source workbook version, reconciliation counts, field/asset approval record, reviewer and test evidence in the approved internal system. In the public repo, record a sanitized release summary and tag. GitHub Actions runs code and structural checks automatically. A green check does not mean the production-data gate passed; the workflow reports missing approvals or reconciliation separately. Node and Python run only in the maintainer/CI environment, not on visitors’ devices. Run `python tools/validate_release.py`; optionally run `node tests/core.test.cjs` for core regression checks. These are maintainer checks, not a build requirement. A passing structural check does not establish source correctness or publication permission.

Complete `QA_QC_CHECKLIST.md`, verify a repository subdirectory and custom-domain layout as applicable, and inspect Console/Network. Record actual browser, date, viewport, failures and reviewer. Test every active coordinate record, missing-coordinate discoverability, status/verification styling, filters, imports/exports, KML and GLB error paths. Test a blocked Leaflet script and blocked application script; confirm a visible startup message rather than a blank screen.

For rollback, revert the release commit on main to the previous approved export/assets or redeploy the last approved tag through the normal process. Retest the live site after Pages republishes and account for browser/CDN cache. Do not restore data whose approval has been withdrawn. Disable Pages immediately if a release exposes restricted information; handle credentials and history separately.

## Known limitations and future extensions

The primary workbook is absent. Prototype claims of 42 active rows cannot be independently confirmed. All 42 approximate coordinate pairs are withheld. No KML/GLB assets were supplied. No private host/access-control configuration is assumed. Desktop map startup and street-map tiles were observed. Mobile behavior, actual KML/GLB assets and full viewer interactions still require testing. See the validation report; this is a reviewable implementation, not an approved production release.

Next priorities: (1) reconcile the workbook and approve a complete publishable directory; (2) supply sourced WGS 84 facility coordinates and approved KML/GLB assets; (3) complete actual browser/device QA and establish a governed export/release workflow. Later options include approved authenticated resource resolution, capture history, link-health monitoring and a separate approved point-cloud viewer. Do not add a backend simply for the static atlas.
