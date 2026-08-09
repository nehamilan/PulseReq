import { createFileRoute, Link } from "@tanstack/react-router";
import { DoorOpen, Info, CalendarClock, FilePlus2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { IntakeDrawer } from "@/components/intake-drawer";
import { LabImpactBanner } from "@/components/lab-impact-banner";
import { Panel, PageShell } from "@/components/page-shell";
import { ReleaseStateChip } from "@/components/result-chips";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { isVisibleToPatient } from "@/lib/results";


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
  const {
    requisitions,
    patients,
    centers,
    getPatient,
    getCenter,
    findByToken,
    reportFor,
    now,
    reports,
    clockOffsetDays,
    advanceClock,
    resetClock,
  } = useRequisitions();

  const [query, setQuery] = useState("");
  const [centerId, setCenterId] = useState("ctr-1");
  const [tab, setTab] = useState<QueueTab>("today");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const center = getCenter(centerId);

  const scoped = useMemo(() => {
    const simulatedNow = now();
    const term = search.trim().toLowerCase();
    return requisitions
      .filter((r) => r.centerId === centerId && r.appointmentAt)
      .filter((r) => {
        if (tab === "all") return true;
        const today = isSameDay(r.appointmentAt!, simulatedNow);
        const inProgress = r.status === "completed" || r.status === "checked-in";
        return tab === "today"
          ? today || inProgress
          : !today && new Date(r.appointmentAt!).getTime() > simulatedNow.getTime();
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
  }, [requisitions, patients, centerId, tab, search, now]);

  const todaysQueue = useMemo(
    () =>
      requisitions.filter(
        (r) =>
          r.centerId === centerId &&
          r.appointmentAt &&
          (isSameDay(r.appointmentAt, now()) ||
            r.status === "completed" ||
            r.status === "checked-in"),
      ),
    [requisitions, centerId, now],
  );

  const openReq: Requisition | undefined = openId

    ? requisitions.find((r) => r.id === openId)
    : undefined;

  const trimmed = query.trim();
  const match = trimmed ? findByToken(trimmed) : undefined;
  const matchPatient = match ? getPatient(match.patientId) : undefined;

  const simulatedNow = now();

  const advanceWithFeedback = (days: number) => {
    const before = reports.filter((r) => isVisibleToPatient(r, simulatedNow)).length;
    const future = new Date(simulatedNow.getTime() + days * 86_400_000);
    const after = reports.filter((r) => isVisibleToPatient(r, future)).length;
    const newlyVisible = after - before;
    advanceClock(days);
    if (newlyVisible > 0) {
      toast.success(
        `${newlyVisible} report${newlyVisible === 1 ? "" : "s"} now visible to patient${newlyVisible === 1 ? "" : "s"}`,
        {
          description: "Embargo lifted after advancing the demo clock.",
        },
      );
    } else {
      toast("Demo clock advanced", {
        description: `Simulated time is now ${future.toLocaleDateString("en-CA", { dateStyle: "medium" })}. No reports changed state yet.`,
      });
    }
  };

  return (

    <PageShell
      eyebrow="Role · Diagnostic centre"
      title={`Lab Tech Dashboard — ${center?.name ?? "Diagnostic centre"}`}
      description="Today's booked appointments arrive as structured FHIR orders — no handwriting, no faxed forms, no re-keying at intake."
      actions={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-end gap-2">
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
            {center?.walkInsAccepted ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <DoorOpen className="h-3.5 w-3.5" />
                Walk-ins accepted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                Appointment only
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Simulated now
            <div className="mt-1 flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-2 text-xs font-normal normal-case tracking-normal text-foreground tabular">
              {simulatedNow.toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <div className="flex items-center gap-1">
              Embargo clock
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    aria-label="What is the embargo clock"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  className="w-64 p-3"
                >
                  <p className="text-xs font-normal normal-case tracking-normal text-muted-foreground">
                    Sensitive results stay hidden from the patient for this many
                    days after publish, unless a clinician releases them sooner.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => advanceWithFeedback(3)}
                className="rounded-md border border-input bg-background px-2.5 py-2 text-xs font-normal normal-case tracking-normal text-foreground transition hover:bg-accent"
              >
                +3 days
              </button>
              <button
                type="button"
                onClick={resetClock}
                disabled={clockOffsetDays === 0}
                className="rounded-md border border-input bg-background px-2.5 py-2 text-xs font-normal normal-case tracking-normal text-muted-foreground transition hover:bg-accent disabled:opacity-40"
              >
                {clockOffsetDays === 0 ? "now" : `+${clockOffsetDays}d · reset`}
              </button>
            </div>
          </div>
        </div>
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
                {match.status === "active" ? (
                  <p className="mt-1.5 text-xs font-medium text-warning-foreground">
                    No appointment booked — check in as walk-in
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs font-medium text-success">
                    Open intake sheet →
                  </p>
                )}
              </button>
            ) : (
              <div className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-destructive">
                No requisition matches that token.
              </div>
            )}
          </div>

          {center?.walkInsAccepted ? (
            <>
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <Link
                to="/order"
                className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                <FilePlus2 className="h-4 w-4" />
                Enter requisition manually (walk-in)
              </Link>
            </>
          ) : (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                {center?.name ?? "This centre"} is appointment-only. Walk-ins
                not allowed.
              </p>
            </div>
          )}
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
                  <th className="pb-2 font-medium">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scoped.map((req) => {
                  const patient = getPatient(req.patientId);
                  const report = reportFor(req.id);
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
                        {req.isWalkIn ? (
                          <span className="ml-1.5 inline-flex rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Walk-in
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3">
                        {report ? (
                          <ReleaseStateChip report={report} now={now()} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {scoped.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
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
        centerId={centerId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </PageShell>
  );
}