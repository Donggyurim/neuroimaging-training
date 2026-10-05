# Contributing

## Student workflow

1. Agree a small task with the supervisor. Open a **Student task** issue with a question, expected output, acceptance criteria, and target date; assign yourself.
2. Clone the repository (or fork it if you have not been invited as a collaborator).
3. Start from updated `main` and create a branch such as `student/alex-dataset-notes`:

```sh
git switch main
git pull --ff-only
git switch -c student/alex-dataset-notes
```

4. Copy a template from `templates/` into the appropriate section. Keep paths lowercase with hyphens. Add the page to `_quarto.yml` navigation.
5. Run your analysis separately, document dependencies and exact commands, inspect quality and results, then run `quarto render`.
6. Commit focused changes, push your branch, and open a draft PR to `main`. Link the issue and include figures or evidence of checks.
7. When ready, mark the PR ready for review and request @Donggyurim. Address feedback and rerun checks. Any new commits require renewed approval.
8. After approval and a passing **Build site** check, squash-merge the PR and delete its branch. The website updates automatically.

Never push directly to `main`. An approval is a review decision; collaborators can merge only after the required supervisor approval and checks. If a PR edits CODEOWNERS or workflows, explicitly explain why.

## Reproducibility and writing

- Explain purpose, prerequisites, expected outputs, and common failures.
- Include dataset accession, immutable version, citation, access terms, and sample-selection rationale.
- Document software versions, environment setup, commands, parameters, seeds, quality checks, and limitations.
- Distinguish tutorial examples from validated research findings.
- Keep downloadable data and large generated outputs outside Git; link to approved storage.
- Do not add sensitive data or credentials. Review screenshots and figure labels too.
- Do not copy third-party material without permission and attribution.

The site uses `execute: enabled: false` so rendering never downloads datasets or runs costly analysis. Code examples are displayed; analyses must be verified separately and the verification recorded in the PR.

## Supervisor setup

Invite students through Settings → Collaborators after agreeing access. Create a GitHub Project if needed and add repository issues. No students are invited automatically. Keep @Donggyurim as the owner of every path in `.github/CODEOWNERS`. Review scientific validity as well as writing; the build only checks rendering.
