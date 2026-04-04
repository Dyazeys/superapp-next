import type { ChannelCategoryInput, ChannelGroupInput, ChannelInput } from "@/schemas/channel-module";
import type { ChannelCategoryRecord, ChannelGroupRecord, ChannelRecord } from "@/types/channel";
import { requestJson } from "@/lib/request";

export const channelApi = {
  groups: {
    list: () => requestJson<ChannelGroupRecord[]>("/api/channel/groups"),
    create: (payload: ChannelGroupInput) =>
      requestJson<ChannelGroupRecord>("/api/channel/groups", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (groupId: number, payload: Partial<ChannelGroupInput>) =>
      requestJson<ChannelGroupRecord>(`/api/channel/groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (groupId: number) =>
      requestJson<{ ok: true }>(`/api/channel/groups/${groupId}`, {
        method: "DELETE",
      }),
  },
  categories: {
    list: () => requestJson<ChannelCategoryRecord[]>("/api/channel/categories"),
    create: (payload: ChannelCategoryInput) =>
      requestJson<ChannelCategoryRecord>("/api/channel/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (categoryId: number, payload: Partial<ChannelCategoryInput>) =>
      requestJson<ChannelCategoryRecord>(`/api/channel/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (categoryId: number) =>
      requestJson<{ ok: true }>(`/api/channel/categories/${categoryId}`, {
        method: "DELETE",
      }),
  },
  channels: {
    list: () => requestJson<ChannelRecord[]>("/api/channel/channels"),
    create: (payload: ChannelInput) =>
      requestJson<ChannelRecord>("/api/channel/channels", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (channelId: number, payload: Partial<ChannelInput>) =>
      requestJson<ChannelRecord>(`/api/channel/channels/${channelId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (channelId: number) =>
      requestJson<{ ok: true }>(`/api/channel/channels/${channelId}`, {
        method: "DELETE",
      }),
  },
};
