import { z } from "zod";
import { PERMISSIONS } from "@/lib/rbac";

const permissionValues = Object.values(PERMISSIONS);
const permissionSchema = z.enum(permissionValues as [string, ...string[]]);

const roleIdSchema = z.number().int().positive("Role is required.");

export const roleInputSchema = z.object({
  role_name: z
    .string()
    .trim()
    .min(2, "Role name is required.")
    .max(100)
    .transform((value) => value.toUpperCase()),
  permissions: z.array(permissionSchema).min(1, "Pick at least one permission."),
});

export const userCreateSchema = z.object({
  username: z.string().trim().min(3, "Username is required.").max(100),
  full_name: z.string().trim().min(2, "Full name is required.").max(150),
  role_id: roleIdSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
  is_active: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(3, "Username is required.").max(100),
  full_name: z.string().trim().min(2, "Full name is required.").max(150),
  role_id: roleIdSchema,
  password: z.string().trim().optional(),
  is_active: z.boolean(),
});

export type RoleInput = z.infer<typeof roleInputSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
