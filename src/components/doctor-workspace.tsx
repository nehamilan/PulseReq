import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";

import { FhirReportDialog } from "@/components/fhir-report-dialog";
import { Panel } from "@/components/page-shell";
import {
  InterpretationBadge,
  PolicyChip,
  ReleaseStateChip,
} from "@/components/result-chips";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import {
  STATUS_LABEL,
  effectiveStatus,
  formatClinicalDate,
  formatClinicalDateTime,
  isExpired,
  patientName,
  waitingLabel,
  type Requisition,
  type RequisitionStatus,
} from "@/lib/domain";
import {
  abnormalCount,
  isVisibleToPatient,
  type DiagnosticReportRecord,
} from "@/lib/results";
import { useRequisitions } from "@/lib/requisition-store";

type TabId = "attention" | "log";

/** Doctor Portal right-hand workspace: actionable queue + issued log. */
export function DoctorWorkspace() {
  const { requisitions, pendingExtensions, reports } = useRequisitions();
  const search = useSearch({ from: "/order" });
  const navigate = useNavigate({ from: "/order" });
  const tab: TabId = search.tab === "log" ? "log" : "attention";
  const setTab = (next: TabId) =>
    navigate({
      search: { tab: next === "log" ? ("log" as const) : undefined },
      replace: true,
    });
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    attention: null,
    log: null,
  });

  const attentionCount =
    pendingExtensions().length +
    reports.filter((r) => r.status !== "released").length;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "attention", label: "Needs attention", count: attentionCount },
    { id: "log", label: "Issued log", count: requisitions.length },
  ];

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === tab);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Doctor portal views"
        onKeyDown={onKeyDown}
        className="flex gap-2"
      >
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {t.label}
              <span className="ml-2 font-mono text-xs tabular opacity-70">
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "attention" ? (
        <div role="tabpanel" id="panel-attention" aria-labelledby="tab-attention">
          <NeedsAttention />
        </div>
      ) : (
        <div role="tabpanel" id="panel-log" aria-labelledby="tab-log">
          <IssuedLog />
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Tab 1 -------------------------------- */

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
  );
}

function NeedsAttention() {
  const {
    requisitions,
    reports,
    getPatient,
    pendingExtensions,
    approveExtension,
    declineExtension,
    releaseResults,
    logAudit,
    now,
  } = useRequisitions();
  const clock = now();
  const [inspectId, setInspectId] = useState<string | null>(null);

  const pending = useMemo(() => {
    return pendingExtensions()
      .map((ext) => ({
        ext,
        req: requisitions.find((r) => r.id === ext.requisitionId),
      }))
      .sort((a, b) => {
        const ax = a.req ? new Date(a.req.expiresAt).getTime() : Infinity;
        const bx = b.req ? new Date(b.req.expiresAt).getTime() : Infinity;
        return ax - bx;
      });
  }, [pendingExtensions, requisitions]);

  const rows = useMemo(() => {
    return reports
      .map((report) => ({
        report,
        req: requisitions.find((r) => r.id === report.requisitionId),
      }))
      .filter((row) => row.req)
      .sort((a, b) => {
        const at =
          new Date(a.report.embargoLiftsAt ?? a.report.publishedAt).getTime();
        const bt =
          new Date(b.report.embargoLiftsAt ?? b.report.publishedAt).getTime();
        return at - bt;
      });
  }, [reports, requisitions]);

  const open = rows.filter((r) => r.report.status !== "released");
  const resolved = rows.filter((r) => r.report.status === "released");
  const inspect = rows.find((r) => r.report.id === inspectId);

  return (
    <Panel
      title="Needs attention"
      hint={`${pending.length} extension${pending.length === 1 ? "" : "s"} · ${open.length} awaiting release`}
    >
      <div className="space-y-6">
        <section>
          <SubHeading>Extension requests</SubHeading>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No extension requests awaiting review.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {pending.map(({ ext, req }) => {
                const patient = req ? getPatient(req.patientId) : undefined;
                return (
                  <li
                    key={ext.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {patient ? patientName(patient) : "Unknown patient"}
                        <span className="ml-2 font-mono text-xs font-normal text-muted-foreground tabular">
                          {req?.token}
                        </span>
                        {req ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground tabular">
                            · {isExpired(req) ? "expired" : "expires"}{" "}
                            {formatClinicalDate(req.expiresAt)}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground tabular">
                        +{ext.requestedDays} days · {waitingLabel(ext.requestedAt)}
                        {ext.reason ? ` · “${ext.reason}”` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          approveExtension(ext.id);
                          toast.success("Extension approved", {
                            description: `Link extended by ${ext.requestedDays} days.`,
                          });
                        }}
                        className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          declineExtension(ext.id);
                          toast("Extension declined");
                        }}
                        className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <SubHeading>Results review inbox</SubHeading>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No results have been published yet. The diagnostic centre publishes
              them from the Lab Tech Dashboard once intake is complete.
            </p>
          ) : (
            <>
              {open.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing awaiting sign-off.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {open.map(({ report, req }) => {
                    const patient = getPatient(req!.patientId);
                    return (
                      <ReportRow
                        key={report.id}
                        report={report}
                        req={req!}
                        patientLabel={
                          patient ? patientName(patient) : "Unknown patient"
                        }
                        clock={clock}
                        onInspect={() => {
                          logAudit(
                            report.requisitionId,
                            "result.viewed",
                            "prac-1",
                            "Clinician inspected raw FHIR DiagnosticReport",
                          );
                          setInspectId(report.id);
                        }}
                        onRelease={() => {
                          const visible = isVisibleToPatient(report, clock);
                          releaseResults(report.requisitionId, "prac-1");
                          toast.success("Signed off & released to patient", {
                            description: visible
                              ? "Embargo had already lapsed — release confirmed."
                              : "The report is now visible in the patient portal.",
                          });
                        }}
                      />
                    );
                  })}
                </ul>
              )}

              {resolved.length > 0 ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Released results · {resolved.length}
                  </summary>
                  <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                    {resolved.map(({ report, req }) => {
                      const patient = getPatient(req!.patientId);
                      return (
                        <ReportRow
                          key={report.id}
                          report={report}
                          req={req!}
                          patientLabel={
                            patient ? patientName(patient) : "Unknown patient"
                          }
                          clock={clock}
                          onInspect={() => {
                            logAudit(
                              report.requisitionId,
                              "result.viewed",
                              "prac-1",
                              "Clinician inspected raw FHIR DiagnosticReport",
                            );
                            setInspectId(report.id);
                          }}
                        />
                      );
                    })}
                  </ul>
                </details>
              ) : null}
            </>
          )}
        </section>
      </div>

      <FhirReportDialog
        report={inspect?.report ?? null}
        req={inspect?.req}
        now={clock}
        onClose={() => setInspectId(null)}
      />
    </Panel>
  );
}

