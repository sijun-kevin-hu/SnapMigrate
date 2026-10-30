// Server-only: never import this module from src/ or expose these values as VITE_*.
export function createIssueHandler({ env = process.env, send = fetch, now = Date.now } = {}) {
 const attempts = new Map();
 return async function handler(req, res) {
  const reply = (status, message) => {
   res.statusCode = status;
   res.setHeader('Content-Type', 'application/json');
   res.setHeader('Cache-Control', 'no-store');
   res.end(JSON.stringify({ message }));
  };
  if (req.method !== 'POST') {res.setHeader('Allow', 'POST'); return reply(405, 'Use POST.');}
  if (!env.ISSUE_REPORT_ORIGIN || req.headers.origin !== env.ISSUE_REPORT_ORIGIN) return reply(403, 'Please send your report from the SnapMigrate website.');
  if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, 'Use JSON.');
  if (!env.RESEND_API_KEY || !env.ISSUE_REPORT_TO || !env.ISSUE_REPORT_FROM) return reply(503, 'Issue reporting is not available yet. Please try again later.');
  // Bound total sends per process; configure shared rate limits at the hosting edge before public launch.
  const time = now();
  for (const [key, value] of attempts) if (time - value.start >= 3600000) attempts.delete(key);
  const bucket = attempts.get('global') || { start: time, count: 0 };
  if (bucket.count >= 20) return reply(429, 'Too many reports. Please try again later.');
  bucket.count++; attempts.set('global', bucket);
  let body;
  try {
   let raw = '';
   for await (const chunk of req) {
    raw += chunk.toString();
    if (Buffer.byteLength(raw) > 12000) return reply(413, 'Your report is too long.');
   }
   body = JSON.parse(raw);
  } catch { return reply(400, 'Could not read your report.'); }
  if (!body || typeof body !== 'object') return reply(400, 'Could not read your report.');
  if (body.website) return reply(400, 'Could not send your report.');
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (message.length < 10 || message.length > 4000 || email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return reply(400, 'Add a description of 10–4,000 characters and a valid optional email.');
  try {
   const result = await send('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ from: env.ISSUE_REPORT_FROM, to: [env.ISSUE_REPORT_TO], subject: 'SnapMigrate issue report', text: message, ...(email ? { reply_to: email } : {}) })
   });
   if (!result.ok) throw Error('Email rejected');
   return reply(200, 'Thanks! Your report has been sent.');
  } catch { return reply(502, 'We could not confirm your report was sent. Please try again later.'); }
 };
}
export default createIssueHandler();
