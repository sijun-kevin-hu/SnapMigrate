import './style.css';
import { unzip } from 'fflate';

const app = document.querySelector('#app');
let assets = [], urls = [], busy = false;
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
app.innerHTML = `<header><a class="brand" href="./"><span class="mark">↗</span> SnapMigrate</a><span class="badge">Work in progress</span></header><main><section class="intro"><h1>A tool for moving your Snapchat Memories.</h1><p class="lead">Uploading your Snapchat JPGs and MP4s directly can leave behind their original timestamps. Your memories end up out of order, and fixing the dates one by one is annoying.</p><p class="lead">SnapMigrate is a free project built to help with that: match memories to their export metadata, check their dates, and eventually move them into Google Photos with those dates preserved.</p><p class="preview-note"><strong>Available now:</strong> open an export and review its media and date information. Timestamp repair and Google Photos import are still being built.</p></section><section class="workspace" aria-labelledby="workspace-title"><nav aria-label="Migration steps"><span id="step1" aria-current="step">1 · Select export</span><span id="step2">2 · Review memories</span><span>3 · Import</span></nav><div id="panel"></div></section><section class="notes" aria-labelledby="benefits-title"><h2 id="benefits-title">Why use SnapMigrate?</h2><ul class="benefits"><li><strong>Keep memories in their original order.</strong> The goal is to preserve the original timestamps when moving your Snapchat JPGs and MP4s to Google Photos. For now, this preview checks export dates and flags missing or unverified timestamps.</li><li><strong>Review everything in one place.</strong> See photo and video counts and preview a sample of your memories before moving them.</li><li><strong>Keep your files on your device.</strong> This preview reads your export locally in your browser. Your photos and videos aren’t uploaded.</li></ul></section><section class="contribution"><h2>A free contribution for anyone who needs it</h2><p>This started as a practical way to make a one-time migration less annoying. The aim is to share a useful tool that others can use and improve.</p><p>Helpful contributions include testing different export formats, reporting incorrect dates, improving the instructions, and working on timestamp preservation and Google Photos support. Public contribution links will be added when the repository is published.</p></section></main><footer>SnapMigrate <span>Independent project · Not affiliated with Snapchat or Google</span></footer>`;
const panel = document.querySelector('#panel');
function reset() {
 urls.forEach(URL.revokeObjectURL); urls = []; assets = [];
 document.querySelector('#step1').setAttribute('aria-current','step'); document.querySelector('#step2').removeAttribute('aria-current');
 panel.innerHTML = `<div class="drop" id="drop"><div class="file-icon" aria-hidden="true">↥</div><h2 id="workspace-title">Open your Snapchat export</h2><p>Choose the ZIP file from your Snapchat My Data export.</p><label class="button" for="file">Choose ZIP file <span aria-hidden="true">↗</span></label><input id="file" type="file" accept=".zip,application/zip"><p class="small">or drop it here · ZIP files up to 300 MB in this preview</p></div><details><summary>How do I get my Snapchat export?</summary><p>In Snapchat, open Settings → My Data and request your Memories export. Download the ZIP with your media included. An export containing only download links cannot be imported in this preview.</p></details>`;
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
 if(file.size > 300 * 1024 * 1024) return showError('This preview supports ZIPs up to 300 MB. Large-export streaming is still in development.');
 busy = true;
 panel.innerHTML = `<div class="status" role="status"><div class="spinner"></div><h2>Opening your memories…</h2><p>Extracting media and checking date information locally.</p></div>`;
 try {
 const bytes = new Uint8Array(await file.arrayBuffer());
 let expanded = 0;
 const files = await new Promise((resolve,reject) => unzip(bytes, {filter(entry) {
 expanded += entry.originalSize;
 if(expanded > 700 * 1024 * 1024) throw new Error('The expanded export is too large for this preview (700 MB maximum).');
 return /\.(json|jpe?g|png|webp|gif|heic|mp4|mov)$/i.test(entry.name) && !entry.name.includes('__MACOSX');
 }}, (err,result) => err ? reject(err) : resolve(result)));
 const historyKey = Object.keys(files).find(p => /(^|\/)memories_history\.json$/i.test(p));
 let entries = [], metadataWarning = '';
 if(historyKey) {try { const history = JSON.parse(new TextDecoder().decode(files[historyKey])); entries = history['Saved Media'] || []; if(!Array.isArray(entries)) throw Error(); } catch {entries=[]; metadataWarning='The metadata file could not be read. Only filename dates are shown.';}}
 const byName = new Map();
 for(const entry of entries) {
 for(const key of ['Filename','File Name','filename','Media URL','Download Link']) {
 const value = entry[key]; if(typeof value !== 'string') continue;
 try {const name = decodeURIComponent(value.split('?')[0].split('/').pop()); if(!byName.has(name)) byName.set(name,entry); else byName.set(name,null);} catch {}
 }
 }
 urls.forEach(URL.revokeObjectURL); urls=[];
 assets = Object.entries(files).filter(([p]) => /\.(jpe?g|png|webp|gif|heic|mp4|mov)$/i.test(p)).map(([path,data]) => {
 const name=path.split('/').pop(), ext=name.split('.').pop().toLowerCase(), entry=byName.get(name);
 const metadataDate=parseDate(entry?.Date), date=metadataDate || filenameDate(name);
 const type=/^(mp4|mov)$/.test(ext)?'video':'image';
 const mime=({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',heic:'image/heic',mp4:'video/mp4',mov:'video/quicktime'})[ext];
 // Create preview URLs only for the visible sample to limit memory use.
 return {name,date,type,source:metadataDate?'Export metadata':date?'Filename (unverified)':'Date unavailable',data,mime};
 });
 if(!assets.length) throw Error('No photos or videos were found. Download a Snapchat export with media included; link-only exports are not supported yet.');
 renderReview(file.name,metadataWarning);
 } catch(error) {showError(error.message || 'Unable to open this ZIP. Try downloading the export again.');}
 finally {busy=false;}
}
function renderReview(name,warning) {
 document.querySelector('#step1').removeAttribute('aria-current'); document.querySelector('#step2').setAttribute('aria-current','step');
 const images=assets.filter(a=>a.type==='image').length, missing=assets.filter(a=>!a.date).length, unverified=assets.filter(a=>a.source.startsWith('Filename')).length;
 const dates=assets.flatMap(a=>a.date?[a.date]:[]).sort((a,b)=>a-b);
 const fmt=d=>d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
 panel.innerHTML=`<div class="review"><p class="eyebrow">EXPORT OPENED</p><h2 id="workspace-title">Review your export</h2><p class="filename">${escape(name)}</p><div class="stats"><div><strong>${images}</strong><span>Photos</span></div><div><strong>${assets.length-images}</strong><span>Videos</span></div><div><strong>${assets.length}</strong><span>Total memories</span></div></div><p class="range">${dates.length?`${fmt(dates[0])} — ${fmt(dates.at(-1))} · UTC`:'No capture dates found'}</p>${warning?`<p class="notice">${escape(warning)}</p>`:''}${missing || unverified?`<p class="notice">${missing} memories have no date. ${unverified} use unverified filename dates. Dates must be checked before import.</p>`:''}<div class="gallery">${assets.slice(0,12).map((a,i)=>{const url=URL.createObjectURL(new Blob([a.data],{type:a.mime}));urls.push(url);return `<figure>${a.type==='video'?`<video src="${url}" controls preload="metadata" aria-label="${escape(a.name)}"></video>`:a.mime==='image/heic'?'<div class="unsupported">HEIC<br>Preview unavailable</div>':`<img src="${url}" alt="${escape(a.name)}" loading="lazy">`}<figcaption><span>${escape(a.name)}</span><small>${a.date?fmt(a.date):'Unknown date'} · ${a.source}</small></figcaption></figure>`;}).join('')}</div>${assets.length>12?`<p class="small">Showing 12 of ${assets.length} memories.</p>`:''}<div class="destination"><div><b>Google Photos import</b><p>Direct import is not connected in this preview. No files have been uploaded.</p></div><button disabled>Connect Google Photos</button></div><button class="text-button" id="reset">Choose another export</button></div>`;
 document.querySelector('#reset').onclick=reset;
}
function showError(message) {panel.innerHTML=`<div class="status" role="alert"><h2>Let’s try another export</h2><p>${escape(message)}</p><button id="retry">Choose another file</button></div>`;document.querySelector('#retry').onclick=reset;}
window.addEventListener('beforeunload',()=>urls.forEach(URL.revokeObjectURL));
reset();
