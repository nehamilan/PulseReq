import { demoNow } from "./clock";
import type { OrderedTest, ReleasePolicy, Requisition } from "./domain";

/**
 * Diagnostic results layer.
 *
 * A result is a *separate lifecycle* from the order: the ServiceRequest stays
 * "completed" at intake, while the DiagnosticReport moves
 * preliminary → released. Whether that release is automatic is decided by the
 * release policy resolved from the ordered tests.
 */

/* --- Release governance -------------------------------------------- */

export interface PolicySpec {
  policy: ReleasePolicy;
  /** Only meaningful for EMBARGO_DELAY. */
  embargoDays?: number;
  rationale: string;
}

const POLICY_RANK: Record<ReleasePolicy, number> = {
  IMMEDIATE: 0,
  CLINICIAN_HOLD: 1,
  EMBARGO_DELAY: 2,
};

export const POLICY_LABEL: Record<ReleasePolicy, string> = {
  IMMEDIATE: "Immediate auto-release",
  CLINICIAN_HOLD: "Clinician hold",
  EMBARGO_DELAY: "Embargoed release",
};

const ROUTINE: PolicySpec = {
  policy: "IMMEDIATE",
  rationale:
    "Routine outpatient blood work — auto-released to the patient portal as soon as the lab publishes it.",
};

const SENSITIVE: PolicySpec = {
  policy: "CLINICIAN_HOLD",
  rationale:
    "Sensitive result — held until the ordering clinician has reviewed it and can discuss the finding with the patient.",
};

const IMAGING: PolicySpec = {
  policy: "EMBARGO_DELAY",
  embargoDays: 7,
  rationale:
    "Radiology impression — embargoed for 7 days so the clinician can contextualise the report, unless they release it sooner.",
};

/** LOINC → release policy. Mirrors typical Canadian provincial portal rules. */
export const POLICY_BY_LOINC: Record<string, PolicySpec> = {
  "2339-0": ROUTINE,
  "24331-1": ROUTINE,
  "58410-2": ROUTINE,
  "4548-4": ROUTINE,
  "3016-3": ROUTINE,
  "60568-3": SENSITIVE,
  "36643-5": IMAGING,
  "24916-9": IMAGING,
  "2276-4": ROUTINE,
  "14635-7": ROUTINE,
  "24323-8": ROUTINE,
  "24357-6": ROUTINE,
  "24606-6": IMAGING,
  "24627-2": IMAGING,
};

export function policyForTest(test: OrderedTest): PolicySpec {
  if (test.releasePolicy) {
    return {
      policy: test.releasePolicy,
      embargoDays: test.embargoDays,
      rationale:
        test.releasePolicy === "IMMEDIATE"
          ? ROUTINE.rationale
          : test.releasePolicy === "CLINICIAN_HOLD"
            ? SENSITIVE.rationale
            : IMAGING.rationale,
    };
  }
  return (
    POLICY_BY_LOINC[test.coding.code] ??
    (test.modality === "imaging" ? IMAGING : ROUTINE)
  );
}

/** Most restrictive policy across a mixed order wins. */
export function resolveReleasePolicy(tests: OrderedTest[]): PolicySpec {
  return tests
    .map(policyForTest)
    .reduce(
      (worst, spec) =>
        POLICY_RANK[spec.policy] > POLICY_RANK[worst.policy] ? spec : worst,
      ROUTINE,
    );
}

/* --- Analyte catalogue --------------------------------------------- */

export interface AnalyteSpec {
  code: string;
  display: string;
  unit: string;
  refLow: number;
  refHigh: number;
  /** Mock generation window — deliberately wider than the reference range. */
  sample: [number, number];
  decimals?: number;
  explainer: string;
}

