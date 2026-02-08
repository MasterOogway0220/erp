"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
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
import { ArrowLeft, AlertCircle, Loader2, Plus, Trash2, IndianRupee } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  currency: string
}

function NewPaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialInvoiceId = searchParams.get("invoiceId")

  const [customers, setCustomers] = useState<any[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState("neft")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0])
  const [bankDetails, setBankDetails] = useState("")
  const [remarks, setRemarks] = useState("")
  const [allocations, setAllocations] = useState<{ invoice_id: string, amount: number }[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers')
        const data = await res.json()
        setCustomers(data.data || [])

        if (initialInvoiceId) {
          const invRes = await fetch(`/api/invoices/${initialInvoiceId}`)
          const invData = await invRes.json()
          if (invData.data) {
            setSelectedCustomerId(invData.data.customer_id)
            setAllocations([{ invoice_id: initialInvoiceId, amount: invData.data.total_amount - (invData.data.paid_amount || 0) }])
            setAmount(invData.data.total_amount - (invData.data.paid_amount || 0))
          }
        }
      } catch (err) {
        console.error('Error fetching customers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [initialInvoiceId])

  useEffect(() => {
    if (selectedCustomerId) {
      const fetchInvoices = async () => {
        try {
          const res = await fetch(`/api/invoices?customer_id=${selectedCustomerId}&status=sent,partial_paid,overdue`)
          const data = await res.json()
          setInvoices(data.data || [])
        } catch (err) {
          console.error('Error fetching invoices:', err)
        }
      }
      fetchInvoices()
    } else {
      setInvoices([])
    }
  }, [selectedCustomerId])

  const handleAddAllocation = () => {
    setAllocations([...allocations, { invoice_id: "", amount: 0 }])
  }

  const handleRemoveAllocation = (index: number) => {
    const newAllocations = [...allocations]
    newAllocations.splice(index, 1)
    setAllocations(newAllocations)
  }

  const handleAllocationChange = (index: number, field: string, value: any) => {
    const newAllocations = [...allocations]
    newAllocations[index] = { ...newAllocations[index], [field]: value }

    // If updating invoice, pre-fill balance
    if (field === 'invoice_id') {
      const invoice = invoices.find(inv => inv.id === value)
      if (invoice) {
        newAllocations[index].amount = invoice.total_amount - (invoice.paid_amount || 0)
      }
    }

    setAllocations(newAllocations)

    // Update total amount if only one allocation or if it's the sum
    const totalAllocated = newAllocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0)
    setAmount(totalAllocated)
  }

  const handleSubmit = async () => {
    setError("")
    if (!selectedCustomerId || amount <= 0 || !receiptDate) {
      setError("Please fill in all required fields")
      return
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0)
    if (totalAllocated > amount) {
      setError("Total allocated amount exceeds receipt amount")
      return
    }

    try {
      setSubmitLoading(true)
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          amount,
          payment_mode: paymentMode,
          reference_number: referenceNumber,
          receipt_date: receiptDate,
          bank_details: bankDetails,
          remarks,
          allocations: allocations.filter(a => a.invoice_id && a.amount > 0)
        })
      })

      const result = await res.json()
      if (res.ok) {
        router.push(`/finance/payments/${result.data.id}`)
      } else {
        setError(result.error || "Failed to record payment")
      }
    } catch (err) {
      setError("An error occurred while submitting payment")
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="New Payment">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Record Payment">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">New Payment Receipt</h2>
              <p className="text-muted-foreground">Record customer payment and allocate to invoices</p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={submitLoading}>
            {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Receipt
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base text-primary">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Total Receipt Amount *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neft">NEFT / RTGS</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference (UTR/Cheque No.)</Label>
                <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Enter reference number" />
              </div>

              <div className="space-y-2">
                <Label>Receipt Date *</Label>
                <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Bank Details</Label>
                <Input value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} placeholder="Bank name, branch" />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-primary">Invoice Allocations</CardTitle>
                <CardDescription>Allocate this payment to outstanding invoices</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddAllocation}>
                <Plus className="mr-2 h-4 w-4" /> Add Allocation
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Invoice</TableHead>
                    <TableHead className="text-right">OS Balance</TableHead>
                    <TableHead className="text-right">Allocated Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((alloc, index) => {
                    const invoice = invoices.find(i => i.id === alloc.invoice_id)
                    const balance = invoice ? (invoice.total_amount - (invoice.paid_amount || 0)) : 0

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={alloc.invoice_id}
                            onValueChange={(val) => handleAllocationChange(index, 'invoice_id', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select invoice" />
                            </SelectTrigger>
                            <SelectContent>
                              {invoices.length === 0 ? (
                                <SelectItem value="none" disabled>No outstanding invoices</SelectItem>
                              ) : (
                                invoices.map(inv => (
                                  <SelectItem key={inv.id} value={inv.id}>
                                    {inv.invoice_number} (₹{(inv.total_amount - (inv.paid_amount || 0)).toLocaleString()})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={alloc.amount}
                            onChange={(e) => handleAllocationChange(index, 'amount', Number(e.target.value))}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveAllocation(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {allocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                        No allocations added. Receipt will be recorded as unallocated.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-end p-4 bg-muted/20 mt-4 rounded-lg">
                <div className="space-y-1 text-right">
                  <div className="text-sm text-muted-foreground">Total Allocated</div>
                  <div className="text-xl font-bold">₹{allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0).toLocaleString()}</div>
                  {amount > 0 && allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) < amount && (
                    <div className="text-xs text-orange-600">Unallocated: ₹{(amount - allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0)).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={
      <PageLayout title="New Payment">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    }>
      <NewPaymentForm />
    </Suspense>
  )
}
