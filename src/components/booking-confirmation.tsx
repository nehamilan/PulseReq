import { Field, Panel } from "@/components/page-shell";
import {
  directionsUrl,
  formatClinicalDateTime,
  type DiagnosticCenter,
  type Requisition,
} from "@/lib/domain";

/** Deterministic 9x9 block matrix derived from the token — a mock check-in code. */
function matrixFor(token: string): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const cells: boolean[][] = [];
  for (let y = 0; y < 9; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 9; x++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      row.push(((h >>> 0) & 1) === 1);
    }
    cells.push(row);
  }
  // Finder-style corners so it reads as a code at a glance.
  const corners = [
    [0, 0],
    [0, 6],
    [6, 0],
  ];
  for (const [cy, cx] of corners) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        cells[cy + y][cx + x] = y === 0 || y === 2 || x === 0 || x === 2;
      }
    }
  }
  return cells;
}

function CheckInCode({ token }: { token: string }) {
  const cells = matrixFor(token);
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 11 11"
        role="img"
        aria-label={`Mock check-in code for ${token}`}
        className="size-40 rounded-md border border-border bg-card p-1"
      >
        {cells.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x + 1}
                y={y + 1}
                width={1}
                height={1}
                className="fill-foreground"
              />
            ) : null,
          ),
        )}
      </svg>
      <p className="mt-2 font-mono text-sm text-foreground tabular">{token}</p>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        Mock check-in code — not a scannable barcode
      </p>
    </div>
  );
}

export function BookingConfirmation({
  req,
  center,
  onChange,
  completed = false,
  onViewResults,
  readOnly = false,
}: {
  req: Requisition;
  center?: DiagnosticCenter;
  onChange?: () => void;
  completed?: boolean;
  onViewResults?: () => void;
  readOnly?: boolean;
}) {
  const prep = req.tests.filter((t) => t.instruction);

  if (completed || readOnly) {
    return (
      <Panel
        title={completed ? "Appointment completed" : "Appointment booked"}
        hint={completed ? "This visit is done" : "Read-only"}
      >
        <div className="rounded-md border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">
            {center?.name ?? "Diagnostic centre"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {center ? `${center.address}, ${center.city} ${center.province}` : "—"}
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground tabular">
            {req.appointmentAt
              ? formatClinicalDateTime(req.appointmentAt)
              : "Date not recorded"}
          </p>
        </div>

        <dl className="mt-4 grid gap-3">
          <Field
            label="Tests"
            value={req.tests.map((t) => t.coding.display).join(", ")}
          />
          <Field label="Reference" value={req.token} />
        </dl>

        {onViewResults ? (
          <button
            type="button"
            onClick={onViewResults}
            className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View results
          </button>
        ) : null}
      </Panel>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel title="Appointment confirmed" hint="Show this at check-in">
        <div className="rounded-md border border-success/25 bg-success/10 p-4">
          <p className="text-sm font-semibold text-foreground">
            {center?.name ?? "Diagnostic centre"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {center ? `${center.address}, ${center.city} ${center.province}` : "—"}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground tabular">
            {req.appointmentAt
              ? formatClinicalDateTime(req.appointmentAt)
              : "Time to be confirmed"}
          </p>
        </div>

        {prep.length > 0 ? (
          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Before you arrive
            </p>
            <ul className="mt-2 space-y-1.5">
              {prep.map((t) => (
                <li
                  key={t.id}
                  className="rounded border border-warning/35 bg-warning/15 px-2.5 py-1.5 text-xs text-warning-foreground"
                >
                  {t.coding.display}: {t.instruction}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {center ? (
            <a
              href={directionsUrl(center)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get directions
            </a>
          ) : null}
          <button
            type="button"
            onClick={onChange}
            className="inline-flex rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Change appointment
          </button>
        </div>
      </Panel>

      <Panel title="Check-in code">
        <CheckInCode token={req.token} />
        <dl className="mt-4 grid gap-3">
          <Field
            label="Tests"
            value={req.tests.map((t) => t.coding.display).join(", ")}
          />
          <Field
            label="Centre capabilities"
            value={center?.capabilities.join(", ") ?? "—"}
          />
        </dl>
      </Panel>
    </div>
  );
}
