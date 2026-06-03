export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Module {
  id: number;
  title: string;
  shortTitle: string;
  phase: 1 | 2 | 3 | 4;
  dates: string;
  dateRange: { start: string; end: string };
  status: TaskStatus;
  progress: number;
  notes: string;
  owner: string;
  subTasks: SubTask[];
  dependencies?: string[];
  tags: string[];
}

export interface AppSettings {
  resendApiKey: string;
  fromEmail: string;
  fromName: string;
  directorEmail: string;
  ccEmails: string;
  senderName: string;
}
