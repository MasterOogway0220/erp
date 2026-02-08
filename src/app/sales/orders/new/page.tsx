"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Interfaces reuse where possible, or define locally
interface LineItem {
  id: string
  product_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  uom: string
  hsn_code?: string
  quotation_item_id?: string
}

function SalesOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quotationId = searchParams.get("quotationId")

  // Masters
  const [customers, setCustomers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  // Form State
  const [customerId, setCustomerId] = useState("")
  const [buyerId, setBuyerId] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0])
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [currency, setCurrency] = useState("INR")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [deliveryTerms, setDeliveryTerms] = useState("")
  const [billingAddress, setBillingAddress] = useState<any>({})

  // Consignee Address (New Requirement)
  const [consigneeName, setConsigneeName] = useState("")
  const [consigneeAddress, setConsigneeAddress] = useState("")
  const [consigneeCity, setConsigneeCity] = useState("")
  const [consigneeState, setConsigneeState] = useState("")
  const [consigneePin, setConsigneePin] = useState("")
  const [consigneeContact, setConsigneeContact] = useState("")

  const [items, setItems] = useState<LineItem[]>([])
  const [remarks, setRemarks] = useState("")

  // UI State
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)

  // Fetch Masters
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [custRes, prodRes, currRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
          fetch('/api/currencies')
        ])

        const [custData, prodData, currData] = await Promise.all([
          custRes.json(),
          prodRes.json(),
          currRes.json()
        ])

        setCustomers(custData.data || [])
        setProducts(prodData.data || [])
        setCurrencies(currData.data || [])

        // If converting from Quotation
        if (quotationId) {
          const qRes = await fetch(`/api/quotations/${quotationId}`)
          if (qRes.ok) {
            const result = await qRes.json()
            const q = result.data
            setCustomerId(q.customer_id)
            setBuyerId(q.buyer_id || "")
            setCurrency(q.currency)

            // Map Items with full descriptions
            const mappedItems = (q.items || []).map((i: any) => ({
              id: Math.random().toString(36).substring(2, 9),
              product_id: i.product_id || "",
              description: i.description || i.description_text || i.product?.name || "Item",
              quantity: i.quantity,
              unit_price: i.unit_price,
              amount: i.line_total,
              uom: i.uom || i.product?.uom || 'Unit',
              quotation_item_id: i.id
            }))
            setItems(mappedItems)

            // Default Consignee / Billing from Customer
            if (q.customer) {
              setConsigneeName(q.customer.name || "")
              setConsigneeAddress(q.customer.address || "")
              setBillingAddress({
                name: q.customer.name,
                address: q.customer.address,
                gstin: q.customer.gst_number
              })
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch data", err)
        setError("Failed to load initial data")
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [quotationId])

  // Fetch Buyers when Customer changes
  useEffect(() => {
    if (customerId) {
      fetch(`/api/buyers?customer_id=${customerId}`)
        .then(res => res.json())
        .then(data => setBuyers(data.data || []))
        .catch(console.error)

      // Also fetch customer details for address
      const cust = customers.find(c => c.id === customerId)
      if (cust) {
        setBillingAddress({
          name: cust.name,
          address: cust.address, // simplistic mapping
          gstin: cust.gst_number
        })
        // defaulted consignee
        if (!consigneeName) setConsigneeName(cust.name)
        if (!consigneeAddress) setConsigneeAddress(cust.address || "")
      }
    } else {
      setBuyers([])
    }
  }, [customerId, customers, consigneeName, consigneeAddress])


  const addItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substring(2, 9),
      product_id: "",
      description: "",
      quantity: 0,
      unit_price: 0,
      amount: 0,
      uom: "Nos"
    }])
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }

      if (field === 'product_id') {
        const prod = products.find(p => p.id === value)
        if (prod) {
          updated.description = prod.name
          updated.uom = prod.unit || 'Nos'
          updated.unit_price = prod.base_price || 0
        }
      }

      if (field === 'quantity' || field === 'unit_price') {
        updated.amount = (updated.quantity || 0) * (updated.unit_price || 0)
      }
      return updated
    }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const calculateTotal = () => items.reduce((sum, i) => sum + i.amount, 0)

  const handleSubmit = async () => {
    console.log('handleSubmit - Current customerId:', customerId);
    console.log('handleSubmit - Current buyerId:', buyerId);

    if (!customerId) {
      console.warn('handleSubmit - customerId is missing');
      setError("Customer is required")
      return
    }
    if (!buyerId && buyers.length > 0) {
      console.warn('handleSubmit - buyerId is missing but buyers are available');
      setError("Buyer contact is required")
      return
    }
    if (!poNumber || !poDate) {
      setError("Customer PO Number and Date are mandatory")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = {
        customer_id: customerId,
        buyer_id: buyerId,
        quotation_id: quotationId || null,
        customer_po_number: poNumber,
        customer_po_date: poDate,
        order_date: orderDate,
        currency,
        payment_terms: paymentTerms,
        delivery_terms: deliveryTerms,
        remarks,
        billing_address: billingAddress,
        shipping_address: {
          name: consigneeName,
          address: consigneeAddress,
          city: consigneeCity,
          state: consigneeState,
          pincode: consigneePin,
          contact: consigneeContact
        },
        items: items.map(i => ({
          product_id: i.product_id,
          quotation_item_id: i.quotation_item_id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_amount: i.amount,
          uom: i.uom,
          // metadata for specs if needed
        }))
      }

      const res = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create Order")

      router.push('/sales/orders')
    } catch (err: any) {
      setError(err.message)
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return <div className="flex h-[400px] justify-center items-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    <PageLayout title="New Sales Order">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">New Sales Order</h2>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Order Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select
                    value={customerId}
                    onValueChange={setCustomerId}
                    disabled={!!quotationId && !!customerId}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Buyer *</Label>
                  <Select
                    value={buyerId}
                    onValueChange={setBuyerId}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Buyer Contact" /></SelectTrigger>
                    <SelectContent>
                      {buyers.map(b => <SelectItem key={b.id} value={b.id}>{b.buyer_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PO Number *</Label>
                  <Input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Cust PO No." />
                </div>
                <div className="space-y-2">
                  <Label>PO Date *</Label>
                  <Input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Dispatch / Consignee Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Consignee Name</Label>
                <Input value={consigneeName} onChange={e => setConsigneeName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={consigneeAddress} onChange={e => setConsigneeAddress(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={consigneeCity} onChange={e => setConsigneeCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={consigneeState} onChange={e => setConsigneeState(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input value={consigneePin} onChange={e => setConsigneePin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={consigneeContact} onChange={e => setConsigneeContact(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-sm">Order Items</CardTitle>
            <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Product</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[100px]">Unit</TableHead>
                  <TableHead className="w-[150px]">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select value={item.product_id} onValueChange={v => updateItem(item.id, 'product_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))} />
                    </TableCell>
                    <TableCell>{item.uom}</TableCell>
                    <TableCell>
                      <Input type="number" value={item.unit_price} onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))} />
                    </TableCell>
                    <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <div className="text-right">
            <div className="text-lg font-bold">Total: {currency} {calculateTotal().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+ Taxes as applicable</p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={() => setShowConfirm(true)} disabled={items.length === 0}>Create Order</Button>
        </div>

        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Sales Order</DialogTitle>
              <DialogDescription>
                Create Sales Order for {customers.find(c => c.id === customerId)?.name} with Total {currency} {calculateTotal().toLocaleString()}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Confirm & Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PageLayout>
  )
}

export default function NewSalesOrderPage() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin" />}>
      <SalesOrderForm />
    </Suspense>
  )
}
