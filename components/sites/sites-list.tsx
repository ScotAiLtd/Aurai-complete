"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export type SiteListItem = {
  id: string;
  name: string;
  portfolio: string | null;
  turbineMake: string | null;
  numberOfTurbines: number;
};

export function SitesList({ sites }: { sites: SiteListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => s.name.toLowerCase().includes(q));
  }, [sites, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          type="search"
          placeholder="Search sites by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
          {query ? `No sites match “${query}”.` : "No sites yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          <ul className="divide-y divide-border">
            {filtered.map((site) => (
              <li key={site.id}>
                <Link
                  href={`/sites/${site.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">{site.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[site.portfolio, site.turbineMake]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm font-medium">
                      {site.numberOfTurbines}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Turbines
                    </div>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
