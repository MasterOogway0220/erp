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
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

function NewInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const soId = searchParams.get("soId")
  const dispatchId = searchParams.get("dispatchId")

  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [dispatches, setDispatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispatchId, setSelectedDispatchId] = useState(dispatchId || "")
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [soRes, dRes] = await Promise.all([
          fetch('/api/sales-orders'),
          fetch('/api/dispatches')
        ])
        const soData = await soRes.json()
        const dData = await dRes.json()
        setSalesOrders(soData.data || [])
        setDispatches(dData.data || [])

        if (dispatchId) {
          setSelectedDispatchId(dispatchId)
        } else if (soId) {
          const eligible = (dData.data || []).filter((d: any) =>
            (d.status === "dispatched" || d.status === "delivered") && d.sales_order_id === soId
          )
          if (eligible.length > 0) {
            setSelectedDispatchId(eligible[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError("Failed to load necessary data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [soId, dispatchId])

  useEffect(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    setDueDate(date.toISOString().split("T")[0])
  }, [])

  const eligibleDispatches = dispatches.filter(d => d.status === "dispatched" || d.status === "delivered")
  const selectedDispatch = dispatches.find(d => d.id === selectedDispatchId)
  const relatedSO = selectedDispatch?.sales_order

  const isDispatchValid = selectedDispatch && (selectedDispatch.status === "dispatched" || selectedDispatch.status === "delivered")

  const calculateTotals = () => {
    if (!selectedDispatch || !relatedSO) return { subtotal: 0, cgst: 0, sgst: 0, igst: 0, total: 0, isInterState: false }

    const subtotal = (selectedDispatch.items || []).reduce((sum: number, item: any) => {
      const soItem = (relatedSO.items || []).find((si: any) => si.id === item.sales_order_item_id)
      return sum + (item.quantity * (soItem?.unit_price || 0))
    }, 0)

    // Logic: Compare customer state vs placeholder warehouse state (assume Local for now or fetch if available)
    const isInterState = relatedSO.customer?.registered_state &&
      relatedSO.customer?.registered_state !== "Maharashtra" // Placeholder logic

    let cgst = 0, sgst = 0, igst = 0
    if (isInterState) {
      igst = subtotal * 0.18
    } else {
      cgst = subtotal * 0.09
      sgst = subtotal * 0.09
    }
    const total = subtotal + cgst + sgst + igst

    return { subtotal, cgst, sgst, igst, total, isInterState }
  }

  const { subtotal, cgst, sgst, igst, total, isInterState } = calculateTotals()

  const handleSubmit = async () => {
    setError("")

    if (!selectedDispatchId) {
      setError("Please select a Dispatch")
      return
    }

    if (!dueDate) {
      setError("Please set payment due date")
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_id: selectedDispatchId,
          due_date: dueDate,
          remarks: "Generated from Dispatch " + selectedDispatch?.dispatch_number
        })
      })

      const result = await response.json()
      if (response.ok) {
        router.push(`/finance/invoices/${result.data.id}`)
      } else {
        setError(result.error || 'Failed to create invoice')
      }
    } catch (err) {
      setError('An error occurred while creating invoice')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !selectedDispatch) {
    return (
      <PageLayout title="New Invoice">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="New Invoice">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Create Invoice</h2>
              <p className="text-muted-foreground">
                Generate invoice for dispatched goods
              </p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!isDispatchValid || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Invoice
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Dispatch</CardTitle>
              <CardDescription>Choose a completed dispatch to invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dispatch *</Label>
                <Select value={selectedDispatchId} onValueChange={setSelectedDispatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispatch" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleDispatches.length === 0 ? (
                      <SelectItem value="none" disabled>No eligible dispatches available</SelectItem>
                    ) : (
                      eligibleDispatches.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.dispatch_number} - {d.sales_order?.customer?.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedDispatch && relatedSO && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dispatch No:</span>
                    <span className="font-mono font-medium">{selectedDispatch.dispatch_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sales Order:</span>
                    <span className="font-mono font-medium">{relatedSO.so_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <span className="font-medium">{relatedSO.customer?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customer PO:</span>
                    <span className="font-mono text-sm">{relatedSO.customer_po_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">{selectedDispatch.status}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Due Date *</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={relatedSO?.currency || "INR"}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedDispatch && relatedSO && (
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
                  {selectedDispatch.items?.map((item: any) => {
                    const soItem = relatedSO.items.find((si: any) => si.id === item.sales_order_item_id)
                    const itemTotal = item.quantity * (soItem?.unit_price || 0)

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name || "Product"}</TableCell>
                        <TableCell className="font-mono text-sm">{item.heat_number}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {relatedSO.currency === "INR" ? "₹" : "$"}{(soItem?.unit_price || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {relatedSO.currency === "INR" ? "₹" : "$"}{itemTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{relatedSO?.currency === "INR" ? "₹" : "$"}{subtotal.toLocaleString()}</span>
                  </div>
                  {!isInterState ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>CGST (9%):</span>
                        <span>₹{cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST (9%):</span>
                        <span>₹{sgst.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>IGST (18%):</span>
                      <span>₹{igst.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2 text-lg">
                    <span>Total:</span>
                    <span>{relatedSO?.currency === "INR" ? "₹" : "$"}{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <PageLayout title="New Invoice">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    }>
      <NewInvoiceForm />
    </Suspense>
  )
}
