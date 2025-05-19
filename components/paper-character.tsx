"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

type PaperCharacterProps = {
  mode?: "greeting" | "writing" | "notification" | "idle"
  position?: "top-center" | "side" | "bottom-left"
  userName?: string
}

export default function PaperCharacter({ mode = "idle", position = "top-center", userName = "" }: PaperCharacterProps) {
  const { theme } = useTheme()
  const [currentMode, setCurrentMode] = useState(mode)
  const [writing, setWriting] = useState(false)
  const [blinking, setBlinking] = useState(false)
  const [waving, setWaving] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState("")
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle mode changes
  useEffect(() => {
    if (mode === "greeting") {
      setWaving(true)
      setMessage(userName ? `Hi ${userName}! 👋` : "Hi there! 👋")
      setShowMessage(true)

      // Stop waving after 3 seconds
      const waveTimer = setTimeout(() => {
        setWaving(false)
      }, 3000)

      // Hide message after 5 seconds
      const messageTimer = setTimeout(() => {
        setShowMessage(false)
        setCurrentMode("idle")
      }, 5000)

      return () => {
        clearTimeout(waveTimer)
        clearTimeout(messageTimer)
      }
    } else if (mode === "writing") {
      setWriting(true)
      setMessage("Taking notes...")
      setShowMessage(true)

      // Hide message after 3 seconds but keep writing
      const messageTimer = setTimeout(() => {
        setShowMessage(false)
      }, 3000)

      return () => {
        clearTimeout(messageTimer)
      }
    } else if (mode === "notification") {
      setMessage("Don't forget your tasks!")
      setShowMessage(true)

      // Hide notification after 5 seconds
      const notifTimer = setTimeout(() => {
        setShowMessage(false)
        setCurrentMode("idle")
      }, 5000)

      return () => {
        clearTimeout(notifTimer)
      }
    }

    setCurrentMode(mode)
  }, [mode, userName])

  // Idle animations
  useEffect(() => {
    if (currentMode === "idle") {
      // Blinking animation cycle
      const blinkingInterval = setInterval(() => {
        setBlinking(true)
        setTimeout(() => setBlinking(false), 200)
      }, 3000)

      // Occasional wave
      const randomWaveInterval = setInterval(() => {
        // 20% chance to wave
        if (Math.random() < 0.2) {
          setWaving(true)
          setTimeout(() => setWaving(false), 2000)
        }
      }, 15000)

      return () => {
        clearInterval(blinkingInterval)
        clearInterval(randomWaveInterval)
      }
    }
  }, [currentMode])

  // Check for internet connection changes
  useEffect(() => {
    const handleOnline = () => {
      setMessage("You're back online!")
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
    }

    const handleOffline = () => {
      setMessage("You're offline!")
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!mounted) return null

  const isDark = theme === "dark"

  // Update the position classes based on the position prop
  const positionClasses =
    position === "side"
      ? "absolute -right-40 top-1/2 transform -translate-y-1/2 lg:-right-44"
      : position === "bottom-left"
        ? "fixed bottom-6 left-6"
        : "fixed top-20 left-1/2 transform -translate-x-1/2 z-50" // top-center position

  return (
    <motion.div
      className={`z-50 w-40 h-40 pointer-events-none ${positionClasses}`}
      initial={{
        opacity: 0,
        x: position === "side" ? 20 : 0,
        y: position === "top-center" ? -20 : position === "side" ? 0 : 20,
      }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className={`absolute ${position === "side" ? "-top-16 left-0" : "-top-16 left-12"} 
              bg-card px-4 py-2 rounded-2xl shadow-md text-sm text-card-foreground 
              border border-border min-w-[120px] text-center
              ${isDark ? "border-glow" : ""}`}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {message}
            <div
              className={`absolute -bottom-2 ${position === "side" ? "left-10" : "left-5"} 
              w-4 h-4 bg-card border-b border-r border-border transform rotate-45
              ${isDark ? "border-glow" : ""}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paper character body */}
      <motion.div
        className="relative"
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4, ease: "easeInOut" }}
      >
        {/* Body */}
        <motion.div
          className={`absolute w-28 h-36 rounded-3xl shadow-md transform -rotate-3 border-2 paper-texture
            ${isDark ? "bg-darkgrey-800 border-darkgrey-700 border-glow" : "bg-white border-gray-200"}`}
          whileHover={{ rotate: [-3, 0, -3], transition: { duration: 1 } }}
        >
          {/* Fluffy edges */}
          <motion.div
            className={`absolute -top-1 -left-1 -right-1 h-4 rounded-full opacity-50 
              ${isDark ? "bg-darkgrey-700" : "bg-white"}`}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
          />
          <motion.div
            className={`absolute -bottom-1 -left-1 -right-1 h-4 rounded-full opacity-50
              ${isDark ? "bg-darkgrey-700" : "bg-white"}`}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, delay: 1 }}
          />

          {/* Face */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-20 h-12">
            {/* Eyes */}
            <div className="flex justify-center space-x-6 mt-1">
              <motion.div
                className={`w-3 h-4 rounded-full ${isDark ? "bg-cyan-400" : "bg-black"}`}
                animate={{
                  scaleY: blinking ? 0.1 : 1,
                  x: waving ? -1 : 0,
                }}
                transition={{ duration: 0.1 }}
              />
              <motion.div
                className={`w-3 h-4 rounded-full ${isDark ? "bg-cyan-400" : "bg-black"}`}
                animate={{
                  scaleY: blinking ? 0.1 : 1,
                  x: waving ? -1 : 0,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Cheeks */}
            <div className="flex justify-center space-x-12 mt-2">
              <div className={`w-3 h-2 rounded-full opacity-70 ${isDark ? "bg-cyan-300/50" : "bg-pink-300"}`} />
              <div className={`w-3 h-2 rounded-full opacity-70 ${isDark ? "bg-cyan-300/50" : "bg-pink-300"}`} />
            </div>

            {/* Smile */}
            <motion.div
              className={`mt-1 mx-auto w-8 h-3 border-b-2 rounded-full ${isDark ? "border-cyan-400" : "border-black"}`}
              animate={{
                width: waving ? 10 : 8,
                height: waving ? 4 : 3,
              }}
            />
          </div>

          {/* Waving arm */}
          <motion.div
            className={`absolute top-14 -left-8 w-10 h-3 rounded-full shadow-sm origin-right
              ${isDark ? "bg-darkgrey-700" : "bg-white"}`}
            animate={{
              rotate: waving ? [-30, 30, -30, 30, -30] : [-5, 5, -5],
              x: waving ? -2 : 0,
            }}
            transition={
              waving
                ? { duration: 1, repeat: 2, repeatType: "loop" }
                : { repeat: Number.POSITIVE_INFINITY, duration: 4, ease: "easeInOut" }
            }
          >
            {/* Little hand */}
            <motion.div
              className={`absolute top-0 -right-2 w-4 h-4 rounded-full ${isDark ? "bg-darkgrey-700" : "bg-white"}`}
              animate={{ rotate: waving ? [0, 20, 0] : 0 }}
              transition={{ duration: 1, repeat: waving ? 2 : 0 }}
            />
          </motion.div>

          {/* Writing arm */}
          <motion.div
            className={`absolute top-16 -right-10 w-12 h-3 rounded-full shadow-sm origin-left
              ${isDark ? "bg-darkgrey-700" : "bg-white"}`}
            animate={{
              rotate: writing ? [10, 15, 10, 15, 10] : [0, 5, 0],
              x: writing ? 2 : 0,
            }}
            transition={
              writing
                ? { duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }
                : { repeat: Number.POSITIVE_INFINITY, duration: 4, ease: "easeInOut", delay: 1 }
            }
          >
            {/* Pen */}
            <div className="absolute top-0 right-0 w-6 h-2 bg-cyan-400 rounded-full transform rotate-45">
              <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-600 rounded-full" />
            </div>
          </motion.div>
        </motion.div>

        {/* Paper sheet */}
        <motion.div
          className={`absolute top-12 -right-12 w-20 h-24 border rounded-sm shadow-sm transform rotate-6 paper-texture
            ${isDark ? "bg-darkgrey-900 border-darkgrey-800" : "bg-white border-gray-200"}`}
          animate={{
            rotate: writing ? [6, 8, 6] : 6,
            y: writing ? -2 : 0,
          }}
          transition={{ duration: 1.5, repeat: writing ? Number.POSITIVE_INFINITY : 0 }}
        >
          {/* Paper lines */}
          <div className="mt-4 space-y-3">
            <motion.div
              className={`h-0.5 ml-3 ${isDark ? "bg-darkgrey-700" : "bg-gray-200"}`}
              animate={{ width: writing ? [12, 14, 12] : 12 }}
              transition={{ duration: 2, repeat: writing ? Number.POSITIVE_INFINITY : 0, delay: 0.2 }}
            />
            <motion.div
              className={`h-0.5 ml-3 ${isDark ? "bg-darkgrey-700" : "bg-gray-200"}`}
              animate={{ width: writing ? [14, 10, 14] : 14 }}
              transition={{ duration: 2, repeat: writing ? Number.POSITIVE_INFINITY : 0, delay: 0.4 }}
            />
            <motion.div
              className={`h-0.5 ml-3 ${isDark ? "bg-darkgrey-700" : "bg-gray-200"}`}
              animate={{ width: writing ? [10, 16, 10] : 10 }}
              transition={{ duration: 2, repeat: writing ? Number.POSITIVE_INFINITY : 0, delay: 0.6 }}
            />
            <motion.div
              className={`h-0.5 ml-3 ${isDark ? "bg-darkgrey-700" : "bg-gray-200"}`}
              animate={{ width: writing ? [12, 8, 12] : 12 }}
              transition={{ duration: 2, repeat: writing ? Number.POSITIVE_INFINITY : 0, delay: 0.8 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
