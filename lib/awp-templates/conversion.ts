import { GetObjectCommand } from "@aws-sdk/client-s3";
import OpenAI from "openai";
import { pdfToPng } from "pdf-to-png-converter";

import prisma from "@/lib/prisma";
import { S3_BUCKET, s3 } from "@/lib/s3";

const QWEN_API_URL = process.env.QWEN_API_URL ?? "";
const QWEN_API_KEY = process.env.QWEN_API_KEY ?? "";
const QWEN_MODEL = process.env.QWEN_MODEL ?? "Qwen/Qwen3-VL-8B-Instruct";
const QWEN_MAX_TOKENS = Number(process.env.QWEN_MAX_TOKENS ?? 8192);
const QWEN_TEMPERATURE = Number(process.env.QWEN_TEMPERATURE ?? 0.2);

function getClient(): OpenAI {
  if (!QWEN_API_URL || !QWEN_API_KEY) {
    throw new Error(
      "QWEN_API_URL and QWEN_API_KEY env vars are required for template conversion.",
    );
  }
  return new OpenAI({
    apiKey: QWEN_API_KEY,
    baseURL: QWEN_API_URL,
    defaultHeaders: { "X-API-Key": QWEN_API_KEY },
  });
}

function buildPrompt(pageNumber: number, totalPages: number): string {
  return `You are converting page ${pageNumber} of ${totalPages} of a blank AWP (Authorised Work Procedure) form to HTML. The form is used in wind turbine maintenance.

OUTPUT RULES
- Return ONLY HTML. No markdown fences, no commentary, no <html>/<head>/<body> wrapper — only the page body content.
- Use semantic HTML: h1–h6, p, ul, ol, strong, em, table, thead, tbody, tr, td, th. Use colspan/rowspan for merged cells.
- Preserve every word verbatim from the form. Do not paraphrase or summarise.
- Preserve table structure exactly. Each row and cell visible on the page must appear.
- Preserve colour-coded warnings with Tailwind utility classes:
  • Yellow CAUTION/PRECAUTION blocks → wrap in <div class="bg-yellow-100 border-l-4 border-yellow-500 p-3 my-2 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100">
  • Red bold text → <span class="font-bold text-red-600 dark:text-red-400">
  • Red headings → <h3 class="font-bold text-red-600 dark:text-red-400">

FILLABLE FIELDS (slots)
- Signature lines, underscored blanks, empty cells in fillable tables, and any zone where a technician writes information by hand are SLOTS.
- Replace each slot with an empty span:
  <span data-slot="operational" data-key="slot_page${pageNumber}_NNN" data-label="<short human description>"></span>
  where NNN is a 3-digit zero-padded sequence number that restarts at 001 for this page.
- The data-label must describe what goes there in plain English: "Authorised Technician name", "Date of Work", "Time/Date", "Signature", "Work Order Number", "Operations Controller name", etc.
- Every fillable cell in a table gets its OWN slot, even if the table is a column of identical cells.

DO NOT WRAP AS SLOTS
- Pre-filled boilerplate text (cautions, precautions, isolation lists, instructions, headings, footer text) is kept verbatim and NOT wrapped as a slot.
- Logo/header art is omitted (you cannot render an image — skip silently).

EXAMPLES
"Authorised Technician (Print Full Name): _____________________"
  → <p>Authorised Technician (Print Full Name): <span data-slot="operational" data-key="slot_page${pageNumber}_001" data-label="Authorised Technician name"></span></p>

A yellow CAUTION block with bulleted text:
  → <div class="bg-yellow-100 border-l-4 border-yellow-500 p-3 my-2 text-yellow-900"><strong class="font-bold text-red-600">CAUTION:</strong><ul><li>...</li></ul></div>

Begin output:`;
}

type ParsedSlot = {
  key: string;
  label: string;
  kind: "operational" | "generated";
  page: number;
};

// Walks the rendered HTML and pulls every <span data-slot="..."> definition out into a flat list.
function extractSlots(html: string): ParsedSlot[] {
  const slots: ParsedSlot[] = [];
  const re =
    /<span\s+[^>]*data-slot="(operational|generated)"[^>]*data-key="([^"]+)"[^>]*data-label="([^"]+)"[^>]*><\/span>/gi;
  for (const m of html.matchAll(re)) {
    const kind = m[1] as "operational" | "generated";
    const key = m[2];
    const label = m[3];
    const pageMatch = key.match(/slot_page(\d+)_/);
    const page = pageMatch ? Number(pageMatch[1]) : 0;
    slots.push({ key, label, kind, page });
  }
  return slots;
}

// Some models wrap output in ```html ... ``` fences despite being asked not to.
function stripFences(s: string): string {
  return s
    .replace(/^\s*```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

async function fetchPdfBytes(s3Key: string): Promise<Buffer> {
  const obj = await s3.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
  );
  if (!obj.Body) throw new Error("S3 object body empty");
  // SDK v3 returns a stream-like Body; transformToByteArray reads it.
  const bytes = await obj.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function convertTemplate(templateId: string): Promise<void> {
  const template = await prisma.awpTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, sourcePdfS3Key: true, status: true },
  });
  if (!template) {
    console.error(`[awp-conversion] template ${templateId} not found`);
    return;
  }

  // Ensure we're in CONVERTING state (or move there)
  await prisma.awpTemplate.update({
    where: { id: templateId },
    data: { status: "CONVERTING", conversionError: null },
  });

  try {
    const pdfBytes = await fetchPdfBytes(template.sourcePdfS3Key);
    const pages = await pdfToPng(pdfBytes, {
      viewportScale: 2.0, // ~150dpi — readable text for the vision model
    });

    if (pages.length === 0) {
      throw new Error("PDF contained no pages");
    }

    const client = getClient();
    const pageHtmls: string[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNumber = i + 1;
      if (!page?.content) {
        throw new Error(`Page ${pageNumber} produced no image content`);
      }
      const base64 = page.content.toString("base64");
      const prompt = buildPrompt(pageNumber, pages.length);

      const response = await client.chat.completions.create({
        model: QWEN_MODEL,
        max_tokens: QWEN_MAX_TOKENS,
        temperature: QWEN_TEMPERATURE,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64}` },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const html = stripFences(raw);
      if (!html) {
        throw new Error(`Model returned empty content for page ${pageNumber}`);
      }
      pageHtmls.push(
        `<section data-page="${pageNumber}" class="awp-page">${html}</section>`,
      );
    }

    const templateHtml = pageHtmls.join("\n");
    const slots = extractSlots(templateHtml);

    await prisma.awpTemplate.update({
      where: { id: templateId },
      data: {
        templateHtml,
        slotsJson: slots as unknown as object,
        status: "READY",
        conversionError: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[awp-conversion] ${templateId} failed:`, message);
    await prisma.awpTemplate.update({
      where: { id: templateId },
      data: {
        status: "FAILED",
        conversionError: message.slice(0, 1000),
      },
    });
  }
}
