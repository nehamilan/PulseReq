import { Link, useMatch, useNavigate } from "@tanstack/react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDob, patientName } from "@/lib/domain";
import { PATIENTS } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

const ROLES = [
  { to: "/order", label: "Doctor Portal" },
  { to: "/lab", label: "Lab Tech Dashboard" },
] as const;

function PatientPortalDropdown() {
  const navigate = useNavigate({ from: "/" });
  const patientMatch = useMatch({ from: "/p/$patientId", shouldThrow: false });
  const isActive = !!patientMatch;

  const activeClass =
    "bg-card text-foreground shadow-sm border-border";
  const inactiveClass =
    "text-muted-foreground border-transparent hover:text-foreground";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select patient portal"
        className={cn(
          "rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors outline-none",
          isActive ? activeClass : inactiveClass
        )}
      >
        Patient Portal
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Choose a patient</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PATIENTS.map((patient) => (
          <DropdownMenuItem
            key={patient.id}
            className="flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer"
            onClick={() =>
              navigate({
                to: "/p/$patientId",
                params: { patientId: patient.id },
              })
            }
          >
            <span className="text-sm font-medium text-foreground">
              {patientName(patient)}
            </span>
            <span className="text-xs text-muted-foreground tabular">
              PHN {patient.phn} · {formatDob(patient.birthDate)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
            P
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            PulseReq
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {ROLES.map((role) => (
            <Link
              key={role.to}
              to={role.to}
              activeProps={{
                className: "bg-card text-foreground shadow-sm border-border",
              }}
              inactiveProps={{
                className:
                  "text-muted-foreground border-transparent hover:text-foreground",
              }}
              className="rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors"
            >
              {role.label}
            </Link>
          ))}
          <PatientPortalDropdown />
        </nav>

        <span className="ml-auto rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-muted-foreground">
          Frontend-only mock · Synthetic data · FHIR R4 · no real PHI
        </span>
      </div>
    </header>
  );
}
