"use client"

import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, CheckCircle2, Circle, Clock, Package, Truck, Receipt, AlertCircle, ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const statusConfig: Record<string, { label: string, icon: any, color: string }> = {
    'SO_CONFIRMED': { label: 'Order Confirmed', icon: ShoppingCart, color: 'text-blue-600' },
    'PO_PLACED': { label: 'Material Procured', icon: Package, color: 'text-purple-600' },
    'MATERIAL_RECEIVED': { label: 'Inwarded (GRN)', icon: Package, color: 'text-indigo-600' },
    'UNDER_QC': { label: 'Under Inspection', icon: Clock, color: 'text-yellow-600' },
    'QC_ACCEPTED': { label: 'QC Passed', icon: CheckCircle2, color: 'text-green-600' },
    'QC_REJECTED': { label: 'QC Rejected', icon: AlertCircle, color: 'text-red-600' },
    'READY_TO_DISPATCH': { label: 'Ready to Dispatch', icon: CheckCircle2, color: 'text-emerald-600' },
    'DISPATCHED': { label: 'Dispatched', icon: Truck, color: 'text-cyan-600' },
    'INVOICED': { label: 'Invoiced', icon: Receipt, color: 'text-blue-800' },
    'PAID': { label: 'Payment Received', icon: CheckCircle2, color: 'text-green-800' },
}

const statusOrder = [
    'SO_CONFIRMED',
    'PO_PLACED',
    'MATERIAL_RECEIVED',
    'UNDER_QC',
    'QC_ACCEPTED',
    'READY_TO_DISPATCH',
    'DISPATCHED'
]

export default function OrderTrackingPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<any>(null)
    const [itemHistory, setItemHistory] = useState<Record<string, any[]>>({})

    const [updating, setUpdating] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const [newStatus, setNewStatus] = useState("")
    const [notes, setNotes] = useState("")

    const fetchOrderData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/sales-orders/${id}`)
            const data = await res.json()
            if (res.ok) {
                setOrder(data.data)
                // Fetch history for each item
                const historyPromises = data.data.items.map((item: any) =>
                    fetch(`/api/item-status-history?so_item_id=${item.id}`).then(r => r.json())
                )
                const historyResults = await Promise.all(historyPromises)
                const historyMap: Record<string, any[]> = {}
                data.data.items.forEach((item: any, idx: number) => {
                    historyMap[item.id] = historyResults[idx].data || []
                })
                setItemHistory(historyMap)
            }
        } catch (err) {
            console.error("Failed to fetch tracking data", err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async () => {
        if (!selectedItemId || !newStatus) return
        setUpdating(true)
        try {
            const res = await fetch('/api/item-status-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    so_item_id: selectedItemId,
                    status: newStatus,
                    notes
                })
            })
            if (res.ok) {
                toast.success("Status updated successfully")
                setNewStatus("")
                setNotes("")
                setSelectedItemId(null)
                fetchOrderData()
            } else {
                const err = await res.json()
                toast.error(err.message || "Failed to update status")
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setUpdating(false)
        }
    }

    useEffect(() => {
        fetchOrderData()
    }, [id])

    if (loading) {
        return (
            <PageLayout title="Order Tracking">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageLayout>
        )
    }

    if (!order) {
        return (
            <PageLayout title="Order Tracking">
                <div className="text-center py-20">
                    <p className="text-muted-foreground">Sales order not found.</p>
                    <Button variant="link" onClick={() => router.back()}>Go Back</Button>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout title={`Tracking: ${order.so_number}`}>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Order Lifecycle Tracking</h2>
                            <p className="text-muted-foreground text-sm">
                                Product-by-product status for {order.customer?.name} (PO: {order.customer_po_number})
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {order.items?.map((item: any, idx: number) => {
                        const history = itemHistory[item.id] || []
                        const currentStatus = item.status || 'SO_CONFIRMED'
                        const currentIndex = statusOrder.indexOf(currentStatus)
                        const progress = ((currentIndex + 1) / statusOrder.length) * 100

                        return (
                            <Card key={item.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">ITEM {idx + 1}</span>
                                                <CardTitle className="text-lg leading-none">{item.product?.name || item.product_name}</CardTitle>
                                            </div>
                                            <CardDescription className="font-mono text-xs">
                                                Code: {item.product?.code} | Qty: {item.quantity} {item.uom || 'Nos'}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end">
                                                <Badge className={statusConfig[currentStatus]?.color + " bg-white border shadow-sm px-3 py-1"}>
                                                    {statusConfig[currentStatus]?.label.toUpperCase()}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground mt-1">Last Update: {history[0] ? new Date(history[0].updated_at).toLocaleString() : 'Just Created'}</span>
                                            </div>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedItemId(item.id)}>
                                                        Update Status
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Update Item Status</DialogTitle>
                                                        <DialogDescription>
                                                            Advance the status for {item.product?.name || item.product_name}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label>New Status</Label>
                                                            <Select value={newStatus} onValueChange={setNewStatus}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select next status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Object.entries(statusConfig).map(([val, cfg]) => (
                                                                        <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Notes (Optional)</Label>
                                                            <Textarea
                                                                placeholder="Add details about this status change..."
                                                                value={notes}
                                                                onChange={(e) => setNotes(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setSelectedItemId(null)}>Cancel</Button>
                                                        <Button onClick={handleUpdateStatus} disabled={updating || !newStatus}>
                                                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Confirm Update
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                    <Progress value={progress} className="h-1 mt-4" />
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="relative flex flex-row justify-between items-start w-full px-4 overflow-x-auto pb-4 gap-8">
                                        {statusOrder.map((step, sIdx) => {
                                            const config = statusConfig[step]
                                            const isCompleted = sIdx <= currentIndex
                                            const isCurrent = sIdx === currentIndex
                                            const Icon = config.icon

                                            return (
                                                <div key={step} className="flex flex-col items-center min-w-[100px] relative">
                                                    {/* Connector Line */}
                                                    {sIdx < statusOrder.length - 1 && (
                                                        <div className={`absolute top-5 left-[50%] w-[100%] h-[2px] ${sIdx < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                                                    )}

                                                    <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${isCompleted ? 'border-primary bg-primary text-primary-foreground shadow-md scale-110' : 'border-muted bg-background text-muted-foreground'
                                                        } ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse' : ''}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>

                                                    <div className="mt-4 text-center">
                                                        <p className={`text-[10px] font-bold uppercase tracking-tight ${isCompleted ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>
                                                            {config.label}
                                                        </p>
                                                        {isCompleted && history.find(h => h.status === step) && (
                                                            <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                                                                {new Date(history.find(h => h.status === step).updated_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {history.length > 0 && (
                                        <div className="mt-8 border-t pt-4">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                <Clock className="h-3 w-3" /> Event Log
                                            </h4>
                                            <div className="space-y-3">
                                                {history.map((evt, hIdx) => (
                                                    <div key={evt.id} className="flex gap-3 text-xs">
                                                        <div className="flex flex-col items-center">
                                                            <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                                                            {hIdx < history.length - 1 && <div className="w-[1px] flex-1 bg-muted my-1" />}
                                                        </div>
                                                        <div className="flex-1 pb-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold">{statusConfig[evt.status]?.label}</span>
                                                                <span className="text-[10px] text-muted-foreground font-mono">{new Date(evt.updated_at).toLocaleString()}</span>
                                                            </div>
                                                            {evt.notes && <p className="text-muted-foreground mt-0.5">{evt.notes}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </PageLayout>
    )
}
