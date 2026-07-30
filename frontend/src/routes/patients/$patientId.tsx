import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { FollowUpNoteForm } from "@/components/patients/FollowUpNoteForm";
import {
  appointments,
  patients,
  ApiError,
  type Appointment,
  type AppointmentStatus,
  type Condition,
  type Language,
} from "@/lib/api";
import { t, useLang, type StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/patients/$patientId")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <PatientDetailPage />
      </AppShell>
    </RequireAuth>
  ),
});

const CONDITION_KEY: Record<Condition, StringKey> = {
  hypertension: "condition_hypertension",
  type2_diabetes: "condition_type2_diabetes",
  hiv: "condition_hiv",
};

const APPT_STATUS_KEY: Record<AppointmentStatus, StringKey> = {
  upcoming: "appt_upcoming",
  attended: "appt_attended",
  missed: "appt_missed",
  followed_up: "appt_followed_up",
};

const APPT_STATUS_CLASS: Record<AppointmentStatus, string> = {
  upcoming: "bg-earth-clay/10 text-earth-clay border-earth-clay/20",
  attended: "bg-signal-ok/10 text-signal-ok border-signal-ok/20",
  missed: "bg-signal-danger/10 text-signal-danger border-signal-danger/20",
  followed_up: "bg-muted text-muted-foreground",
};

