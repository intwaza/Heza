import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { t, useLang, type StringKey } from "@/lib/i18n";
import type { WorkerRole } from "@/lib/api";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: Array<{
  to: string;
  labelKey: StringKey;
  icon: typeof LayoutDashboard;
  roles?: WorkerRole[];
}> = [
  { to: "/", labelKey: "nav_dashboard", icon: LayoutDashboard },
  { to: "/patients", labelKey: "nav_patients", icon: Users },
  { to: "/missed", labelKey: "nav_missed", icon: AlertTriangle },
  { to: "/messages", labelKey: "nav_messages", icon: MessageSquareText },
  {
    to: "/reports",
    labelKey: "nav_reports",
    icon: BarChart3,
    roles: ["facility_admin", "system_admin"],
  },
];

function NavLinks({
  pathname,
  lang,
  onNavigate,
}: {
  pathname: string;
  lang: "en" | "rw";
  onNavigate?: () => void;
}) {
  const { worker } = useAuth();

  const visible = NAV_ITEMS.filter(
    (item) =>
      !item.roles ||
      (worker && (item.roles.includes(worker.role) || worker.role === "system_admin")),
  );

  return (
    <div className="space-y-1">
      {visible.map(({ to, labelKey, icon: Icon }) => {
        const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors",
              isActive ? "bg-earth-clay text-white" : "text-earth-deep/80 hover:bg-earth-clay/5",
            )}
          >
            <Icon className="size-4" />
            {t(labelKey, lang)}
          </Link>
        );
      })}
    </div>
  );
}

function WorkerCard({ lang }: { lang: "en" | "rw" }) {
  const { worker, logout } = useAuth();
  const initials =
    worker?.full_name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") ?? "?";

  return (
    <div className="flex items-center gap-3 p-2 bg-white/50 rounded-2xl">
      <div className="size-9 shrink-0 bg-moss rounded-full flex items-center justify-center text-white text-xs font-bold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{worker?.full_name}</p>
        <p className="text-[10px] text-earth-deep/60 capitalize">
          {worker?.role.replace("_", " ")}
        </p>
      </div>
      <button
        onClick={() => logout()}
        title={t("nav_logout", lang)}
        aria-label={t("nav_logout", lang)}
        className="text-earth-deep/50 hover:text-signal-danger transition-colors"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [lang, setLang] = useLang();

  return (
    <div className="min-h-screen bg-sand-light text-earth-deep flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-earth-clay/10 bg-sand-dark/20">
        <span className="font-display font-semibold text-xl tracking-tight text-earth-clay">
          Heza
        </span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 flex flex-col gap-6 bg-sand-light">
            <SheetTitle className="font-display text-earth-clay">Heza</SheetTitle>
            <NavLinks pathname={pathname} lang={lang} />
            <div className="mt-auto space-y-3">
              <LangToggle lang={lang} setLang={setLang} />
              <WorkerCard lang={lang} />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex w-64 shrink-0 border-r border-earth-clay/10 bg-sand-dark/20 flex-col p-6 gap-8">
        <div className="flex flex-col items-start gap-1">
          <span className="font-display font-semibold text-2xl tracking-tight text-earth-clay">
            Heza
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-earth-deep/60">
            Kigali Care Hub
          </span>
        </div>

        <NavLinks pathname={pathname} lang={lang} />

        <div className="mt-auto pt-6 border-t border-earth-clay/10 space-y-3">
          <LangToggle lang={lang} setLang={setLang} />
          <WorkerCard lang={lang} />
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-6 md:p-10 lg:p-14 overflow-y-auto">{children}</main>
    </div>
  );
}

function LangToggle({
  lang,
  setLang,
}: {
  lang: "en" | "rw";
  setLang: (lang: "en" | "rw") => void;
}) {
  return (
    <button
      onClick={() => setLang(lang === "en" ? "rw" : "en")}
      className="flex items-center gap-2 text-xs font-semibold text-earth-deep/60 hover:text-earth-deep px-2"
    >
      <Globe className="size-3.5" />
      {lang === "en" ? "Kinyarwanda" : "English"}
    </button>
  );
}
