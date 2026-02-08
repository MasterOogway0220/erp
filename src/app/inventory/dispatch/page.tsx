"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore, Dispatch } from "@/lib/store"
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
import { Plus, Truck } from "lucide-react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  dispatched: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
}

export default function DispatchPage() {
  const { dispatches, updateDispatch } = useStore()

  const handleMarkDelivered = (id: string) => {
    updateDispatch(id, { status: "delivered" })
  }

  return (
    <PageLayout title="Dispatch">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dispatch Management</h2>
            <p className="text-muted-foreground">Track outgoing shipments to customers</p>
          </div>
          <Button asChild>
            <Link href="/inventory/dispatch/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Dispatch
            </Link>
          </Button>
        </div>

        <Card className="border-orange-100 bg-orange-50/10">
          <CardHeader>
            <CardTitle className="text-base text-orange-700">Dispatch Planning</CardTitle>
            <CardDescription>Orders confirmed and ready for scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              // This mocks the pending SOs for planning
              const pendingSOs = [
                { id: '1', soNumber: 'SO/24-25/088', customer: 'Reliance Industries', date: '2024-05-15', items: 3 },
                { id: '2', soNumber: 'SO/24-25/092', customer: 'L&T Construction', date: '2024-05-18', items: 5 }
              ]
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingSOs.map(so => (
                    <div key={so.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                      <div>
                        <div className="font-mono font-bold text-sm">{so.soNumber}</div>
                        <div className="text-xs text-muted-foreground">{so.customer}</div>
                        <div className="text-[10px] mt-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full inline-block">
                          {so.items} Items Pending
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/inventory/dispatch/new?soId=${so.id}`}>
                          Schedule
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Dispatches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch No.</TableHead>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No dispatches found.
                    </TableCell>
                  </TableRow>
                ) : (
                  dispatches.map((dispatch) => (
                    <TableRow key={dispatch.id}>
                      <TableCell className="font-mono font-medium">
                        {dispatch.dispatchNumber}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {dispatch.soNumber}
                      </TableCell>
                      <TableCell>{dispatch.customerName}</TableCell>
                      <TableCell>
                        {dispatch.items.map(item => (
                          <div key={item.id} className="text-sm">
                            {item.productName} x {item.quantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {dispatch.vehicleNumber || "-"}
                      </TableCell>
                      <TableCell>{dispatch.driverName || "-"}</TableCell>
                      <TableCell>{dispatch.dispatchDate}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[dispatch.status]}>
                          {dispatch.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {dispatch.status === "dispatched" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkDelivered(dispatch.id)}
                          >
                            Mark Delivered
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
