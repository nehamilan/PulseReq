import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell, Panel } from "@/components/page-shell";
import { ExtensionRequestControl } from "@/components/extension-request-dialog";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  effectiveStatus,
  expiryLabel,
  formatClinicalDate,
  formatClinicalDateTime,
  handoffDetail,
  patientName,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";
import { isVisibleToPatient } from "@/lib/results";

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
  const { getPatient, findByPatientId, reportFor, now } = useRequisitions();
  const patient = getPatient(patientId);
  const requisitions = findByPatientId(patientId);

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
          <ul className="divide-y divide-border">
            {requisitions.map((req) => {
              const status = effectiveStatus(req);
              const testNames = req.tests.map((t) => t.coding.display).join(" · ");
              const report = reportFor(req.id);
              const resultsVisible = report
                ? isVisibleToPatient(report, now())
                : false;
              // Expiry only blocks booking — a published report stays reachable.
              const showResults = Boolean(report) && status !== "revoked";
              return (
                <li key={req.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{testNames}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground tabular">
                        LOINC {req.tests.map((t) => t.coding.code).join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={status} />
                      <PriorityBadge priority={req.priority} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular">Issued {formatClinicalDate(req.issuedAt)}</span>
                    <span className="tabular">{expiryLabel(req)}</span>
                    {req.status === "booked" && req.appointmentAt ? (
                      <span className="tabular text-success">
                        Appointment {formatClinicalDateTime(req.appointmentAt)}
                      </span>
                    ) : null}
                    {req.status === "completed" ? (
                      <span className="text-success">{handoffDetail(req.tests)}</span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      to="/r/$token"
                      params={{ token: req.token }}
                      className="inline-flex rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Open requisition
                    </Link>
                    {showResults && resultsVisible ? (
                      <Link
                        to="/r/$token"
                        params={{ token: req.token }}
                        search={{ tab: "results" }}
                        className="inline-flex rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-sm font-medium text-success transition-colors hover:bg-success/20"
                      >
                        View results
                      </Link>
                    ) : null}
                    {showResults && !resultsVisible && report ? (
                      <span className="inline-flex flex-col">
                        <button
                          type="button"
                          disabled
                          className="inline-flex cursor-not-allowed rounded-md border border-warning/40 bg-warning/10 px-3 py-1.5 text-sm font-medium text-warning-foreground opacity-80"
                        >
                          View results
                        </button>
                        <span className="mt-1 text-[11px] text-muted-foreground">
                          {report.policy === "EMBARGO_DELAY" && report.embargoLiftsAt
                            ? `Available ${formatClinicalDate(report.embargoLiftsAt)}`
                            : "Pending clinician release"}
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <ExtensionRequestControl req={req} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </PageShell>
  );
}
