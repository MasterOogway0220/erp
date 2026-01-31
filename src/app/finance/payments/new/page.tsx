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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, AlertCircle, CheckCircle, CreditCard, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

function NewPaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("invoiceId")
  
  const { invoices } = useStore()
  
  const unpaidInvoices = invoices.filter(inv => 
    inv.status === "sent" || inv.status === "partial_paid" || inv.status === "overdue"
  )
  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId || "")
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState<"cash" | "cheque" | "neft" | "rtgs" | "upi">("neft")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  useEffect(() => {
    setPaymentDate(new Date().toISOString().split("T")[0])
  }, [])
  
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId)
  const outstanding = selectedInvoice ? selectedInvoice.total - selectedInvoice.paidAmount : 0
  
  useEffect(() => {
    if (selectedInvoice && outstanding > 0) {
      setAmount(outstanding.toString())
    }
  }, [selectedInvoice, outstanding])
  
  const isInvoiceValid = selectedInvoice && (selectedInvoice.status === "sent" || selectedInvoice.status === "partial_paid" || selectedInvoice.status === "overdue")
  
  const validateForm = () => {
    setError("")
    
    if (!selectedInvoiceId) {
      setError("Please select an Invoice")
      return false
    }
    
    if (!selectedInvoice) {
      setError("Invoice not found")
      return false
    }
    
    if (!isInvoiceValid) {
      setError("Cannot record payment. Invoice must be sent first.")
      return false
    }
    
    const paymentAmount = parseFloat(amount)
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError("Please enter a valid payment amount")
      return false
    }
    
    if (paymentAmount > outstanding) {
      setError(`Payment amount cannot exceed outstanding balance (${selectedInvoice.currency === "INR" ? "₹" : "$"}${outstanding.toLocaleString()})`)
      return false
    }
    
    if (!paymentDate) {
      setError("Please select payment date")
      return false
    }
    
    if (paymentMode !== "cash" && !referenceNumber.trim()) {
      setError("Please enter reference number for non-cash payments")
      return false
    }
    
    return true
  }
  
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          amount: parseFloat(amount),
          payment_mode: paymentMode,
          reference_number: referenceNumber.trim() || undefined,
          payment_date: paymentDate,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to record payment")
      }
      
      router.push(`/finance/invoices/${selectedInvoiceId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }
  
  return (
    <PageLayout title="Record Payment">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Record Payment</h2>
            <p className="text-muted-foreground">
              Record payment received against an invoice
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
            Payments can only be recorded against sent invoices. Payment amount cannot exceed outstanding balance.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Invoice</CardTitle>
              <CardDescription>Choose an invoice to record payment against</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice *</Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidInvoices.length === 0 ? (
                      <SelectItem value="none" disabled>No unpaid invoices available</SelectItem>
                    ) : (
                      unpaidInvoices.map(inv => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.customerName} ({inv.currency === "INR" ? "₹" : "$"}{(inv.total - inv.paidAmount).toLocaleString()} due)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedInvoice && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Invoice No:</span>
                    <span className="font-mono font-medium">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <span className="font-medium">{selectedInvoice.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Invoice Total:</span>
                    <span className="font-medium">
                      {selectedInvoice.currency === "INR" ? "₹" : "$"}{selectedInvoice.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Already Paid:</span>
                    <span className="font-medium text-green-600">
                      {selectedInvoice.currency === "INR" ? "₹" : "$"}{selectedInvoice.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm font-medium">Outstanding:</span>
                    <span className="font-bold text-lg text-orange-600">
                      {selectedInvoice.currency === "INR" ? "₹" : "$"}{outstanding.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">{selectedInvoice.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  max={outstanding}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                {selectedInvoice && (
                  <p className="text-xs text-muted-foreground">
                    Max: {selectedInvoice.currency === "INR" ? "₹" : "$"}{outstanding.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select value={paymentMode} onValueChange={(val) => setPaymentMode(val as typeof paymentMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Reference Number {paymentMode !== "cash" ? "*" : ""}</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={paymentMode === "cheque" ? "Cheque number" : paymentMode === "upi" ? "UPI transaction ID" : "Transaction reference"}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => {
            if (validateForm()) setShowConfirm(true)
          }} disabled={!isInvoiceValid || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </div>
      </div>
      
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment Recording</DialogTitle>
            <DialogDescription>
              You are about to record a payment of {selectedInvoice?.currency === "INR" ? "₹" : "$"}{parseFloat(amount || "0").toLocaleString()} against invoice {selectedInvoice?.invoiceNumber}.
              <br /><br />
              <strong>Payment Mode:</strong> {paymentMode.toUpperCase()}
              {referenceNumber && (
                <>
                  <br />
                  <strong>Reference:</strong> {referenceNumber}
                </>
              )}
              <br /><br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={
      <PageLayout title="Record Payment">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    }>
      <NewPaymentForm />
    </Suspense>
  )
}
