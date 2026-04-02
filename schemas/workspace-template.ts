import { z } from "zod";

export const workspaceTemplateSchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  code: z.string().min(2, "Code is required").max(24),
  notes: z.string().max(240).optional(),
});

export type WorkspaceTemplateInput = z.infer<typeof workspaceTemplateSchema>;
