import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobWithDetails, addPhoto, addProgressEntry, addMaterial } from "@/lib/actions";
import { AREA_LABELS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import StatusControls from "@/components/StatusControls";
import MaterialsList from "@/components/MaterialsList";
import PhotoGallery from "@/components/PhotoGallery";
import DeleteJobButton from "@/components/DeleteJobButton";
import ProgressLogForm from "@/components/ProgressLogForm";
import AddPhotoForm from "@/components/AddPhotoForm";
import AddMaterialForm from "@/components/AddMaterialForm";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJobWithDetails(params.id);
  if (!job) notFound();

  const addPhotoWithId = addPhoto.bind(null, job.id);
  const addProgressWithId = addProgressEntry.bind(null, job.id);
  const addMaterialWithId = addMaterial.bind(null, job.id);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-ink underline">
        Back to board
      </Link>

      <div className="mt-3 mb-6">
        <p className="font-mono text-xs text-muted mb-1">{AREA_LABELS[job.area]}</p>
        <h1 className="text-2xl mb-2">{job.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge status={job.status} />
        </div>
        {job.description && <p className="text-ink/90 whitespace-pre-wrap">{job.description}</p>}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <StatusControls jobId={job.id} status={job.status} />
        <DeleteJobButton jobId={job.id} jobTitle={job.title} />
      </div>

      {/* Photos */}
      <section className="mt-8 pt-6 border-t border-line">
        <h2 className="text-sm text-muted mb-3">Photos</h2>
        <PhotoGallery photos={job.photos} />
        <AddPhotoForm action={addPhotoWithId} />
      </section>

      {/* Materials */}
      <section className="mt-8 pt-6 border-t border-line">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-muted">Materials needed</h2>
          <Link href={`/jobs/${job.id}/shopping-list`} className="text-sm text-denim hover:underline">
            Open shopping list view
          </Link>
        </div>
        <MaterialsList jobId={job.id} materials={job.materials} />
        <AddMaterialForm action={addMaterialWithId} />
      </section>

      {/* Progress log */}
      <section className="mt-8 pt-6 border-t border-line">
        <h2 className="text-sm text-muted mb-3">Progress log</h2>
        <ProgressLogForm action={addProgressWithId} />

        <div className="flex flex-col gap-4">
          {job.progress_log.length === 0 && (
            <p className="text-sm text-muted/70 italic">No entries yet.</p>
          )}
          {job.progress_log.map((entry) => (
            <div key={entry.id} className="border-l-2 border-line pl-3">
              <p className="font-mono text-xs text-muted mb-1">
                {new Date(entry.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="whitespace-pre-wrap">{entry.note}</p>
              {entry.next_steps && (
                <p className="text-sm text-denim mt-1 whitespace-pre-wrap">
                  Next: {entry.next_steps}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
