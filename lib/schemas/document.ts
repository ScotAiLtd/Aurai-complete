import { z } from "zod";

import { DocType } from "@/app/generated/prisma/enums";

export const docTypeSchema = z.enum([
  DocType.AWP_SOURCE,
  DocType.REPORT,
  DocType.REFERENCE,
  DocType.OTHER,
]);

export const uploadRequestSchema = z.object({
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

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

export const recordDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  s3Key: z.string().min(1),
  docType: docTypeSchema,
  previousVersionId: z.string().min(1).optional(),
});

export type RecordDocumentInput = z.infer<typeof recordDocumentSchema>;

export const markReadyForAwpSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type MarkReadyForAwpInput = z.infer<typeof markReadyForAwpSchema>;
