/**
 * PulseReq domain model.
 *
 * Deliberately shaped so it maps 1:1 onto FHIR R4 resources
 * (Patient, Practitioner, Organization, ServiceRequest) without rework.
 */

export type RequisitionStatus =
  | "active"
  | "booked"
  | "completed"
  | "revoked"
  | "expired";

export const STATUS_LABEL: Record<RequisitionStatus, string> = {
  active: "Awaiting booking",
  booked: "Appointment booked",
  completed: "Specimen collected",
  revoked: "Revoked by clinician",
  expired: "Link expired",
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
}

export function isExpired(req: Requisition, now: Date = new Date()): boolean {
  return new Date(req.expiresAt).getTime() < now.getTime();
}

/** Status as it should be displayed, accounting for wall-clock expiry. */
export function effectiveStatus(
  req: Requisition,
  now: Date = new Date(),
): RequisitionStatus {
  if (req.status === "completed" || req.status === "revoked") return req.status;
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