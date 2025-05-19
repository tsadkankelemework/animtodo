"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { format, addDays, addWeeks, addMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, CalendarIcon, RefreshCw } from "lucide-react"
import type { Task } from "@/lib/types"
import TaskItem from "./task-item"
import PaperCharacter from "./paper-character"

interface RecurringTasksViewProps {
  userId: string
  userName: string
}

export default function RecurringTasksView({ userId, userName }: RecurringTasksViewProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [characterMode, setCharacterMode] = useState<"greeting" | "writing" | "notification" | "idle">("greeting")
  const [newTaskText, setNewTaskText] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [recurrencePattern, setRecurrencePattern] = useState<"daily" | "weekly" | "monthly" | "custom">("weekly")
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [showCompleted, setShowCompleted] = useState(true)

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

  const addRecurringTask = () => {
    if (!newTaskText.trim() || !startDate) return

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date(),
      userId,
      dueDate: startDate,
      isRecurring: true,
      recurrencePattern,
      recurrenceInterval,
    }

    setTasks([...tasks, newTask])
    setNewTaskText("")
    setStartDate(new Date())
    setRecurrencePattern("weekly")
    setRecurrenceInterval(1)

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

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const createNextOccurrence = (task: Task) => {
    if (!task.dueDate) return

    let nextDueDate: Date

    switch (task.recurrencePattern) {
      case "daily":
        nextDueDate = addDays(new Date(task.dueDate), task.recurrenceInterval || 1)
        break
      case "weekly":
        nextDueDate = addWeeks(new Date(task.dueDate), task.recurrenceInterval || 1)
        break
      case "monthly":
        nextDueDate = addMonths(new Date(task.dueDate), task.recurrenceInterval || 1)
        break
      case "custom":
        nextDueDate = addDays(new Date(task.dueDate), task.recurrenceInterval || 1)
        break
      default:
        nextDueDate = addWeeks(new Date(task.dueDate), 1)
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

  // Filter recurring tasks
  const recurringTasks = tasks.filter((task) => task.isRecurring && (showCompleted || !task.completed))

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
          <CardTitle>Add Recurring Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskText">Task Description</Label>
              <Input
                id="taskText"
                placeholder="Enter task description"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !startDate ? "text-muted-foreground" : ""
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Recurrence Pattern</Label>
                <Select
                  value={recurrencePattern}
                  onValueChange={(value) => setRecurrencePattern(value as "daily" | "weekly" | "monthly" | "custom")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {recurrencePattern === "custom" && (
              <div className="space-y-2">
                <Label>Repeat every</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Number.parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span>days</span>
                </div>
              </div>
            )}

            <Button
              onClick={addRecurringTask}
              disabled={!newTaskText.trim() || !startDate}
              className={`w-full ${isDark ? "bg-cyan-600 hover:bg-cyan-700" : ""}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring Task
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Recurring Tasks</h2>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showCompleted"
            checked={showCompleted}
            onCheckedChange={(checked) => setShowCompleted(!!checked)}
          />
          <Label htmlFor="showCompleted" className="text-sm cursor-pointer">
            Show completed
          </Label>
        </div>
      </div>

      {recurringTasks.length === 0 ? (
        <Card className={`${isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""} p-8 text-center`}>
          <p className="text-muted-foreground">You don't have any recurring tasks yet.</p>
          <p className="text-sm mt-2">Add a recurring task above to get started!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {recurringTasks
              .sort((a, b) => {
                // Sort by completion status first
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1
                }
                // Then sort by due date
                if (a.dueDate && b.dueDate) {
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                }
                return 0
              })
              .map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="group relative">
                    <TaskItem task={task} onToggle={toggleTask} onDelete={deleteTask} />
                    <div className="absolute top-3 right-3 flex items-center space-x-1">
                      <RefreshCw className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-purple-500"}`} />
                      <span className="text-xs text-muted-foreground">
                        {task.recurrencePattern === "daily"
                          ? "Daily"
                          : task.recurrencePattern === "weekly"
                            ? "Weekly"
                            : task.recurrencePattern === "monthly"
                              ? "Monthly"
                              : `Every ${task.recurrenceInterval} days`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
