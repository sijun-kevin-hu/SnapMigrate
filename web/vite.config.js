import { defineConfig, loadEnv } from 'vite';
import { createIssueHandler } from './api/report-issue.js';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
 const handler = createIssueHandler({ env: { ...loadEnv(mode, process.cwd(), ''), ...process.env } });
 const install = server => server.middlewares.use((req, res, next) => {
  if (req.url?.split('?')[0] === '/api/report-issue') return handler(req, res);
  next();
 });
 return { plugins: [{ name: 'issue-report-api', configureServer: install, configurePreviewServer: install }], build: { rollupOptions: { input: { main: resolve(process.cwd(), 'index.html'), howTo: resolve(process.cwd(), 'how-to.html') } } } };
});
