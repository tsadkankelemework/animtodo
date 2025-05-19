"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Plus, Trash2 } from "lucide-react"
import type { Task } from "@/lib/types"
import TaskTimer from "./task-timer"
import PaperCharacter from "./paper-character"

interface TimersViewProps {
  userId: string
  userName: string
}

export default function TimersView({ userId, userName }: TimersViewProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTimerName, setNewTimerName] = useState("")
  const [newTimerDuration, setNewTimerDuration] = useState(25) // Default 25 minutes
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

  const addTimer = () => {
    if (!newTimerName.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTimerName.trim(),
      completed: false,
      createdAt: new Date(),
      userId,
      hasTimer: true,
      timerDuration: newTimerDuration,
    }

    setTasks([...tasks, newTask])
    setNewTimerName("")
    setNewTimerDuration(25)

    // Show writing animation
    setCharacterMode("writing")
    setTimeout(() => setCharacterMode("idle"), 3000)
  }

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    setTasks(updatedTasks)
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, ...updates } : task))
    setTasks(updatedTasks)
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  // Filter timer tasks
  const timerTasks = tasks.filter((task) => task.hasTimer)

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
          <CardTitle>Add New Timer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timerName">Timer Name</Label>
              <Input
                id="timerName"
                placeholder="What are you working on?"
                value={newTimerName}
                onChange={(e) => setNewTimerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="timerDuration">Duration (minutes)</Label>
                <span className="text-sm font-medium">{newTimerDuration} minutes</span>
              </div>
              <Slider
                id="timerDuration"
                value={[newTimerDuration]}
                min={5}
                max={120}
                step={5}
                onValueChange={(value) => setNewTimerDuration(value[0])}
              />
            </div>

            <Button
              onClick={addTimer}
              disabled={!newTimerName.trim()}
              className={`w-full ${isDark ? "bg-cyan-600 hover:bg-cyan-700" : ""}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Timer
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Your Timers</h2>

        {timerTasks.length === 0 ? (
          <Card className={`${isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""} p-8 text-center`}>
            <p className="text-muted-foreground">You don't have any timers yet.</p>
            <p className="text-sm mt-2">Add a timer above to get started!</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {timerTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative group"
                >
                  <TaskTimer task={task} onComplete={toggleTask} onUpdate={updateTask} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
