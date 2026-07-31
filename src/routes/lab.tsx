import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { IntakeDrawer } from "@/components/intake-drawer";
import { LabImpactBanner } from "@/components/lab-impact-banner";
import { Panel, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import {
  effectiveStatus,
  formatAddress,
  formatDob,
  formatSlotTime,
  isSameDay,
  patientName,
  type Requisition,
} from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Lab Tech Dashboard — PulseReq" },
      {
        name: "description",
        content:
          "Look up a requisition token at intake and see the structured order queue for the diagnostic centre.",
      },
      { property: "og:title", content: "Lab Tech Dashboard — PulseReq" },
      {
        property: "og:description",
        content:
          "Look up a requisition token at intake and see the structured order queue.",
      },
    ],
  }),
  component: LabPage,
});

type QueueTab = "today" | "upcoming" | "all";

const TABS: { id: QueueTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
];

function LabPage() {
  const { requisitions, patients, centers, getPatient, getCenter, findByToken } =
    useRequisitions();
  const [query, setQuery] = useState("");
  const [centerId, setCenterId] = useState("ctr-1");
  const [tab, setTab] = useState<QueueTab>("today");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const center = getCenter(centerId);

  const scoped = useMemo(() => {
    const now = new Date();
    const term = search.trim().toLowerCase();
    return requisitions
      .filter((r) => r.centerId === centerId && r.appointmentAt)
      .filter((r) => {
        if (tab === "all") return true;
        const today = isSameDay(r.appointmentAt!, now);
        return tab === "today"
          ? today
          : !today && new Date(r.appointmentAt!).getTime() > now.getTime();
      })
      .filter((r) => {
        if (!term) return true;
        const p = patients.find((x) => x.id === r.patientId);
        return (
          r.token.toLowerCase().includes(term) ||
          (p ? patientName(p).toLowerCase().includes(term) : false) ||
          (p ? p.phn.toLowerCase().includes(term) : false)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentAt!).getTime() -
          new Date(b.appointmentAt!).getTime(),
      );
  }, [requisitions, patients, centerId, tab, search]);

  const todaysQueue = useMemo(
    () =>
      requisitions.filter(
        (r) =>
          r.centerId === centerId &&
          r.appointmentAt &&
          isSameDay(r.appointmentAt),
      ),
    [requisitions, centerId],
  );

  const openReq: Requisition | undefined = openId
    ? requisitions.find((r) => r.id === openId)
    : undefined;

  const trimmed = query.trim();
  const match = trimmed ? findByToken(trimmed) : undefined;
  const matchPatient = match ? getPatient(match.patientId) : undefined;

  return (
    <PageShell
      eyebrow="Role · Diagnostic centre"
      title={`Lab Tech Dashboard — ${center?.name ?? "Diagnostic centre"}`}
      description="Today's booked appointments arrive as structured FHIR orders — no handwriting, no faxed forms, no re-keying at intake."
      actions={
        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Centre
          <select
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
            className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          >
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <LabImpactBanner queue={todaysQueue} />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel title="Intake lookup" hint="Try req-8f92a1">
          <label
            htmlFor="token"
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Requisition token
          </label>
          <input
            id="token"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="req-xxxxxx"
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground tabular outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />

          <div className="mt-4 text-sm">
            {!trimmed ? (
              <p className="text-muted-foreground">
                Enter a token to resolve the order.
              </p>
            ) : match && matchPatient ? (
              <button
                type="button"
                onClick={() => setOpenId(match.id)}
                className="w-full rounded-md border border-success/25 bg-success/10 p-3 text-left transition hover:bg-success/15"
              >
                <p className="font-medium text-foreground">
                  {patientName(matchPatient)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular">
                  PHN {matchPatient.phn} · {match.tests.length} test
                  {match.tests.length === 1 ? "" : "s"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  DOB {formatDob(matchPatient.birthDate)} ·{" "}
                  {formatAddress(matchPatient.address)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-success">
                  Open intake sheet →
                </p>
              </button>
            ) : (
              <div className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-destructive">
                No requisition matches that token.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="Appointment queue"
          hint={`${scoped.length} appointment${scoped.length === 1 ? "" : "s"}`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Queue range"
              className="inline-flex rounded-md border border-border p-0.5"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, PHN or token"
              aria-label="Filter queue"
              className="w-56 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Token</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">DOB</th>
                  <th className="pb-2 font-medium">Tests</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scoped.map((req) => {
                  const patient = getPatient(req.patientId);
                  return (
                    <tr
                      key={req.id}
                      tabIndex={0}
                      aria-label={`Open intake sheet for ${patient ? patientName(patient) : req.token}`}
                      onClick={() => setOpenId(req.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpenId(req.id);
                        }
                      }}
                      className="cursor-pointer transition hover:bg-muted/40 focus:bg-muted/40 focus:outline-none"
                    >
                      <td className="py-3 font-medium text-foreground tabular">
                        {req.appointmentAt
                          ? formatSlotTime(req.appointmentAt)
                          : "—"}
                      </td>
                      <td className="py-3 font-mono text-xs text-foreground tabular">
                        {req.token}
                      </td>
                      <td className="py-3">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="py-3 text-foreground">
                        {patient ? patientName(patient) : "—"}
                        <span className="block text-xs text-muted-foreground tabular">
                          {patient?.phn}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground tabular">
                        {patient ? formatDob(patient.birthDate) : "—"}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground tabular">
                        {req.tests.map((t) => t.coding.code).join(", ")}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={effectiveStatus(req)} />
                      </td>
                    </tr>
                  );
                })}
                {scoped.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No appointments match this view.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <IntakeDrawer
        req={openReq}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </PageShell>
  );
}