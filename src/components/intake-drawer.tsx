import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { AuditLedger } from "@/components/audit-ledger";
import { Field } from "@/components/page-shell";
import { PriorityBadge } from "@/components/priority-badge";
import { SpecimenLabelCard } from "@/components/specimen-label";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FHIR_STATUS,
  accessionFor,
  effectiveStatus,
  formatAddress,
  formatClinicalDateTime,
  formatDob,
  handoffDetail,
  labelsForTests,
  patientName,
  type Requisition,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
  );
}

export function IntakeDrawer({
  req,
  onOpenChange,
}: {
  req?: Requisition;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    getPatient,
    getPractitioner,
    getCenter,
    auditFor,
    logAudit,
    checkInPatient,
    completeIntake,
  } = useRequisitions();
  const loggedFor = useRef<string | null>(null);

  // One PHI-access entry per drawer open.
  useEffect(() => {
    if (!req) {
      loggedFor.current = null;
      return;
    }
    if (loggedFor.current === req.id) return;
    loggedFor.current = req.id;
    logAudit(
      req.id,
      "intake.read",
      "lab-tech",
      `Tokenized read via /r/${req.token} · identity verified · Alberta HIA s.35(1)`,
    );
  }, [req, logAudit]);

  const patient = req ? getPatient(req.patientId) : undefined;
  const practitioner = req ? getPractitioner(req.practitionerId) : undefined;
  const center = req ? getCenter(req.centerId) : undefined;
  const status = req ? effectiveStatus(req) : undefined;
  const labels = req ? labelsForTests(req.tests) : [];
  const events = req ? auditFor(req.id) : [];
  const imagingOnly = req
    ? req.tests.length > 0 && req.tests.every((t) => t.modality === "imaging")
    : false;

  return (
    <Sheet open={Boolean(req)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl print-drawer"
      >
        {req && patient ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {patientName(patient)}
                <PriorityBadge priority={req.priority} routineHidden />
                {status ? <StatusBadge status={status} /> : null}
              </SheetTitle>
              <SheetDescription>
                LIS intake sheet · pre-filled from the FHIR ServiceRequest. No
                field was keyed by hand.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-6 no-print">
              <section>
                <SectionTitle>Patient identity</SectionTitle>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Health number" value={patient.phn} />
                  <Field label="Date of birth" value={formatDob(patient.birthDate)} />
                  <Field label="Phone" value={patient.phone} />
                  <Field label="Accession" value={accessionFor(req)} />
                  <div className="col-span-2">
                    <Field label="Address" value={formatAddress(patient.address)} />
                  </div>
                </dl>
              </section>

              <section>
                <SectionTitle>Order</SectionTitle>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Ordering clinician" value={practitioner?.name ?? "—"} />
                  <Field label="Licence" value={practitioner?.licence ?? "—"} />
                  <Field label="Centre" value={center?.name ?? "Unassigned"} />
                  <Field
                    label="Appointment"
                    value={
                      req.appointmentAt
                        ? formatClinicalDateTime(req.appointmentAt)
                        : "Not booked"
                    }
                  />
                  <Field label="Token" value={req.token} />
                  <Field
                    label="FHIR status"
                    value={status ? FHIR_STATUS[status] : "—"}
                  />
                </dl>
                {req.clinicalNotes ? (
                  <p className="mt-3 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {req.clinicalNotes}
                  </p>
                ) : null}
              </section>

              <section>
                <SectionTitle>Tests ordered (LOINC)</SectionTitle>
                <ul className="divide-y divide-border rounded-md border border-border">
                  {req.tests.map((t) => (
                    <li key={t.id} className="px-3 py-2">
                      <p className="text-sm text-foreground">{t.coding.display}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular">
                        LOINC {t.coding.code}
                        {t.specimen ? ` · ${t.specimen}` : ""}
                      </p>
                      {t.instruction ? (
                        <p className="mt-0.5 text-[11px] text-warning-foreground">
                          Prep: {t.instruction}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="mt-6 print-labels">
              <SectionTitle>
                Specimen labels ({labels.length} to print)
              </SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {labels.map((l) => (
                  <SpecimenLabelCard
                    key={l.tube.code}
                    label={l}
                    req={req}
                    patient={patient}
                  />
                ))}
              </div>
            </section>

            <section className="mt-6 no-print">
              <SectionTitle>Audit &amp; privacy ledger</SectionTitle>
              <AuditLedger events={events} />
            </section>

            <div className="sticky bottom-0 mt-6 flex flex-wrap gap-2 border-t border-border bg-background py-4 no-print">
              <Button
                onClick={() => {
                  completeCheckIn(req.id, "lab-tech");
                  window.print();
                  toast.success("Check-in complete", {
                    description: `${labels.length} label${labels.length === 1 ? "" : "s"} sent to print · status set to specimen collected.`,
                  });
                  onOpenChange(false);
                }}
                disabled={req.status === "completed"}
              >
                {req.status === "completed"
                  ? "Check-in already completed"
                  : "Complete check-in & print labels"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  logAudit(
                    req.id,
                    "labels.printed",
                    "lab-tech",
                    "Specimen labels rendered for print (no status change)",
                  );
                  window.print();
                }}
              >
                Print labels only
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}