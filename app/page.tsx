import Link from "next/link";
import { getJobs, getLatestNextSteps, getQuickTasks } from "@/lib/actions";
import JobCard from "@/components/JobCard";
import QuickTasks from "@/components/QuickTasks";
import type { JobStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS: { status: JobStatus; heading: string }[] = [
  { status: "todo", heading: "To do" },
  { status: "planning", heading: "Planning" },
  { status: "started", heading: "Started" },
];

export default async function DashboardPage() {
  const [jobs, quickTasks] = await Promise.all([
    getJobs(["todo", "planning", "started"]),
    getQuickTasks(),
  ]);
  const nextSteps = await getLatestNextSteps(jobs.map((j) => j.id));

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl">Home &amp; Garden Job Tracker</h1>
          <p className="text-sm text-muted mt-1">Jobs around the house and garden</p>
        </div>
        <Link href="/jobs/new" className="btn-primary shrink-0 self-start">
          Add a job
        </Link>
      </header>

      <QuickTasks open={quickTasks.open} recentlyDone={quickTasks.recentlyDone} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.status);
          return (
            <section key={col.status}>
              <h2 className="text-sm text-muted mb-3 pb-2 border-b border-line">
                {col.heading} <span className="font-mono">({colJobs.length})</span>
              </h2>
              <div className="flex flex-col gap-3">
                {colJobs.length === 0 && (
                  <p className="text-sm text-muted/70 italic">Nothing here.</p>
                )}
                {colJobs.map((job) => (
                  <JobCard key={job.id} job={job} nextSteps={nextSteps[job.id]} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-10 pt-4 border-t border-line">
        <Link href="/archive" className="text-sm text-muted hover:text-ink underline">
          View completed &amp; archived jobs
        </Link>
      </footer>
    </main>
  );
}
