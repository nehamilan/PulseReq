import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { BookingConfirmation } from "@/components/booking-confirmation";
import { Field, Panel, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  centerSupports,
  effectiveStatus,
  formatAddress,
  formatDob,
  formatSlotTime,
  patientName,
  slotsForCenter,
  unsupportedTests,
  type DiagnosticCenter,
  type OrderedTest,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

function BackLink({ patientId }: { patientId: string }) {
  return (
    <Link
      to="/p/$patientId"
      params={{ patientId }}
      className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
    >
      ← Back to portal
    </Link>
  );
}

function PatientView() {
  const { token } = Route.useParams();
  const { findByToken, getPatient, getPractitioner, getCenter, centers, updateRequisition } =
    useRequisitions();
  const req = findByToken(token);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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
            ? `Requisition links stay active for up to ${req.linkLifetimeDays} days. Contact your clinic to have a new one issued.`
            : "Your clinician withdrew this requisition. Contact the clinic if you think this is a mistake."
        }
      />
    );
  }

  const patient = getPatient(req.patientId);
  const practitioner = getPractitioner(req.practitionerId);
  const center = getCenter(req.centerId);

  if (status === "booked" || status === "completed") {
    return (
      <PageShell
        eyebrow="Role · Patient"
        title="Your appointment is booked"
        description="Bring the check-in code below — the diagnostic centre already has your order."
      actions={<StatusBadge status={status} />}
    >
      <BackLink patientId={req.patientId} />
      <BookingConfirmation
          req={req}
          center={center}
          onChange={() => {
            setSelectedCenterId(null);
            setSelectedSlot(null);
            updateRequisition(req.id, {
              status: "active",
              centerId: undefined,
              appointmentAt: undefined,
            });
          }}
        />
      </PageShell>
    );
  }

  const sortedCenters = [...centers].sort((a, b) => a.distanceKm - b.distanceKm);

  function confirmBooking() {
    if (!req || !selectedCenterId || !selectedSlot) return;
    updateRequisition(req.id, {
      status: "booked",
      centerId: selectedCenterId,
      appointmentAt: selectedSlot,
    });
    toast.success("Appointment booked", {
      description: "Your requisition is now linked to the diagnostic centre.",
    });
  }

  return (
    <PageShell
      eyebrow="Role · Patient"
      title="Your diagnostic requisition"
      description="No paper form to carry. Show this link — or the check-in code from it — at the diagnostic centre."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <BackLink patientId={req.patientId} />
          <StatusBadge status={status} />
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Tests ordered"
          hint={`Link valid until ${formatDate(req.expiresAt)}`}
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
        </Panel>

        <Panel title="Requisition details">
          <dl className="grid gap-3">
            <Field
              label="Patient"
              value={patient ? patientName(patient) : "—"}
            />
            <Field label="Health number" value={patient?.phn ?? "—"} />
            <Field
              label="Date of birth"
              value={patient ? formatDob(patient.birthDate) : "—"}
            />
            <Field
              label="Address"
              value={patient ? formatAddress(patient.address) : "—"}
            />
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

      <div className="mt-5">
        <Panel
          title="Choose a diagnostic centre"
          hint={`${sortedCenters.length} near ${patient?.address.city ?? "you"}`}
        >
          <ul className="space-y-3">
            {sortedCenters.map((c) => (
              <CenterCard
                key={c.id}
                center={c}
                tests={req.tests}
                selected={selectedCenterId === c.id}
                selectedSlot={selectedSlot}
                onSelectCenter={() => {
                  setSelectedCenterId(c.id);
                  setSelectedSlot(null);
                }}
                onSelectSlot={setSelectedSlot}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={confirmBooking}
            disabled={!selectedCenterId || !selectedSlot}
            className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm &amp; link requisition
          </button>
          {!selectedCenterId || !selectedSlot ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Pick a centre and a time slot to continue.
            </p>
          ) : null}
        </Panel>
      </div>
    </PageShell>
  );
}

function CenterCard({
  center,
  tests,
  selected,
  selectedSlot,
  onSelectCenter,
  onSelectSlot,
}: {
  center: DiagnosticCenter;
  tests: OrderedTest[];
  selected: boolean;
  selectedSlot: string | null;
  onSelectCenter: () => void;
  onSelectSlot: (iso: string) => void;
}) {
  const supported = centerSupports(center, tests);
  const missing = unsupportedTests(center, tests);

  return (
    <li
      className={`rounded-md border p-3 transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card"
      } ${supported ? "" : "opacity-60"}`}
    >
      <button
        type="button"
        onClick={onSelectCenter}
        disabled={!supported}
        className="w-full text-left disabled:cursor-not-allowed"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{center.name}</p>
          <span className="text-xs text-muted-foreground tabular">
            {center.distanceKm.toFixed(1)} km away
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {center.address}, {center.city} {center.province}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {center.capabilities.join(" · ")}
        </p>
        {supported ? (
          <p className="mt-1 text-xs text-success">
            Next slot {formatSlotTime(center.nextAvailable)}
          </p>
        ) : (
          <p className="mt-1 text-xs text-destructive">
            Cannot perform: {missing.map((t) => t.coding.display).join(", ")}
          </p>
        )}
      </button>

      {selected && supported ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            15-minute slots
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {slotsForCenter(center).map((iso) => (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectSlot(iso)}
                className={`rounded-full border px-3 py-1 font-mono text-xs tabular transition-colors ${
                  selectedSlot === iso
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent"
                }`}
              >
                {formatSlotTime(iso)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </li>
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