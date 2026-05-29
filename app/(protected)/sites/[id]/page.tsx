import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import prisma from "@/lib/prisma";
import { siteToFormValues } from "@/lib/sites/format";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EditSiteDialog } from "@/components/sites/edit-site-dialog";
import { DeleteSiteDialog } from "@/components/sites/delete-site-dialog";
import { AddTurbineDialog } from "@/components/turbines/add-turbine-dialog";
import { EditTurbineDialog } from "@/components/turbines/edit-turbine-dialog";
import { DeleteTurbineDialog } from "@/components/turbines/delete-turbine-dialog";
import { SiteMapTab } from "@/components/sites/site-map-tab";
import { DocumentsList } from "@/components/documents/documents-list";
import { UploadDocumentButton } from "@/components/documents/upload-document-button";
import type { TurbineStatus } from "@/app/generated/prisma/enums";

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

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function fmtDate(d: Date | null): string {
  return d ? dateFormatter.format(d) : "—";
}

function fmtNumber(n: unknown, unit?: string): string {
  if (n === null || n === undefined) return "—";
  const s =
    typeof n === "object" && n !== null && "toString" in n
      ? (n as { toString(): string }).toString()
      : String(n);
  return unit ? `${s} ${unit}` : s;
}

function fmtText(s: string | null): string {
  return s && s.length > 0 ? s : "—";
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      turbines: { orderBy: { name: "asc" } },
      documents: {
        orderBy: { uploadedAt: "desc" },
        include: {
          audits: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              issuesFound: true,
              _count: { select: { issues: { where: { status: "OPEN" } } } },
            },
          },
        },
      },
    },
  });
  if (!site) notFound();

  const documents = site.documents.map((d) => {
    const audit = d.audits[0];
    return {
      id: d.id,
      fileName: d.fileName,
      sizeBytes: Number(d.sizeBytes),
      uploadedAt: d.uploadedAt,
      latestAudit: audit
        ? {
            id: audit.id,
            status: audit.status,
            issuesFound: audit.issuesFound,
            openIssues: audit._count.issues,
          }
        : null,
    };
  });

  const defaultValues = siteToFormValues(site);

  return (
    <div className="flex flex-col gap-6 p-8">
      <Link
        href="/sites"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
        Sites
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
        <p className="text-sm text-muted-foreground">
          {[site.portfolio, site.turbineMake].filter(Boolean).join(" · ") ||
            "—"}
        </p>
      </div>

      <Tabs defaultValue="turbines">
        <TabsList>
          <TabsTrigger value="turbines">Turbines</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="awp">AWP</TabsTrigger>
        </TabsList>

        <TabsContent value="turbines">
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-medium">
                Turbines ({site.turbines.length} of {site.numberOfTurbines})
              </h2>
              <AddTurbineDialog siteId={site.id} />
            </div>

            {site.turbines.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl text-sm text-muted-foreground ring-1 ring-foreground/10">
                No turbines yet.
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl ring-1 ring-foreground/10">
                {site.turbines.map((turbine) => (
                  <li
                    key={turbine.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{turbine.name}</span>
                      {turbine.type || turbine.serial ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {[turbine.type, turbine.serial]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : null}
                    </div>
                    <Badge variant={STATUS_VARIANT[turbine.status]}>
                      {STATUS_LABELS[turbine.status]}
                    </Badge>
                    <div className="flex items-center gap-0.5">
                      <EditTurbineDialog
                        siteId={site.id}
                        turbineId={turbine.id}
                        defaultValues={{
                          name: turbine.name,
                          type: turbine.type ?? "",
                          serial: turbine.serial ?? "",
                          status: turbine.status,
                        }}
                      />
                      <DeleteTurbineDialog
                        siteId={site.id}
                        turbineId={turbine.id}
                        turbineName={turbine.name}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-medium">
                Documents ({documents.length})
              </h2>
              <UploadDocumentButton siteId={site.id} />
            </div>
            <DocumentsList siteId={site.id} documents={documents} />
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-medium">Site Details</h2>
              <div className="flex items-center gap-2">
                <EditSiteDialog
                  siteId={site.id}
                  defaultValues={defaultValues}
                />
                <DeleteSiteDialog
                  siteId={site.id}
                  siteName={site.name}
                  turbineCount={site.turbines.length}
                />
              </div>
            </div>

            <DetailSection title="Basics">
              <DetailRow label="Site Name" value={site.name} />
              <DetailRow label="Portfolio" value={fmtText(site.portfolio)} />
              <DetailRow label="Turbine Make" value={fmtText(site.turbineMake)} />
              <DetailRow
                label="Number of Turbines"
                value={String(site.numberOfTurbines)}
              />
              <DetailRow label="SPV" value={fmtText(site.spv)} />
              <DetailRow
                label="O&M Provider"
                value={fmtText(site.oAndMProvider)}
              />
            </DetailSection>

            <DetailSection title="Operations">
              <DetailRow label="Technology" value={fmtText(site.technology)} />
              <DetailRow
                label="Total Capacity"
                value={fmtNumber(site.totalCapacityMw, "MW")}
              />
              <DetailRow
                label="Asset Manager"
                value={fmtText(site.assetManager)}
              />
              <DetailRow
                label="Project Status"
                value={fmtText(site.projectStatus)}
              />
              <DetailRow
                label="Commissioning Date"
                value={fmtDate(site.commissioningDate)}
              />
              <DetailRow
                label="Operational Since"
                value={fmtDate(site.operationalSince)}
              />
              <DetailRow
                label="Life Expectancy"
                value={
                  site.lifeExpectancy === null
                    ? "—"
                    : `${site.lifeExpectancy} years`
                }
              />
              <DetailRow
                label="Life Extension"
                value={
                  site.lifeExtension === null
                    ? "—"
                    : `${site.lifeExtension} years`
                }
              />
            </DetailSection>

            <DetailSection title="Turbine Specs">
              <DetailRow label="Turbine OEM" value={fmtText(site.turbineOem)} />
              <DetailRow
                label="Turbine Model"
                value={fmtText(site.turbineModel)}
              />
              <DetailRow
                label="Turbine Rating"
                value={fmtNumber(site.turbineRating, "MW")}
              />
              <DetailRow
                label="Hub Height"
                value={fmtNumber(site.hubHeight, "m")}
              />
              <DetailRow
                label="Rotor Diameter"
                value={fmtNumber(site.rotorDiameter, "m")}
              />
            </DetailSection>

            <DetailSection title="Grid">
              <DetailRow
                label="Grid Connection Type"
                value={fmtText(site.gridConnectionType)}
              />
              <DetailRow label="DNO" value={fmtText(site.dno)} />
            </DetailSection>
          </div>
        </TabsContent>

        <TabsContent value="map">
          <SiteMapTab
            siteId={site.id}
            latitude={site.latitude === null ? null : Number(site.latitude)}
            longitude={site.longitude === null ? null : Number(site.longitude)}
          />
        </TabsContent>
        <TabsContent value="awp">
          <EmptyTab message="Authorisations for Work Package." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {children}
      </dl>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
      {message}
    </div>
  );
}