/** One report row in the results inbox — same body for open and released. */
function ReportRow({
  report,
  req,
  patientLabel,
  clock,
  onInspect,
  onRelease,
}: {
  report: DiagnosticReportRecord;
  req: Requisition;
  patientLabel: string;
  clock: Date;
  onInspect: () => void;
  onRelease?: () => void;
}) {
  const visible = isVisibleToPatient(report, clock);
  const abnormal = abnormalCount(report);
  const released = report.status === "released";

  return (
    <li className="px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {patientLabel}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {req.tests.map((t) => t.coding.display).join(" · ")}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular">
            Published {formatClinicalDateTime(report.publishedAt)}
            {released && report.releasedAt
              ? ` · released ${formatClinicalDateTime(report.releasedAt)}`
              : ""}{" "}
            · {report.observations.length} observation
            {report.observations.length === 1 ? "" : "s"}
            {abnormal > 0 ? ` · ${abnormal} out of range` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ReleaseStateChip report={report} now={clock} />
          <PolicyChip report={report} />
        </div>
      </div>

      {report.observations.length > 0 || report.narrative ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
            View observations
          </summary>
          {report.observations.length > 0 ? (
            <ul className="mt-2 divide-y divide-border rounded-md border border-border">
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
            <p className="mt-2 whitespace-pre-line rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {report.narrative}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {report.rationale}
          </p>
        </details>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2">
        {onRelease ? (
          <button
            type="button"
            onClick={onRelease}
            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {visible ? "Confirm release" : "Sign off & release"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onInspect}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          Inspect FHIR DiagnosticReport
        </button>
      </div>
    </li>
  );
}

/* ------------------------------- Tab 2 -------------------------------- */

const FILTERS: RequisitionStatus[] = [
  "active",
  "booked",
  "checked-in",
  "completed",
  "expired",
  "revoked",
];

function IssuedLog() {
  const { requisitions, getPatient } = useRequisitions();
  const [filter, setFilter] = useState<RequisitionStatus | "all">("all");
  const [query, setQuery] = useState("");

  const decorated = useMemo(
    () =>
      requisitions.map((req) => ({
        req,
        patient: getPatient(req.patientId),
        status: effectiveStatus(req),
      })),
    [requisitions, getPatient],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of decorated) map[row.status] = (map[row.status] ?? 0) + 1;
    return map;
  }, [decorated]);

  const q = query.trim().toLowerCase();
  const rows = decorated.filter((row) => {
    if (filter !== "all" && row.status !== filter) return false;
    if (!q) return true;
    const haystack = [
      row.patient ? patientName(row.patient) : "",
      row.patient?.phn ?? "",
      row.req.token,
      ...row.req.tests.map((t) => t.coding.display),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <Panel title="Issued requisitions" hint={`${requisitions.length} total`}>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          label="All"
          count={decorated.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {FILTERS.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABEL[s]}
            count={counts[s] ?? 0}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search patient or test"
        aria-label="Search patient or test"
        className="mt-3 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
      />

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No requisitions match this filter.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {["Patient", "Test", "Status", "Issued", ""].map((h) => (
                  <th
                    key={h}
                    className="py-2 pr-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ req, patient, status }) => (
                <tr key={req.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 align-top">
                    <p className="text-sm font-medium text-foreground">
                      {patient ? patientName(patient) : "Unknown patient"}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground tabular">
                      PHN {patient?.phn}
                    </p>
                  </td>
                  <td className="py-2 pr-3 align-top text-xs text-muted-foreground">
                    {req.tests.map((t) => t.coding.display).join(" · ")}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={status} />
                      <PriorityBadge priority={req.priority} routineHidden />
                    </div>
                  </td>
                  <td className="py-2 pr-3 align-top text-xs text-muted-foreground tabular">
                    {formatClinicalDate(req.issuedAt)}
                  </td>
                  <td className="py-2 align-top">
                    <Link
                      to="/r/$token"
                      params={{ token: req.token }}
                      search={{ from: "doctor", fromTab: "log" }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-input bg-background text-muted-foreground hover:bg-accent"
      }`}
    >
      {label} <span className="tabular opacity-70">{count}</span>
    </button>
  );
}
