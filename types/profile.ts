export type UserProfileRecord = {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  timezone: string | null;
  locale: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ProfilePayload = {
  user: {
    id: string;
    username: string;
    full_name: string | null;
    role_name: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
  };
  profile: UserProfileRecord | null;
};
