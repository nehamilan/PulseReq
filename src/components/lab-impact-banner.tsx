import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import {
  AUTOFILLED_FIELDS,
  SECONDS_PER_FIELD,
  savingsForQueue,
  type Requisition,
} from "@/lib/domain";

function Metric({
  label,
  value,
  unit,
  badge,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  badge?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold tabular ${accent ? "text-success" : "text-foreground"}`}
      >
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {badge ? (
        <span className="mt-2 inline-flex rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function LabImpactBanner({ queue }: { queue: Requisition[] }) {
  const s = savingsForQueue(queue);
  const [open, setOpen] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

  return (
    <section aria-label="Operational impact" className="mb-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="text-sm text-foreground">
          <span className="font-semibold">Impact today:</span>{" "}
          <span className="tabular">{s.minutesToday}</span> mins saved ·{" "}
          <span className="tabular">{s.patients}</span> patient
          {s.patients === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          {open ? "Hide details" : "Show details"}
          {open ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>

      {open ? (
        <div className="mt-3">
          <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Manual data re-keying"
          value="0"
          unit="mins"
          badge="100% pre-filled via FHIR"
          accent
        />
        <Metric
          label="Est. time saved / patient"
          value={s.minutesPerPatient.toFixed(1)}
          unit="mins"
        />
        <Metric
          label="Est. time saved today"
          value={String(s.minutesToday)}
          unit={`mins · ${s.patients} patient${s.patients === 1 ? "" : "s"}`}
        />
          </div>
          <button
            type="button"
            onClick={() => setShowMethod((v) => !v)}
            aria-expanded={showMethod}
            className="mt-2 text-[11px] text-muted-foreground underline underline-offset-2 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            How we calculate this
          </button>
          {showMethod ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Model, not a measurement: {AUTOFILLED_FIELDS} identity, coverage
              and order fields arrive structured per patient ({s.fields} today),
              costed at {SECONDS_PER_FIELD}s each for keying plus verbal
              verification.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
