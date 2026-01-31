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
import { Plus, Check, X, ArrowRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  converted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
}

export default function PurchaseRequestsPage() {
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [requiredDate, setRequiredDate] = useState("")
  const [soReference, setSoReference] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [prRes, productRes, soRes] = await Promise.all([
          fetch('/api/purchase-requests'),
          fetch('/api/products'),
          fetch('/api/sales-orders')
        ])
        
        const prData = await prRes.json()
        const productData = await productRes.json()
        const soData = await soRes.json()

        setPurchaseRequests(prData.data || [])
        setProducts(productData.data || [])
        setSalesOrders(soData.data || [])
      } catch (error) {
        console.error('Error fetching PR data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  const handleSubmit = async () => {
    if (!selectedProduct || !quantity || !requiredDate) return
    
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    
    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            product_id: product.id,
            quantity: parseInt(quantity),
            required_date: requiredDate,
            so_reference: soReference || undefined,
          }],
          status: "draft",
        })
      })

      if (response.ok) {
        const updatedPRs = await (await fetch('/api/purchase-requests')).json()
        setPurchaseRequests(updatedPRs)
        setOpen(false)
        setSelectedProduct("")
        setQuantity("")
        setRequiredDate("")
        setSoReference("")
      }
    } catch (error) {
      console.error('Error creating PR:', error)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Purchase Requests">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }
  
  return (
    <PageLayout title="Purchase Requests">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Purchase Requests</h2>
            <p className="text-muted-foreground">Create and manage purchase requests</p>
          </div>
<Button asChild>
              <Link href="/purchase/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="hidden" variant="outline">
                  Quick Add
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Purchase Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Date</Label>
                  <Input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sales Order Reference (Optional)</Label>
                  <Select value={soReference} onValueChange={setSoReference}>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to SO" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {salesOrders.filter(so => so.status !== 'completed' && so.status !== 'cancelled').map((so) => (
                        <SelectItem key={so.id} value={so.soNumber}>
                          {so.soNumber} - {so.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Create Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR Number</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>SO Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No purchase requests found. Create your first request.
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-mono font-medium">
                        {pr.prNumber}
                      </TableCell>
                      <TableCell>
                        {pr.items.map(item => (
                          <div key={item.id} className="text-sm">
                            {item.productName} x {item.quantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>{pr.items[0]?.requiredDate || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {pr.items[0]?.soReference || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[pr.status]}>
                          {pr.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{pr.requestedBy}</TableCell>
                      <TableCell className="text-right">
                        {pr.status === "approved" && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/purchase/orders/new?prId=${pr.id}`}>
                              Create PO <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
