export type TeamRoleRecord = {
  id: number;
  role_name: string;
  permissions: string[];
  created_at: string;
  _count?: {
    users: number;
  };
};

export type TeamUserRecord = {
  id: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  roles: {
    id: number;
    role_name: string;
  } | null;
};

export type TeamUsersPayload = {
  users: TeamUserRecord[];
  roles: Array<{
    id: number;
    role_name: string;
  }>;
};
