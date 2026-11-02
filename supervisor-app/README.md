# Owner-only supervisor workspace

The public site contains a sign-in entry only. This Worker serves the review page
after Cloudflare Access authenticates the request and the Worker checks the
application audience and the exact owner email. No password or token goes in the
public website.

This protects the web workspace. Existing public GitHub issues, PRs, source code,
and Git history keep their GitHub visibility. Confidential student records belong
in approved private storage, not this public repository.

## 1. Prepare the service

Create a Cloudflare account and enable Zero Trust. Choose a team name and enable
One-time PIN for emailed verification codes, or select your identity provider.

### Using the Cloudflare dashboard

First merge the supervisor setup change into `main`. Cloudflare's import wizard
uses `main` by default; it must contain `supervisor-app/` before deployment.

Import `Donggyurim/neuroimaging-training` under **Workers & Pages → Create
application** and name the Worker `neuroimaging-supervisor`. Use these commands
from the repository root; a separate Root directory setting is unnecessary:

| Field | Value |
|---|---|
| Build command | `npm --prefix supervisor-app ci` |
| Deploy command | `npm --prefix supervisor-app run deploy` |
| Preview command | `npm --prefix supervisor-app run preview` |

After creation, Git branch and root-directory settings are available under
**Worker → Settings → Build**. Leave the root at the repository root when using
the folder-specific commands above.

### Using a local terminal

From this directory, using Node.js 24:

```sh
npm ci
npm run check
npm run deploy
```

Wrangler asks you to authenticate if necessary. Alternatively, configure a scoped
Cloudflare deployment token securely in your own environment. Never paste it into
Git or chat. Without the variables below, the Worker serves an unavailable page.
Record its production `https://...workers.dev/` address.

## 2. Require sign-in

In Cloudflare **Workers & Pages → neuroimaging-supervisor → Access**:

1. Select **Protect this Worker behind Access**.
2. Choose **All traffic**, including production, and apply Access.
3. Open its application in **Zero Trust → Access → Applications**.
4. Edit the Allow policy: select **Emails** and enter only your own email.
   Remove broader Allow or Bypass policies for this application. Do not allow an
   entire email domain or Everyone for this owner-only workspace.
5. Select One-time PIN or your preferred identity provider and a session duration.
6. Copy this application's **Application Audience (AUD)** tag.

Worker-level Access protects all its hostnames and routes. These are the current
documented controls; use the linked Cloudflare guide if labels change.

## 3. Configure the owner

In **Worker → Settings → Variables and Secrets**, add:

| Name | Value |
|---|---|
| `SUPERVISOR_EMAIL` | The exact allowed email; store it as a Secret. |
| `ACCESS_AUD` | The supervisor Access application's AUD tag. |

Apply the changes. Neither value belongs in `wrangler.toml` or Git. Missing values
keep the application closed.

The code uses Cloudflare's trusted `ctx.access` identity, never browser-supplied
email headers, cookies, query flags, or local storage. Cloudflare validates the
session; the Worker checks the application and owner before serving any route.
Do not add a Static Assets binding or Vite asset router: they prevent this Worker
from receiving `ctx.access`. Do not add an authentication bypass or header fallback.
Direct requests without Access are denied, including service-binding requests
that do not have their own authenticated invocation.

## 4. Verify the actual service

- Open the production address in a private window: Access must ask for sign-in.
- Verify your allowed email: the page and feedback copying should work.
- Try another email: it must not reach the workspace.
- Open `/review` directly: it must receive the same sign-in protection.
- Sign out, then open a direct link again: sign-in must be required.
- Ensure alternate domains and deployments do not provide an unprotected route.

Automated tests cover the allow/deny logic with Cloudflare-context fixtures.
They do not prove that real email delivery, sessions, or Access policies have
been configured. Complete these live checks before connecting the website.

## 5. Connect the public tab

In GitHub **Settings → Secrets and variables → Actions → Variables**, add:

`SUPERVISOR_URL` = the protected production HTTPS address from step 1.

This URL is public routing information, not a credential. Merge this change, then
run **Actions → Website → Run workflow → main** to publish the sign-in link.
Until configured, the public page displays **Sign-in setup pending** and contains
no management page or client-side unlock. The build validates and inserts only
the public URL.

For a local site preview, run from the repository root after `quarto render`:

```sh
SUPERVISOR_URL=https://your-protected-worker.example.workers.dev/ python3 scripts/configure-supervisor.py
```

The website excludes `supervisor-app/` from its output. Browser checks also inspect
the public HTML and search index for leaked management content.

## References

- [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Manage access to workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/#manage-access-to-workersdev)
- [Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
