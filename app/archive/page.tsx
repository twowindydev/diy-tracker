import Link from "next/link";
import { getJobs } from "@/lib/actions";
import JobCard from "@/components/JobCard";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const jobs = await getJobs(["completed", "archived"]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-ink underline">
        Back to board
      </Link>
      <h1 className="text-2xl mt-2 mb-6">Completed &amp; archived</h1>

      {jobs.length === 0 && <p className="text-muted">Nothing finished yet.</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </main>
  );
}
