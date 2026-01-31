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
import { ArrowLeft, AlertCircle, CheckCircle, Package, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface DispatchLineItem {
  id: string
  inventoryId: string
  productId: string
  productName: string
  heatNumber: string
  availableQuantity: number
  dispatchQuantity: number
  selected: boolean
}

function NewDispatchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const soId = searchParams.get("soId")

  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedSOId, setSelectedSOId] = useState(soId || "")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("")
  const [dispatchDate, setDispatchDate] = useState("")
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [driverName, setDriverName] = useState("")
  const [items, setItems] = useState<DispatchLineItem[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    setDispatchDate(new Date().toISOString().split("T")[0])
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoadingInitial(true)
      const [soRes, whRes] = await Promise.all([
        fetch('/api/sales-orders'),
        fetch('/api/warehouses')
      ])
      const soData = await soRes.json()
      const whData = await whRes.json()

      setSalesOrders(soData.data || [])
      setWarehouses(whData.data || [])

      if (whData.data?.length > 0) {
        setSelectedWarehouseId(whData.data[0].id)
      }
    } catch (err) {
      console.error('Error fetching initial data:', err)
      setError('Failed to load initial data')
    } finally {
      setLoadingInitial(false)
    }
  }

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchInventory(selectedWarehouseId)
    }
  }, [selectedWarehouseId])

  const fetchInventory = async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/inventory?warehouse_id=${warehouseId}`)
      const result = await response.json()
      setInventory(result.data || [])
    } catch (err) {
      console.error('Error fetching inventory:', err)
    }
  }

  const eligibleSOs = salesOrders.filter(so =>
    so.status === "confirmed" || so.status === "in_progress" || so.status === "partial_dispatch"
  )

  const acceptedInventory = inventory.filter(inv => inv.inspection_status === "accepted" && inv.quantity > 0)

  const selectedSO = salesOrders.find(so => so.id === selectedSOId)

  useEffect(() => {
    if (selectedSO) {
      const dispatchItems: DispatchLineItem[] = []

      selectedSO.items.forEach((soItem: any) => {
        const pendingQty = soItem.quantity - (soItem.delivered_quantity || 0)
        if (pendingQty <= 0) return

        const matchingInventory = acceptedInventory.filter(inv => inv.product_id === soItem.product_id)

        matchingInventory.forEach(inv => {
          dispatchItems.push({
            id: Math.random().toString(36).substring(2, 15),
            inventoryId: inv.id,
            productId: inv.product_id,
            productName: inv.product?.name || 'Unknown',
            heatNumber: inv.heat_number,
            availableQuantity: inv.quantity,
            dispatchQuantity: Math.min(inv.quantity, pendingQty),
            selected: true,
          })
        })
      })

      setItems(dispatchItems)
    } else {
      setItems([])
    }
  }, [selectedSO, inventory])

  const isSOValid = selectedSO && (selectedSO.status === "confirmed" || selectedSO.status === "in_progress" || selectedSO.status === "partial_dispatch")

  const toggleItem = (id: string) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      return { ...item, selected: !item.selected }
    }))
  }

  const updateQuantity = (id: string, quantity: number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      return { ...item, dispatchQuantity: Math.min(quantity, item.availableQuantity) }
    }))
  }

  const selectedItems = items.filter(item => item.selected && item.dispatchQuantity > 0)

  const handleSubmit = async () => {
    setError("")

    if (!selectedSOId || selectedSOId === "none") {
      setError("Please select a Sales Order")
      return
    }

    if (!selectedWarehouseId) {
      setError("Please select a warehouse")
      return
    }

    if (selectedItems.length === 0) {
      setError("Please select at least one item to dispatch")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_order_id: selectedSOId,
          dispatch_date: dispatchDate,
          vehicle_number: vehicleNumber,
          driver_name: driverName,
          warehouse_id: selectedWarehouseId,
          items: selectedItems.map(item => ({
            inventory_id: item.inventoryId,
            product_id: item.productId,
            quantity: item.dispatchQuantity
          }))
        })
      })

      const result = await response.json()
      if (response.ok) {
        router.push(`/inventory/dispatch/${result.data.id}`)
      } else {
        setError(result.error || 'Failed to create Dispatch')
      }
    } catch (err) {
      setError('An error occurred while creating Dispatch')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout title="New Dispatch">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Dispatch</h2>
            <p className="text-muted-foreground">
              Dispatch goods against a Sales Order
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
            Only QC-accepted inventory can be dispatched. Select items from available stock matching the SO requirements.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Sales Order</CardTitle>
              <CardDescription>Choose an SO to dispatch against</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sales Order *</Label>
                <Select value={selectedSOId} onValueChange={setSelectedSOId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SO" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleSOs.length === 0 ? (
                      <SelectItem value="none" disabled>No eligible SOs available</SelectItem>
                    ) : (
                      eligibleSOs.map(so => (
                        <SelectItem key={so.id} value={so.id}>
                          {so.soNumber} - {so.customerName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedSO && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">SO Number:</span>
                    <span className="font-mono font-medium">{selectedSO.soNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <span className="font-medium">{selectedSO.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customer PO:</span>
                    <span className="font-mono text-sm">{selectedSO.customerPONumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">{selectedSO.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dispatch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Source Warehouse *</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source warehouse" />
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
                <Label>Dispatch Date *</Label>
                <Input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g., MH-12-AB-1234"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Driver name"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedSO && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SO Line Items (Pending Delivery)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSO.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right text-green-600">{item.delivered_quantity || 0}</TableCell>
                      <TableCell className="text-right text-orange-600">{item.quantity - (item.delivered_quantity || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedSO && items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Available Inventory for Dispatch
              </CardTitle>
              <CardDescription>Select items and quantities to dispatch from <strong>{warehouses.find(w => w.id === selectedWarehouseId)?.name}</strong></CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Heat Number</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Dispatch Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No accepted inventory available in this warehouse for the SO items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="font-mono text-sm">{item.heatNumber}</TableCell>
                        <TableCell className="text-right text-green-600">{item.availableQuantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.availableQuantity}
                            value={item.dispatchQuantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-24 text-right"
                            disabled={!item.selected}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedSO && items.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No accepted inventory available for this Sales Order in the selected warehouse. Please ensure materials have passed QC inspection and are stored in the correct location.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !isSOValid || selectedItems.length === 0}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Dispatch
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}

export default function NewDispatchPage() {
  return (
    <Suspense fallback={
      <PageLayout title="New Dispatch">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    }>
      <NewDispatchForm />
    </Suspense>
  )
}
