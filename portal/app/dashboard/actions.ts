"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { completeTask, createTask } from "../../lib/tasks";

function requiredText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function assignTask(formData: FormData) {
  const { userId } = await auth();
  const supervisor = await currentUser();
  if (!userId || supervisor?.publicMetadata?.role !== "supervisor") redirect("/dashboard");

  const studentUsername = requiredText(formData, "studentUsername").toLowerCase();
  const datasetId = requiredText(formData, "datasetId");
  const subjectId = requiredText(formData, "subjectId");
  const notebookUrl = requiredText(formData, "notebookUrl");

  if (
    !studentUsername ||
    datasetId !== "ds004144" ||
    !/^[A-Za-z0-9_-]{1,80}$/.test(subjectId)
  ) {
    redirect("/dashboard?error=storage");
  }

  let notebook: URL;
  try {
    notebook = new URL(notebookUrl);
  } catch {
    redirect("/dashboard?error=storage");
  }
  if (notebook.protocol !== "https:" || notebook.hostname !== "colab.research.google.com") {
    redirect("/dashboard?error=storage");
  }

  const clerk = await clerkClient();
  const { data: matches } = await clerk.users.getUserList({ username: [studentUsername], limit: 2 });
  const student = matches.find((candidate) => candidate.publicMetadata?.role === "student");
  if (!student) redirect("/dashboard?error=student");

  try {
    await createTask({
      title: "Process " + datasetId + " · " + subjectId,
      assigned_to_user_id: student.id,
      assigned_to_username: student.username ?? studentUsername,
      dataset_id: datasetId,
      subject_id: subjectId,
      notebook_url: notebook.toString(),
      due_date: null,
      created_by_user_id: userId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[portal] task assignment storage failure:", message);
    redirect("/dashboard?error=storage");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?notice=assigned");
}

export async function markTaskComplete(formData: FormData) {
  const { userId } = await auth();
  const student = await currentUser();
  if (!userId || student?.publicMetadata?.role !== "student") redirect("/dashboard");

  const taskId = requiredText(formData, "taskId");
  if (!/^[0-9a-f-]{36}$/i.test(taskId)) redirect("/dashboard");

  try {
    await completeTask(taskId, userId, student.username ?? "");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[portal] task completion storage failure:", message);
    redirect("/dashboard?error=storage");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?notice=completed");
}
