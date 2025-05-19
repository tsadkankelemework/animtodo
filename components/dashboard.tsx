"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { differenceInDays, startOfWeek, endOfWeek, addDays } from "date-fns"
import { CheckCircle, AlertTriangle, Calendar, BarChart2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Task, TaskStats } from "@/lib/types"
import PaperCharacter from "./paper-character"
import TaskItem from "./task-item"
import Link from "next/link"

interface DashboardProps {
  tasks: Task[]
  userId: string
  userName: string
}

export default function Dashboard({ tasks, userId, userName }: DashboardProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [characterMode, setCharacterMode] = useState<"greeting" | "writing" | "notification" | "idle">("greeting")
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    upcomingTasks: 0,
    completedThisWeek: 0,
    completionRate: 0,
  })

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize character animation
  useEffect(() => {
    setCharacterMode("greeting")
    setTimeout(() => setCharacterMode("idle"), 5000)
  }, [])

  // Calculate stats
  useEffect(() => {
    if (tasks.length === 0) return

    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.completed).length
    const overdueTasks = tasks.filter((task) => !task.completed && task.dueDate && new Date(task.dueDate) < now).length
    const upcomingTasks = tasks.filter(
      (task) =>
        !task.completed &&
        task.dueDate &&
        new Date(task.dueDate) > now &&
        differenceInDays(new Date(task.dueDate), now) <= 7,
    ).length
    const completedThisWeek = tasks.filter(
      (task) =>
        task.completed &&
        task.createdAt &&
        new Date(task.createdAt) >= weekStart &&
        new Date(task.createdAt) <= weekEnd,
    ).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    setStats({
      totalTasks,
      completedTasks,
      overdueTasks,
      upcomingTasks,
      completedThisWeek,
      completionRate,
    })
  }, [tasks])

  // Get upcoming tasks (due within the next 7 days)
  const getUpcomingTasks = () => {
    const now = new Date()
    const nextWeek = addDays(now, 7)

    return tasks
      .filter(
        (task) => !task.completed && task.dueDate && new Date(task.dueDate) > now && new Date(task.dueDate) <= nextWeek,
      )
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        return 0
      })
  }

  const upcomingTasks = getUpcomingTasks()

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="space-y-8">
      {/* Paper character at the top center of the dashboard */}
      <div className="relative h-40 mb-6">
        <PaperCharacter mode={characterMode} position="top-center" userName={userName} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className={`${isDark ? "border-cyan-900/50 bg-darkgrey-900/50" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-green-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completedTasks}/{stats.totalTasks}
              </div>
              <p className="text-xs text-muted-foreground">{stats.completionRate.toFixed(0)}% completion rate</p>
              <div className="mt-3 h-2 w-full rounded-full bg-muted">
                <motion.div
                  className={`h-2 rounded-full ${isDark ? "bg-cyan-400" : "bg-green-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className={`${isDark ? "border-cyan-900/50 bg-darkgrey-900/50" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
              <Calendar className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-blue-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingTasks}</div>
              <p className="text-xs text-muted-foreground">Due in the next 7 days</p>
              <div className="mt-3">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`inline-block h-8 w-2 mx-0.5 rounded-sm ${isDark ? "bg-cyan-900/50" : "bg-blue-100"}`}
                    initial={{ height: 0 }}
                    animate={{
                      height: Math.random() * 24 + 8,
                      backgroundColor:
                        i === 3
                          ? isDark
                            ? "rgb(34 211 238)" // cyan-400
                            : "rgb(59 130 246)" // blue-500
                          : "",
                    }}
                    transition={{
                      duration: 0.5,
                      delay: 0.1 * i,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className={`${isDark ? "border-cyan-900/50 bg-darkgrey-900/50" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${isDark ? "text-red-400" : "text-red-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overdueTasks > 0 ? "Needs immediate attention" : "All caught up!"}
              </p>
              <div className="mt-3">
                <motion.div
                  className={`h-8 w-full rounded-md ${
                    stats.overdueTasks > 0
                      ? isDark
                        ? "bg-red-900/30"
                        : "bg-red-100"
                      : isDark
                        ? "bg-green-900/30"
                        : "bg-green-100"
                  } flex items-center justify-center`}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.5,
                    repeat: stats.overdueTasks > 0 ? Number.POSITIVE_INFINITY : 0,
                    repeatType: "reverse",
                    repeatDelay: 1,
                  }}
                >
                  <span
                    className={`text-xs font-medium ${
                      stats.overdueTasks > 0
                        ? isDark
                          ? "text-red-400"
                          : "text-red-500"
                        : isDark
                          ? "text-green-400"
                          : "text-green-500"
                    }`}
                  >
                    {stats.overdueTasks > 0
                      ? `${stats.overdueTasks} task${stats.overdueTasks > 1 ? "s" : ""} overdue`
                      : "No overdue tasks"}
                  </span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className={`${isDark ? "border-cyan-900/50 bg-darkgrey-900/50" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
              <BarChart2 className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-purple-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedThisWeek}</div>
              <p className="text-xs text-muted-foreground">Tasks completed this week</p>
              <div className="mt-3">
                <div className="flex items-center">
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${isDark ? "bg-cyan-400" : "bg-purple-500"}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${stats.totalTasks > 0 ? (stats.completedThisWeek / stats.totalTasks) * 100 : 0}%`,
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="ml-2 text-xs font-medium">
                    {stats.totalTasks > 0 ? Math.round((stats.completedThisWeek / stats.totalTasks) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Tasks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className={`${isDark ? "border-cyan-900/50 bg-darkgrey-900/50" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Upcoming Tasks</CardTitle>
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="text-xs">
                View All Tasks
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming tasks for the next 7 days!</p>
                <p className="text-sm mt-2">Add some tasks to stay organized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onToggle={() => {}} onDelete={() => {}} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