/** One ordered LOINC panel can emit several Observations. */
export const ANALYTES_BY_LOINC: Record<string, AnalyteSpec[]> = {
  "2339-0": [
    {
      code: "2339-0",
      display: "Glucose, fasting",
      unit: "mmol/L",
      refLow: 3.9,
      refHigh: 5.5,
      sample: [3.6, 7.4],
      decimals: 1,
      explainer:
        "Measures the sugar in your blood after fasting. Persistently high values can point toward pre-diabetes or diabetes.",
    },
  ],
  "24331-1": [
    {
      code: "2093-3",
      display: "Cholesterol, total",
      unit: "mmol/L",
      refLow: 0,
      refHigh: 5.2,
      sample: [3.4, 6.8],
      decimals: 1,
      explainer:
        "The total amount of cholesterol carried in your blood. It combines the 'good' and 'bad' fractions below.",
    },
    {
      code: "2085-9",
      display: "Cholesterol in HDL",
      unit: "mmol/L",
      refLow: 1.0,
      refHigh: 2.6,
      sample: [0.7, 2.3],
      decimals: 2,
      explainer:
        "HDL is the 'good' cholesterol that helps clear fat from your arteries. Higher is generally better.",
    },
    {
      code: "13457-7",
      display: "Cholesterol in LDL (calculated)",
      unit: "mmol/L",
      refLow: 0,
      refHigh: 3.4,
      sample: [1.8, 4.9],
      decimals: 1,
      explainer:
        "LDL is the 'bad' cholesterol that can build up in artery walls. Lower is generally better.",
    },
    {
      code: "2571-8",
      display: "Triglycerides",
      unit: "mmol/L",
      refLow: 0,
      refHigh: 1.7,
      sample: [0.7, 2.9],
      decimals: 1,
      explainer:
        "A type of fat in the blood. Levels rise with alcohol, sugar and recent meals, so fasting matters here.",
    },
  ],
  "58410-2": [
    {
      code: "718-7",
      display: "Hemoglobin",
      unit: "g/L",
      refLow: 120,
      refHigh: 160,
      sample: [104, 168],
      decimals: 0,
      explainer:
        "The protein in red blood cells that carries oxygen. Low values are what 'anemia' describes.",
    },
    {
      code: "6690-2",
      display: "Leukocytes (WBC)",
      unit: "10*9/L",
      refLow: 4.0,
      refHigh: 11.0,
      sample: [3.2, 13.5],
      decimals: 1,
      explainer:
        "Your white blood cell count — the infection-fighting cells. It rises with infection and inflammation.",
    },
    {
      code: "777-3",
      display: "Platelets",
      unit: "10*9/L",
      refLow: 150,
      refHigh: 400,
      sample: [130, 430],
      decimals: 0,
      explainer:
        "Cell fragments that help your blood clot. Very low or very high counts affect bleeding and clotting.",
    },
  ],
  "4548-4": [
    {
      code: "4548-4",
      display: "Hemoglobin A1c",
      unit: "%",
      refLow: 4.0,
      refHigh: 6.0,
      sample: [4.8, 8.2],
      decimals: 1,
      explainer:
        "Your average blood sugar over roughly the last three months — a longer view than a single glucose test.",
    },
  ],
  "3016-3": [
    {
      code: "3016-3",
      display: "Thyrotropin (TSH)",
      unit: "mIU/L",
      refLow: 0.4,
      refHigh: 4.0,
      sample: [0.2, 6.5],
      decimals: 2,
      explainer:
        "The signal your brain sends to the thyroid. High TSH usually means an underactive thyroid; low means overactive.",
    },
  ],
  "2276-4": [
    {
      code: "2276-4",
      display: "Ferritin",
      unit: "µg/L",
      refLow: 15,
      refHigh: 200,
      sample: [8, 240],
      decimals: 0,
      explainer:
        "Ferritin reflects how much iron your body has in storage. Low values are the earliest sign of iron deficiency.",
    },
  ],
  "14635-7": [
    {
      code: "14635-7",
      display: "Vitamin D (25-hydroxy)",
      unit: "nmol/L",
      refLow: 75,
      refHigh: 250,
      sample: [38, 180],
      decimals: 0,
      explainer:
        "Vitamin D supports bone health and immune function. Levels commonly run low through Canadian winters.",
    },
  ],
  "24323-8": [
    {
      code: "2951-2",
      display: "Sodium",
      unit: "mmol/L",
      refLow: 135,
      refHigh: 145,
      sample: [131, 148],
      decimals: 0,
      explainer:
        "Sodium is the main salt in your blood. It tracks hydration and how your kidneys balance fluid.",
    },
    {
      code: "2823-3",
      display: "Potassium",
      unit: "mmol/L",
      refLow: 3.5,
      refHigh: 5.1,
      sample: [3.1, 5.6],
      decimals: 1,
      explainer:
        "Potassium keeps muscles and the heart rhythm working normally. Both high and low values matter.",
    },
    {
      code: "2160-0",
      display: "Creatinine",
      unit: "µmol/L",
      refLow: 50,
      refHigh: 100,
      sample: [44, 128],
      decimals: 0,
      explainer:
        "A muscle waste product cleared by the kidneys. Rising creatinine suggests reduced kidney filtering.",
    },
    {
      code: "33914-3",
      display: "eGFR (CKD-EPI)",
      unit: "mL/min/1.73m2",
      refLow: 60,
      refHigh: 130,
      sample: [48, 118],
      decimals: 0,
      explainer:
        "An estimate of how well your kidneys filter blood. Sustained values under 60 warrant follow-up.",
    },
    {
      code: "1742-6",
      display: "Alanine aminotransferase (ALT)",
      unit: "U/L",
      refLow: 7,
      refHigh: 45,
      sample: [9, 72],
      decimals: 0,
      explainer:
        "A liver enzyme. Elevations can follow alcohol, medication, fatty liver or infection.",
    },
  ],
  "24357-6": [
    {
      code: "5804-0",
      display: "Protein, urine (dipstick)",
      unit: "g/L",
      refLow: 0,
      refHigh: 0.15,
      sample: [0, 0.4],
      decimals: 2,
      explainer:
        "Protein leaking into urine can be an early marker of kidney strain.",
    },
    {
      code: "5792-7",
      display: "Glucose, urine (dipstick)",
      unit: "mmol/L",
      refLow: 0,
      refHigh: 0.8,
      sample: [0, 2.2],
      decimals: 1,
      explainer:
        "Sugar normally stays out of urine. Its presence usually means blood sugar is running high.",
    },
  ],
};

