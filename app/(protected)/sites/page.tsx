import prisma from "@/lib/prisma";
import { AddSiteDialog } from "@/components/sites/add-site-dialog";
import { SitesList } from "@/components/sites/sites-list";

export default async function SitesPage() {
  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      portfolio: true,
      turbineMake: true,
      numberOfTurbines: true,
    },
  });

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground">
            {sites.length} site{sites.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddSiteDialog />
      </div>

      {sites.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
          No sites yet. Click “Add Site” to create your first.
        </div>
      ) : (
        <SitesList sites={sites} />
      )}
    </div>
  );
}
