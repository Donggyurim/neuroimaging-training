import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type PortalRole = "student" | "supervisor";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as PortalRole | undefined;
  const username = user?.username ?? "account";

  return (
    <>
      <header className="portal-shell portal-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">NT</span>
          <span>Neuroimaging Training</span>
        </Link>
        <UserButton />
      </header>

      <main className="portal-shell portal-main">
        <section className="hero">
          <span className="eyebrow">
            {role === "supervisor" ? "Supervisor workspace" : "Student workspace"}
          </span>
          <h1>{role === "supervisor" ? "Team overview." : "Your workspace."}</h1>
          <p>Signed in as <strong>{username}</strong>.</p>
        </section>

        {role === "student" ? (
          <div className="panel-grid">
            <section className="panel">
              <h2>Your assigned tasks</h2>
              <p>Task assignments will appear here. Each student will see only tasks assigned to their account.</p>
              <span className="status-pill">Task tracking · next step</span>
            </section>
            <section className="panel">
              <h2>Team progress</h2>
              <p>You will see an overall team summary, without other students’ individual task details.</p>
              <span className="status-pill">Progress summary · next step</span>
            </section>
          </div>
        ) : role === "supervisor" ? (
          <div className="panel-grid">
            <section className="panel">
              <h2>Assign tasks</h2>
              <p>Create a task with the dataset snapshot, subject ID, notebook, and acceptance criteria.</p>
              <span className="status-pill">Task assignment · next step</span>
            </section>
            <section className="panel">
              <h2>Review team work</h2>
              <p>Review each student’s task status and handover. Analysis files remain in the shared Drive folder.</p>
              <span className="status-pill">Team review · next step</span>
            </section>
          </div>
        ) : (
          <section className="panel setup-message">
            <h2>Account role needs setup</h2>
            <p>
              This account has signed in, but it has no student or supervisor role yet.
              Ask the supervisor to set the account role before using the portal.
            </p>
          </section>
        )}
      </main>

      <footer className="portal-shell portal-footer">
        Do not upload brain images here. Use the assigned Colab notebook and supervisor-shared Drive folder.
      </footer>
    </>
  );
}
