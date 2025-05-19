"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { Check, X, Trash2, Edit2, Calendar } from "lucide-react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const { theme } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const [isHovered, setIsHovered] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleEdit = () => {
    if (editText.trim() !== "") {
      task.text = editText
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit()
    } else if (e.key === "Escape") {
      setEditText(task.text)
      setIsEditing(false)
    }
  }

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date()

  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        layout
        className={`flex items-center p-3 rounded-lg shadow-sm hover:shadow transition-all border
          ${
            task.completed
              ? isDark
                ? "bg-darkgrey-900/50 border-green-800/30"
                : "bg-green-50 border-green-100"
              : isOverdue
                ? isDark
                  ? "bg-darkgrey-900/50 border-red-800/30"
                  : "bg-red-50 border-red-100"
                : isDark
                  ? "bg-darkgrey-900/50 border-darkgrey-700 hover:border-cyan-800/50"
                  : "bg-white border-purple-100"
          } ${isDark && isHovered ? "border-glow" : ""}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {isEditing ? (
          <div className="flex-1 flex items-center space-x-2">
            <Input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEdit}
              className="flex-1"
              maxLength={100}
            />
            <Button size="sm" variant="ghost" onClick={handleEdit}>
              <Check className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-green-500"}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditText(task.text)
                setIsEditing(false)
              }}
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggle(task.id)}
              className={`flex-shrink-0 w-5 h-5 rounded-full border 
                ${
                  task.completed
                    ? isDark
                      ? "bg-cyan-500 border-cyan-500"
                      : "bg-green-500 border-green-500"
                    : isDark
                      ? "border-cyan-700"
                      : "border-purple-300"
                } 
                mr-3 flex items-center justify-center transition-colors`}
            >
              <AnimatePresence>
                {task.completed && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="flex-1 flex flex-col">
              <motion.span
                layout
                className={`${
                  task.completed
                    ? "text-muted-foreground line-through"
                    : isOverdue
                      ? isDark
                        ? "text-red-400"
                        : "text-destructive"
                      : isDark
                        ? "text-cyan-50"
                        : "text-foreground"
                }`}
                onDoubleClick={() => setIsEditing(true)}
              >
                {task.text}
              </motion.span>

              {task.dueDate && (
                <div className="flex items-center mt-1 text-xs">
                  <Calendar className={`h-3 w-3 mr-1 ${isDark ? "text-cyan-400" : "text-muted-foreground"}`} />
                  <span
                    className={`
                    ${
                      task.completed
                        ? "text-muted-foreground"
                        : isOverdue
                          ? isDark
                            ? "text-red-400 font-medium"
                            : "text-destructive font-medium"
                          : isDark
                            ? "text-cyan-300"
                            : "text-muted-foreground"
                    }
                  `}
                  >
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                    {isOverdue && !task.completed && " (Overdue)"}
                  </span>
                </div>
              )}
            </div>

            <AnimatePresence>
              {(isHovered || task.completed) && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center space-x-1"
                >
                  {!task.completed && (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
                      <Edit2 className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-secondary"}`} />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => onDelete(task.id)} className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
