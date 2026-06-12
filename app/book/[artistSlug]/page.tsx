"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { locales } from "@/lib/i18n/translations";

export default function BookingPage({
  params,
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = use(params);
  const { tr, locale, setLocale, isRTL } = useLocale();
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
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-md text-center">
          <span className="text-6xl block mb-6">🎉</span>
          <h1 className="text-3xl font-bold mb-4">{tr("book_success_title")}</h1>
          <p className="text-[var(--foreground)]/60 leading-relaxed mb-8">
            {tr("book_success_body")}{" "}
            <strong className="text-[var(--foreground)]">{form.promotor_email}</strong>.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-[var(--border)] px-6 text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            {tr("book_back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-16" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-[var(--accent)] font-bold text-lg tracking-tight">
              Artist<span className="text-[var(--foreground)]">OS</span>
            </Link>
            {/* Language picker */}
            <div className="flex gap-1">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  title={l.label}
                  className={`text-lg rounded px-1 transition-opacity ${locale === l.code ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
                >
                  {l.flag}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-bold mt-6 mb-2">{tr("book_title")}</h1>
          <p className="text-[var(--foreground)]/50">{tr("book_subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Promotor info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
              {tr("book_your_info")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={tr("book_name")} name="promotor_name" value={form.promotor_name} onChange={handleChange} placeholder="Paradiso B.V." required />
              <Field label={tr("book_email")} name="promotor_email" type="email" value={form.promotor_email} onChange={handleChange} placeholder="booking@paradiso.nl" required />
              <Field label={tr("book_phone")} name="promotor_phone" value={form.promotor_phone} onChange={handleChange} placeholder="+31 6 12345678" />
            </div>
          </div>

          {/* Venue & event */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
              {tr("book_venue_event")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={tr("book_venue")} name="venue_name" value={form.venue_name} onChange={handleChange} placeholder="Paradiso" required />
              <Field label={tr("book_city")} name="venue_city" value={form.venue_city} onChange={handleChange} placeholder="Amsterdam" required />
              <Field label={tr("book_capacity")} name="venue_capacity" type="number" value={form.venue_capacity} onChange={handleChange} placeholder="1500" />
              <Field label={tr("book_date")} name="event_date" type="date" value={form.event_date} onChange={handleChange} required />
              <Field label={tr("book_event_name")} name="event_name" value={form.event_name} onChange={handleChange} placeholder="Amsterdam Dance Event" />
              <Field label={tr("book_set_duration")} name="set_duration" type="number" value={form.set_duration} onChange={handleChange} placeholder="60" />
            </div>
          </div>

          {/* Deal */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-[var(--foreground)]/40">
              {tr("book_deal")}
            </h2>
            <Field label={tr("book_fee")} name="offered_fee" type="number" value={form.offered_fee} onChange={handleChange} placeholder="2500" />
            <div>
              <label className="block text-sm font-medium mb-2">
                {tr("book_extra")}
              </label>
              <textarea
                name="additional_info"
                value={form.additional_info}
                onChange={handleChange}
                rows={4}
                placeholder={tr("book_extra_placeholder")}
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
            {loading ? tr("book_submitting") : tr("book_submit")}
          </button>

          <p className="text-center text-xs text-[var(--foreground)]/30">
            {tr("book_footer")}
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
