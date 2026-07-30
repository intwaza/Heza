import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth-context";
import type { WorkerRole } from "@/lib/api";

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: WorkerRole[] }) {
  const { worker, isLoading } = useAuth();
  const navigate = useNavigate();
  const allowed =
    !roles || (worker && (roles.includes(worker.role) || worker.role === "system_admin"));

  useEffect(() => {
    if (isLoading) return;
    if (!worker) {
      navigate({ to: "/login" });
      return;
    }
    if (!allowed) {
      navigate({ to: "/" });
    }
  }, [isLoading, worker, allowed, navigate]);

  if (isLoading || !worker || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-light text-earth-deep">
        <p className="text-sm text-earth-deep/60">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
