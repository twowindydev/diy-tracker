export type JobStatus = "todo" | "planning" | "started" | "completed" | "archived";
export type JobArea = "house" | "garden" | "other";

export interface Job {
  id: string;
  title: string;
  description: string | null;
  area: JobArea;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface ProgressLogEntry {
  id: string;
  job_id: string;
  note: string;
  next_steps: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  job_id: string;
  name: string;
  quantity: string | null;
  acquired: boolean;
  created_at: string;
}

export interface QuickTask {
  id: string;
  title: string;
  area: JobArea;
  done: boolean;
  done_at: string | null;
  created_at: string;
}

export interface JobWithDetails extends Job {
  photos: JobPhoto[];
  progress_log: ProgressLogEntry[];
  materials: Material[];
}

export const STATUS_LABELS: Record<JobStatus, string> = {
  todo: "To do",
  planning: "Planning",
  started: "Started",
  completed: "Completed",
  archived: "Archived",
};

export const AREA_LABELS: Record<JobArea, string> = {
  house: "House",
  garden: "Garden",
  other: "Other",
};
