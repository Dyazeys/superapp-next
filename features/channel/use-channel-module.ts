"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { accountingApi } from "@/features/accounting/api";
import { channelApi } from "@/features/channel/api";
import { useModalState } from "@/hooks/use-modal-state";
import {
  channelCategorySchema,
  channelGroupSchema,
  channelSchema,
  type ChannelCategoryInput,
  type ChannelFormInput,
  type ChannelGroupInput,
  type ChannelInput,
} from "@/schemas/channel-module";
import type { AccountingAccountRecord } from "@/types/accounting";
import type { ChannelCategoryRecord, ChannelGroupRecord, ChannelRecord } from "@/types/channel";

type ChannelCategoryFormValues = {
  group_id: number | null | undefined;
  category_name: string;
};

type ChannelFormValues = ChannelFormInput;

type ChannelGroupHook = {
  groupsQuery: UseQueryResult<ChannelGroupRecord[]>;
  groupForm: UseFormReturn<ChannelGroupInput, unknown, ChannelGroupInput>;
  groupModal: ReturnType<typeof useModalState>;
  editingGroup: ChannelGroupRecord | null;
  openGroupModal: (group?: ChannelGroupRecord) => void;
  saveGroup: (values: ChannelGroupInput) => Promise<void>;
  deleteGroup: (groupId: number) => Promise<void>;
};

type ChannelCategoryHook = {
  categoriesQuery: UseQueryResult<ChannelCategoryRecord[]>;
  categoryForm: UseFormReturn<ChannelCategoryFormValues, unknown, ChannelCategoryInput>;
  categoryModal: ReturnType<typeof useModalState>;
  editingCategory: ChannelCategoryRecord | null;
  openCategoryModal: (category?: ChannelCategoryRecord) => void;
  saveCategory: (values: ChannelCategoryInput) => Promise<void>;
  deleteCategory: (categoryId: number) => Promise<void>;
};

type ChannelHook = {
  channelsQuery: UseQueryResult<ChannelRecord[]>;
  channelForm: UseFormReturn<ChannelFormValues, unknown, ChannelInput>;
  channelModal: ReturnType<typeof useModalState>;
  editingChannel: ChannelRecord | null;
  openChannelModal: (channel?: ChannelRecord) => void;
  saveChannel: (values: ChannelInput) => Promise<void>;
  deleteChannel: (channelId: number) => Promise<void>;
};

export const CHANNEL_BOOLEAN_OPTIONS = [
  { label: "true", value: "true" },
  { label: "false", value: "false" },
] as const;

const CHANNEL_GROUP_KEY = ["channel-groups"] as const;
const CHANNEL_CATEGORY_KEY = ["channel-categories"] as const;
const CHANNEL_KEY = ["channel-channels"] as const;

function useBaseMutation(invalidateKeys: ReadonlyArray<ReadonlyArray<unknown>>) {
  const queryClient = useQueryClient();
  return () => Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

export function parseChannelBooleanInput(value: string) {
  return value === "true";
}

export function parseOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function useChannelGroupsLookup() {
  return useQuery({
    queryKey: CHANNEL_GROUP_KEY,
    queryFn: channelApi.groups.list,
  }) as UseQueryResult<ChannelGroupRecord[]>;
}

export function useChannelCategoriesLookup() {
  return useQuery({
    queryKey: CHANNEL_CATEGORY_KEY,
    queryFn: channelApi.categories.list,
  }) as UseQueryResult<ChannelCategoryRecord[]>;
}

export function useAccountingAccountsLookup() {
  return useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: accountingApi.accounts.list,
  }) as UseQueryResult<AccountingAccountRecord[]>;
}

export function useChannelGroups(): ChannelGroupHook {
  const [editingGroup, setEditingGroup] = useState<ChannelGroupRecord | null>(null);
  const groupModal = useModalState();
  const groupForm = useForm<ChannelGroupInput, unknown, ChannelGroupInput>({
    resolver: zodResolver(channelGroupSchema),
    defaultValues: {
      group_name: "",
    },
  });
  const groupsQuery = useQuery({
    queryKey: CHANNEL_GROUP_KEY,
    queryFn: channelApi.groups.list,
  });
  const invalidate = useBaseMutation([CHANNEL_GROUP_KEY, CHANNEL_CATEGORY_KEY, CHANNEL_KEY]);

  const saveGroup = async (values: ChannelGroupInput) => {
    try {
      const action = editingGroup
        ? channelApi.groups.update(editingGroup.group_id, values)
        : channelApi.groups.create(values);
      await action;
      toast.success(`Channel group ${editingGroup ? "updated" : "created"}`);
      await invalidate();
      setEditingGroup(null);
      groupModal.closeModal();
      groupForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save channel group");
      throw error;
    }
  };

  const deleteGroup = async (groupId: number) => {
    try {
      await channelApi.groups.remove(groupId);
      toast.success("Channel group deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete channel group");
      throw error;
    }
  };

  const openGroupModal = (group?: ChannelGroupRecord) => {
    setEditingGroup(group ?? null);
    groupForm.reset({
      group_name: group?.group_name ?? "",
    });
    groupModal.openModal();
  };

  return {
    groupsQuery,
    groupForm,
    groupModal,
    editingGroup,
    openGroupModal,
    saveGroup,
    deleteGroup,
  };
}

