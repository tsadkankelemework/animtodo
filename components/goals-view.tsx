"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, differenceInDays, isBefore, isAfter } from "date-fns"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Target, AlertTriangle, Trash2 } from "lucide-react"
import type { Task } from "@/lib/types"
import TaskInput from "./task-input"
import PaperCharacter from "./paper-character"

interface GoalsViewProps {
  userId: string
  userName: string
}

export default function GoalsView({ userId, userName }: GoalsViewProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isWriting, setIsWriting] = useState(false)
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
    // Force the task to be a goal
    options.isGoal = true

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
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    setTasks(updatedTasks)
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  // Filter goals
  const goals = tasks.filter((task) => task.isGoal)

  // Calculate goal progress
  const calculateProgress = (goal: Task) => {
    if (!goal.goalStartDate || !goal.goalEndDate) return 0

    const startDate = new Date(goal.goalStartDate)
    const endDate = new Date(goal.goalEndDate)
    const today = new Date()

    // If goal hasn't started yet
    if (isBefore(today, startDate)) return 0

    // If goal is already past end date
    if (isAfter(today, endDate)) return 100

    // Calculate progress percentage
    const totalDays = differenceInDays(endDate, startDate) || 1 // Avoid division by zero
    const daysElapsed = differenceInDays(today, startDate)
    return Math.min(Math.round((daysElapsed / totalDays) * 100), 100)
  }

  // Calculate days remaining
  const calculateDaysRemaining = (goal: Task) => {
    if (!goal.goalEndDate) return 0

    const endDate = new Date(goal.goalEndDate)
    const today = new Date()

    if (isAfter(today, endDate)) return 0

    return differenceInDays(endDate, today)
  }

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="space-y-6">
      {/* Paper character at the top */}
      <div className="relative h-40 mb-6">
        <PaperCharacter mode={characterMode} position="top-center" userName={userName} />
      </div>

      <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
        <CardHeader>
          <CardTitle>Add New Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskInput onAddTask={addTask} onWritingChange={setIsWriting} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Your Goals</h2>

        {goals.length === 0 ? (
          <Card className={`${isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""} p-8 text-center`}>
            <p className="text-muted-foreground">You don't have any goals yet.</p>
            <p className="text-sm mt-2">Add a goal above to get started!</p>
          </Card>
        ) : (
          <AnimatePresence>
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`${isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""} overflow-hidden`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium flex items-center">
                          <Target className={`h-5 w-5 mr-2 ${isDark ? "text-cyan-400" : "text-purple-500"}`} />
                          {goal.text}
                        </h3>

                        {goal.completed ? (
                          <div className="flex items-center mt-1 text-sm">
                            <CheckCircle className={`h-4 w-4 mr-1 ${isDark ? "text-cyan-400" : "text-green-500"}`} />
                            <span className={isDark ? "text-cyan-400" : "text-green-500"}>Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center mt-1 text-sm">
                            <Clock className={`h-4 w-4 mr-1 ${isDark ? "text-cyan-400" : "text-blue-500"}`} />
                            <span>{calculateDaysRemaining(goal)} days remaining</span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant={goal.completed ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleTask(goal.id)}
                          className={goal.completed ? "" : isDark ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                        >
                          {goal.completed ? "Mark Incomplete" : "Mark Complete"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteTask(goal.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Goal timeline */}
                    {goal.goalStartDate && goal.goalEndDate && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{format(new Date(goal.goalStartDate), "MMM d, yyyy")}</span>
                          <span>{format(new Date(goal.goalEndDate), "MMM d, yyyy")}</span>
                        </div>

                        <div className="relative">
                          <Progress value={calculateProgress(goal)} className="h-2" />

                          {/* Today marker */}
                          {(() => {
                            const startDate = new Date(goal.goalStartDate)
                            const endDate = new Date(goal.goalEndDate)
                            const today = new Date()

                            if (isAfter(today, startDate) && isBefore(today, endDate)) {
                              const totalDays = differenceInDays(endDate, startDate) || 1
                              const daysElapsed = differenceInDays(today, startDate)
                              const position = (daysElapsed / totalDays) * 100

                              return (
                                <div
                                  className={`absolute top-0 w-1 h-4 ${isDark ? "bg-cyan-400" : "bg-purple-500"}`}
                                  style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                                >
                                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
                                    Today
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>

                        {/* Status indicators */}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{calculateProgress(goal)}% complete</span>

                          {calculateDaysRemaining(goal) <= 3 && !goal.completed ? (
                            <span className="flex items-center">
                              <AlertTriangle className={`h-3 w-3 mr-1 ${isDark ? "text-red-400" : "text-red-500"}`} />
                              <span className={isDark ? "text-red-400" : "text-red-500"}>
                                {calculateDaysRemaining(goal) === 0
                                  ? "Due today!"
                                  : `${calculateDaysRemaining(goal)} days left!`}
                              </span>
                            </span>
                          ) : (
                            <span>{calculateDaysRemaining(goal)} days remaining</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
