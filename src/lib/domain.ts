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