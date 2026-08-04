import type {
  DiagnosticCenter,
  ExtensionRequest,
  Patient,
  Practitioner,
  Requisition,
} from "./domain";
import { buildReport, type DiagnosticReportRecord } from "./results";

/**
 * Synthetic seed data. No real PHI — names, health numbers and licence
 * numbers are fabricated in the style of Synthea output.
 */

const ISSUED_AT = "2026-07-30T14:10:00.000Z";
const EXPIRES_AT = "2026-08-06T14:10:00.000Z"; // +7 days

const LINK_LIFETIME_DAYS = 14 as const;

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

/** N days from now (negative = in the past) at a given local time. */
function relDayAt(offsetDays: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
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
  {
    id: "pat-5",
    givenName: "Amara",
    familyName: "Okafor",
    phn: "AB-556128",
    province: "AB",
    birthDate: "1955-09-30",
    phone: "+1 403-555-0133",
    address: {
      line: "310 Riverfront Ave SE",
      city: "Calgary",
      province: "AB",
      postalCode: "T2G 5R3",
    },
  },
  {
    id: "pat-6",
    givenName: "Liam",
    familyName: "Fitzgerald",
    phn: "AB-208764",
    province: "AB",
    birthDate: "2003-04-18",
    phone: "+1 587-555-0166",
    address: {
      line: "78 Evanston Dr NW",
      city: "Calgary",
      province: "AB",
      postalCode: "T3P 0G1",
    },
  },
  {
    id: "pat-7",
    givenName: "Wei",
    familyName: "Zhang",
    phn: "AB-641230",
    province: "AB",
    birthDate: "1971-12-07",
    phone: "+1 403-555-0189",
    address: {
      line: "202 Mahogany Blvd SE",
      city: "Calgary",
      province: "AB",
      postalCode: "T3M 2N4",
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
  {
    id: "prac-2",
    name: "Dr. Amit Kapoor",
    licence: "CPSA #51884",
    clinic: "Riverbend Medical Clinic",
    province: "AB",
  },
  {
    id: "prac-3",
    name: "Dr. Chloé Bergeron",
    licence: "CPSA #48307",
    clinic: "Mahogany Village Family Practice",
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
  {
    id: "ctr-4",
    name: "Mayfair Diagnostics Mahogany",
    address: "50 Mahogany Plaza SE",
    city: "Calgary",
    province: "AB",
    capabilities: ["X-Ray", "Ultrasound", "CT", "Mammography"],
    nextAvailable: "2026-08-01T08:45:00.000Z",
    distanceKm: 9.8,
  },
  {
    id: "ctr-5",
    name: "APL Westmount Collection Site",
    address: "1240 Kensington Rd NW",
    city: "Calgary",
    province: "AB",
    capabilities: ["Phlebotomy", "Urinalysis", "ECG"],
    nextAvailable: "2026-07-31T13:00:00.000Z",
    distanceKm: 2.7,
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
    status: "checked-in",
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

/** Completed orders that exercise each release policy on first load. */
REQUISITIONS.push(
  {
    id: "rq-8",
    token: "req-71f4aa",
    status: "completed",
    patientId: "pat-2",
    practitionerId: "prac-1",
    centerId: "ctr-1",
    appointmentAt: todayAt(8, 0),
    priority: "routine",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: "2026-07-24T15:00:00.000Z",
    expiresAt: "2026-07-31T15:00:00.000Z",
    clinicalNotes: "Excisional biopsy, left forearm lesion.",
    tests: [
      {
        id: "ot-10",
        coding: {
          system: "http://loinc.org",
          code: "60568-3",
          display: "Pathology Synoptic report",
        },
        specimen: "Tissue in formalin",
        modality: "lab",
        releasePolicy: "CLINICIAN_HOLD",
      },
    ],
  },
  {
    id: "rq-9",
    token: "req-2ab660",
    status: "completed",
    patientId: "pat-3",
    practitionerId: "prac-1",
    centerId: "ctr-2",
    appointmentAt: todayAt(11, 15),
    priority: "routine",
    linkLifetimeDays: LINK_LIFETIME_DAYS,
    issuedAt: "2026-07-26T17:20:00.000Z",
    expiresAt: "2026-08-02T17:20:00.000Z",
    clinicalNotes: "Right upper quadrant pain.",
    tests: [
      {
        id: "ot-11",
        coding: {
          system: "http://loinc.org",
          code: "24916-9",
          display: "US Abdomen",
        },
        instruction: "Nothing by mouth 6 hours before scan",
        modality: "imaging",
        releasePolicy: "EMBARGO_DELAY",
        embargoDays: 7,
      },
    ],
  },
);

/** One report per policy so all three patient states are visible immediately. */
function seedReport(requisitionId: string, hoursAgo: number) {
  const req = REQUISITIONS.find((r) => r.id === requisitionId)!;
  return buildReport(req, new Date(Date.now() - hoursAgo * 3_600_000));
}

/** Wider mix: new patients, a second and third clinician, expiry and revocation. */
REQUISITIONS.push(
  {
    id: "rq-10",
    token: "req-9ac412",
    status: "active",
    patientId: "pat-5",
    practitionerId: "prac-2",
    priority: "urgent",
    linkLifetimeDays: 14,
    issuedAt: relDayAt(-2, 9, 20),
    expiresAt: relDayAt(12, 9, 20),
    clinicalNotes: "CKD stage 3 follow-up. Recheck renal panel in 3 months.",
    tests: [
      {
        id: "ot-12",
        coding: {
          system: "http://loinc.org",
          code: "24323-8",
          display: "Comprehensive metabolic 2000 panel - Serum or Plasma",
        },
        specimen: "Serum",
        modality: "lab",
      },
      {
        id: "ot-13",
        coding: {
          system: "http://loinc.org",
          code: "24357-6",
          display: "Urinalysis macro (dipstick) panel - Urine",
        },
        specimen: "Urine, random",
        modality: "lab",
      },
    ],
  },
  {
    id: "rq-11",
    token: "req-4be7d2",
    status: "booked",
    patientId: "pat-6",
    practitionerId: "prac-2",
    centerId: "ctr-5",
    appointmentAt: todayAt(15, 30),
    priority: "routine",
    linkLifetimeDays: 21,
    issuedAt: relDayAt(-4, 11, 0),
    expiresAt: relDayAt(17, 11, 0),
    clinicalNotes: "Vegetarian diet, reported dizziness. Screen iron and B-vitamin status.",
    tests: [
      {
        id: "ot-14",
        coding: {
          system: "http://loinc.org",
          code: "2276-4",
          display: "Ferritin [Mass/volume] in Serum or Plasma",
        },
        specimen: "Serum",
        modality: "lab",
      },
      {
        id: "ot-15",
        coding: {
          system: "http://loinc.org",
          code: "14635-7",
          display: "25-hydroxyvitamin D3 [Mass/volume] in Serum or Plasma",
        },
        specimen: "Serum",
        modality: "lab",
      },
    ],
  },
  {
    id: "rq-12",
    token: "req-6f0d85",
    status: "checked-in",
    patientId: "pat-7",
    practitionerId: "prac-3",
    centerId: "ctr-1",
    appointmentAt: todayAt(11, 45),
    priority: "stat",
    linkLifetimeDays: 7,
    issuedAt: relDayAt(-1, 7, 50),
    expiresAt: relDayAt(2, 7, 50),
    clinicalNotes: "Chest tightness in ER follow-up. STAT troponin protocol at collection.",
    tests: [
      {
        id: "ot-16",
        coding: {
          system: "http://loinc.org",
          code: "58410-2",
          display: "CBC panel with differential, Blood",
        },
        specimen: "Whole blood (EDTA)",
        modality: "lab",
      },
      {
        id: "ot-17",
        coding: {
          system: "http://loinc.org",
          code: "24323-8",
          display: "Comprehensive metabolic 2000 panel - Serum or Plasma",
        },
        specimen: "Serum",
        modality: "lab",
      },
    ],
  },
  {
    id: "rq-13",
    token: "req-1d94c6",
    status: "booked",
    patientId: "pat-5",
    practitionerId: "prac-3",
    centerId: "ctr-4",
    appointmentAt: tomorrowAt(8, 45),
    priority: "routine",
    linkLifetimeDays: 14,
    issuedAt: relDayAt(-6, 14, 30),
    expiresAt: relDayAt(8, 14, 30),
    clinicalNotes: "Routine screening mammogram, no palpable abnormality.",
    tests: [
      {
        id: "ot-18",
        coding: {
          system: "http://loinc.org",
          code: "24606-6",
          display: "MG Breast Screening",
        },
        instruction: "No deodorant, powder or lotion on the day of the exam",
        modality: "imaging",
      },
    ],
  },
  {
    id: "rq-14",
    token: "req-8e33b1",
    status: "completed",
    patientId: "pat-7",
    practitionerId: "prac-3",
    centerId: "ctr-4",
    appointmentAt: relDayAt(-9, 10, 15),
    priority: "urgent",
    linkLifetimeDays: 7,
    issuedAt: relDayAt(-14, 9, 0),
    expiresAt: relDayAt(-7, 9, 0), // expired link, but the report stays reachable
    clinicalNotes: "Pleuritic chest pain — rule out PE.",
    tests: [
      {
        id: "ot-19",
        coding: {
          system: "http://loinc.org",
          code: "24627-2",
          display: "CT Chest W contrast IV",
        },
        instruction: "Nothing by mouth 4 hours before scan",
        modality: "imaging",
        releasePolicy: "EMBARGO_DELAY",
        embargoDays: 7,
      },
    ],
  },
  {
    id: "rq-15",
    token: "req-7c5920",
    status: "completed",
    patientId: "pat-6",
    practitionerId: "prac-2",
    centerId: "ctr-3",
    appointmentAt: relDayAt(-3, 9, 0),
    priority: "routine",
    linkLifetimeDays: 7,
    issuedAt: relDayAt(-8, 8, 10),
    expiresAt: relDayAt(-1, 8, 10),
    clinicalNotes: "Repeat A1c after lifestyle counselling.",
    tests: [
      {
        id: "ot-20",
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
    id: "rq-16",
    token: "req-0b6ef4",
    status: "revoked",
    patientId: "pat-3",
    practitionerId: "prac-1",
    priority: "routine",
    linkLifetimeDays: 7,
    issuedAt: relDayAt(-5, 16, 40),
    expiresAt: relDayAt(2, 16, 40),
    clinicalNotes: "Ordered in error — duplicate of an outstanding panel.",
    tests: [
      {
        id: "ot-21",
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
    id: "rq-17",
    token: "req-5a17fe",
    status: "active",
    patientId: "pat-2",
    practitionerId: "prac-2",
    priority: "routine",
    linkLifetimeDays: 7,
    issuedAt: relDayAt(-4, 10, 5),
    expiresAt: relDayAt(-1, 10, 5), // lapsed without ever being booked
    clinicalNotes: "Pre-operative screen. Reissue if the patient is still awaiting surgery.",
    tests: [
      {
        id: "ot-22",
        coding: {
          system: "http://loinc.org",
          code: "58410-2",
          display: "CBC panel with differential, Blood",
        },
        specimen: "Whole blood (EDTA)",
        modality: "lab",
      },
    ],
  },
);

export const REPORTS: DiagnosticReportRecord[] = [
  seedReport("rq-5", 3), // routine A1c — auto-released
  seedReport("rq-8", 20), // pathology — held for clinician review
  seedReport("rq-9", 6), // ultrasound — embargoed
  seedReport("rq-14", 24 * 9), // CT chest — embargo already lapsed, link expired
  seedReport("rq-15", 24 * 3), // repeat A1c — auto-released
];

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
  {
    id: "ext-2",
    requisitionId: "rq-17",
    requestedDays: 14,
    reason: "Surgery date moved — need the bloodwork window pushed out",
    status: "pending",
    requestedAt: relDayAt(-1, 18, 5),
  },
  {
    id: "ext-3",
    requisitionId: "rq-3",
    requestedDays: 7,
    reason: "Could not fast before the last two appointments",
    status: "approved",
    requestedAt: relDayAt(-3, 12, 0),
    resolvedAt: relDayAt(-3, 15, 20),
  },
];

/** Common orderable tests for the doctor portal's test picker. */
export interface CatalogEntry {
  category: "Blood panels" | "Imaging" | "Pathology";
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
    category: "Blood panels",
    code: "24323-8",
    display: "Comprehensive metabolic 2000 panel - Serum or Plasma",
    label: "Comprehensive metabolic panel",
    specimen: "Serum",
    modality: "lab",
  },
  {
    category: "Blood panels",
    code: "2276-4",
    display: "Ferritin [Mass/volume] in Serum or Plasma",
    label: "Ferritin (iron stores)",
    specimen: "Serum",
    modality: "lab",
  },
  {
    category: "Blood panels",
    code: "14635-7",
    display: "25-hydroxyvitamin D3 [Mass/volume] in Serum or Plasma",
    label: "Vitamin D (25-OH)",
    specimen: "Serum",
    modality: "lab",
  },
  {
    category: "Blood panels",
    code: "24357-6",
    display: "Urinalysis macro (dipstick) panel - Urine",
    label: "Urinalysis (dipstick)",
    specimen: "Urine, random",
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
    code: "24606-6",
    display: "MG Breast Screening",
    label: "Screening mammogram",
    instruction: "No deodorant, powder or lotion on the day of the exam",
    modality: "imaging",
  },
  {
    category: "Imaging",
    code: "24627-2",
    display: "CT Chest W contrast IV",
    label: "CT chest with contrast",
    instruction: "Nothing by mouth 4 hours before scan",
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
  {
    category: "Pathology",
    code: "60568-3",
    display: "Pathology Synoptic report",
    label: "Tissue biopsy — pathology",
    specimen: "Tissue in formalin",
    modality: "lab",
  },
];

export const CATALOG_CATEGORIES = [
  "Blood panels",
  "Imaging",
  "Pathology",
] as const;