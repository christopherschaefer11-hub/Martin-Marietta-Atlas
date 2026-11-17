# QA/QC checklist

Release: ______  Registry/workbook version: ______  Reviewer/date: ______  Approval record: ______

Unchecked means **not established**. Actual automated checks are recorded in `VALIDATION_REPORT.md`; a passed script is not a source-validation signature. Keep sensitive evidence in the approved internal project record.

- [ ] Confirm every active workbook location is represented.
- [ ] Reconcile included/excluded counts and record every exclusion with its exact reason.
- [ ] Confirm site name against the authoritative record.
- [ ] Confirm Lamp project number without silently changing formatting.
- [ ] Confirm MM site number where available.
- [ ] Verify address source; distinguish verified, approximate, unverified and missing.
- [ ] Verify coordinate source.
- [ ] Confirm the map pin against aerial imagery and project records.
- [ ] Confirm coordinate system and datum before conversion.
- [ ] Confirm WGS 84 latitude and longitude, axis order and units.
- [ ] Confirm missing coordinates remain null and records remain discoverable.
- [ ] Identify whether each KML represents a point, approximate extent or validated geometry.
- [ ] Confirm KML is not presented as an authoritative boundary unless established; this viewer always shows the disclaimer.
- [ ] Confirm links open the intended approved resource; verify exact filename capitalization.
- [ ] Confirm collection status.
- [ ] Confirm last collection date.
- [ ] Confirm capture method.
- [ ] Confirm dataset types and actual availability.
- [ ] Resolve conflicts using authority hierarchy; preserve alternate values in controlled preparation log.
- [ ] Test GLB orientation.
- [ ] Test GLB scale.
- [ ] Test GLB units.
- [ ] Test GLB local origin and documented transform.
- [ ] Compare GLB geometry against the authoritative source.
- [ ] Flag GLBs over 50 MB for optimization and check performance.
- [ ] Test clustering, expansion/spiderfying and overlapping markers.
- [ ] Test every filter alone and combinations of all filters, including no matches.
- [ ] Test case-insensitive search across all requested fields.
- [ ] Test site-list/map synchronization, selected-marker styling and filter-cleared selection.
- [ ] Test desktop.
- [ ] Test tablet.
- [ ] Test mobile drawer, scrolling, touch targets and lack of horizontal overflow.
- [ ] Test keyboard navigation, visible focus, Escape and dialog focus restoration.
- [ ] Test missing data and malformed/duplicate registry records.
- [ ] Test broken links and blocked basemaps.
- [ ] Test missing KML, malformed XML, polygon holes, overlay toggle/removal and rapid load cancellation.
- [ ] Test missing GLB, invalid GLB, blocked viewer library, reset view and fullscreen.
- [ ] Test CSV/JSON import, filtered exports, formulas, quotes, multivalues and leading-zero identifiers.
- [ ] Confirm private imports remain outside repository and are rejected on public hosting.
- [ ] Test required script/CSS failures and confirm visible startup messages.
- [ ] Test actual GitHub Pages subdirectory and custom-domain URL if used.
- [ ] Confirm all disclaimers remain visible and readable.
- [ ] Check browser Console and Network for unexpected errors and missing assets.
- [ ] Confirm no credentials, contacts, sensitive notes, internal paths or restricted URLs are embedded in any files or Git history.
- [ ] Confirm GitHub repository visibility and site audience; do not assume private Pages access.
- [ ] Confirm field-level and resource-level publication review.
- [ ] Confirm client and management approval before public release.
- [ ] Record release/tag, live URL, approval evidence and rollback target.
