import type {
  DiagnosticCenter,
  ExtensionRequest,
  Patient,
  Practitioner,
  Requisition,
} from "./domain";

/**
 * Synthetic seed data. No real PHI — names, health numbers and licence
 * numbers are fabricated in the style of Synthea output.
 */

const ISSUED_AT = "2026-07-30T14:10:00.000Z";
const EXPIRES_AT = "2026-08-06T14:10:00.000Z"; // +7 days

const LINK_LIFETIME_DAYS = 7 as const;

/** Today at a given local 24h time — keeps the lab queue populated forever. */
function todayAt(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function tomorrowAt(hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const PATIENTS: Patient[] = [
  {
    id: "pat-1",
    givenName: "Jane",
    familyName: "Doe",
    phn: "AB-982341",
    province: "AB",
    birthDate: "1987-03-14",
    phone: "+1 587-555-0148",
    address: {
      line: "812 14 St NW",
      city: "Calgary",
      province: "AB",
      postalCode: "T2N 1Z6",
    },
  },
  {
    id: "pat-2",
    givenName: "Marc",
    familyName: "Tremblay",
    phn: "AB-114907",
    province: "AB",
    birthDate: "1962-11-02",
    phone: "+1 403-555-0192",
    address: {
      line: "27 Sunmills Green SE",
      city: "Calgary",
      province: "AB",
      postalCode: "T2X 3H4",
    },
  },
  {
    id: "pat-3",
    givenName: "Priya",
    familyName: "Nair",
    phn: "AB-770412",
    province: "AB",
    birthDate: "1994-06-21",
    phone: "+1 587-555-0110",
    address: {
      line: "1104 Kensington Rd NW",
      city: "Calgary",
      province: "AB",
      postalCode: "T2N 3P3",
    },
  },
  {
    id: "pat-4",
    givenName: "Owen",
    familyName: "Whitecalf",
    phn: "AB-330985",
    province: "AB",
    birthDate: "1978-01-09",
    phone: "+1 403-555-0175",
    address: {
      line: "45 Cranston Way SE",
      city: "Calgary",
      province: "AB",
      postalCode: "T3M 0K4",
    },
  },
];

export const PRACTITIONERS: Practitioner[] = [
  {
    id: "prac-1",
    name: "Dr. Sarah Jenkins",
    licence: "CPSA #45219",
    clinic: "Bowness Family Health",
    province: "AB",
  },
];

export const CENTERS: DiagnosticCenter[] = [
  {
    id: "ctr-1",
    name: "APL Chinook Centre",
    address: "6455 Macleod Trail SW",
    city: "Calgary",
    province: "AB",
    capabilities: ["Phlebotomy", "Urinalysis", "ECG"],
    nextAvailable: "2026-07-31T14:30:00.000Z",
    distanceKm: 1.2,
  },
  {
    id: "ctr-2",
    name: "APL Foothills",
    address: "3030 Hospital Dr NW",
    city: "Calgary",
    province: "AB",
    capabilities: ["Phlebotomy", "X-Ray", "Ultrasound"],
    nextAvailable: "2026-08-01T09:00:00.000Z",
    distanceKm: 4.5,
  },
  {
    id: "ctr-3",
    name: "DynaLIFE Sunridge",
    address: "3223 26 Ave NE",
    city: "Calgary",
    province: "AB",
    capabilities: ["Phlebotomy", "Urinalysis"],
    nextAvailable: "2026-07-31T16:15:00.000Z",
    distanceKm: 6.1,
  },
];

export const REQUISITIONS: Requisition[] = [
  {
    id: "rq-1",
    token: "req-8f92a1",
    status: "active",
    patientId: "pat-1",
    practitionerId: "prac-1",
    priority: "routine",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: ISSUED_AT,
    expiresAt: EXPIRES_AT,
    clinicalNotes: "Fatigue, 6-week history. Rule out anemia.",
    tests: [
      {
        id: "ot-1",
        coding: {
          system: "http://loinc.org",
          code: "58410-2",
          display: "CBC panel with differential, Blood",
        },
        specimen: "Whole blood (EDTA)",
      },
      {
        id: "ot-2",
        coding: {
          system: "http://loinc.org",
          code: "2339-0",
          display: "Glucose [Mass/volume] in Blood",
        },
        instruction: "Fasting 12 hours required",
        specimen: "Serum",
      },
    ],
  },
  {
    id: "rq-2",
    token: "req-3c71bd",
    status: "booked",
    patientId: "pat-2",
    practitionerId: "prac-1",
    centerId: "ctr-1",
    appointmentAt: todayAt(9, 15),
    priority: "stat",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: "2026-07-29T11:00:00.000Z",
    expiresAt: "2026-08-05T11:00:00.000Z",
    tests: [
      {
        id: "ot-3",
        coding: {
          system: "http://loinc.org",
          code: "24331-1",
          display: "Lipid 1996 panel - Serum or Plasma",
        },
        instruction: "Fasting 12 hours required",
        specimen: "Serum",
      },
    ],
  },
];

REQUISITIONS.push({
  id: "rq-3",
  token: "req-5d20e7",
  status: "active",
  patientId: "pat-1",
  practitionerId: "prac-1",
  priority: "routine",
  linkLifetimeDays: 7,
  issuedAt: "2026-07-25T22:00:00.000Z",
  expiresAt: "2026-08-01T22:00:00.000Z",
  clinicalNotes: "Annual metabolic screen.",
  tests: [
    {
      id: "ot-4",
      coding: {
        system: "http://loinc.org",
        code: "4548-4",
        display: "Hemoglobin A1c/Hemoglobin.total in Blood",
      },
      specimen: "Whole blood",
      modality: "lab",
    },
  ],
});

/** Booked appointments at APL Chinook so the lab queue reflects a real day. */
REQUISITIONS.push(
  {
    id: "rq-4",
    token: "req-a41c9f",
    status: "booked",
    patientId: "pat-3",
    practitionerId: "prac-1",
    centerId: "ctr-1",
    appointmentAt: todayAt(10, 0),
    priority: "routine",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: "2026-07-28T16:30:00.000Z",
    expiresAt: "2026-08-04T16:30:00.000Z",
    clinicalNotes: "Pre-natal screen, first trimester.",
    tests: [
      {
        id: "ot-5",
        coding: {
          system: "http://loinc.org",
          code: "58410-2",
          display: "CBC panel with differential, Blood",
        },
        specimen: "Whole blood (EDTA)",
        modality: "lab",
      },
      {
        id: "ot-6",
        coding: {
          system: "http://loinc.org",
          code: "3016-3",
          display: "Thyrotropin [Units/volume] in Serum or Plasma",
        },
        specimen: "Serum",
        modality: "lab",
      },
    ],
  },
  {
    id: "rq-5",
    token: "req-c07b53",
    status: "completed",
    patientId: "pat-4",
    practitionerId: "prac-1",
    centerId: "ctr-1",
    appointmentAt: todayAt(8, 30),
    priority: "routine",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: "2026-07-27T13:05:00.000Z",
    expiresAt: "2026-08-03T13:05:00.000Z",
    tests: [
      {
        id: "ot-7",
        coding: {
          system: "http://loinc.org",
          code: "4548-4",
          display: "Hemoglobin A1c/Hemoglobin.total in Blood",
        },
        specimen: "Whole blood",
        modality: "lab",
      },
    ],
  },
  {
    id: "rq-6",
    token: "req-b92d10",
    status: "booked",
    patientId: "pat-1",
    practitionerId: "prac-1",
    centerId: "ctr-2",
    appointmentAt: todayAt(13, 45),
    priority: "urgent",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: "2026-07-29T09:40:00.000Z",
    expiresAt: "2026-08-05T09:40:00.000Z",
    clinicalNotes: "Persistent cough, 3 weeks.",
    tests: [
      {
        id: "ot-8",
        coding: {
          system: "http://loinc.org",
          code: "36643-5",
          display: "XR Chest PA and Lateral",
        },
        modality: "imaging",
      },
    ],
  },
  {
    id: "rq-7",
    token: "req-e5813c",
    status: "booked",
    patientId: "pat-4",
    practitionerId: "prac-1",
    centerId: "ctr-1",
    appointmentAt: tomorrowAt(9, 30),
    priority: "routine",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: "2026-07-30T10:15:00.000Z",
    expiresAt: "2026-08-06T10:15:00.000Z",
    tests: [
      {
        id: "ot-9",
        coding: {
          system: "http://loinc.org",
          code: "24331-1",
          display: "Lipid 1996 panel - Serum or Plasma",
        },
        instruction: "Fasting 12 hours required",
        specimen: "Serum",
        modality: "lab",
      },
    ],
  },
);

/** One pending request so the clinician queue is populated on first load. */
export const EXTENSION_REQUESTS: ExtensionRequest[] = [
  {
    id: "ext-1",
    requisitionId: "rq-1",
    requestedDays: 7,
    reason: "Away for work until next week",
    status: "pending",
    requestedAt: "2026-07-31T08:20:00.000Z",
  },
];

/** Common orderable tests for the doctor portal's test picker. */
export interface CatalogEntry {
  category: "Blood panels" | "Imaging";
  code: string;
  display: string;
  /** Short clinician-facing label used in the picker. */
  label: string;
  instruction?: string;
  specimen?: string;
  modality: "lab" | "imaging";
}

export const TEST_CATALOG: CatalogEntry[] = [
  {
    category: "Blood panels",
    code: "2339-0",
    display: "Glucose [Mass/volume] in Blood",
    label: "Fasting blood glucose",
    instruction: "Fasting 12 hours required",
    specimen: "Serum",
    modality: "lab",
  },
  {
    category: "Blood panels",
    code: "24331-1",
    display: "Lipid 1996 panel - Serum or Plasma",
    label: "Lipid panel",
    instruction: "Fasting 12 hours required",
    specimen: "Serum",
    modality: "lab",
  },
  {
    category: "Blood panels",
    code: "58410-2",
    display: "CBC panel with differential, Blood",
    label: "Complete blood count",
    specimen: "Whole blood (EDTA)",
    modality: "lab",
  },
  {
    category: "Blood panels",
    code: "4548-4",
    display: "Hemoglobin A1c/Hemoglobin.total in Blood",
    label: "Hemoglobin A1c",
    specimen: "Whole blood",
    modality: "lab",
  },
  {
    category: "Blood panels",
    code: "3016-3",
    display: "Thyrotropin [Units/volume] in Serum or Plasma",
    label: "Thyrotropin (TSH)",
    specimen: "Serum",
    modality: "lab",
  },
  {
    category: "Imaging",
    code: "36643-5",
    display: "XR Chest PA and Lateral",
    label: "Chest X-ray",
    modality: "imaging",
  },
  {
    category: "Imaging",
    code: "24916-9",
    display: "US Abdomen",
    label: "Abdominal ultrasound",
    instruction: "Nothing by mouth 6 hours before scan",
    modality: "imaging",
  },
];

export const CATALOG_CATEGORIES = ["Blood panels", "Imaging"] as const;