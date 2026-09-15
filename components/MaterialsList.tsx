"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleMaterial, deleteMaterial } from "@/lib/actions";
import type { Material } from "@/lib/types";

export default function MaterialsList({ jobId, materials }: { jobId: string; materials: Material[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (materials.length === 0) {
    return <p className="text-sm text-muted/70 italic">No materials listed yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {materials.map((m) => (
        <li key={m.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={m.acquired}
            disabled={pending}
            onChange={(e) =>
              startTransition(async () => {
                await toggleMaterial(m.id, jobId, e.target.checked);
                router.refresh();
              })
            }
            className="w-4 h-4 accent-moss shrink-0"
          />
          <span className={`text-sm ${m.acquired ? "line-through text-muted" : ""}`}>
            {m.name}
            {m.quantity ? <span className="text-muted"> — {m.quantity}</span> : null}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteMaterial(m.id, jobId);
                router.refresh();
              })
            }
            className="ml-auto text-xs text-muted opacity-0 group-hover:opacity-100 hover:text-rust"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
