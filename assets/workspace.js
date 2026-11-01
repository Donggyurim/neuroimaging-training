document.addEventListener('DOMContentLoaded', () => {
  const checks = [...document.querySelectorAll('[data-step]')];
  const key = 'neuroimaging-training:checklist:v1';
  let storageAvailable = true;

  if (checks.length) {
    // Invalid saved JSON should not prevent the next valid save.
    const restore = () => {
      let raw;
      try {
        raw = localStorage.getItem(key);
      } catch {
        storageAvailable = false;
      }
      let saved = [];
      try {
        const parsed = JSON.parse(raw || '[]');
        if (Array.isArray(parsed)) saved = parsed;
      } catch { /* Recover a malformed personal checklist with an empty one. */ }
      checks.forEach(check => { check.checked = saved.includes(check.dataset.step); });
    };

    const update = (persist = false) => {
      if (persist && storageAvailable) {
        try {
          localStorage.setItem(key, JSON.stringify(
            checks.filter(check => check.checked).map(check => check.dataset.step)
          ));
        } catch {
          storageAvailable = false;
        }
      }
      if (!storageAvailable) {
        document.getElementById('storage-note').textContent =
          'Storage unavailable · checks last this visit.';
      }
      const count = checks.filter(check => check.checked).length;
      document.getElementById('progress-label').textContent =
        `${count} / ${checks.length} prepared`;
      const progress = document.getElementById('learning-progress');
      progress.max = checks.length;
      progress.value = count;
      progress.textContent = `${count} of ${checks.length}`;
      checks.forEach(check => {
        check.closest('details').classList.toggle('is-prepared', check.checked);
      });
      const next = checks.find(check => !check.checked);
      const link = document.getElementById('next-step-link');
      link.textContent = next ? next.dataset.title : 'Ready for review';
      link.href = next ? next.dataset.href : 'projects/structural-mri-handover.html';
      document.getElementById('continue-lesson').href = link.href;
      document.getElementById('next-step-description').textContent = next
        ? next.dataset.description
        : 'Bring the pilot to your supervisor.';
    };

    const revealCurrentStep = () => {
      const current = checks.find(check => !check.checked) || checks[checks.length - 1];
      checks.forEach(check => { check.closest('details').open = check === current; });
    };

    restore();
    update();
    revealCurrentStep();
    checks.forEach(check => {
      check.disabled = false;
      check.addEventListener('change', () => update(true));
    });
    const reset = document.getElementById('reset-progress');
    reset.hidden = false;
    reset.addEventListener('click', () => {
      checks.forEach(check => { check.checked = false; });
      update(true);
      revealCurrentStep();
    });
    // A second tab should reflect changes made in this browser, too.
    window.addEventListener('storage', event => {
      if (event.key === key || event.key === null) {
        restore();
        update();
        revealCurrentStep();
      }
    });
  }

  const search = document.getElementById('lesson-search');
  if (search) {
    const cards = [...document.querySelectorAll('.lesson-card')];
    search.disabled = false;
    const filterLessons = () => {
      const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      cards.forEach(card => {
        const text = `${card.textContent} ${card.dataset.search}`.toLocaleLowerCase();
        card.hidden = !words.every(word => text.includes(word));
      });
      const count = cards.filter(card => !card.hidden).length;
      document.getElementById('lesson-count').textContent =
        `${count} ${count === 1 ? 'guide' : 'guides'}`;
      document.getElementById('no-lessons').hidden = count !== 0;
    };
    search.addEventListener('input', filterLessons);
    filterLessons();
  }

  const copy = document.getElementById('copy-review');
  if (copy) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const template = document.getElementById('review-template');
      const status = document.getElementById('copy-status');
      try {
        await navigator.clipboard.writeText(template.textContent);
        status.textContent = 'Copied. Paste into the task.';
      } catch {
        const disclosure = template.closest('details');
        if (disclosure) disclosure.open = true;
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(template);
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = 'Template selected. Use your browser’s Copy command.';
      }
    });
  }
});
