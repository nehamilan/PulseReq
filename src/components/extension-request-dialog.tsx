import { useState } from "react";
import { toast } from "sonner";

import {
  EXTENSION_DAY_OPTIONS,
  canRequestExtension,
  formatClinicalDate,
  type ExtensionRequest,
  type Requisition,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

/**
 * Patient-facing "request more time" control plus the outcome pill for a
 * request that is already pending, approved or declined.
 */
export function ExtensionRequestControl({
  req,
  compact = false,
  hidePill = false,
}: {
  req: Requisition;
  /** Inline variant for table cells: no top margin, "Request Extension" label. */
  compact?: boolean;
  /** Suppress the pending/approved/declined pill (shown elsewhere). */
  hidePill?: boolean;
}) {
  const { latestExtensionFor, requestExtension } = useRequisitions();
  const latest = latestExtensionFor(req.id);
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<7 | 14 | 21 | 28>(14);
  const [reason, setReason] = useState("");

  if (latest?.status === "pending") {
    return hidePill ? null : <ExtensionPill request={latest} req={req} compact={compact} />;
  }

  const resolvedNote =
    latest && !hidePill ? (
      <ExtensionPill request={latest} req={req} compact={compact} />
    ) : null;

  if (!canRequestExtension(req)) return resolvedNote;

  function submit() {
    requestExtension(req.id, days, reason);
    setOpen(false);
    setReason("");
    toast.success("Extension requested", {
      description: `Your clinician will review a ${days}-day extension.`,
    });
  }

  return (
    <div className={compact ? "" : "mt-3"}>
      {resolvedNote}
      {open ? (
        <div className="mt-2 rounded-md border border-border bg-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            How much more time do you need?
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXTENSION_DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  days === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent"
                }`}
              >
                +{d} days
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs text-muted-foreground">
            Reason (optional)
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={140}
              placeholder="Away for work, missed the window…"
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submit}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Send request
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex whitespace-nowrap rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          Request Extension
        </button>
      )}
    </div>
  );
}

export function ExtensionPill({
  request,
  req,
  compact = false,
}: {
  request: ExtensionRequest;
  req: Requisition;
  compact?: boolean;
}) {
  const margin = compact ? "" : "mt-3 ";
  if (request.status === "pending") {
    return (
      <p className={`${margin}inline-block rounded-full border border-warning/35 bg-warning/15 px-2.5 py-1 text-xs text-warning-foreground`}>
        Extension requested · +{request.requestedDays} days · awaiting clinician
      </p>
    );
  }
  if (request.status === "approved") {
    return (
      <p className={`${margin}inline-block rounded-full border border-success/35 bg-success/15 px-2.5 py-1 text-xs text-success`}>
        Extended to {formatClinicalDate(req.expiresAt)}
      </p>
    );
  }
  return (
    <p className={`${margin}inline-block rounded-full border border-destructive/35 bg-destructive/10 px-2.5 py-1 text-xs text-destructive`}>
      Extension declined — contact the clinic
    </p>
  );
}