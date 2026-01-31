"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Eye, Send, Package, FileText, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { useStore } from "@/lib/store"

interface PurchaseOrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  receivedQuantity: number
  heatNumber?: string
}

interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  vendorName: string
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  total: number
  deliveryDate: string
  status: "draft" | "sent" | "acknowledged" | "partial_received" | "received" | "closed" | "cancelled"
  revision: number
  createdAt: string
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  acknowledged: "bg-purple-100 text-purple-800",
  partial_received: "bg-orange-100 text-orange-800",
  received: "bg-green-100 text-green-800",
  closed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function PurchaseOrdersPage() {
  const { addPurchaseOrder, updatePurchaseOrder, generateNumber } = useStore()
  const [vendors, setVendors] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [selectedVendor, setSelectedVendor] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")

  // Email States
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")

  const approvedVendors = vendors.filter(v => v.status === 'approved' || v.isApproved)


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [poRes, vendorRes, productRes] = await Promise.all([
          fetch('/api/purchase-orders'),
          fetch('/api/vendors'),
          fetch('/api/products')
        ])

        const poData = await poRes.json()
        const vendorData = await vendorRes.json()
        const productData = await productRes.json()

        setVendors(vendorData.data || vendorData || [])
        setProducts(productData.data || productData || [])

        if (poRes.ok && poData) {
          const posArray = poData.data || poData || []
          setPurchaseOrders(posArray.map((po: any) => ({
            id: po.id,
            poNumber: po.po_number || 'N/A',
            vendorId: po.vendor_id,
            vendorName: po.vendor?.name || 'Unknown',
            items: (po.items || []).map((i: any) => ({
              id: i.id,
              productId: i.product_id,
              productName: i.product?.name || 'Unknown',
              quantity: i.quantity || 0,
              receivedQuantity: i.received_quantity || 0,
              unitPrice: i.unit_price || 0,
              total: i.total || 0
            })),
            subtotal: po.subtotal || 0,
            tax: po.tax || 0,
            total: po.total || 0,
            deliveryDate: po.delivery_date?.split('T')[0] || '',
            status: po.status || 'draft',
            revision: po.revision || 1,
            createdAt: po.created_at?.split('T')[0] || ''
          })))
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('An error occurred while fetching data')
        setVendors([])
        setProducts([])
        setPurchaseOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])


  const fetchPurchaseOrders = async () => {
    // Keep this for refreshing after actions
    try {
      const response = await fetch('/api/purchase-orders')
      const result = await response.json()
      if (response.ok) {
        setPurchaseOrders(result.data.map((po: any) => ({
          id: po.id,
          poNumber: po.po_number,
          vendorId: po.vendor_id,
          vendorName: po.vendor?.name || 'Unknown',
          items: po.items?.map((i: any) => ({
            id: i.id,
            productId: i.product_id,
            productName: i.product?.name || 'Unknown',
            quantity: i.quantity,
            receivedQuantity: i.received_quantity || 0,
            unitPrice: i.unit_price,
            total: i.total
          })) || [],
          subtotal: po.subtotal,
          tax: po.tax,
          total: po.total,
          deliveryDate: po.delivery_date?.split('T')[0],
          status: po.status,
          revision: po.revision,
          createdAt: po.created_at?.split('T')[0]
        })))
      }
    } catch (err) {
      console.error('Failed to refresh POs', err)
    }
  }

  const handleSubmit = async () => {
    if (!selectedVendor || !selectedProduct || !quantity || !unitPrice || !deliveryDate) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: selectedVendor,
          items: [{
            product_id: selectedProduct,
            quantity: parseInt(quantity),
            unit_price: parseFloat(unitPrice),
          }],
          delivery_date: deliveryDate,
        })
      })

      const result = await response.json()
      if (response.ok) {
        setOpen(false)
        resetForm()
        fetchPurchaseOrders()
      } else {
        setError(result.error || 'Failed to create purchase order')
      }
    } catch (err) {
      setError('An error occurred while creating purchase order')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedVendor("")
    setSelectedProduct("")
    setQuantity("")
    setUnitPrice("")
    setDeliveryDate("")
  }

  const handleSend = async (order: any) => {
    setSelectedPO(order)
    const vendor = vendors.find(v => v.id === order.vendorId)
    setEmailTo(vendor?.email || "")
    setEmailSubject(`Purchase Order ${order.poNumber} - SteelERP`)
    setEmailMessage(`Dear ${order.vendorName},\n\nPlease find attached the Purchase Order ${order.poNumber}.`)
    setEmailOpen(true)
  }

  const handleSendEmail = async () => {
    if (!selectedPO) return

    try {
      setEmailLoading(true)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'purchase-order',
          id: selectedPO.id,
          to: emailTo,
          subject: emailSubject,
          message: emailMessage
        })
      })

      if (response.ok) {
        setEmailOpen(false)
        // Mark as sent in DB
        await fetch(`/api/purchase-orders/${selectedPO.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'sent' })
        })
        fetchPurchaseOrders()
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to send email')
      }
    } catch (err) {
      alert('An error occurred while sending email')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <PageLayout title="Purchase Orders">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
            <p className="text-muted-foreground">Manage vendor purchase orders</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Vendor (Approved Only)</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedVendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProduct} onValueChange={(val) => {
                    setSelectedProduct(val)
                    const product = products.find(p => p.id === val)
                    if (product) setUnitPrice((product.basePrice * 0.8).toString())
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="Price"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Create Purchase Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No purchase orders found. Create your first PO.
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po) => {
                    const totalQty = po.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
                    const receivedQty = po.items.reduce((sum: number, i: any) => sum + i.receivedQuantity, 0)
                    const progress = totalQty > 0 ? (receivedQty / totalQty) * 100 : 0

                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono font-medium">
                          {po.poNumber}
                          <span className="text-xs text-muted-foreground ml-1">
                            (Rev {po.revision})
                          </span>
                        </TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>₹{po.total.toLocaleString()}</TableCell>
                        <TableCell>{po.deliveryDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[po.status]}>
                            {po.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`/api/documents/purchase-order/${po.id}/pdf`, '_blank')}
                              title="Download PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPO(po)
                                setViewOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {po.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSend(po)}
                              >
                                <Send className="h-3 w-3 mr-1" /> Send
                              </Button>
                            )}
                            {(po.status === "sent" || po.status === "acknowledged" || po.status === "partial_received") && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/inventory/grn/new?poId=${po.id}`}>
                                  <Package className="h-3 w-3 mr-1" /> GRN
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Order Details</DialogTitle>
            </DialogHeader>
            {selectedPO && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">PO Number</Label>
                    <p className="font-mono font-medium">{selectedPO.poNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vendor</Label>
                    <p className="font-medium">{selectedPO.vendorName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Delivery Date</Label>
                    <p>{selectedPO.deliveryDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedPO.status]}>
                      {selectedPO.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Revision</Label>
                    <p>{selectedPO.revision}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{selectedPO.createdAt}</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Line Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Heat No.</TableHead>
                        <TableHead className="text-right">Ordered</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {item.heatNumber || "-"}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.receivedQuantity}</TableCell>
                          <TableCell className="text-right">
                            ₹{item.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{(item.quantity * item.unitPrice).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{selectedPO.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (18%):</span>
                      <span>₹{selectedPO.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{selectedPO.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Purchase Order via Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Vendor Email</Label>
                <Input
                  value={emailTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailTo(e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={emailSubject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={emailMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  A professional PDF version of PO <strong>{selectedPO?.poNumber}</strong> will be automatically attached to this email.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailOpen(false)} disabled={emailLoading}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={emailLoading || !emailTo}>
                {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Send PO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
