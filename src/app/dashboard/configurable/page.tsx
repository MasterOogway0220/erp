"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/dashboard/kpi/kpi-card"
import { KPIChart } from "@/components/dashboard/kpi/kpi-charts"
import {
    Users,
    Target,
    BarChart3,
    Settings2,
    Plus,
    Loader2,
    FileSearch,
    CheckCircle2,
    AlertTriangle,
    History
} from "lucide-react"
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function KPIDashboardPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    // Default visible widgets
    const [visibleWidgets, setVisibleWidgets] = useState({
        enquiryConversion: true,
        quotationSuccess: true,
        inventoryValuation: true,
        qcPerformance: true,
        paymentAgeing: true
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/dashboard/kpis')
            const result = await res.json()
            if (res.ok) {
                setData(result.data)
            }
        } catch (err) {
            console.error('Failed to fetch KPI data', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <PageLayout title="KPI Dashboard">
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout title="KPI Dashboard">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Monitoring & Measurement (ISO 9.1)</h2>
                        <p className="text-muted-foreground">Quality Management System Performance Indicators</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Settings2 className="mr-2 h-4 w-4" />
                                Customize Dashboard
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Visible KPI Widgets</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {Object.entries(visibleWidgets).map(([key, value]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={value}
                                            onCheckedChange={(checked) => {
                                                setVisibleWidgets(prev => ({ ...prev, [key]: checked }))
                                            }}
                                        />
                                        <Label htmlFor={key} className="capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </Label>
                                    </div>
                                ))}
                                <Button onClick={() => setOpen(false)} className="w-full mt-4">Save Changes</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {visibleWidgets.enquiryConversion && (
                        <KPICard
                            title="Enquiry Conversion"
                            value={data?.enquiryConversion?.toFixed(1) || 0}
                            unit="%"
                            description="From Enquiry to Quotation"
                            icon={<FileSearch className="h-4 w-4" />}
                        />
                    )}
                    {visibleWidgets.quotationSuccess && (
                        <KPICard
                            title="Quotation Success"
                            value={data?.quotationSuccess?.toFixed(1) || 0}
                            unit="%"
                            description="From Quotation to Order"
                            icon={<CheckCircle2 className="h-4 w-4" />}
                        />
                    )}
                    <KPICard
                        title="Active NCRs"
                        value={5}
                        description="Across all departments"
                        icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                    />
                    <KPICard
                        title="Avg. QC Time"
                        value={data?.qcPerformance?.[0]?.value?.toFixed(1) || 0}
                        unit=" Days"
                        description="From GRN to Inspection"
                        icon={<History className="h-4 w-4" />}
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {visibleWidgets.inventoryValuation && (
                        <KPIChart
                            title="Inventory Valuation (by Category)"
                            data={data?.inventoryValuation || []}
                            type="bar"
                        />
                    )}
                    {visibleWidgets.paymentAgeing && (
                        <KPIChart
                            title="Payment Ageing Analysis"
                            data={data?.paymentAgeing || []}
                            type="pie"
                        />
                    )}
                </div>
            </div>
        </PageLayout>
    )
}
