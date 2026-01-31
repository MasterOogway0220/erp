"use client"

import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, ArrowRight, FileText, Building2, Calendar, DollarSign, Package, CheckCircle, Send } from "lucide-react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  acknowledged: "bg-cyan-100 text-cyan-800",
  partial_received: "bg-orange-100 text-orange-800",
  received: "bg-green-100 text-green-800",
  closed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { purchaseOrders, grns, updatePurchaseOrder } = useStore()
  
  const po = purchaseOrders.find(p => p.id === params.id)
  const linkedGRNs = grns.filter(g => g.poId === params.id)
  
  if (!po) {
    return (
      <PageLayout title="Purchase Order Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Purchase Order not found</p>
          <Button onClick={() => router.push("/purchase/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchase Orders
          </Button>
        </div>
      </PageLayout>
    )
  }
  
  const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0)
  const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0)
  const receiveProgress = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0
  
  const handleSend = () => {
    updatePurchaseOrder(po.id, { status: "sent" })
  }
  
  const handleAcknowledge = () => {
    updatePurchaseOrder(po.id, { status: "acknowledged" })
  }
  
  return (
    <PageLayout title={`Purchase Order ${po.poNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/purchase/orders")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{po.poNumber}</h2>
                <Badge className={statusColors[po.status]}>{po.status.replace(/_/g, " ")}</Badge>
                <Badge variant="outline">Rev {po.revision}</Badge>
              </div>
              <p className="text-muted-foreground">Purchase Order Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {po.status === "draft" && (
              <Button onClick={handleSend}>
                <Send className="mr-2 h-4 w-4" /> Send to Vendor
              </Button>
            )}
            {po.status === "sent" && (
              <Button onClick={handleAcknowledge}>
                <CheckCircle className="mr-2 h-4 w-4" /> Mark Acknowledged
              </Button>
            )}
            {(po.status === "sent" || po.status === "acknowledged" || po.status === "partial_received") && (
              <Button asChild>
                <Link href={`/inventory/grn/new?poId=${po.id}`}>
                  Create GRN <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{po.vendorName}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> PO Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">₹{po.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Delivery Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{po.deliveryDate}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Receipt Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">{receiveProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${receiveProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.heatNumber || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right text-green-600">{item.receivedQuantity}</TableCell>
                    <TableCell className="text-right text-orange-600">{item.quantity - item.receivedQuantity}</TableCell>
                    <TableCell className="text-right">₹{item.unitPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{po.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%):</span>
                  <span>₹{po.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{po.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {linkedGRNs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Goods Receipt Notes
              </CardTitle>
              <CardDescription>GRNs created against this PO</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN Number</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedGRNs.map((grn) => (
                    <TableRow key={grn.id}>
                      <TableCell className="font-mono">{grn.grnNumber}</TableCell>
                      <TableCell>{grn.receivedDate}</TableCell>
                      <TableCell>{grn.receivedBy}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{grn.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/inventory/grn/${grn.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Audit Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Created: {po.createdAt}</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
