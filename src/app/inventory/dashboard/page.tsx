"use client"

import { useEffect, useState } from 'react'
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Package,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    FileText,
    Warehouse
} from "lucide-react"
import Link from 'next/link'

interface InventorySummary {
    totalQuantity: number
    totalReserved: number
    totalAvailable: number
    qualityStatus: {
        under_inspection: number
        accepted: number
        rejected: number
    }
    lowStockItems: number
}

export default function InventoryDashboard() {
    const [summary, setSummary] = useState<InventorySummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSummary() {
            try {
                const response = await fetch('/api/inventory/summary')
                const data = await response.json()
                if (data.success) {
                    setSummary(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch summary:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSummary()
    }, [])

    if (loading) return <PageLayout title="Inventory Dashboard">Loading...</PageLayout>

    const acceptedPercentage = summary ? (summary.qualityStatus.accepted / summary.totalQuantity) * 100 : 0
    const reservedPercentage = summary ? (summary.totalReserved / summary.totalQuantity) * 100 : 0

    return (
        <PageLayout
            title="Inventory Dashboard"
        >
            {/* 🔴 CRITICAL: Remote visibility for Uttam Sir (REQ-INV-001) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                        <Package className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalQuantity.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Mtrs/Pieces in stock</p>
                    </CardContent>
                </Card>

                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available for Sale</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary?.totalAvailable.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Ready for dispatch</p>
                    </CardContent>
                </Card>

                <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reserved</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{summary?.totalReserved.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Allocated to Sales Orders</p>
                    </CardContent>
                </Card>

                <Card className="bg-red-500/5 border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary?.lowStockItems}</div>
                        <p className="text-xs text-muted-foreground">Items below minimum stock</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
                {/* Quality Breakdown */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Quality Status Breakdown</CardTitle>
                        <CardDescription>Tracing stock through inspection phases</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Accepted</Badge>
                                    <span>{summary?.qualityStatus.accepted.toLocaleString()} units</span>
                                </div>
                                <span className="font-medium">{acceptedPercentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={acceptedPercentage} className="h-2 bg-green-100" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">Under Inspection</Badge>
                                    <span>{summary?.qualityStatus.under_inspection.toLocaleString()} units</span>
                                </div>
                                <span className="font-medium">{((summary?.qualityStatus.under_inspection || 0) / (summary?.totalQuantity || 1) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(summary?.qualityStatus.under_inspection || 0) / (summary?.totalQuantity || 1) * 100} className="h-2 bg-orange-100" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>
                                    <span>{summary?.qualityStatus.rejected.toLocaleString()} units</span>
                                </div>
                                <span className="font-medium">{((summary?.qualityStatus.rejected || 0) / (summary?.totalQuantity || 1) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(summary?.qualityStatus.rejected || 0) / (summary?.totalQuantity || 1) * 100} className="h-2 bg-red-100" />
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions & Links */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Insights</CardTitle>
                        <CardDescription>Focus areas for inventory control</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/inventory/stock?slow_moving=true">
                            <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Slow Moving Stock</p>
                                    <p className="text-xs text-muted-foreground">Items in stock &gt; 90 days</p>
                                </div>
                                <Badge variant="secondary">View</Badge>
                            </div>
                        </Link>

                        <Link href="/inventory/stock?min_stock=true">
                            <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none text-red-600">Low Stock Alerts</p>
                                    <p className="text-xs text-muted-foreground">{summary?.lowStockItems} items require replenishment</p>
                                </div>
                                <Badge variant="destructive">Critical</Badge>
                            </div>
                        </Link>

                        <Link href="/inventory/stock">
                            <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                <Warehouse className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Warehouse Overview</p>
                                    <p className="text-xs text-muted-foreground">Rack and location-wise breakdown</p>
                                </div>
                                <Badge variant="secondary">Check</Badge>
                            </div>
                        </Link>

                        <Link href="/api/inventory/export" target="_blank">
                            <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Inventory Report</p>
                                    <p className="text-xs text-muted-foreground">Export full stock list to Excel</p>
                                </div>
                                <Badge variant="outline">Excel</Badge>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
