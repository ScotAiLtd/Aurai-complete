import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const templateUploadRequestSchema = z.object({
  fileName: z
    .string()
    .min(1, { message: "File name is required." })
    .max(255, { message: "File name is too long." })
    .refine((name) => name.toLowerCase().endsWith(".pdf"), {
      message: "Only PDF files are allowed.",
    }),
  sizeBytes: z
    .number()
    .int({ message: "Invalid file size." })
    .positive({ message: "File is empty." }),
});

export type TemplateUploadRequest = z.infer<typeof templateUploadRequestSchema>;

export const recordTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Template name is required." })
    .max(160),
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  s3Key: z.string().min(1),
  turbineModelId: optionalString,
  jobType: optionalString,
});

export type RecordTemplateInput = z.infer<typeof recordTemplateSchema>;
