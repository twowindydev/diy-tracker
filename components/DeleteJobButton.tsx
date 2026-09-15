"use client";

import { useTransition } from "react";
import { deleteJob } from "@/lib/actions";

export default function DeleteJobButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Delete "${jobTitle}"? This removes its photos, materials and progress log too. This can't be undone.`)) {
      return;
    }
    startTransition(async () => {
      await deleteJob(jobId);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="btn border-2 border-rust text-rust bg-tile hover:bg-rust hover:text-tile"
    >
      {pending ? "Deleting..." : "Delete job"}
    </button>
  );
}
