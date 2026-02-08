"use client"

import { useEffect, useState } from 'react'
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Truck,
    FileText,
    Package,
    ArrowLeft,
    ChevronRight,
    User,
    ExternalLink
} from "lucide-react"
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface TrackingStage {
    status: 'completed' | 'in_progress' | 'pending' | 'failed' | 'ready'
    date?: string
    reference?: string
    heat_number?: string
    expected_date?: string
    result?: string
    quantity?: number
}

interface TrackingItem {
    id: string
    description: string
    quantity: number
    uom: string
    stages: {
        order_received: TrackingStage
        po_sent: TrackingStage
        material_received: TrackingStage
        qc_completed: TrackingStage
        ready_to_dispatch: TrackingStage
        dispatched: TrackingStage
        invoiced: TrackingStage
    }
}

export default function OrderTrackingPage() {
    const { id } = useParams()
    const [tracking, setTracking] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTracking() {
            try {
                const response = await fetch(`/api/sales-orders/${id}/tracking`)
                const data = await response.json()
                if (data.success) {
                    setTracking(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch tracking:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchTracking()
    }, [id])

    if (loading) return <PageLayout title="Order Tracking">Loading...</PageLayout>

    return (
        <PageLayout title={`Tracking: ${tracking?.order_number}`}>
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/sales/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold">{tracking?.order_number}</h2>
                        <p className="text-sm text-muted-foreground">{tracking?.customer}</p>
                    </div>
                </div>

                {tracking?.items.map((item: TrackingItem) => (
                    <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold">{item.description}</CardTitle>
                                    <CardDescription className="text-xs">
                                        Qty: {item.quantity} {item.uom}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-background">
                                    {item.stages.invoiced.status === 'completed' ? 'Fully Invoiced' :
                                        item.stages.dispatched.status === 'completed' ? 'Dispatched' : 'Processing'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 pb-10">
                            <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
                                {/* Connection Line */}
                                <div className="absolute left-0 top-1/2 h-0.5 w-full bg-muted -translate-y-1/2 z-0" />

                                {/* Stages */}
                                <TimelineStep
                                    label="Order Received"
                                    stage={item.stages.order_received}
                                    icon={<FileText className="h-4 w-4" />}
                                />
                                <TimelineStep
                                    label="PO Sent"
                                    stage={item.stages.po_sent}
                                    icon={<User className="h-4 w-4" />}
                                />
                                <TimelineStep
                                    label="Material Recd"
                                    stage={item.stages.material_received}
                                    icon={<Package className="h-4 w-4" />}
                                />
                                <TimelineStep
                                    label="QC Status"
                                    stage={item.stages.qc_completed}
                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                />
                                <TimelineStep
                                    label="Dispatch"
                                    stage={item.stages.dispatched}
                                    icon={<Truck className="h-4 w-4" />}
                                />
                                <TimelineStep
                                    label="Invoice"
                                    stage={item.stages.invoiced}
                                    icon={<FileText className="h-4 w-4" />}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageLayout>
    )
}

function TimelineStep({ label, stage, icon }: { label: string, stage: TrackingStage, icon: React.ReactNode }) {
    const getStatusColor = () => {
        // Check for delay (>3 days is the requirement, but any past date is a delay)
        const isOverdue = stage.expected_date && new Date(stage.expected_date) < new Date() && stage.status !== 'completed'

        if (isOverdue) return 'bg-red-500 text-white border-red-700 animate-bounce'

        switch (stage.status) {
            case 'completed': return 'bg-green-500 text-white border-green-600'
            case 'in_progress':
            case 'ready': return 'bg-orange-500 text-white border-orange-600 animate-pulse'
            case 'failed': return 'bg-red-500 text-white border-red-600'
            default: return 'bg-background text-muted-foreground border-muted'
        }
    }

    const getLabelColor = () => {
        const isOverdue = stage.expected_date && new Date(stage.expected_date) < new Date() && stage.status !== 'completed'
        if (isOverdue) return 'text-red-600 font-bold'
        switch (stage.status) {
            case 'completed': return 'text-green-600 font-medium'
            case 'in_progress':
            case 'ready': return 'text-orange-600 font-medium'
            case 'failed': return 'text-red-600 font-medium'
            default: return 'text-muted-foreground'
        }
    }

    return (
        <div className="relative flex flex-col items-center gap-2 z-10 group">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${getStatusColor()}`}>
                {icon}
            </div>
            <div className="absolute -bottom-8 flex flex-col items-center">
                <span className={`text-[10px] whitespace-nowrap uppercase tracking-wider ${getLabelColor()}`}>{label}</span>
                {stage.date && (
                    <span className="text-[9px] text-muted-foreground">{new Date(stage.date).toLocaleDateString()}</span>
                )}
            </div>

            {/* Hover Tooltip (Simplified) */}
            <div className="absolute top-10 hidden group-hover:flex flex-col bg-popover text-popover-foreground border rounded p-2 text-[10px] w-32 shadow-lg z-50">
                <span className="font-bold border-b pb-1 mb-1">{label}</span>
                {stage.reference && <span>Ref: {stage.reference}</span>}
                {stage.heat_number && <span>Heat: {stage.heat_number}</span>}
                {stage.expected_date && <span>Exp: {new Date(stage.expected_date).toLocaleDateString()}</span>}
                {stage.result && <span className="capitalize">Result: {stage.result}</span>}
                {stage.status === 'pending' && <span className="italic">Stage Pending</span>}
            </div>
        </div>
    )
}
