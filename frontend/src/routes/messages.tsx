import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { sms } from "@/lib/api";
import { t, useLang } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/messages")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <MessageLogPage />
      </AppShell>
    </RequireAuth>
  ),
});

function MessageLogPage() {
  const [lang] = useLang();
  const query = useQuery({ queryKey: ["sms-log"], queryFn: sms.log, refetchInterval: 5000 });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-2">
        {t("messages_title", lang)}
      </h1>
      <p className="text-sm text-earth-deep/60 mb-8">{t("messages_subtitle", lang)}</p>

      <Card className="border-earth-clay/10">
        <CardContent className="p-0">
          {query.isLoading ? (
            <p className="px-6 py-8 text-sm text-earth-deep/60">Loading…</p>
          ) : !query.data || query.data.length === 0 ? (
            <p className="px-6 py-8 text-sm text-earth-deep/60">{t("messages_empty", lang)}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("messages_to", lang)}</TableHead>
                  <TableHead>{t("messages_message", lang)}</TableHead>
                  <TableHead>{t("messages_sent_at", lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap font-medium">{entry.to}</TableCell>
                    <TableCell className="text-sm text-earth-deep/80">{entry.message}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-earth-deep/60">
                      {format(new Date(entry.sent_at), "d MMM yyyy, HH:mm:ss")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
