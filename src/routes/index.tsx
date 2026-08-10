import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Stethoscope,
  Link2,
  FlaskConical,
  User,
  ExternalLink,
  ScanBarcode,
  Plug,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

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
    icon: Stethoscope,
    body: "Order tests by LOINC code and issue an expiring patient link instead of printing a form.",
    cta: "Open ordering view",
    params: {},
  },
  {
    to: "/lab",
    label: "Lab Tech Dashboard",
    icon: FlaskConical,
    body: "Resolve a token at intake and read a structured order — no handwriting, no re-keying.",
    cta: "Open intake view",
    params: {},
  },
  {
    to: "/p/$patientId",
    label: "Patient Portal",
    icon: User,
    body: "All requisitions for a patient in one place, each linking to its booking and check-in code.",
    cta: "Open sample portal",
    params: { patientId: "pat-1" },
  },
  {
    to: "/r/$token",
    label: "Patient View",
    icon: ExternalLink,
    body: "The tokenized link a patient receives: what was ordered, prep instructions, where to go.",
    cta: "Open sample link",
    params: { token: "req-2a5b8c" },
  },
] as const;

const FLOW: { icon: LucideIcon; label: string }[] = [
  { icon: Stethoscope, label: "Clinician" },
  { icon: Link2, label: "Link" },
  { icon: FlaskConical, label: "Lab" },
];

const PRINCIPLES: {
  icon: LucideIcon;
  title: string;
  body: React.ReactNode;
}[] = [
  {
    icon: ScanBarcode,
    title: "Coding",
    body: "Tests carry LOINC codes from the moment they are ordered, so the lab never re-interprets free text.",
  },
  {
    icon: Plug,
    title: "Interoperability",
    body: (
      <>
        Every requisition projects to a FHIR R4{" "}
        <code className="font-mono text-xs">ServiceRequest</code> inside a
        collection Bundle.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Safety",
    body: "Links expire after a clinician-chosen window (7–28 days) and can be revoked. Sensitive results stay hidden from the patient until the ordering clinician signs off or an embargo window lapses.",
  },
];

function Index() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 pb-10">
      <section className="rounded-xl bg-primary/5 px-6 py-7 ring-1 ring-primary/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Prototype · Canadian ambulatory care
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
          Paper requisitions, replaced by a link
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A paper requisition is a data handoff pretending to be a document.
          PulseReq keeps the same three actors and removes the paper: the
          clinician issues a coded order, the patient gets an expiring link, the
          diagnostic centre receives structured data.
        </p>

        <div className="mt-6 flex flex-wrap items-start gap-3">
          {FLOW.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3">
              <div className="w-20 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon size={18} strokeWidth={1.75} />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                  {step.label}
                </p>
              </div>
              {i < FLOW.length - 1 ? (
                <ArrowRight
                  size={16}
                  strokeWidth={1.75}
                  className="mt-2.5 text-primary/50"
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <section
            key={role.to}
            className="flex flex-col rounded-lg border border-border bg-card p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <role.icon size={18} strokeWidth={1.75} />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-foreground">
              {role.label}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{role.body}</p>
            <Link
              to={role.to}
              params={role.params as never}
              className="mt-4 inline-flex self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {role.cta}
            </Link>
          </section>
        ))}
      </div>

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Design principles
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <section key={p.title} className="rounded-lg bg-surface p-3.5">
            <p.icon
              size={18}
              strokeWidth={1.75}
              className="text-muted-foreground"
            />
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              {p.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
