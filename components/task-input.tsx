"use client"

import type React from "react"
import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Calendar, Clock, Mic, RefreshCw, Target, ChevronDown, Timer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import VoiceInput from "./voice-input"
import { format } from "date-fns"

interface TaskInputProps {
  onAddTask: (
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
  ) => void
  onWritingChange?: (isWriting: boolean) => void
}

export default function TaskInput({ onAddTask, onWritingChange }: TaskInputProps) {
  const { theme } = useTheme()
  const [text, setText] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueTime, setDueTime] = useState<string>("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<"daily" | "weekly" | "monthly" | "custom">("daily")
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [isGoal, setIsGoal] = useState(false)
  const [goalStartDate, setGoalStartDate] = useState<Date | undefined>(undefined)
  const [goalEndDate, setGoalEndDate] = useState<Date | undefined>(undefined)
  const [hasTimer, setHasTimer] = useState(false)
  const [timerDuration, setTimerDuration] = useState(25) // Default 25 minutes
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDark = theme === "dark"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onAddTask(text.trim(), {
        dueDate,
        dueTime,
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        isGoal,
        goalStartDate: isGoal ? goalStartDate : undefined,
        goalEndDate: isGoal ? goalEndDate : undefined,
        hasTimer,
        timerDuration: hasTimer ? timerDuration : undefined,
      })

      // Reset form
      setText("")
      setDueDate(undefined)
      setDueTime("")
      setIsRecurring(false)
      setRecurrencePattern("daily")
      setRecurrenceInterval(1)
      setIsGoal(false)
      setGoalStartDate(undefined)
      setGoalEndDate(undefined)
      setHasTimer(false)
      setTimerDuration(25)
      setShowAdvancedOptions(false)

      if (onWritingChange) onWritingChange(false)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
    if (onWritingChange) {
      onWritingChange(e.target.value.length > 0)
    }
  }

  const handleVoiceInput = (voiceText: string) => {
    setText(voiceText)
    if (onWritingChange) {
      onWritingChange(voiceText.length > 0)
    }
  }

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Add a new task..."
              value={text}
              onChange={handleTextChange}
              className={`pr-10 ${
                isDark ? "border-darkgrey-700 focus:border-cyan-700" : "border-purple-200 focus:border-purple-400"
              } transition-all`}
            />
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: text.length > 0 ? 1 : 0.8,
                opacity: text.length > 0 ? 1 : 0,
              }}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${
                isDark ? "text-cyan-400" : "text-purple-400"
              }`}
            >
              {text.length}/100
            </motion.span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowVoiceInput(true)}
            className={cn(isDark ? "border-darkgrey-700" : "border-purple-200")}
          >
            <Mic className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  isDark ? "border-darkgrey-700" : "border-purple-200",
                  dueDate && (isDark ? "text-cyan-400 border-cyan-700" : "text-purple-600 border-purple-400"),
                )}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  isDark ? "border-darkgrey-700" : "border-purple-200",
                  dueTime && (isDark ? "text-cyan-400 border-cyan-700" : "text-purple-600 border-purple-400"),
                )}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-2">
                <h4 className="font-medium">Set Time</h4>
                <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full" />
              </div>
            </PopoverContent>
          </Popover>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={!text.trim()}
              className={`${
                isDark
                  ? "bg-cyan-600 hover:bg-cyan-700"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              } text-white`}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(!!checked)}
              />
              <Label htmlFor="isRecurring" className="text-xs flex items-center cursor-pointer">
                <RefreshCw className="h-3 w-3 mr-1" /> Recurring
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="isGoal" checked={isGoal} onCheckedChange={(checked) => setIsGoal(!!checked)} />
              <Label htmlFor="isGoal" className="text-xs flex items-center cursor-pointer">
                <Target className="h-3 w-3 mr-1" /> Goal
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="hasTimer" checked={hasTimer} onCheckedChange={(checked) => setHasTimer(!!checked)} />
              <Label htmlFor="hasTimer" className="text-xs flex items-center cursor-pointer">
                <Timer className="h-3 w-3 mr-1" /> Timer
              </Label>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-xs flex items-center h-7"
          >
            Advanced
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAdvancedOptions ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {showAdvancedOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-2 border-t border-border"
          >
            {isRecurring && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Recurrence</Label>
                <div className="flex items-center space-x-2">
                  <Select
                    value={recurrencePattern}
                    onValueChange={(value) => setRecurrencePattern(value as "daily" | "weekly" | "monthly" | "custom")}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {recurrencePattern === "custom" && (
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs">Every</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(Number.parseInt(e.target.value) || 1)}
                        className="w-16 h-9"
                      />
                      <Label className="text-xs">days</Label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isGoal && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Goal Period</Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs h-9 ${goalStartDate ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {goalStartDate ? format(goalStartDate, "MMM d, yyyy") : "Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={goalStartDate}
                        onSelect={setGoalStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-xs">to</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs h-9 ${goalEndDate ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {goalEndDate ? format(goalEndDate, "MMM d, yyyy") : "End Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={goalEndDate}
                        onSelect={setGoalEndDate}
                        initialFocus
                        disabled={(date) => (goalStartDate ? date < goalStartDate : date < new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {hasTimer && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Timer Duration</Label>
                  <span className="text-xs font-medium">{timerDuration} minutes</span>
                </div>
                <Slider
                  value={[timerDuration]}
                  min={5}
                  max={120}
                  step={5}
                  onValueChange={(value) => setTimerDuration(value[0])}
                  className={isDark ? "bg-darkgrey-700" : ""}
                />
              </div>
            )}
          </motion.div>
        )}
      </motion.form>

      {showVoiceInput && <VoiceInput onVoiceInput={handleVoiceInput} onClose={() => setShowVoiceInput(false)} />}
    </>
  )
}
