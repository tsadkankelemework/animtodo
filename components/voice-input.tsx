"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

interface VoiceInputProps {
  onVoiceInput: (text: string) => void
  onClose: () => void
}

export default function VoiceInput({ onVoiceInput, onClose }: VoiceInputProps) {
  const { theme } = useTheme()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [recognition, setRecognition] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && mounted) {
      // Check if browser supports SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = "en-US"

        recognitionInstance.onresult = (event: any) => {
          const current = event.resultIndex
          const result = event.results[current]
          const transcriptValue = result[0].transcript
          setTranscript(transcriptValue)
        }

        recognitionInstance.onerror = (event: any) => {
          setError(`Error occurred in recognition: ${event.error}`)
          setIsListening(false)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      } else {
        setError("Your browser does not support speech recognition.")
      }
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [mounted])

  const toggleListening = () => {
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      setTranscript("")
      recognition.start()
      setIsListening(true)
      setError(null)
    }
  }

  const handleSubmit = () => {
    if (transcript.trim()) {
      onVoiceInput(transcript.trim())
      onClose()
    }
  }

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? "bg-black/70" : "bg-black/50"}`}
      onClick={onClose}
    >
      <motion.div
        className={`w-full max-w-md rounded-lg ${isDark ? "bg-darkgrey-900" : "bg-white"} p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Voice Input</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className={`relative h-32 mb-4 rounded-md p-3 overflow-auto ${isDark ? "bg-darkgrey-800" : "bg-gray-100"}`}
        >
          {transcript ? (
            <p>{transcript}</p>
          ) : (
            <p className="text-muted-foreground">
              {isListening ? "Listening... Speak now" : "Click the microphone to start speaking"}
            </p>
          )}

          <AnimatePresence>
            {isListening && (
              <motion.div
                className="absolute bottom-3 right-3"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                exit={{ scale: 0 }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1.5,
                }}
              >
                <div className={`h-3 w-3 rounded-full ${isDark ? "bg-cyan-400" : "bg-red-500"}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <div className="mb-4 p-2 rounded bg-red-100 text-red-600 text-sm">{error}</div>}

        <div className="flex justify-between">
          <Button
            variant={isListening ? "destructive" : "outline"}
            onClick={toggleListening}
            className="flex items-center"
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5 mr-2" /> Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" /> Start Listening
              </>
            )}
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!transcript.trim()}
            className={`${isDark ? "bg-cyan-600 hover:bg-cyan-700" : "bg-purple-600 hover:bg-purple-700"} text-white`}
          >
            Add Task
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
