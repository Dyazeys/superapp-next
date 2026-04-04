import { z } from "zod";

const optionalInt = z
  .union([z.number().int().positive(), z.null(), z.undefined()])
  .transform((value) => (value === undefined ? null : value));

export const channelGroupSchema = z.object({
  group_name: z.string().min(2, "Group name is required").max(50),
});

export const channelCategorySchema = z.object({
  group_id: optionalInt,
  category_name: z.string().min(2, "Category name is required").max(50),
});

export const channelSchema = z.object({
  category_id: optionalInt,
  channel_name: z.string().min(2, "Channel name is required").max(100),
  slug: z.string().max(100).optional().nullable(),
  is_marketplace: z.boolean().default(false),
});

export type ChannelGroupInput = z.infer<typeof channelGroupSchema>;
export type ChannelCategoryInput = z.infer<typeof channelCategorySchema>;
export type ChannelInput = z.infer<typeof channelSchema>;
