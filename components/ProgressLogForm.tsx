"use client";

import { useRef } from "react";

export default function ProgressLogForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleAction} className="flex flex-col gap-3 mb-6">
      <div>
        <label className="field-label" htmlFor="note">
          What did you do / notice?
        </label>
        <textarea id="note" name="note" required rows={3} className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="next_steps">
          Next steps
        </label>
        <textarea id="next_steps" name="next_steps" rows={2} className="field-input" />
      </div>
      <button type="submit" className="btn-primary self-start">
        Add log entry
      </button>
    </form>
  );
}
