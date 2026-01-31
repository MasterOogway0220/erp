"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Eye, Truck } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  partial_dispatch: "bg-orange-100 text-orange-800",
  dispatched: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function SalesOrdersPage() {
  const { salesOrders, quotations, customers, addSalesOrder, updateSalesOrder, generateNumber } = useStore()
  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [selectedQuotation, setSelectedQuotation] = useState("")
  const [customerPONumber, setCustomerPONumber] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")

  const approvedQuotations = quotations.filter(q => q.status === "approved" || q.status === "sent" || q.status === "accepted")

  const handleSubmit = () => {
    if (!selectedQuotation || !customerPONumber || !deliveryDate) return

    const quotation = quotations.find(q => q.id === selectedQuotation)
    if (!quotation) return

    const newOrder: any = {
      id: Math.random().toString(36).substring(2, 15),
      soNumber: generateNumber("SO"),
      quotationId: quotation.id,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerPONumber,
      items: quotation.items.map(item => ({
        ...item,
        deliveredQuantity: 0,
      })),
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      total: quotation.total,
      currency: quotation.currency,
      deliveryDate,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    }

    addSalesOrder(newOrder)
    setOpen(false)
    setSelectedQuotation("")
    setCustomerPONumber("")
    setDeliveryDate("")
  }

  const handleConfirm = (id: string) => {
    updateSalesOrder(id, { status: "confirmed" })
  }

  return (
    <PageLayout title="Sales Orders">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sales Orders</h2>
            <p className="text-muted-foreground">Track and manage customer orders</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Sales Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Sales Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Quotation</Label>
                  <Select value={selectedQuotation} onValueChange={setSelectedQuotation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedQuotations.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.quotationNumber} - {q.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Customer PO Number</Label>
                  <Input
                    value={customerPONumber}
                    onChange={(e) => setCustomerPONumber(e.target.value)}
                    placeholder="Enter customer PO reference"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Create Sales Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Customer PO</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sales orders found. Create your first order.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesOrders.map((order) => {
                    const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0)
                    const deliveredQty = order.items.reduce((sum, i) => sum + i.deliveredQuantity, 0)
                    const progress = totalQty > 0 ? (deliveredQty / totalQty) * 100 : 0

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          {order.soNumber}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {order.customerPONumber}
                        </TableCell>
                        <TableCell>
                          {order.currency === "INR" ? "₹" : "$"}
                          {order.total.toLocaleString()}
                        </TableCell>
                        <TableCell>{order.deliveryDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <Link href={`/sales/orders/${order.id}/tracking`}>
                                <div className="flex flex-col items-center">
                                  <Truck className="h-4 w-4 text-blue-600" />
                                  <span className="text-[8px] font-bold text-blue-600">TRACK</span>
                                </div>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrder(order)
                                setViewOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirm(order.id)}
                              >
                                Confirm
                              </Button>
                            )}
                            {(order.status === "confirmed" || order.status === "in_progress") && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/inventory/dispatch/new?soId=${order.id}`}>
                                  <Truck className="h-3 w-3 mr-1" /> Dispatch
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sales Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">SO Number</Label>
                    <p className="font-mono font-medium">{selectedOrder.soNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer</Label>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer PO</Label>
                    <p className="font-mono">{selectedOrder.customerPONumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Delivery Date</Label>
                    <p>{selectedOrder.deliveryDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedOrder.status]}>
                      {selectedOrder.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{selectedOrder.createdAt}</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Line Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Heat No.</TableHead>
                        <TableHead className="text-right">Ordered</TableHead>
                        <TableHead className="text-right">Delivered</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {item.heatNumber || "-"}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.deliveredQuantity}
                            {item.deliveredQuantity < item.quantity && (
                              <span className="text-amber-600 ml-1">
                                ({item.quantity - item.deliveredQuantity} pending)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {selectedOrder.currency === "INR" ? "₹" : "$"}
                            {item.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {selectedOrder.currency === "INR" ? "₹" : "$"}
                            {(item.quantity * item.unitPrice).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{selectedOrder.currency === "INR" ? "₹" : "$"}{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (18%):</span>
                      <span>{selectedOrder.currency === "INR" ? "₹" : "$"}{selectedOrder.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{selectedOrder.currency === "INR" ? "₹" : "$"}{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout >
  )
}
