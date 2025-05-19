"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { User, Moon, Sun, Save, Upload, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { User as UserType, UserPreferences } from "@/lib/types"

interface ProfileSettingsProps {
  user: UserType
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "system",
    defaultView: "all",
    showCompletedTasks: true,
    notificationsEnabled: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load preferences and profile data from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem(`preferences-${user.id}`)
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences)
        setPreferences(parsedPreferences)

        // Apply theme from preferences
        if (parsedPreferences.theme) {
          setTheme(parsedPreferences.theme)
        }
      } catch (error) {
        console.error("Failed to parse saved preferences", error)
      }
    } else {
      // Set default preferences based on current theme
      setPreferences({
        ...preferences,
        theme: theme || "system",
      })
    }

    // Load profile picture
    const savedProfilePicture = localStorage.getItem(`profilePicture-${user.id}`)
    if (savedProfilePicture) {
      setProfilePicture(savedProfilePicture)
    }

    // Load name
    const savedName = localStorage.getItem(`userName-${user.id}`)
    if (savedName) {
      setName(savedName)
    }
  }, [user.id, setTheme, theme])

  const handleSave = () => {
    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      // Save preferences to localStorage
      localStorage.setItem(`preferences-${user.id}`, JSON.stringify(preferences))

      // Save name to localStorage
      localStorage.setItem(`userName-${user.id}`, name)

      // Save profile picture to localStorage
      if (profilePicture) {
        localStorage.setItem(`profilePicture-${user.id}`, profilePicture)
      }

      // Apply theme
      if (preferences.theme) {
        setTheme(preferences.theme)
      }

      // Update user data in the cookie to reflect changes
      try {
        const userCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user="))
          ?.split("=")[1]

        if (userCookie) {
          const userData = JSON.parse(decodeURIComponent(userCookie))
          userData.name = name

          // Update the cookie with the new user data
          document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=strict`
        }
      } catch (error) {
        console.error("Failed to update user cookie", error)
      }

      setIsSaving(false)
      setSaveSuccess(true)

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)

      // Force a reload to reflect changes throughout the app
      window.location.reload()
    }, 1000)
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setProfilePicture(result)
        localStorage.setItem(`profilePicture-${user.id}`, result)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {profilePicture ? (
                  <AvatarImage src={profilePicture || "/placeholder.svg"} alt={name} />
                ) : (
                  <AvatarFallback className={`text-2xl ${isDark ? "bg-cyan-900" : "bg-purple-100"}`}>
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                onClick={triggerFileInput}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePictureChange}
              />
            </div>
            <Button variant="outline" size="sm" onClick={triggerFileInput}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled className="bg-muted cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">Email cannot be changed after registration.</p>
          </div>
        </CardContent>
      </Card>

      <Card className={isDark ? "bg-darkgrey-900/50 border-darkgrey-700" : ""}>
        <CardHeader>
          <CardTitle>Appearance & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">Customize the appearance of the app</p>
            </div>
            <Select
              value={preferences.theme}
              onValueChange={(value) => setPreferences({ ...preferences, theme: value as "light" | "dark" | "system" })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light" className="flex items-center">
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </SelectItem>
                <SelectItem value="dark" className="flex items-center">
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Default View</Label>
              <p className="text-sm text-muted-foreground">Choose your default task view</p>
            </div>
            <Select
              value={preferences.defaultView}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  defaultView: value as "all" | "today" | "upcoming" | "overdue" | "goals" | "recurring",
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="goals">Goals</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Show Completed Tasks</Label>
              <p className="text-sm text-muted-foreground">Display completed tasks in task lists</p>
            </div>
            <Switch
              checked={preferences.showCompletedTasks}
              onCheckedChange={(checked) => setPreferences({ ...preferences, showCompletedTasks: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications for tasks due within 24 hours</p>
            </div>
            <Switch
              checked={preferences.notificationsEnabled}
              onCheckedChange={(checked) => setPreferences({ ...preferences, notificationsEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className={isDark ? "bg-cyan-600 hover:bg-cyan-700" : ""}>
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2"
              />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-4 rounded-md ${
            isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800"
          } text-center`}
        >
          Settings saved successfully!
        </motion.div>
      )}
    </div>
  )
}
