"use server"

import { cookies } from "next/headers"

// This is a simple mock authentication system for demo purposes
// In a real app, you'd use a proper authentication system

type User = {
  id: string
  name: string
  email: string
}

// This would normally connect to a database
const authenticate = async (email: string, password: string): Promise<User> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // For demo purposes, accept any email that looks valid with any password
  if (!email.includes("@") || password.length < 4) {
    throw new Error("Invalid credentials")
  }

  // Create a mock user
  const user: User = {
    id: Math.random().toString(36).substring(2, 15),
    name: email.split("@")[0],
    email,
  }

  // Store in cookies
  const cookieStore = cookies()
  cookieStore.set("user", JSON.stringify(user), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "strict",
  })

  return user
}

const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (!email.includes("@") || password.length < 6) {
    throw new Error("Invalid input")
  }

  // Create a mock user
  const user: User = {
    id: Math.random().toString(36).substring(2, 15),
    name,
    email,
  }

  // Store in cookies
  const cookieStore = cookies()
  cookieStore.set("user", JSON.stringify(user), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "strict",
  })

  return user
}

const getCurrentUser = async (): Promise<User | null> => {
  const cookieStore = cookies()
  const userCookie = cookieStore.get("user")

  if (!userCookie) {
    return null
  }

  try {
    const user = JSON.parse(userCookie.value) as User

    // If we're on the client side, check for updated user data in localStorage
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem(`userName-${user.id}`)
      if (savedName) {
        user.name = savedName
      }
    }

    return user
  } catch {
    return null
  }
}

const logout = async (): Promise<void> => {
  const cookieStore = cookies()
  cookieStore.delete("user")
}

export { authenticate, registerUser, getCurrentUser, logout }
