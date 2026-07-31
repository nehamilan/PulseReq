import { useMemo, useState } from "react";

import { RequisitionCreatedDialog } from "@/components/requisition-created-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OrderedTest, Requisition } from "@/lib/domain";
import { useRequisitions } from "@/lib/requisition-store";
import { CATALOG_CATEGORIES, TEST_CATALOG } from "@/lib/seed-data";
import { newToken } from "@/lib/tokens";

const URGENCY = [
  { key: "routine" as const, label: "Normal" },
  { key: "stat" as const, label: "STAT" },
];

const LINK_LIFETIME_DAYS = [
  { key: 3 as const, label: "3 days" },
  { key: 7 as const, label: "7 days" },
  { key: 14 as const, label: "14 days" },
  { key: 21 as const, label: "21 days" },
];

export function OrderForm() {
  const { patients, practitioners, requisitions, addRequisition } =
    useRequisitions();
  const practitioner = practitioners[0];

  const [patientId, setPatientId] = useState<string>(patients[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [priority, setPriority] = useState<"routine" | "stat">("routine");
  const [linkLifetimeDays, setLinkLifetimeDays] = useState<3 | 7 | 14 | 21>(7);
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState<Requisition | null>(null);

  const canSubmit = Boolean(patientId) && selected.length > 0;

  const grouped = useMemo(
    () =>
      CATALOG_CATEGORIES.map((category) => ({
        category,
        entries: TEST_CATALOG.filter((t) => t.category === category),
      })),
    [],
  );

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSubmit() {
    if (!canSubmit || !practitioner) return;
    const now = new Date();
    const tests: OrderedTest[] = selected.map((code, i) => {
      const entry = TEST_CATALOG.find((t) => t.code === code)!;
      return {
        id: `ot-${now.getTime()}-${i}`,
        coding: {
          system: "http://loinc.org",
          code: entry.code,
          display: entry.display,
        },
        instruction: entry.instruction,
        specimen: entry.specimen,
        modality: entry.modality,
        releasePolicy: policyForTest({
          id: "probe",
          coding: { system: "http://loinc.org", code: entry.code, display: entry.display },
          modality: entry.modality,
        }).policy,
      };
    });

    const req: Requisition = {
      id: `rq-${now.getTime()}`,
      token: newToken(requisitions.map((r) => r.token)),
      status: "active",
      patientId,
      practitionerId: practitioner.id,
      priority,
      linkLifetimeDays,
      issuedAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + linkLifetimeDays * 24 * 3_600_000,
      ).toISOString(),
      clinicalNotes: notes.trim() || undefined,
      tests,
    };

    addRequisition(req);
    setCreated(req);
    setSelected([]);
    setNotes("");
    setPriority("routine");
    setLinkLifetimeDays(7);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="patient" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Patient
        </Label>
        <Select value={patientId} onValueChange={setPatientId}>
          <SelectTrigger id="patient" className="w-full">
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.givenName} {p.familyName} · DOB {p.birthDate} · PHN {p.phn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-surface px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Ordering clinician
        </p>
        <p className="mt-0.5 text-sm text-foreground">
          {practitioner?.name}{" "}
          <span className="font-mono text-xs text-muted-foreground tabular">
            {practitioner?.licence}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tests · LOINC coded
        </p>
        {grouped.map((group) => (
          <div key={group.category} className="space-y-1.5">
            <p className="text-[11px] font-semibold text-foreground">
              {group.category}
            </p>
            <ul className="space-y-1.5">
              {group.entries.map((entry) => (
                <li key={entry.code}>
                  <label className="flex cursor-pointer gap-2.5 rounded-md border border-border p-2 transition-colors hover:bg-surface">
                    <Checkbox
                      checked={selected.includes(entry.code)}
                      onCheckedChange={() => toggle(entry.code)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-foreground">
                        {entry.label}{" "}
                        <span className="font-mono text-[11px] text-muted-foreground tabular">
                          {entry.code}
                        </span>
                      </span>
                      {entry.instruction ? (
                        <span className="block text-[11px] text-muted-foreground">
                          {entry.instruction}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Urgency
        </p>
        <div className="inline-flex rounded-md border border-border p-0.5">
          {URGENCY.map((u) => (
            <button
              key={u.key}
              type="button"
              onClick={() => setPriority(u.key)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                priority === u.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Link lifetime
        </p>
        <div className="inline-flex rounded-md border border-border p-0.5">
          {LINK_LIFETIME_DAYS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setLinkLifetimeDays(d.key)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                linkLifetimeDays === d.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Clinical notes <span className="normal-case">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Indication, relevant history…"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Generate Tokenized Requisition
      </button>

      <RequisitionCreatedDialog
        requisition={created}
        onClose={() => setCreated(null)}
      />
    </div>
  );
}