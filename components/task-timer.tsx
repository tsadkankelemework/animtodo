"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Play, Pause, RotateCcw, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import type { Task } from "@/lib/types"

interface TaskTimerProps {
  task: Task
  onComplete: (taskId: string) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
}

export default function TaskTimer({ task, onComplete, onUpdate }: TaskTimerProps) {
  const { theme } = useTheme()
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [mounted, setMounted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize timer
  useEffect(() => {
    if (task.timerDuration) {
      // Convert minutes to seconds
      const initialTime = task.timerDuration * 60
      setTimeLeft(initialTime)

      // If timer was already started
      if (task.timerStarted && !task.timerEnded) {
        const elapsedSeconds = Math.floor((Date.now() - new Date(task.timerStarted).getTime()) / 1000)
        const remainingTime = initialTime - elapsedSeconds

        if (remainingTime > 0) {
          setTimeLeft(remainingTime)
          setIsRunning(true)
        } else {
          setTimeLeft(0)
          setIsComplete(true)
        }
      }
    }
  }, [task])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setIsRunning(false)
            setIsComplete(true)

            // Update task with end time
            onUpdate(task.id, {
              timerEnded: new Date(),
            })

            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, task.id, onUpdate])

  const startTimer = () => {
    if (!isRunning && timeLeft > 0) {
      setIsRunning(true)

      // Only set start time if not already set
      if (!task.timerStarted) {
        onUpdate(task.id, {
          timerStarted: new Date(),
        })
      }
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setIsComplete(false)
    if (task.timerDuration) {
      setTimeLeft(task.timerDuration * 60)
    }

    // Reset timer data
    onUpdate(task.id, {
      timerStarted: undefined,
      timerEnded: undefined,
    })
  }

  const completeTask = () => {
    onComplete(task.id)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage
  const progress = task.timerDuration ? 100 - (timeLeft / (task.timerDuration * 60)) * 100 : 0

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div
      className={`p-4 rounded-lg ${isDark ? "bg-darkgrey-800/50" : "bg-gray-50"} border ${
        isComplete
          ? isDark
            ? "border-cyan-700"
            : "border-green-200"
          : isDark
            ? "border-darkgrey-700"
            : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Clock className={`h-4 w-4 mr-2 ${isDark ? "text-cyan-400" : "text-purple-500"}`} />
          <h3 className="font-medium">{task.text}</h3>
        </div>
        <div className="text-sm font-mono">{formatTime(timeLeft)}</div>
      </div>

      <div className="relative h-2 w-full bg-gray-200 rounded-full mb-3">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${
            isComplete ? (isDark ? "bg-cyan-400" : "bg-green-500") : isDark ? "bg-cyan-600" : "bg-purple-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex justify-between">
        {isComplete ? (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={resetTimer} className="flex items-center">
              <RotateCcw className="h-4 w-4 mr-1" />
              <span>Reset</span>
            </Button>
            <Button
              size="sm"
              onClick={completeTask}
              className={`flex items-center ${
                isDark ? "bg-cyan-600 hover:bg-cyan-700" : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              <Check className="h-4 w-4 mr-1" />
              <span>Complete Task</span>
            </Button>
          </div>
        ) : (
          <div className="flex space-x-2">
            {isRunning ? (
              <Button variant="outline" size="sm" onClick={pauseTimer} className="flex items-center">
                <Pause className="h-4 w-4 mr-1" />
                <span>Pause</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={startTimer}
                className={`flex items-center ${
                  isDark ? "bg-cyan-600 hover:bg-cyan-700" : "bg-purple-600 hover:bg-purple-700"
                } text-white`}
              >
                <Play className="h-4 w-4 mr-1" />
                <span>Start</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={resetTimer} className="flex items-center">
              <RotateCcw className="h-4 w-4 mr-1" />
              <span>Reset</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
