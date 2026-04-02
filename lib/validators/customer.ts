import { z } from "zod";

export const createCustomerSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(16),
  name: z.string().min(2, "Name is required").max(80),
  email: z.email("Enter a valid email address"),
  segment: z.string().min(2, "Segment is required"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export type CustomerRecord = CreateCustomerInput & {
  id: string;
  createdAt: string;
};
