"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { dashboardService } from "@/lib/services/db"

const statusDotColors: Record<string, string> = {
  open: "bg-amber-500",
  in_progress: "bg-blue-500",
  partial_dispatch: "bg-orange-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
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
    <Card className="dashboard-card animate-fade-in group" style={{ animationDelay: "200ms" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-muted/50">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight">Recent Activity</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
            Latest Sales Orders & Fulfillments
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="hover:bg-muted font-bold text-xs uppercase tracking-wider text-muted-foreground">
          <Link href="/sales/orders" className="flex items-center">
            Explorer <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground/30">
                <ArrowRight className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">No Active Orders Found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="group/item flex items-center justify-between rounded-xl p-4 transition-all duration-300 hover:bg-muted/50 border border-transparent hover:border-muted-foreground/5 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center font-black text-xs text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                      {order.so_number.slice(-2)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-tight">{order.so_number}</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/30">
                          <div className={`h-1.5 w-1.5 rounded-full ${statusDotColors[order.status] || "bg-slate-400"} animate-pulse`} />
                          <span className="text-[10px] font-black uppercase text-muted-foreground/80">
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">{order.customer?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-base text-glow-primary">
                      {order.currency === "INR" ? "₹" : "$"}
                      {Number(order.total_amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                      {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
