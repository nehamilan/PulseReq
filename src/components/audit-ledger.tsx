import {
  AUDIT_LABEL,
  formatClinicalDateTime,
  type AuditEvent,
} from "@/lib/domain";

const ACTOR_LABEL: Record<string, string> = {
  "prac-1": "Dr. Sarah Jenkins",
  patient: "Patient (tokenized)",
  "lab-tech": "Lab technician · APL Chinook",
};

export function AuditLedger({ events }: { events: AuditEvent[] }) {
  return (
    <div>
      <ol className="space-y-2 font-mono text-[11px] leading-relaxed">
        {events.map((e) => (
          <li
            key={e.id}
            className="rounded-md border border-border bg-muted/30 px-3 py-2"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 text-foreground tabular">
              <span className="text-muted-foreground">
                [{formatClinicalDateTime(e.at)}]
              </span>
              <span className="font-semibold">{AUDIT_LABEL[e.action]}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground">{e.detail}</p>
            <p className="mt-0.5 text-muted-foreground">
              actor: {ACTOR_LABEL[e.actor] ?? e.actor}
            </p>
            <p className="mt-0.5 truncate text-muted-foreground/70">
              {e.prevHash.slice(0, 8)}… → sha256:{e.hash}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Identity verified at intake. PHI accessed under Alberta HIA s.35(1) —
        simulated audit entry; this prototype holds no real PHI and the hash
        chain is illustrative.
      </p>
    </div>
  );
}