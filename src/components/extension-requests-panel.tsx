import { toast } from "sonner";

import { Panel } from "@/components/page-shell";
import {
  formatClinicalDate,
  patientName,
  waitingLabel,
  isExpired,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

/** Clinician queue of patient-initiated link-extension requests. */
export function ExtensionRequestsPanel() {
  const {
    pendingExtensions,
    requisitions,
    getPatient,
    approveExtension,
    declineExtension,
  } = useRequisitions();
  const pending = pendingExtensions();

  if (pending.length === 0) return null;

  return (
    <Panel
      title="Extension requests"
      hint={`${pending.length} awaiting review`}
    >
      <ul className="divide-y divide-border">
        {pending.map((ext) => {
          const req = requisitions.find((r) => r.id === ext.requisitionId);
          const patient = req ? getPatient(req.patientId) : undefined;
          return (
            <li
              key={ext.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {patient ? patientName(patient) : "Unknown patient"}
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground tabular">
                    {req?.token}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular">
                  Requested +{ext.requestedDays} days ·{" "}
                  {req
                    ? `${isExpired(req) ? "expired" : "expires"} ${formatClinicalDate(req.expiresAt)}`
                    : "—"}{" "}
                  · {waitingLabel(ext.requestedAt)}
                </p>
                {ext.reason ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    “{ext.reason}”
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    approveExtension(ext.id);
                    toast.success("Extension approved", {
                      description: `Link extended by ${ext.requestedDays} days.`,
                    });
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    declineExtension(ext.id);
                    toast("Extension declined");
                  }}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                >
                  Decline
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}