import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PatientFormDialog } from "@/components/patients/PatientFormDialog";
import { patients, type Patient } from "@/lib/api";
import { t, useLang, type StringKey } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/patients/")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <PatientsPage />
      </AppShell>
    </RequireAuth>
  ),
});

const CONDITION_KEY: Record<Patient["condition"], StringKey> = {
  hypertension: "condition_hypertension",
  type2_diabetes: "condition_type2_diabetes",
  hiv: "condition_hiv",
};

const GENDER_KEY: Record<Patient["gender"], StringKey> = {
  male: "gender_male",
  female: "gender_female",
  other: "gender_other",
};

const STATUS_KEY: Record<Patient["status"], StringKey> = {
  active: "status_active",
  deactivated: "status_deactivated",
};

function PatientsPage() {
  const [lang] = useLang();
  const [search, setSearch] = useState("");
  const patientsQuery = useQuery({ queryKey: ["patients"], queryFn: patients.list });

  const filtered = (patientsQuery.data ?? []).filter((p) =>
    p.full_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div>
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          {t("patients_title", lang)}
        </h1>
        <PatientFormDialog
          trigger={
            <button className="self-start px-6 py-3 bg-earth-deep text-sand-light text-sm font-semibold rounded-full hover:bg-earth-deep/90 transition-all">
              {t("dashboard_add_patient", lang)}
            </button>
          }
        />
      </header>

      <Input
        placeholder={lang === "en" ? "Search by name…" : "Shakisha izina…"}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-6 bg-white"
      />

      <div className="bg-card rounded-[2rem] border border-earth-clay/10 overflow-hidden">
        {patientsQuery.isLoading ? (
          <p className="px-6 py-8 text-sm text-earth-deep/60">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-8 text-sm text-earth-deep/60">No patients found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("patients_full_name", lang)}</TableHead>
                <TableHead>{t("patients_condition", lang)}</TableHead>
                <TableHead>{t("patients_phone", lang)}</TableHead>
                <TableHead>{t("patients_status", lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      to="/patients/$patientId"
                      params={{ patientId: String(patient.id) }}
                      className="font-semibold hover:underline"
                    >
                      {patient.full_name}
                    </Link>
                    <p className="text-xs text-earth-deep/50">
                      {patient.age} · {t(GENDER_KEY[patient.gender], lang)}
                    </p>
                  </TableCell>
                  <TableCell>{t(CONDITION_KEY[patient.condition], lang)}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>
                    <Badge variant={patient.status === "active" ? "secondary" : "outline"}>
                      {t(STATUS_KEY[patient.status], lang)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
