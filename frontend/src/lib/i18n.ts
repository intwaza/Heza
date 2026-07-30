// Small EN/RW string dictionary for the health-worker interface. Not a
// full i18n framework - a lookup table is enough for the screens this app has.

import { useState } from "react";

export type Lang = "en" | "rw";

type Dict = Record<string, { en: string; rw: string }>;

export const strings = {
  nav_dashboard: { en: "Dashboard", rw: "Ikibaho" },
  nav_patients: { en: "Patients", rw: "Abarwayi" },
  nav_missed: { en: "Missed Appointments", rw: "Gahunda Zatakaye" },
  nav_messages: { en: "Message Log", rw: "Ubutumwa Bwoherejwe" },
  nav_reports: { en: "Reports", rw: "Raporo" },
  nav_logout: { en: "Log out", rw: "Sohoka" },

  login_title: { en: "Sign in to Heza", rw: "Injira muri Heza" },
  login_subtitle: {
    en: "Kigali Care Hub · health worker portal",
    rw: "Kigali Care Hub · urubuga rw'abakozi b'ubuzima",
  },
  login_username: { en: "Username", rw: "Izina ry'ukoresha" },
  login_password: { en: "Password", rw: "Ijambo banga" },
  login_submit: { en: "Sign in", rw: "Injira" },
  login_submitting: { en: "Signing in…", rw: "Kwinjira…" },
  login_forgot: { en: "Have a reset token?", rw: "Ufite kode yo guhindura ijambo banga?" },
  login_error_invalid: {
    en: "Incorrect username or password.",
    rw: "Izina cyangwa ijambo banga si byo.",
  },

  reset_title: { en: "Reset your password", rw: "Hindura ijambo banga" },
  reset_token: { en: "Reset token", rw: "Kode yo guhindura" },
  reset_new_password: { en: "New password", rw: "Ijambo banga rishya" },
  reset_submit: { en: "Set new password", rw: "Emeza ijambo banga rishya" },
  reset_success: {
    en: "Password updated. You can sign in now.",
    rw: "Ijambo banga ryahinduwe. Ushobora kwinjira.",
  },
  reset_back_to_login: { en: "Back to sign in", rw: "Garuka ku kwinjira" },

  validation_required: { en: "This field is required.", rw: "Aha hasabwa kuzuzwa." },
  validation_phone: {
    en: "Enter a valid phone number, e.g. +250788123456.",
    rw: "Andika nimero ya telefone yemewe, urugero +250788123456.",
  },
  validation_age: {
    en: "Age must be between 0 and 120.",
    rw: "Imyaka igomba kuba hagati ya 0 na 120.",
  },
  validation_name: { en: "Enter at least 2 characters.", rw: "Andika byibura inyuguti 2." },

  session_expired: {
    en: "You were logged out after 15 minutes of inactivity.",
    rw: "Wasohotse nyuma y'iminota 15 udakoze ikintu.",
  },

  dashboard_title: { en: "Clinic Vitals", rw: "Imimerere y'Ivuriro" },
  dashboard_upcoming: { en: "Upcoming", rw: "Bizaza" },
  dashboard_attended: { en: "Attended", rw: "Baraje" },
  dashboard_missed: { en: "Missed", rw: "Batarahagera" },
  dashboard_add_patient: { en: "Add New Patient", rw: "Ongeraho Umurwayi" },

  patients_title: { en: "Patients", rw: "Abarwayi" },
  patients_full_name: { en: "Full name", rw: "Amazina yombi" },
  patients_age: { en: "Age", rw: "Imyaka" },
  patients_gender: { en: "Gender", rw: "Igitsina" },
  patients_phone: { en: "Phone number", rw: "Nimero ya telefone" },
  patients_condition: { en: "Condition", rw: "Indwara" },
  patients_language: { en: "SMS language", rw: "Ururimi rw'ubutumwa" },
  patients_recurrence: { en: "Follow-up frequency", rw: "Igihe cyo kongera kuza" },
  patients_first_appointment: { en: "First appointment date", rw: "Itariki y'igihe cya mbere" },
  patients_status: { en: "Status", rw: "Uko bimeze" },
  patients_register: { en: "Register patient", rw: "Andika umurwayi" },
  patients_registering: { en: "Registering…", rw: "Kwandika…" },
  patients_cancel: { en: "Cancel", rw: "Reka" },
  patients_deactivate: { en: "Deactivate patient", rw: "Hagarika umurwayi" },
  patients_deactivate_confirm: {
    en: "This patient will no longer receive reminders or appear as active. This can't be undone from here.",
    rw: "Uyu murwayi ntazongera kubona ubutumwa cyangwa kugaragara nk'ukora. Ibi ntibishobora gusubizwa hano.",
  },
  patients_edit: { en: "Edit patient", rw: "Hindura umurwayi" },
  patients_save: { en: "Save changes", rw: "Bika impinduka" },
  patients_history: { en: "History", rw: "Amateka" },
  patients_appointments: { en: "Appointments", rw: "Gahunda" },
  patients_checkins: { en: "Adherence check-ins", rw: "Ibibazo by'imiti" },
  patients_mark_attended: { en: "Mark attended", rw: "Yaje" },
  patients_add_note: { en: "Add follow-up note", rw: "Ongeraho inyandiko" },
  patients_note_placeholder: {
    en: "e.g. called patient, will return Thursday",
    rw: "urugero: nahamagaye umurwayi, azagaruka ku wa kane",
  },

  missed_title: { en: "Missed Appointments", rw: "Gahunda Zatakaye" },
  missed_days_overdue: { en: "days overdue", rw: "iminsi irenze" },

  reports_title: { en: "Facility Report", rw: "Raporo y'Ivuriro" },
  reports_total_patients: { en: "Total patients", rw: "Abarwayi bose" },
  reports_total_appointments: { en: "Total appointments", rw: "Gahunda zose" },
  reports_attendance_rate: { en: "Attendance rate", rw: "Igipimo cy'ubwitabire" },
  reports_reset_title: { en: "Reset a worker's password", rw: "Hindurira umukozi ijambo banga" },
  reports_worker_id: { en: "Worker ID", rw: "Nimero y'umukozi" },
  reports_generate_token: { en: "Generate reset token", rw: "Kora kode yo guhindura" },
  reports_token_result: {
    en: "Share this token with the worker (expires in {minutes} minutes):",
    rw: "Saba iyi kode umukozi (izarangira mu minota {minutes}):",
  },

  messages_title: { en: "Message Log", rw: "Ubutumwa Bwoherejwe" },
  messages_subtitle: {
    en: "SMS delivery is simulated for this pilot. This is exactly what would have been sent, and to whom.",
    rw: "Kohereza SMS ni ikigeragezo muri iki gikorwa. Iki ni ubutumwa bwari kwohererezwa, n'uwo bwoherezwaga.",
  },
  messages_to: { en: "To", rw: "Kuri" },
  messages_message: { en: "Message", rw: "Ubutumwa" },
  messages_sent_at: { en: "Sent at", rw: "Byoherejwe" },
  messages_empty: {
    en: "No messages sent yet. Reminders and check-ins will show up here as they go out.",
    rw: "Nta butumwa bwoherejwe. Kwibutsa n'ibindi bizagaragara hano.",
  },

  condition_hypertension: { en: "Hypertension", rw: "Umuvuduko w'amaraso" },
  condition_type2_diabetes: { en: "Type 2 Diabetes", rw: "Diyabete yo mu bwoko bwa 2" },
  condition_hiv: { en: "HIV (ART)", rw: "Virusi itera SIDA (ART)" },

  gender_male: { en: "Male", rw: "Gabo" },
  gender_female: { en: "Female", rw: "Gore" },
  gender_other: { en: "Other", rw: "Ikindi" },

  status_active: { en: "Active", rw: "Arakora" },
  status_deactivated: { en: "Deactivated", rw: "Yahagaritswe" },

  appt_upcoming: { en: "Upcoming", rw: "Bizaza" },
  appt_attended: { en: "Attended", rw: "Yaje" },
  appt_missed: { en: "Missed", rw: "Ntiyaje" },
  appt_followed_up: { en: "Followed up", rw: "Byakurikiranywe" },

  checkin_yes: { en: "Took medication", rw: "Yanyoye imiti" },
  checkin_no: { en: "Missed medication", rw: "Ntiyanyoye imiti" },
  checkin_no_response: { en: "No response", rw: "Nta gisubizo" },
} satisfies Dict;

export type StringKey = keyof typeof strings;

export function t(
  key: StringKey,
  lang: Lang = "en",
  vars?: Record<string, string | number>,
): string {
  let text = strings[key][lang];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}

const LANG_KEY = "heza.lang";

export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (window.localStorage.getItem(LANG_KEY) as Lang | null) ?? "en";
}

export function setStoredLang(lang: Lang): void {
  window.localStorage.setItem(LANG_KEY, lang);
}

export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(getStoredLang());
  const setLang = (next: Lang) => {
    setStoredLang(next);
    setLangState(next);
  };
  return [lang, setLang];
}
