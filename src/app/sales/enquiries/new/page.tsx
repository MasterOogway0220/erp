"use client"

import { useRouter } from "next/navigation"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  gst_number?: string
}

interface Product {
  id: string
  name: string
  code: string
}

interface EnquiryLineItem {
  id: string
  productId: string
  productName: string
  quantity: number
  specifications: string
}

export default function NewEnquiryPage() {
  const router = useRouter()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const [customerId, setCustomerId] = useState("")
  const [remarks, setRemarks] = useState("")
  const [items, setItems] = useState<EnquiryLineItem[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    setLoadingData(true)
    try {
      const [customersRes, productsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products')
      ])
      
      const [customersData, productsData] = await Promise.all([
        customersRes.json(),
        productsRes.json()
      ])
      
      if (customersRes.ok) setCustomers(customersData.data || [])
      if (productsRes.ok) setProducts(productsData.data || [])
    } catch {
      setError('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }
  
  const selectedCustomer = customers.find(c => c.id === customerId)
  
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
    
    if (!customerId) {
      setError("Please select a customer")
      return false
    }
    
    if (items.length === 0) {
      setError("Please add at least one line item")
      return false
    }
    
    if (items.some(item => !item.productId || item.quantity <= 0)) {
      setError("Please fill all line items correctly")
      return false
    }
    
    return true
  }
  
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          items: items.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            specifications: item.specifications || undefined,
          })),
          remarks: remarks || undefined,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to create enquiry")
      }
      
      router.push(`/sales/enquiries/${result.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create enquiry")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }
  
  if (loadingData) {
    return (
      <PageLayout title="New Enquiry">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }
  
  return (
    <PageLayout title="New Enquiry">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Enquiry</h2>
            <p className="text-muted-foreground">
              Record a new customer enquiry
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
              <CardTitle className="text-base">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCustomer && (
                <div className="text-sm text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
                  {selectedCustomer.address && <p><span className="font-medium">Address:</span> {selectedCustomer.address}</p>}
                  <p><span className="font-medium">GST:</span> {selectedCustomer.gst_number || "N/A"}</p>
                  {selectedCustomer.phone && <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enquiry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Remarks / Notes</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional notes about this enquiry..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Enquiry Items</CardTitle>
              <CardDescription>Products the customer is enquiring about</CardDescription>
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
                            {products.map(product => (
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
            Create Enquiry
          </Button>
        </div>
      </div>
      
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Enquiry Creation</DialogTitle>
            <DialogDescription>
              You are about to create an enquiry for {selectedCustomer?.name} with {items.length} item(s).
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
