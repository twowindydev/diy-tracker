"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addQuickTask, setQuickTaskDone, deleteQuickTask, updateQuickTask } from "@/lib/actions";
import { AREA_LABELS, type QuickTask } from "@/lib/types";

export default function QuickTasks({
  open,
  recentlyDone,
}: {
  open: QuickTask[];
  recentlyDone: QuickTask[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleAdd(formData: FormData) {
    await addQuickTask(formData);
    formRef.current?.reset();
    inputRef.current?.focus();
    router.refresh();
  }

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <section className="mb-10 border-2 border-line bg-tile p-4">
      <h2 className="text-sm text-muted mb-3 pb-2 border-b border-line">
        Quick tasks <span className="font-mono">({open.length})</span>
      </h2>

      <form ref={formRef} action={handleAdd} className="flex flex-wrap gap-2 mb-4">
        <input
          ref={inputRef}
          name="title"
          required
          aria-label="Quick task"
          className="field-input flex-1 min-w-[180px]"
          placeholder="e.g. Clean the oven, dust the light fitting"
        />
        <select name="area" defaultValue="house" aria-label="Where" className="field-input w-auto">
          <option value="house">House</option>
          <option value="garden">Garden</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>

      {open.length === 0 ? (
        <p className="text-sm text-muted/70 italic">Nothing waiting.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {open.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              disabled={pending}
              onToggle={(done) => run(() => setQuickTaskDone(t.id, done))}
              onDelete={() => run(() => deleteQuickTask(t.id))}
              onSave={(fd) => run(() => updateQuickTask(t.id, fd))}
            />
          ))}
        </ul>
      )}

      {recentlyDone.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-muted cursor-pointer hover:text-ink">
            Recently done ({recentlyDone.length})
          </summary>
          <ul className="flex flex-col gap-1.5 mt-2">
            {recentlyDone.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                disabled={pending}
                onToggle={(done) => run(() => setQuickTaskDone(t.id, done))}
                onDelete={() => run(() => deleteQuickTask(t.id))}
                onSave={(fd) => run(() => updateQuickTask(t.id, fd))}
              />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function TaskRow({
  task,
  disabled,
  onToggle,
  onDelete,
  onSave,
}: {
  task: QuickTask;
  disabled: boolean;
  onToggle: (done: boolean) => void;
  onDelete: () => void;
  onSave: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <form
          action={(fd) => {
            onSave(fd);
            setEditing(false);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            name="title"
            required
            autoFocus
            defaultValue={task.title}
            aria-label="Task"
            className="field-input flex-1 min-w-[180px]"
          />
          <select name="area" defaultValue={task.area} aria-label="Where" className="field-input w-auto">
            <option value="house">House</option>
            <option value="garden">Garden</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" disabled={disabled} className="btn-primary">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={task.done}
        disabled={disabled}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={task.done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        className="w-5 h-5 accent-moss shrink-0"
      />
      <span className={`text-sm ${task.done ? "line-through text-muted" : ""}`}>{task.title}</span>
      <span className="font-mono text-xs text-muted">{AREA_LABELS[task.area]}</span>
      <span className="ml-auto flex gap-3 shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setEditing(true)}
          className="text-xs text-muted underline hover:text-ink"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (window.confirm(`Remove "${task.title}"?`)) onDelete();
          }}
          className="text-xs text-muted underline hover:text-rust"
        >
          Remove
        </button>
      </span>
    </li>
  );
}
