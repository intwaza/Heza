// Typed client for the Heza FastAPI backend. One function per endpoint,
// all going through `request()` so auth headers and error handling live
// in one place.

export type WorkerRole = "nurse" | "facility_admin" | "system_admin";
export type Language = "en" | "rw";
export type Condition = "hypertension" | "type2_diabetes" | "hiv";
export type Gender = "male" | "female" | "other";
export type PatientStatus = "active" | "deactivated";
export type AppointmentStatus = "upcoming" | "attended" | "missed" | "followed_up";
export type CheckInResponse = "Y" | "N";
export type CheckInStatus = "sent" | "confirmed" | "not_confirmed" | "no_response";

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
};

export type CurrentWorker = {
  id: number;
  full_name: string;
  username: string;
  role: WorkerRole;
  facility_id: number;
  preferred_language: Language;
};

export type Patient = {
  id: number;
  facility_id: number;
  full_name: string;
  age: number;
  gender: Gender;
  phone: string;
  condition: Condition;
  language: Language;
  status: PatientStatus;
  created_at: string;
};

export type PatientCreateInput = {
  full_name: string;
  age: number;
  gender: Gender;
  phone: string;
  condition: Condition;
  language: Language;
  recurrence_days: number;
  first_appointment_date: string;
};

export type PatientUpdateInput = Partial<{
  phone: string;
  condition: Condition;
  language: Language;
}>;

export type Appointment = {
  id: number;
  patient_id: number;
  scheduled_date: string;
  recurrence_days: number;
  status: AppointmentStatus;
  attended_date: string | null;
  follow_up_note: string | null;
};

export type Dashboard = {
  upcoming: Appointment[];
  attended: Appointment[];
  missed: Appointment[];
};

export type AdherenceCheckIn = {
  id: number;
  patient_id: number;
  sent_date: string;
  status: CheckInStatus;
  response: CheckInResponse | null;
  response_date: string | null;
  consecutive_missed: number;
};

export type PatientHistory = {
  patient: Patient;
  appointments: Appointment[];
  check_ins: AdherenceCheckIn[];
};

export type FacilityReport = {
  facility_id: number;
  total_patients: number;
  total_appointments: number;
  attended_count: number;
  missed_count: number;
  attendance_rate: number;
};

export type PasswordResetToken = {
  reset_token: string;
  expires_in_minutes: number;
};

export type ApiErrorDetail = { en: string; rw: string } | string;

export class ApiError extends Error {
  status: number;
  detail: ApiErrorDetail;

  constructor(status: number, detail: ApiErrorDetail) {
    super(typeof detail === "string" ? detail : detail.en);
    this.status = status;
    this.detail = detail;
  }
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "heza.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  { skipAuth = false }: { skipAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!skipAuth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401 && !skipAuth) {
    clearToken();
    onUnauthorized?.();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail: ApiErrorDetail = body?.detail ?? "Something went wrong. Please try again.";
    throw new ApiError(response.status, detail);
  }

  return body as T;
}

export const auth = {
  login: (username: string, password: string) => {
    const form = new URLSearchParams();
    form.set("grant_type", "password");
    form.set("username", username);
    form.set("password", password);
    return request<TokenResponse>(
      "/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      },
      { skipAuth: true },
    );
  },
  me: () => request<CurrentWorker>("/auth/me"),
  initiatePasswordReset: (workerId: number) =>
    request<PasswordResetToken>(`/auth/password-reset/${workerId}`, { method: "POST" }),
  confirmPasswordReset: (token: string, newPassword: string) =>
    request<void>(
      "/auth/password-reset/confirm",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      },
      { skipAuth: true },
    ),
};

export const patients = {
  list: () => request<Patient[]>("/patients"),
  get: (id: number) => request<Patient>(`/patients/${id}`),
  create: (payload: PatientCreateInput) =>
    request<Patient>("/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: PatientUpdateInput) =>
    request<Patient>(`/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deactivate: (id: number) => request<Patient>(`/patients/${id}/deactivate`, { method: "POST" }),
  history: (id: number) => request<PatientHistory>(`/patients/${id}/history`),
};

export const appointments = {
  markAttended: (id: number) =>
    request<Appointment>(`/appointments/${id}/attend`, { method: "POST" }),
  addFollowUpNote: (id: number, note: string) =>
    request<Appointment>(`/appointments/${id}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    }),
};

export const dashboard = {
  get: () => request<Dashboard>("/dashboard"),
};

export const reports = {
  facility: (facilityId?: number) =>
    request<FacilityReport>(`/reports/facility${facilityId ? `?facility_id=${facilityId}` : ""}`),
};

export type SmsLogEntry = {
  id: string;
  to: string;
  message: string;
  sent_at: string;
};

export const sms = {
  log: () => request<SmsLogEntry[]>("/sms/log"),
};
