import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <>
      <header className="portal-shell portal-header">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">NT</span>
          <span>Neuroimaging Training</span>
        </a>
        <span className="eyebrow">Secure sign in</span>
      </header>
      <main className="portal-shell portal-main">
        <section className="hero">
          <span className="eyebrow">Your assigned workspace</span>
          <h1>Welcome back.</h1>
          <p>Sign in with the username and password provided by your supervisor.</p>
        </section>
        <div className="sign-in-frame">
          <Suspense fallback={<div className="portal-card">Loading sign in…</div>}>
            <SignIn fallbackRedirectUrl="/dashboard" />
          </Suspense>
        </div>
      </main>
    </>
  );
}