/** Narrative impressions for modalities that produce no numeric value. */
export const NARRATIVE_BY_LOINC: Record<string, string> = {
  "36643-5":
    "Chest PA and lateral. Lungs are clear with no focal consolidation, effusion or pneumothorax. Cardiomediastinal silhouette within normal limits. Bony thorax intact. IMPRESSION: No acute cardiopulmonary abnormality.",
  "24916-9":
    "Abdominal ultrasound. Liver normal in echotexture without focal lesion. Gallbladder contains a single 6 mm mobile echogenic focus with posterior shadowing; wall thickness normal, no sonographic Murphy sign. Kidneys, pancreas and spleen unremarkable. IMPRESSION: Small cholelithiasis without evidence of acute cholecystitis. Clinical correlation advised.",
  "60568-3":
    "Synoptic pathology report. Specimen received in formalin. Sections show benign glandular tissue with mild chronic inflammation. No dysplasia and no evidence of malignancy identified in the material examined. IMPRESSION: Benign findings.",
  "24606-6":
    "Bilateral screening mammogram, CC and MLO projections. Breast composition category B (scattered fibroglandular densities). No dominant mass, architectural distortion or suspicious microcalcification. IMPRESSION: BI-RADS 1 — negative. Routine screening interval recommended.",
  "24627-2":
    "CT chest with IV contrast. No pulmonary embolus to the segmental level. A 5 mm solid nodule is present in the right lower lobe, unchanged in comparison with prior imaging. No mediastinal or hilar adenopathy, no pleural effusion. IMPRESSION: Stable sub-centimetre pulmonary nodule; no acute finding.",
};

/* --- Observations & reports ---------------------------------------- */

export type Interpretation = "N" | "H" | "L";

export const INTERPRETATION_LABEL: Record<Interpretation, string> = {
  N: "In range",
  H: "Above range",
  L: "Below range",
};

