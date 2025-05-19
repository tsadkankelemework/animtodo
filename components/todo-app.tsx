"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { Trash2, LogOut, Bell } from "lucide-react"
import type { Task, Notification } from "@/lib/types"
import TaskItem from "./task-item"
import TaskInput from "./task-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Confetti from "./confetti"
import PaperCharacter from "./paper-character"
import NotificationPanel from "./notification-panel"
import { ThemeToggle } from "./theme-toggle"
import { logout } from "@/lib/auth"
import { useTheme } from "next-themes"

interface TodoAppProps {
  userId: string
  userName: string
}

export default function TodoApp({ userId, userName }: TodoAppProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [characterMode, setCharacterMode] = useState<"greeting" | "writing" | "notification" | "idle">("greeting")
  const [isWriting, setIsWriting] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("all")
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load tasks from localStorage on component mount
  useEffect(() => {
    // Show greeting animation on load
    setCharacterMode("greeting")
    setTimeout(() => setCharacterMode("idle"), 5000)

    // Load tasks
    const savedTasks = localStorage.getItem(`tasks-${userId}`)
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        // Convert string dates back to Date objects
        const formattedTasks = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        }))
        setTasks(formattedTasks)
      } catch (error) {
        console.error("Failed to parse saved tasks", error)
      }
    }

    // Create welcome notification
    addNotification({
      id: Date.now().toString(),
      message: `Welcome back, ${userName}!`,
      type: "info",
      read: false,
      createdAt: new Date(),
    })

    // Check for internet connection
    if (!navigator.onLine) {
      addNotification({
        id: (Date.now() + 1).toString(),
        message: "You're currently offline. Changes will be saved locally.",
        type: "warning",
        read: false,
        createdAt: new Date(),
      })
    }
  }, [userId, userName])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`tasks-${userId}`, JSON.stringify(tasks))
  }, [tasks, userId])

  // Character animation changes based on user action
  useEffect(() => {
    if (isWriting) {
      setCharacterMode("writing")
    } else if (characterMode === "writing") {
      setCharacterMode("idle")
    }
  }, [isWriting, characterMode])

  const addTask = (text: string, dueDate?: Date) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date(),
      userId,
      dueDate,
    }

    setTasks([...tasks, newTask])

    // Add a notification if the task has a due date
    if (dueDate) {
      addNotification({
        id: `due-${newTask.id}`,
        message: `New task "${text}" due on ${format(dueDate, "MMM d, yyyy")}`,
        type: "info",
        read: false,
        createdAt: new Date(),
      })
    }
  }

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))

    setTasks(updatedTasks)

    // Check if this completion should trigger confetti
    const justCompleted = updatedTasks.find((task) => task.id === id)?.completed
    if (justCompleted) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)

      // Add notification
      addNotification({
        id: `completed-${id}`,
        message: "Great job completing your task! 🎉",
        type: "success",
        read: false,
        createdAt: new Date(),
      })
    }
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const clearCompletedTasks = () => {
    setTasks(tasks.filter((task) => !task.completed))
  }

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev])

    // Show notification character
    setCharacterMode("notification")
    setTimeout(() => {
      if (characterMode !== "writing") {
        setCharacterMode("idle")
      }
    }, 5000)
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // Filter tasks by selected date
  const getFilteredTasks = () => {
    if (selectedDate === "all") {
      return tasks
    }

    if (selectedDate === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() === today.getTime()
      })
    }

    if (selectedDate === "upcoming") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() > today.getTime()
      })
    }

    if (selectedDate === "overdue") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return tasks.filter((task) => {
        if (!task.dueDate) return false
        if (task.completed) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() < today.getTime()
      })
    }

    return tasks
  }

  const filteredTasks = getFilteredTasks()
  const unreadNotifications = notifications.filter((n) => !n.read).length
  const isDark = theme === "dark"

  if (!mounted) return null

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      {showConfetti && <Confetti />}

      {/* Welcome header with username */}
      <motion.div
        className="w-full mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={`text-3xl font-bold ${isDark ? "text-cyan-400 text-glow animate-glow" : "text-primary"}`}>
          Welcome, {userName}!
        </h1>
        <p className="text-muted-foreground mt-2">Let's organize your day</p>
      </motion.div>

      {/* Paper character positioned at the top center */}
      <div className="relative h-40 mb-6 w-full">
        <PaperCharacter mode={characterMode} position="top-center" userName={userName} />
      </div>

      <div className="w-full flex justify-end mb-4">
        <div className="flex space-x-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative ${isDark ? "border-glow" : ""}`}
          >
            <Bell className={`h-5 w-5 ${isDark ? "text-cyan-400" : ""}`} />
            {unreadNotifications > 0 && (
              <Badge
                className={`absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center 
                ${isDark ? "bg-cyan-400 text-black" : "bg-accent"}`}
              >
                {unreadNotifications}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={handleLogout} className={isDark ? "border-glow" : ""}>
            <LogOut className={`h-5 w-5 ${isDark ? "text-cyan-400" : ""}`} />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkAllRead={markAllNotificationsAsRead}
          />
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card
            className={`shadow-xl border-none bg-card/90 backdrop-blur-sm 
            ${isDark ? "border-glow" : ""}`}
          >
            <CardHeader className="pb-3">
              <CardTitle
                className={`text-2xl font-bold text-center 
                ${isDark ? "text-cyan-400 text-glow" : "text-primary"}`}
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center justify-center"
                >
                  <span className="mr-2">✨</span> My Todo List <span className="ml-2">✨</span>
                </motion.div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <TaskInput onAddTask={addTask} onWritingChange={setIsWriting} />

              <Tabs defaultValue="all" className="mt-6">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="all" onClick={() => setSelectedDate("all")}>
                    All
                  </TabsTrigger>
                  <TabsTrigger value="today" onClick={() => setSelectedDate("today")}>
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" onClick={() => setSelectedDate("upcoming")}>
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger
                    value="overdue"
                    onClick={() => setSelectedDate("overdue")}
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
                </TabsList>

                <TabsContent value="all" className="space-y-2">
                  <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} />
                </TabsContent>

                <TabsContent value="today" className="space-y-2">
                  <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} />
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-2">
                  <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} />
                </TabsContent>

                <TabsContent value="overdue" className="space-y-2">
                  <RenderTaskList tasks={filteredTasks} onToggle={toggleTask} onDelete={deleteTask} />
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Paper character positioned beside the to-do list */}
        <PaperCharacter mode={characterMode} position="side" userName={userName} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center text-sm text-muted-foreground"
      >
        <p>Double-click to edit • Add due dates with calendar</p>
      </motion.div>
    </div>
  )
}

interface RenderTaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function RenderTaskList({ tasks, onToggle, onDelete }: RenderTaskListProps) {
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
