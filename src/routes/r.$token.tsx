import { createFileRoute } from "@tanstack/react-router";

import { Field, Panel, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  effectiveStatus,
  hoursRemaining,
  patientName,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

export const Route = createFileRoute("/r/$token")({
  head: () => ({
    meta: [
      { title: "Your requisition — PulseReq" },
      {
        name: "description",
        content:
          "Secure requisition link: review the tests your clinician ordered and choose a diagnostic centre.",
      },
      { property: "og:title", content: "Your requisition — PulseReq" },
      {
        property: "og:description",
        content:
          "Secure requisition link: review your ordered tests and choose a diagnostic centre.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PatientView,
});

function PatientView() {
  const { token } = Route.useParams();
  const { findByToken, getPatient, getPractitioner, getCenter } =
    useRequisitions();
  const req = findByToken(token);

  if (!req) {
    return <LinkProblem title="This link isn't valid" token={token} body="We couldn't find a requisition for this link. Check the message from your clinic, or ask them to reissue it." />;
  }

  const status = effectiveStatus(req);

  if (status === "expired" || status === "revoked") {
    return (
      <LinkProblem
        title={status === "expired" ? "This link has expired" : "This link was withdrawn"}
        token={token}
        body={
          status === "expired"
            ? "Requisition links stay active for 72 hours. Contact your clinic to have a new one issued."
            : "Your clinician withdrew this requisition. Contact the clinic if you think this is a mistake."
        }
      />
    );
  }

  const patient = getPatient(req.patientId);
  const practitioner = getPractitioner(req.practitionerId);
  const center = getCenter(req.centerId);

  return (
    <PageShell
      eyebrow="Role · Patient"
      title="Your diagnostic requisition"
      description="No paper form to carry. Show this link — or the check-in code from it — at the diagnostic centre."
      actions={<StatusBadge status={status} />}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Tests ordered"
          hint={`Link valid for ${hoursRemaining(req)} more hours`}
        >
          <ul className="divide-y divide-border">
            {req.tests.map((t) => (
              <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-foreground">
                  {t.coding.display}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular">
                  LOINC {t.coding.code}
                  {t.specimen ? ` · ${t.specimen}` : ""}
                </p>
                {t.instruction ? (
                  <p className="mt-1.5 inline-block rounded border border-warning/35 bg-warning/15 px-2 py-0.5 text-xs text-warning-foreground">
                    {t.instruction}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-md border border-dashed border-border bg-surface p-4">
            <p className="text-sm font-medium text-foreground">
              Choose a diagnostic centre
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Centre selection, time slots and the QR check-in code arrive in the
              next build step.
            </p>
          </div>
        </Panel>

        <Panel title="Requisition details">
          <dl className="grid gap-3">
            <Field
              label="Patient"
              value={patient ? patientName(patient) : "—"}
            />
            <Field label="Health number" value={patient?.phn ?? "—"} />
            <Field label="Ordered by" value={practitioner?.name ?? "—"} />
            <Field label="Clinic" value={practitioner?.clinic ?? "—"} />
            <Field label="Reference" value={req.token} />
            <Field
              label="Booked centre"
              value={center ? center.name : "Not booked yet"}
            />
          </dl>
        </Panel>
      </div>
    </PageShell>
  );
}

function LinkProblem({
  title,
  body,
  token,
}: {
  title: string;
  body: string;
  token: string;
}) {
  return (
    <PageShell
      eyebrow="Role · Patient"
      title={title}
      description={body}
    >
      <Panel title="Link reference">
        <p className="font-mono text-sm text-muted-foreground tabular">{token}</p>
      </Panel>
    </PageShell>
  );
}