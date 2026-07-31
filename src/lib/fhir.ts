import {
  effectiveStatus,
  type DiagnosticCenter,
  type Patient,
  type Practitioner,
  type Requisition,
} from "./domain";
import {
  fhirReportStatus,
  type DiagnosticReportRecord,
  type Observation,
} from "./results";

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

/* --- Results projection -------------------------------------------- */

const INTERPRETATION_CODING = {
  N: { code: "N", display: "Normal" },
  H: { code: "H", display: "High" },
  L: { code: "L", display: "Low" },
} as const;

export function toFhirObservation(
  obs: Observation,
  req: Requisition,
  issued: string,
) {
  const i = INTERPRETATION_CODING[obs.interpretation];
  return {
    resourceType: "Observation" as const,
    id: obs.id,
    status: "final" as const,
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
          },
        ],
      },
    ],
    code: {
      coding: [
        { system: "http://loinc.org", code: obs.code, display: obs.display },
      ],
    },
    subject: { reference: `Patient/${req.patientId}` },
    basedOn: [{ reference: `ServiceRequest/${req.id}` }],
    effectiveDateTime: issued,
    valueQuantity: {
      value: obs.value,
      unit: obs.unit,
      system: "http://unitsofmeasure.org",
      code: obs.unit,
    },
    interpretation: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
            code: i.code,
            display: i.display,
          },
        ],
      },
    ],
    referenceRange: [
      {
        low: { value: obs.refLow, unit: obs.unit },
        high: { value: obs.refHigh, unit: obs.unit },
      },
    ],
  };
}

export function toFhirDiagnosticReport(
  report: DiagnosticReportRecord,
  req: Requisition,
  now: Date = new Date(),
) {
  return {
    resourceType: "DiagnosticReport" as const,
    id: report.id,
    status: fhirReportStatus(report, now),
    basedOn: [{ reference: `ServiceRequest/${req.id}` }],
    code: {
      coding: req.tests.map((t) => ({
        system: t.coding.system,
        code: t.coding.code,
        display: t.coding.display,
      })),
    },
    subject: { reference: `Patient/${req.patientId}` },
    performer: req.centerId
      ? [{ reference: `Organization/${req.centerId}` }]
      : undefined,
    resultsInterpreter: report.releasedBy?.startsWith("policy")
      ? undefined
      : [{ reference: `Practitioner/${req.practitionerId}` }],
    issued: report.publishedAt,
    effectiveDateTime: req.appointmentAt ?? report.publishedAt,
    result: report.observations.map((o) => ({
      reference: `Observation/${o.id}`,
      display: o.display,
    })),
    conclusion: report.narrative,
    extension: [
      {
        url: "http://pulsereq.example/StructureDefinition/release-policy",
        valueCode: report.policy,
      },
      ...(report.embargoLiftsAt
        ? [
            {
              url: "http://pulsereq.example/StructureDefinition/embargo-lifts",
              valueDateTime: report.embargoLiftsAt,
            },
          ]
        : []),
    ],
  };
}

export function toFhirResultBundle(
  report: DiagnosticReportRecord,
  req: Requisition,
  now: Date = new Date(),
) {
  return {
    resourceType: "Bundle" as const,
    type: "collection" as const,
    timestamp: now.toISOString(),
    entry: [
      { resource: toFhirDiagnosticReport(report, req, now) },
      ...report.observations.map((o) => ({
        resource: toFhirObservation(o, req, report.publishedAt),
      })),
    ],
  };
}