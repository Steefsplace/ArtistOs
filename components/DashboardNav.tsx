"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { type TranslationKey } from "@/lib/i18n/translations";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems: { href: string; key: TranslationKey; icon: string }[] = [
  { href: "/dashboard",           key: "nav_overview",  icon: "⊞" },
  { href: "/dashboard/bookings",  key: "nav_bookings",  icon: "📅" },
  { href: "/dashboard/messages",  key: "nav_messages",  icon: "📬" },
  { href: "/dashboard/contracts", key: "nav_contracts", icon: "📄" },
  { href: "/dashboard/finances",  key: "nav_finances",  icon: "💶" },
  { href: "/dashboard/team",      key: "nav_team",      icon: "💬" },
  { href: "/dashboard/settings",  key: "nav_settings",  icon: "⚙" },
];

export default function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tr } = useLocale();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Artiest";

  return (
    <aside className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-2 mb-10">
        <span className="text-[var(--accent)] font-bold text-lg tracking-tight">
          Artist<span className="text-[var(--foreground)]">OS</span>
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                  : "text-[var(--foreground)]/60 hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {tr(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-[var(--border)] pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-sm font-bold text-[var(--accent)]">
            {displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-[var(--foreground)]/40 truncate">{user.email}</p>
          </div>
        </div>
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-xs text-[var(--foreground)]/40 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
        >
          {tr("nav_logout")}
        </button>
      </div>
    </aside>
  );
}
