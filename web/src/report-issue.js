export function setupIssueReporting() {
 const dialog = document.createElement('dialog');
 dialog.className = 'issue-dialog';
 dialog.setAttribute('aria-labelledby', 'issue-title');
 dialog.innerHTML = `<form id="issue-form"><h2 id="issue-title">Report an issue</h2><p>Tell us what happened and what you expected. Include steps to reproduce it, if you can.</p><p class="small">Only what you enter here is sent to the project maintainer by email. Please leave out personal memories, filenames, and other sensitive information.</p><label for="issue-message">What went wrong?</label><textarea id="issue-message" name="message" required minlength="10" maxlength="4000" rows="6"></textarea><label for="issue-email">Your email (optional, for a reply)</label><input id="issue-email" name="email" type="email" maxlength="254" autocomplete="email"><div class="issue-trap" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div><p id="issue-status" role="status" aria-live="polite"></p><div class="issue-actions"><button type="button" id="issue-close">Close</button><button type="submit" id="issue-send">Send report</button></div></form>`;
 document.body.append(dialog);
 const form = dialog.querySelector('form');
 const status = dialog.querySelector('#issue-status');
 const submit = dialog.querySelector('#issue-send');
 document.querySelector('#report-issue').onclick = () => dialog.showModal();
 dialog.querySelector('#issue-close').onclick = () => dialog.close();
 form.onsubmit = async event => {
  event.preventDefault();
  if (submit.disabled) return;
  submit.disabled = true; status.textContent = 'Sending…';
  try {
   const fields = new FormData(form);
   const response = await fetch('/api/report-issue', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(fields)), signal: AbortSignal.timeout(15000)
   });
   const result = await response.json();
   if (!response.ok) throw Error(result.message);
   status.textContent = result.message;
   form.reset();
  } catch (error) {
   status.textContent = error.message?.startsWith('Issue reporting') || error.message?.startsWith('Too many') || error.message?.startsWith('We could not') ? error.message : 'Could not send your report. Your text is still here; please try again later.';
  } finally { submit.disabled = false; }
 };
}
