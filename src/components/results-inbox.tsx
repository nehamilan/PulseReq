import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FhirReportDialog } from "@/components/fhir-report-dialog";
import { Panel } from "@/components/page-shell";
import {
  InterpretationBadge,
  PolicyChip,
  ReleaseStateChip,
} from "@/components/result-chips";
import { Button } from "@/components/ui/button";
import { formatClinicalDateTime, patientName } from "@/lib/domain";
import { abnormalCount, isVisibleToPatient } from "@/lib/results";
import { useRequisitions } from "@/lib/requisition-store";

export function ResultsInbox() {
  const {
    reports,
    requisitions,
    getPatient,
    releaseResults,
    now,
    logAudit,
  } = useRequisitions();
  const clock = now();
  const [inspectId, setInspectId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return reports
      .map((report) => ({
        report,
        req: requisitions.find((r) => r.id === report.requisitionId),
      }))
      .filter((row) => row.req)
      .sort((a, b) => {
        const abn = abnormalCount(b.report) - abnormalCount(a.report);
        if (abn !== 0) return abn;
        return (
          new Date(b.report.publishedAt).getTime() -
          new Date(a.report.publishedAt).getTime()
        );
      });
  }, [reports, requisitions]);

  const inspect = rows.find((r) => r.report.id === inspectId);
  const pending = rows.filter((r) => r.report.status !== "released").length;

  return (
    <Panel
      title="Results review inbox"
      hint={
        rows.length === 0
          ? "no results yet"
          : `${rows.length} report${rows.length === 1 ? "" : "s"} · ${pending} awaiting release`
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No results have been published yet. The diagnostic centre publishes
          them from the Lab Tech Dashboard once intake is complete.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map(({ report, req }) => {
            const patient = getPatient(req!.patientId);
            const visible = isVisibleToPatient(report, clock);
            const abnormal = abnormalCount(report);
            return (
              <li key={report.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {patient ? patientName(patient) : "Unknown patient"}
                      <span className="ml-2 font-mono text-xs font-normal text-muted-foreground tabular">
                        PHN {patient?.phn}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {req!.tests.map((t) => t.coding.display).join(" · ")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular">
                      Published {formatClinicalDateTime(report.publishedAt)} ·{" "}
                      {report.observations.length} observation
                      {report.observations.length === 1 ? "" : "s"}
                      {abnormal > 0 ? ` · ${abnormal} out of range` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ReleaseStateChip report={report} now={clock} />
                    <PolicyChip report={report} />
                  </div>
                </div>

                {report.observations.length > 0 ? (
                  <ul className="mt-3 divide-y divide-border rounded-md border border-border">
                    {report.observations.map((o) => (
                      <li
                        key={o.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">{o.display}</p>
                          <p className="font-mono text-[11px] text-muted-foreground tabular">
                            LOINC {o.code} · ref {o.refLow}–{o.refHigh} {o.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-foreground tabular">
                            {o.value} {o.unit}
                          </span>
                          <InterpretationBadge interpretation={o.interpretation} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {report.narrative ? (
                  <p className="mt-3 whitespace-pre-line rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {report.narrative}
                  </p>
                ) : null}

                <p className="mt-2 text-[11px] text-muted-foreground">
                  {report.rationale}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {report.status === "released" ? (
                    <Button variant="outline" size="sm" disabled>
                      {report.releasedBy === "policy:auto"
                        ? "Released automatically · routine panel"
                        : "Released to patient"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        releaseResults(report.requisitionId, "prac-1");
                        toast.success("Signed off & released to patient", {
                          description: visible
                            ? "Embargo had already lapsed — release confirmed."
                            : "The report is now visible in the patient portal.",
                        });
                      }}
                    >
                      {visible
                        ? "Confirm release"
                        : "Sign off & release to patient"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logAudit(
                        report.requisitionId,
                        "result.viewed",
                        "prac-1",
                        "Clinician inspected raw FHIR DiagnosticReport",
                      );
                      setInspectId(report.id);
                    }}
                  >
                    Inspect FHIR DiagnosticReport
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <FhirReportDialog
        report={inspect?.report ?? null}
        req={inspect?.req}
        now={clock}
        onClose={() => setInspectId(null)}
      />
    </Panel>
  );
}