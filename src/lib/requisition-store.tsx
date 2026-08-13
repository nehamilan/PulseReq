import { demoNow, setDemoClockOffsetDays } from "./clock";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AuditAction,
  AuditEvent,
  DiagnosticCenter,
  ExtensionRequest,
  Patient,
  Practitioner,
  Requisition,
} from "./domain";
import { auditHash, extendExpiry, handoffDetail } from "./domain";
import {
  buildReport,
  embargoLapsed,
  resolveReleasePolicy,
  type DiagnosticReportRecord,
} from "./results";
import {
  CENTERS,
  DEMO_ANCHOR,
  EXTENSION_REQUESTS,
  PATIENTS,
  PRACTITIONERS,
  REPORTS,
  REQUISITIONS,
} from "./seed-data";


interface RequisitionStore {
  requisitions: Requisition[];
  patients: Patient[];
  practitioners: Practitioner[];
  centers: DiagnosticCenter[];
  extensionRequests: ExtensionRequest[];
  auditEvents: AuditEvent[];
  reports: DiagnosticReportRecord[];
  /** Simulation clock — advances so embargo lapses are demoable. */
  now: () => Date;
  clockOffsetDays: number;
  advanceClock: (days: number) => void;
  resetClock: () => void;
  reportFor: (requisitionId: string) => DiagnosticReportRecord | undefined;
  /** Lab publishes results; IMMEDIATE policy releases in the same step. */
  publishResults: (requisitionId: string, actor: string) => void;
  /** Clinician review & release — also acts as embargo early-release. */
  releaseResults: (requisitionId: string, actor: string) => void;
  auditFor: (requisitionId: string) => AuditEvent[];
  logAudit: (
    requisitionId: string,
    action: AuditAction,
    actor: string,
    detail: string,
  ) => void;
  /** Booked → checked-in: patient has arrived and been identity-verified.
   *  When centerId and appointmentAt are supplied, the patient is treated as a walk-in.
   */
  checkInPatient: (
    requisitionId: string,
    actor: string,
    centerId?: string,
    appointmentAt?: string,
  ) => void;
  /** Checked-in → completed: labels printed, order handed to the LIS/worklist. */
  completeIntake: (requisitionId: string, actor: string) => void;
  /** Clinician withdraws an unresulted order; kills the patient link. */
  revokeRequisition: (
    requisitionId: string,
    actor: string,
    reason?: string,
  ) => void;
  /** Clinician extends a link's validity without a patient request. */
  extendRequisition: (requisitionId: string, days: number) => void;
  getPatient: (id: string) => Patient | undefined;
  getPractitioner: (id: string) => Practitioner | undefined;
  getCenter: (id?: string) => DiagnosticCenter | undefined;
  findByToken: (token: string) => Requisition | undefined;
  findByPatientId: (patientId: string) => Requisition[];
  addRequisition: (req: Requisition) => void;
  updateRequisition: (id: string, patch: Partial<Requisition>) => void;
  /** Latest extension request for a requisition, if any. */
  latestExtensionFor: (requisitionId: string) => ExtensionRequest | undefined;
  pendingExtensions: () => ExtensionRequest[];
  requestExtension: (
    requisitionId: string,
    requestedDays: 7 | 14 | 21 | 28,
    reason?: string,
  ) => void;
  approveExtension: (extensionId: string) => void;
  declineExtension: (extensionId: string) => void;
}

/** Lifecycle events replayed from seed requisitions, chained by hash. */
function seedAudit(reqs: Requisition[]): AuditEvent[] {
  const events: Omit<AuditEvent, "hash" | "prevHash">[] = [];
  for (const req of reqs) {
    events.push({
      id: `aud-${req.id}-issued`,
      requisitionId: req.id,
      at: req.issuedAt,
      actor: "prac-1",
      action: "order.issued",
      detail: `ServiceRequest created · ${req.tests.length} LOINC item(s)`,
    });
    if (req.appointmentAt) {
      events.push({
        id: `aud-${req.id}-opened`,
        requisitionId: req.id,
        at: new Date(
          new Date(req.appointmentAt).getTime() - 36 * 3_600_000,
        ).toISOString(),
        actor: "patient",
        action: "link.opened",
        detail: `Tokenized read via /r/${req.token}`,
      });
      events.push({
        id: `aud-${req.id}-booked`,
        requisitionId: req.id,
        at: new Date(
          new Date(req.appointmentAt).getTime() - 35 * 3_600_000,
        ).toISOString(),
        actor: "patient",
        action: "appointment.booked",
        detail: `Slot reserved at ${req.centerId ?? "centre"}`,
      });
    }
    if (req.status === "checked-in" || req.status === "completed") {
      events.push({
        id: `aud-${req.id}-checkin`,
        requisitionId: req.id,
        at: req.appointmentAt ?? req.issuedAt,
        actor: "lab-tech",
        action: "patient.checked-in",
        detail: "Patient arrived · identity verified at intake",
      });
    }
    if (req.status === "completed") {
      events.push({
        id: `aud-${req.id}-intake-complete`,
        requisitionId: req.id,
        at: new Date(
          new Date(req.appointmentAt ?? req.issuedAt).getTime() + 12 * 60_000,
        ).toISOString(),
        actor: "lab-tech",
        action: "intake.completed",
        detail: handoffDetail(req.tests),
      });
    }
  }
  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  let prev = "0".repeat(16);
  return events.map((e) => {
    const hash = auditHash(`${e.id}|${e.at}|${e.action}|${e.detail}`, prev);
    const entry: AuditEvent = { ...e, prevHash: prev, hash };
    prev = hash;
    return entry;
  });
}

