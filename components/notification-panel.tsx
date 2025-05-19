"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { X, AlertTriangle, Info, CheckCircle } from "lucide-react"
import type { Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface NotificationPanelProps {
  notifications: Notification[]
  onClose: () => void
  onMarkAllRead: () => void
}

export default function NotificationPanel({ notifications, onClose, onMarkAllRead }: NotificationPanelProps) {
  const getIcon = (type: "info" | "success" | "warning" | "error") => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-secondary" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
      case "error":
        return <AlertTriangle className="h-4 w-4 text-accent" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute right-0 top-14 z-50 w-80 bg-card rounded-lg shadow-lg border border-border"
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-medium">Notifications</h3>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="h-8 text-xs">
            Mark all read
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 border-b border-border text-sm ${notification.read ? "bg-card" : "bg-primary/10"}`}
            >
              <div className="flex">
                <div className="mr-3 mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <p>{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
                {!notification.read && <div className="w-2 h-2 rounded-full bg-secondary mt-1"></div>}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
