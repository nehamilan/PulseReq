import { createFileRoute } from "@tanstack/react-router";

import { Field, Panel, PageShell } from "@/components/page-shell";
import { OrderForm } from "@/components/order-form";
import { DoctorWorkspace } from "@/components/doctor-workspace";


export const Route = createFileRoute("/order")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: "attention" | "log" } => ({
    tab: search.tab === "log" ? "log" : undefined,
  }),
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
  return (
    <PageShell
      eyebrow="Role · Ordering clinician"
      title="Doctor Portal"
      description="Issue a diagnostic requisition as a secure, expiring link. The patient chooses where and when; the lab receives structured LOINC-coded orders."
      actions={
        <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
          Link lifetime: 14 days default
        </span>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
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

        <DoctorWorkspace />
      </div>
    </PageShell>
  );
}