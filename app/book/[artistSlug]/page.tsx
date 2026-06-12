"use client";

import { useState, use } from "react";
import Link from "next/link";

export default function BookingPage({
  params,
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = use(params);
  const [form, setForm] = useState({
    promotor_name: "",
    promotor_email: "",
    promotor_phone: "",
    venue_name: "",
    venue_city: "",
    venue_capacity: "",
    event_date: "",
    event_name: "",
    set_duration: "",
    offered_fee: "",
    additional_info: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/agent/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        artist_id: artistSlug,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Er is iets misgegaan");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
        <div className="max-w-md text-center">
          <span className="text-6xl block mb-6">🎉</span>
          <h1 className="text-3xl font-bold mb-4">Aanvraag ontvangen!</h1>
          <p className="text-[var(--foreground)]/60 leading-relaxed mb-8">
            Bedankt voor je boekingsaanvraag. Ons team (powered by AI) beoordeelt
            je aanvraag en neemt binnen 24 uur contact met je op via{" "}
            <strong className="text-[var(--foreground)]">{form.promotor_email}</strong>.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-[var(--border)] px-6 text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            Terug naar ArtistOS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-[var(--accent)] font-bold text-lg tracking-tight">
            Artist<span className="text-[var(--foreground)]">OS</span>
          </Link>
          <h1 className="text-3xl font-bold mt-6 mb-2">Boekingsaanvraag</h1>
          <p className="text-[var(--foreground)]/50">
            Vul het formulier in en onze booking agent verwerkt je aanvraag automatisch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Promotor info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
              Jouw gegevens
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Naam / Organisatie *" name="promotor_name" value={form.promotor_name} onChange={handleChange} placeholder="Paradiso B.V." required />
              <Field label="E-mailadres *" name="promotor_email" type="email" value={form.promotor_email} onChange={handleChange} placeholder="booking@paradiso.nl" required />
              <Field label="Telefoonnummer" name="promotor_phone" value={form.promotor_phone} onChange={handleChange} placeholder="+31 6 12345678" />
            </div>
          </div>

          {/* Venue & event */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
              Venue & Event
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Venue naam *" name="venue_name" value={form.venue_name} onChange={handleChange} placeholder="Paradiso" required />
              <Field label="Stad *" name="venue_city" value={form.venue_city} onChange={handleChange} placeholder="Amsterdam" required />
              <Field label="Capaciteit" name="venue_capacity" type="number" value={form.venue_capacity} onChange={handleChange} placeholder="1500" />
              <Field label="Datum *" name="event_date" type="date" value={form.event_date} onChange={handleChange} required />
              <Field label="Event naam" name="event_name" value={form.event_name} onChange={handleChange} placeholder="Amsterdam Dance Event" />
              <Field label="Set duur (minuten)" name="set_duration" type="number" value={form.set_duration} onChange={handleChange} placeholder="60" />
            </div>
          </div>

          {/* Deal */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
              Deal & Overige info
            </h2>
            <Field label="Aangeboden gage (€)" name="offered_fee" type="number" value={form.offered_fee} onChange={handleChange} placeholder="2500" />
            <div>
              <label className="block text-sm font-medium mb-2">
                Aanvullende informatie
              </label>
              <textarea
                name="additional_info"
                value={form.additional_info}
                onChange={handleChange}
                rows={4}
                placeholder="Bijzonderheden, productie info, line-up context..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[var(--accent)] text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Aanvraag wordt verwerkt door AI agent…" : "Aanvraag versturen →"}
          </button>

          <p className="text-center text-xs text-[var(--foreground)]/30">
            Je aanvraag wordt automatisch beoordeeld door onze AI booking agent.
            Je ontvangt binnen 24 uur een reactie.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] transition-colors"
      />
    </div>
  );
}
