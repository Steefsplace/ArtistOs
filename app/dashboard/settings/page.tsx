"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    genre: "",
    bio: "",
    base_fee: "",
    minimum_fee: "",
    city: "",
    website: "",
    fee_type: "negotiable" as "fixed" | "negotiable",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: artist } = await supabase
        .from("artists")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (artist) {
        setArtistId(artist.id);
        setForm({
          name: artist.name ?? "",
          slug: artist.slug ?? "",
          genre: artist.genre ?? "",
          bio: artist.bio ?? "",
          base_fee: artist.base_fee?.toString() ?? "",
          minimum_fee: artist.minimum_fee?.toString() ?? "",
          city: artist.city ?? "",
          website: artist.website ?? "",
          fee_type: (artist.fee_type ?? "negotiable") as "fixed" | "negotiable",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Auto-generate slug from name
    if (name === "name") {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      name: form.name,
      slug: form.slug,
      genre: form.genre,
      bio: form.bio,
      base_fee: form.base_fee ? parseFloat(form.base_fee) : null,
      minimum_fee: form.minimum_fee ? parseFloat(form.minimum_fee) : null,
      city: form.city,
      website: form.website,
      fee_type: form.fee_type,
      updated_at: new Date().toISOString(),
    };

    if (artistId) {
      await supabase.from("artists").update(payload).eq("id", artistId);
    } else {
      const { data } = await supabase.from("artists").insert(payload).select().single();
      if (data) setArtistId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-2xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Instellingen</h1>
        <p className="text-[var(--foreground)]/50 mt-1 text-sm">
          Jouw artiestprofiel — de agents gebruiken dit om jou te vertegenwoordigen
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basis info */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
            Artiestprofiel
          </h2>
          <Field label="Artiestnaam *" name="name" value={form.name} onChange={handleChange} placeholder="DJ Steefsplace" required />
          <Field label="URL slug *" name="slug" value={form.slug} onChange={handleChange} placeholder="dj-steefsplace" required />
          <p className="text-xs text-[var(--foreground)]/40 -mt-2">
            Boekingsformulier: artist-os-fj6f.vercel.app/book/{form.slug || "jouw-naam"}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Genre" name="genre" value={form.genre} onChange={handleChange} placeholder="Techno / House" />
            <Field label="Stad" name="city" value={form.city} onChange={handleChange} placeholder="Amsterdam" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Korte beschrijving voor promotors..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>
          <Field label="Website" name="website" value={form.website} onChange={handleChange} placeholder="https://jouwwebsite.nl" />
        </div>

        {/* Fee info */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
            Fees — alleen zichtbaar voor de agents
          </h2>
          {/* Fee type toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, fee_type: "negotiable" }))}
              className={`rounded-xl border p-4 text-left transition-colors ${
                form.fee_type === "negotiable"
                  ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/40"
              }`}
            >
              <p className={`text-sm font-semibold mb-1 ${form.fee_type === "negotiable" ? "text-[var(--accent)]" : ""}`}>
                Onderhandelbaar
              </p>
              <p className="text-xs text-[var(--foreground)]/50 leading-relaxed">
                Marie onderhandelt actief. Minimum fee is de ondergrens.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, fee_type: "fixed" }))}
              className={`rounded-xl border p-4 text-left transition-colors ${
                form.fee_type === "fixed"
                  ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/40"
              }`}
            >
              <p className={`text-sm font-semibold mb-1 ${form.fee_type === "fixed" ? "text-[var(--accent)]" : ""}`}>
                Vaste prijs
              </p>
              <p className="text-xs text-[var(--foreground)]/50 leading-relaxed">
                Marie communiceert één prijs. Take it or leave it.
              </p>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label={form.fee_type === "fixed" ? "Vaste fee (€)" : "Standaard fee (€)"}
              name="base_fee" type="number" value={form.base_fee}
              onChange={handleChange} placeholder="2500"
            />
            {form.fee_type === "negotiable" && (
              <Field label="Minimum fee (€)" name="minimum_fee" type="number" value={form.minimum_fee} onChange={handleChange} placeholder="1500" />
            )}
          </div>
          <p className="text-xs text-[var(--foreground)]/40">
            {form.fee_type === "fixed"
              ? "Marie communiceert deze prijs als niet-onderhandelbaar naar promotors."
              : "Marie gebruikt deze bedragen om boekingsaanvragen te beoordelen en te onderhandelen."}
          </p>
        </div>

        {artistId && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-widest mb-2">
              Jouw boekingslink
            </p>
            <p className="text-sm font-mono text-[var(--accent)] break-all">
              artist-os-fj6f.vercel.app/book/{form.slug || artistId}
            </p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">
              Stuur deze link naar promotors — Marie verwerkt de aanvragen automatisch.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-full bg-[var(--accent)] text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Opslaan..." : saved ? "✓ Opgeslagen!" : "Profiel opslaan"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label, name, value, onChange, type = "text", placeholder, required,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} value={value}
        onChange={onChange} placeholder={placeholder} required={required}
        className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] transition-colors"
      />
    </div>
  );
}
