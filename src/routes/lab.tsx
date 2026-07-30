import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Panel, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { effectiveStatus, patientName } from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Lab Tech Dashboard — PulseReq" },
      {
        name: "description",
        content:
          "Look up a requisition token at intake and see the structured order queue for the diagnostic centre.",
      },
      { property: "og:title", content: "Lab Tech Dashboard — PulseReq" },
      {
        property: "og:description",
        content:
          "Look up a requisition token at intake and see the structured order queue.",
      },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const { requisitions, getPatient, getCenter, findByToken } =
    useRequisitions();
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const match = trimmed ? findByToken(trimmed) : undefined;
  const matchPatient = match ? getPatient(match.patientId) : undefined;

  return (
    <PageShell
      eyebrow="Role · Diagnostic centre"
      title="Lab Tech Dashboard"
      description="Scan or type the patient's requisition token to pull the structured order — no handwriting, no faxed forms, no re-keying."
    >
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel title="Intake lookup" hint="Try req-8f92a1">
          <label
            htmlFor="token"
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Requisition token
          </label>
          <input
            id="token"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="req-xxxxxx"
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground tabular outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />

          <div className="mt-4 text-sm">
            {!trimmed ? (
              <p className="text-muted-foreground">
                Enter a token to resolve the order.
              </p>
            ) : match && matchPatient ? (
              <div className="rounded-md border border-success/25 bg-success/10 p-3">
                <p className="font-medium text-foreground">
                  {patientName(matchPatient)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular">
                  PHN {matchPatient.phn} · {match.tests.length} test
                  {match.tests.length === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-destructive">
                No requisition matches that token.
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Order queue" hint={`${requisitions.length} requisitions`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Token</th>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Tests</th>
                  <th className="pb-2 font-medium">Centre</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requisitions.map((req) => {
                  const patient = getPatient(req.patientId);
                  const center = getCenter(req.centerId);
                  return (
                    <tr key={req.id}>
                      <td className="py-3 font-mono text-xs text-foreground tabular">
                        {req.token}
                      </td>
                      <td className="py-3 text-foreground">
                        {patient ? patientName(patient) : "—"}
                        <span className="block text-xs text-muted-foreground tabular">
                          {patient?.phn}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground tabular">
                        {req.tests.map((t) => t.coding.code).join(", ")}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {center?.name ?? "Unassigned"}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={effectiveStatus(req)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}