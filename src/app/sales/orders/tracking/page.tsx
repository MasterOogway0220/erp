"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Package, CheckCircle2, Clock, XCircle, Truck, FileText, DollarSign, Loader2 } from "lucide-react"

function OrderTrackingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchType, setSearchType] = useState<"po" | "product" | "heat" | "so">("so")
    const [loading, setLoading] = useState(false)
    const [orderItems, setOrderItems] = useState<any[]>([])

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append(searchType, searchQuery)

            const res = await fetch(`/api/sales-order-items?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setOrderItems(data.data)
            }
        } catch (error) {
            console.error("Search failed")
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SO_CONFIRMED':
                return <FileText className="h-4 w-4" />
            case 'PO_PLACED':
                return <Package className="h-4 w-4" />
            case 'MATERIAL_RECEIVED':
                return <Truck className="h-4 w-4" />
            case 'UNDER_QC':
                return <Clock className="h-4 w-4" />
            case 'QC_ACCEPTED':
                return <CheckCircle2 className="h-4 w-4" />
            case 'QC_REJECTED':
                return <XCircle className="h-4 w-4" />
            case 'READY_TO_DISPATCH':
                return <Package className="h-4 w-4" />
            case 'DISPATCHED':
                return <Truck className="h-4 w-4" />
            case 'INVOICED':
                return <FileText className="h-4 w-4" />
            case 'PAID':
                return <DollarSign className="h-4 w-4" />
            default:
                return <Clock className="h-4 w-4" />
        }
    }

    const getStatusColor = (status: string) => {
        if (['PAID', 'DISPATCHED', 'QC_ACCEPTED'].includes(status)) return 'bg-green-100 text-green-800'
        if (['UNDER_QC', 'MATERIAL_RECEIVED', 'PO_PLACED'].includes(status)) return 'bg-blue-100 text-blue-800'
        if (['QC_REJECTED'].includes(status)) return 'bg-red-100 text-red-800'
        return 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const statusFlow = [
        'SO_CONFIRMED',
        'PO_PLACED',
        'MATERIAL_RECEIVED',
        'UNDER_QC',
        'QC_ACCEPTED',
        'READY_TO_DISPATCH',
        'DISPATCHED',
        'INVOICED',
        'PAID'
    ]

    const getStatusProgress = (currentStatus: string) => {
        const currentIndex = statusFlow.indexOf(currentStatus)
        return ((currentIndex + 1) / statusFlow.length) * 100
    }

    return (
        <>
            <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                    Product-by-product order status tracking (Point 12)
                </p>

                {/* Search Bar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Enter SO number, Customer PO, Product code, or Heat number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="px-3 py-2 border rounded-md"
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value as any)}
                                >
                                    <option value="so">SO Number</option>
                                    <option value="po">Customer PO</option>
                                    <option value="product">Product Code</option>
                                    <option value="heat">Heat Number</option>
                                </select>
                                <Button onClick={handleSearch} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Search
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Results */}
            {orderItems.length > 0 && (
                <div className="space-y-4">
                    {orderItems.map((item) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{item.product?.name || item.product_name}</CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            SO: {item.sales_order?.so_number} | Customer: {item.sales_order?.customer?.name}
                                        </p>
                                    </div>
                                    <Badge className={getStatusColor(item.status)}>
                                        {getStatusIcon(item.status)}
                                        <span className="ml-2">{getStatusLabel(item.status)}</span>
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${getStatusProgress(item.status)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {Math.round(getStatusProgress(item.status))}% Complete
                                    </p>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-4">
                                    {statusFlow.map((status, index) => {
                                        const currentIndex = statusFlow.indexOf(item.status)
                                        const isCompleted = index <= currentIndex
                                        const isCurrent = index === currentIndex
                                        const isPending = index > currentIndex

                                        return (
                                            <div key={status} className="flex items-start gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted
                                                            ? 'bg-green-500 text-white'
                                                            : isCurrent
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-200 text-gray-400'
                                                            }`}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : (
                                                            getStatusIcon(status)
                                                        )}
                                                    </div>
                                                    {index < statusFlow.length - 1 && (
                                                        <div
                                                            className={`w-0.5 h-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                                                }`}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-8">
                                                    <p
                                                        className={`font-medium ${isCompleted
                                                            ? 'text-green-700'
                                                            : isCurrent
                                                                ? 'text-blue-700'
                                                                : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {getStatusLabel(status)}
                                                    </p>
                                                    {isCurrent && (
                                                        <p className="text-xs text-blue-600 mt-1">Current Status</p>
                                                    )}
                                                    {isPending && (
                                                        <p className="text-xs text-gray-400 mt-1">Pending</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Item Details */}
                                <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Quantity</p>
                                        <p className="font-medium">{item.quantity} {item.uom?.code || 'NOS'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Heat Number</p>
                                        <p className="font-medium font-mono">{item.heat_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">PO Number</p>
                                        <p className="font-medium">{item.linked_po?.po_number || 'Not placed'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">GRN Number</p>
                                        <p className="font-medium">{item.linked_grn?.grn_number || 'Not received'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!loading && orderItems.length === 0 && searchQuery && (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No orders found matching your search criteria
                    </CardContent>
                </Card>
            )}
        </>
    )
}

export default function OrderTrackingPage() {
    return (
        <PageLayout title="Order Status Tracking">
            <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                <OrderTrackingContent />
            </Suspense>
        </PageLayout>
    )
}

