import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      <header className="portal-shell portal-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">n.</span>
          <span>Neuroimaging Training</span>
        </Link>
        <span className="header-context"><span className="status-dot" />Student portal</span>
      </header>

      <main className="portal-shell home-layout">
        <section className="home-copy">
          <span className="eyebrow">Donggyurim’s placement programme</span>
          <h1>Learn neuroimaging.</h1>
          <p className="home-lead">One scan. Clear steps. Useful research.</p>
          <p className="home-description">
            Sign in to see your assigned task and your team’s overall progress.
            You’ll run the analysis in Google Colab and save your results to the shared folder.
          </p>
          <Link className="action-link primary-action" href="/sign-in">
            Go to sign in <span aria-hidden="true">→</span>
          </Link>
          <p className="login-hint">Use the username and password provided by your supervisor.</p>
        </section>

        <section className="workflow-card" aria-labelledby="workflow-title">
          <div className="workflow-card-band">
            <span className="workflow-mark" aria-hidden="true">n.</span>
            <span>Open data · guided analysis</span>
            <span className="workflow-count">01 — 03</span>
          </div>
          <div className="workflow-card-content">
            <span className="eyebrow">Your workflow</span>
            <h2 id="workflow-title">From dataset to results</h2>
            <p>Each task gives you a clear starting point and a practical analysis to run.</p>
            <ol className="workflow-list">
              <li><span>01</span><div><strong>View your task</strong><small>Check the dataset and assigned subject.</small></div></li>
              <li><span>02</span><div><strong>Run the Colab notebook</strong><small>Process the open neuroimaging data.</small></div></li>
              <li><span>03</span><div><strong>Save your results</strong><small>Outputs go to the shared folder.</small></div></li>
            </ol>
            <div className="workflow-note"><span className="status-dot" />Your supervisor can review the saved outputs.</div>
          </div>
        </section>
      </main>

      <footer className="portal-shell portal-footer">
        Student and supervisor access · Open neuroimaging data · Google Colab
      </footer>
    </>
  );
}
