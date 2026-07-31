import {
  INTERPRETATION_LABEL,
  POLICY_LABEL,
  embargoLapsed,
  isVisibleToPatient,
  type DiagnosticReportRecord,
  type Interpretation,
} from "@/lib/results";
import { formatClinicalDate } from "@/lib/domain";

const INTERPRETATION_STYLE: Record<Interpretation, string> = {
  N: "border-success/25 bg-success/10 text-success",
  H: "border-destructive/25 bg-destructive/10 text-destructive",
  L: "border-warning/35 bg-warning/15 text-warning-foreground",
};

export function InterpretationBadge({
  interpretation,
}: {
  interpretation: Interpretation;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${INTERPRETATION_STYLE[interpretation]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {INTERPRETATION_LABEL[interpretation]}
    </span>
  );
}

/** Where the report currently sits in the release pipeline. */
export function ReleaseStateChip({
  report,
  now,
}: {
  report: DiagnosticReportRecord;
  now: Date;
}) {
  const visible = isVisibleToPatient(report, now);
  const text = visible
    ? report.status === "released" && report.releasedBy === "policy:auto"
      ? "Auto-released to patient"
      : embargoLapsed(report, now) && report.status !== "released"
        ? "Embargo lapsed · visible to patient"
        : "Released to patient"
    : report.policy === "EMBARGO_DELAY"
      ? `Embargoed until ${report.embargoLiftsAt ? formatClinicalDate(report.embargoLiftsAt) : "review"}`
      : "Held for clinician review";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        visible
          ? "border-success/25 bg-success/10 text-success"
          : "border-warning/35 bg-warning/15 text-warning-foreground"
      }`}
    >
      {text}
    </span>
  );
}

export function PolicyChip({ report }: { report: DiagnosticReportRecord }) {
  return (
    <span className="inline-flex rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
      {POLICY_LABEL[report.policy]}
    </span>
  );
}