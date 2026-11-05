# Neuroimaging Training

A living training and research guide for placement students, supervised by @Donggyurim. Each cohort improves shared documentation and contributes a reproducible project.

## Student start

1. Read [Get started](tutorials/getting-started.qmd).
2. Your supervisor assigns a task with a dataset snapshot, subject ID, Colab notebook, and expected outputs.
3. Open the notebook in Colab, connect the Google account shared on the output folder, and run only the assigned subject.
4. Confirm the run folder and report its run ID and QC status on the task.

Students do not need to install Git or Quarto for assigned analysis tasks. [CONTRIBUTING.md](CONTRIBUTING.md) covers optional changes to the training website.

## Repository structure

- `datasets/`: dataset descriptions, access instructions, versions, and limitations.
- `techniques/`: analysis methods, assumptions, and quality checks.
- `tutorials/`: step-by-step learning material.
- `projects/`: student research reports and reproducibility notes.
- `templates/`: reusable page and project templates (not published).
- `.github/`: review templates, ownership, and automation.

## Preview the training site locally (maintainers)

Install [Quarto](https://quarto.org/docs/get-started/), clone this repository, and run:

```sh
quarto preview
```

Use `quarto render` to check the full website. The website build intentionally does not execute analysis code. Run analyses separately in a documented environment and commit only small, shareable results with provenance.

## Student and supervisor workspaces

The homepage routes students to `student.qmd` and supervisors to `supervisor.qmd`.
The student workspace links to supervisor-assigned GitHub tasks and Colab lessons. Its checklist is saved in the current browser only; it does not synchronise across devices or record supervisor approval. GitHub issues track task status, and Google Drive holds the private analysis outputs. The public site itself does not provide student or supervisor logins.
`library.qmd` offers searchable links to the existing lessons; Quarto search covers
the full site. The interface uses `assets/styles.css` and `assets/workspace.js`
without an additional build system. The lesson list and milestone links are curated;
update them when adding or moving a guide.

## Guided structural MRI notebook

Students can open **Your first regional brain volumes** from their workspace,
the lesson library, or the structural MRI pathway. The output-free notebook is
`notebooks/First_regional_brain_volumes.ipynb`. The first pilot is pinned to
ds004144 and accepts an assigned subject ID, task ID, and shared-folder name.
It writes the analysis outputs and handover into the supervisor-shared Drive folder.
See `notebooks/README.md` for provenance and validation limits.

The website copies the notebook as a resource and never executes it. Colab links
to the `main` version, so a new notebook or update must be merged before students
can launch that version. Drive authentication, MRI processing, and scientific QC
remain separate from website checks.

## Minimal interface

The site uses Quarto’s Bootstrap components with one shared white-and-blue theme.
Home and workspace pages show short actions; the full teaching guidance remains
in native, keyboard-accessible disclosures. Existing section links open the target
disclosure automatically. `_includes/details.html` supplies that small enhancement;
reading and opening sections also work without JavaScript. Core flows retain the
same notebook, task links, personal progress store, and review template.

## Check the interface

The website remains a static Quarto site. Node.js 24 and Playwright are used only
for development checks; visitors do not need them.

```sh
quarto render
npm ci
npx playwright install chromium
npm test
python3 scripts/check-site.py
python3 -m pip install -r requirements-dev.txt
python3 scripts/check-notebooks.py
```

The browser suite serves the rendered `_site/` under the GitHub Pages subpath and
checks student progress, storage recovery, cross-tab updates, supervisor feedback,
lesson search, mobile navigation, and reading without JavaScript. It starts and
stops its own local server. If using an existing Chromium installation, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable when running `npm test`.
CI runs these checks after rendering, before uploading or deploying the site.

## Supervision and progress

Create one issue per bounded task and assign it to the student. Include the dataset accession and fixed snapshot, exact subject ID, task ID, Colab notebook, expected outputs, and due date. Share a separate Drive output folder directly with that student; do not paste private Drive links or personal information into this public repository. Students report the run ID and QC status in the issue. Copy accepted files into supervisor-owned storage for retention. For an overall team tracker, a GitHub Project can show aggregate task status without publishing private Drive details.

`main` requires a successful **Build site** check, resolved conversations, and approval from code owner @Donggyurim. New commits invalidate prior approval. Students must use branches or forks. Direct student pushes, force pushes, and deletion of `main` are blocked. The repository owner retains an administrative bypass for maintenance because GitHub does not allow authors to approve their own PRs. Use it sparingly.

**Current setup:** this repository is public, main branch protection is enabled, and GitHub Pages is deployed through GitHub Actions. The repository Actions variable `PAGES_ENABLED` enables deployment.

Approved merges trigger the GitHub Pages deployment. Review all published content as public material.

Website: https://donggyurim.github.io/neuroimaging-training/

## Data and attribution

Do not commit participant data, raw imaging files, secrets, or restricted material. Record dataset identifiers, versions, licenses, download commands, and citations instead. Check consent and data-use conditions before publishing results. Avoid identifiable participant information in issues and reports.

The [existing student guide](https://neuroimaging-guide.netlify.app/01-data) is a learning reference. Its content has not been copied; obtain permission and preserve attribution before importing material. No project-wide license is assigned yet; the supervisor should choose one before broader reuse.

## Structural MRI teaching pathway

New, independently written lessons cover OpenNeuro input selection, a FastSurfer pilot, volume-measure definitions, analysis planning, visualisation, brainlife, and project handover. These are practical-validation drafts. See [sources and contributions](sources-and-contributions.qmd) for attribution and permission boundaries. No previous student implementation or outputs have been imported.
