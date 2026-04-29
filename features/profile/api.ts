import { requestJson } from "@/lib/request";
import type { ProfileUpdateInput } from "@/schemas/profile";
import type { ProfilePayload } from "@/types/profile";

export const profileApi = {
  get: () => requestJson<ProfilePayload>("/api/profile"),
  update: (payload: ProfileUpdateInput) =>
    requestJson<ProfilePayload>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
