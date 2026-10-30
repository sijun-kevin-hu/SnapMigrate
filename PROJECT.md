# SnapMigrate

## Purpose and scope

Help users move Snapchat Memories while preserving original capture dates. The repository contains a native iOS prototype for Apple Photos and a browser implementation whose eventual destination is Google Photos. Current development has focused on the web implementation; do not assume the native prototype has the same capabilities.

## Repository map

- `web/src/main.js`: ZIP selection, metadata matching, previews, and corrected ZIP workflow.
- `web/src/archive.js`: bounded archive reading and extraction.
- `web/src/timestamps.js`: JPEG EXIF and MP4 header timestamp repair.
- `web/src/how-to.js`, `web/src/style.css`: instructions and presentation.
- `web/src/report-issue.js`, `web/api/report-issue.js`: issue dialog and private server email endpoint.
- `web/test/`: synthetic archive, timestamp, and issue-handler tests.
- `web/vite.config.js`: main/how-to page builds and local issue endpoint integration.
- `SnapMigrate/`, `SnapMigrate.xcodeproj/`: SwiftUI prototype, metadata parsing, ZIP extraction, and Apple Photos import. See the root README for Xcode setup and ZIPFoundation requirements.

## Current web behavior

- Opens local ZIP exports, scans supported media, summarizes dates/counts, and provides paginated previews.
- Matches `memories_history.json` using exact media basenames; ambiguous matches are rejected. ZIP UTC timestamps are also supported date evidence. Filename-derived dates are unverified and cannot authorize repair.
- Creates corrected JPG/JPEG and MP4 copies plus a JSON correction/skip report. JPEG EXIF is reserialized with piexifjs; MP4 timestamp headers are edited without re-encoding. Originals remain unchanged.
- Google Photos connection/import remains disabled. OAuth, uploads, persistent progress, and deduplication are not implemented.
- Link-only exports are unsupported. Other recognized media formats can be reviewed but are not repaired.
- Issue reports contain entered text and optional reply email, without media or filenames. Email delivery requires private server configuration; a static `dist/` deployment alone does not provide the endpoint.

## Constraints and known gaps

- ZIP limit: 2.5 GiB; individual media: 128 MiB; metadata: 16 MiB. Extraction is sequential. See `web/README.md` for preview and output limits.
- Large corrected ZIPs require desktop Chrome/Edge file saving support; other browsers have a 100 MB expanded-output limit.
- JPEG rewriting may lose unknown/vendor tags. MP4 textual/XMP dates are not rewritten and may conflict with updated headers.
- Real export compatibility, independent timestamp readback, large-export browser behavior, Google Photos acceptance, live issue email delivery, and public deployment verification remain outstanding.
- Issue reporting uses an in-process rate cap. Shared hosting-edge rate limiting is required before public launch.
- Media stays local in the current browser workflow; externally loaded Google Fonts still make typography requests.

## Next milestones

1. Validate a real export's metadata schema and exact date matching.
2. Inspect corrected JPG/MP4 files in independent metadata readers and check playback and dates.
3. Validate large archive processing in supported desktop browsers.
4. Prove a small Google Photos upload using an OAuth test account before enabling import.
5. Verify production issue delivery, shared rate limiting, and deployment behavior before public release.

## Development and verification

From `web/`, use `npm install`, `npm run dev`, `npm test`, and `npm run build`; `npm run preview` serves the build. Node.js 20.19+ or 22.12+ is required. Consult `web/README.md` for configuration and detailed boundaries.

Synthetic tests cover structural repair and safety properties; they do not prove real Snapchat compatibility or destination date handling. This document was established from repository inspection on 2026-10-30; no new runtime verification was performed for its creation.

## Documentation maintenance

Maintain this file and `AGENTS.md` as part of future project work. Keep enduring instructions in `AGENTS.md`, project state and decisions here, and operational setup details in the relevant README. Update completed milestones and verification gaps when evidence changes.
