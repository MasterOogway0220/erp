"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { dashboardService } from "@/lib/services/db"

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  partial_dispatch: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

interface SalesOrder {
  id: string
  so_number: string
  customer: { name: string }
  total_amount: number
  currency: string
  status: string
  created_at: string
}

export function RecentOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await dashboardService.getRecentOrders()
        setOrders(data || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])
  
  return (
    <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Sales Orders</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sales/orders" className="text-xs text-muted-foreground hover:text-foreground">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No sales orders yet</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{order.so_number}</span>
                    <Badge variant="secondary" className={statusColors[order.status] || "bg-gray-100"}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{order.customer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {order.currency === "INR" ? "₹" : "$"}
                    {Number(order.total_amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
