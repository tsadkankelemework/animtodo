import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardLayout from "@/components/dashboard-layout"
import TimersView from "@/components/timers-view"

export default async function TimersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout userId={user.id} userName={user.name}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Timers</h1>
        <TimersView userId={user.id} userName={user.name} />
      </div>
    </DashboardLayout>
  )
}
