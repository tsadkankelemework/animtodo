"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Home, CheckSquare, Clock, BarChart2, Settings, Menu, X, Target, RefreshCw, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/auth"

interface SidebarProps {
  userName: string
}

export default function Sidebar({ userName }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Load profile picture and name
  useEffect(() => {
    if (mounted) {
      // Get user ID from localStorage
      const userCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user="))
        ?.split("=")[1]

      if (userCookie) {
        try {
          const user = JSON.parse(decodeURIComponent(userCookie))

          // Load saved profile picture
          const savedProfilePicture = localStorage.getItem(`profilePicture-${user.id}`)
          if (savedProfilePicture) {
            setProfilePicture(savedProfilePicture)
          }

          // Load saved user name
          const savedUserName = localStorage.getItem(`userName-${user.id}`)
          if (savedUserName && savedUserName !== userName) {
            // We don't directly update userName as it's a prop
            // The reload in profile-settings.tsx will ensure the updated name is used
          }
        } catch (error) {
          console.error("Failed to parse user cookie", error)
        }
      }
    }
  }, [mounted, userName])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  if (!mounted) return null

  const isDark = theme === "dark"
  const navItems = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Tasks", icon: CheckSquare, path: "/tasks" },
    { name: "Goals", icon: Target, path: "/goals" },
    { name: "Recurring", icon: RefreshCw, path: "/recurring" },
    { name: "Timers", icon: Clock, path: "/timers" },
    { name: "Statistics", icon: BarChart2, path: "/statistics" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ]

  const sidebarVariants = {
    expanded: { width: "240px" },
    collapsed: { width: "72px" },
  }

  const mobileMenuVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  }

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="fixed top-4 left-4 z-50 md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <motion.div
        className={cn(
          "fixed top-0 left-0 h-full z-50 bg-card border-r border-border flex flex-col",
          isMobile ? "shadow-xl" : "",
        )}
        variants={isMobile ? mobileMenuVariants : sidebarVariants}
        initial={isMobile ? "closed" : "expanded"}
        animate={isMobile ? (isOpen ? "open" : "closed") : isCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && !isMobile && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-xl font-bold ${isDark ? "text-cyan-400" : "text-primary"}`}
            >
              My Todo List
            </motion.h1>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className={isMobile ? "ml-auto" : ""}>
            {isMobile ? (
              <X className="h-5 w-5" />
            ) : isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* User info */}
        <div className="flex items-center p-4 border-b border-border">
          <Avatar className="h-8 w-8">
            {profilePicture ? (
              <AvatarImage src={profilePicture || "/placeholder.svg"} alt={userName} />
            ) : (
              <AvatarFallback className={isDark ? "bg-cyan-900" : "bg-purple-100"}>
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link href={item.path}>
                  <Button
                    variant={pathname === item.path ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      pathname === item.path && (isDark ? "bg-cyan-900/30 hover:bg-cyan-900/40 text-cyan-400" : ""),
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </motion.div>
    </>
  )
}
