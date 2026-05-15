import { z } from "zod";

import { TurbineStatus } from "@/app/generated/prisma/enums";

const optionalString = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const turbineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Turbine number is required." })
    .max(60),
  type: optionalString,
  serial: optionalString,
  status: z.enum([
    TurbineStatus.WORKING,
    TurbineStatus.IN_USE,
    TurbineStatus.SUSPENDED,
    TurbineStatus.NOT_OPERATIONAL,
  ]),
});

export type TurbineInput = z.input<typeof turbineSchema>;
export type TurbineValues = z.output<typeof turbineSchema>;
