import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StudentGuidePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "student") redirect("/dashboard");

  return (
    <>
      <header className="portal-shell portal-header">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark" aria-hidden="true">n.</span>
          <span>Neuroimaging Training</span>
        </Link>
        <UserButton />
      </header>

      <main className="portal-shell portal-main student-guide">
        <Link className="back-link" href="/dashboard">← Back to your workspace</Link>
        <section className="hero">
          <span className="eyebrow">Student guide</span>
          <h1>Set up and run your task.</h1>
          <p>Use the Google Drive account invited by your supervisor, then run the assigned Colab notebook.</p>
        </section>

        <div className="panel-grid">
          <section className="panel">
            <span className="eyebrow">01 · Google Drive</span>
            <h2>Open your shared folder</h2>
            <p>Sign in to the Google account your supervisor invited. In Drive, open <strong>Shared with me</strong>, select the output folder, then choose <strong>Organize → Add shortcut → My Drive</strong>.</p>
          </section>
          <section className="panel">
            <span className="eyebrow">02 · Your assignment</span>
            <h2>Use the task details</h2>
            <p>Return to your workspace and use the subject ID and Colab notebook shown in your assigned task. The current notebook uses OpenNeuro ds004144. Do not substitute a different subject.</p>
          </section>
          <section className="panel">
            <span className="eyebrow">03 · Google Colab</span>
            <h2>Run the notebook</h2>
            <p>Open the assigned notebook, save a copy to Drive if prompted, connect Drive, and run its cells in order. Allow the notebook to save the outputs into the supervisor-shared folder.</p>
          </section>
          <section className="panel">
            <span className="eyebrow">04 · Check and finish</span>
            <h2>Check the result</h2>
            <p>Confirm the outputs appear in the shared folder. Check that the segmentation lines up with the anatomical scan. If it does not, stop and tell your supervisor.</p>
          </section>
        </div>

        <section className="panel guide-reminder">
          <h2>Keep outputs in the shared folder</h2>
          <p>Do not upload brain images or analysis outputs to GitHub or the portal. When the notebook finishes, return to your workspace and mark the task complete.</p>
          <Link className="action-link primary-action" href="/dashboard">Return to your task <span aria-hidden="true">→</span></Link>
        </section>
      </main>

      <footer className="portal-shell portal-footer">
        Student instructions · Google Colab · Supervisor-shared Drive
      </footer>
    </>
  );
}
