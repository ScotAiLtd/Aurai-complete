import { z } from "zod";

export const turbineModelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Model name is required." })
    .max(120, { message: "Model name is too long." }),
});

export type TurbineModelInput = z.input<typeof turbineModelSchema>;
export type TurbineModelValues = z.output<typeof turbineModelSchema>;

export function slugifyTurbineModel(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
