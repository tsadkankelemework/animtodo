import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardLayout from "@/components/dashboard-layout"
import ProfileSettings from "@/components/profile-settings"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout userId={user.id} userName={user.name}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
        <ProfileSettings user={user} />
      </div>
    </DashboardLayout>
  )
}