function PatientDetailPage() {
  const { patientId } = useParams({ from: "/patients/$patientId" });
  const id = Number(patientId);
  const [lang] = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["patient-history", id],
    queryFn: () => patients.history(id),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["patient-history", id] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const deactivateMutation = useMutation({
    mutationFn: () => patients.deactivate(id),
    onSuccess: () => {
      toast.success(lang === "en" ? "Patient deactivated." : "Umurwayi yahagaritswe.");
      invalidateAll();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? String(err.detail) : "Something went wrong."),
  });

  const attendMutation = useMutation({
    mutationFn: (appointmentId: number) => appointments.markAttended(appointmentId),
    onSuccess: () => {
      toast.success(lang === "en" ? "Marked attended." : "Byanditswe nk'uko yaje.");
      invalidateAll();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? String(err.detail) : "Something went wrong."),
  });

  if (historyQuery.isLoading) {
    return <p className="text-sm text-earth-deep/60">Loading…</p>;
  }

  if (!historyQuery.data) {
    return <p className="text-sm text-earth-deep/60">Patient not found.</p>;
  }

  const { patient, appointments: appointmentList, check_ins: checkIns } = historyQuery.data;

  return (
    <div className="max-w-5xl">
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-earth-deep/60 hover:text-earth-deep mb-6"
      >
        <ArrowLeft className="size-4" />
        {t("patients_title", lang)}
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">{patient.full_name}</h1>
          <p className="text-sm text-earth-deep/60 mt-1">
            {patient.age} ·{" "}
            {t(
              patient.gender === "male"
                ? "gender_male"
                : patient.gender === "female"
                  ? "gender_female"
                  : "gender_other",
              lang,
            )}{" "}
            · {t(CONDITION_KEY[patient.condition], lang)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={patient.status === "active" ? "secondary" : "outline"}>
            {t(patient.status === "active" ? "status_active" : "status_deactivated", lang)}
          </Badge>
          {patient.status === "active" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  {t("patients_deactivate", lang)}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("patients_deactivate", lang)}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("patients_deactivate_confirm", lang)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("patients_cancel", lang)}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deactivateMutation.mutate(undefined, {
                        onSuccess: () => navigate({ to: "/patients" }),
                      })
                    }
                  >
                    {t("patients_deactivate", lang)}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EditPatientCard
          patientId={id}
          phone={patient.phone}
          condition={patient.condition}
          language={patient.language}
          lang={lang}
          onSaved={invalidateAll}
        />

        <Card className="border-earth-clay/10">
          <CardHeader>
            <CardTitle className="font-display text-lg">{t("patients_checkins", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <p className="text-sm text-earth-deep/50">
                {lang === "en" ? "No check-ins yet." : "Nta kibazo cyabaye."}
              </p>
            ) : (
              <ul className="space-y-3 max-h-72 overflow-y-auto">
                {checkIns.map((checkIn) => (
                  <li
                    key={checkIn.id}
                    className="flex items-center justify-between text-sm border-b border-earth-clay/5 pb-2"
                  >
                    <span className="text-earth-deep/70">
                      {format(new Date(checkIn.sent_date), "d MMM yyyy")}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        checkIn.response === "Y" && "text-signal-ok",
                        checkIn.response === "N" && "text-signal-danger",
                        !checkIn.response && "text-earth-deep/50",
                      )}
                    >
                      {checkIn.response === "Y"
                        ? t("checkin_yes", lang)
                        : checkIn.response === "N"
                          ? t("checkin_no", lang)
                          : t("checkin_no_response", lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-earth-clay/10">
        <CardHeader>
          <CardTitle className="font-display text-lg">{t("patients_appointments", lang)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointmentList.length === 0 ? (
            <p className="text-sm text-earth-deep/50">
              {lang === "en" ? "No appointments yet." : "Nta gahunda irahari."}
            </p>
          ) : (
            appointmentList
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime(),
              )
              .map((appt) => (
                <AppointmentRow
                  key={appt.id}
                  appointment={appt}
                  lang={lang}
                  onMarkAttended={() => attendMutation.mutate(appt.id)}
                  markAttendedPending={attendMutation.isPending}
                  onFollowUpSaved={invalidateAll}
                />
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AppointmentRow({
  appointment,
  lang,
  onMarkAttended,
  markAttendedPending,
  onFollowUpSaved,
}: {
  appointment: Appointment;
  lang: "en" | "rw";
  onMarkAttended: () => void;
  markAttendedPending: boolean;
  onFollowUpSaved: () => void;
}) {
  const canMarkAttended = appointment.status === "upcoming" || appointment.status === "missed";
  const canAddNote = appointment.status === "missed";

  return (
    <div className="border border-earth-clay/10 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {format(new Date(appointment.scheduled_date), "d MMM yyyy, HH:mm")}
          </p>
          {appointment.attended_date && (
            <p className="text-xs text-earth-deep/50">
              {lang === "en" ? "Attended" : "Yaje"}:{" "}
              {format(new Date(appointment.attended_date), "d MMM yyyy")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border",
              APPT_STATUS_CLASS[appointment.status],
            )}
          >
            {t(APPT_STATUS_KEY[appointment.status], lang)}
          </span>
          {canMarkAttended && (
            <Button
              size="sm"
              variant="outline"
              disabled={markAttendedPending}
              onClick={onMarkAttended}
            >
              {t("patients_mark_attended", lang)}
            </Button>
          )}
        </div>
      </div>

      {appointment.follow_up_note && (
        <p className="mt-3 text-sm text-earth-deep/70 italic">"{appointment.follow_up_note}"</p>
      )}

      {canAddNote && !appointment.follow_up_note && (
        <FollowUpNoteForm appointmentId={appointment.id} lang={lang} onSaved={onFollowUpSaved} />
      )}
    </div>
  );
}

const editSchema = z.object({
  phone: z.string().min(8).max(20),
  condition: z.enum(["hypertension", "type2_diabetes", "hiv"]),
  language: z.enum(["en", "rw"]),
});

type EditFormValues = z.infer<typeof editSchema>;

function EditPatientCard({
  patientId,
  phone,
  condition,
  language,
  lang,
  onSaved,
}: {
  patientId: number;
  phone: string;
  condition: Condition;
  language: Language;
  lang: "en" | "rw";
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: { phone, condition, language },
  });

  async function onSubmit(values: EditFormValues) {
    try {
      await patients.update(patientId, values);
      toast.success(lang === "en" ? "Patient updated." : "Umurwayi yavuguruwe.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? String(err.detail) : "Something went wrong.");
    }
  }

  return (
    <Card className="border-earth-clay/10">
      <CardHeader>
        <CardTitle className="font-display text-lg">{t("patients_edit", lang)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("patients_phone", lang)}</Label>
            <Input {...register("phone")} />
            {errors.phone && (
              <p className="text-xs font-medium text-destructive">{t("validation_phone", lang)}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t("patients_condition", lang)}</Label>
            <Select
              value={watch("condition")}
              onValueChange={(value) => setValue("condition", value as Condition)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hypertension">{t("condition_hypertension", lang)}</SelectItem>
                <SelectItem value="type2_diabetes">
                  {t("condition_type2_diabetes", lang)}
                </SelectItem>
                <SelectItem value="hiv">{t("condition_hiv", lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("patients_language", lang)}</Label>
            <Select
              value={watch("language")}
              onValueChange={(value) => setValue("language", value as Language)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="rw">Kinyarwanda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-earth-deep hover:bg-earth-deep/90"
          >
            {t("patients_save", lang)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
