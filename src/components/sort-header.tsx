export type SortDir = "asc" | "desc";
export type SortState<K extends string> = { key: K; dir: SortDir } | null;

/** Table header cell with an always-visible asc → desc → none sort toggle. */
export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (next: SortState<K>) => void;
}) {
  const active = sort?.key === sortKey;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";

  function onClick() {
    if (!active) {
      onSort({ key: sortKey, dir: "asc" });
    } else if (sort!.dir === "asc") {
      onSort({ key: sortKey, dir: "desc" });
    } else {
      onSort(null);
    }
  }

  return (
    <th className="py-2 pr-3 text-left" aria-sort={ariaSort}>
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded transition-colors ${
            active ? "text-primary" : "text-muted-foreground"
          }`}
          aria-hidden="true"
        >
          {active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
