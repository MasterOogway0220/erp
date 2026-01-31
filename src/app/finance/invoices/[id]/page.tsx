"use client"

import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
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
import { ArrowLeft, FileText, User, Calendar, DollarSign, CreditCard, Send, Truck } from "lucide-react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  partial_paid: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { invoices, salesOrders, dispatches, payments, updateInvoice } = useStore()
  
  const invoice = invoices.find(inv => inv.id === params.id)
  const linkedSO = salesOrders.find(so => so.id === invoice?.soId)
  const linkedDispatch = dispatches.find(d => d.id === invoice?.dispatchId)
  const linkedPayments = payments.filter(p => p.invoiceId === params.id)
  
  if (!invoice) {
    return (
      <PageLayout title="Invoice Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Invoice not found</p>
          <Button onClick={() => router.push("/finance/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </PageLayout>
    )
  }
  
  const outstanding = invoice.total - invoice.paidAmount
  
  const handleSendInvoice = () => {
    updateInvoice(invoice.id, { status: "sent" })
  }
  
  return (
    <PageLayout title={`Invoice ${invoice.invoiceNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/finance/invoices")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h2>
                <Badge className={statusColors[invoice.status]}>{invoice.status.replace(/_/g, " ")}</Badge>
              </div>
              <p className="text-muted-foreground">Invoice Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status === "draft" && (
              <Button onClick={handleSendInvoice}>
                <Send className="mr-2 h-4 w-4" /> Send Invoice
              </Button>
            )}
            {(invoice.status === "sent" || invoice.status === "partial_paid") && outstanding > 0 && (
              <Button asChild>
                <Link href={`/finance/payments/new?invoiceId=${invoice.id}`}>
                  <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{invoice.customerName}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">
                {invoice.currency === "INR" ? "₹" : "$"}{invoice.total.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg text-green-600">
                {invoice.currency === "INR" ? "₹" : "$"}{invoice.paidAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg text-orange-600">
                {invoice.currency === "INR" ? "₹" : "$"}{outstanding.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {linkedSO && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Sales Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-medium">{linkedSO.soNumber}</p>
                    <p className="text-sm text-muted-foreground">Customer PO: {linkedSO.customerPONumber}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/sales/orders/${linkedSO.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {linkedDispatch && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Dispatch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-medium">{linkedDispatch.dispatchNumber}</p>
                    <p className="text-sm text-muted-foreground">{linkedDispatch.dispatchDate}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/inventory/dispatch/${linkedDispatch.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.heatNumber || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {invoice.currency === "INR" ? "₹" : "$"}{item.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {invoice.currency === "INR" ? "₹" : "$"}{item.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-end mt-4">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CGST (9%):</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST (9%):</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.sgst.toLocaleString()}</span>
                </div>
                {invoice.igst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>IGST (18%):</span>
                    <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.igst.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600 pt-2">
                  <span>Paid:</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-orange-600">
                  <span>Balance Due:</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{outstanding.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {linkedPayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment History
              </CardTitle>
              <CardDescription>Payments received against this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.receiptNumber}</TableCell>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.paymentMode.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{payment.referenceNumber || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {invoice.currency === "INR" ? "₹" : "$"}{payment.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>Created: {invoice.createdAt}</p>
                <p>Due Date: {invoice.dueDate}</p>
              </div>
              <div>
                <p>Currency: {invoice.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
