import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardLayout from "@/components/dashboard-layout"
import Dashboard from "@/components/dashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Load tasks from localStorage (server component)
  let tasks = []
  if (typeof window !== "undefined") {
    const savedTasks = localStorage.getItem(`tasks-${user.id}`)
    if (savedTasks) {
      try {
        tasks = JSON.parse(savedTasks)
      } catch (error) {
        console.error("Failed to parse saved tasks", error)
      }
    }
  }

  return (
    <DashboardLayout userId={user.id} userName={user.name}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <Dashboard userId={user.id} userName={user.name} tasks={tasks} />
      </div>
    </DashboardLayout>
  )
}
