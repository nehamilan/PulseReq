"use client";

import { useState } from "react";
import { ClockPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  variant = "button",
}: {
  req: Requisition;
  /** Inline variant for table cells: no top margin, "Request Extension" label. */
  compact?: boolean;
  /** Suppress the pending/approved/declined pill (shown elsewhere). */
  hidePill?: boolean;
  /** "pill" renders an amber pill trigger and nothing at all when ineligible. */
  variant?: "button" | "pill";
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
  } else if (!eligible) {
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

  if (variant === "pill" && disabled && !open) return null;

  const formBody = (
    <>
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
    </>
  );

  return (
    <div className={compact ? "inline-flex" : "mt-3"}>
      {resolvedNote}
      {variant === "pill" ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm text-xs font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ClockPlus className="size-3.5 shrink-0" aria-hidden />
              Request extension
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request more time</DialogTitle>
              <DialogDescription>
                {req.tests.map((t) => t.coding.display).join(" · ")} — LOINC{" "}
                {req.tests.map((t) => t.coding.code).join(" · ")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">{formBody}</div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Send request
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : open ? (
        <div className="mt-2 rounded-md border border-border bg-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            How much more time do you need?
          </p>
          {formBody}
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
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {disabled ? (
                <span
                  tabIndex={0}
                  className="inline-flex cursor-not-allowed select-none whitespace-nowrap rounded-md border border-input bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-80"
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
        </TooltipProvider>
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
  if (compact) {
    if (request.status === "pending") {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/35 bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
            <span className="size-1.5 rounded-full bg-current" />
            Extension requested
          </span>
          <span className="text-xs text-muted-foreground">
            +{request.requestedDays} days · awaiting clinician
          </span>
        </div>
      );
    }
    if (request.status === "approved") {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/35 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="size-1.5 rounded-full bg-current" />
            Extended
          </span>
          <span className="text-xs text-muted-foreground">
            until {formatClinicalDate(req.expiresAt)}
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/35 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          <span className="size-1.5 rounded-full bg-current" />
          Extension declined
        </span>
        <span className="text-xs text-muted-foreground">Contact the clinic</span>
      </div>
    );
  }
  if (request.status === "pending") {
    return (
      <p className={`${margin}inline-block rounded-full border border-warning/35 bg-warning/15 px-2.5 py-1 text-xs text-warning-foreground`}>
        Extension requested · +{request.requestedDays} days · awaiting clinician
      </p>
    );
  }
  if (request.status === "approved") {
    return (
      <p className={`${margin}inline-block rounded-full border border-success/35 bg-success/10 px-2.5 py-1 text-xs text-success`}>
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
