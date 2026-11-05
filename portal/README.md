# Private student portal

This is a separate Next.js app for Vercel. The Quarto learning website remains on GitHub Pages and stays public.

## Current stage

- Username and password sign-in is provided by Clerk.
- The dashboard checks the signed-in account's server-managed `publicMetadata.role`.
- Roles are `student` and `supervisor`. Accounts without one of these roles cannot see task content.
- Public sign-up is not part of the app.
- The task list, task assignment form, and overall team progress counts are the next implementation step.
- Brain images and analysis outputs stay in Colab and the supervisor-shared Drive folder.

## Configure Clerk

Create a Clerk application, then configure **User & authentication**:

1. Enable username and password sign-in.
2. Require an email address and verify it so account recovery can use email.
3. Disable public sign-up. Create accounts as supervisor-managed users.
4. Restrict students from changing their username. Set an account recovery flow that uses the verified email address.

Create the three accounts in Clerk's dashboard using the usernames already agreed for the pilot, their real email addresses, and fresh passwords. The passwords previously shared in chat are not included in this repository; replace them before using the accounts.

Set each user's **public metadata** to one of these exact JSON objects:

- Student: `{"role":"student"}`
- Supervisor: `{"role":"supervisor"}`

Role metadata must be set by the supervisor in Clerk's dashboard or another trusted server-side tool. Do not let users choose their own role during sign-up.

## Deploy on Vercel

1. Import this repository into Vercel.
2. Set **Root Directory** to `portal`.
3. Install the Clerk integration from Vercel Marketplace, or copy the Clerk development and production keys into Vercel's project environment variables.
4. Add the variables listed in `.env.example` in Vercel project settings. Never commit actual keys or passwords.
5. Deploy a preview first. Configure Clerk's allowed redirect URLs for the Vercel preview and production URLs.
6. Sign in separately as a student and the supervisor. Confirm that a student account cannot get a supervisor role by editing browser data; the dashboard role is read server-side from Clerk.

The public sign-in page can be opened without an account. The dashboard checks the authenticated session on the server. Only expose private task information through server components or API routes that perform the same session and role checks.

## Local setup

Copy `.env.example` to `.env.local`, fill it with Clerk's development keys, then run:

```sh
npm install
npm run dev
```

For production, set secrets in Vercel's environment settings rather than in source files.
