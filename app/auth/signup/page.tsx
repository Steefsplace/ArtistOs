"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
        <div className="w-full max-w-sm text-center">
          <span className="text-5xl block mb-6">📬</span>
          <h1 className="text-2xl font-bold mb-3">Check je inbox</h1>
          <p className="text-[var(--foreground)]/50 text-sm leading-relaxed">
            We hebben een bevestigingslink gestuurd naar{" "}
            <strong className="text-[var(--foreground)]">{email}</strong>. Klik
            op de link om je account te activeren.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 inline-flex h-11 items-center rounded-full border border-[var(--border)] px-6 text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            Terug naar inloggen
          </Link>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold mb-1">Account aanmaken</h1>
          <p className="text-sm text-[var(--foreground)]/50 mb-8">
            Gratis starten, geen creditcard nodig
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="name">
                Naam / Artiestennaam
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="DJ Flash"
                className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] transition-colors"
              />
            </div>
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimaal 8 tekens"
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
              className="w-full h-11 rounded-full bg-[var(--accent)] text-[#0c0c10] text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Account aanmaken…" : "Account aanmaken →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--foreground)]/50">
            Al een account?{" "}
            <Link
              href="/auth/login"
              className="text-[var(--accent)] hover:underline"
            >
              Inloggen
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--foreground)]/30">
          Door te registreren ga je akkoord met onze{" "}
          <Link href="#" className="hover:underline">voorwaarden</Link> en{" "}
          <Link href="#" className="hover:underline">privacybeleid</Link>.
        </p>
      </div>
    </div>
  );
}
