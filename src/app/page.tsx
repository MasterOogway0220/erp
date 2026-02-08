"use client"

import { useAuth } from "@/lib/auth-context"
import { PageLayout } from "@/components/page-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { PendingActions } from "@/components/dashboard/pending-actions"
import { SalesOverviewChart } from "@/components/dashboard/sales-overview-chart"
import { Sparkles } from "lucide-react"

export default function Home() {
  const { profile } = useAuth()

  return (
    <PageLayout title="Enterprise Dashboard">
      <div className="max-w-[1600px] mx-auto space-y-10 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3">
              Elite Insights <Sparkles className="h-6 w-6 text-orange-500" />
            </h2>
            <p className="text-muted-foreground font-medium">
              Unified command center for <span className="text-primary font-bold">Steel Operations</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live System Status
          </div>
        </div>

        <StatsCards />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <SalesOverviewChart />
            <RecentOrders />
          </div>
          <div className="space-y-8">
            <PendingActions />
            <div className="rounded-2xl bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -tr-y-1/2 tr-x-1/2 h-64 w-64 bg-white/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />
              <h3 className="text-2xl font-black tracking-tight mb-2">Alpha Performance</h3>
              <p className="text-sm opacity-80 mb-6 font-medium">Your division is performing 22% above the quarterly baseline.</p>
              <button className="bg-white text-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-opacity-90 transition-all active:scale-95">
                View MIS Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
