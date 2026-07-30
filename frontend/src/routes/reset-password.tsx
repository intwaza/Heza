import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { auth, ApiError } from "@/lib/api";
import { t, useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "min8"),
});

type FormValues = z.infer<typeof schema>;

function ResetPasswordPage() {
  const [lang] = useLang();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await auth.confirmPasswordReset(values.token, values.newPassword);
      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? String(err.detail) : "Could not reach the server.");
    }
  }

  return (
    <div className="min-h-screen bg-sand-light flex items-center justify-center p-6">
      <Card className="w-full max-w-sm border-earth-clay/10">
        <CardHeader className="text-center space-y-1">
          <span className="font-display font-semibold text-3xl tracking-tight text-earth-clay">
            Heza
          </span>
          <CardTitle className="text-lg">{t("reset_title", lang)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <>
              <Alert>
                <AlertDescription>{t("reset_success", lang)}</AlertDescription>
              </Alert>
              <Button asChild className="w-full bg-earth-deep hover:bg-earth-deep/90">
                <Link to="/login">{t("reset_back_to_login", lang)}</Link>
              </Button>
            </>
          ) : (
            <>
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="token">{t("reset_token", lang)}</Label>
                  <Input id="token" {...register("token")} />
                  {errors.token && (
                    <p className="text-xs font-medium text-destructive">
                      {t("validation_required", lang)}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">{t("reset_new_password", lang)}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register("newPassword")}
                  />
                  {errors.newPassword && (
                    <p className="text-xs font-medium text-destructive">
                      {lang === "en" ? "At least 8 characters." : "Byibura inyuguti 8."}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-earth-deep hover:bg-earth-deep/90"
                  disabled={isSubmitting}
                >
                  {t("reset_submit", lang)}
                </Button>
              </form>
              <p className="text-center text-xs text-earth-deep/60">
                <Link to="/login" className="underline hover:text-earth-deep">
                  {t("reset_back_to_login", lang)}
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
