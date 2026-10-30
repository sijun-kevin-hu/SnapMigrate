# Working instructions

- Keep responses concise, direct, and comprehensive.
- Read this file and `PROJECT.md` before project work. Read the relevant README and owning source before relying on documented behavior.
- Keep `PROJECT.md` current when scope, architecture, supported behavior, limitations, or next steps change. Update this file when durable working rules change. Make these updates alongside the implementation; do not leave stale status claims.
- Treat source code as evidence of implementation, and distinguish implemented features from verified behavior. Record meaningful verification and remaining gaps without claiming unperformed checks.
- Inspect the working tree before edits; preserve unrelated user changes. Keep changes focused on the requested task.
- Preserve original exports and media. Timestamp repair must create copies, use supported date evidence, and report skipped or ambiguous files honestly. Do not silently substitute guessed dates.
- Keep media processing local unless the user explicitly initiates an upload feature. Never commit exports, personal media, credentials, tokens, or private email configuration. Server secrets must not enter browser code or `VITE_*` variables.
- Preserve bounded memory and sequential extraction when changing archive handling. Account for malformed archives, ambiguous filenames, unsupported formats, and browser limitations.
- Keep unavailable features visibly unavailable. Do not simulate authentication, uploads, delivery, or success.
- For web changes, run relevant `npm test` checks and `npm run build` from `web/` when appropriate. Documentation-only changes do not require application tests. Synthetic tests do not establish real export compatibility, playback, or provider acceptance.
- Follow the user's current instructions if they conflict with these files. Resolve documentation drift using the current source and update the affected documentation.
