import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createIssueHandler } from '../api/report-issue.js';
const env = { ISSUE_REPORT_ORIGIN: 'https://example.test', RESEND_API_KEY: 'private-key', ISSUE_REPORT_TO: 'private@example.test', ISSUE_REPORT_FROM: 'reports@example.test' };
async function request(handler, body, options = {}) {
 const req = Readable.from([JSON.stringify(body)]);
 req.method = options.method || 'POST';
 req.headers = { origin: options.origin || env.ISSUE_REPORT_ORIGIN, 'content-type': 'application/json' };
 const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value) { this.body = JSON.parse(value); } };
 await handler(req, res);
 assert.ok(!JSON.stringify(res).includes(env.ISSUE_REPORT_TO));
 assert.ok(!JSON.stringify(res).includes(env.RESEND_API_KEY));
 return res;
}
test('reports use a private configured recipient and only user-entered fields', async () => {
 let mail;
 const handler = createIssueHandler({ env, send: async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  mail = JSON.parse(options.body); return { ok: true };
 } });
 assert.equal((await request(handler, { message: 'My export failed to open.', email: 'reply@example.test', to: 'attacker@example.test', filename: 'private.jpg' })).statusCode, 200);
 assert.deepEqual(mail.to, [env.ISSUE_REPORT_TO]);
 assert.equal(mail.reply_to, 'reply@example.test');
 assert.equal(mail.text, 'My export failed to open.');
 assert.ok(!JSON.stringify(mail).includes('private.jpg'));
});
test('rejects invalid, cross-origin, oversized, and honeypot reports without sending', async () => {
 const handler = createIssueHandler({ env, send: async () => { throw Error('Should not send'); } });
 assert.equal((await request(handler, {message:'short'})).statusCode, 400);
 assert.equal((await request(handler, {message:'Long enough report',email:'invalid'})).statusCode, 400);
 assert.equal((await request(handler, {message:'Long enough report'}, {origin:'https://other.test'})).statusCode, 403);
 assert.equal((await request(handler, {message:'x'.repeat(13000)})).statusCode, 413);
 assert.equal((await request(handler, {message:'Long enough report',website:'spam'})).statusCode, 400);
 assert.equal((await request(handler, {}, {method:'GET'})).statusCode, 405);
});
test('missing configuration and provider failures are honest and hide private errors', async () => {
 assert.equal((await request(createIssueHandler({env:{...env,RESEND_API_KEY:''}}), {message:'Long enough report'})).statusCode, 503);
 const failed = createIssueHandler({env, send:async () => { throw Error(env.ISSUE_REPORT_TO); }});
 assert.equal((await request(failed, {message:'Long enough report'})).statusCode, 502);
});
test('caps requests per process and allows them after the hour expires', async () => {
 let time = 0;
 const handler = createIssueHandler({env, now:() => time, send:async () => ({ok:true})});
 for(let i=0;i<20;i++) assert.equal((await request(handler,{message:'Long enough report'})).statusCode,200);
 assert.equal((await request(handler,{message:'Long enough report'})).statusCode,429);
 time=3600000;
 assert.equal((await request(handler,{message:'Long enough report'})).statusCode,200);
});
