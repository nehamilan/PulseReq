import { STATUS_LABEL, type RequisitionStatus } from "@/lib/domain";

const STYLES: Record<RequisitionStatus, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  booked: "bg-success/10 text-success border-success/25",
  "checked-in": "bg-primary/15 text-primary border-primary/30",
  completed: "bg-muted text-muted-foreground border-border",
  revoked: "bg-destructive/10 text-destructive border-destructive/25",
  expired: "bg-warning/15 text-warning-foreground border-warning/35",
};

export function StatusBadge({ status }: { status: RequisitionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}