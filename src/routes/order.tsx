import { createFileRoute, Link } from "@tanstack/react-router";

import { Field, Panel, PageShell } from "@/components/page-shell";
import { OrderForm } from "@/components/order-form";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import {
  effectiveStatus,
  expiryLabel,
  formatClinicalDate,
  formatClinicalDateTime,
  patientName,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Doctor Portal — PulseReq" },
      {
        name: "description",
        content:
          "Issue LOINC-coded lab and imaging requisitions as secure patient links instead of paper forms.",
      },
      { property: "og:title", content: "Doctor Portal — PulseReq" },
      {
        property: "og:description",
        content:
          "Issue LOINC-coded lab and imaging requisitions as secure patient links instead of paper forms.",
      },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { requisitions, getPatient, getPractitioner } = useRequisitions();

  return (
    <PageShell
      eyebrow="Role · Ordering clinician"
      title="Doctor Portal"
      description="Issue a diagnostic requisition as a secure, expiring link. The patient chooses where and when; the lab receives structured LOINC-coded orders."
      actions={
        <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
          Link lifetime: 7 days default
        </span>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Issued requisitions" hint={`${requisitions.length} total`}>
          <ul className="divide-y divide-border">
            {requisitions.map((req) => {
              const patient = getPatient(req.patientId);
              const practitioner = getPractitioner(req.practitionerId);
              const status = effectiveStatus(req);
              return (
                <li key={req.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {patient ? patientName(patient) : "Unknown patient"}
                        <span className="ml-2 font-mono text-xs font-normal text-muted-foreground tabular">
                          PHN {patient?.phn}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Ordered by {practitioner?.name} ·{" "}
                        <span className="font-mono tabular">{req.token}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Issued {formatClinicalDateTime(req.issuedAt)}
                        </span>{" "}
                        · {req.linkLifetimeDays}-day link ·{" "}
                        {status === "expired"
                          ? `expired ${formatClinicalDate(req.expiresAt)}`
                          : `${expiryLabel(req)} (${formatClinicalDate(req.expiresAt)})`}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {req.tests.map((t) => (
                          <li
                            key={t.id}
                            className="rounded border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            <span className="font-mono tabular">
                              {t.coding.code}
                            </span>{" "}
                            {t.coding.display}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={status} />
                      <PriorityBadge priority={req.priority} routineHidden />
                      <Link
                        to="/r/$token"
                        params={{ token: req.token }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open patient link →
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel title="New requisition" hint="LOINC coded">
            <OrderForm />
          </Panel>
          <Panel title="Interoperability">
            <dl className="grid gap-3">
              <Field label="Coding system" value="LOINC (http://loinc.org)" />
              <Field label="Link lifetime" value="3 / 7 / 14 / 21 days, configurable at issue" />
              <Field label="Export shape" value="FHIR R4 Bundle · collection" />
            </dl>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}