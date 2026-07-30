import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";

import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PatientFormDialog } from "@/components/patients/PatientFormDialog";
import { dashboard, patients, type Appointment, type Patient } from "@/lib/api";
import { t, useLang, type StringKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </RequireAuth>
  ),
});

const CONDITION_KEY: Record<Patient["condition"], StringKey> = {
  hypertension: "condition_hypertension",
  type2_diabetes: "condition_type2_diabetes",
  hiv: "condition_hiv",
};

function DashboardPage() {
  const { worker } = useAuth();
  const [lang] = useLang();

  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: dashboard.get });
  const patientsQuery = useQuery({ queryKey: ["patients"], queryFn: patients.list });

  const patientById = new Map((patientsQuery.data ?? []).map((p) => [p.id, p]));

  const upcoming = dashboardQuery.data?.upcoming ?? [];
  const attended = dashboardQuery.data?.attended ?? [];
  const missed = dashboardQuery.data?.missed ?? [];

  const activePatientCount = (patientsQuery.data ?? []).filter((p) => p.status === "active").length;
  const todayCount = upcoming.filter((a) => isToday(new Date(a.scheduled_date))).length;
  const openFollowUps = missed.filter((a) => !a.follow_up_note).length;

  const isLoading = dashboardQuery.isLoading || patientsQuery.isLoading;

  return (
    <div>
      <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-10">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-earth-clay/80 mb-4">
            {format(new Date(), "EEEE · d MMMM yyyy")}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-normal tracking-tight mb-4">
            {t("dashboard_title", lang)}
          </h1>
          <p className="text-earth-clay/80 text-base md:text-lg font-medium leading-relaxed">
            Welcome back, {worker?.full_name}. Here's what needs your attention today.
          </p>
        </div>
        <PatientFormDialog
          trigger={
            <button className="self-start px-6 py-3 bg-earth-deep text-sand-light text-sm font-semibold rounded-full hover:bg-earth-deep/90 transition-all">
              {t("dashboard_add_patient", lang)}
            </button>
          }
        />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14" aria-label="Clinic vitals">
        <StatCard label="Active patients" value={activePatientCount} tone="text-moss/80" />
        <StatCard label="Today's schedule" value={todayCount} tone="text-earth-deep/70" />
        <StatCard label="Open follow-ups" value={openFollowUps} tone="text-signal-danger/80" />
      </section>

      {isLoading ? (
        <p className="text-sm text-earth-deep/60">Loading dashboard…</p>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AppointmentColumn
            title={t("dashboard_upcoming", lang)}
            dotClass="bg-earth-clay"
            appointments={upcoming}
            patientById={patientById}
            lang={lang}
          />
          <AppointmentColumn
            title={t("dashboard_attended", lang)}
            dotClass="bg-signal-ok"
            appointments={attended}
            patientById={patientById}
            lang={lang}
          />
          <AppointmentColumn
            title={t("dashboard_missed", lang)}
            dotClass="bg-signal-danger"
            appointments={missed}
            patientById={patientById}
            lang={lang}
          />
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-white/60 p-7 rounded-[2rem] border border-earth-clay/10">
      <p className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-5 ${tone}`}>{label}</p>
      <span className="text-5xl font-display">{value}</span>
    </div>
  );
}

function AppointmentColumn({
  title,
  dotClass,
  appointments,
  patientById,
  lang,
}: {
  title: string;
  dotClass: string;
  appointments: Appointment[];
  patientById: Map<number, Patient>;
  lang: "en" | "rw";
}) {
  return (
    <div className="bg-card rounded-[2rem] border border-earth-clay/10 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-earth-clay/10">
        <span className={`size-2.5 rounded-full ${dotClass}`} aria-hidden />
        <h2 className="font-display text-lg">{title}</h2>
        <span className="ml-auto text-xs font-bold text-earth-deep/50">{appointments.length}</span>
      </div>
      {appointments.length === 0 ? (
        <p className="px-6 py-8 text-sm text-earth-deep/50">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-earth-clay/5 max-h-[420px] overflow-y-auto">
          {appointments.map((appt) => {
            const patient = patientById.get(appt.patient_id);
            return (
              <li key={appt.id} className="px-6 py-4">
                <Link
                  to="/patients/$patientId"
                  params={{ patientId: String(appt.patient_id) }}
                  className="block"
                >
                  <p className="font-semibold text-sm hover:underline">
                    {patient?.full_name ?? `Patient #${appt.patient_id}`}
                  </p>
                  <p className="text-xs text-earth-deep/50">
                    {patient ? t(CONDITION_KEY[patient.condition], lang) : ""} ·{" "}
                    {format(new Date(appt.scheduled_date), "d MMM yyyy")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
