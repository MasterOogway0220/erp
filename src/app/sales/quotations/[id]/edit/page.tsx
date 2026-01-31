"use client"

import { useParams, useRouter } from "next/navigation"
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
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuotationLineItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  size?: string
  grade?: string
  unit?: string
}

interface Customer {
  id: string
  name: string
  address?: string
  gstNumber?: string
}

interface Product {
  id: string
  name: string
  code: string
  basePrice: number
}

function EditQuotationForm() {
  const params = useParams()
  const router = useRouter()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [quotation, setQuotation] = useState<any>(null)
  
  const [customerId, setCustomerId] = useState("")
  const [quotationType, setQuotationType] = useState<"domestic" | "export">("domestic")
  const [currency, setCurrency] = useState("INR")
  const [validUntil, setValidUntil] = useState("")
  const [remarks, setRemarks] = useState("")
  const [items, setItems] = useState<QuotationLineItem[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [incoterms, setIncoterms] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [deliveryPeriod, setDeliveryPeriod] = useState("")
  const [packingCharges, setPackingCharges] = useState(0)
  const [freightCharges, setFreightCharges] = useState(0)
  const [insuranceCharges, setInsuranceCharges] = useState(0)
  const [termsAndConditions, setTermsAndConditions] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [customersRes, productsRes, quotationRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
          fetch(`/api/quotations/${params.id}`)
        ])
        
        const customersData = await customersRes.json()
        const productsData = await productsRes.json()
        const quotationData = await quotationRes.json()
        
        if (customersRes.ok) {
          setCustomers(customersData.data?.map((c: any) => ({
            id: c.id,
            name: c.name,
            address: c.address,
            gstNumber: c.gst_number
          })) || [])
        }
        
        if (productsRes.ok) {
          setProducts(productsData.data?.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            basePrice: p.base_price || 0
          })) || [])
        }
        
        if (quotationRes.ok && quotationData.data) {
          const q = quotationData.data
          setQuotation(q)
          setCustomerId(q.customer_id)
          setCurrency(q.currency)
          setQuotationType(q.currency === "INR" ? "domestic" : "export")
          setValidUntil(q.valid_until ? q.valid_until.split('T')[0] : "")
          setRemarks(q.remarks || "")
          setItems(q.items?.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product?.name || 'Unknown',
            quantity: item.quantity,
            unitPrice: item.unit_price,
            discount: item.discount_percent,
            total: item.line_total,
            size: item.size || "",
            grade: item.grade || "",
            unit: item.unit || ""
          })) || [])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError("Failed to load quotation data")
      } finally {
        setDataLoading(false)
      }
    }
    
    fetchData()
  }, [params.id])
  
  const selectedCustomer = customers.find(c => c.id === customerId)
  
  const addLineItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substring(2, 15),
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0,
      size: "",
      grade: "",
      unit: ""
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
      
      updated.total = updated.quantity * updated.unitPrice * (1 - updated.discount / 100)
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
  
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.18
  const totalCharges = packingCharges + freightCharges + insuranceCharges
  const total = subtotal + tax + totalCharges
  
  const validateForm = () => {
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
    
    if (!validUntil) {
      setError("Please set validity date")
      return false
    }
    
    return true
  }
  
  const handleSubmit = async () => {
    setError("")
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/quotations/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'update',
          customer_id: customerId,
          items: items.map(item => ({
            id: typeof item.id === 'string' && item.id.length > 20 ? undefined : item.id, // Only send real IDs if they exist
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: item.discount,
            size: item.size,
            grade: item.grade,
            unit: item.unit
          })),
          currency,
          valid_until: validUntil,
          remarks,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to update quotation")
      }
      
      router.push(`/sales/quotations/${params.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quotation")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }
  
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Quotation</h2>
          <p className="text-muted-foreground">
            Modify quotation {quotation?.quotation_number}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {quotation?.status !== 'draft' && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quotation is currently <strong>{quotation?.status}</strong>. Editing it will reset its status to <strong>draft</strong> and require re-approval.
          </AlertDescription>
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
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomer && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{selectedCustomer.address}</p>
                <p>GST: {selectedCustomer.gstNumber || "N/A"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quotation Type *</Label>
                <Select
                  value={quotationType}
                  onValueChange={(val: "domestic" | "export") => {
                    setQuotationType(val)
                    setCurrency(val === "domestic" ? "INR" : "USD")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">Domestic</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency *</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quotationType === "domestic" ? (
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valid Until *</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Line Items</CardTitle>
            <CardDescription>Add products to the quotation</CardDescription>
          </div>
          <Button size="sm" onClick={addLineItem}>
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Product</TableHead>
                <TableHead className="w-[150px]">Specs (Size/Grade)</TableHead>
                <TableHead className="w-[80px]">Unit</TableHead>
                <TableHead className="w-[90px] text-right">Quantity</TableHead>
                <TableHead className="w-[110px] text-right">Unit Price</TableHead>
                <TableHead className="w-[90px] text-right">Discount%</TableHead>
                <TableHead className="text-right w-[110px]">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                      <div className="space-y-1">
                        <Input
                          placeholder="Size"
                          value={item.size || ""}
                          onChange={(e) => updateLineItem(item.id, "size", e.target.value)}
                          className="h-7 text-xs"
                        />
                        <Input
                          placeholder="Grade"
                          value={item.grade || ""}
                          onChange={(e) => updateLineItem(item.id, "grade", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Unit"
                        value={item.unit || ""}
                        onChange={(e) => updateLineItem(item.id, "unit", e.target.value)}
                        className="w-16 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                        className="w-20 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => updateLineItem(item.id, "discount", parseFloat(e.target.value) || 0)}
                        className="w-16 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {currency === "INR" ? "₹" : "$"}{item.total.toLocaleString()}
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
                  <span>{currency === "INR" ? "₹" : "$"}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%):</span>
                  <span>{currency === "INR" ? "₹" : "$"}{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{currency === "INR" ? "₹" : "$"}{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
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
          Update Quotation
        </Button>
      </div>
      
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update this quotation? 
              {quotation?.status !== 'draft' && " This will reset the status to draft."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function EditQuotationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageLayout title="Edit Quotation">
        <EditQuotationForm />
      </PageLayout>
    </Suspense>
  )
}
