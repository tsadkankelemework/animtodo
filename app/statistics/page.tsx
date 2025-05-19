import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardLayout from "@/components/dashboard-layout"
import StatisticsView from "@/components/statistics-view"

export default async function StatisticsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout userId={user.id} userName={user.name}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Statistics</h1>
        <StatisticsView userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
