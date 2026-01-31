"use client"

import { useAuth } from "@/lib/auth-context"
import { PageLayout } from "@/components/page-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { PendingActions } from "@/components/dashboard/pending-actions"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PageLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back
          </h2>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>

        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentOrders />
          </div>
          <div className="space-y-6">
            <PendingActions />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
