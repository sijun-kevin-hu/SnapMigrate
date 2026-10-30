import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <header>
    <a class="brand" href="./"><span class="mark">↗</span> SnapMigrate</a>
    <div class="header-actions"><a class="header-link" href="./">Back to the tool</a><span class="badge">How-To guide</span></div>
  </header>
  <main class="guide-main">
    <section class="guide-hero">
      <p class="eyebrow">YOUR MEMORIES, YOUR CHOICE</p>
      <h1>Move your Snapchat Memories, one step at a time.</h1>
      <p class="lead">Request your Memories from Snapchat, download the export when it’s ready, and use SnapMigrate to make supported photo and video timestamps easier to carry over.</p>
    </section>

    <section class="storage-story" aria-labelledby="storage-title">
      <div class="storage-copy">
        <p class="eyebrow">THE PROBLEM</p>
        <h2 id="storage-title">That “running out of room” moment.</h2>
        <p>Snapchat currently offers up to 5 GB of complimentary Memories storage. If your Memories are over that amount, it can be a good time to save a copy somewhere you control.</p>
        <p class="small">The screen shown here is an illustrative example, not a screenshot from Snapchat. Storage notices and options can vary by account.</p>
      </div>
      <figure class="phone-figure" aria-label="Illustration of a Memories storage warning">
        <div class="phone">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <div class="phone-top"><span>9:41</span><span>●●●　▰</span></div>
            <div class="snap-ghost" aria-hidden="true">✦</div>
            <p class="phone-kicker">MEMORIES STORAGE</p>
            <h3>Oh nooo!</h3>
            <p>You’re using more than your included storage.</p>
            <div class="storage-meter"><span></span></div>
            <div class="storage-numbers"><strong>5.2 GB</strong><span>of 5 GB</span></div>
            <div class="phone-alert">Save a copy of your Memories so they’re yours to keep.</div>
            <div class="phone-button">Review my Memories</div>
          </div>
        </div>
        <figcaption>Illustrative storage screen · not an actual app screenshot</figcaption>
      </figure>
    </section>

    <section class="guide-flow" aria-labelledby="flow-title">
      <div class="section-heading"><p class="eyebrow">THE FULL FLOW</p><h2 id="flow-title">From Snapchat to your photo library</h2><p>Use a computer if you can. Large exports take time to download and process.</p></div>
      <ol class="steps">
        <li class="guide-step"><span class="step-number">01</span><div><h3>Ask Snapchat for your Memories</h3><p>In Snapchat, open <strong>Settings → My Data</strong>, or sign in at <a href="https://accounts.snapchat.com/" target="_blank" rel="noreferrer">accounts.snapchat.com</a>. Turn on <strong>Export your Memories</strong>, choose <strong>Request Only Memories</strong>, select a date range (or all time), confirm your notification email, and submit the request.</p><p class="step-tip">A larger or longer export can take a while to prepare. Snapchat says it aims to deliver within 7 days, but large requests can take longer.</p></div></li>
        <li class="guide-step"><span class="step-number">02</span><div><h3>Wait for the download email</h3><p>When Snapchat says your export is ready, follow its link and choose <strong>See exports → Download</strong>. Keep the original ZIP as a backup.</p></div></li>
        <li class="guide-step"><span class="step-number">03</span><div><h3>Make sure the ZIP has the actual media</h3><p>SnapMigrate needs photo/video files and Snapchat’s matching Memories history metadata. If the ZIP only contains an <code>index.html</code> and download links, open that file, go to <strong>Memories</strong>, and download the media from Snapchat first. Then put the media and its <code>memories_history.json</code> metadata together in a ZIP.</p><p class="step-tip">A link-only export is not supported. The filename metadata is what lets SnapMigrate match a memory to its original timestamp.</p></div></li>
        <li class="guide-step"><span class="step-number">04</span><div><h3>Open your export in SnapMigrate</h3><p><a href="./">Go to the tool</a>, choose the Snapchat ZIP, and wait while it scans the archive in your browser. Your photos and videos stay on your device; they are not uploaded to SnapMigrate.</p><p class="step-tip">For large ZIPs, use the latest desktop Chrome or Edge. Keep the tab open while it works.</p></div></li>
        <li class="guide-step"><span class="step-number">05</span><div><h3>Review dates, then save a corrected ZIP</h3><p>Check the photo and video counts, date range, and sample previews. Choose <strong>Save corrected ZIP</strong>. SnapMigrate writes verified timestamps into supported JPG/JPEG and MP4 copies; files with missing or unverified timestamps and unsupported formats are skipped. The ZIP includes a report listing what was corrected and skipped.</p><p class="step-tip">The corrected ZIP contains corrected copies and the report, not every original file. Keep your Snapchat export unchanged as your backup.</p></div></li>
        <li class="guide-step"><span class="step-number">06</span><div><h3>Unzip it and upload the corrected files</h3><p>Extract the corrected ZIP, open its <code>corrected</code> folder, and upload the JPG and MP4 files to your chosen provider. Upload the files inside that folder, not the ZIP itself.</p><p class="step-tip">Try a small batch first and check the dates in your destination before uploading the rest. Date display has not yet been verified across providers.</p></div></li>
      </ol>
    </section>

    <section class="provider-guide" aria-labelledby="provider-title">
      <div class="section-heading"><p class="eyebrow">UPLOAD DESTINATION</p><h2 id="provider-title">Choose where your memories go</h2><p>Direct import is still being built, so for now save the corrected ZIP and upload its extracted files yourself.</p></div>
      <div class="provider-cards">
        <article class="provider-card"><div class="provider-icon google" aria-hidden="true">G</div><h3>Google Photos</h3><ol><li>Open <a href="https://photos.google.com/" target="_blank" rel="noreferrer">photos.google.com</a> and sign in.</li><li>Select <strong>Create and add photos → Import photos</strong> (or drag files into an album).</li><li>Choose files from the extracted <code>corrected</code> folder and wait for upload to finish.</li></ol><a class="provider-source" href="https://support.google.com/photos/answer/6193313?co=GENIE.Platform%3DDesktop&amp;hl=en" target="_blank" rel="noreferrer">Google Photos upload help ↗</a></article>
        <article class="provider-card"><div class="provider-icon apple" aria-hidden="true">●</div><h3>Apple Photos / iCloud Photos</h3><ol><li>On your Mac, open Photos and choose <strong>File → Import</strong>.</li><li>Select the extracted <code>corrected</code> folder or its files, review, and import.</li><li>Turn on <strong>Sync this Mac</strong> under Apple Account → iCloud → Photos to sync that library with iCloud.</li></ol><a class="provider-source" href="https://support.apple.com/en-us/108782" target="_blank" rel="noreferrer">Set up iCloud Photos ↗</a></article>
        <article class="provider-card"><div class="provider-icon dropbox" aria-hidden="true">◆</div><h3>Dropbox</h3><ol><li>Open <a href="https://www.dropbox.com/" target="_blank" rel="noreferrer">dropbox.com</a> and sign in.</li><li>Choose a folder, select <strong>Upload → Folder</strong>, then pick the extracted <code>corrected</code> folder.</li><li>Or move the folder into Dropbox on your computer and let it sync.</li></ol><a class="provider-source" href="https://help.dropbox.com/create-upload/add-files" target="_blank" rel="noreferrer">Dropbox upload help ↗</a></article>
      </div>
    </section>

    <aside class="guide-limit"><strong>What works today</strong><p>SnapMigrate previews several image and video formats, but timestamp repair currently writes only supported JPG/JPEG and MP4 files with verified metadata or ZIP UTC timestamps. Missing dates stay unknown. Google Photos, Apple Photos, Dropbox, and other services do not connect directly yet.</p></aside>
    <div class="guide-cta"><div><h2>Ready to start?</h2><p>Request your export, then bring the ZIP back here.</p></div><a class="button" href="./">Open SnapMigrate <span aria-hidden="true">↗</span></a></div>
  </main>
  <footer><span>SnapMigrate · How-To guide</span><span>Independent project · Not affiliated with Snapchat or Google</span></footer>
`;
