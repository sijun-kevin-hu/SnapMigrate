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

- ZIPs up to 300 MB; expanded entries limited to 700 MB. Extraction is asynchronous but retained in memory. Large archives need streaming and persistent storage before public release.
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
