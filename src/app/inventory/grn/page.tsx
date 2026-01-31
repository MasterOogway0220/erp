"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore, GRN } from "@/lib/store"
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
import { Plus, Eye } from "lucide-react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  pending_inspection: "bg-yellow-100 text-yellow-800",
  inspected: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
}

export default function GRNPage() {
  const { grns } = useStore()
  
  return (
    <PageLayout title="GRN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Goods Received Notes</h2>
            <p className="text-muted-foreground">Track material receipts against purchase orders</p>
          </div>
          <Button asChild>
            <Link href="/inventory/grn/new">
              <Plus className="mr-2 h-4 w-4" />
              Create GRN
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All GRNs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN Number</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No GRNs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  grns.map((grn) => (
                    <TableRow key={grn.id}>
                      <TableCell className="font-mono font-medium">
                        {grn.grnNumber}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {grn.poNumber}
                      </TableCell>
                      <TableCell>{grn.vendorName}</TableCell>
                      <TableCell>
                        {grn.items.map(item => (
                          <div key={item.id} className="text-sm">
                            {item.productName} x {item.receivedQuantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>{grn.receivedDate}</TableCell>
                      <TableCell>{grn.receivedBy}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[grn.status]}>
                          {grn.status.replace(/_/g, " ")}
                        </Badge>
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
