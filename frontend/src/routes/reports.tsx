import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { auth, reports, ApiError } from "@/lib/api";
import { t, useLang } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/reports")({
  component: () => (
    <RequireAuth roles={["facility_admin"]}>
      <AppShell>
        <ReportsPage />
      </AppShell>
    </RequireAuth>
  ),
});

function ReportsPage() {
  const [lang] = useLang();
  const reportQuery = useQuery({
    queryKey: ["reports", "facility"],
    queryFn: () => reports.facility(),
  });

  const data = reportQuery.data;
  const chartData = data
    ? [
        { name: t("appt_attended", lang), count: data.attended_count },
        { name: t("appt_missed", lang), count: data.missed_count },
      ]
    : [];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-8">
        {t("reports_title", lang)}
      </h1>

      {reportQuery.isLoading ? (
        <p className="text-sm text-earth-deep/60">Loading…</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard label={t("reports_total_patients", lang)} value={data.total_patients} />
            <StatCard
              label={t("reports_total_appointments", lang)}
              value={data.total_appointments}
            />
            <StatCard
              label={t("reports_attendance_rate", lang)}
              value={`${Math.round(data.attendance_rate * 100)}%`}
            />
          </div>

          <Card className="border-earth-clay/10 mb-8">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                {t("appt_attended", lang)} vs {t("appt_missed", lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.58 0.13 40 / 0.12)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="oklch(0.58 0.13 40)"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : null}

      <AdminPasswordReset lang={lang} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white/60 p-6 rounded-[1.5rem] border border-earth-clay/10">
      <p className="text-[11px] uppercase tracking-[0.2em] font-bold mb-3 text-earth-deep/60">
        {label}
      </p>
      <span className="text-4xl font-display">{value}</span>
    </div>
  );
}

function AdminPasswordReset({ lang }: { lang: "en" | "rw" }) {
  const [workerId, setWorkerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => auth.initiatePasswordReset(Number(workerId)),
    onSuccess: () => setError(null),
    onError: (err) =>
      setError(err instanceof ApiError ? String(err.detail) : "Something went wrong."),
  });

  return (
    <Card className="border-earth-clay/10">
      <CardHeader>
        <CardTitle className="font-display text-lg">{t("reports_reset_title", lang)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="workerId">{t("reports_worker_id", lang)}</Label>
            <Input
              id="workerId"
              type="number"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-32"
            />
          </div>
          <Button
            disabled={!workerId || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="bg-earth-deep hover:bg-earth-deep/90"
          >
            {t("reports_generate_token", lang)}
          </Button>
        </div>
        {mutation.data && (
          <Alert>
            <AlertDescription>
              {t("reports_token_result", lang, { minutes: mutation.data.expires_in_minutes })}
              <br />
              <code className="text-sm font-mono break-all">{mutation.data.reset_token}</code>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
