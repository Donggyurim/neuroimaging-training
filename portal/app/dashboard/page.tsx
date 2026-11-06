import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assignTask, markTaskComplete } from "./actions";
import {
  getTeamProgress,
  listAllTasks,
  listTasksForUser,
  taskStoreConfigured,
  type Task,
} from "../../lib/tasks";

type PortalRole = "student" | "supervisor";

function TaskStatus({ status }: { status: Task["status"] }) {
  return (
    <span className={status === "completed" ? "status-pill is-complete" : "status-pill"}>
      {status === "completed" ? "Completed" : "Assigned"}
    </span>
  );
}

function TeamProgress({ total, completed }: { total: number; completed: number }) {
  const remaining = total - completed;
  return (
    <div className="team-progress-grid">
      <div><strong>{total}</strong><span>Tasks assigned</span></div>
      <div><strong>{completed}</strong><span>Completed</span></div>
      <div><strong>{remaining}</strong><span>In progress</span></div>
    </div>
  );
}

function StudentTask({ task, isNext }: { task: Task; isNext: boolean }) {
  return (
    <li className={isNext ? "task-item next-task" : "task-item"}>
      {isNext ? <span className="eyebrow">Up next</span> : null}
      <div className="task-heading">
        <div>
          <h3>{task.title}</h3>
          <p className="task-meta">{task.dataset_id} <span aria-hidden="true">·</span> {task.subject_id}</p>
        </div>
        <TaskStatus status={task.status} />
      </div>
      {task.due_date ? <p className="task-detail">Due {new Date(task.due_date + "T00:00:00").toLocaleDateString()}</p> : null}
      <div className="task-actions">
        <a className="action-link primary-action" href={task.notebook_url} target="_blank" rel="noreferrer">
          Open Colab notebook <span aria-hidden="true">↗</span>
        </a>
        {task.status === "assigned" ? (
          <form action={markTaskComplete}>
            <input type="hidden" name="taskId" value={task.id} />
            <button className="action-link secondary-action" type="submit">Mark complete</button>
          </form>
        ) : <p className="completion-note">You marked this task complete.</p>}
      </div>
    </li>
  );
}

function SupervisorTask({ task }: { task: Task }) {
  return (
    <li className="task-item">
      <div className="task-heading">
        <div>
          <h3>{task.title}</h3>
          <p className="task-meta">
            {task.assigned_to_username} <span aria-hidden="true">·</span> {task.dataset_id} <span aria-hidden="true">·</span> {task.subject_id}
          </p>
        </div>
        <TaskStatus status={task.status} />
      </div>
      {task.due_date ? <p className="task-detail">Due {new Date(task.due_date + "T00:00:00").toLocaleDateString()}</p> : null}
      <a className="quick-link" href={task.notebook_url} target="_blank" rel="noreferrer">Open assigned notebook ↗</a>
    </li>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as PortalRole | undefined;
  const username = user?.username ?? "account";
  const params = searchParams ? await searchParams : {};
  const isConfigured = taskStoreConfigured();
  let tasks: Task[] = [];
  let progress = { total: 0, completed: 0 };
  let loadFailed = false;

  if (isConfigured && role === "student") {
    try {
      [tasks, progress] = await Promise.all([listTasksForUser(userId), getTeamProgress()]);
    } catch {
      loadFailed = true;
    }
  } else if (isConfigured && role === "supervisor") {
    try {
      tasks = await listAllTasks();
      progress = { total: tasks.length, completed: tasks.filter((task) => task.status === "completed").length };
    } catch {
      loadFailed = true;
    }
  }

  return (
    <>
      <header className="portal-shell portal-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">n.</span>
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
          {role === "student" ? (
            <Link className="action-link secondary-action" href="/student-guide">Open the student guide <span aria-hidden="true">→</span></Link>
          ) : null}
        </section>

        {params.notice === "assigned" ? <p className="notice-banner" role="status">Task assigned.</p> : null}
        {params.notice === "completed" ? <p className="notice-banner" role="status">Task marked complete.</p> : null}
        {params.error === "student" ? <p className="notice-banner is-error" role="alert">No student account with that username was found.</p> : null}
        {params.error === "storage" ? <p className="notice-banner is-error" role="alert">The task could not be saved. Check the portal’s Supabase connection.</p> : null}
        {loadFailed ? <p className="notice-banner is-error" role="alert">Tasks could not be loaded. Check the portal’s Supabase connection.</p> : null}

        {role === "student" ? (
          <div className="panel-grid">
            <section className="panel task-panel">
              <h2>Your assigned tasks</h2>
              {!isConfigured ? (
                <p>Task storage is being connected. Your supervisor can assign tasks here when setup is complete.</p>
              ) : tasks.length === 0 ? (
                <p>No tasks have been assigned to you yet.</p>
              ) : (
                <ul className="task-list">{tasks.map((task) => <StudentTask key={task.id} task={task} isNext={task.id === (tasks.find((item) => item.status === "assigned")?.id ?? tasks[0]?.id)} />)}</ul>
              )}
            </section>
            <section className="panel">
              <h2>Team progress</h2>
              {!isConfigured || loadFailed ? (
                <p>The overall team summary will appear here.</p>
              ) : (
                <>
                  <p>Overall task progress across the team.</p>
                  <TeamProgress total={progress.total} completed={progress.completed} />
                </>
              )}
            </section>
          </div>
        ) : role === "supervisor" ? (
          <>
            {!isConfigured ? (
              <section className="panel setup-message">
                <h2>Task storage needs setup</h2>
                <p>Add the Supabase project URL and server-side secret key to the Vercel project environment. Keep the secret key out of source code and browser variables.</p>
              </section>
            ) : (
              <>
                <div className="panel-grid">
                  <section className="panel">
                    <h2>Assign a task</h2>
                    <p>For now, this notebook supports OpenNeuro ds004144. Enter the student’s username and assigned subject.</p>
                    <form className="portal-form" action={assignTask}>
                      <label>Student username<input name="studentUsername" autoComplete="off" placeholder="e.g. kong" required /></label>
                      <label>OpenNeuro dataset<input name="datasetId" value="ds004144" readOnly /></label>
                      <label>Subject ID<input name="subjectId" placeholder="e.g. sub-002" required /></label>
                      <label>Colab notebook URL<input name="notebookUrl" type="url" defaultValue="https://colab.research.google.com/github/Donggyurim/neuroimaging-training/blob/main/notebooks/First_regional_brain_volumes.ipynb" required /></label>
                      <button className="action-link primary-action" type="submit">Assign task <span aria-hidden="true">→</span></button>
                    </form>
                  </section>
                  <section className="panel">
                    <h2>Overall team progress</h2>
                    <p>Summary of assigned tasks and completion.</p>
                    <TeamProgress total={progress.total} completed={progress.completed} />
                  </section>
                </div>
                <section className="panel task-panel">
                  <h2>Team tasks</h2>
                  {tasks.length === 0 ? <p>No tasks assigned yet.</p> : (
                    <ul className="task-list">{tasks.map((task) => <SupervisorTask key={task.id} task={task} />)}</ul>
                  )}
                </section>
              </>
            )}
          </>
        ) : (
          <section className="panel setup-message">
            <h2>Account role needs setup</h2>
            <p>This account has signed in, but it has no student or supervisor role yet. Ask the supervisor to set the account role before using the portal.</p>
          </section>
        )}
      </main>

      <footer className="portal-shell portal-footer">
        Use the assigned Colab notebook and supervisor-shared Drive folder for analysis outputs.
      </footer>
    </>
  );
}
