import { z } from "zod";

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
});

export type RecordDocumentInput = z.infer<typeof recordDocumentSchema>;
