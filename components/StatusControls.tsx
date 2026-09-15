"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setJobStatus } from "@/lib/actions";
import type { JobStatus } from "@/lib/types";

const FORWARD: Partial<Record<JobStatus, { next: JobStatus; label: string }>> = {
  todo: { next: "planning", label: "Move to planning" },
  planning: { next: "started", label: "Mark as started" },
  started: { next: "completed", label: "Mark as complete" },
};

export default function StatusControls({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function go(next: JobStatus) {
    startTransition(async () => {
      await setJobStatus(jobId, next);
      router.refresh();
    });
  }

  const forward = FORWARD[status];

  return (
    <div className="flex flex-wrap gap-2">
      {forward && (
        <button disabled={pending} onClick={() => go(forward.next)} className="btn-primary">
          {forward.label}
        </button>
      )}
      {status !== "archived" && status !== "todo" && (
        <button disabled={pending} onClick={() => go("todo")} className="btn-secondary">
          Back to to-do
        </button>
      )}
      {status === "completed" && (
        <button disabled={pending} onClick={() => go("archived")} className="btn-secondary">
          Archive
        </button>
      )}
    </div>
  );
}
