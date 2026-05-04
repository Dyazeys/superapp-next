import { z } from "zod";

export const taskStatusSchema = z.enum(["backlog", "todo", "in_progress", "done"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const todoInputSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(1000).optional().nullable(),
  status: taskStatusSchema.default("backlog"),
  priority: taskPrioritySchema.default("medium"),
  assignee_id: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

export type TodoInput = z.input<typeof todoInputSchema>;

export const kpiTypeSchema = z.enum(["maximize", "minimize"]);
export const kpiApprovalSchema = z.enum(["draft", "pending", "approved", "rejected"]);

export const kpiInputSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(500).optional().nullable(),
  type: kpiTypeSchema.default("maximize"),
  bobot: z.number().int("Bobot harus bilangan bulat").min(1, "Bobot minimal 1"),
  target_value: z.number().min(0, "Target harus >= 0"),
  unit: z.string().min(1, "Satuan wajib diisi").max(50),
  period_start: z.string().min(1, "Periode awal wajib diisi"),
  period_end: z.string().min(1, "Periode akhir wajib diisi"),
  notes: z.string().max(1000).optional().nullable(),
});

export type KpiInput = z.input<typeof kpiInputSchema>;

export const kpiTeamInputSchema = kpiInputSchema.extend({
  user_id: z.string().min(1, "User wajib dipilih"),
});
export type KpiTeamInput = z.input<typeof kpiTeamInputSchema>;

export const kpiRealizationSchema = z.object({
  realization_value: z.number().min(0, "Realisasi harus >= 0"),
});
export type KpiRealizationInput = z.input<typeof kpiRealizationSchema>;

export const leaveTypeSchema = z.enum(["izin_direncanakan", "izin_mendesak"]);
export const leaveCategorySchema = z.enum(["tidak_masuk", "datang_terlambat", "pulang_cepat"]);
export const leaveStatusSchema = z.enum(["pending", "leader_approved", "manager_acknowledged", "rejected"]);

export const leaveRequestInputSchema = z.object({
  type: leaveTypeSchema,
  category: leaveCategorySchema,
  start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
  end_date: z.string().min(1, "Tanggal selesai wajib diisi"),
  time_value: z.string().optional().nullable(),
  reason: z.string().min(1, "Alasan wajib diisi").max(1000),
  attachment_url: z.string().url().optional().nullable(),
}).refine((data) => {
  if (data.category !== "tidak_masuk" && !data.time_value) return false;
  return true;
}, { message: "Jam wajib diisi untuk datang terlambat / pulang cepat", path: ["time_value"] });

export type LeaveRequestInput = z.infer<typeof leaveRequestInputSchema>;

export const eventInputSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(1000).optional().nullable(),
  start_time: z.string().min(1, "Waktu mulai wajib diisi"),
  end_time: z.string().min(1, "Waktu selesai wajib diisi"),
  is_team_event: z.boolean().default(false),
  participants: z.array(z.string()).optional(),
});

export type EventInput = z.input<typeof eventInputSchema>;

export const meetingInputSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  date: z.string().min(1, "Tanggal wajib diisi"),
  start_time: z.string().min(1, "Jam mulai wajib diisi"),
  end_time: z.string().min(1, "Jam selesai wajib diisi"),
  location: z.string().max(200).optional().nullable(),
  participants: z.array(z.string()).optional(),
  notes: z.string().max(10000).optional().nullable(),
});

export type MeetingInput = z.infer<typeof meetingInputSchema>;

export const meetingTodoInputSchema = z.object({
  meeting_id: z.string().min(1, "Meeting wajib dipilih"),
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(1000).optional().nullable(),
  assignee_id: z.string().optional().nullable(),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  due_date: z.string().optional().nullable(),
});

export type MeetingTodoInput = z.infer<typeof meetingTodoInputSchema>;

export const announcementCategorySchema = z.enum(["umum", "operasional", "kebijakan", "event"]);
export const announcementStatusSchema = z.enum(["draft", "pending", "published"]);

export const announcementInputSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  content: z.string().min(1, "Konten wajib diisi").max(10000),
  category: announcementCategorySchema,
  is_pinned: z.boolean().default(false),
});

export type AnnouncementInput = z.input<typeof announcementInputSchema>;

export const approvalTypeSchema = z.enum(["leave", "announcement", "meeting_note"]);
export const approvalStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const approvalDecisionSchema = z.object({
  status: approvalStatusSchema,
  decision_note: z.string().max(500).optional().nullable(),
});

export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;

export const routineInputSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(500).optional().nullable(),
});

export type RoutineInput = z.input<typeof routineInputSchema>;

export const routineTeamInputSchema = routineInputSchema.extend({
  user_id: z.string().min(1, "User wajib dipilih"),
});
export type RoutineTeamInput = z.input<typeof routineTeamInputSchema>;

export const departmentInputSchema = z.object({
  name: z.string().min(1, "Nama department wajib diisi").max(100),
  parent_id: z.string().optional().nullable(),
  head_user_id: z.string().optional().nullable(),
});

export type DepartmentInput = z.infer<typeof departmentInputSchema>;

export const departmentMemberInputSchema = z.object({
  department_id: z.string().min(1),
  user_id: z.string().min(1),
  role_title: z.string().min(1).max(100),
});

export type DepartmentMemberInput = z.infer<typeof departmentMemberInputSchema>;