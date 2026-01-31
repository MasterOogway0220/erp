"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
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
import { Input } from "@/components/ui/input"
import { Package, AlertTriangle, CheckCircle, Clock, Search, Loader2, FileDown, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const statusColors: Record<string, { bg: string, text: string, border: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  under_inspection: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  accepted: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  hold: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
}

export default function StockPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      if (res.ok) setInventory(data.data || [])
    } catch (err) {
      console.error("Failed to fetch inventory", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const filteredInventory = inventory.filter(item =>
    item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.product?.code?.toLowerCase().includes(search.toLowerCase()) ||
    item.heat_number?.toLowerCase().includes(search.toLowerCase()) ||
    item.location?.toLowerCase().includes(search.toLowerCase()) ||
    item.warehouse?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    window.location.href = '/api/export?type=inventory'
  }

  const totalStock = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const totalAvailable = inventory.reduce((sum, i) => sum + (i.available_quantity || 0), 0)
  const totalReserved = inventory.reduce((sum, i) => sum + (i.reserved_quantity || 0), 0)
  const pendingInspection = inventory.filter(i => i.inspection_status === 'under_inspection' || i.inspection_status === 'pending').length

  const getAging = (date: string) => {
    const created = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading && inventory.length === 0) {
    return (
      <PageLayout title="Inventory">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Inventory">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Stock Overview</h2>
            <p className="text-muted-foreground">Real-time heat-wise inventory dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product, heat, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Stock</p>
                  <p className="text-3xl font-bold text-blue-900">{totalStock.toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Available</p>
                  <p className="text-3xl font-bold text-green-900">{totalAvailable.toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Reserved</p>
                  <p className="text-3xl font-bold text-orange-900">{totalReserved.toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-orange-100 p-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">QC Pending</p>
                  <p className="text-3xl font-bold text-purple-900">{pendingInspection}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base uppercase tracking-wider text-muted-foreground font-bold">Stock Ledger</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[250px]">Product</TableHead>
                    <TableHead>Heat / MTC</TableHead>
                    <TableHead>MT Type / TPI</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Rack/Bin</TableHead>
                    <TableHead className="text-right">Pcs</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>QC Status</TableHead>
                    <TableHead className="text-right">Aging</TableHead>
                    <TableHead>Refs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        No inventory data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => {
                      const aging = getAging(item.created_at)
                      const status = statusColors[item.inspection_status] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" }

                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{item.product?.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{item.product?.code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs">{item.heat_number}</span>
                              {item.mtc_number && <span className="text-[10px] text-muted-foreground">MTC: {item.mtc_number}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs">{item.mtc_type || '-'}</span>
                              <span className="text-[10px] text-muted-foreground">{item.tpi || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold">{item.warehouse?.name || 'Main Warehouse'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px] bg-blue-50/50 border-blue-200 text-blue-700">
                              {item.location || 'NONE'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.pieces || 0}</TableCell>
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          <TableCell className="text-right text-green-700 font-bold">{item.available_quantity || 0}</TableCell>
                          <TableCell>
                            <Badge className={`${status.bg} ${status.text} border ${status.border} shadow-sm`}>
                              {item.inspection_status?.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-xs font-bold ${aging > 30 ? 'text-red-500' : aging > 15 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                              {aging} Days
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-[9px] font-mono leading-tight">
                              <span className="text-primary hover:underline cursor-pointer">{item.grn?.grn_number}</span>
                              <span className="text-muted-foreground">{item.purchase_order?.po_number}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
