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
- No media timestamps are rewritten yet. No Google authentication, upload, persistent progress, or deduplication yet.
- Link-only exports are unsupported. Media stays in the browser; Google Fonts requests load typography externally.
- No deployment or public-release verification has been completed.

## Next milestone

Validate a real export's metadata schema, preserve exact photo/video capture timestamps, and prove a small Google Photos upload with an OAuth test account before enabling import.
