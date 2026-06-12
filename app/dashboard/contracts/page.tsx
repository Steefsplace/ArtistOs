import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const statusLabels: Record<string, { label: string; class: string }> = {
  draft: { label: "Concept", class: "bg-zinc-500/10 text-zinc-400" },
  sent: { label: "Verstuurd", class: "bg-blue-500/10 text-blue-400" },
  signed: { label: "Getekend", class: "bg-[var(--accent-muted)] text-[var(--accent)]" },
  cancelled: { label: "Geannuleerd", class: "bg-red-500/10 text-red-400" },
};

interface Contract {
  id: string;
  booking_id: string;
  contract_summary: string | null;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
  booking_requests: {
    venue_name: string;
    venue_city: string;
    event_date: string;
    promotor_name: string;
    offered_fee: number | null;
  } | null;
}

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: contracts } = artist
    ? await supabase
        .from("contracts")
        .select("*, booking_requests(venue_name, venue_city, event_date, promotor_name, offered_fee)")
        .eq("booking_requests.artist_id", artist.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Contracten</h1>
        <p className="text-[var(--foreground)]/50 mt-1 text-sm">
          Luuk genereert automatisch contracten bij bevestigde boekingen
        </p>
      </div>

      {/* Agent info card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-lg flex-shrink-0">
          📄
        </div>
        <div>
          <p className="font-semibold text-sm">Luuk — Contract Agent</p>
          <p className="text-xs text-[var(--foreground)]/50 mt-1 leading-relaxed">
            Luuk stelt professionele optreden-contracten op zodra een boeking bevestigd is.
            Hij bewaakt betalingstermijnen, annuleringsbeleid en technische riders.
          </p>
        </div>
        <span className="ml-auto text-xs rounded-full px-3 py-1 bg-[var(--accent-muted)] text-[var(--accent)] font-medium flex-shrink-0">
          Actief
        </span>
      </div>

      {(!contracts || contracts.length === 0) && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <span className="text-4xl block mb-4">📄</span>
          <p className="font-medium mb-2">Nog geen contracten</p>
          <p className="text-sm text-[var(--foreground)]/40">
            Zodra een boeking bevestigd wordt, stelt Luuk automatisch een contract op
          </p>
        </div>
      )}

      {contracts && contracts.length > 0 && (
        <div className="space-y-4">
          {(contracts as Contract[]).map((contract) => {
            const status = statusLabels[contract.status] ?? statusLabels.draft;
            const booking = contract.booking_requests;
            return (
              <div
                key={contract.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                <div className="flex items-start justify-between px-6 py-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {booking?.venue_name ?? "Onbekende venue"}{booking?.venue_city ? `, ${booking.venue_city}` : ""}
                      </h3>
                      <span className={`text-xs rounded-full px-3 py-1 font-medium ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground)]/50">
                      {booking?.promotor_name} · {booking?.event_date ? new Date(booking.event_date).toLocaleDateString("nl-NL") : "—"}
                      {booking?.offered_fee ? ` · €${booking.offered_fee.toLocaleString("nl-NL")}` : ""}
                    </p>
                    {contract.contract_summary && (
                      <p className="text-sm text-[var(--foreground)]/70 mt-2 max-w-2xl leading-relaxed">
                        {contract.contract_summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 px-6 pb-5">
                  {contract.status === "draft" && (
                    <button className="h-9 rounded-full bg-[var(--accent)] text-white px-5 text-xs font-semibold hover:opacity-90 transition-opacity">
                      Versturen naar promotor
                    </button>
                  )}
                  <button className="h-9 rounded-full border border-[var(--border)] px-5 text-xs font-medium hover:bg-[var(--surface-2)] transition-colors">
                    Contract bekijken
                  </button>
                  {contract.status === "sent" && (
                    <button className="h-9 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/20 px-5 text-xs font-semibold hover:opacity-90 transition-opacity">
                      Markeren als getekend
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
