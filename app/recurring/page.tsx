import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardLayout from "@/components/dashboard-layout"
import RecurringTasksView from "@/components/recurring-tasks-view"

export default async function RecurringTasksPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout userId={user.id} userName={user.name}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Recurring Tasks</h1>
        <RecurringTasksView userId={user.id} userName={user.name} />
      </div>
    </DashboardLayout>
  )
}
