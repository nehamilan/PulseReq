import type { Requisition } from "@/lib/domain";

const STYLES: Record<Requisition["priority"], string> = {
  routine: "bg-muted text-muted-foreground border-border",
  urgent: "bg-warning/15 text-warning-foreground border-warning/40",
  stat: "bg-destructive/12 text-destructive border-destructive/40",
};

const LABEL: Record<Requisition["priority"], string> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
};

export function PriorityBadge({
  priority,
  routineHidden = false,
}: {
  priority: Requisition["priority"];
  routineHidden?: boolean;
}) {
  if (routineHidden && priority === "routine") return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLES[priority]}`}
    >
      {priority !== "routine" && (
        <span className="size-1.5 rounded-full bg-current" />
      )}
      {LABEL[priority]}
    </span>
  );
}
