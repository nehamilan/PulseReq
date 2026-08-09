import { AlertTriangle, OctagonAlert } from "lucide-react";

import type { Requisition } from "@/lib/domain";

const STYLES: Record<Requisition["priority"], string> = {
  routine: "bg-transparent text-muted-foreground border-border font-semibold",
  urgent: "bg-transparent text-warning-foreground border-warning font-semibold",
  stat: "bg-destructive text-destructive-foreground border-destructive font-bold",
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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${STYLES[priority]}`}
    >
      {priority === "urgent" && (
        <AlertTriangle className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
      )}
      {priority === "stat" && (
        <OctagonAlert className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
      )}
      {LABEL[priority]}
    </span>
  );
}
