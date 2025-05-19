"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from "date-fns"
import type { Task } from "@/lib/types"

interface StatisticsViewProps {
  userId: string
}

export default function StatisticsView({ userId }: StatisticsViewProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
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

  // Draw completion rate chart
  useEffect(() => {
    if (!mounted || !canvasRef.current || tasks.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Calculate completion rate
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.completed).length
    const completionRate = (completedTasks / totalTasks) * 100

    // Draw donut chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10
    const isDark = theme === "dark"

    // Background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = isDark ? "#2e2e38" : "#f3f4f6"
    ctx.fill()

    // Progress arc
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (Math.PI * 2 * completionRate) / 100

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.lineTo(centerX, centerY)
    ctx.fillStyle = isDark ? "#22d3ee" : "#8b5cf6"
    ctx.fill()

    // Inner circle (donut hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = isDark ? "#1c1c24" : "#ffffff"
    ctx.fill()

    // Text
    ctx.fillStyle = isDark ? "#ffffff" : "#1f2937"
    ctx.font = "bold 24px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${Math.round(completionRate)}%`, centerX, centerY)

    ctx.font = "12px sans-serif"
    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280"
    ctx.fillText("Completion Rate", centerX, centerY + 24)
  }, [mounted, tasks, theme])

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const weekEnd = endOfWeek(currentWeekStart)
    const daysInWeek = eachDayOfInterval({ start: currentWeekStart, end: weekEnd })

    return daysInWeek.map((day) => {
      const tasksForDay = tasks.filter(
        (task) => task.completed && task.createdAt && isSameDay(new Date(task.createdAt), day),
      )
      return {
        date: day,
        count: tasksForDay.length,
      }
    })
  }

  const weeklyStats = getWeeklyStats()
  const maxTaskCount = Math.max(...weeklyStats.map((day) => day.count), 1)

  // Calculate task type distribution
  const getTaskTypeDistribution = () => {
    const regular = tasks.filter((task) => !task.isGoal && !task.isRecurring && !task.hasTimer).length
    const goals = tasks.filter((task) => task.isGoal).length
    const recurring = tasks.filter((task) => task.isRecurring).length
    const timers = tasks.filter((task) => task.hasTimer).length

    return [
      { name: "Regular", count: regular, color: theme === "dark" ? "#22d3ee" : "#8b5cf6" },
      { name: "Goals", count: goals, color: theme === "dark" ? "#34d399" : "#10b981" },
      { name: "Recurring", count: recurring, color: theme === "dark" ? "#60a5fa" : "#3b82f6" },
      { name: "Timers", count: timers, color: theme === "dark" ? "#f472b6" : "#ec4899" },
    ]
  }

  const taskTypeDistribution = getTaskTypeDistribution()
  const totalTasksByType = taskTypeDistribution.reduce((sum, type) => sum + type.count, 0)

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="types">Task Types</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-64 h-64">
                  <canvas ref={canvasRef} className="w-full h-full" />
                </div>
              </CardContent>
            </Card>

            <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Task Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Total Tasks</span>
                      <span className="font-medium">{tasks.length}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <motion.div
                        className={`h-full rounded-full ${isDark ? "bg-cyan-400" : "bg-purple-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Completed</span>
                      <span className="font-medium">{tasks.filter((task) => task.completed).length}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <motion.div
                        className={`h-full rounded-full ${isDark ? "bg-green-400" : "bg-green-500"}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            tasks.length > 0 ? (tasks.filter((task) => task.completed).length / tasks.length) * 100 : 0
                          }%`,
                        }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Overdue</span>
                      <span className="font-medium">
                        {
                          tasks.filter((task) => !task.completed && task.dueDate && new Date(task.dueDate) < new Date())
                            .length
                        }
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <motion.div
                        className={`h-full rounded-full ${isDark ? "bg-red-400" : "bg-red-500"}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            tasks.length > 0
                              ? (
                                  tasks.filter(
                                    (task) => !task.completed && task.dueDate && new Date(task.dueDate) < new Date(),
                                  ).length / tasks.length
                                ) * 100
                              : 0
                          }%`,
                        }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Goals</span>
                      <span className="font-medium">{tasks.filter((task) => task.isGoal).length}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <motion.div
                        className={`h-full rounded-full ${isDark ? "bg-blue-400" : "bg-blue-500"}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            tasks.length > 0 ? (tasks.filter((task) => task.isGoal).length / tasks.length) * 100 : 0
                          }%`,
                        }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Weekly Completion</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4 text-center">
                {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart), "MMM d, yyyy")}
              </div>

              <div className="h-64 flex items-end justify-between">
                {weeklyStats.map((day, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <motion.div
                      className={`w-full max-w-[40px] ${isDark ? "bg-cyan-600" : "bg-purple-500"} rounded-t-md mx-1`}
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.count / maxTaskCount) * 200}px` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                    <div className="mt-2 text-xs text-center">
                      <div>{format(day.date, "EEE")}</div>
                      <div className="text-muted-foreground">{day.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
            <CardHeader>
              <CardTitle className="text-lg">Task Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-8">
                <div className="w-64 h-64 relative">
                  {taskTypeDistribution.map((type, index) => {
                    const startPercent = taskTypeDistribution.slice(0, index).reduce((sum, t) => sum + t.count, 0)
                    const percent = type.count / totalTasksByType
                    const startAngle = (startPercent / totalTasksByType) * 360
                    const endAngle = ((startPercent + type.count) / totalTasksByType) * 360
                    const startRad = (startAngle - 90) * (Math.PI / 180)
                    const endRad = (endAngle - 90) * (Math.PI / 180)
                    const x1 = 32 + 32 * Math.cos(startRad)
                    const y1 = 32 + 32 * Math.sin(startRad)
                    const x2 = 32 + 32 * Math.cos(endRad)
                    const y2 = 32 + 32 * Math.sin(endRad)
                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                    return (
                      <motion.div
                        key={type.name}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <svg width="100%" height="100%" viewBox="0 0 64 64">
                          <path
                            d={`M 32 32 L ${x1} ${y1} A 32 32 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={type.color}
                            stroke={isDark ? "#1c1c24" : "#ffffff"}
                            strokeWidth="0.5"
                          />
                        </svg>
                      </motion.div>
                    )
                  })}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-24 h-24 rounded-full ${
                        isDark ? "bg-darkgrey-900" : "bg-white"
                      } flex items-center justify-center`}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold">{tasks.length}</div>
                        <div className="text-xs text-muted-foreground">Total Tasks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {taskTypeDistribution.map((type) => (
                  <div key={type.name} className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: type.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm">{type.name}</span>
                        <span className="text-sm font-medium">{type.count}</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full mt-1">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: type.color }}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${totalTasksByType > 0 ? (type.count / totalTasksByType) * 100 : 0}%`,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
