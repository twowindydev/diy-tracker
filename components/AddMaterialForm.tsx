"use client";

import { useRef } from "react";

export default function AddMaterialForm({
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
    <form ref={formRef} action={handleAction} className="flex flex-wrap items-end gap-2 mt-4">
      <div className="flex-1 min-w-[140px]">
        <label className="field-label" htmlFor="name">
          Item
        </label>
        <input id="name" name="name" required className="field-input" placeholder="e.g. Hinges" />
      </div>
      <div className="w-28">
        <label className="field-label" htmlFor="quantity">
          Qty
        </label>
        <input id="quantity" name="quantity" className="field-input" placeholder="x2" />
      </div>
      <button type="submit" className="btn-secondary">
        Add item
      </button>
    </form>
  );
}
