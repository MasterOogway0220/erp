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

import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DispatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [dispatch, setDispatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchDispatch = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dispatches/${params.id}`)
      const data = await res.json()
      if (res.ok) {
        setDispatch(data.data)
      } else {
        setError(data.error || "Failed to load dispatch details")
      }
    } catch (err) {
      setError("An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispatch()
  }, [params.id])

  const handleAction = async (status: string) => {
    try {
      setActionLoading(true)
      const res = await fetch(`/api/dispatches/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (res.ok) {
        setDispatch(data.data)
      } else {
        setError(data.error || "Action failed")
      }
    } catch (err) {
      setError("An error occurred while performing action")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Loading Dispatch">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-4">Fetching dispatch details...</p>
        </div>
      </PageLayout>
    )
  }

  if (error || !dispatch) {
    return (
      <PageLayout title="Dispatch Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          {error && (
            <Alert variant="destructive" className="max-w-md mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <p className="text-muted-foreground mb-4">Dispatch not found</p>
          <Button variant="outline" onClick={() => router.push("/inventory/dispatch")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dispatches
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`Dispatch ${dispatch.dispatch_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/inventory/dispatch")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{dispatch.dispatch_number}</h2>
                <Badge className={statusColors[dispatch.status]}>{dispatch.status}</Badge>
              </div>
              <p className="text-muted-foreground">Dispatch Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {dispatch.status === "pending" && (
              <Button onClick={() => handleAction('dispatched')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                Mark Dispatched
              </Button>
            )}
            {dispatch.status === "dispatched" && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('delivered')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Mark Delivered
              </Button>
            )}
            {dispatch.status === "delivered" && (!dispatch.invoices || dispatch.invoices.length === 0) && (
              <Button asChild>
                <Link href={`/sales/invoices/new?dispatchId=${dispatch.id}`}>
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
              <p className="font-mono font-semibold">{dispatch.sales_order?.so_number}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{dispatch.sales_order?.customer?.name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Dispatch Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{new Date(dispatch.dispatch_date).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" /> Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{dispatch.vehicle_number || "-"}</p>
              {dispatch.driver_name && (
                <p className="text-xs text-muted-foreground">{dispatch.driver_name}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {dispatch.sales_order && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Source Sales Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{dispatch.sales_order.so_number}</p>
                  <p className="text-sm text-muted-foreground">{dispatch.sales_order.customer?.name} | Customer PO: {dispatch.sales_order.customer_po_number}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/sales/orders/${dispatch.sales_order.id}`}>View Sales Order</Link>
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
                {dispatch.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name || "Product"}</TableCell>
                    <TableCell className="font-mono text-sm">{item.heat_number}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {dispatch.invoices && dispatch.invoices.length > 0 && (
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
                  {dispatch.invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.currency === "INR" ? "₹" : "$"}{inv.total_amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/sales/invoices/${inv.id}`}>View</Link>
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
            <p>Created At: {new Date(dispatch.created_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
