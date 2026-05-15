import { z } from "zod";

const trimmedRequired = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} is required.` })
    .max(120);

const optionalString = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalNumber = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

const optionalInt = optionalNumber.transform((n) =>
  n === undefined ? undefined : Math.trunc(n),
);

const optionalDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return undefined;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

export const siteSchema = z.object({
  name: trimmedRequired("Site Name"),
  portfolio: trimmedRequired("Portfolio"),
  turbineMake: trimmedRequired("Turbine Make"),
  numberOfTurbines: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((n) => Number.isInteger(n) && n >= 0, {
      message: "Number of Turbines must be a non-negative integer.",
    }),
  spv: optionalString,
  oAndMProvider: optionalString,
  technology: optionalString,
  totalCapacityMw: optionalNumber,
  commissioningDate: optionalDate,
  operationalSince: optionalDate,
  assetManager: optionalString,
  turbineOem: optionalString,
  turbineModel: optionalString,
  turbineRating: optionalNumber,
  projectStatus: optionalString,
  lifeExpectancy: optionalInt,
  lifeExtension: optionalInt,
  gridConnectionType: optionalString,
  dno: optionalString,
  hubHeight: optionalNumber,
  rotorDiameter: optionalNumber,
});

export type SiteInput = z.input<typeof siteSchema>;
export type SiteValues = z.output<typeof siteSchema>;

export const minimalSiteSchema = siteSchema.pick({
  name: true,
  portfolio: true,
  turbineMake: true,
  numberOfTurbines: true,
});

export type MinimalSiteInput = z.input<typeof minimalSiteSchema>;
