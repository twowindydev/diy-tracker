"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Job, JobArea, JobStatus, JobWithDetails, QuickTask } from "@/lib/types";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "diy-tracker-photos";

// ---------- reads ----------

export async function getJobs(statuses: JobStatus[]): Promise<Job[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .in("status", statuses)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Job[];
}

// Most recent non-empty next_steps from the progress log, keyed by job id.
export async function getLatestNextSteps(jobIds: string[]): Promise<Record<string, string>> {
  if (jobIds.length === 0) return {};
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("progress_log")
    .select("job_id, next_steps")
    .in("job_id", jobIds)
    .not("next_steps", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    const text = (row.next_steps as string).trim();
    if (text && !(row.job_id in result)) result[row.job_id] = text;
  }
  return result;
}

export async function getJobWithDetails(id: string): Promise<JobWithDetails | null> {
  const sb = supabaseAdmin();
  const { data: job, error } = await sb.from("jobs").select("*").eq("id", id).single();
  if (error || !job) return null;

  const [{ data: photos }, { data: log }, { data: materials }] = await Promise.all([
    sb.from("job_photos").select("*").eq("job_id", id).order("created_at", { ascending: true }),
    sb.from("progress_log").select("*").eq("job_id", id).order("created_at", { ascending: false }),
    sb.from("materials").select("*").eq("job_id", id).order("created_at", { ascending: true }),
  ]);

  return {
    ...(job as Job),
    photos: photos ?? [],
    progress_log: log ?? [],
    materials: materials ?? [],
  };
}

export async function getPhotoUrl(storagePath: string): Promise<string | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

// ---------- writes ----------

export async function createJob(formData: FormData) {
  const sb = supabaseAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const area = String(formData.get("area") || "other") as JobArea;

  if (!title) {
    throw new Error("Title is required");
  }

  const { data: job, error } = await sb
    .from("jobs")
    .insert({ title, description: description || null, area, status: "todo" })
    .select()
    .single();
  if (error) throw error;

  const photos = formData.getAll("photos") as File[];
  for (const photo of photos) {
    if (!photo || typeof photo === "string" || photo.size === 0) continue;
    await uploadPhotoForJob(job.id, photo);
  }

  revalidatePath("/");
  redirect("/");
}

async function uploadPhotoForJob(jobId: string, file: File) {
  const sb = supabaseAdmin();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${jobId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: insertError } = await sb
    .from("job_photos")
    .insert({ job_id: jobId, storage_path: path });
  if (insertError) throw insertError;
}

export async function addPhoto(jobId: string, formData: FormData) {
  const file = formData.get("photo") as File | null;
  if (file && file.size > 0) {
    await uploadPhotoForJob(jobId, file);
  }
  revalidatePath(`/jobs/${jobId}`);
}

export async function setJobStatus(jobId: string, status: JobStatus) {
  const sb = supabaseAdmin();
  const patch: Record<string, unknown> = { status };
  if (status === "completed") patch.completed_at = new Date().toISOString();
  const { error } = await sb.from("jobs").update(patch).eq("id", jobId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/archive");
}

export async function addProgressEntry(jobId: string, formData: FormData) {
  const note = String(formData.get("note") || "").trim();
  const nextSteps = String(formData.get("next_steps") || "").trim();
  if (!note) throw new Error("Note is required");

  const sb = supabaseAdmin();
  const { error } = await sb.from("progress_log").insert({
    job_id: jobId,
    note,
    next_steps: nextSteps || null,
  });
  if (error) throw error;

  // touch updated_at so the dashboard sort reflects recent activity
  await sb.from("jobs").update({ updated_at: new Date().toISOString() }).eq("id", jobId);

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
}

export async function addMaterial(jobId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const quantity = String(formData.get("quantity") || "").trim();
  if (!name) throw new Error("Material name is required");

  const sb = supabaseAdmin();
  const { error } = await sb.from("materials").insert({
    job_id: jobId,
    name,
    quantity: quantity || null,
  });
  if (error) throw error;
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shopping-list`);
}

export async function toggleMaterial(materialId: string, jobId: string, acquired: boolean) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("materials").update({ acquired }).eq("id", materialId);
  if (error) throw error;
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shopping-list`);
}

export async function deleteMaterial(materialId: string, jobId: string) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("materials").delete().eq("id", materialId);
  if (error) throw error;
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shopping-list`);
}

export async function deleteJob(jobId: string) {
  const sb = supabaseAdmin();

  const { data: photos } = await sb
    .from("job_photos")
    .select("storage_path")
    .eq("job_id", jobId);
  if (photos && photos.length > 0) {
    await sb.storage.from(BUCKET).remove(photos.map((p) => p.storage_path));
  }

  const { error } = await sb.from("jobs").delete().eq("id", jobId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/archive");
  redirect("/");
}

// ---------- quick tasks ----------

export async function getQuickTasks(): Promise<{ open: QuickTask[]; recentlyDone: QuickTask[] }> {
  const sb = supabaseAdmin();
  const [{ data: open, error: openError }, { data: done, error: doneError }] = await Promise.all([
    sb.from("quick_tasks").select("*").eq("done", false).order("created_at", { ascending: true }),
    sb
      .from("quick_tasks")
      .select("*")
      .eq("done", true)
      .order("done_at", { ascending: false })
      .limit(10),
  ]);
  if (openError) throw openError;
  if (doneError) throw doneError;
  return { open: (open ?? []) as QuickTask[], recentlyDone: (done ?? []) as QuickTask[] };
}

// Sentence case: first letter capitalised, the rest lower case. Words typed
// entirely in capitals (e.g. "TV", "BT") are kept as acronyms, unless the
// whole task was typed in capitals.
function toSentenceCase(input: string): string {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text) return text;
  const allCaps = text === text.toUpperCase();
  const words = text.split(" ").map((w) =>
    !allCaps && w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w) ? w : w.toLowerCase()
  );
  const joined = words.join(" ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

export async function addQuickTask(formData: FormData) {
  const title = toSentenceCase(String(formData.get("title") || ""));
  const area = String(formData.get("area") || "house") as JobArea;
  if (!title) throw new Error("Task is required");

  const sb = supabaseAdmin();
  const { error } = await sb.from("quick_tasks").insert({ title, area });
  if (error) throw error;
  revalidatePath("/");
}

export async function updateQuickTask(taskId: string, formData: FormData) {
  const title = toSentenceCase(String(formData.get("title") || ""));
  const area = String(formData.get("area") || "house") as JobArea;
  if (!title) throw new Error("Task is required");

  const sb = supabaseAdmin();
  const { error } = await sb.from("quick_tasks").update({ title, area }).eq("id", taskId);
  if (error) throw error;
  revalidatePath("/");
}

export async function setQuickTaskDone(taskId: string, done: boolean) {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("quick_tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) throw error;
  revalidatePath("/");
}

export async function deleteQuickTask(taskId: string) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("quick_tasks").delete().eq("id", taskId);
  if (error) throw error;
  revalidatePath("/");
}
