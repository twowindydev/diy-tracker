import Link from "next/link";
import { createJob } from "@/lib/actions";

export default function NewJobPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-ink underline">
        Back to board
      </Link>
      <h1 className="text-2xl mt-2 mb-6">Add a job</h1>

      <form action={createJob} className="flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="title">
            What is it?
          </label>
          <input
            id="title"
            name="title"
            required
            className="field-input"
            placeholder="e.g. Fix the sticking garden gate"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="field-input"
            placeholder="Any detail worth capturing now, while you're looking at it"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="area">
            Where
          </label>
          <select id="area" name="area" defaultValue="house" className="field-input">
            <option value="house">House</option>
            <option value="garden">Garden</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="photos">
            Photos (optional)
          </label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="field-input file:mr-3 file:border-0 file:bg-ink file:text-paper file:px-3 file:py-1.5 file:text-sm"
          />
        </div>

        <button type="submit" className="btn-primary self-start mt-2">
          Save job
        </button>
      </form>
    </main>
  );
}
