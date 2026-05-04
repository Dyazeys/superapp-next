export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type KpiType = "maximize" | "minimize";
export type KpiApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export type UserBrief = {
  id: string;
  full_name: string;
};

export type TaskTodo = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  creator_id: string;
  assignee_id: string | null;
  due_date: string | null;
  started_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string | null;
};

export type TaskKpi = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: KpiType;
  bobot: number;
  target_value: number;
  realization_value: number;
  unit: string;
  period_start: string;
  period_end: string;
  approval_status: KpiApprovalStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AttendanceStatus = "present" | "late" | "early_leave" | "absent";

export type TaskAttendance = {
  id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
};

export type LeaveType = "izin_direncanakan" | "izin_mendesak";
export type LeaveCategory = "tidak_masuk" | "datang_terlambat" | "pulang_cepat";
export type LeaveStatus = "pending" | "leader_approved" | "manager_acknowledged" | "rejected";

export type TaskLeaveRequest = {
  id: string;
  user_id: string;
  application_date: string;
  type: LeaveType;
  category: LeaveCategory;
  start_date: string;
  end_date: string;
  total_days: number;
  time_value: string | null;
  reason: string;
  attachment_url: string | null;
  status: LeaveStatus;
  leader_approved_at: string | null;
  leader_approved_by: string | null;
  manager_acknowledged_at: string | null;
  manager_acknowledged_by: string | null;
  created_at: string;
  updated_at: string | null;
};

export type TaskEvent = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_team_event: boolean;
  created_at: string;
  updated_at: string | null;
};

export type MeetingStatus = "draft" | "pending" | "approved";

export type TeamMeeting = {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  organizer_id: string;
  participants: string[];
  notes: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string | null;
};

export type MeetingTodoStatus = "todo" | "in_progress" | "done";

export type TeamMeetingTodo = {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: MeetingTodoStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AnnouncementCategory = "umum" | "operasional" | "kebijakan" | "event";
export type AnnouncementStatus = "draft" | "pending" | "published";

export type TeamAnnouncement = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  status: AnnouncementStatus;
  created_at: string;
  updated_at: string | null;
};

export type ApprovalType = "leave" | "announcement" | "meeting_note";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "leader_approved" | "manager_acknowledged";

export type ApprovalRequest = {
  id: string;
  type: ApprovalType;
  source_id: string;
  requester_id: string;
  title: string;
  status: ApprovalStatus;
  decision_note: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Department = {
  id: string;
  name: string;
  parent_id: string | null;
  head_user_id: string | null;
  created_at: string;
};

export type DepartmentMember = {
  id: string;
  department_id: string;
  user_id: string;
  role_title: string;
  created_at: string;
};

export type TeamStructure = {
  department: Department;
  members: Array<{
    user_id: string;
    full_name: string;
    role_title: string;
  }>;
  children: TeamStructure[];
};

export type TaskRoutine = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
};
