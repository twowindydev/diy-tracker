import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobWithDetails, toggleMaterial } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ShoppingListPage({ params }: { params: { id: string } }) {
  const job = await getJobWithDetails(params.id);
  if (!job) notFound();

  const outstanding = job.materials.filter((m) => !m.acquired);
  const acquired = job.materials.filter((m) => m.acquired);

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <Link href={`/jobs/${job.id}`} className="text-sm text-muted hover:text-ink underline">
        Back to job
      </Link>
      <h1 className="text-xl mt-2 mb-1">{job.title}</h1>
      <p className="font-mono text-xs text-muted mb-6">Shopping list</p>

      {job.materials.length === 0 && (
        <p className="text-muted">Nothing listed for this job yet.</p>
      )}

      {outstanding.length > 0 && (
        <ul className="flex flex-col gap-3 mb-6">
          {outstanding.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-line pb-3">
              <form
                action={async () => {
                  "use server";
                  await toggleMaterial(m.id, job.id, true);
                }}
              >
                <button type="submit" className="w-6 h-6 border border-ink shrink-0" aria-label="Mark acquired" />
              </form>
              <div>
                <p className="text-base leading-snug">{m.name}</p>
                {m.quantity && <p className="text-sm text-muted">{m.quantity}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {acquired.length > 0 && (
        <>
          <p className="text-sm text-muted mb-2">Already got</p>
          <ul className="flex flex-col gap-2">
            {acquired.map((m) => (
              <li key={m.id} className="text-sm text-muted line-through">
                {m.name}
                {m.quantity ? ` — ${m.quantity}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
