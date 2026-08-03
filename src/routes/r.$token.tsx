import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BookingConfirmation } from "@/components/booking-confirmation";
import { ExtensionRequestControl } from "@/components/extension-request-dialog";
import { Field, Panel, PageShell } from "@/components/page-shell";
import { PatientResults } from "@/components/patient-results";
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

type ViewTab = "requisition" | "results";
type OriginRole = "doctor";

export const Route = createFileRoute("/r/$token")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: ViewTab; from?: OriginRole } => ({
    tab: search.tab === "results" ? "results" : undefined,
    from: search.from === "doctor" ? "doctor" : undefined,
  }),
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

function BackLink({
  patientId,
  from,
}: {
  patientId: string;
  from?: OriginRole;
}) {
  const className =
    "mb-5 inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent";
  if (from === "doctor") {
    return (
      <Link to="/order" className={className}>
        ← Back to Doctor Portal
      </Link>
    );
  }
  return (
    <Link
      to="/p/$patientId"
      params={{ patientId }}
      className={className}
    >
      ← Back to portal
    </Link>
  );
}

/**
 * Tab strip between the order itself and its diagnostic report.
 * The report tab only exists once the lab has published something.
 */
function ViewTabs({
  active,
  onChange,
}: {
  active: ViewTab;
  onChange: (tab: ViewTab) => void;
}) {
  const tabs: { id: ViewTab; label: string }[] = [
    { id: "requisition", label: "Requisition" },
    { id: "results", label: "Results" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Requisition view"
      className="mb-5 inline-flex rounded-md border border-border p-0.5"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            active === t.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function PatientView() {
  const { token } = Route.useParams();
  const { tab, from } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    findByToken,
    getPatient,
    getPractitioner,
    getCenter,
    centers,
    updateRequisition,
    reportFor,
  } = useRequisitions();
  const req = findByToken(token);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  if (!req) {
    return <LinkProblem title="This link isn't valid" token={token} body="We couldn't find a requisition for this link. Check the message from your clinic, or ask them to reissue it." from={from} />;
  }

  const status = effectiveStatus(req);
  const report = reportFor(req.id);
  /**
   * Link expiry only stops *booking*. In FHIR terms a lapsed
   * ServiceRequest.occurrencePeriod.end does not retract the DiagnosticReport,
   * so a published report stays reachable after the link goes stale.
   * A revoked order is a clinical retraction and blocks everything.
   */
  const expiredWithoutReport = status === "expired" && !report;

  if (expiredWithoutReport || status === "revoked") {
    return (
      <LinkProblem
        title={status === "expired" ? "This link has expired" : "This link was withdrawn"}
        token={token}
        body={
          status === "expired"
            ? `Requisition links stay active for up to ${req.linkLifetimeDays} days. Contact your clinic to have a new one issued.`
            : "Your clinician withdrew this requisition. Contact the clinic if you think this is a mistake."
        }
        patientId={req.patientId}
        from={from}
      >
        {status === "expired" ? <ExtensionRequestControl req={req} /> : null}
      </LinkProblem>
    );
  }

  const patient = getPatient(req.patientId);
  const practitioner = getPractitioner(req.practitionerId);
  const center = getCenter(req.centerId);
  const activeTab: ViewTab = report && tab === "results" ? "results" : "requisition";
  const setTab = (next: ViewTab) =>
    navigate({
      search: (prev: { tab?: ViewTab; from?: OriginRole }) => ({
        ...prev,
        tab: next === "results" ? ("results" as const) : undefined,
      }),
      replace: true,
    });
  const tabStrip = report ? (
    <ViewTabs active={activeTab} onChange={setTab} />
  ) : null;
  const expiredNotice =
    status === "expired" ? (
      <div className="mb-5 rounded-md border border-warning/35 bg-warning/10 p-3">
        <p className="text-sm font-medium text-warning-foreground">
          This booking link has expired
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Contact your clinic to have a new requisition issued. Any results
          already released to you stay available in the Results tab.
        </p>
        <ExtensionRequestControl req={req} />
      </div>
    ) : null;

  if (activeTab === "results" && report) {
    return (
      <PageShell
        eyebrow="Role · Patient"
        title="Your diagnostic results"
        description="Results released to you by your clinic, with the reference ranges the lab used."
        actions={<StatusBadge status={status} />}
      >
        <BackLink patientId={req.patientId} from={from} />
        {tabStrip}
        <PatientResults req={req} />
      </PageShell>
    );
  }

  if (status === "booked" || status === "completed") {
    const isHistorical = Boolean(report);
    return (
      <PageShell
        eyebrow="Role · Patient"
        title={
          isHistorical ? "Your appointment is complete" : "Your appointment is booked"
        }
        description={
          isHistorical
            ? "This visit has been processed by the lab. Your report is in the Results tab."
            : "Bring the check-in code below — the diagnostic centre already has your order."
        }
      actions={<StatusBadge status={status} />}
    >
      <BackLink patientId={req.patientId} from={from} />
      {tabStrip}
      <BookingConfirmation
          req={req}
          center={center}
          completed={isHistorical}
          onViewResults={isHistorical ? () => setTab("results") : undefined}
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
      actions={<StatusBadge status={status} />}
    >
      <BackLink patientId={req.patientId} from={from} />
      {tabStrip}
      {expiredNotice}
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
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
          {status === "expired" ? null : <ExtensionRequestControl req={req} />}
        </Panel>
      </div>

      {status === "expired" ? null : (
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
      )}
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
  patientId,
  from,
  children,
}: {
  title: string;
  body: string;
  token: string;
  patientId?: string;
  from?: OriginRole;
  children?: ReactNode;
}) {
  return (
    <PageShell
      eyebrow="Role · Patient"
      title={title}
      description={body}
    >
      {patientId ? <BackLink patientId={patientId} from={from} /> : null}
      <Panel title="Link reference">
        <p className="font-mono text-sm text-muted-foreground tabular">{token}</p>
        {children}
      </Panel>
    </PageShell>
  );
}