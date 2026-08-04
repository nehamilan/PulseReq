import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell, Panel } from "@/components/page-shell";
import {
  ExtensionPill,
  ExtensionRequestControl,
} from "@/components/extension-request-dialog";
import { PriorityBadge } from "@/components/priority-badge";
import { SortHeader, type SortState } from "@/components/sort-header";
import { StatusBadge } from "@/components/status-badge";
import {
  STATUS_LABEL,
  effectiveStatus,
  expiryLabel,
  formatClinicalDate,
  patientName,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";
import { isVisibleToPatient } from "@/lib/results";

type SortKey = "status" | "issued" | "expiry";

export const Route = createFileRoute("/p/$patientId")({
  head: () => ({
    meta: [
      { title: "Your requisitions — PulseReq" },
      {
        name: "description",
        content:
          "Review all your open diagnostic requisitions and open each one to book or view the appointment details.",
      },
      { property: "og:title", content: "Your requisitions — PulseReq" },
      {
        property: "og:description",
        content:
          "All your diagnostic requisitions in one place. Open a requisition to book an appointment or view the check-in code.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PatientPortal,
});

function PatientPortal() {
  const { patientId } = Route.useParams();
  const { getPatient, findByPatientId, reportFor, now, latestExtensionFor } =
    useRequisitions();
  const patient = getPatient(patientId);
  const requisitions = findByPatientId(patientId);
  const [sort, setSort] = useState<SortState<SortKey>>(null);

  const rows = useMemo(() => {
    const list = [...requisitions];
    if (!sort) return list;
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      switch (sort.key) {
        case "status":
          return (
            dir *
            STATUS_LABEL[effectiveStatus(a)].localeCompare(
              STATUS_LABEL[effectiveStatus(b)],
            )
          );
        case "issued":
          return (
            dir *
            (new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime())
          );
        case "expiry":
          return (
            dir *
            (new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
          );
        default:
          return 0;
      }
    });
  }, [requisitions, sort]);

  if (!patient) {
    return (
      <PageShell
        eyebrow="Role · Patient"
        title="Patient not found"
        description="We couldn't find a patient with that identifier. Check the link or ask your clinic to reissue it."
      >
        <Panel title="Link reference">
          <p className="font-mono text-sm text-muted-foreground tabular">{patientId}</p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Role · Patient"
      title={patientName(patient)}
      description="All your requisitions in one place. Open one to book an appointment or view the check-in code."
    >
      <Panel title="Requisitions" hint={`${requisitions.length} order${requisitions.length === 1 ? "" : "s"}`}>
        {requisitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No requisitions have been issued for this patient yet.
          </p>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Test
                  </th>
                  <SortHeader label="Status" sortKey="status" sort={sort} onSort={setSort} />
                  <SortHeader label="Issued" sortKey="issued" sort={sort} onSort={setSort} />
                  <SortHeader
                    label="Expired status"
                    sortKey="expiry"
                    sort={sort}
                    onSort={setSort}
                  />
                  <th className="py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((req) => {
                  const status = effectiveStatus(req);
                  const testNames = req.tests
                    .map((t) => t.coding.display)
                    .join(" · ");
                  const report = reportFor(req.id);
                  const resultsVisible = report
                    ? isVisibleToPatient(report, now())
                    : false;
                  // Expiry only blocks booking — a published report stays reachable.
                  const showResults = Boolean(report) && status !== "revoked";
                  const extension = latestExtensionFor(req.id);
                  return (
                    <tr key={req.id} className="align-top">
                      <td className="py-3 pr-3">
                        <p className="text-sm font-medium text-foreground">
                          {testNames}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground tabular">
                          LOINC {req.tests.map((t) => t.coding.code).join(" · ")}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={status} />
                          <PriorityBadge priority={req.priority} />
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground tabular">
                        {formatClinicalDate(req.issuedAt)}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="text-xs text-muted-foreground tabular">
                          {expiryLabel(req)}
                        </p>
                        {extension ? (
                          <div className="mt-1">
                            <ExtensionPill request={extension} req={req} compact />
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to="/r/$token"
                            params={{ token: req.token }}
                            className="inline-flex whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            Open
                          </Link>
                          {showResults && resultsVisible ? (
                            <Link
                              to="/r/$token"
                              params={{ token: req.token }}
                              search={{ tab: "results" }}
                              className="inline-flex whitespace-nowrap rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20"
                            >
                              View results
                            </Link>
                          ) : null}
                          {showResults && !resultsVisible && report ? (
                            <span className="inline-flex flex-col items-end">
                              <button
                                type="button"
                                disabled
                                className="inline-flex cursor-not-allowed whitespace-nowrap rounded-md border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning-foreground opacity-80"
                              >
                                View results
                              </button>
                              <span className="mt-1 text-[11px] text-muted-foreground">
                                {report.policy === "EMBARGO_DELAY" &&
                                report.embargoLiftsAt
                                  ? `Available ${formatClinicalDate(report.embargoLiftsAt)}`
                                  : "Pending clinician release"}
                              </span>
                            </span>
                          ) : null}
                          <ExtensionRequestControl req={req} compact hidePill />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
