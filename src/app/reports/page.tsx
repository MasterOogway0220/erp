"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarChart3, TrendingUp, Package, Truck, Download, Filter, RefreshCw } from "lucide-react"
import { useState, useMemo } from "react"

export default function ReportsPage() {
  const { salesOrders, quotations, purchaseOrders, inventory, invoices, ncrs, dispatches, customers, vendors } = useStore()
  
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("summary")
  
  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter(so => {
      const dateMatch = (!dateFrom || so.createdAt >= dateFrom) && (!dateTo || so.createdAt <= dateTo)
      const customerMatch = selectedCustomer === "all" || so.customerId === selectedCustomer
      return dateMatch && customerMatch
    })
  }, [salesOrders, dateFrom, dateTo, selectedCustomer])
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const dateMatch = (!dateFrom || inv.createdAt >= dateFrom) && (!dateTo || inv.createdAt <= dateTo)
      const customerMatch = selectedCustomer === "all" || inv.customerId === selectedCustomer
      return dateMatch && customerMatch
    })
  }, [invoices, dateFrom, dateTo, selectedCustomer])
  
  const totalSalesValue = filteredSalesOrders.reduce((sum, so) => sum + so.total, 0)
  const totalPurchaseValue = purchaseOrders.reduce((sum, po) => sum + po.total, 0)
  const quotationConversionRate = quotations.length > 0 
    ? (quotations.filter(q => q.status === 'accepted' || salesOrders.some(so => so.quotationId === q.id)).length / quotations.length) * 100
    : 0
  const onTimeDelivery = dispatches.filter(d => d.status === 'delivered').length
  const openNCRCount = ncrs.filter(n => n.status !== 'closed').length
  
  const topProducts = inventory
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
  
  const topCustomers = [...new Set(filteredSalesOrders.map(so => so.customerName))]
    .map(name => ({
      name,
      orders: filteredSalesOrders.filter(so => so.customerName === name).length,
      value: filteredSalesOrders.filter(so => so.customerName === name).reduce((sum, so) => sum + so.total, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  
  const ageingBuckets = useMemo(() => {
    const now = new Date()
    const buckets = { current: 0, days30: 0, days60: 0, days90: 0, above90: 0 }
    
    filteredInvoices.filter(inv => inv.status !== 'paid').forEach(inv => {
      const dueDate = new Date(inv.dueDate)
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const outstanding = inv.total - inv.paidAmount
      
      if (daysOverdue <= 0) buckets.current += outstanding
      else if (daysOverdue <= 30) buckets.days30 += outstanding
      else if (daysOverdue <= 60) buckets.days60 += outstanding
      else if (daysOverdue <= 90) buckets.days90 += outstanding
      else buckets.above90 += outstanding
    })
    
    return buckets
  }, [filteredInvoices])
  
  const vendorScorecard = vendors.map(vendor => {
    const vendorPOs = purchaseOrders.filter(po => po.vendorId === vendor.id)
    const completedPOs = vendorPOs.filter(po => po.status === 'received' || po.status === 'closed')
    return {
      name: vendor.name,
      totalPOs: vendorPOs.length,
      completedPOs: completedPOs.length,
      rating: vendor.rating,
      isApproved: vendor.isApproved,
    }
  }).filter(v => v.totalPOs > 0).sort((a, b) => b.totalPOs - a.totalPOs)
  
  const resetFilters = () => {
    setDateFrom("")
    setDateTo("")
    setSelectedCustomer("all")
  }
  
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }
  
  const exportSalesReport = () => {
    const data = filteredSalesOrders.map(so => ({
      'SO Number': so.soNumber,
      'Customer': so.customerName,
      'Customer PO': so.customerPONumber,
      'Date': so.createdAt,
      'Delivery Date': so.deliveryDate,
      'Status': so.status,
      'Total': so.total,
    }))
    exportToCSV(data, 'sales_orders_report')
  }
  
  const exportInvoiceReport = () => {
    const data = filteredInvoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Customer': inv.customerName,
      'Date': inv.createdAt,
      'Due Date': inv.dueDate,
      'Total': inv.total,
      'Paid': inv.paidAmount,
      'Outstanding': inv.total - inv.paidAmount,
      'Status': inv.status,
    }))
    exportToCSV(data, 'invoices_report')
  }
  
  const exportAgeingReport = () => {
    const data = filteredInvoices.filter(inv => inv.status !== 'paid').map(inv => {
      const now = new Date()
      const dueDate = new Date(inv.dueDate)
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        'Invoice Number': inv.invoiceNumber,
        'Customer': inv.customerName,
        'Due Date': inv.dueDate,
        'Days Overdue': Math.max(0, daysOverdue),
        'Outstanding': inv.total - inv.paidAmount,
        'Bucket': daysOverdue <= 0 ? 'Current' : daysOverdue <= 30 ? '1-30 Days' : daysOverdue <= 60 ? '31-60 Days' : daysOverdue <= 90 ? '61-90 Days' : '90+ Days',
      }
    })
    exportToCSV(data, 'payment_ageing_report')
  }
  
  return (
    <PageLayout title="Reports & MIS">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reports & MIS Dashboard</h2>
            <p className="text-muted-foreground">Management Information System for decision making</p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{(totalSalesValue / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">Total Sales Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{(totalPurchaseValue / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">Total Purchase Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{quotationConversionRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Quotation Conversion</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2">
                  <Truck className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{onTimeDelivery}</p>
                  <p className="text-xs text-muted-foreground">Completed Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Top Customers by Value</CardTitle>
                <CardDescription>Based on filtered date range</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportSalesReport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topCustomers.map((customer, i) => (
                      <TableRow key={customer.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                              {i + 1}
                            </span>
                            {customer.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{customer.orders}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(customer.value / 100000).toFixed(1)}L
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Payment Ageing Analysis</CardTitle>
                <CardDescription>Outstanding receivables by bucket</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportAgeingReport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Current</span>
                  <span className="font-bold text-green-700">₹{(ageingBuckets.current / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium">1-30 Days</span>
                  <span className="font-bold text-yellow-700">₹{(ageingBuckets.days30 / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium">31-60 Days</span>
                  <span className="font-bold text-orange-700">₹{(ageingBuckets.days60 / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium">61-90 Days</span>
                  <span className="font-bold text-red-600">₹{(ageingBuckets.days90 / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                  <span className="text-sm font-medium">90+ Days</span>
                  <span className="font-bold text-red-800">₹{(ageingBuckets.above90 / 100000).toFixed(2)}L</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Products by Stock</CardTitle>
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
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="font-mono text-xs">{item.heatNumber}</TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor Scorecard</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-right">Total POs</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorScorecard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendorScorecard.map((vendor) => (
                      <TableRow key={vendor.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {vendor.name}
                            {vendor.isApproved && (
                              <Badge variant="outline" className="text-green-600">Approved</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-yellow-500">{'★'.repeat(vendor.rating)}{'☆'.repeat(5 - vendor.rating)}</span>
                        </TableCell>
                        <TableCell className="text-right">{vendor.totalPOs}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{vendor.completedPOs}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {filteredSalesOrders.filter(so => so.status === 'open' || so.status === 'confirmed').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {filteredSalesOrders.filter(so => so.status === 'in_progress').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Partial Dispatch</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {filteredSalesOrders.filter(so => so.status === 'partial_dispatch').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {filteredSalesOrders.filter(so => so.status === 'completed' || so.status === 'dispatched').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Invoice Status Summary</CardTitle>
              <Button variant="ghost" size="sm" onClick={exportInvoiceReport}>
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Draft</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    {filteredInvoices.filter(i => i.status === 'draft').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sent</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {filteredInvoices.filter(i => i.status === 'sent').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Partial Paid</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {filteredInvoices.filter(i => i.status === 'partial_paid').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Paid</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {filteredInvoices.filter(i => i.status === 'paid').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open NCRs</span>
                  <Badge variant="secondary" className={openNCRCount > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {openNCRCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Accepted Stock</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {inventory.filter(i => i.inspectionStatus === 'accepted').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Inspection</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {inventory.filter(i => i.inspectionStatus === 'pending').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">On Hold</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {inventory.filter(i => i.inspectionStatus === 'hold').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
