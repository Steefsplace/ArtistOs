"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-10">
          <span className="text-[var(--accent)] font-bold text-xl tracking-tight">
            Artist<span className="text-[var(--foreground)]">OS</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <h1 className="text-2xl font-bold mb-1">Welkom terug</h1>
          <p className="text-sm text-[var(--foreground)]/50 mb-8">
            Log in op je ArtistOS account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="email">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@voorbeeld.nl"
                className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="password">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-[var(--accent)] text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Inloggen…" : "Inloggen"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--foreground)]/50">
            Nog geen account?{" "}
            <Link
              href="/auth/signup"
              className="text-[var(--accent)] hover:underline"
            >
              Registreer gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
