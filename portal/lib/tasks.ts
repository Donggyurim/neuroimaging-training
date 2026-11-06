import "server-only";

export type Task = {
  id: string;
  title: string;
  assigned_to_user_id: string;
  assigned_to_username: string;
  dataset_id: string;
  subject_id: string;
  notebook_url: string;
  due_date: string | null;
  status: "assigned" | "completed";
  completed_at: string | null;
  created_at: string;
};

export type TeamProgress = { total: number; completed: number };

const fields = "id,title,assigned_to_user_id,assigned_to_username,dataset_id,subject_id,notebook_url,due_date,status,completed_at,created_at";

export function taskStoreConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

function tasksUrl(query: Record<string, string>): string {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("Supabase URL is missing");
  const url = new URL(base + "/rest/v1/tasks");
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url.toString();
}

async function requestTasks(query: Record<string, string>, init: RequestInit = {}): Promise<Response> {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Supabase server key is missing");
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(tasksUrl(query), { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error("Supabase task request failed with status " + response.status);
  return response;
}

export async function listTasksForUser(userId: string): Promise<Task[]> {
  const response = await requestTasks({
    select: fields,
    assigned_to_user_id: "eq." + userId,
    order: "created_at.desc",
  });
  return response.json() as Promise<Task[]>;
}

export async function listAllTasks(): Promise<Task[]> {
  const response = await requestTasks({ select: fields, order: "created_at.desc" });
  return response.json() as Promise<Task[]>;
}

export async function getTeamProgress(): Promise<TeamProgress> {
  const response = await requestTasks({ select: "status" });
  const tasks = await response.json() as Array<{ status: Task["status"] }>;
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === "completed").length,
  };
}

export async function createTask(task: Omit<Task, "id" | "status" | "completed_at" | "created_at"> & { created_by_user_id: string }): Promise<void> {
  const response = await requestTasks({}, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...task, status: "assigned" }),
  });
  if (response.status !== 201 && response.status !== 204) {
    throw new Error("Supabase did not create the task");
  }
}

export async function completeTask(taskId: string, userId: string): Promise<void> {
  await requestTasks({
    id: "eq." + taskId,
    assigned_to_user_id: "eq." + userId,
    status: "eq.assigned",
  }, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString() }),
  });
}
