import { Link } from "@tanstack/react-router";

const ROLES = [
  { to: "/order", label: "Doctor Portal", hint: "Order" },
  { to: "/r/req-8f92a1", label: "Patient View", hint: "Token link" },
  { to: "/lab", label: "Lab Tech Dashboard", hint: "Intake" },
] as const;

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
        </nav>

        <span className="ml-auto rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium tracking-tight text-muted-foreground">
          Frontend-only mock · Synthetic data · FHIR R4 · no real PHI
        </span>
      </div>
    </header>
  );
}