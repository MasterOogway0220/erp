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
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

interface PRLineItem {
  id: string
  productId: string
  productName: string
  quantity: number
  specifications: string
}

function NewPurchaseRequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const salesOrderId = searchParams.get("soId")
  
  const { products, salesOrders, addPurchaseRequest } = useStore()
  
  const activeProducts = products.filter(p => p.isActive !== false)
  const linkedSO = salesOrderId ? salesOrders.find(so => so.id === salesOrderId) : null
  
  const [selectedSOId, setSelectedSOId] = useState(salesOrderId || "")
  const [requiredDate, setRequiredDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [items, setItems] = useState<PRLineItem[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  useEffect(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    setRequiredDate(date.toISOString().split("T")[0])
  }, [])
  
  useEffect(() => {
    if (linkedSO) {
      const initialItems = linkedSO.items.map(item => ({
        id: Math.random().toString(36).substring(2, 15),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        specifications: "",
      }))
      setItems(initialItems)
    }
  }, [linkedSO])
  
  const addLineItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substring(2, 15),
      productId: "",
      productName: "",
      quantity: 1,
      specifications: "",
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
        }
      }
      
      return updated
    }))
  }
  
  const removeLineItem = (id: string) => {
    if (items.length === 1) {
      setError("At least one line item is required")
      return
    }
    setItems(items.filter(item => item.id !== id))
  }
  
  const validateForm = () => {
    setError("")
    
    if (items.length === 0) {
      setError("Please add at least one line item")
      return false
    }
    
    if (items.some(item => !item.productId || item.quantity <= 0)) {
      setError("Please fill all line items correctly")
      return false
    }
    
    if (!requiredDate) {
      setError("Please set required date")
      return false
    }
    
    return true
  }
  
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const prNumber = `PR-${Date.now().toString(36).toUpperCase()}`
      
      const newPR = {
        id: Math.random().toString(36).substring(2, 15),
        prNumber,
        salesOrderId: selectedSOId || undefined,
        soNumber: linkedSO?.soNumber,
        status: "draft" as const,
        requiredDate,
        remarks,
        items: items.map(item => ({
          id: Math.random().toString(36).substring(2, 15),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          specifications: item.specifications,
        })),
        createdAt: new Date().toISOString().split("T")[0],
        createdBy: "admin",
      }
      
      addPurchaseRequest(newPR)
      router.push("/purchase/requests")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase request")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }
  
  return (
    <PageLayout title="New Purchase Request">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Purchase Request</h2>
            <p className="text-muted-foreground">
              {linkedSO ? `For Sales Order: ${linkedSO.soNumber}` : "Request materials for procurement"}
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
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link to Sales Order (Optional)</Label>
                <Select value={selectedSOId} onValueChange={setSelectedSOId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales order (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No linked SO</SelectItem>
                    {salesOrders.filter(so => so.status === "open" || so.status === "confirmed" || so.status === "in_progress").map(so => (
                      <SelectItem key={so.id} value={so.id}>
                        {so.soNumber} - {so.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Required By Date *</Label>
                <Input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Remarks / Justification</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Reason for purchase request..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Request Items</CardTitle>
              <CardDescription>Products to be procured</CardDescription>
            </div>
            <Button size="sm" onClick={addLineItem}>
              <Plus className="mr-1 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead className="text-right w-[120px]">Quantity</TableHead>
                  <TableHead>Specifications</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                            {activeProducts.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.code})
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
                          value={item.specifications}
                          onChange={(e) => updateLineItem(item.id, "specifications", e.target.value)}
                          placeholder="Grade, size, etc."
                        />
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
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => {
            if (validateForm()) setShowConfirm(true)
          }} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Purchase Request
          </Button>
        </div>
      </div>
      
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase Request Creation</DialogTitle>
            <DialogDescription>
              You are about to create a purchase request with {items.length} item(s).
              {linkedSO && (
                <><br />Linked to Sales Order: {linkedSO.soNumber}</>
              )}
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
    </PageLayout>
  )
}

export default function NewPurchaseRequestPage() {
  return (
    <Suspense fallback={
      <PageLayout title="New Purchase Request">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    }>
      <NewPurchaseRequestForm />
    </Suspense>
  )
}
