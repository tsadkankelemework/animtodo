"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { isWithinInterval, addDays, startOfWeek, endOfWeek } from "date-fns"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import TaskInput from "./task-input"
import TaskItem from "./task-item"
import TaskTimer from "./task-timer"
import type { Task } from "@/lib/types"
import PaperCharacter from "./paper-character"

interface TasksViewProps {
  userId: string
  userName: string
}

export default function TasksView({ userId, userName }: TasksViewProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isWriting, setIsWriting] = useState(false)
  const [selectedView, setSelectedView] = useState("all")
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [characterMode, setCharacterMode] = useState<"greeting" | "writing" | "notification" | "idle">("greeting")

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize character animation
  useEffect(() => {
    setCharacterMode("greeting")
    setTimeout(() => setCharacterMode("idle"), 5000)
  }, [])

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(`tasks-${userId}`)
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        // Convert string dates back to Date objects
        const formattedTasks = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          goalStartDate: task.goalStartDate ? new Date(task.goalStartDate) : undefined,
          goalEndDate: task.goalEndDate ? new Date(task.goalEndDate) : undefined,
          timerStarted: task.timerStarted ? new Date(task.timerStarted) : undefined,
          timerEnded: task.timerEnded ? new Date(task.timerEnded) : undefined,
        }))
        setTasks(formattedTasks)
      } catch (error) {
        console.error("Failed to parse saved tasks", error)
      }
    }
  }, [userId])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`tasks-${userId}`, JSON.stringify(tasks))
  }, [tasks, userId])

  const addTask = (
    text: string,
    options: {
      dueDate?: Date
      dueTime?: string
      isRecurring?: boolean
      recurrencePattern?: "daily" | "weekly" | "monthly" | "custom"
      recurrenceInterval?: number
      isGoal?: boolean
      goalStartDate?: Date
      goalEndDate?: Date
      hasTimer?: boolean
      timerDuration?: number
    },
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date(),
      userId,
      dueDate: options.dueDate,
      dueTime: options.dueTime,
      isRecurring: options.isRecurring,
      recurrencePattern: options.recurrencePattern,
      recurrenceInterval: options.recurrenceInterval,
      isGoal: options.isGoal,
      goalStartDate: options.goalStartDate,
      goalEndDate: options.goalEndDate,
      hasTimer: options.hasTimer,
      timerDuration: options.timerDuration,
    }

    setTasks([...tasks, newTask])

    // Show writing animation
    setCharacterMode("writing")
    setTimeout(() => setCharacterMode("idle"), 3000)
  }

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        // If this is a recurring task that's being completed, create the next occurrence
        if (task.isRecurring && !task.completed) {
          createNextOccurrence(task)
        }
        return { ...task, completed: !task.completed }
      }
      return task
    })
    setTasks(updatedTasks)
  }

  const createNextOccurrence = (task: Task) => {
    if (!task.dueDate || !task.isRecurring) return

    let nextDueDate: Date

    switch (task.recurrencePattern) {
      case "daily":
        nextDueDate = addDays(new Date(task.dueDate), task.recurrenceInterval || 1)
        break
      case "weekly":
        nextDueDate = addDays(new Date(task.dueDate), 7 * (task.recurrenceInterval || 1))
        break
      case "monthly":
        const date = new Date(task.dueDate)
        nextDueDate = new Date(date.getFullYear(), date.getMonth() + (task.recurrenceInterval || 1), date.getDate())
        break
      case "custom":
        nextDueDate = addDays(new Date(task.dueDate), task.recurrenceInterval || 1)
        break
      default:
        nextDueDate = addDays(new Date(task.dueDate), 7)
    }

    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date(),
      dueDate: nextDueDate,
    }

    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, ...updates } : task))
    setTasks(updatedTasks)
  }

  const clearCompletedTasks = () => {
    setTasks(tasks.filter((task) => !task.completed))
  }

  // Filter tasks based on selected view
  const getFilteredTasks = () => {
    let filteredTasks = tasks

    // Filter by completion status if needed
    if (!showCompletedTasks) {
      filteredTasks = filteredTasks.filter((task) => !task.completed)
    }

    // Filter by view
    const now = new Date()

    switch (selectedView) {
      case "today":
        return filteredTasks.filter((task) => {
          if (!task.dueDate) return false
          const taskDate = new Date(task.dueDate)
          return (
            taskDate.getDate() === now.getDate() &&
            taskDate.getMonth() === now.getMonth() &&
            taskDate.getFullYear() === now.getFullYear()
          )
        })
      case "week":
        const weekStart = startOfWeek(now)
        const weekEnd = endOfWeek(now)
        return filteredTasks.filter((task) => {
          if (!task.dueDate) return false
          const taskDate = new Date(task.dueDate)
          return isWithinInterval(taskDate, { start: weekStart, end: weekEnd })
        })
      case "upcoming":
        const nextWeek = addDays(now, 7)
        return filteredTasks.filter((task) => {
          if (!task.dueDate) return false
          const taskDate = new Date(task.dueDate)
          return taskDate > now && taskDate <= nextWeek && !task.completed
        })
      case "overdue":
        return filteredTasks.filter((task) => {
          if (!task.dueDate) return false
          if (task.completed) return false
          const taskDate = new Date(task.dueDate)
          return taskDate < now
        })
      case "goals":
        return filteredTasks.filter((task) => task.isGoal)
      case "recurring":
        return filteredTasks.filter((task) => task.isRecurring)
      case "timers":
        return filteredTasks.filter((task) => task.hasTimer)
      default:
        return filteredTasks
    }
  }

  const filteredTasks = getFilteredTasks()
  const isDark = theme === "dark"

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Paper character at the top */}
      <div className="relative h-40 mb-6">
        <PaperCharacter mode={characterMode} position="top-center" userName={userName} />
      </div>

      <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
        <CardContent className="pt-6">
          <TaskInput onAddTask={addTask} onWritingChange={setIsWriting} />
        </CardContent>
      </Card>

      <Tabs defaultValue="all" onValueChange={setSelectedView}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger
              value="overdue"
              className={
                tasks.some((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date())
                  ? isDark
                    ? "text-red-400"
                    : "text-destructive"
                  : ""
              }
            >
              Overdue
            </TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="timers">Timers</TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            className="text-xs"
          >
            {showCompletedTasks ? "Hide Completed" : "Show Completed"}
          </Button>
        </div>

        <TabsContent value="all" className="space-y-4">
          <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>

        <TabsContent value="timers" className="space-y-4">
          <RenderTimerList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        </TabsContent>
      </Tabs>

      {tasks.some((task) => task.completed) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex justify-center mt-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={clearCompletedTasks}
            className={`text-sm hover:text-destructive transition-colors 
              ${isDark ? "border-glow" : ""}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear completed
          </Button>
        </motion.div>
      )}
    </div>
  )
}

interface RenderTaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
}

function RenderTaskList({ tasks, onToggle, onDelete, onUpdate }: RenderTaskListProps) {
  return (
    <AnimatePresence>
      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center text-muted-foreground py-8"
        >
          <p>No tasks found in this category!</p>
        </motion.div>
      ) : (
        tasks
          .sort((a, b) => {
            // Sort by completion status first
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1
            }
            // Then sort by due date if available
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            }
            // Then sort by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
          .map((task) => <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />)
      )}
    </AnimatePresence>
  )
}

function RenderTimerList({ tasks, onToggle, onDelete, onUpdate }: RenderTaskListProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <AnimatePresence>
      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center text-muted-foreground py-8"
        >
          <p>No timer tasks found!</p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div key={task.id} className="relative group">
              <TaskTimer key={task.id} task={task} onComplete={onToggle} onUpdate={onUpdate} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
