# SnapMigrate web preview

Browser counterpart to the Swift prototype. Select or drop a Snapchat ZIP, scan local media, review counts/date information, and preview up to 12 files. Google Photos import is visibly disabled until OAuth and uploads are implemented. No fake upload success or simulated connection.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

`npm run build` creates `dist/`. `npm run preview` serves the built app.

## Current boundaries

- ZIPs up to 2.5 GiB (2,684,354,560 bytes). The directory is read lazily and media is extracted sequentially, rather than holding the entire archive in memory.
- Large corrected ZIPs require desktop Chrome/Edge with `showSaveFilePicker`; output streams directly to the chosen file. Other browsers have a 100 MB expanded-output limit. Keep the tab open while processing.
- Individual media files over 128 MiB are skipped; metadata is limited to 16 MiB. Previews load at most 12 images, each up to 5 MiB; videos are not preloaded. Per-file limits bound memory while timestamp writers still use full individual files.
- Large-file desktop browser validation with a real export remains outstanding.
- Recognizes JPG/JPEG, PNG, WebP, GIF, HEIC, MP4, MOV. Browser playback/HEIC support varies.
- Reads `memories_history.json` and matches metadata by exact media basename. Ambiguous metadata names are not matched. Filename dates are explicitly unverified. Unknown dates remain unknown.
- JPG/JPEG EXIF timestamps and UTC offsets can now be written from exact, timezone-qualified export metadata matches. MP4 movie/track/media creation and modification fields are updated in place without re-encoding. Originals remain untouched.
- Download corrected copies and a JSON report of every corrected/skipped file. Unsupported formats, duplicate filenames, missing/ambiguous dates, malformed files, and overflowing MP4 dates are skipped.
- JPEG EXIF is reserialized using piexifjs; vendor-specific or unknown tags may not survive. MP4 textual/XMP date fields are not rewritten and may conflict with header dates in some readers.
- No Google authentication, upload, persistent progress, or deduplication yet.
- Link-only exports are unsupported. Media stays in the browser; Google Fonts requests load typography externally.
- No deployment or public-release verification has been completed.

## Next milestone

Validate a real export's metadata schema and date matching, check corrected files in independent metadata readers, and prove a small Google Photos upload with an OAuth test account before enabling import.

## Verification

Run `npm test`. Synthetic fixtures check EXIF readback, orientation retention, unchanged JPEG scan bytes, MP4 v0/v1 field updates and unchanged media bytes, nonmutation of inputs, invalid dates and ambiguous matching. These are structural tests, not real Snapchat playback or Google Photos acceptance tests.

Format references: [JPEG EXIF library](https://piexifjs.readthedocs.io/en/latest/about.html), [QuickTime timestamp epoch](https://developer.apple.com/documentation/quicktime-file-format/movie_header_atom/creation_time).

## Private issue reporting

The footer opens an accessible report dialog. It POSTs only the entered description and optional reply email to `/api/report-issue`; media and filenames are never attached. The recipient address and email credentials live only on the server, never in `src/`, browser responses, or `VITE_*` variables.

Copy `.env.example` to `.env.local` and configure `ISSUE_REPORT_TO`, `ISSUE_REPORT_FROM` (an approved Resend sender), `RESEND_API_KEY`, and `ISSUE_REPORT_ORIGIN` (the exact site origin). The local recipient is already configured privately. Restart Vite after changing configuration. Vite dev and preview provide the endpoint locally. Production hosting must run `api/report-issue.js` as a Node request/response handler at that path and supply those private environment variables; publishing only `dist/` does not enable email delivery. See [Resend's email API](https://resend.com/docs/api-reference/emails/send-email).

The handler validates and limits report sizes, checks the configured origin, uses a honeypot and a per-process cap of 20 requests/hour, and never returns provider errors or recipient details. Before public launch, configure shared rate limiting at the hosting edge; per-process limits reset with restarts and do not cover multiple instances. Without email configuration it returns an honest unavailable message and retains the report text. Live email delivery is not verified.
