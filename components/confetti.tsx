"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"

interface ConfettiPiece {
  x: number
  y: number
  size: number
  color: string
  rotation: number
  xVel: number
  yVel: number
  rotVel: number
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const confettiPieces = useRef<ConfettiPiece[]>([])
  const animationRef = useRef<number>(0)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Generate confetti pieces with theme-appropriate colors
    const isDark = theme === "dark"

    const lightColors = [
      "#FF5252", // Red
      "#FF4081", // Pink
      "#E040FB", // Purple
      "#7C4DFF", // Deep Purple
      "#536DFE", // Indigo
      "#448AFF", // Blue
      "#40C4FF", // Light Blue
      "#18FFFF", // Cyan
      "#64FFDA", // Teal
      "#69F0AE", // Green
      "#B2FF59", // Light Green
      "#EEFF41", // Lime
    ]

    const darkColors = [
      "#FF7B7B", // Lighter Red
      "#FF79B0", // Lighter Pink
      "#EA80FC", // Lighter Purple
      "#B388FF", // Lighter Deep Purple
      "#8C9EFF", // Lighter Indigo
      "#82B1FF", // Lighter Blue
      "#80D8FF", // Lighter Light Blue
      "#84FFFF", // Lighter Cyan
      "#A7FFEB", // Lighter Teal
      "#B9F6CA", // Lighter Green
      "#CCFF90", // Lighter Light Green
      "#F4FF81", // Lighter Lime
    ]

    const colors = isDark ? darkColors : lightColors

    const generateConfetti = () => {
      const pieces: ConfettiPiece[] = []
      const count = Math.floor(window.innerWidth / 10) // Adjust density based on screen width

      for (let i = 0; i < count; i++) {
        pieces.push({
          x: Math.random() * canvas.width,
          y: -20 - Math.random() * 100, // Start above the viewport
          size: 5 + Math.random() * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          xVel: -1 + Math.random() * 2,
          yVel: 1 + Math.random() * 3,
          rotVel: -3 + Math.random() * 6,
        })
      }

      return pieces
    }

    confettiPieces.current = generateConfetti()

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let stillActive = false

      confettiPieces.current.forEach((piece) => {
        // Update position
        piece.x += piece.xVel
        piece.y += piece.yVel
        piece.rotation += piece.rotVel

        // Apply gravity and wind
        piece.yVel += 0.1
        piece.xVel += 0.01

        // Check if piece is still in view
        if (piece.y < canvas.height + 100) {
          stillActive = true
        }

        // Draw the piece
        ctx.save()
        ctx.translate(piece.x, piece.y)
        ctx.rotate((piece.rotation * Math.PI) / 180)

        // Draw a rectangle or square
        ctx.fillStyle = piece.color
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size)

        ctx.restore()
      })

      if (stillActive) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [theme])

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )
}
