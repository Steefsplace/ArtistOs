import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface AgentAssessment {
  recommendation?: "accept" | "negotiate" | "decline";
  priority_score?: number;
  date_available?: boolean;
  venue_fit?: string;
  fee_assessment?: string;
  reasons?: string[];
}

interface BookingRequest {
  id: string;
  venue_name: string;
  venue_city: string;
  event_date: string;
  promotor_name: string;
  offered_fee?: number;
  status: string;
  agent_assessment?: AgentAssessment;
  agent_response?: string;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  pending: { label: "Wacht op agent", class: "bg-yellow-500/10 text-yellow-400" },
  reviewing: { label: "Agent beoordeelt", class: "bg-blue-500/10 text-blue-400" },
  negotiating: { label: "In onderhandeling", class: "bg-[var(--accent-muted)] text-[var(--accent)]" },
  confirmed: { label: "Bevestigd", class: "bg-green-500/10 text-green-400" },
  declined: { label: "Afgewezen", class: "bg-red-500/10 text-red-400" },
  cancelled: { label: "Geannuleerd", class: "bg-zinc-500/10 text-zinc-400" },
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get artist profile
  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get booking requests
  const { data: bookings } = artist
    ? await supabase
        .from("booking_requests")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boekingsaanvragen</h1>
          <p className="text-[var(--foreground)]/50 mt-1 text-sm">
            Alle aanvragen worden automatisch beoordeeld door de AI booking agent
          </p>
        </div>
        {artist && (
          <a
            href={`/book/${artist.id}`}
            target="_blank"
            className="inline-flex h-9 items-center rounded-full border border-[var(--border)] px-4 text-xs font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            Boekingslink kopiëren ↗
          </a>
        )}
      </div>

      {!artist && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--foreground)]/50 mb-4">
            Maak eerst een artiestenprofiel aan zodat de booking agent jouw voorkeuren kent.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white"
          >
            Profiel aanmaken →
          </a>
        </div>
      )}

      {artist && (!bookings || bookings.length === 0) && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <span className="text-4xl block mb-4">📭</span>
          <p className="font-medium mb-2">Nog geen aanvragen</p>
          <p className="text-sm text-[var(--foreground)]/40 mb-6">
            Deel je boekingslink met promotors en venues
          </p>
          <a
            href={`/book/${artist.id}`}
            target="_blank"
            className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-5 text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            Bekijk boekingsformulier ↗
          </a>
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <div className="space-y-4">
          {(bookings as BookingRequest[]).map((booking) => {
            const status = statusLabels[booking.status] ?? statusLabels.pending;
            const assessment = booking.agent_assessment;

            return (
              <div
                key={booking.id as string}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--border)]">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{booking.venue_name}</h3>
                      <span className={`text-xs rounded-full px-3 py-1 font-medium ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground)]/50">
                      {booking.venue_city} · {booking.event_date} · {booking.promotor_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--accent)]">
                      {booking.offered_fee ? `€${booking.offered_fee}` : "Gage n.v.t."}
                    </p>
                    <p className="text-xs text-[var(--foreground)]/40 mt-0.5">aangeboden</p>
                  </div>
                </div>

                {/* Agent assessment */}
                {assessment && (
                  <div className="px-6 py-5 space-y-4 bg-[var(--surface-2)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">
                        AI Agent Beoordeling
                      </span>
                      {typeof assessment.priority_score === "number" && (
                        <span className="text-xs bg-[var(--accent-muted)] text-[var(--accent)] rounded-full px-2 py-0.5 font-medium">
                          Score: {assessment.priority_score}/10
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg bg-[var(--background)] px-4 py-3">
                        <p className="text-xs text-[var(--foreground)]/40 mb-1">Aanbeveling</p>
                        <p className="font-medium capitalize">
                          {assessment.recommendation === "accept" ? "✅ Accepteren" :
                           assessment.recommendation === "negotiate" ? "🤝 Onderhandelen" :
                           "❌ Afwijzen"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[var(--background)] px-4 py-3">
                        <p className="text-xs text-[var(--foreground)]/40 mb-1">Datum</p>
                        <p className="font-medium">
                          {assessment.date_available ? "✅ Beschikbaar" : "❌ Bezet"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[var(--background)] px-4 py-3">
                        <p className="text-xs text-[var(--foreground)]/40 mb-1">Venue fit</p>
                        <p className="font-medium text-xs">{assessment.venue_fit}</p>
                      </div>
                    </div>

                    {Array.isArray(assessment.reasons) && (
                      <ul className="text-sm text-[var(--foreground)]/60 space-y-1">
                        {(assessment.reasons as string[]).map((reason, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[var(--accent)] mt-0.5">·</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    )}

                    {booking.agent_response && (
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40 mb-2">
                          Concept response naar promotor
                        </p>
                        <p className="text-sm text-[var(--foreground)]/70 whitespace-pre-wrap leading-relaxed">
                          {booking.agent_response}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button className="h-9 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 px-5 text-xs font-semibold hover:bg-green-500/20 transition-colors">
                        ✓ Goedkeuren & versturen
                      </button>
                      <button className="h-9 rounded-full border border-[var(--border)] px-5 text-xs font-medium hover:bg-[var(--surface)] transition-colors">
                        Bewerken
                      </button>
                      <button className="h-9 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-5 text-xs font-semibold hover:bg-red-500/20 transition-colors ml-auto">
                        Afwijzen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
