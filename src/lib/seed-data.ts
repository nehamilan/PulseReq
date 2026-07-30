import type {
  DiagnosticCenter,
  Patient,
  Practitioner,
  Requisition,
} from "./domain";

/**
 * Synthetic seed data. No real PHI — names, health numbers and licence
 * numbers are fabricated in the style of Synthea output.
 */

const ISSUED_AT = "2026-07-30T14:10:00.000Z";
const EXPIRES_AT = "2026-08-02T14:10:00.000Z"; // +72h

export const PATIENTS: Patient[] = [
  {
    id: "pat-1",
    givenName: "Jane",
    familyName: "Doe",
    phn: "AB-982341",
    province: "AB",
    birthDate: "1987-03-14",
    phone: "+1 587-555-0148",
  },
  {
    id: "pat-2",
    givenName: "Marc",
    familyName: "Tremblay",
    phn: "AB-114907",
    province: "AB",
    birthDate: "1962-11-02",
    phone: "+1 403-555-0192",
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
    name: "Alberta Precision Labs — Kensington",
    address: "1130 Kensington Rd NW",
    city: "Calgary",
    province: "AB",
    capabilities: ["Phlebotomy", "Urinalysis", "ECG"],
    nextAvailable: "2026-07-31T09:20:00.000Z",
  },
  {
    id: "ctr-2",
    name: "Foothills Diagnostic Imaging",
    address: "3030 Hospital Dr NW",
    city: "Calgary",
    province: "AB",
    capabilities: ["X-Ray", "Ultrasound", "Phlebotomy"],
    nextAvailable: "2026-08-01T13:00:00.000Z",
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
    appointmentAt: "2026-07-31T15:40:00.000Z",
    priority: "routine",
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