# Data dictionary — schema 1

Publication classes: **Safe** = generic application metadata; **Review** = unknown until approved; **Internal** = excluded. All supplied location values require source and publication review. No field is made public merely because it appears in a workbook or on a public facility website. Review file values are not verified assertions.

| Field | Type / missing value | Meaning and validation | Publication class |
| --- | --- | --- | --- |
| `id` | string; required | Stable unique record key. Preserve source key. Reject duplicates. | Review |
| `siteName` | string; required | Authoritative site label, searchable. | Review |
| `mmSiteNumber` | string; `""` | Preserve leading zeros; never coerce to number. | Review |
| `lampProjectNumber` | string; `""` | Preserve punctuation and leading zeros; do not repair by guessing. | Review |
| `streetAddress` | string; `""` | Source address; presence does not mean verified or facility-level. | Review |
| `city` | string; `""` | Source locality; no automatic geocoding. | Review |
| `state` | string; `""` | Reviewed state abbreviation; exact filter value. | Review |
| `zip` | string; `""` | Preserve postal formatting. | Review |
| `latitude` | number or `null` | WGS 84 degrees, -90 through 90. Both coordinates needed. | Review |
| `longitude` | number or `null` | WGS 84 degrees, -180 through 180. | Review |
| `locationConfidence` | string; `""` | Examples: Verified facility coordinate; Verified address; Missing coordinates; Approved approximate city coordinate. Do not equate address and coordinate verification. | Review |
| `locationSource` | string; `""` | Identifies source, date/version where approved. Required for a map pin. | Review |
| `collectionStatus` | string; `""` | One controlled status below. Blank means not recorded. | Review |
| `lastCollectionDate` | string; `""` | ISO 8601 date YYYY-MM-DD from authoritative record. Do not infer from report delivery. | Review |
| `captureMethods` | string array; `[]` | Multiple methods, e.g. UAV photogrammetry, UAV LiDAR, Terrestrial LiDAR, Mobile mapping, GNSS or conventional survey, Hybrid, Unknown or TBD. | Review |
| `datasetTypes` | string array; `[]` | Confirmed resource types, e.g. LAS, LAZ, E57, COPC, CAD, GIS, KML, GLB. A filename registration alone does not establish availability. | Review |
| `dataStatus` | string; `""` | Governed availability/QA status. Never derive usability from a generic workbook entry. | Review |
| `glbUrl` | string; `""` | Approved relative or HTTPS `.glb` resource; lazy preview. | Review |
| `kmlUrl` | string; `""` | Approved relative or HTTPS `.kml`; lazy overlay. | Review |
| `pointCloudUrl` | string; `""` | Approved landing page/resource reference; opens externally, never in GLB viewer. | Review |
| `projectFolderUrl` | string; `""` | Approved public resource only; protected URL must be omitted. | Review |
| `siteRecordUrl` | string; `""` | Approved stable site/project landing page, not temporary preview URL. | Review |
| `resourceAvailability` | string; `""` | Available internally only when existence is confirmed; otherwise Not reviewed/Not recorded. | Review |
| `projectFolderAvailability` | string; `""` | Allows project-folder resource filtering without exposing a protected URL. | Review |
| `constraints` | string; `""` | Only separately authored, approved public constraints. Raw source constraints excluded. | Review / raw Internal |
| `notes` | string; `""` | Approved public description only; searchable. Raw source operating/contact notes excluded. | Review / raw Internal |
| `isAuthoritativeBoundary` | boolean; false | No geometry in this package is authoritative. Viewer always shows the boundary disclaimer. | Review |
| `requiresVerification` | boolean; true when flags exist | Adds a warning outline/badge; does not overwrite collection status. | Review |
| `dataQualityFlags` | string array; `[]` | Missing fields, conflicts and uncertainty; public flags must omit sensitive detail. | Review |
| `publicationReviewed` | boolean; false | Human-approved publication of this exact record for this audience. Not authentication. | Review decision |
| `approximateCoordinateApproved` | boolean; false | Explicit permission to show sourced approximate coordinates, clearly labeled. None supplied. | Review decision |
| `approvedResources` | object | Keys glbUrl, kmlUrl, pointCloudUrl, projectFolderUrl, siteRecordUrl; booleans default false. Requires permission and intended-target check. | Review decision |
| `collectionEvents` | object array; `[]` | Dated collection history for the timeline. Each event: `date` (YYYY-MM-DD, YYYY-MM or YYYY), `precision` (day, file, month, quarter, year), `kind` (Field download, Report map), `label`, `files`, `reportMaps`. `file` precision means the day came from a file timestamp, not the folder name. Invalid dates are withheld and flagged. CSV stores the array as JSON. Does not set `lastCollectionDate`. | Review (session import only until approved) |

## Collection-status styling

| Value | Fill | Interpretation |
| --- | --- | --- |
| Known facility, no collection recorded | Gray | No collection established in the approved record |
| Previously collected | Blue | Prior collection established |
| Current usable dataset available | Green | Current dataset usability established |
| Scheduled or requested | Orange | Request/schedule established; verify dates separately |
| Requires verification | Red | Explicit source status; do not assign simply because another field is missing |

Other or missing statuses retain neutral gray with a quality flag. Verification overlays a red outline without replacing normal fill. Header Collected/data counts only the exact Previously collected and Current usable dataset available statuses; it does not count arbitrary strings containing “available” or “collected.”

## Registry metadata

`MM_ATLAS_META.schemaVersion` is 1; `releaseStatus` is a descriptive release state; `workbookReconciled` is false until checked; `sourceRecordCount` is the supplied prototype count, not a certified workbook count; `approvedRecordCount` counts approved public records; `message` is the visible source/release notice. Generic metadata is safe; populated counts and notices still receive release review.

## Import and reconciliation

JSON array or `{ "sites": [...] }`; CSV exact field names. Multivalues use `|`/`;`. Empty coordinates remain null; malformed/out-of-range pairs are withheld and flagged. Source coordinates labeled approximate/prototype are withheld unless explicitly approved. Coordinates without a source are withheld. No supplied numeric pair has been approved. A source-only record remains discoverable without a map pin. Unknown object properties are dropped to avoid accidental export of new confidential fields.

Join priority is Lamp project number → MM site number → normalized site name → city/state. Ambiguous candidate sets require review. Retain alternate values and evidence in the controlled preparation log; expose only sanitized flags in public exports. Never silently overwrite conflicts.
