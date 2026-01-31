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

interface GRNLineItem {
  id: string
  productId: string
  productName: string
  orderedQuantity: number
  receivedQuantity: number
  heatNumber: string
}

function NewGRNForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const poId = searchParams.get("poId")

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loadingPOs, setLoadingPOs] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedPOId, setSelectedPOId] = useState(poId || "")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("")
  const [receivedDate, setReceivedDate] = useState("")
  const [receivedBy, setReceivedBy] = useState("")
  const [items, setItems] = useState<GRNLineItem[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    setReceivedDate(new Date().toISOString().split("T")[0])
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoadingPOs(true)
      const [poRes, whRes] = await Promise.all([
        fetch('/api/purchase-orders'),
        fetch('/api/warehouses')
      ])
      const poData = await poRes.json()
      const whData = await whRes.json()

      const pos = poData.data || []
      setPurchaseOrders(pos)
      setWarehouses(whData.data || [])

      // Set default warehouse if available
      if (whData.data?.length > 0) {
        setSelectedWarehouseId(whData.data[0].id)
      }
    } catch (err) {
      console.error('Error fetching initial data:', err)
      setError('Failed to load initial data')
    } finally {
      setLoadingPOs(false)
    }
  }

  const eligiblePOs = purchaseOrders.filter(po =>
    po.status === "sent" || po.status === "acknowledged" || po.status === "partial_received"
  )

  const selectedPO = purchaseOrders.find(po => po.id === selectedPOId)

  useEffect(() => {
    if (selectedPO) {
      const grnItems = selectedPO.items.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name || 'Unknown',
        orderedQuantity: item.quantity,
        receivedQuantity: Math.max(0, item.quantity - (item.received_quantity || 0)),
        heatNumber: item.heat_number || `HT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      })).filter((item: any) => item.orderedQuantity > (selectedPO.items.find((i: any) => i.id === item.id)?.received_quantity || 0))
      setItems(grnItems)
    }
  }, [selectedPO])

  const isPOValid = selectedPO && (selectedPO.status === "sent" || selectedPO.status === "acknowledged" || selectedPO.status === "partial_received")

  const updateLineItem = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      return { ...item, [field]: value }
    }))
  }

  const handleSubmit = async () => {
    setError("")

    if (!selectedPOId || selectedPOId === "none") {
      setError("Please select a Purchase Order")
      return
    }

    if (!selectedWarehouseId) {
      setError("Please select a warehouse")
      return
    }

    if (!receivedBy.trim()) {
      setError("Please enter received by name")
      return
    }

    const itemsToSubmit = items.filter(item => item.receivedQuantity > 0)
    if (itemsToSubmit.length === 0) {
      setError("Please enter quantity received for at least one item")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: selectedPOId,
          received_by: receivedBy,
          received_date: receivedDate,
          warehouse_id: selectedWarehouseId,
          items: itemsToSubmit.map(item => ({
            product_id: item.productId,
            received_quantity: item.receivedQuantity,
            heat_number: item.heatNumber
          }))
        })
      })

      const result = await response.json()
      if (response.ok) {
        router.push(`/inventory/grn/${result.data.id}`)
      } else {
        setError(result.error || 'Failed to create GRN')
      }
    } catch (err) {
      setError('An error occurred while creating GRN')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout title="New GRN">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Goods Receipt Note</h2>
            <p className="text-muted-foreground">
              Record goods received against a Purchase Order
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
            GRN can only be created against POs that have been sent or acknowledged. Materials will be added to inventory pending QC inspection.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Purchase Order</CardTitle>
              <CardDescription>Choose a PO to receive goods against</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Purchase Order *</Label>
                <Select value={selectedPOId} onValueChange={setSelectedPOId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PO" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligiblePOs.length === 0 ? (
                      <SelectItem value="none" disabled>No eligible POs available</SelectItem>
                    ) : (
                      eligiblePOs.map(po => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.poNumber} - {po.vendorName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedPO && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">PO Number:</span>
                    <span className="font-mono font-medium">{selectedPO.poNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vendor:</span>
                    <span className="font-medium">{selectedPO.vendorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">{selectedPO.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value:</span>
                    <span className="font-bold">₹{selectedPO.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receipt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Warehouse / Location *</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Received Date *</Label>
                <Input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Received By *</Label>
                <Input
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Store manager name"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedPO && items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items to Receive</CardTitle>
              <CardDescription>Enter received quantities and heat numbers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Already Received</TableHead>
                    <TableHead className="text-right">Receiving Now</TableHead>
                    <TableHead>Heat Number *</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const poItem = selectedPO.items.find((i: any) => i.id === item.id)
                    const alreadyReceived = poItem?.received_quantity || 0
                    const pending = item.orderedQuantity - alreadyReceived

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">{item.orderedQuantity}</TableCell>
                        <TableCell className="text-right text-green-600">{alreadyReceived}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={pending}
                            value={item.receivedQuantity}
                            onChange={(e) => updateLineItem(item.id, "receivedQuantity", Math.min(parseInt(e.target.value) || 0, pending))}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.heatNumber}
                            onChange={(e) => updateLineItem(item.id, "heatNumber", e.target.value)}
                            placeholder="Heat/Batch Number"
                            className="w-40"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !isPOValid}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create GRN
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}

export default function NewGRNPage() {
  return (
    <Suspense fallback={
      <PageLayout title="New GRN">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    }>
      <NewGRNForm />
    </Suspense>
  )
}
