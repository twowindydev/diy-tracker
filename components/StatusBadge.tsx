import { JobStatus, STATUS_LABELS } from "@/lib/types";

const COLORS: Record<JobStatus, string> = {
  todo: "bg-muted",
  planning: "bg-amber",
  started: "bg-denim",
  completed: "bg-moss",
  archived: "bg-line",
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink">
      <span className={`inline-block w-2 h-2 ${COLORS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
