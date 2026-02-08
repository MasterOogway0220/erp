"use client"

import { useEffect, useState } from 'react'
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  AlertCircle,
  History
} from "lucide-react"
import { useSearchParams } from 'next/navigation'

interface InventoryItem {
  id: string
  heat_number: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  inspection_status: 'under_inspection' | 'accepted' | 'rejected'
  location: string
  created_at: string
  product: {
    name: string
    code: string
    material_grade: string
    standard: string
  }
  warehouse: {
    name: string
    code: string
  }
}

export default function InventoryStockPage() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    slow_moving: searchParams.get('slow_moving') === 'true',
    min_stock: searchParams.get('min_stock') === 'true'
  })

  useEffect(() => {
    async function fetchStock() {
      setLoading(true)
      try {
        let url = '/api/inventory'
        if (filters.slow_moving) url = '/api/inventory/aging'
        else if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`

        const response = await fetch(url)
        const data = await response.json()
        if (data.success) {
          setItems(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch stock:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStock()
  }, [searchTerm, filters])

  const statusColors = {
    under_inspection: "bg-orange-500/10 text-orange-600 border-orange-200",
    accepted: "bg-green-500/10 text-green-600 border-green-200",
    rejected: "bg-red-500/10 text-red-600 border-red-200"
  }

  return (
    <PageLayout
      title="Inventory Stock"
    >
      <div className="flex flex-col gap-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Heat Number, Product, Code..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilters({ ...filters, slow_moving: !filters.slow_moving })}>
              <Filter className={`mr-2 h-4 w-4 ${filters.slow_moving ? 'text-primary' : ''}`} />
              {filters.slow_moving ? 'Showing Slow Moving' : 'Filter Slow Moving'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stock Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Current Stock Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product / Description</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Quality Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading inventory data...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No stock items found matching your criteria.</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.product.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.product.code}</div>
                        <div className="text-[10px] text-muted-foreground">{item.product.material_grade} | {item.product.standard}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.heat_number}</TableCell>
                      <TableCell className="text-right font-medium">{Number(item.quantity).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">-{Number(item.reserved_quantity).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600 font-bold">{Number(item.available_quantity).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[item.inspection_status]}>
                          {item.inspection_status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold">{item.location}</div>
                        <div className="text-[10px] text-muted-foreground">{item.warehouse?.name}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </Button>
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
