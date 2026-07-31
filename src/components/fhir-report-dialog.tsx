import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Requisition } from "@/lib/domain";
import { toFhirResultBundle } from "@/lib/fhir";
import { fhirReportStatus, type DiagnosticReportRecord } from "@/lib/results";

export function FhirReportDialog({
  report,
  req,
  now,
  onClose,
}: {
  report: DiagnosticReportRecord | null;
  req?: Requisition;
  now: Date;
  onClose: () => void;
}) {
  if (!report || !req) return null;
  const json = JSON.stringify(toFhirResultBundle(report, req, now), null, 2);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>HL7 FHIR DiagnosticReport</DialogTitle>
          <DialogDescription>
            R4 Bundle · DiagnosticReport.status=
            {fhirReportStatus(report, now)} · result[] references{" "}
            {report.observations.length} Observation resource
            {report.observations.length === 1 ? "" : "s"} with LOINC codes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(json);
                toast.success("FHIR bundle copied");
              } catch {
                toast.error("Clipboard unavailable in this browser");
              }
            }}
            className="rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface"
          >
            Copy JSON
          </button>
        </div>
        <pre className="max-h-96 overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-[11px] leading-relaxed text-foreground">
          {json}
        </pre>
      </DialogContent>
    </Dialog>
  );
}