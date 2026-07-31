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

  return (
    <section aria-label="Operational impact" className="mb-5">
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
      <p className="mt-2 text-[11px] text-muted-foreground">
        Model, not a measurement: {AUTOFILLED_FIELDS} identity, coverage and
        order fields arrive structured per patient ({s.fields} today), costed at{" "}
        {SECONDS_PER_FIELD}s each for keying plus verbal verification.
      </p>
    </section>
  );
}