export interface Observation {
  id: string;
  testId: string;
  code: string;
  display: string;
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  interpretation: Interpretation;
  explainer: string;
}

export interface DiagnosticReportRecord {
  id: string;
  requisitionId: string;
  status: "preliminary" | "released";
  policy: ReleasePolicy;
  rationale: string;
  publishedAt: string;
  embargoLiftsAt?: string;
  releasedAt?: string;
  releasedBy?: string;
  acknowledgedAt?: string;
  observations: Observation[];
  narrative?: string;
}

export function interpret(
  value: number,
  refLow: number,
  refHigh: number,
): Interpretation {
  if (value > refHigh) return "H";
  if (value < refLow) return "L";
  return "N";
}

/** Deterministic pseudo-random in [0,1) from a string seed. */
function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function mockValue(seed: string, spec: AnalyteSpec): number {
  const [lo, hi] = spec.sample;
  const raw = lo + seeded(seed) * (hi - lo);
  const dp = spec.decimals ?? 1;
  return Math.round(raw * 10 ** dp) / 10 ** dp;
}

export function observationsFor(req: Requisition): Observation[] {
  const out: Observation[] = [];
  for (const test of req.tests) {
    const specs = ANALYTES_BY_LOINC[test.coding.code];
    if (!specs) continue;
    for (const spec of specs) {
      const value = mockValue(`${req.id}|${test.id}|${spec.code}`, spec);
      out.push({
        id: `obs-${req.id}-${spec.code}`,
        testId: test.id,
        code: spec.code,
        display: spec.display,
        value,
        unit: spec.unit,
        refLow: spec.refLow,
        refHigh: spec.refHigh,
        interpretation: interpret(value, spec.refLow, spec.refHigh),
        explainer: spec.explainer,
      });
    }
  }
  return out;
}

export function narrativeFor(req: Requisition): string | undefined {
  const parts = req.tests
    .map((t) => NARRATIVE_BY_LOINC[t.coding.code])
    .filter(Boolean);
  return parts.length ? parts.join("\n\n") : undefined;
}

/**
 * Build a report for an order whose intake is complete. IMMEDIATE reports are
 * released in the same step; everything else lands preliminary.
 */
export function buildReport(
  req: Requisition,
  now: Date = demoNow(),
): DiagnosticReportRecord {
  const spec = resolveReleasePolicy(req.tests);
  const publishedAt = now.toISOString();
  const auto = spec.policy === "IMMEDIATE";
  return {
    id: `rep-${req.id}`,
    requisitionId: req.id,
    status: auto ? "released" : "preliminary",
    policy: spec.policy,
    rationale: spec.rationale,
    publishedAt,
    embargoLiftsAt:
      spec.policy === "EMBARGO_DELAY"
        ? new Date(
            now.getTime() + (spec.embargoDays ?? 7) * 86_400_000,
          ).toISOString()
        : undefined,
    releasedAt: auto ? publishedAt : undefined,
    releasedBy: auto ? "policy:auto" : undefined,
    observations: observationsFor(req),
    narrative: narrativeFor(req),
  };
}

export function isAbnormal(report: DiagnosticReportRecord): boolean {
  return report.observations.some((o) => o.interpretation !== "N");
}

export function abnormalCount(report: DiagnosticReportRecord): number {
  return report.observations.filter((o) => o.interpretation !== "N").length;
}

/** Has the embargo clock lapsed? */
export function embargoLapsed(
  report: DiagnosticReportRecord,
  now: Date = demoNow(),
): boolean {
  return Boolean(
    report.embargoLiftsAt &&
      new Date(report.embargoLiftsAt).getTime() <= now.getTime(),
  );
}

export function isVisibleToPatient(
  report: DiagnosticReportRecord,
  now: Date = demoNow(),
): boolean {
  return report.status === "released" || embargoLapsed(report, now);
}

/** FHIR DiagnosticReport.status for the report's current state. */
export function fhirReportStatus(
  report: DiagnosticReportRecord,
  now: Date = demoNow(),
): "preliminary" | "final" {
  return isVisibleToPatient(report, now) ? "final" : "preliminary";
}