import {
  accessionFor,
  formatClinicalDate,
  patientName,
  type Patient,
  type Requisition,
  type SpecimenLabel as SpecimenLabelData,
} from "@/lib/domain";

/** Deterministic 1D barcode stripes derived from a string. */
function stripes(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Array.from({ length: 44 }, () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 3) + 1;
  });
}

function Barcode({ value }: { value: string }) {
  const bars = stripes(value);
  const total = bars.reduce((a, b) => a + b, 0);
  let x = 0;
  return (
    <svg
      viewBox={`0 0 ${total} 12`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Mock barcode for ${value}`}
      className="h-8 w-full"
    >
      {bars.map((w, i) => {
        const rect =
          i % 2 === 0 ? (
            <rect key={i} x={x} y={0} width={w} height={12} fill="currentColor" />
          ) : null;
        x += w;
        return rect;
      })}
    </svg>
  );
}

export function SpecimenLabelCard({
  label,
  req,
  patient,
}: {
  label: SpecimenLabelData;
  req: Requisition;
  patient: Patient;
}) {
  const accession = accessionFor(req);
  return (
    <div className="rounded-md border border-border bg-card p-3 text-foreground">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{patientName(patient)}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground`}
        >
          <span className={`size-2 rounded-full border ${label.tube.swatch}`} />
          {label.tube.code}
        </span>
      </div>
      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular">
        PHN {patient.phn} · DOB {formatClinicalDate(patient.birthDate)}
      </p>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground tabular">
        {accession} · {formatClinicalDate(new Date().toISOString())}
      </p>
      <div className="mt-2 text-foreground">
        <Barcode value={`${accession}-${label.tube.code}`} />
      </div>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
        {label.tests.map((t) => t.coding.code).join(" · ")}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {label.tube.name}
      </p>
    </div>
  );
}