const Ctx = createContext<RequisitionStore | null>(null);

export function RequisitionProvider({ children }: { children: ReactNode }) {
  const [requisitions, setRequisitions] = useState<Requisition[]>(REQUISITIONS);
  const [extensionRequests, setExtensionRequests] =
    useState<ExtensionRequest[]>(EXTENSION_REQUESTS);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() =>
    seedAudit(REQUISITIONS),
  );
  const [reports, setReports] = useState<DiagnosticReportRecord[]>(REPORTS);
  const [clockOffsetDays, setClockOffsetDays] = useState(0);

  setDemoClockOffsetDays(clockOffsetDays);
  const now = () => demoNow();


  const append = (
    entries: {
      requisitionId: string;
      action: AuditAction;
      actor: string;
      detail: string;
    }[],
  ) =>
    setAuditEvents((prev) => {
      let prevHash = prev[prev.length - 1]?.hash ?? "0".repeat(16);
      const next = entries.map((e, i) => {
        const at = new Date(now().getTime() + i).toISOString();
        const id = `aud-${Math.random().toString(36).slice(2, 8)}`;
        const hash = auditHash(`${id}|${at}|${e.action}|${e.detail}`, prevHash);
        const event: AuditEvent = { ...e, id, at, prevHash, hash };
        prevHash = hash;
        return event;
      });
      return [...prev, ...next];
    });

  const value = useMemo<RequisitionStore>(
    () => ({
      requisitions,
      patients: PATIENTS,
      practitioners: PRACTITIONERS,
      centers: CENTERS,
      extensionRequests,
      auditEvents,
      reports,
      now,
      clockOffsetDays,
      advanceClock: (days) => setClockOffsetDays((d) => d + days),
      resetClock: () => setClockOffsetDays(0),
      reportFor: (requisitionId) =>
        reports.find((r) => r.requisitionId === requisitionId),
      publishResults: (requisitionId, actor) => {
        const req = requisitions.find((r) => r.id === requisitionId);
        if (!req || reports.some((r) => r.requisitionId === requisitionId)) return;
        const report = buildReport(req, now());
        setReports((prev) => [...prev, report]);
        const spec = resolveReleasePolicy(req.tests);
        append([
          {
            requisitionId,
            action: "result.published",
            actor,
            detail: `DiagnosticReport issued · ${report.observations.length} Observation(s) · policy ${spec.policy}`,
          },
          ...(report.status === "released"
            ? [
                {
                  requisitionId,
                  action: "result.auto-released" as AuditAction,
                  actor: "policy-engine",
                  detail:
                    "Routine panel · released to patient portal without clinician hold",
                },
              ]
            : []),
        ]);
      },
      releaseResults: (requisitionId, actor) => {
        const report = reports.find((r) => r.requisitionId === requisitionId);
        if (!report || report.status === "released") return;
        const at = now().toISOString();
        setReports((prev) =>
          prev.map((r) =>
            r.requisitionId === requisitionId
              ? { ...r, status: "released", releasedAt: at, releasedBy: actor }
              : r,
          ),
        );
        append([
          {
            requisitionId,
            action: "result.released",
            actor,
            detail: embargoLapsed(report, now())
              ? "Clinician confirmed release after embargo lapse"
              : "Clinician reviewed and released report to patient",
          },
        ]);
      },
      auditFor: (requisitionId) =>
        auditEvents
          .filter((e) => e.requisitionId === requisitionId)
          .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
      logAudit: (requisitionId, action, actor, detail) =>
        append([{ requisitionId, action, actor, detail }]),
      checkInPatient: (requisitionId, actor, centerId, appointmentAt) => {
        setRequisitions((prev) =>
          prev.map((r) =>
            r.id === requisitionId
              ? {
                  ...r,
                  status: "checked-in",
                  centerId: centerId ?? r.centerId,
                  appointmentAt: appointmentAt ?? r.appointmentAt,
                  isWalkIn: !r.appointmentAt ? true : r.isWalkIn,
                }
              : r,
          ),
        );
        append([
          {
            requisitionId,
            action: "patient.checked-in",
            actor,
            detail:
              !centerId && !appointmentAt
                ? "Patient arrived · identity verified at intake"
                : "Patient arrived · identity verified at intake · walk-in · no prior appointment",
          },
        ]);
      },
      completeIntake: (requisitionId, actor) => {
        const req = requisitions.find((r) => r.id === requisitionId);
        setRequisitions((prev) =>
          prev.map((r) =>
            r.id === requisitionId ? { ...r, status: "completed" } : r,
          ),
        );
        append([
          {
            requisitionId,
            action: "labels.printed",
            actor,
            detail: "Specimen labels rendered for print",
          },
          {
            requisitionId,
            action: "intake.completed",
            actor,
            detail: req ? handoffDetail(req.tests) : "Order handed to LIS",
          },
        ]);
      },
      getPatient: (id) => PATIENTS.find((p) => p.id === id),
      revokeRequisition: (requisitionId, actor, reason) => {
        const req = requisitions.find((r) => r.id === requisitionId);
        if (!req || req.status === "revoked") return;
        setRequisitions((prev) =>
          prev.map((r) =>
            r.id === requisitionId ? { ...r, status: "revoked" } : r,
          ),
        );
        setExtensionRequests((prev) =>
          prev.map((e) =>
            e.requisitionId === requisitionId && e.status === "pending"
              ? {
                  ...e,
                  status: "declined",
                  resolvedAt: now().toISOString(),
                }
              : e,
          ),
        );
        append([
          {
            requisitionId,
            action: "order.revoked",
            actor,
            detail: `ServiceRequest revoked · patient link disabled${
              reason?.trim() ? ` · reason: ${reason.trim().slice(0, 140)}` : ""
            }`,
          },
        ]);
      },
      getPractitioner: (id) => PRACTITIONERS.find((p) => p.id === id),
      getCenter: (id) => (id ? CENTERS.find((c) => c.id === id) : undefined),
      findByToken: (token) =>
        requisitions.find(
          (r) => r.token.toLowerCase() === token.trim().toLowerCase(),
        ),
      findByPatientId: (patientId) =>
        requisitions
          .filter((r) => r.patientId === patientId)
          .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()),
      addRequisition: (req) => setRequisitions((prev) => [req, ...prev]),
      updateRequisition: (id, patch) =>
        setRequisitions((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        ),
      latestExtensionFor: (requisitionId) =>
        [...extensionRequests]
          .filter((e) => e.requisitionId === requisitionId)
          .sort(
            (a, b) =>
              new Date(b.requestedAt).getTime() -
              new Date(a.requestedAt).getTime(),
          )[0],
      pendingExtensions: () =>
        extensionRequests
          .filter((e) => e.status === "pending")
          .sort(
            (a, b) =>
              new Date(a.requestedAt).getTime() -
              new Date(b.requestedAt).getTime(),
          ),
      requestExtension: (requisitionId, requestedDays, reason) =>
        setExtensionRequests((prev) => [
          ...prev,
          {
            id: `ext-${Math.random().toString(36).slice(2, 8)}`,
            requisitionId,
            requestedDays,
            reason: reason?.trim() ? reason.trim().slice(0, 140) : undefined,
            status: "pending",
            requestedAt: now().toISOString(),
          },
        ]),
      approveExtension: (extensionId) => {
        const request = extensionRequests.find((e) => e.id === extensionId);
        if (!request || request.status !== "pending") return;
        setRequisitions((prev) =>
          prev.map((r) =>
            r.id === request.requisitionId
              ? {
                  ...r,
                  status: "active",
                  expiresAt: extendExpiry(r, request.requestedDays),
                  extensionCount: (r.extensionCount ?? 0) + 1,
                }
              : r,
          ),
        );
        setExtensionRequests((prev) =>
          prev.map((e) =>
            e.id === extensionId
              ? { ...e, status: "approved", resolvedAt: now().toISOString() }
              : e,
          ),
        );
      },
      declineExtension: (extensionId) =>
        setExtensionRequests((prev) =>
          prev.map((e) =>
            e.id === extensionId && e.status === "pending"
              ? { ...e, status: "declined", resolvedAt: now().toISOString() }
              : e,
          ),
        ),
      extendRequisition: (requisitionId, days) =>
        setRequisitions((prev) =>
          prev.map((r) =>
            r.id === requisitionId
              ? {
                  ...r,
                  status: r.status === "expired" ? "active" : r.status,
                  expiresAt: extendExpiry(r, days),
                  extensionCount: (r.extensionCount ?? 0) + 1,
                }
              : r,
          ),
        ),
    }),
    [requisitions, extensionRequests, auditEvents, reports, clockOffsetDays],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRequisitions(): RequisitionStore {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useRequisitions must be used inside <RequisitionProvider>");
  }
  return ctx;
}