export function useChannelCategories(): ChannelCategoryHook {
  const [editingCategory, setEditingCategory] = useState<ChannelCategoryRecord | null>(null);
  const categoryModal = useModalState();
  const categoryForm = useForm<ChannelCategoryFormValues, unknown, ChannelCategoryInput>({
    resolver: zodResolver(channelCategorySchema),
    defaultValues: {
      group_id: null,
      category_name: "",
    },
  });
  const categoriesQuery = useQuery({
    queryKey: CHANNEL_CATEGORY_KEY,
    queryFn: channelApi.categories.list,
  });
  const invalidate = useBaseMutation([CHANNEL_CATEGORY_KEY, CHANNEL_GROUP_KEY, CHANNEL_KEY]);

  const saveCategory = async (values: ChannelCategoryInput) => {
    try {
      const action = editingCategory
        ? channelApi.categories.update(editingCategory.category_id, values)
        : channelApi.categories.create(values);
      await action;
      toast.success(`Channel category ${editingCategory ? "updated" : "created"}`);
      await invalidate();
      setEditingCategory(null);
      categoryModal.closeModal();
      categoryForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save channel category");
      throw error;
    }
  };

  const deleteCategory = async (categoryId: number) => {
    try {
      await channelApi.categories.remove(categoryId);
      toast.success("Channel category deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete channel category");
      throw error;
    }
  };

  const openCategoryModal = (category?: ChannelCategoryRecord) => {
    setEditingCategory(category ?? null);
    categoryForm.reset({
      group_id: category?.group_id ?? null,
      category_name: category?.category_name ?? "",
    });
    categoryModal.openModal();
  };

  return {
    categoriesQuery,
    categoryForm,
    categoryModal,
    editingCategory,
    openCategoryModal,
    saveCategory,
    deleteCategory,
  };
}

export function useChannels(): ChannelHook {
  const [editingChannel, setEditingChannel] = useState<ChannelRecord | null>(null);
  const channelModal = useModalState();
  const channelForm = useForm<ChannelFormValues, unknown, ChannelInput>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      category_id: null,
      channel_name: "",
      slug: "",
      piutang_account_id: null,
      revenue_account_id: null,
      saldo_account_id: null,
      is_marketplace: false,
    },
  });
  const channelsQuery = useQuery({
    queryKey: CHANNEL_KEY,
    queryFn: channelApi.channels.list,
  });
  const invalidate = useBaseMutation([CHANNEL_KEY, CHANNEL_CATEGORY_KEY]);

  const saveChannel = async (values: ChannelInput) => {
    try {
      const action = editingChannel
        ? channelApi.channels.update(editingChannel.channel_id, values)
        : channelApi.channels.create(values);
      await action;
      toast.success(`Channel ${editingChannel ? "updated" : "created"}`);
      await invalidate();
      setEditingChannel(null);
      channelModal.closeModal();
      channelForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save channel");
      throw error;
    }
  };

  const deleteChannel = async (channelId: number) => {
    try {
      await channelApi.channels.remove(channelId);
      toast.success("Channel deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete channel");
      throw error;
    }
  };

  const openChannelModal = (channel?: ChannelRecord) => {
    setEditingChannel(channel ?? null);
    channelForm.reset({
      category_id: channel?.category_id ?? null,
      channel_name: channel?.channel_name ?? "",
      slug: channel?.slug ?? "",
      piutang_account_id: channel?.piutang_account_id ?? null,
      revenue_account_id: channel?.revenue_account_id ?? null,
      saldo_account_id: channel?.saldo_account_id ?? null,
      is_marketplace: channel?.is_marketplace ?? false,
    });
    channelModal.openModal();
  };

  return {
    channelsQuery,
    channelForm,
    channelModal,
    editingChannel,
    openChannelModal,
    saveChannel,
    deleteChannel,
  };
}
