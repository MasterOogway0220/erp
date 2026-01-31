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
import { ArrowLeft, ArrowRight, FileText, Building2, Calendar, Package, ClipboardCheck, User } from "lucide-react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  pending_inspection: "bg-yellow-100 text-yellow-800",
  inspected: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
}

const inspectionColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  hold: "bg-orange-100 text-orange-800",
}

export default function GRNDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { grns, purchaseOrders, inventory } = useStore()
  
  const grn = grns.find(g => g.id === params.id)
  const linkedPO = purchaseOrders.find(po => po.id === grn?.poId)
  const linkedInventory = inventory.filter(inv => inv.grnNumber === grn?.grnNumber)
  
  if (!grn) {
    return (
      <PageLayout title="GRN Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">GRN not found</p>
          <Button onClick={() => router.push("/inventory/grn")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to GRNs
          </Button>
        </div>
      </PageLayout>
    )
  }
  
  return (
    <PageLayout title={`GRN ${grn.grnNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/inventory/grn")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{grn.grnNumber}</h2>
                <Badge className={statusColors[grn.status]}>{grn.status.replace(/_/g, " ")}</Badge>
              </div>
              <p className="text-muted-foreground">Goods Receipt Note Details</p>
            </div>
          </div>
          {grn.status === "pending_inspection" && (
            <Button asChild>
              <Link href="/qc/inspections">
                Go to Inspections <ClipboardCheck className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" /> PO Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono font-semibold">{grn.poNumber}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{grn.vendorName}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Received Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{grn.receivedDate}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Received By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{grn.receivedBy}</p>
            </CardContent>
          </Card>
        </div>
        
        {linkedPO && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Source Purchase Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{linkedPO.poNumber}</p>
                  <p className="text-sm text-muted-foreground">{linkedPO.vendorName}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/purchase/orders/${linkedPO.id}`}>View PO</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Received Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead className="text-right">Qty Received</TableHead>
                  <TableHead>Inspection Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grn.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.heatNumber}</TableCell>
                    <TableCell className="text-right">{item.receivedQuantity}</TableCell>
                    <TableCell>
                      <Badge className={inspectionColors[item.inspectionStatus]}>
                        {item.inspectionStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {linkedInventory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Inventory Created
              </CardTitle>
              <CardDescription>Stock items created from this GRN</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Heat Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>QC Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedInventory.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{inv.heatNumber}</TableCell>
                      <TableCell>{inv.location}</TableCell>
                      <TableCell className="text-right">{inv.quantity}</TableCell>
                      <TableCell>
                        <Badge className={inspectionColors[inv.inspectionStatus]}>
                          {inv.inspectionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/inventory/stock/${inv.id}`}>View</Link>
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
            <p>Created: {grn.createdAt}</p>
            <p>Received by: {grn.receivedBy}</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
