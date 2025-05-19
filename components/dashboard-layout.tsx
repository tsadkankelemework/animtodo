"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import Sidebar from "./sidebar"
import ResponsiveContainer from "./responsive-container"
import type { Task } from "@/lib/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  userId: string
  userName: string
}

export default function DashboardLayout({ children, userId, userName }: DashboardLayoutProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load tasks from localStorage on component mount
  useEffect(() => {
    // Load user name if saved
    const savedName = localStorage.getItem(`userName-${userId}`)
    if (savedName) {
      // We don't directly update userName here as it's a prop
      // The reload in profile-settings.tsx will ensure the updated name is used
    }

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
    if (tasks.length > 0) {
      localStorage.setItem(`tasks-${userId}`, JSON.stringify(tasks))
    }
  }, [tasks, userId])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={userName} />
      <div className="md:pl-[240px] min-h-screen">
        <ResponsiveContainer>
          <main className="min-h-screen relative">{children}</main>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
