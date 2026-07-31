import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell, Panel } from "@/components/page-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseReq — Paperless diagnostic requisitions" },
      {
        name: "description",
        content:
          "A prototype replacing paper lab requisitions with secure, expiring, LOINC-coded links shared between clinician, patient and diagnostic centre.",
      },
      {
        property: "og:title",
        content: "PulseReq — Paperless diagnostic requisitions",
      },
      {
        property: "og:description",
        content:
          "Secure, expiring, LOINC-coded requisition links shared between clinician, patient and diagnostic centre.",
      },
    ],
  }),
  component: Index,
});

const ROLES = [
  {
    to: "/order",
    label: "Doctor Portal",
    body: "Order tests by LOINC code and issue an expiring patient link instead of printing a form.",
    cta: "Open ordering view",
    params: {},
  },
  {
    to: "/r/$token",
    label: "Patient View",
    body: "The tokenized link a patient receives: what was ordered, prep instructions, where to go.",
    cta: "Open sample link",
    params: { token: "req-8f92a1" },
  },
  {
    to: "/lab",
    label: "Lab Tech Dashboard",
    body: "Resolve a token at intake and read a structured order — no handwriting, no re-keying.",
    cta: "Open intake view",
    params: {},
  },
] as const;

function Index() {
  return (
    <PageShell
      eyebrow="Prototype · Canadian ambulatory care"
      title="Paper requisitions, replaced by a link"
      description="A paper requisition is a data handoff pretending to be a document. PulseReq keeps the same three actors and removes the paper: the clinician issues a coded order, the patient gets an expiring link, the diagnostic centre receives structured data."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {ROLES.map((role) => (
          <Panel key={role.to} title={role.label}>
            <p className="text-sm text-muted-foreground">{role.body}</p>
            <Link
              to={role.to}
              params={role.params as never}
              className="mt-4 inline-flex rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {role.cta}
            </Link>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Panel title="Coding">
          <p className="text-sm text-muted-foreground">
            Tests carry LOINC codes from the moment they are ordered, so the lab
            never re-interprets free text.
          </p>
        </Panel>
        <Panel title="Interoperability">
          <p className="text-sm text-muted-foreground">
            Every requisition projects to a FHIR R4{" "}
            <code className="font-mono text-xs">ServiceRequest</code> inside a
            collection Bundle.
          </p>
        </Panel>
        <Panel title="Safety">
          <p className="text-sm text-muted-foreground">
            Links expire after a clinician-chosen window (3–21 days) and can be
            revoked. All data here is synthetic — no real patient information.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
