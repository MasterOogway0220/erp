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
import { ArrowLeft, Package, MapPin, FileText, Calendar, Beaker, Truck } from "lucide-react"
import Link from "next/link"

const inspectionColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  hold: "bg-orange-100 text-orange-800",
}

export default function InventoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { inventory, grns, inspections, dispatches } = useStore()
  
  const item = inventory.find(i => i.id === params.id)
  const linkedGRN = grns.find(g => g.grnNumber === item?.grnNumber)
  const linkedInspection = inspections.find(i => i.heatNumber === item?.heatNumber)
  const linkedDispatches = dispatches.filter(d => d.items.some(di => di.heatNumber === item?.heatNumber))
  
  if (!item) {
    return (
      <PageLayout title="Inventory Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Inventory item not found</p>
          <Button onClick={() => router.push("/inventory/stock")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>
        </div>
      </PageLayout>
    )
  }
  
  return (
    <PageLayout title={`Inventory - ${item.heatNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/inventory/stock")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{item.productName}</h2>
                <Badge className={inspectionColors[item.inspectionStatus]}>
                  {item.inspectionStatus}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono">Heat: {item.heatNumber}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Total Quantity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl">{item.quantity}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-green-600">{item.availableQuantity}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
                Reserved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-amber-600">{item.reservedQuantity}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{item.location}</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traceability Information</CardTitle>
            <CardDescription>Full material traceability chain (ISO 8.5.2)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Heat Number</p>
                <p className="font-mono font-medium">{item.heatNumber}</p>
              </div>
              {item.batchNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="font-mono font-medium">{item.batchNumber}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">GRN Reference</p>
                <p className="font-mono font-medium">{item.grnNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PO Reference</p>
                <p className="font-mono font-medium">{item.poNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MTC Number</p>
                <p className="font-mono font-medium">{item.mtcNumber || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {linkedGRN && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Source GRN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{linkedGRN.grnNumber}</p>
                  <p className="text-sm text-muted-foreground">{linkedGRN.vendorName} | {linkedGRN.receivedDate}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/inventory/grn/${linkedGRN.id}`}>View GRN</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {linkedInspection && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Beaker className="h-4 w-4" /> Inspection Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Specification</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedInspection.checklistItems.map((check, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{check.parameter}</TableCell>
                      <TableCell>{check.specification}</TableCell>
                      <TableCell>{check.actualValue}</TableCell>
                      <TableCell>
                        <Badge className={check.result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {check.result}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Result</p>
                    <Badge className={inspectionColors[linkedInspection.overallResult]}>
                      {linkedInspection.overallResult}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inspected by</p>
                    <p className="font-medium">{linkedInspection.inspectedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inspected on</p>
                    <p className="font-medium">{linkedInspection.inspectedAt}</p>
                  </div>
                </div>
                {linkedInspection.remarks && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">Remarks</p>
                    <p>{linkedInspection.remarks}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {linkedDispatches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" /> Dispatch History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispatch No.</TableHead>
                    <TableHead>Sales Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedDispatches.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono">{d.dispatchNumber}</TableCell>
                      <TableCell className="font-mono">{d.soNumber}</TableCell>
                      <TableCell>{d.customerName}</TableCell>
                      <TableCell>{d.dispatchDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{d.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/inventory/dispatch/${d.id}`}>View</Link>
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
            <p>Created: {item.createdAt}</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
