export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  userId: string
  dueDate?: Date
  dueTime?: string
  category?: string
  priority?: "low" | "medium" | "high"
  isRecurring?: boolean
  recurrencePattern?: "daily" | "weekly" | "monthly" | "custom"
  recurrenceInterval?: number
  isGoal?: boolean
  goalStartDate?: Date
  goalEndDate?: Date
  hasTimer?: boolean
  timerDuration?: number // in minutes
  timerStarted?: Date
  timerEnded?: Date
}

export interface User {
  id: string
  name: string
  email: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  defaultView: "all" | "today" | "upcoming" | "overdue" | "goals" | "recurring"
  showCompletedTasks: boolean
  notificationsEnabled: boolean
}

export interface Notification {
  id: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: Date
  taskId?: string
}

export interface TaskStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  upcomingTasks: number
  completedThisWeek: number
  completionRate: number
}
