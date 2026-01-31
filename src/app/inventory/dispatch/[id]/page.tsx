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
import { ArrowLeft, ArrowRight, FileText, User, Calendar, Truck, Package, Receipt, CheckCircle } from "lucide-react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  dispatched: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
}

export default function DispatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { dispatches, salesOrders, invoices, updateDispatch } = useStore()
  
  const dispatch = dispatches.find(d => d.id === params.id)
  const linkedSO = salesOrders.find(so => so.id === dispatch?.soId)
  const linkedInvoices = invoices.filter(inv => inv.dispatchId === params.id)
  
  if (!dispatch) {
    return (
      <PageLayout title="Dispatch Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Dispatch not found</p>
          <Button onClick={() => router.push("/inventory/dispatch")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dispatches
          </Button>
        </div>
      </PageLayout>
    )
  }
  
  const handleMarkDispatched = () => {
    updateDispatch(dispatch.id, { status: "dispatched" })
  }
  
  const handleMarkDelivered = () => {
    updateDispatch(dispatch.id, { status: "delivered" })
  }
  
  return (
    <PageLayout title={`Dispatch ${dispatch.dispatchNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/inventory/dispatch")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{dispatch.dispatchNumber}</h2>
                <Badge className={statusColors[dispatch.status]}>{dispatch.status}</Badge>
              </div>
              <p className="text-muted-foreground">Dispatch Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {dispatch.status === "pending" && (
              <Button onClick={handleMarkDispatched}>
                <Truck className="mr-2 h-4 w-4" /> Mark Dispatched
              </Button>
            )}
            {dispatch.status === "dispatched" && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleMarkDelivered}>
                <CheckCircle className="mr-2 h-4 w-4" /> Mark Delivered
              </Button>
            )}
            {dispatch.status === "delivered" && linkedInvoices.length === 0 && (
              <Button asChild>
                <Link href={`/finance/invoices/new?dispatchId=${dispatch.id}`}>
                  Create Invoice <Receipt className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" /> Sales Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono font-semibold">{dispatch.soNumber}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{dispatch.customerName}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Dispatch Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{dispatch.dispatchDate}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" /> Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{dispatch.vehicleNumber || "-"}</p>
              {dispatch.driverName && (
                <p className="text-xs text-muted-foreground">{dispatch.driverName}</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {linkedSO && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Source Sales Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{linkedSO.soNumber}</p>
                  <p className="text-sm text-muted-foreground">{linkedSO.customerName} | Customer PO: {linkedSO.customerPONumber}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/sales/orders/${linkedSO.id}`}>View Sales Order</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispatched Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatch.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.heatNumber}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {linkedInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Linked Invoices
              </CardTitle>
              <CardDescription>Invoices generated for this dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.currency === "INR" ? "₹" : "$"}{inv.total.toLocaleString()}</TableCell>
                      <TableCell>{inv.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/finance/invoices/${inv.id}`}>View</Link>
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
            <p>Created: {dispatch.createdAt}</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
