import Link from "next/link";
import { Job, AREA_LABELS } from "@/lib/types";
import StatusBadge from "./StatusBadge";

const CORNER_COLORS: Record<Job["status"], string> = {
  todo: "before:bg-muted",
  planning: "before:bg-amber",
  started: "before:bg-denim",
  completed: "before:bg-moss",
  archived: "before:bg-line",
};

export default function JobCard({ job, nextSteps }: { job: Job; nextSteps?: string }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`relative block border-2 border-line bg-tile p-4 shadow-sm hover:border-ink transition-colors
        before:absolute before:top-0 before:right-0 before:w-3 before:h-3 ${CORNER_COLORS[job.status]}`}
    >
      <p className="font-mono text-xs text-muted mb-2">{AREA_LABELS[job.area]}</p>
      <h3 className="text-base font-medium mb-2 leading-snug">{job.title}</h3>
      {job.description && (
        <p className="text-sm text-muted line-clamp-2 mb-3">{job.description}</p>
      )}
      {nextSteps && (
        <p className="text-sm mb-3 line-clamp-2">
          <span className="font-mono text-xs text-muted">Next: </span>
          {nextSteps}
        </p>
      )}
      <StatusBadge status={job.status} />
    </Link>
  );
}
