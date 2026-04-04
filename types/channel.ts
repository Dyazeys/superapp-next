export type ChannelGroupRecord = {
  group_id: number;
  group_name: string;
  created_at: string;
  _count?: {
    m_channel_category?: number;
  };
};

export type ChannelCategoryRecord = {
  category_id: number;
  group_id: number | null;
  category_name: string;
  created_at: string;
  m_channel_group?: ChannelGroupRecord | null;
  _count?: {
    m_channel?: number;
  };
};

export type ChannelRecord = {
  channel_id: number;
  category_id: number | null;
  channel_name: string;
  slug: string | null;
  is_marketplace: boolean;
  created_at: string;
  updated_at: string | null;
  m_channel_category?: ChannelCategoryRecord | null;
};
