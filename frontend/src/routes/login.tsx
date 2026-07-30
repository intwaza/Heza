import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { t, useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const { worker, isLoading, login, logoutMessage, clearLogoutMessage } = useAuth();
  const navigate = useNavigate();
  const [lang] = useLang();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!isLoading && worker) {
      navigate({ to: "/" });
    }
  }, [isLoading, worker, navigate]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values.username, values.password);
      navigate({ to: "/" });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(t("login_error_invalid", lang));
      } else {
        setServerError("Could not reach the server. Is the backend running?");
      }
    }
  }

  return (
    <div className="min-h-screen bg-sand-light flex items-center justify-center p-6">
      <Card className="w-full max-w-sm border-earth-clay/10">
        <CardHeader className="text-center space-y-1">
          <span className="font-display font-semibold text-3xl tracking-tight text-earth-clay">
            Heza
          </span>
          <CardTitle className="text-lg">{t("login_title", lang)}</CardTitle>
          <CardDescription>{t("login_subtitle", lang)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoutMessage && (
            <Alert>
              <AlertDescription>{logoutMessage}</AlertDescription>
            </Alert>
          )}
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            onFocus={() => logoutMessage && clearLogoutMessage()}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="username">{t("login_username", lang)}</Label>
              <Input id="username" autoComplete="username" {...register("username")} />
              {errors.username && (
                <p className="text-xs font-medium text-destructive">
                  {t("validation_required", lang)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("login_password", lang)}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs font-medium text-destructive">
                  {t("validation_required", lang)}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-earth-deep hover:bg-earth-deep/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("login_submitting", lang) : t("login_submit", lang)}
            </Button>
          </form>

          <p className="text-center text-xs text-earth-deep/60">
            <Link to="/reset-password" className="underline hover:text-earth-deep">
              {t("login_forgot", lang)}
            </Link>
          </p>

          <div className="pt-2 border-t border-earth-clay/10 text-center text-[11px] text-earth-deep/50">
            Demo: nurse.uwase / admin.mugisha · password Heza2026!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
