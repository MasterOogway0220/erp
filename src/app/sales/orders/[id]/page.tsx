"use client"

import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  Calendar,
  DollarSign,
  Truck,
  Package,
  Receipt,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardCheck,
  Factory,
  History,
  Send,
  X
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  partial_dispatch: "bg-orange-100 text-orange-800",
  dispatched: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const itemStatusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  material_reserved: "bg-blue-50 text-blue-700 border-blue-200",
  production: "bg-orange-50 text-orange-700 border-orange-200",
  qc_passed: "bg-green-50 text-green-700 border-green-200",
  ready_for_dispatch: "bg-purple-50 text-purple-700 border-purple-200",
  dispatched: "bg-gray-800 text-white",
}

export default function SalesOrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showAmendmentDialog, setShowAmendmentDialog] = useState(false)
  const [amendmentReason, setAmendmentReason] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/sales-orders/${id}`)
      const data = await res.json()
      if (res.ok) setOrder(data.data)
    } catch (err) {
      console.error("Failed to fetch order")
    } finally {
      setLoading(false)
    }
  }

  const updateItemStatus = async (itemId: string, status: string) => {
    try {
      setUpdating(true)
      const res = await fetch(`/api/sales-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: itemId, status }]
        })
      })
      if (res.ok) {
        // Optimistic update or refetch
        fetchOrder()
      }
    } catch (err) {
      console.error("Failed to update item status")
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateAmendment = async () => {
    try {
      setUpdating(true)
      setError("")
      const response = await fetch(`/api/sales-orders/${id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_reason: amendmentReason })
      })

      const result = await response.json()
      if (response.ok) {
        setShowAmendmentDialog(false)
        setAmendmentReason("")
        router.push(`/sales/orders/${result.data.id}`)
      } else {
        setError(result.error || 'Failed to create amendment')
      }
    } catch (err) {
      setError('An error occurred while creating amendment')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Sales Order">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!order) {
    return (
      <PageLayout title="Sales Order Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-xl font-semibold mb-4">Sales Order not found</p>
          <Button onClick={() => router.push("/sales/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales Orders
          </Button>
        </div>
      </PageLayout>
    )
  }

  const totalDelivered = order.items?.reduce((sum: number, item: any) => sum + (item.delivered_quantity || 0), 0) || 0
  const totalOrdered = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
  const deliveryProgress = totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0

  return (
    <PageLayout title={`Sales Order - ${order.order_number}`}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/sales/orders")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{order.order_number}</h2>
                <Badge className={statusColors[order.status] || "bg-gray-100"}>
                  {order.status?.replace(/_/g, " ")}
                </Badge>
                {order.version_number && (
                  <Badge variant="outline">Rev {order.version_number}</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm font-medium">Customer: {order.customer?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/sales/orders/${order.id}/tracking`}>
                <Clock className="mr-2 h-4 w-4" /> Track Order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/inventory/dispatch/new?soId=${order.id}`}>
                <Truck className="mr-2 h-4 w-4" /> Dispatch
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/purchase/orders/new?soId=${order.id}`}>
                <Package className="mr-2 h-4 w-4" /> Create PO
              </Link>
            </Button>
            {order.status !== 'cancelled' && order.is_latest_version !== false && (
              <Dialog open={showAmendmentDialog} onOpenChange={setShowAmendmentDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" /> Amend
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Amendment</DialogTitle>
                    <DialogDescription>
                      Create a new version of this Sales Order. This will mark the current version as historical and create a new draft for editing.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Amendment *</Label>
                      <Textarea
                        id="reason"
                        value={amendmentReason}
                        onChange={(e) => setAmendmentReason(e.target.value)}
                        placeholder="e.g., Change in quantity, price update, delivery date adjustment"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAmendmentDialog(false)} disabled={updating}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAmendment} disabled={updating || !amendmentReason.trim()}>
                      {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Amendment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button className="bg-primary text-white font-bold shadow-md hover:shadow-lg transition-all">
              <FileText className="mr-2 h-4 w-4" /> Generate Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              Account Details
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-primary" />
                <p className="font-bold text-sm">{order.customer?.name}</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">PO: {order.customer_po_number}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              Financials
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <p className="font-bold text-lg">{order.currency === "INR" ? "₹" : "$"}{(order.total || 0).toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Source: {order.quotation?.quotation_number}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              Timelines
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-orange-600" />
                <p className="font-bold text-sm">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Created: {new Date(order.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              Fulfillment
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-sm">{deliveryProgress}% Complete</p>
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden shadow-xl border-t-4 border-t-primary">
          <CardHeader className="bg-muted/30 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg font-bold">Order Items & Tracking</CardTitle>
              <CardDescription>Monitor item-level production and fulfillment status</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
              <Factory className="h-4 w-4" /> Production Mode
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="pl-6">Product Details</TableHead>
                  <TableHead className="text-center">Order Qty</TableHead>
                  <TableHead className="text-center">Delivered</TableHead>
                  <TableHead className="w-48">Status / Stage</TableHead>
                  <TableHead className="text-right pr-6">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-muted/5 group">
                    <TableCell className="pl-6">
                      <div className="font-bold text-sm">{item.product?.name || "Product"}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tight font-mono mt-0.5">
                        Grade: {item.grade || 'STD'} | Heat: {item.heat_number || 'NA'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                    <TableCell className="text-center">
                      <span className={item.delivered_quantity > 0 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                        {item.delivered_quantity || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.status || 'pending'}
                        onValueChange={(val) => updateItemStatus(item.id, val)}
                        disabled={order.is_latest_version === false}
                      >
                        <SelectTrigger className={`h-8 text-[11px] font-bold uppercase transition-all ${itemStatusColors[item.status || 'pending']}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="material_reserved">Material Reserved</SelectItem>
                          <SelectItem value="production">In Production</SelectItem>
                          <SelectItem value="qc_passed">QC Passed</SelectItem>
                          <SelectItem value="ready_for_dispatch">Ready for Dispatch</SelectItem>
                          <SelectItem value="dispatched">Dispatched</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-sm text-primary">
                      {order.currency === "INR" ? "₹" : "$"}{(item.unit_price || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end p-8 bg-muted/5 border-t">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Subtotal:</span>
                  <span className="font-bold">{order.currency === "INR" ? "₹" : "$"}{(order.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Tax (18%):</span>
                  <span className="font-bold">{order.currency === "INR" ? "₹" : "$"}{(order.tax || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-primary/20 pt-3 text-xl text-primary">
                  <span>Total:</span>
                  <span>{order.currency === "INR" ? "₹" : "$"}{(order.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-primary">Order Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                {order.remarks || "No additional remarks provided."}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-primary">Workflow Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-tight">Quotation Approved</p>
                  <p className="text-[10px] text-muted-foreground">The source quotation was approved by management.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-tight">Sales Order Issued</p>
                  <p className="text-[10px] text-muted-foreground">Order {order.order_number} created from quotation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
