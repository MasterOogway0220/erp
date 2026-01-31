"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

function NewSalesOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quotationId = searchParams.get("quotationId")

  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/quotations')
      const result = await response.json()

      if (response.ok) {
        setQuotations(result.data?.map((q: any) => ({
          id: q.id,
          quotationNumber: q.quotation_number,
          customerName: q.customer?.name || 'Unknown',
          items: q.items?.map((i: any) => ({
            id: i.id,
            productName: i.product?.name || 'Unknown',
            quantity: i.quantity,
            unitPrice: i.unit_price,
            discount: i.discount_percent,
            total: i.line_total
          })) || [],
          subtotal: q.subtotal,
          tax: q.tax_amount,
          total: q.total_amount,
          currency: q.currency,
          status: q.status?.toLowerCase()
        })) || [])
      } else {
        setError(result.error || 'Failed to fetch quotations')
      }
    } catch (err) {
      setError('An error occurred while fetching quotations')
    } finally {
      setLoading(false)
    }
  }

  /* console.log('All quotations:', quotations) */
  const approvedQuotations = quotations.filter(q => q.status === "approved" || q.status === "sent")

  const [selectedQuotationId, setSelectedQuotationId] = useState(quotationId || "")
  const [customerPONumber, setCustomerPONumber] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (quotationId) {
      setSelectedQuotationId(quotationId)
    }
  }, [quotationId])

  const quotation = quotations.find(q => q.id === selectedQuotationId)
  const isQuotationValid = quotation && (quotation.status === "approved" || quotation.status === "sent")

  const validateForm = () => {
    setError("")

    if (!selectedQuotationId) {
      setError("Please select a quotation")
      return false
    }

    if (!quotation) {
      setError("Quotation not found")
      return false
    }

    if (quotation.status !== "approved" && quotation.status !== "sent") {
      setError("Cannot create Sales Order. Quotation must be approved first.")
      return false
    }

    if (!customerPONumber.trim()) {
      setError("Please enter Customer PO Number")
      return false
    }

    if (!deliveryDate) {
      setError("Please set delivery date")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotation_id: selectedQuotationId,
          customer_po_number: customerPONumber.trim(),
          delivery_date: deliveryDate,
          remarks,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create sales order")
      }

      router.push(`/sales/orders/${result.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sales order")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Sales Order</h2>
          <p className="text-muted-foreground">
            Create a sales order from an approved quotation
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Sales Orders can only be created from approved quotations. This ensures proper approval workflow.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Quotation</CardTitle>
            <CardDescription>Choose an approved quotation to convert</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Approved Quotation *</Label>
              <Select value={selectedQuotationId} onValueChange={setSelectedQuotationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quotation" />
                </SelectTrigger>
                <SelectContent>
                  {approvedQuotations.length === 0 ? (
                    <SelectItem value="none" disabled>No approved quotations available</SelectItem>
                  ) : (
                    approvedQuotations.map(q => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.quotationNumber} - {q.customerName} ({q.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {quotation && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quotation:</span>
                  <span className="font-mono font-medium">{quotation.quotationNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Customer:</span>
                  <span className="font-medium">{quotation.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={quotation.status === "approved" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                    {quotation.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Value:</span>
                  <span className="font-bold">
                    {quotation.currency === "INR" ? "₹" : "$"}{quotation.total.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer PO Number *</Label>
              <Input
                value={customerPONumber}
                onChange={(e) => setCustomerPONumber(e.target.value)}
                placeholder="Enter customer's PO reference"
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Date *</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {quotation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Items (from Quotation)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {quotation.currency === "INR" ? "₹" : "$"}{item.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{item.discount}%</TableCell>
                    <TableCell className="text-right font-medium">
                      {quotation.currency === "INR" ? "₹" : "$"}{item.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{quotation.currency === "INR" ? "₹" : "$"}{quotation.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%):</span>
                  <span>{quotation.currency === "INR" ? "₹" : "$"}{quotation.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{quotation.currency === "INR" ? "₹" : "$"}{quotation.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={() => {
          if (validateForm()) setShowConfirm(true)
        }} disabled={!isQuotationValid || loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Sales Order
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sales Order Creation</DialogTitle>
            <DialogDescription>
              You are about to create a sales order from quotation {quotation?.quotationNumber} for {quotation?.customerName}.
              <br /><br />
              <strong>Customer PO:</strong> {customerPONumber}
              <br />
              <strong>Value:</strong> {quotation?.currency === "INR" ? "₹" : "$"}{quotation?.total.toLocaleString()}
              <br /><br />
              This action will mark the quotation as accepted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function NewSalesOrderPage() {
  return (
    <PageLayout title="New Sales Order">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <NewSalesOrderForm />
      </Suspense>
    </PageLayout>
  )
}
