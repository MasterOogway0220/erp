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
import { Plus, Loader2, AlertCircle, Eye, FileText, Truck } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTablePagination } from "@/components/DataTablePagination"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  ready_for_dispatch: "bg-purple-100 text-purple-800",
  partially_dispatched: "bg-indigo-100 text-indigo-800",
  dispatched: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all") // all, open, completed

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchOrders()
  }, [currentPage, pageSize])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-orders?page=${currentPage}&pageSize=${pageSize}`)
      const result = await response.json()

      if (response.ok) {
        setOrders(result.data || [])
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalCount(result.pagination.totalCount)
        }
      } else {
        setError(result.error || 'Failed to fetch sales orders')
      }
    } catch (err) {
      setError('An error occurred while fetching data')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'completed') return ['completed', 'cancelled', 'dispatched'].includes(order.status)
    if (filter === 'open') return !['completed', 'cancelled', 'dispatched'].includes(order.status)
    return true
  })

  if (loading) {
    return (
      <PageLayout title="Sales Orders">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Sales Orders">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sales Orders</h2>
            <p className="text-muted-foreground">Manage confirmed orders and dispatch</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/sales/orders/new">
                <Plus className="mr-2 h-4 w-4" />
                New Sales Order
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                All Orders ({totalCount})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'open' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter('open')}
                >
                  Open
                </Button>
                <Button
                  variant={filter === 'completed' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>PO Ref</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No sales orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.order_date?.split('T')[0]}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customer?.name}</span>
                          <span className="text-xs text-muted-foreground">{order.buyer?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.customer_po_number}</TableCell>
                      <TableCell>
                        {order.currency === "INR" ? "₹" : "$"}
                        {order.total_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || "bg-gray-100"}>
                          {order.status?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="Track Order">
                            <Link href={`/sales/orders/${order.id}/tracking`}>
                              <Truck className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="View Details">
                            <Link href={`/sales/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {/* Future: Add Print/Dispatch buttons */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
