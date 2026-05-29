import { z } from "zod";

export const AUDIT_AGENTS = [
  "structure",
  "language",
  "technical",
  "consistency",
  "compliance",
  "visual",
] as const;

export const AUDIT_AGENT_LABELS: Record<(typeof AUDIT_AGENTS)[number], string> = {
  structure: "Content Structure",
  language: "Language Quality",
  technical: "Technical Accuracy",
  consistency: "Consistency",
  compliance: "Compliance",
  visual: "Visual Content",
};

export const AUDIT_AGENT_DESCRIPTIONS: Record<
  (typeof AUDIT_AGENTS)[number],
  string
> = {
  structure: "Document organisation and hierarchy",
  language: "Grammar, spelling, and terminology",
  technical: "Engineering specs and procedures",
  consistency: "Cross-references and conflicting info",
  compliance: "Industry standards and regulations",
  visual: "Diagrams and illustrations",
};

export const auditConfigSchema = z.object({
  mode: z.enum(["STANDARD", "SUPER"]),
  enabledAgents: z.array(z.enum(AUDIT_AGENTS)).optional(),
  customAgentName: z.string().max(100).optional(),
  customAgentPrompt: z.string().max(4000).optional(),
});

export type AuditConfigInput = z.infer<typeof auditConfigSchema>;
