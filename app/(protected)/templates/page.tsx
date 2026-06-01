import prisma from "@/lib/prisma";
import { listTurbineModels } from "@/lib/turbine-models/actions";
import { TemplatesList } from "@/components/awp-templates/templates-list";
import { UploadTemplateButton } from "@/components/awp-templates/upload-template-button";

export default async function TemplatesPage() {
  const [templates, turbineModels] = await Promise.all([
    prisma.awpTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        turbineModel: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
      },
    }),
    listTurbineModels(),
  ]);

  const items = templates.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    conversionError: t.conversionError,
    turbineModelName: t.turbineModel?.name ?? null,
    jobType: t.jobType,
    createdAt: t.createdAt,
    createdBy: t.createdBy.name ?? t.createdBy.email,
  }));

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">AWP Templates</h1>
          <p className="text-sm text-muted-foreground">
            Blank AWP forms. Once converted, they can be used to generate
            Authorised Work Procedures.
          </p>
        </div>
        <UploadTemplateButton turbineModels={turbineModels} />
      </div>

      <TemplatesList templates={items} />
    </div>
  );
}
