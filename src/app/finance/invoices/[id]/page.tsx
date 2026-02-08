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

import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${params.id}`)
      const data = await res.json()
      if (res.ok) {
        setInvoice(data.data)
      } else {
        setError(data.error || "Failed to load invoice details")
      }
    } catch (err) {
      setError("An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const handleAction = async (status: string) => {
    try {
      setActionLoading(true)
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (res.ok) {
        setInvoice(data.data)
      } else {
        setError(data.error || "Action failed")
      }
    } catch (err) {
      setError("An error occurred while performing action")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Loading Invoice">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-4">Fetching invoice details...</p>
        </div>
      </PageLayout>
    )
  }

  if (error || !invoice) {
    return (
      <PageLayout title="Invoice Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          {error && (
            <Alert variant="destructive" className="max-w-md mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <p className="text-muted-foreground mb-4">Invoice not found</p>
          <Button variant="outline" onClick={() => router.push("/finance/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </PageLayout>
    )
  }

  const outstanding = invoice.total_amount - (invoice.paid_amount || 0)

  return (
    <PageLayout title={`Invoice ${invoice.invoice_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/finance/invoices")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h2>
                <Badge className={statusColors[invoice.status]}>{invoice.status.replace(/_/g, " ")}</Badge>
              </div>
              <p className="text-muted-foreground">Invoice Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status === "draft" && (
              <Button onClick={() => handleAction('sent')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Mark as Sent
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
              <p className="font-semibold">{invoice.customer?.name}</p>
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
                {invoice.currency === "INR" ? "₹" : "$"}{invoice.total_amount.toLocaleString()}
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
                {invoice.currency === "INR" ? "₹" : "$"}{(invoice.paid_amount || 0).toLocaleString()}
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
          {invoice.sales_order && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Sales Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-medium">{invoice.sales_order.so_number}</p>
                    <p className="text-sm text-muted-foreground">Customer PO: {invoice.sales_order.customer_po_number}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/sales/orders/${invoice.sales_order.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.dispatch && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Dispatch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-medium">{invoice.dispatch.dispatch_number}</p>
                    <p className="text-sm text-muted-foreground">{new Date(invoice.dispatch.dispatch_date).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/inventory/dispatch/${invoice.dispatch.id}`}>View</Link>
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
                {invoice.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name || "Product"}</TableCell>
                    <TableCell className="font-mono text-sm">{item.heat_number || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {invoice.currency === "INR" ? "₹" : "$"}{item.unit_price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {invoice.currency === "INR" ? "₹" : "$"}{item.total_amount.toLocaleString()}
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
                {invoice.cgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>CGST (9%):</span>
                    <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.cgst.toLocaleString()}</span>
                  </div>
                )}
                {invoice.sgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>SGST (9%):</span>
                    <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.sgst.toLocaleString()}</span>
                  </div>
                )}
                {invoice.igst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>IGST (18%):</span>
                    <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.igst.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{invoice.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600 pt-2">
                  <span>Paid:</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{(invoice.paid_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-orange-600">
                  <span>Balance Due:</span>
                  <span>{invoice.currency === "INR" ? "₹" : "$"}{outstanding.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {invoice.receipts && invoice.receipts.length > 0 && (
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
                  {invoice.receipts.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.receipt_number}</TableCell>
                      <TableCell>{new Date(payment.receipt_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_mode?.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{payment.reference_number || "-"}</TableCell>
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
                <p>Created At: {new Date(invoice.created_at).toLocaleString()}</p>
                <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p>Place of Supply: {invoice.place_of_supply}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
