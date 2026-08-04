import { useState } from "react";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EXTENSION_DAY_OPTIONS,
  canRequestExtension,
  formatClinicalDate,
  hoursRemaining,
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
  const { latestExtensionFor, requestExtension, now } = useRequisitions();
  const latest = latestExtensionFor(req.id);
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<7 | 14 | 21 | 28>(14);
  const [reason, setReason] = useState("");

  const pending = latest?.status === "pending";
  const eligible = canRequestExtension(req, now());
  const disabled = pending || !eligible;

  const resolvedNote =
    latest && !hidePill ? (
      <ExtensionPill request={latest} req={req} compact={compact} />
    ) : null;

  let tooltip = "";
  if (pending) {
    tooltip = "An extension request is already pending review.";
  } else if (req.status !== "active") {
    tooltip = "Extensions are not available for this order.";
  } else if (hoursRemaining(req, now()) > 48) {
    tooltip = "Available once your requisition is within 48 hours of expiry.";
  }

  function submit() {
    requestExtension(req.id, days, reason);
    setOpen(false);
    setReason("");
    toast.success("Extension requested", {
      description: `Your clinician will review a ${days}-day extension.`,
    });
  }

  return (
    <div className={compact ? "inline-flex" : "mt-3"}>
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
        <Tooltip>
          <TooltipTrigger asChild>
            {disabled ? (
              <span
                tabIndex={0}
                className="inline-flex cursor-not-allowed select-none whitespace-nowrap rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground opacity-60"
              >
                Request Extension
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex whitespace-nowrap rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                Request Extension
              </button>
            )}
          </TooltipTrigger>
          {disabled && tooltip ? (
            <TooltipContent
              side={compact ? "top" : "bottom"}
              sideOffset={4}
              className="max-w-xs"
            >
              <p>{tooltip}</p>
            </TooltipContent>
          ) : null}
        </Tooltip>
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