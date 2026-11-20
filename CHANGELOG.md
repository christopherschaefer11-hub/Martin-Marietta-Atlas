# Changelog

## 0.10.0-review — 2026-11-20

- Added a collection-history timeline under the map: monthly event histogram, slider, month/quarter/year/cumulative windows, Play/Pause, and a time filter that combines with existing filters.
- Added the optional `collectionEvents` field with date-precision handling, validation, CSV/JSON round-trip and per-site history in the detail panel.
- The CSV import now recognizes the read-only `MM_File_Inventory.csv` and converts dated field-download folders into events in the browser tab; it merges into a loaded review directory by Lamp project number. No inventory data is committed.
- Added 25 timeline regression assertions using synthetic folder names.

## 0.9.1-review — 2026-11-16

- Added a visible Open review file entry point and browser-session review on hosted URLs; imports do not write to GitHub or a server. Unapproved bundled records remain rejected.
- Fixed scalar filter values containing semicolons so complete confidence labels remain selectable.
- Added GitHub Actions syntax, regression and structural checks with a commit-pinned checkout action.
- Re-ran 3,124 assertions and structural checks; GitHub Actions passed. Published the code-only review site from main/root. Verified hosted startup, street basemap, 42-record session import, combined filters, missing-coordinate details, JSON/CSV downloads and clearing the session.
- Workbook, approved coordinates/resources and production-data release remain unresolved.

## 0.9.0-review — 2026-11-16

- Preserved the supplied navy dashboard/sidebar/map concept; split HTML, CSS, pure data logic and application code into maintainable static assets.
- Added visible startup errors, explicit missing-coordinate results/details, cached marker/list objects, combined filtering, selection highlighting, responsive drawer and dialog focus behavior.
- Corrected null/blank coordinate coercion and status-count matching; retained normal status fill when verification is required.
- Added approved-only resource actions, conservative URL checks, safe text rendering, formula-safe CSV export and JSON export.
- Retained session CSV import with lazy pinned Papa Parse; added JSON import and localhost-only unapproved review imports.
- Added lazy KML geometry parsing with polygon holes, overlay toggle/removal and visible load errors; lazy pinned GLB viewer with reset and fullscreen where supported.
- Added GitHub Pages relative paths, 404 recovery, governance documentation, preparation report, QA checklist and optional validation tools.
- Preserved all 42 prototype records in a separate sanitized private-review import; withheld their unapproved approximate coordinates and publication-unreviewed data from the repository.
- Production release blocked: primary workbook, sourced coordinates, assets and approvals absent; browser verification incomplete. No deployment performed.
