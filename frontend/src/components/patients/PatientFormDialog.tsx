import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { patients, ApiError, type Condition, type Gender, type Language } from "@/lib/api";
import { t, useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  full_name: z.string().min(2).max(150),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(8).max(20),
  condition: z.enum(["hypertension", "type2_diabetes", "hiv"]),
  language: z.enum(["en", "rw"]),
  recurrence_days: z.coerce.number().refine((value): boolean => value === 30 || value === 90),
  first_appointment_date: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function PatientFormDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [lang] = useLang();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      language: "en",
      recurrence_days: 30,
      gender: "female",
      condition: "hypertension",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await patients.create({
        ...values,
        first_appointment_date: new Date(values.first_appointment_date).toISOString(),
      });
      toast.success(lang === "en" ? "Patient registered." : "Umurwayi yanditswe.");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      reset();
      setOpen(false);
    } catch (err) {
      setServerError(err instanceof ApiError ? String(err.detail) : "Could not reach the server.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setServerError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("patients_register", lang)}</DialogTitle>
        </DialogHeader>
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>{t("patients_full_name", lang)}</Label>
              <Input {...register("full_name")} />
              {errors.full_name && <FieldError text={t("validation_name", lang)} />}
            </div>
            <div className="space-y-1.5">
              <Label>{t("patients_age", lang)}</Label>
              <Input type="number" {...register("age")} />
              {errors.age && <FieldError text={t("validation_age", lang)} />}
            </div>
            <div className="space-y-1.5">
              <Label>{t("patients_gender", lang)}</Label>
              <Select
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value as Gender)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">{t("gender_female", lang)}</SelectItem>
                  <SelectItem value="male">{t("gender_male", lang)}</SelectItem>
                  <SelectItem value="other">{t("gender_other", lang)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t("patients_phone", lang)}</Label>
              <Input placeholder="+250788123456" {...register("phone")} />
              {errors.phone && <FieldError text={t("validation_phone", lang)} />}
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
            <div className="space-y-1.5">
              <Label>{t("patients_recurrence", lang)}</Label>
              <Select
                value={String(watch("recurrence_days"))}
                onValueChange={(value) => setValue("recurrence_days", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t("patients_first_appointment", lang)}</Label>
              <Input type="datetime-local" {...register("first_appointment_date")} />
              {errors.first_appointment_date && (
                <FieldError text={t("validation_required", lang)} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("patients_cancel", lang)}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-earth-deep hover:bg-earth-deep/90"
            >
              {isSubmitting ? t("patients_registering", lang) : t("patients_register", lang)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ text }: { text: string }) {
  return <p className="text-xs font-medium text-destructive">{text}</p>;
}
