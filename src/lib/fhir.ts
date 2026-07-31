import {
  effectiveStatus,
  type DiagnosticCenter,
  type Patient,
  type Practitioner,
  type Requisition,
} from "./domain";

/**
 * Minimal FHIR R4 projection of the domain model.
 * Not exhaustive — enough to prove the data shape is interoperable.
 */

type FhirStatus = "active" | "completed" | "revoked";

function fhirStatus(req: Requisition): FhirStatus {
  const status = effectiveStatus(req);
  if (status === "completed") return "completed";
  if (status === "revoked" || status === "expired") return "revoked";
  return "active";
}

export function toFhirPatient(p: Patient) {
  return {
    resourceType: "Patient" as const,
    id: p.id,
    identifier: [
      {
        system: `http://pulsereq.example/phn/${p.province.toLowerCase()}`,
        value: p.phn,
      },
    ],
    name: [{ family: p.familyName, given: [p.givenName] }],
    birthDate: p.birthDate,
    telecom: [{ system: "phone", value: p.phone }],
    address: [
      {
        use: "home",
        line: [p.address.line],
        city: p.address.city,
        state: p.address.province,
        postalCode: p.address.postalCode,
        country: "CA",
      },
    ],
  };
}

export function toFhirPractitioner(pr: Practitioner) {
  return {
    resourceType: "Practitioner" as const,
    id: pr.id,
    identifier: [
      { system: "http://pulsereq.example/licence", value: pr.licence },
    ],
    name: [{ text: pr.name }],
  };
}

export function toFhirOrganization(c: DiagnosticCenter) {
  return {
    resourceType: "Organization" as const,
    id: c.id,
    name: c.name,
    address: [{ line: [c.address], city: c.city, state: c.province }],
  };
}

export function toFhirServiceRequest(req: Requisition) {
  return {
    resourceType: "ServiceRequest" as const,
    id: req.id,
    identifier: [
      { system: "http://pulsereq.example/token", value: req.token },
    ],
    status: fhirStatus(req),
    intent: "order" as const,
    priority: req.priority,
    code: {
      coding: req.tests.map((t) => ({
        system: t.coding.system,
        code: t.coding.code,
        display: t.coding.display,
      })),
    },
    subject: { reference: `Patient/${req.patientId}` },
    requester: { reference: `Practitioner/${req.practitionerId}` },
    performer: req.centerId
      ? [{ reference: `Organization/${req.centerId}` }]
      : undefined,
    authoredOn: req.issuedAt,
    occurrenceDateTime: req.appointmentAt,
    note: req.clinicalNotes ? [{ text: req.clinicalNotes }] : undefined,
  };
}

export function toFhirBundle(input: {
  requisition: Requisition;
  patient: Patient;
  practitioner: Practitioner;
  center?: DiagnosticCenter;
}) {
  const entries = [
    { resource: toFhirServiceRequest(input.requisition) },
    { resource: toFhirPatient(input.patient) },
    { resource: toFhirPractitioner(input.practitioner) },
    ...(input.center ? [{ resource: toFhirOrganization(input.center) }] : []),
  ];

  return {
    resourceType: "Bundle" as const,
    type: "collection" as const,
    timestamp: new Date().toISOString(),
    entry: entries,
  };
}