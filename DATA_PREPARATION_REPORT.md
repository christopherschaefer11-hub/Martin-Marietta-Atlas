# Data preparation report

Prepared November 16, 2026 (America/Chicago). **Source: supplied prototype, not the primary workbook.**

## Sources inspected

`index.html`, `sites.js`, `README.md` and `README.txt` were read completely. The user identified README.txt as belonging in the KML folder; it contains placement instructions only, not geometry. The source README says the registry represents rows 5–46 (42 active locations) of `MM_Project_Directory_LiveURLs.xlsx`. The workbook itself was not available, so that claim is recorded but not independently established.

## Reconciliation counts

| Measure | Result | Evidence / limitation |
| --- | ---: | --- |
| Active workbook records | Unknown | Workbook not supplied; prototype README claims 42 |
| Workbook locations directly processed | 0 | No workbook rows inspected |
| Supplied prototype records processed | 42 | Counted in sites.js |
| Records preserved in separate private review import | 42 | Full identity set retained, no demo substitution |
| Records in public bundled registry | 0 | All 42 awaiting source/publication review |
| Original coordinate pairs | 42 | All explicitly labeled approximate in prototype |
| Approved usable facility coordinates | 0 | No authoritative coordinate source or approximation approval supplied |
| Records missing usable coordinates in review import | 42 | Both coordinate values set to null |
| Records currently displayed on map | 0 | No fabricated or unapproved pins |
| Populated source street addresses | 25 | Copied as unverified in private review only |
| Verified addresses | 0 | No independent authoritative check performed |
| Confirmed approximate addresses | 0 established | Do not confuse approximate coordinates with approximate addresses |
| Unverified populated addresses | 25 | Await workbook/project-record check |
| Missing street addresses | 17 | No address invented from locality or source narrative |
| Records with flagged source conflicts | 3 | Two identity/narrative conflicts, one reported dataset discrepancy |
| Records requiring verification | 42 | Source and coordinate uncertainty |
| Prototype KML references | 38 | Counted; source README claims 39 |
| Actual included/approved KML files | 0 | No site KML supplied |
| Actual included/approved GLB files | 0 | No GLB supplied |
| Point-cloud URL references | 0 | No point-cloud URLs supplied |
| Prototype site-record links | 38 | All withheld pending approval/target checks |
| Source records containing notes | 42 | Raw operating/contact notes excluded |
| Source records containing constraints | 1 | Raw constraint excluded |
| Source records containing email addresses | 11 | Personal emails excluded |

## Decisions and unresolved conflicts

1. **Coordinate policy:** all 42 source coordinate pairs are approximations without approval or distinct coordinate-source evidence. Neither a facility pin nor a city approximation is published. Review records remain in Missing coordinates. The initial Midwest camera center is map framing only, not a facility record.
2. **KML mismatch:** README says 39 KML registrations; registry contains 38 nonempty KML URLs. The actual filenames/geometry were not supplied. Registering filenames does not prove file presence. No KML buttons are exposed. The workbook’s KML Links sheet must resolve the discrepancy.
3. **Record conflicts:** two records have populated project-number fields while their narrative says a project number was not established. Preserve field values in private review with a conflict flag; do not guess corrected numbers. One additional source narrative reports an unresolved dataset discrepancy; its numeric operating details are not reproduced. Exact affected records are flagged in the separate review JSON.
4. **Formatting:** several source project numbers have inconsistent leading-zero lengths. Preserve them as supplied; this is a formatting-review issue, not sufficient evidence of a corrected identifier.
5. **Collection status:** source status is retained in private review: 2 known facilities/no collection recorded, 21 previously collected, 8 scheduled/requested, 11 current usable dataset available. None has been verified against authoritative project records. Red verification outlines must not replace normal fill.
6. **Resource availability:** no actual KML, model or point-cloud availability was demonstrated. Review `datasetTypes` is empty and `resourceAvailability` is Not reviewed. Original KML registrations remain a preparation finding, not a public availability claim.
7. **Publication:** code and an empty registry are packaged for a public repository. All 42 unapproved location records are held in a separate private import; they are not discarded and can be inspected through browser-session file import. At the initial packaging checkpoint, no repository or website was published. Refer to the current validation report for deployment status. The complete production-data requirement remains blocked pending workbook reconciliation and approval.

## Exclusions and replacements

No prototype location was excluded from the private review import. All 42 were excluded from the public bundled registry for the same exact reason: **source correctness and permission to publish the client/site association and record fields have not been established**.

Across the private derivative: all 42 approximate coordinate pairs were replaced with null; all 42 raw notes and the one populated constraint were removed; all 38 KML links and all 38 site-record URLs were blanked; absent GLB/point-cloud/project-folder links remain blank. Personal contacts, operating/delivery/scope details and protected-resource information are not reproduced. No invented coordinates, addresses, identifiers, dates, captures, datasets, URLs, extents or models were added.

Unknown/TBD, Missing coordinates, Not reviewed and empty/null fields are explicit missing-data states, not fictional site data. The full source files remain unchanged outside the repository. Reconciliation should use the workbook and controlled source history; the sanitized derivative cannot recover excluded content.

## Required before production

Supply the primary workbook or an approved complete export with active flags. Reconcile all 42 prototype identities and any workbook additions/removals using the prescribed join priority. Approve each publishable field/resource, source coordinates, and resolve the flagged conflicts. Create the complete approved registry; then run the release and browser checks. Counts here must be updated from the actual workbook, not repeated from this prototype report.
