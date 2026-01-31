"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore, Invoice } from "@/lib/store"
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
import { Plus, Eye, CreditCard } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  partial_paid: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
}

export default function InvoicesPage() {
  const { invoices, salesOrders, dispatches, addInvoice, updateInvoice, generateNumber } = useStore()
  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedSO, setSelectedSO] = useState("")
  const [dueDate, setDueDate] = useState("")
  
  const eligibleOrders = salesOrders.filter(so => 
    ['dispatched', 'partial_dispatch', 'completed'].includes(so.status)
  )
  
  const handleSubmit = () => {
    if (!selectedSO || !dueDate) return
    
    const so = salesOrders.find(s => s.id === selectedSO)
    if (!so) return
    
    const dispatch = dispatches.find(d => d.soId === so.id)
    
    const items = so.items.map(item => ({
      id: Math.random().toString(36).substring(2, 15),
      productName: item.productName,
      quantity: item.deliveredQuantity,
      unitPrice: item.unitPrice,
      total: item.deliveredQuantity * item.unitPrice,
      heatNumber: item.heatNumber,
    }))
    
    const subtotal = items.reduce((sum, i) => sum + i.total, 0)
    const cgst = subtotal * 0.09
    const sgst = subtotal * 0.09
    
    const newInvoice: Invoice = {
      id: Math.random().toString(36).substring(2, 15),
      invoiceNumber: generateNumber("INV"),
      soId: so.id,
      soNumber: so.soNumber,
      dispatchId: dispatch?.id,
      customerId: so.customerId,
      customerName: so.customerName,
      items,
      subtotal,
      cgst,
      sgst,
      igst: 0,
      total: subtotal + cgst + sgst,
      currency: so.currency,
      dueDate,
      status: "draft",
      paidAmount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }
    
    addInvoice(newInvoice)
    setOpen(false)
    setSelectedSO("")
    setDueDate("")
  }
  
  return (
    <PageLayout title="Invoices">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">Manage customer invoices and payments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Sales Order</Label>
                  <Select value={selectedSO} onValueChange={setSelectedSO}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales order" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleOrders.map((so) => (
                        <SelectItem key={so.id} value={so.id}>
                          {so.soNumber} - {so.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>SO Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No invoices found. Create your first invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => {
                    const paymentProgress = invoice.total > 0 ? (invoice.paidAmount / invoice.total) * 100 : 0
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {invoice.soNumber}
                        </TableCell>
                        <TableCell>
                          {invoice.currency === "INR" ? "₹" : "$"}
                          {invoice.total.toLocaleString()}
                        </TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={paymentProgress} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(paymentProgress)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[invoice.status]}>
                            {invoice.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setViewOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invoice.status !== "paid" && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/finance/payments/new?invoiceId=${invoice.id}`}>
                                  <CreditCard className="h-3 w-3 mr-1" /> Record Payment
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
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Invoice Number</Label>
                    <p className="font-mono font-medium">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer</Label>
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">SO Reference</Label>
                    <p className="font-mono">{selectedInvoice.soNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Due Date</Label>
                    <p>{selectedInvoice.dueDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedInvoice.status]}>
                      {selectedInvoice.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{selectedInvoice.createdAt}</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Line Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Heat No.</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {item.heatNumber || "-"}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {selectedInvoice.currency === "INR" ? "₹" : "$"}
                            {item.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {selectedInvoice.currency === "INR" ? "₹" : "$"}
                            {item.total.toLocaleString()}
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
                      <span>{selectedInvoice.currency === "INR" ? "₹" : "$"}{selectedInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CGST (9%):</span>
                      <span>{selectedInvoice.currency === "INR" ? "₹" : "$"}{selectedInvoice.cgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>SGST (9%):</span>
                      <span>{selectedInvoice.currency === "INR" ? "₹" : "$"}{selectedInvoice.sgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{selectedInvoice.currency === "INR" ? "₹" : "$"}{selectedInvoice.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid:</span>
                      <span>{selectedInvoice.currency === "INR" ? "₹" : "$"}{selectedInvoice.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-600">
                      <span>Balance:</span>
                      <span>{selectedInvoice.currency === "INR" ? "₹" : "$"}{(selectedInvoice.total - selectedInvoice.paidAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
