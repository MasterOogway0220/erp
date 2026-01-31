"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Package,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { dashboardService } from "@/lib/services/db"

interface Stats {
  openEnquiries: number
  pendingQuotations: number
  openNCRs: number
}

export function PendingActions() {
  const [stats, setStats] = useState<Stats>({
    openEnquiries: 0,
    pendingQuotations: 0,
    openNCRs: 0,
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats()
        setStats({
          openEnquiries: data.openEnquiries,
          pendingQuotations: data.pendingQuotations,
          openNCRs: data.openNCRs,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])
  
  const actions = [
    {
      icon: FileText,
      label: "Quotations Pending Approval",
      count: stats.pendingQuotations,
      href: "/sales/quotations",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Clock,
      label: "New Enquiries",
      count: stats.openEnquiries,
      href: "/sales/enquiries",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: AlertTriangle,
      label: "Open NCRs",
      count: stats.openNCRs,
      href: "/qc/ncr",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ]
  
  const hasActions = actions.some(a => a.count > 0)
  
  if (loading) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: "250ms" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Pending Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="animate-fade-in" style={{ animationDelay: "250ms" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Pending Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasActions ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-50 p-3">
              <ClipboardCheck className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-3 text-sm font-medium text-green-600">All caught up!</p>
            <p className="text-xs text-muted-foreground">No pending actions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actions.filter(a => a.count > 0).map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${action.bgColor}`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {action.count}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
