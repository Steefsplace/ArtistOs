import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  {
    icon: "📅",
    title: "Boekingen Beheren",
    description:
      "Overzicht van al je shows, events en repetities op één plek. Nooit meer een afspraak missen.",
  },
  {
    icon: "📄",
    title: "Contracten & Riders",
    description:
      "Genereer en verstuur professionele contracten en technische riders direct vanuit het platform.",
  },
  {
    icon: "💶",
    title: "Financieel Overzicht",
    description:
      "Houd gagen, kosten en facturen bij. Altijd inzicht in je verdiensten per maand of jaar.",
  },
  {
    icon: "📬",
    title: "Communicatie Hub",
    description:
      "Beheer berichten met promotors en venues. Alles gecentraliseerd, niets verdwijnt.",
  },
  {
    icon: "📊",
    title: "Statistieken & Groei",
    description:
      "Zie hoeveel shows je hebt gespeeld, in welke regio's en hoe je populariteit groeit.",
  },
  {
    icon: "🔗",
    title: "Integraties",
    description:
      "Koppel je agenda, Spotify, socials en boekingssystemen voor een naadloze workflow.",
  },
];

const testimonials = [
  {
    quote:
      "ArtistOS heeft mijn administratie volledig overgenomen. Ik focus nu alleen nog op de muziek.",
    name: "Mira van den Berg",
    role: "DJ & Producer",
  },
  {
    quote:
      "Eindelijk een platform dat begrijpt hoe de live muziekbusiness werkt. Een must-have.",
    name: "Daan Huijbers",
    role: "Liveband — The Harbour Lights",
  },
  {
    quote:
      "In twee klikken een contract versturen? Dat bespaar me uren per week.",
    name: "Yasmine El Harrak",
    role: "Singer-songwriter",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-36 pb-28 overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[var(--accent)] opacity-[0.06] blur-[120px]" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[var(--accent)] mb-8">
          Nu in Early Access
        </span>

        <h1 className="max-w-3xl text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
          Jouw carrière,{" "}
          <span className="text-[var(--accent)]">op orde.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-[var(--foreground)]/60 leading-relaxed">
          ArtistOS is het alles-in-één booking management platform voor
          artiesten. Van aanvraag tot afrekening — gestroomlijnd, professioneel
          en gebouwd voor de muziekindustrie.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-8 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Start gratis →
          </Link>
          <Link
            href="#features"
            className="inline-flex h-12 items-center rounded-full border border-[var(--border)] px-8 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
          >
            Bekijk features
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-12 text-xs text-[var(--foreground)]/40 tracking-wide">
          Al 500+ artiesten beheren hun boekingen via ArtistOS
        </p>
      </section>

      {/* Dashboard preview placeholder */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs text-[var(--foreground)]/40 font-mono">
              artistos.nl/dashboard
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 p-6">
            {/* Stat cards */}
            {[
              { label: "Aankomende shows", value: "12" },
              { label: "Openstaande offertes", value: "4" },
              { label: "Maandelijks omzet", value: "€6.400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5"
              >
                <p className="text-xs text-[var(--foreground)]/50 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-[var(--accent)]">
                  {stat.value}
                </p>
              </div>
            ))}
            {/* Booking list placeholder */}
            <div className="col-span-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 space-y-3">
              {[
                { venue: "Paradiso, Amsterdam", date: "14 jun", status: "Bevestigd" },
                { venue: "De Melkweg, Amsterdam", date: "22 jun", status: "In onderhandeling" },
                { venue: "Paard, Den Haag", date: "5 jul", status: "Offerte verstuurd" },
              ].map((b) => (
                <div
                  key={b.venue}
                  className="flex items-center justify-between rounded-lg bg-[var(--background)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{b.venue}</p>
                    <p className="text-xs text-[var(--foreground)]/40">{b.date}</p>
                  </div>
                  <span
                    className={`text-xs rounded-full px-3 py-1 font-medium ${
                      b.status === "Bevestigd"
                        ? "bg-green-500/10 text-green-400"
                        : b.status === "In onderhandeling"
                        ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="px-6 py-24 border-t border-[var(--border)]"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-center text-[var(--foreground)]/50 mb-16 max-w-lg mx-auto">
            Gebouwd door mensen uit de muziekindustrie. Geen overbodige poespas
            — alleen wat werkt.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:bg-[var(--surface-2)]"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--foreground)]/55 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24 border-t border-[var(--border)]">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-16">
            Wat artiesten zeggen
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-[var(--foreground)]/40">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28 border-t border-[var(--border)]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Klaar om te beginnen?
          </h2>
          <p className="text-[var(--foreground)]/50 mb-10 text-lg">
            Maak vandaag gratis een account aan. Geen creditcard nodig.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex h-14 items-center rounded-full bg-[var(--accent)] px-10 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            Start gratis met ArtistOS →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
