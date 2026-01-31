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
  
  const { vendors, products, purchaseRequests, salesOrders, addPurchaseOrder, generateNumber } = useStore()
  
  const approvedVendors = vendors.filter(v => v.isApproved)
  const purchaseRequest = prId ? purchaseRequests.find(pr => pr.id === prId) : null
  const salesOrder = soId ? salesOrders.find(so => so.id === soId) : null
  
  const [vendorId, setVendorId] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [items, setItems] = useState<POLineItem[]>([])
  const [error, setError] = useState("")
  
  useEffect(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    setDeliveryDate(date.toISOString().split("T")[0])
    
    if (purchaseRequest) {
      const initialItems = purchaseRequest.items.map(item => {
        const product = products.find(p => p.id === item.productId)
        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: product?.basePrice || 0,
          heatNumber: "",
        }
      })
      setItems(initialItems)
    } else if (salesOrder) {
      const initialItems = salesOrder.items.map(item => ({
        id: Math.random().toString(36).substring(2, 15),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity - item.deliveredQuantity,
        unitPrice: item.unitPrice * 0.8,
        heatNumber: "",
      })).filter(item => item.quantity > 0)
      setItems(initialItems)
    }
  }, [purchaseRequest, salesOrder, products])
  
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
          updated.unitPrice = product.basePrice
        }
      }
      
      return updated
    }))
  }
  
  const removeLineItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }
  
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const tax = subtotal * 0.18
  const total = subtotal + tax
  
  const handleSubmit = () => {
    setError("")
    
    if (!vendorId) {
      setError("Please select a vendor")
      return
    }
    
    if (!selectedVendor?.isApproved) {
      setError("Cannot create PO. Vendor must be approved first.")
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
    
    if (!deliveryDate) {
      setError("Please set delivery date")
      return
    }
    
    const purchaseOrder = {
      id: Math.random().toString(36).substring(2, 15),
      poNumber: generateNumber("PO"),
      prId: prId || undefined,
      vendorId,
      vendorName: selectedVendor?.name || "",
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        receivedQuantity: 0,
        heatNumber: item.heatNumber,
      })),
      subtotal,
      tax,
      total,
      deliveryDate,
      status: "draft" as const,
      revision: 1,
      createdAt: new Date().toISOString().split("T")[0],
    }
    
    addPurchaseOrder(purchaseOrder)
    
    if (prId) {
      useStore.setState(state => ({
        purchaseRequests: state.purchaseRequests.map(pr => 
          pr.id === prId ? { ...pr, status: "converted" as const } : pr
        )
      }))
    }
    
    router.push(`/purchase/orders/${purchaseOrder.id}`)
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
              {purchaseRequest 
                ? `From PR: ${purchaseRequest.prNumber}` 
                : salesOrder 
                ? `For SO: ${salesOrder.soNumber}`
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
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (18%):</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
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
          <Button onClick={handleSubmit}>
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
