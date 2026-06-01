import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TurbineStatus } from "@/app/generated/prisma/enums";

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<TurbineStatus, string> = {
  WORKING: "Working",
  IN_USE: "In Use",
  SUSPENDED: "Suspended",
  NOT_OPERATIONAL: "Not Operational",
};

const STATUS_VARIANT: Record<
  TurbineStatus,
  "success" | "warning" | "destructive" | "muted"
> = {
  WORKING: "success",
  IN_USE: "destructive",
  SUSPENDED: "warning",
  NOT_OPERATIONAL: "muted",
};

export default async function TurbinesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;

  const total = await prisma.turbine.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = clampPage(pageParam, totalPages);

  const turbines = await prisma.turbine.findMany({
    orderBy: [{ site: { name: "asc" } }, { name: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      serial: true,
      status: true,
      turbineModel: { select: { name: true } },
      site: { select: { id: true, name: true } },
    },
  });

  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = (page - 1) * PAGE_SIZE + turbines.length;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Turbines</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No turbines yet"
            : `Showing ${firstRow}–${lastRow} of ${total}`}
        </p>
      </div>

      {total === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
          No turbines yet. Add turbines from a site.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            <div className="grid grid-cols-[1fr_1fr_8rem] items-center gap-4 border-b border-border bg-muted/30 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <span>Turbine</span>
              <span>Site</span>
              <span className="text-right">Status</span>
            </div>
            <ul className="divide-y divide-border">
              {turbines.map((turbine) => (
                <li key={turbine.id}>
                  <Link
                    href={`/sites/${turbine.site.id}`}
                    className="grid grid-cols-[1fr_1fr_8rem] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium">{turbine.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[turbine.turbineModel.name, turbine.serial]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    <span className="truncate text-sm">
                      {turbine.site.name}
                    </span>
                    <div className="flex justify-end">
                      <Badge variant={STATUS_VARIANT[turbine.status]}>
                        {STATUS_LABELS[turbine.status]}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {totalPages > 1 ? (
            <PaginationBar page={page} totalPages={totalPages} />
          ) : null}
        </>
      )}
    </div>
  );
}

function clampPage(raw: string | undefined, totalPages: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), totalPages);
}

function PaginationBar({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const prevHref = page > 1 ? `/turbines?page=${page - 1}` : null;
  const nextHref = page < totalPages ? `/turbines?page=${page + 1}` : null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4"
    >
      <PageButton href={prevHref} aria-label="Previous page">
        <ChevronLeft className="size-4" strokeWidth={2} />
        Previous
      </PageButton>

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <PageButton href={nextHref} aria-label="Next page">
        Next
        <ChevronRight className="size-4" strokeWidth={2} />
      </PageButton>
    </nav>
  );
}

function PageButton({
  href,
  children,
  ...props
}: {
  href: string | null;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"a">, "href">) {
  const base = cn(
    "inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium",
    "transition-colors hover:bg-muted/40",
  );

  if (!href) {
    return (
      <span
        aria-disabled
        className={cn(base, "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={base} {...props}>
      {children}
    </Link>
  );
}
