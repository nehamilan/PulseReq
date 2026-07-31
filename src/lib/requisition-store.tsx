import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  DiagnosticCenter,
  Patient,
  Practitioner,
  Requisition,
} from "./domain";
import { CENTERS, PATIENTS, PRACTITIONERS, REQUISITIONS } from "./seed-data";

interface RequisitionStore {
  requisitions: Requisition[];
  patients: Patient[];
  practitioners: Practitioner[];
  centers: DiagnosticCenter[];
  getPatient: (id: string) => Patient | undefined;
  getPractitioner: (id: string) => Practitioner | undefined;
  getCenter: (id?: string) => DiagnosticCenter | undefined;
  findByToken: (token: string) => Requisition | undefined;
  findByPatientId: (patientId: string) => Requisition[];
  addRequisition: (req: Requisition) => void;
  updateRequisition: (id: string, patch: Partial<Requisition>) => void;
}

const Ctx = createContext<RequisitionStore | null>(null);

export function RequisitionProvider({ children }: { children: ReactNode }) {
  const [requisitions, setRequisitions] = useState<Requisition[]>(REQUISITIONS);

  const value = useMemo<RequisitionStore>(
    () => ({
      requisitions,
      patients: PATIENTS,
      practitioners: PRACTITIONERS,
      centers: CENTERS,
      getPatient: (id) => PATIENTS.find((p) => p.id === id),
      getPractitioner: (id) => PRACTITIONERS.find((p) => p.id === id),
      getCenter: (id) => (id ? CENTERS.find((c) => c.id === id) : undefined),
      findByToken: (token) =>
        requisitions.find(
          (r) => r.token.toLowerCase() === token.trim().toLowerCase(),
        ),
      addRequisition: (req) => setRequisitions((prev) => [req, ...prev]),
      updateRequisition: (id, patch) =>
        setRequisitions((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        ),
    }),
    [requisitions],
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