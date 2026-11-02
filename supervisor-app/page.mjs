const style = `
:root{color-scheme:light;font-family:Inter,system-ui,-apple-system,sans-serif;color:#172033;background:#f8fafc}
*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0;line-height:1.6}header{background:white;border-bottom:1px solid #e1e6ee;padding:18px 24px}header>div,main{max-width:1080px;margin:auto}header>div{display:flex;justify-content:space-between;gap:20px}a{color:#2457d6;text-underline-offset:3px}main{padding:40px 24px}h1{font-size:36px;letter-spacing:-1.2px;line-height:1.2;margin:0 0 8px}h2{font-size:18px;margin:0 0 16px}p{color:#58657a}.badge{font-size:12px;font-weight:650;color:#2457d6}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border:1px solid #e1e6ee;border-radius:7px;background:white;color:#172033;font:inherit;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer}.primary{background:#2457d6;color:white;border-color:#2457d6}.grid{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:24px;align-items:start}.card,details{border:1px solid #e1e6ee;border-radius:10px;background:white}.card{padding:20px}details{padding:0 18px;margin:10px 0}summary{cursor:pointer;padding:15px 0;min-height:50px;font-size:14px;font-weight:600}details p{font-size:14px}.small{font-size:12px;color:#58657a}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;background:#f8fafc;padding:12px;border-radius:6px}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #9cbaff;outline-offset:4px}#copy-status{margin-bottom:0}@media(max-width:700px){.grid{grid-template-columns:1fr}main{padding:28px 18px}h1{font-size:30px}}`;

function shell(title, content, script = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Neuroimaging Training</title><style>${style}</style></head><body>${content}${script}</body></html>`;
}

export function renderMessage(title, message) {
  // All arguments are fixed server strings; request data is never interpolated.
  return shell(title, `<main><h1>${title}</h1><p>${message}</p><a href="https://donggyurim.github.io/neuroimaging-training/">Student website</a></main>`);
}

export function renderSupervisorPage(nonce) {
  const stages = [
    ['01 · Scope', 'Question, dataset version, acceptance criteria.', 'Is the scope achievable?'],
    ['02 · Inputs', 'Input manifest, metadata, quality notes.', 'Is the scan suitable?'],
    ['03 · Segmentation', 'Versions, command, logs, anatomical overlays.', 'Accept the pilot or request changes before scaling.'],
    ['04 · Measurements', 'Region table, units, provenance, participant joins.', 'Are measures and joins correct?'],
    ['05 · Analysis', 'Model plan, assumptions, uncertainty, figures.', 'Are the claims supported?'],
    ['06 · Handover', 'Reproduction steps, output locations, known failures.', 'Can someone repeat the accepted work?']
  ];
  const checkpoints = stages.map(([name, evidence, decision]) => `<details><summary>${name}</summary><p><strong>Evidence:</strong> ${evidence}</p><p><strong>Decide:</strong> ${decision}</p></details>`).join('');
  return shell('Supervisor workspace', `
<header><div><strong>Neuroimaging Training <span class="badge">· Owner workspace</span></strong><a href="/cdn-cgi/access/logout">Sign out</a></div></header>
<main><h1>Review</h1><p>Check evidence. Agree the next step.</p>
<div class="actions"><a class="button primary" href="https://github.com/Donggyurim/neuroimaging-training/issues">Open tasks</a><a class="button" href="https://github.com/Donggyurim/neuroimaging-training/pulls">Pull requests</a></div>
<div class="grid"><section><h2>Checkpoints</h2>${checkpoints}</section><aside>
<div class="card"><h2>Leave feedback</h2><p>Copy. Fill in. Post to the task.</p><button type="button" class="button primary" id="copy-review" hidden>Copy review template</button><p class="small" id="copy-status" role="status"></p>
<details id="template-details"><summary>Preview template</summary><pre id="review-template">Checkpoint:
Evidence reviewed (link/version):
Decision: ready / revise / blocked
Reason and required changes:
Next action:
Owner:
Target date:
Next review:</pre></details></div>
<p class="small">Shared task status follows GitHub permissions. Keep confidential notes in approved private storage.</p>
<details><summary>Placement setup</summary><p>Agree scope, compute, access, meeting dates, and storage.</p></details>
<a href="https://donggyurim.github.io/neuroimaging-training/student.html">Student workspace</a></aside></div></main>`, `
<script nonce="${nonce}">
const button = document.getElementById('copy-review');
button.hidden = false;
button.addEventListener('click', async () => {
  const template = document.getElementById('review-template');
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(template.textContent);
    status.textContent = 'Copied. Paste into the task.';
  } catch {
    document.getElementById('template-details').open = true;
    const range = document.createRange();
    range.selectNodeContents(template);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Template selected. Use your browser’s Copy command.';
  }
});
</script>`);
}
