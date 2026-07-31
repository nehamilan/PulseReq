/**
 * PulseReq domain model.
 *
 * Deliberately shaped so it maps 1:1 onto FHIR R4 resources
 * (Patient, Practitioner, Organization, ServiceRequest) without rework.
 */

export type RequisitionStatus =
  | "active"
  | "booked"
  | "checked-in"
  | "completed"
  | "revoked"
  | "expired";

export const STATUS_LABEL: Record<RequisitionStatus, string> = {
  active: "Awaiting booking",
  booked: "Appointment booked",
  "checked-in": "Checked in",
  completed: "Intake complete",
  revoked: "Revoked by clinician",
  expired: "Link expired",
};

/** FHIR R4 ServiceRequest.status for each internal state. */
export const FHIR_STATUS: Record<RequisitionStatus, string> = {
  active: "active",
  booked: "active",
  "checked-in": "in-progress",
  completed: "completed",
  revoked: "revoked",
  expired: "revoked",
};

export interface Coding {
  system: string;
  code: string;
  display: string;
}

export interface OrderedTest {
  id: string;
  coding: Coding;
  /** e.g. "Fasting 12h required" */
  instruction?: string;
  specimen?: string;
  /** Routing hint: phlebotomy-style lab work vs imaging suite. */
  modality?: "lab" | "imaging";
}

export interface Patient {
  id: string;
  givenName: string;
  familyName: string;
  /** Provincial health number (synthetic) */
  phn: string;
  province: string;
  birthDate: string;
  phone: string;
  address: PatientAddress;
}

export interface PatientAddress {
  line: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface Practitioner {
  id: string;
  name: string;
  /** College registration number (synthetic) */
  licence: string;
  clinic: string;
  province: string;
}

export interface DiagnosticCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  capabilities: string[];
  nextAvailable: string;
  /** Simulated distance from the patient's home address, in km. */
  distanceKm: number;
}

export interface Requisition {
  id: string;
  /** Opaque token used in the patient-facing URL /r/$token */
  token: string;
  status: RequisitionStatus;
  patientId: string;
  practitionerId: string;
  centerId?: string;
  appointmentAt?: string;
  tests: OrderedTest[];
  clinicalNotes?: string;
  priority: "routine" | "urgent" | "stat";
  /** Configurable patient-link lifetime, in days. */
  linkLifetimeDays: 3 | 7 | 14 | 21;
  issuedAt: string;
  expiresAt: string;
  /** How many times a clinician has granted an expiry extension. */
  extensionCount?: number;
}

export type ExtensionStatus = "pending" | "approved" | "declined";

/**
 * A patient-initiated request for more time on an expiring link.
 * Maps onto an amendment of ServiceRequest.occurrencePeriod.end once granted.
 */
export interface ExtensionRequest {
  id: string;
  requisitionId: string;
  requestedDays: 3 | 7 | 14;
  reason?: string;
  status: ExtensionStatus;
  requestedAt: string;
  resolvedAt?: string;
}

export const EXTENSION_DAY_OPTIONS = [3, 7, 14] as const;

/** New expiry ISO after granting `days`, measured from now if already lapsed. */
export function extendExpiry(
  req: Requisition,
  days: number,
  now: Date = new Date(),
): string {
  const base = Math.max(new Date(req.expiresAt).getTime(), now.getTime());
  return new Date(base + days * 86_400_000).toISOString();
}

/**
 * Patients may only ask for more time on an unbooked order that has lapsed
 * or is within 48 hours of lapsing.
 */
export function canRequestExtension(
  req: Requisition,
  now: Date = new Date(),
): boolean {
  if (req.status !== "active") return false;
  return isExpired(req, now) || hoursRemaining(req, now) <= 48;
}

/** "waiting 2 days" / "waiting 5h" — queue age for the clinician view. */
export function waitingLabel(iso: string, now: Date = new Date()): string {
  const hours = Math.max(
    0,
    Math.round((now.getTime() - new Date(iso).getTime()) / 3_600_000),
  );
  if (hours < 24) return `waiting ${hours}h`;
  const days = Math.round(hours / 24);
  return `waiting ${days} day${days === 1 ? "" : "s"}`;
}

export function isExpired(req: Requisition, now: Date = new Date()): boolean {
  return new Date(req.expiresAt).getTime() < now.getTime();
}

