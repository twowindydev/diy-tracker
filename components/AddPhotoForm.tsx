"use client";

import { useRef } from "react";

export default function AddPhotoForm({
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
    <form ref={formRef} action={handleAction} className="flex items-center gap-2 mt-3">
      <input
        type="file"
        name="photo"
        accept="image/*"
        required
        className="text-sm file:mr-3 file:border-0 file:bg-ink file:text-paper file:px-3 file:py-1.5 file:text-sm"
      />
      <button type="submit" className="btn-secondary shrink-0">
        Add
      </button>
    </form>
  );
}
