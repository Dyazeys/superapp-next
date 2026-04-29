"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { profileApi } from "@/features/profile/api";
import {
  DEFAULT_PROFILE_LOCALE,
  DEFAULT_PROFILE_TIMEZONE,
  profileUpdateSchema,
  type ProfileUpdateInput,
  type ProfileUpdatePayload,
} from "@/schemas/profile";

const PROFILE_KEY = ["profile"] as const;

export function useProfileModule() {
  const profileQuery = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: profileApi.get,
  });

  const form = useForm<ProfileUpdateInput, undefined, ProfileUpdatePayload>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: "",
      display_name: "",
      phone: "",
      avatar_url: "",
      job_title: "",
      department: "",
      timezone: DEFAULT_PROFILE_TIMEZONE,
      locale: DEFAULT_PROFILE_LOCALE,
      bio: "",
      current_password: "",
      new_password: "",
      confirm_new_password: "",
    },
  });

  useEffect(() => {
    const payload = profileQuery.data;
    if (!payload) return;

    form.reset({
      full_name: payload.user.full_name ?? "",
      display_name: payload.profile?.display_name ?? "",
      phone: payload.profile?.phone ?? "",
      avatar_url: payload.profile?.avatar_url ?? "",
      job_title: payload.profile?.job_title ?? "",
      department: payload.profile?.department ?? "",
      timezone: payload.profile?.timezone ?? DEFAULT_PROFILE_TIMEZONE,
      locale: payload.profile?.locale ?? DEFAULT_PROFILE_LOCALE,
      bio: payload.profile?.bio ?? "",
      current_password: "",
      new_password: "",
      confirm_new_password: "",
    });
  }, [form, profileQuery.data]);

  async function save(values: ProfileUpdatePayload) {
    try {
      const payload = await profileApi.update(values);
      form.reset({
        full_name: payload.user.full_name ?? "",
        display_name: payload.profile?.display_name ?? "",
        phone: payload.profile?.phone ?? "",
        avatar_url: payload.profile?.avatar_url ?? "",
        job_title: payload.profile?.job_title ?? "",
        department: payload.profile?.department ?? "",
        timezone: payload.profile?.timezone ?? DEFAULT_PROFILE_TIMEZONE,
        locale: payload.profile?.locale ?? DEFAULT_PROFILE_LOCALE,
        bio: payload.profile?.bio ?? "",
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
      await profileQuery.refetch();
      toast.success("Profile updated");
      return payload;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
      throw error;
    }
  }

  return {
    profileQuery,
    form,
    save,
  };
}
