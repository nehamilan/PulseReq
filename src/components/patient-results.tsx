import { useEffect, useRef, useState } from "react";

import { Panel } from "@/components/page-shell";
import { InterpretationBadge } from "@/components/result-chips";
import { formatClinicalDate, type Requisition } from "@/lib/domain";
import { isVisibleToPatient } from "@/lib/results";
import { toFhirResultBundle } from "@/lib/fhir";
import { useRequisitions } from "@/lib/requisition-store";

export function PatientResults({ req }: { req: Requisition }) {
  const { reportFor, now, logAudit } = useRequisitions();
  const report = reportFor(req.id);
  const clock = now();
  const [raw, setRaw] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const logged = useRef(false);

  const visible = report ? isVisibleToPatient(report, clock) : false;

  useEffect(() => {
    if (!report || !visible || logged.current) return;
    logged.current = true;
    logAudit(
      req.id,
      "result.viewed",
      "patient",
      "Patient opened released DiagnosticReport in portal",
    );
  }, [report, visible, req.id, logAudit]);

  if (!report) return null;

  if (!visible) {
    return (
      <div className="mt-5">
        <Panel title="My diagnostic results" hint="pending release">
          <div className="rounded-md border border-warning/35 bg-warning/10 p-3">
            <p className="text-sm font-medium text-warning-foreground">
              {report.policy === "EMBARGO_DELAY" && report.embargoLiftsAt
                ? `Available ${formatClinicalDate(report.embargoLiftsAt)} unless your clinician releases it sooner`
                : "Results received by clinic — pending physician review"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {report.rationale}
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  const json = JSON.stringify(toFhirResultBundle(report, req, clock), null, 2);

  return (
    <div className="mt-5">
      <Panel
        title="My diagnostic results"
        hint={`Released ${formatClinicalDate(report.releasedAt ?? report.embargoLiftsAt ?? report.publishedAt)}`}
      >
        <div
          role="tablist"
          aria-label="Result view"
          className="mb-4 inline-flex rounded-md border border-border p-0.5"
        >
          {[
            { id: false, label: "Patient view" },
            { id: true, label: "Inspect raw FHIR DiagnosticReport" },
          ].map((t) => (
            <button
              key={String(t.id)}
              role="tab"
              aria-selected={raw === t.id}
              onClick={() => setRaw(t.id)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                raw === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {raw ? (
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {json}
          </pre>
        ) : (
          <>
            {report.observations.length > 0 ? (
              <ul className="divide-y divide-border rounded-md border border-border">
                {report.observations.map((o) => (
                  <li key={o.id} className="px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {o.display}
                      </p>
                      <InterpretationBadge interpretation={o.interpretation} />
                    </div>
                    <p className="mt-1 text-sm text-foreground tabular">
                      <span className="font-mono text-base font-semibold">
                        {o.value}
                      </span>{" "}
                      {o.unit}
                      <span className="ml-2 text-xs text-muted-foreground">
                        normal range {o.refLow}–{o.refHigh} {o.unit}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === o.id ? null : o.id)}
                      aria-expanded={openId === o.id}
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      {openId === o.id ? "Hide" : "What does this measure?"}
                    </button>
                    {openId === o.id ? (
                      <p className="mt-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                        {o.explainer}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {report.narrative ? (
              <p className="mt-3 whitespace-pre-line rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                {report.narrative}
              </p>
            ) : null}

            <p className="mt-3 text-xs text-muted-foreground">
              These values are not a diagnosis. Discuss them with your clinician
              before acting on anything you see here.
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}