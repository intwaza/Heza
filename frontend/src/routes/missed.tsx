import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { differenceInCalendarDays, format } from "date-fns";

import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { FollowUpNoteForm } from "@/components/patients/FollowUpNoteForm";
import { appointments, dashboard, patients, ApiError, type Patient } from "@/lib/api";
import { t, useLang, type StringKey } from "@/lib/i18n";

export const Route = createFileRoute("/missed")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <MissedPage />
      </AppShell>
    </RequireAuth>
  ),
});

const CONDITION_KEY: Record<Patient["condition"], StringKey> = {
  hypertension: "condition_hypertension",
  type2_diabetes: "condition_type2_diabetes",
  hiv: "condition_hiv",
};

function MissedPage() {
  const [lang] = useLang();
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: dashboard.get });
  const patientsQuery = useQuery({ queryKey: ["patients"], queryFn: patients.list });

  const patientById = new Map((patientsQuery.data ?? []).map((p) => [p.id, p]));
  const all = dashboardQuery.data?.missed ?? [];
  const needsFollowUp = all
    .filter((a) => a.status === "missed")
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  const resolved = all.filter((a) => a.status === "followed_up");

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  }

  const attendMutation = useMutation({
    mutationFn: (appointmentId: number) => appointments.markAttended(appointmentId),
    onSuccess: () => {
      toast.success(lang === "en" ? "Marked attended." : "Byanditswe nk'uko yaje.");
      invalidateAll();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? String(err.detail) : "Something went wrong."),
  });

  const isLoading = dashboardQuery.isLoading || patientsQuery.isLoading;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-2">
        {t("missed_title", lang)}
      </h1>
      <p className="text-sm text-earth-deep/60 mb-8">
        {lang === "en"
          ? "Patients who didn't show up within 24 hours of their appointment."
          : "Abarwayi batageze mu masaha 24 nyuma y'igihe cyabo."}
      </p>

      {isLoading ? (
        <p className="text-sm text-earth-deep/60">Loading…</p>
      ) : needsFollowUp.length === 0 ? (
        <p className="text-sm text-earth-deep/60">
          {lang === "en" ? "No missed appointments right now." : "Nta gahunda yatakaye ubu."}
        </p>
      ) : (
        <ul className="space-y-4">
          {needsFollowUp.map((appt) => {
            const patient = patientById.get(appt.patient_id);
            const daysOverdue = differenceInCalendarDays(new Date(), new Date(appt.scheduled_date));
            return (
              <li key={appt.id} className="bg-card border border-earth-clay/10 rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      to="/patients/$patientId"
                      params={{ patientId: String(appt.patient_id) }}
                      className="font-semibold hover:underline"
                    >
                      {patient?.full_name ?? `Patient #${appt.patient_id}`}
                    </Link>
                    <p className="text-xs text-earth-deep/50">
                      {patient ? t(CONDITION_KEY[patient.condition], lang) : ""}{" "}
                      {patient ? `· ${patient.phone}` : ""} · Scheduled{" "}
                      {format(new Date(appt.scheduled_date), "d MMM yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-signal-danger/10 text-signal-danger border-signal-danger/20">
                      {daysOverdue} {t("missed_days_overdue", lang)}
                    </span>
                    <button
                      onClick={() => attendMutation.mutate(appt.id)}
                      disabled={attendMutation.isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-earth-clay/20 hover:bg-earth-clay/5"
                    >
                      {t("patients_mark_attended", lang)}
                    </button>
                  </div>
                </div>
                <FollowUpNoteForm appointmentId={appt.id} lang={lang} onSaved={invalidateAll} />
              </li>
            );
          })}
        </ul>
      )}

      {resolved.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl mb-4">
            {lang === "en" ? "Followed up" : "Byakurikiranywe"}
          </h2>
          <ul className="space-y-3">
            {resolved.map((appt) => {
              const patient = patientById.get(appt.patient_id);
              return (
                <li
                  key={appt.id}
                  className="bg-white/50 border border-earth-clay/10 rounded-2xl p-4"
                >
                  <p className="font-medium text-sm">
                    {patient?.full_name ?? `Patient #${appt.patient_id}`}
                  </p>
                  <p className="text-xs text-earth-deep/60 italic mt-1">"{appt.follow_up_note}"</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
