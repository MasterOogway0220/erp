"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  ShoppingCart,
  AlertTriangle,
  IndianRupee,
  Clock,
} from "lucide-react"
import { useEffect, useState } from "react"
import { dashboardService } from "@/lib/services/db"

interface Stats {
  totalRevenue: number
  activeSalesOrders: number
  pendingQuotations: number
  totalOutstanding: number
  openEnquiries: number
  openNCRs: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    activeSalesOrders: 0,
    pendingQuotations: 0,
    totalOutstanding: 0,
    openEnquiries: 0,
    openNCRs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statsConfig = [
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
      change: "+12.5%",
      trend: "up",
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Active Sales Orders",
      value: stats.activeSalesOrders.toString(),
      change: "In progress",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Quotations",
      value: stats.pendingQuotations.toString(),
      change: "Needs attention",
      trend: "neutral",
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Outstanding Amount",
      value: `₹${(stats.totalOutstanding / 100000).toFixed(1)}L`,
      change: "Due collection",
      trend: "down",
      icon: Clock,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      title: "Open Enquiries",
      value: stats.openEnquiries.toString(),
      change: "New requests",
      trend: stats.openEnquiries > 0 ? "up" : "neutral",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Open NCRs",
      value: stats.openNCRs.toString(),
      change: stats.openNCRs === 0 ? "All clear" : "Pending resolution",
      trend: stats.openNCRs === 0 ? "up" : "down",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statsConfig.map((stat, index) => (
        <Card
          key={stat.title}
          className="dashboard-card group overflow-hidden animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1">
                {stat.trend === "up" ? (
                  <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <TrendingUp className="h-3 w-3 mr-0.5" /> {stat.change}
                  </div>
                ) : stat.trend === "down" ? (
                  <div className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                    <TrendingDown className="h-3 w-3 mr-0.5" /> {stat.change}
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {stat.change}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-1">
              <p className="text-3xl font-black tracking-tighter text-glow-primary">{stat.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">{stat.title}</p>
            </div>

            {/* Subtle progress line for aesthetic flair */}
            <div className="mt-4 h-1 w-full bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full opacity-60 rounded-full transition-all duration-1000 delay-300`}
                style={{
                  width: '65%',
                  backgroundColor: `currentColor`,
                  color: stat.trend === 'down' ? 'var(--color-destructive)' : 'oklch(0.60 0.18 250)'
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
