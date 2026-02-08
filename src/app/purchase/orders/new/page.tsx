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
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface POLineItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  heatNumber: string
}

function NewPurchaseOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prId = searchParams.get("prId")
  const soId = searchParams.get("soId")

  const [vendors, setVendors] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendorId, setVendorId] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [items, setItems] = useState<POLineItem[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [vRes, pRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/products')
        ])
        const vData = await vRes.json()
        const pData = await pRes.json()

        setVendors(vData.data || [])
        setProducts(pData.data || [])

        if (soId) {
          const soRes = await fetch(`/api/sales-orders/${soId}`)
          const soData = await soRes.json()
          if (soRes.ok && soData.data) {
            const initialItems = soData.data.items.map((item: any) => ({
              id: Math.random().toString(36).substring(2, 15),
              productId: item.product_id,
              productName: item.product?.name || "Product",
              quantity: item.quantity - (item.delivered_quantity || 0),
              unit_price: item.unit_price * 0.8, // Default 20% margin for purchase
              so_item_id: item.id,
              heatNumber: "",
            })).filter((item: any) => item.quantity > 0)
            setItems(initialItems)
          }
        }
      } catch (err) {
        console.error("Failed to fetch data")
        setError("Failed to load required data")
      } finally {
        setLoading(false)
      }
    }

    const date = new Date()
    date.setDate(date.getDate() + 14)
    setDeliveryDate(date.toISOString().split("T")[0])

    fetchData()
  }, [soId])

  const approvedVendors = vendors.filter(v => v.is_approved || v.status === 'approved')
  const selectedVendor = vendors.find(v => v.id === vendorId)

  const addLineItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substring(2, 15),
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      heatNumber: "",
    }])
  }

  const updateLineItem = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item

      const updated = { ...item, [field]: value }

      if (field === "productId") {
        const product = products.find(p => p.id === value)
        if (product) {
          updated.productName = product.name
          updated.unitPrice = product.basePrice || 0
        }
      }

      return updated
    }))
  }

  const removeLineItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || (item as any).unit_price || 0)), 0)
  const tax = subtotal * 0.18
  const total = subtotal + tax

  const handleSubmit = async () => {
    setError("")

    if (!vendorId) {
      setError("Please select a vendor")
      return
    }

    if (items.length === 0) {
      setError("Please add at least one line item")
      return
    }

    if (items.some(item => !item.productId || item.quantity <= 0)) {
      setError("Please fill all line items correctly")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          sales_order_id: soId || null,
          items: items.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice || (item as any).unit_price || 0,
            heat_number: item.heatNumber || null,
            so_item_id: (item as any).so_item_id || null
          })),
          delivery_date: deliveryDate,
        })
      })

      const result = await response.json()
      if (response.ok) {
        router.push(`/purchase/orders/${result.data.id}`)
      } else {
        setError(result.error || "Failed to create purchase order")
      }
    } catch (err) {
      setError("An error occurred during submission")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout title="New Purchase Order">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Purchase Order</h2>
            <p className="text-muted-foreground">
              {loading
                ? "Loading details..."
                : prId
                  ? `From PR: ${prId}`
                  : soId
                    ? `For SO: ${soId}`
                    : "Create a new purchase order"}
            </p>
          </div>
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
              <CardTitle className="text-base">Vendor Details</CardTitle>
              <CardDescription>Select an approved vendor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Vendor * (Approved Only)</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedVendors.length === 0 ? (
                      <SelectItem value="none" disabled>No approved vendors available</SelectItem>
                    ) : (
                      approvedVendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} (Rating: {vendor.rating})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedVendor && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{selectedVendor.address}</p>
                  <p>GST: {selectedVendor.gstNumber || "N/A"}</p>
                  <p>Email: {selectedVendor.email}</p>
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
                <Label>Expected Delivery Date *</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Line Items</CardTitle>
              <CardDescription>Add products to the purchase order</CardDescription>
            </div>
            <Button size="sm" onClick={addLineItem}>
              <Plus className="mr-1 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No items added. Click "Add Item" to start.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateLineItem(item.id, "productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.heatNumber}
                          onChange={(e) => updateLineItem(item.id, "heatNumber", e.target.value)}
                          placeholder="Optional"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{(item.quantity * item.unitPrice).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {items.length > 0 && (
              <div className="flex justify-end mt-4">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Tax (18%):</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-primary">
                    <span>Total:</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Purchase Order
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}

export default function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={
      <PageLayout title="New Purchase Order">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    }>
      <NewPurchaseOrderForm />
    </Suspense>
  )
}
