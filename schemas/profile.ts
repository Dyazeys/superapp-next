import { z } from "zod";

export const DEFAULT_PROFILE_TIMEZONE = "Asia/Jakarta";
export const DEFAULT_PROFILE_LOCALE = "id-ID";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => {
      if (value == null) return undefined;
      return value.length > 0 ? value : undefined;
    });

const profileFieldsSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required.").max(150),
  display_name: optionalTrimmedString(150),
  phone: optionalTrimmedString(50),
  avatar_url: optionalTrimmedString(500).refine(
    (value) => !value || /^https?:\/\/.+/i.test(value),
    "Avatar URL must start with http:// or https://."
  ),
  job_title: optionalTrimmedString(100),
  department: optionalTrimmedString(100),
  timezone: optionalTrimmedString(100),
  locale: optionalTrimmedString(20),
  bio: optionalTrimmedString(2000),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
  confirm_new_password: z.string().optional(),
});

export const profileUpdateSchema = profileFieldsSchema.superRefine((value, ctx) => {
    const currentPassword = value.current_password?.trim() ?? "";
    const newPassword = value.new_password?.trim() ?? "";
    const confirmPassword = value.confirm_new_password?.trim() ?? "";
    const wantsPasswordChange = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

    if (!wantsPasswordChange) {
      return;
    }

    if (!currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["current_password"],
        message: "Current password is required to change your password.",
      });
    }

    if (newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_password"],
        message: "New password must be at least 8 characters.",
      });
    }

    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_new_password"],
        message: "Password confirmation does not match.",
      });
    }
});

export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;
export type ProfileUpdatePayload = z.output<typeof profileUpdateSchema>;

export const teamUserProfileUpdateSchema = profileFieldsSchema.omit({
  current_password: true,
  new_password: true,
  confirm_new_password: true,
});

export type TeamUserProfileUpdateInput = z.input<typeof teamUserProfileUpdateSchema>;
export type TeamUserProfileUpdatePayload = z.output<typeof teamUserProfileUpdateSchema>;
