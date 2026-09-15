"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Job, JobArea, JobStatus, JobWithDetails } from "@/lib/types";

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
