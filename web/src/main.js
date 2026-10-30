import './style.css';
import { setupIssueReporting } from './report-issue.js';
import { ZipWriter, BlobWriter, Uint8ArrayReader, TextReader } from '@zip.js/zip.js';
import { openArchive, readEntry, MAX_ARCHIVE_BYTES } from './archive.js';
import { parseExportDate, metadataIndex, repairAsset, zipUtcTimestamp } from './timestamps.js';

const app = document.querySelector('#app');
let assets = [], urls = [], busy = false, archive = null, previewPage = 0, previewUrls = [];
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
app.innerHTML = `<header><a class="brand" href="./"><span class="mark">↗</span> SnapMigrate</a><div class="header-actions"><a class="header-link" href="./how-to.html">How-To guide</a><span class="badge">Work in progress</span></div></header><main><section class="intro"><h1>A tool for moving your Snapchat Memories.</h1><p class="lead">Uploading your Snapchat JPGs and MP4s directly can leave behind their original timestamps. Your memories end up out of order, and fixing the dates one by one is annoying.</p><p class="lead">SnapMigrate is a free project built to help with that: match memories to their export metadata, check their dates, and eventually move them into Google Photos with those dates preserved.</p><p class="preview-note"><strong>Available now:</strong> review an export and download JPG/MP4 copies with timestamps written from matched metadata. Google Photos import is still being built. <a href="./how-to.html">See the step-by-step guide</a>.</p></section><section class="workspace" aria-labelledby="workspace-title"><nav aria-label="Migration steps"><span id="step1" aria-current="step">1 · Select export</span><span id="step2">2 · Review memories</span><span>3 · Import</span></nav><div id="panel"></div></section><section class="notes" aria-labelledby="benefits-title"><h2 id="benefits-title">Why use SnapMigrate?</h2><ul class="benefits"><li><strong>Keep memories in their original order.</strong> The goal is to preserve the original timestamps when moving your Snapchat JPGs and MP4s to Google Photos. You can now download corrected JPG/MP4 copies when an exact export timestamp is available. Missing or unverified dates are skipped.</li><li><strong>Review everything in one place.</strong> See photo and video counts and preview a sample of your memories before moving them.</li><li><strong>Keep your files on your device.</strong> This preview reads your export locally in your browser. Your photos and videos aren’t uploaded.</li></ul></section><section class="contribution"><h2>A free contribution for anyone who needs it</h2><p>This started as a practical way to make a one-time migration less annoying. The aim is to share a useful tool that others can use and improve.</p><p>Helpful contributions include testing different export formats, reporting incorrect dates, improving the instructions, and working on timestamp preservation and Google Photos support. Public contribution links will be added when the repository is published.</p></section></main><footer><span>SnapMigrate · <button type="button" class="issue-link" id="report-issue">Report an issue</button></span><span>Independent project · Not affiliated with Snapchat or Google</span></footer>`;
setupIssueReporting();
const panel = document.querySelector('#panel');
function reset() {
 previewGeneration++;
 previewUrls.forEach(URL.revokeObjectURL); previewUrls = []; previewPage = 0;
 archive?.reader.close(); archive = null;
 urls.forEach(URL.revokeObjectURL); urls = []; assets = [];
 document.querySelector('#step1').setAttribute('aria-current','step'); document.querySelector('#step2').removeAttribute('aria-current');
 panel.innerHTML = `<div class="drop" id="drop"><div class="file-icon" aria-hidden="true">↥</div><h2 id="workspace-title">Open your Snapchat export</h2><p>Choose the ZIP file from your Snapchat My Data export.</p><label class="button" for="file">Choose ZIP file <span aria-hidden="true">↗</span></label><input id="file" type="file" accept=".zip,application/zip"><p class="small">or drop it here · ZIP files up to 2.5 GB · recommended: latest desktop Chrome or Edge</p></div><div class="browser-note"><strong>Recommended: the latest Chrome or Edge on a computer.</strong><p>These browsers can save large corrected ZIPs directly to disk. Safari and other browsers without this feature are limited to 100 MB of expanded files for downloads in this tool.</p>${window.showSaveFilePicker ? '' : '<p><strong>This browser does not provide direct-to-disk saving.</strong> For a large export, open this page in the latest desktop Chrome or Edge.</p>'}</div><details><summary>How do I get my Snapchat export?</summary><p>In Snapchat, open Settings → My Data and request your Memories export. Download the ZIP with your media included. An export containing only download links cannot be imported in this preview.</p></details>`;
 document.querySelector('#file').onchange = e => { if(e.target.files[0]) scan(e.target.files[0]); };
 const drop = document.querySelector('#drop');
 drop.ondragover = e => {e.preventDefault(); drop.classList.add('drag');};
 drop.ondragleave = () => drop.classList.remove('drag');
 drop.ondrop = e => {e.preventDefault(); drop.classList.remove('drag'); if(e.dataTransfer.files[0]) scan(e.dataTransfer.files[0]);};
}
function parseDate(value) {
 if (!value) return null;
 const normalized = String(value).replace(/ UTC$/, 'Z').replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T');
 const date = new Date(normalized);
 return Number.isNaN(date.getTime()) ? null : date;
}
function filenameDate(name) {
 const m = name.match(/(\d{4}-\d{2}-\d{2})(?:[T_ ](\d{2})[-:](\d{2})[-:](\d{2}))?/);
 return m ? parseDate(m[1] + (m[2] ? `T${m[2]}:${m[3]}:${m[4]}Z` : 'T00:00:00Z')) : null;
}
async function scan(file) {
 if(busy) return;
 if(!/\.zip$/i.test(file.name)) return showError('Choose a ZIP file from your Snapchat export.');
 if(file.size > MAX_ARCHIVE_BYTES) return showError('Choose a ZIP no larger than 2.5 GB (2.5 GiB).');
 busy = true;
 panel.innerHTML = `<div class="status" role="status"><div class="spinner"></div><h2>Opening your memories…</h2><p>Extracting media and checking date information locally.</p></div>`;
 try {
 archive = await openArchive(file);
 const files = archive.entries;
 const historyKey = files.find(e => /(^|\/)memories_history\.json$/i.test(e.filename));
 let entries = [], metadataWarning = '';
 if(historyKey) {try { const history = JSON.parse(new TextDecoder().decode(await readEntry(historyKey, 16 * 1024 ** 2))); entries = history['Saved Media'] || []; if(!Array.isArray(entries)) throw Error(); } catch {entries=[]; metadataWarning='The metadata file could not be read. Only filename dates are shown.';}}
 const byName = metadataIndex(entries);
 if (entries.length && byName.size === 0) metadataWarning = 'Your metadata contains timestamps but no filenames or download links to match them to these files. Filename dates are shown below; ZIP UTC timestamps will be used where they agree with the filename date; other original times remain unknown.';
 const mediaPaths = files.map(e => e.filename).filter(p => /\.(jpe?g|png|webp|gif|heic|mp4|mov)$/i.test(p));
 const nameCounts = new Map();
 for (const path of mediaPaths) { const name = path.split('/').pop(); nameCounts.set(name, (nameCounts.get(name) || 0) + 1); }
 urls.forEach(URL.revokeObjectURL); urls=[];
 assets = files.filter(e => /\.(jpe?g|png|webp|gif|heic|mp4|mov)$/i.test(e.filename)).map(zipEntry => {
 const path = zipEntry.filename;
 const name=path.split('/').pop(), ext=name.split('.').pop().toLowerCase(), entry=nameCounts.get(name) === 1 ? byName.get(name) : null;
 const metadataDate=parseExportDate(entry?.Date), zipDate=zipUtcTimestamp(zipEntry,name), date=metadataDate || zipDate || filenameDate(name);
 const type=/^(mp4|mov)$/.test(ext)?'video':'image';
 const mime=({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',heic:'image/heic',mp4:'video/mp4',mov:'video/quicktime'})[ext];
 // Create preview URLs only for the visible sample to limit memory use.
 const timeKnown = Boolean(metadataDate || zipDate) || /\d{4}-\d{2}-\d{2}[T_ ]\d{2}[-:]\d{2}[-:]\d{2}/.test(name);
 return {name,date,timeKnown,type,source:metadataDate?'Export metadata':zipDate?'ZIP UTC timestamp':date?'Filename (unverified)':'Date unavailable',zipEntry,mime};
 });
 if(!assets.length) throw Error('No photos or videos were found. Download a Snapchat export with media included; link-only exports are not supported yet.');
 await renderReview(file.name,metadataWarning);
 } catch(error) {showError(error.message || 'Unable to open this ZIP. Try downloading the export again.');}
 finally {busy=false;}
}
async function renderReview(name,warning) {
 document.querySelector('#step1').removeAttribute('aria-current'); document.querySelector('#step2').setAttribute('aria-current','step');
 const images=assets.filter(a=>a.type==='image').length, missing=assets.filter(a=>!a.date).length, unverified=assets.filter(a=>a.source.startsWith('Filename')).length;
 const dates=assets.flatMap(a=>a.date?[a.date]:[]).sort((a,b)=>a-b);
 const fmt=d=>d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
 panel.innerHTML=`<div class="review"><p class="eyebrow">EXPORT OPENED</p><h2 id="workspace-title">Review your export</h2><p class="filename">${escape(name)}</p><div class="stats"><div><strong>${images}</strong><span>Photos</span></div><div><strong>${assets.length-images}</strong><span>Videos</span></div><div><strong>${assets.length}</strong><span>Total memories</span></div></div><p class="range">${dates.length?`${fmt(dates[0])} — ${fmt(dates.at(-1))} · UTC`:'No capture dates found'}</p>${warning?`<p class="notice">${escape(warning)}</p>`:''}${missing || unverified?`<p class="notice">${missing} memories have no date. ${unverified} use unverified filename dates. Dates must be checked before import.</p>`:''}<div id="preview-gallery" class="gallery"></div><div class="pagination"><button id="preview-prev" type="button">Previous</button><span id="preview-page" role="status" aria-live="polite"></span><button id="preview-next" type="button">Next</button></div><div class="repair"><h3>Write original timestamps</h3><p>Create corrected JPG and MP4 copies using matched metadata or ZIP UTC timestamps. Files with missing or unverified dates and unsupported formats are skipped. Your original export stays unchanged. Files are processed one at a time; individual files over 128 MB are skipped. For large exports, use the latest Chrome or Edge on a computer and choose where to save.</p><button id="repair">Save corrected ZIP</button><div id="repair-status" role="status" aria-live="polite"></div></div><div class="destination"><div><b>Google Photos import</b><p>Direct import is not connected in this preview. No files have been uploaded.</p></div><button disabled>Connect Google Photos</button></div><button class="text-button" id="reset">Choose another export</button></div>`;
 document.querySelector('#reset').onclick=reset;
 document.querySelector('#repair').onclick=prepareDownload;
 document.querySelector('#preview-prev').onclick=()=>loadPreviewPage(previewPage-1);
 document.querySelector('#preview-next').onclick=()=>loadPreviewPage(previewPage+1);
 await loadPreviewPage(0);
}
let previewGeneration = 0;
async function loadPreviewPage(page) {
 const generation = ++previewGeneration;
 previewPage = page;
 previewUrls.forEach(URL.revokeObjectURL); previewUrls = [];
 const gallery = document.querySelector('#preview-gallery');
 const previous = document.querySelector('#preview-prev'), next = document.querySelector('#preview-next');
 previous.disabled = true; next.disabled = true;
 const start = page * 12, items = assets.slice(start,start+12);
 document.querySelector('#preview-page').textContent = `Page ${page+1} of ${Math.ceil(assets.length/12)} · ${start+1}–${start+items.length} of ${assets.length}`;
 gallery.innerHTML = '<p role="status">Loading previews…</p>';
 const cards = [];
 for (const a of items) {
  let url;
  try {
   if (a.mime !== 'image/heic') {
    const data = await readEntry(a.zipEntry, (a.type === 'video' ? 12 : 5) * 1024 ** 2);
    if(generation !== previewGeneration || !gallery.isConnected) return;
    url = URL.createObjectURL(new Blob([data],{type:a.mime})); previewUrls.push(url);
   }
  } catch {}
  if(generation !== previewGeneration || !gallery.isConnected) return;
  const stamp = a.date && !a.timeKnown ? a.date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}) + ' · Time unknown' : a.date ? a.date.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC',hour12:false}) + ' UTC' : 'Unknown date and time';
  cards.push(`<figure>${!url?'<div class="unsupported">Preview unavailable<br>File too large or unsupported</div>':a.type==='video'?`<video src="${url}" controls preload="metadata" aria-label="${escape(a.name)}"></video>`:`<img src="${url}" alt="${escape(a.name)}" loading="lazy">`}<figcaption><span title="${escape(a.name)}">${escape(a.name)}</span><small>${escape(stamp)}</small><small>Date source: ${escape(a.source)}</small></figcaption></figure>`);
 }
 gallery.innerHTML = cards.join('');
 previous.disabled = page === 0; next.disabled = start + 12 >= assets.length;
}
async function prepareDownload() {
 const button = document.querySelector('#repair'), status = document.querySelector('#repair-status'), resetButton = document.querySelector('#reset');
 button.disabled = true; resetButton.disabled = true;
 const report = [];
 let writer, sink, disk = false;
 try {
  if (window.showSaveFilePicker) {
   const handle = await window.showSaveFilePicker({suggestedName:'snapmigrate-corrected.zip', types:[{description:'ZIP archive',accept:{'application/zip':['.zip']}}]});
   sink = await handle.createWritable(); disk = true;
  } else {
   const total = assets.reduce((sum,a) => sum + a.zipEntry.uncompressedSize,0);
   if (total > 100 * 1024 ** 2) throw Error('Large downloads need the latest desktop Chrome or Edge to save directly to disk. This browser supports downloads up to 100 MB expanded.');
   sink = new BlobWriter('application/zip');
  }
  writer = new ZipWriter(sink, {level:0});
  for (let i = 0; i < assets.length; i++) {
   const asset = assets[i];
   status.textContent = `Processing ${i + 1} of ${assets.length}…`;
   await new Promise(resolve => setTimeout(resolve, 0));
   try {
    if (!['Export metadata', 'ZIP UTC timestamp'].includes(asset.source) || !/\.(jpe?g|mp4)$/i.test(asset.name)) throw Error('No verified timestamp or unsupported file format.');
    const data = repairAsset({...asset, data:await readEntry(asset.zipEntry)});
    const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `corrected/${String(i + 1).padStart(5, '0')}-${safeName}`;
    try { await writer.add(filename, new Uint8ArrayReader(data)); } catch(error) { error.outputFailure = true; throw error; }
    report.push({file:asset.name, status:'corrected', timestamp:asset.date.toISOString(), source:asset.source, output:filename});
   } catch(error) { if(error.outputFailure) throw error; report.push({file:asset.name, status:'skipped', reason:error.message}); }
  }
  const corrected = report.filter(r => r.status === 'corrected').length;
  await writer.add('timestamp-report.json', new TextReader(JSON.stringify({corrected, skipped:report.length-corrected, files:report}, null, 2)));
  status.textContent = 'Finishing ZIP…';
  const result = await writer.close();
  let download = '';
  if (!disk) {const url = URL.createObjectURL(result); urls.push(url); download = `<a class="button" href="${url}" download="snapmigrate-corrected.zip">Download corrected ZIP + report</a>`;}
  status.innerHTML = `<p>${corrected} corrected · ${report.length-corrected} skipped. ${disk ? 'Saved to your chosen location.' : ''} The ZIP includes a report explaining every result.</p>${download}<p class="small">Google Photos date display has not been verified yet. Check a small batch before uploading your whole library.</p>`;
 } catch(error) {if(disk && sink) {try {await sink.abort();} catch {}} status.textContent = `Could not prepare download: ${error.message}`; button.disabled = false;}
 finally {resetButton.disabled = false;}
}
function showError(message) {panel.innerHTML=`<div class="status" role="alert"><h2>Let’s try another export</h2><p>${escape(message)}</p><button id="retry">Choose another file</button></div>`;document.querySelector('#retry').onclick=reset;}
window.addEventListener('beforeunload',()=>urls.forEach(URL.revokeObjectURL));
reset();
