"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
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
import { Input } from "@/components/ui/input"
import { FileCheck, Search } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MTCPage() {
  const { inventory, inspections } = useStore()
  const [search, setSearch] = useState("")
  
  const itemsWithMTC = inventory.filter(item => item.mtcNumber)
  
  const filteredItems = itemsWithMTC.filter(item =>
    item.mtcNumber?.toLowerCase().includes(search.toLowerCase()) ||
    item.heatNumber.toLowerCase().includes(search.toLowerCase()) ||
    item.productName.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <PageLayout title="MTC Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">MTC Management</h2>
            <p className="text-muted-foreground">Material Test Certificate tracking (ISO 7.5)</p>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by MTC, Heat Number, Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{itemsWithMTC.length}</p>
                  <p className="text-xs text-muted-foreground">Total MTCs Linked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <FileCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {itemsWithMTC.filter(i => i.inspectionStatus === 'accepted').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Verified & Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-50 p-2">
                  <FileCheck className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {itemsWithMTC.filter(i => i.inspectionStatus === 'pending').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Verification</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MTC Registry</CardTitle>
            <CardDescription>Material test certificates linked to inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MTC Number</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>GRN</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>QC Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {search ? "No MTCs match your search." : "No MTCs linked to inventory yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium text-blue-600">
                        {item.mtcNumber}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.heatNumber}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.grnNumber || "-"}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell>
                        <Badge className={
                          item.inspectionStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                          item.inspectionStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          item.inspectionStatus === 'hold' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {item.inspectionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/inventory/stock/${item.id}`}>View Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">About MTC Management</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Material Test Certificates (MTCs) are linked to inventory items during the GRN inspection process. 
              Each MTC provides traceability for the material's chemical composition, mechanical properties, 
              and compliance with specifications (ISO 7.5 - Documented Information).
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
