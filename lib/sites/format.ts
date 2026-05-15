import type { SiteModel } from "@/app/generated/prisma/models";

import {
  EMPTY_SITE_FORM,
  type SiteFormValues,
} from "@/components/sites/site-form";

function dateToInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function decToInput(d: unknown): string {
  if (d === null || d === undefined) return "";
  return typeof d === "object" && d !== null && "toString" in d
    ? (d as { toString(): string }).toString()
    : String(d);
}

export function siteToFormValues(site: SiteModel): SiteFormValues {
  return {
    ...EMPTY_SITE_FORM,
    name: site.name,
    portfolio: site.portfolio ?? "",
    spv: site.spv ?? "",
    oAndMProvider: site.oAndMProvider ?? "",
    numberOfTurbines: String(site.numberOfTurbines),
    turbineMake: site.turbineMake ?? "",
    technology: site.technology ?? "",
    totalCapacityMw: decToInput(site.totalCapacityMw),
    commissioningDate: dateToInput(site.commissioningDate),
    operationalSince: dateToInput(site.operationalSince),
    assetManager: site.assetManager ?? "",
    turbineOem: site.turbineOem ?? "",
    turbineModel: site.turbineModel ?? "",
    turbineRating: decToInput(site.turbineRating),
    projectStatus: site.projectStatus ?? "",
    lifeExpectancy:
      site.lifeExpectancy === null ? "" : String(site.lifeExpectancy),
    lifeExtension:
      site.lifeExtension === null ? "" : String(site.lifeExtension),
    gridConnectionType: site.gridConnectionType ?? "",
    dno: site.dno ?? "",
    hubHeight: decToInput(site.hubHeight),
    rotorDiameter: decToInput(site.rotorDiameter),
  };
}
