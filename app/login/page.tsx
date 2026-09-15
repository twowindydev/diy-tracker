"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong");
      return;
    }
    router.push(params.get("from") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs border-2 border-line bg-tile p-6">
      <h1 className="text-sm font-semibold text-muted mb-1">Home &amp; Garden Job Tracker</h1>
      <p className="text-lg mb-4">Enter the PIN to continue</p>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="field-input mb-3"
        placeholder="PIN"
      />
      {error && <p className="text-rust text-sm mb-3">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Checking..." : "Enter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
