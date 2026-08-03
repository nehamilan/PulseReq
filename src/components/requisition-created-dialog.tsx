import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Requisition } from "@/lib/domain";
import { toFhirBundle } from "@/lib/fhir";
import { useRequisitions } from "@/lib/requisition-store";

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Clipboard unavailable in this browser");
  }
}

export function RequisitionCreatedDialog({
  requisition,
  onClose,
}: {
  requisition: Requisition | null;
  onClose: () => void;
}) {
  const { getPatient, getPractitioner, getCenter } = useRequisitions();
  if (!requisition) return null;

  const patient = getPatient(requisition.patientId);
  const practitioner = getPractitioner(requisition.practitionerId);
  if (!patient || !practitioner) return null;

  const shareUrl = `https://pulsereq.ca/requisition/${requisition.token}`;
  const bundle = toFhirBundle({
    requisition,
    patient,
    practitioner,
    center: getCenter(requisition.centerId),
  });
  const json = JSON.stringify(bundle, null, 2);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Requisition issued</DialogTitle>
          <DialogDescription>
            Token{" "}
            <span className="font-mono tabular text-foreground">
              {requisition.token}
            </span>{" "}
            · valid {requisition.linkLifetimeDays} days · no paper copy required.
            <span className="mt-1 block text-xs text-muted-foreground">
              In production, the patient is notified automatically through their registered portal or email.
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="patient">
          <TabsList>
            <TabsTrigger value="patient">Patient copy</TabsTrigger>
            <TabsTrigger value="fhir">Inspect HL7 FHIR payload</TabsTrigger>
          </TabsList>

          <TabsContent value="patient" className="space-y-3 pt-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground tabular">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={() => copy(shareUrl, "Patient link copied")}
                className="shrink-0 rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Copy link to share manually
              </button>
            </div>
            <Link
              to="/r/$token"
              params={{ token: requisition.token }}
              onClick={onClose}
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              Preview patient view →
            </Link>
            <p className="text-[11px] text-muted-foreground">
              This is a clinician preview only. In production, the patient receives the link automatically through their registered portal or email.
            </p>
            <p className="text-[11px] text-muted-foreground">
              The pulsereq.ca domain is illustrative; in this prototype the link
              resolves locally at /r/{requisition.token}.
            </p>
          </TabsContent>

          <TabsContent value="fhir" className="space-y-2 pt-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] text-muted-foreground">
                FHIR R4 · Bundle (collection) · ServiceRequest.status=active ·
                intent=order · system=http://loinc.org
              </p>
              <button
                type="button"
                onClick={() => copy(json, "FHIR bundle copied")}
                className="shrink-0 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface"
              >
                Copy JSON
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-[11px] leading-relaxed text-foreground">
              {json}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}