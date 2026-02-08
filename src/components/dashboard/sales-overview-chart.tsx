"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts"

const data = [
    { month: "Jan", sales: 4500000, targets: 4000000 },
    { month: "Feb", sales: 5200000, targets: 4200000 },
    { month: "Mar", sales: 4800000, targets: 4500000 },
    { month: "Apr", sales: 6100000, targets: 4800000 },
    { month: "May", sales: 5900000, targets: 5000000 },
    { month: "Jun", sales: 7200000, targets: 5500000 },
]

export function SalesOverviewChart() {
    return (
        <Card className="dashboard-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tight">Sales Performance</CardTitle>
                    <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60">
                        Monthly Revenue vs Targets (Cr)
                    </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Target</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="oklch(0.60 0.18 250)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="oklch(0.60 0.18 250)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.90 0.01 250)" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: "oklch(0.5 0.02 250)" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: "oklch(0.5 0.02 250)" }}
                                tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
                                    fontSize: "12px",
                                    fontWeight: "700"
                                }}
                                formatter={(value: any) => [`₹${(Number(value || 0) / 100000).toFixed(1)}L`, "Revenue"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="targets"
                                stroke="oklch(0.90 0.01 250)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="transparent"
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="oklch(0.60 0.18 250)"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
