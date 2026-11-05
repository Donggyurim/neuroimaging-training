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
          <span className="brand-mark" aria-hidden="true">NT</span>
          <span>Neuroimaging Training</span>
        </Link>
        <span className="eyebrow">Private portal</span>
      </header>

      <main className="portal-shell portal-main">
        <section className="hero">
          <span className="eyebrow">Student and supervisor workspace</span>
          <h1>Training tasks, in one place.</h1>
          <p>
            Sign in to view the workspace for your role. The course lessons stay
            on the public training site; task access is managed here.
          </p>
          <div className="portal-card">
            <Link className="action-link" href="/sign-in">Sign in</Link>
            <Link
              className="secondary-link"
              href="https://github.com/Donggyurim/neuroimaging-training"
            >
              Browse the training lessons
            </Link>
          </div>
        </section>
      </main>

      <footer className="portal-shell portal-footer">
        OpenNeuro analyses run in Colab. Results remain in the supervisor-shared Drive folder.
      </footer>
    </>
  );
}
