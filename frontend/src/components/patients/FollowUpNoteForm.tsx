import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { appointments, ApiError } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function FollowUpNoteForm({
  appointmentId,
  lang,
  onSaved,
}: {
  appointmentId: number;
  lang: Lang;
  onSaved: () => void;
}) {
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: () => appointments.addFollowUpNote(appointmentId, note),
    onSuccess: () => {
      toast.success(lang === "en" ? "Follow-up note saved." : "Inyandiko yabitswe.");
      onSaved();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? String(err.detail) : "Something went wrong."),
  });

  return (
    <div className="mt-3 flex flex-col sm:flex-row gap-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("patients_note_placeholder", lang)}
        className="text-sm"
        rows={2}
      />
      <Button
        size="sm"
        className="self-end sm:self-auto bg-earth-deep hover:bg-earth-deep/90"
        disabled={!note.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {t("patients_add_note", lang)}
      </Button>
    </div>
  );
}