/** Status as it should be displayed, accounting for wall-clock expiry. */
export function effectiveStatus(
  req: Requisition,
  now: Date = new Date(),
): RequisitionStatus {
  if (
    req.status === "completed" ||
    req.status === "revoked" ||
    req.status === "checked-in"
  ) {
    return req.status;
  }
  return isExpired(req, now) ? "expired" : req.status;
}

export function hoursRemaining(req: Requisition, now: Date = new Date()): number {
  return Math.max(
    0,
    Math.round((new Date(req.expiresAt).getTime() - now.getTime()) / 3_600_000),
  );
}

export function patientName(p: Patient): string {
  return `${p.givenName} ${p.familyName}`;
}

/** One-line mailing address, e.g. "812 14 St NW, Calgary AB T2N 1Z6". */
export function formatAddress(a: PatientAddress): string {
  return `${a.line}, ${a.city} ${a.province} ${a.postalCode}`;
}

/** Age in whole years at `now`. */
export function ageInYears(birthDate: string, now: Date = new Date()): number {
  const b = new Date(birthDate);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** "Mar 14, 1987 (39y)" — identity check line used across role views. */
export function formatDob(birthDate: string): string {
  return `${formatClinicalDate(birthDate)} (${ageInYears(birthDate)}y)`;
}

/** Short clinical date, e.g. "Jul 30, 2026". */
export function formatClinicalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Date with 24h time, e.g. "Jul 30, 2026 · 09:14". */
export function formatClinicalDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatClinicalDate(iso)} · ${d.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

/** Human countdown to link expiry, e.g. "expires in 6 days" / "expired". */
export function expiryLabel(req: Requisition, now: Date = new Date()): string {
  if (isExpired(req, now)) return "expired";
  const hours = hoursRemaining(req, now);
  if (hours < 24) return `expires in ${hours}h`;
  const days = Math.round(hours / 24);
  return `expires in ${days} day${days === 1 ? "" : "s"}`;
}

const MODALITY_CAPABILITIES: Record<"lab" | "imaging", string[]> = {
  lab: ["Phlebotomy"],
  imaging: ["X-Ray", "Ultrasound"],
};

/** Tests this centre cannot perform, given its listed capabilities. */
export function unsupportedTests(
  center: DiagnosticCenter,
  tests: OrderedTest[],
): OrderedTest[] {
  return tests.filter((t) => {
    const needed = MODALITY_CAPABILITIES[t.modality ?? "lab"];
    return !needed.some((cap) => center.capabilities.includes(cap));
  });
}

export function centerSupports(
  center: DiagnosticCenter,
  tests: OrderedTest[],
): boolean {
  return unsupportedTests(center, tests).length === 0;
}

/** Eight 15-minute appointment slots starting at the centre's next opening. */
export function slotsForCenter(
  center: DiagnosticCenter,
  count = 8,
): string[] {
  const start = new Date(center.nextAvailable).getTime();
  return Array.from({ length: count }, (_, i) =>
    new Date(start + i * 15 * 60_000).toISOString(),
  );
}

/** "14:30" — 24h clock slot label. */
export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Google Maps directions URL for a centre. */
export function directionsUrl(center: DiagnosticCenter): string {
  const q = `${center.name}, ${center.address}, ${center.city} ${center.province}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

/* ------------------------------------------------------------------ */
/* Lab intake: specimen tubes, labels, audit ledger, impact metrics    */
/* ------------------------------------------------------------------ */

export interface TubeType {
  code: string;
  name: string;
  /** Tailwind classes for the cap-colour chip. */
  swatch: string;
}

const TUBE_SST: TubeType = {
  code: "SST",
  name: "Gold SST (serum)",
  swatch: "bg-warning/70 border-warning",
};
const TUBE_EDTA: TubeType = {
  code: "EDTA",
  name: "Lavender EDTA (whole blood)",
  swatch: "bg-primary/50 border-primary",
};
const TUBE_FLUORIDE: TubeType = {
  code: "NaF",
  name: "Grey fluoride oxalate (glucose)",
  swatch: "bg-muted-foreground/50 border-muted-foreground",
};
const TUBE_IMAGING: TubeType = {
  code: "IMG",
  name: "Imaging worklist entry (no specimen)",
  swatch: "bg-success/40 border-success",
};

/** LOINC → collection tube. Falls back to serum for unmapped lab codes. */
export const TUBE_BY_LOINC: Record<string, TubeType> = {
  "58410-2": TUBE_EDTA,
  "4548-4": TUBE_EDTA,
  "2339-0": TUBE_FLUORIDE,
  "24331-1": TUBE_SST,
  "3016-3": TUBE_SST,
  "36643-5": TUBE_IMAGING,
  "24916-9": TUBE_IMAGING,
};

export function tubeForTest(test: OrderedTest): TubeType {
  return (
    TUBE_BY_LOINC[test.coding.code] ??
    (test.modality === "imaging" ? TUBE_IMAGING : TUBE_SST)
  );
}

export interface SpecimenLabel {
  tube: TubeType;
  tests: OrderedTest[];
}

/** One printed label per distinct tube — a 3-test order can print 2 labels. */
/**
 * Modality-aware description of what "intake complete" actually means for an
 * order. PulseReq hands off to the LIS / worklist; it never resulted anything.
 */
export function handoffDetail(tests: OrderedTest[]): string {
  const hasImaging = tests.some((t) => t.modality === "imaging");
  const hasLab = tests.some((t) => t.modality !== "imaging");
  if (hasImaging && hasLab) {
    return "Specimen collected · exam released to imaging worklist";
  }
  if (hasImaging) return "Exam ready · released to imaging worklist";
  return "Specimen collected · handed to LIS";
}

export function labelsForTests(tests: OrderedTest[]): SpecimenLabel[] {
  const byTube = new Map<string, SpecimenLabel>();
  for (const test of tests) {
    const tube = tubeForTest(test);
    const entry = byTube.get(tube.code);
    if (entry) entry.tests.push(test);
    else byTube.set(tube.code, { tube, tests: [test] });
  }
  return [...byTube.values()];
}

/** Deterministic accession number for the LIS intake sheet. */
export function accessionFor(req: Requisition): string {
  let h = 2166136261;
  for (let i = 0; i < req.token.length; i++) {
    h ^= req.token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const digits = String((h >>> 0) % 1_000_000).padStart(6, "0");
  return `APL-${new Date(req.issuedAt).getFullYear()}-${digits}`;
}

/* --- Impact model ------------------------------------------------- */

/** Discrete fields a technician would otherwise key by hand, per patient. */
export const AUTOFILLED_FIELDS = 26;
/** Estimated keystroke + verification time per field. */
export const SECONDS_PER_FIELD = 12;

export interface QueueSavings {
  patients: number;
  fields: number;
  minutesPerPatient: number;
  minutesToday: number;
}

export function savingsForQueue(reqs: Requisition[]): QueueSavings {
  const minutesPerPatient = (AUTOFILLED_FIELDS * SECONDS_PER_FIELD) / 60;
  return {
    patients: reqs.length,
    fields: AUTOFILLED_FIELDS * reqs.length,
    minutesPerPatient: Math.round(minutesPerPatient * 10) / 10,
    minutesToday: Math.round(minutesPerPatient * reqs.length),
  };
}

/* --- Audit ledger -------------------------------------------------- */

export type AuditAction =
  | "order.issued"
  | "link.opened"
  | "appointment.booked"
  | "intake.read"
  | "patient.checked-in"
  | "labels.printed"
  | "intake.completed";

export interface AuditEvent {
  id: string;
  requisitionId: string;
  at: string;
  actor: string;
  action: AuditAction;
  detail: string;
  hash: string;
  prevHash: string;
}

export const AUDIT_LABEL: Record<AuditAction, string> = {
  "order.issued": "ORDER ISSUED",
  "link.opened": "TOKENIZED READ",
  "appointment.booked": "APPOINTMENT BOOKED",
  "intake.read": "PHI ACCESS · INTAKE",
  "patient.checked-in": "PATIENT CHECKED IN",
  "labels.printed": "LABELS PRINTED",
  "intake.completed": "INTAKE COMPLETED",
};

/** Simulated content hash — deterministic, chained to the previous entry. */
export function auditHash(payload: string, prevHash: string): string {
  let h = 2166136261;
  const input = `${prevHash}|${payload}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = "";
  let x = h >>> 0;
  for (let i = 0; i < 4; i++) {
    out += (x >>> 0).toString(16).padStart(8, "0");
    x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0;
  }
  return out.slice(0, 16);
}

/** True when `iso` falls on the same calendar day as `now`. */
export function isSameDay(iso: string, now: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}