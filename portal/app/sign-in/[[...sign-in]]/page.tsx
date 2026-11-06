import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <>
      <header className="portal-shell portal-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">n.</span>
          <span>Neuroimaging Training</span>
        </Link>
        <span className="header-context"><span className="status-dot" />Private workspace</span>
      </header>

      <main className="portal-shell sign-in-layout">
        <section className="sign-in-copy">
          <span className="eyebrow">Neuroimaging training</span>
          <h1>Your work starts here.</h1>
          <p className="home-description">
            Sign in with the username and password provided by your supervisor to view your task.
          </p>
          <ol className="signin-steps">
            <li><span>01</span><div><strong>Open your assigned task</strong><small>See the dataset and subject for your analysis.</small></div></li>
            <li><span>02</span><div><strong>Work in Google Colab</strong><small>Run the notebook without installing software.</small></div></li>
            <li><span>03</span><div><strong>Save to the shared folder</strong><small>Your supervisor can access the outputs.</small></div></li>
          </ol>
          <Link className="back-link" href="/">← Back to portal home</Link>
        </section>

        <section className="sign-in-card" aria-labelledby="sign-in-title">
          <span className="eyebrow">Portal access</span>
          <h2 id="sign-in-title">Sign in</h2>
          <p className="sign-in-intro">Enter your assigned account details.</p>
          <div className="sign-in-frame">
            <Suspense fallback={<div className="auth-loading">Loading secure sign in…</div>}>
              <SignIn
                fallback={<div className="auth-loading">Connecting to secure sign in…</div>}
                fallbackRedirectUrl="/dashboard"
                withSignUp={false}
                appearance={{
                  variables: {
                    colorPrimary: "#2457d6",
                    colorForeground: "#172033",
                    colorMutedForeground: "#58657a",
                    colorBackground: "#ffffff",
                    colorInput: "#ffffff",
                    colorInputForeground: "#172033",
                    borderRadius: "10px",
                  },
                }}
              />
            </Suspense>
          </div>
          <p className="sign-in-help">Need help accessing your account? Contact your supervisor.</p>
        </section>
      </main>

      <footer className="portal-shell portal-footer">
        Student and supervisor access · Open neuroimaging data · Google Colab
      </footer>
    </>
  );
}
