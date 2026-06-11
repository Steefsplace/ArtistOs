import { createClient } from "@/lib/supabase/server";

const upcomingBookings = [
  { id: 1, venue: "Paradiso, Amsterdam", date: "14 jun 2026", fee: "€1.800", status: "Bevestigd" },
  { id: 2, venue: "De Melkweg, Amsterdam", date: "22 jun 2026", fee: "€2.200", status: "In onderhandeling" },
  { id: 3, venue: "Paard, Den Haag", date: "5 jul 2026", fee: "€1.500", status: "Offerte verstuurd" },
  { id: 4, venue: "Tivoli Vredenburg, Utrecht", date: "19 jul 2026", fee: "€3.000", status: "Bevestigd" },
];

const statusColors: Record<string, string> = {
  Bevestigd: "bg-green-500/10 text-green-400",
  "In onderhandeling": "bg-[var(--accent-muted)] text-[var(--accent)]",
  "Offerte verstuurd": "bg-blue-500/10 text-blue-400",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Artiest";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Goedemiddag, {displayName} 👋
        </h1>
        <p className="text-[var(--foreground)]/50 mt-1 text-sm">
          Hier is een overzicht van je activiteiten
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Aankomende shows", value: "12", delta: "+3 deze maand" },
          { label: "Openstaande offertes", value: "4", delta: "2 wachten op reactie" },
          { label: "Maandomzet", value: "€6.400", delta: "+12% vs vorige maand" },
          { label: "Bevestigingsrate", value: "78%", delta: "Boven gemiddeld" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <p className="text-xs text-[var(--foreground)]/50 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-[var(--accent)]">{stat.value}</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Aankomende boekingen</h2>
          <button className="text-xs text-[var(--accent)] hover:underline">
            Alle boekingen →
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {upcomingBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-2)] transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{booking.venue}</p>
                <p className="text-xs text-[var(--foreground)]/40 mt-0.5">{booking.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[var(--foreground)]/80">
                  {booking.fee}
                </span>
                <span
                  className={`text-xs rounded-full px-3 py-1 font-medium ${
                    statusColors[booking.status] ?? "bg-[var(--surface-2)] text-[var(--foreground)]/60"
                  }`}
                >
                  {booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold mb-4">Snelle acties</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: "📅", label: "Nieuwe boeking", desc: "Voeg een show of event toe" },
            { icon: "📄", label: "Contract opstellen", desc: "Genereer een contract voor een klant" },
            { icon: "💶", label: "Factuur versturen", desc: "Stuur een factuur naar een promotor" },
          ].map((action) => (
            <button
              key={action.label}
              className="text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-2)] transition-colors group"
            >
              <span className="text-2xl block mb-3">{action.icon}</span>
              <p className="text-sm font-semibold group-hover:text-[var(--accent)] transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-[var(--foreground)]/40 mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
