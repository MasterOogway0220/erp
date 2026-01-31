"use client"

import { PageLayout } from "@/components/page-layout"
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
import { IndianRupee, AlertCircle, Clock, Building, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function OutstandingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/invoices')
        const result = await response.json()

        // Handle both array and object with data property
        const invoicesData = Array.isArray(result) ? result : (result.data || [])

        // Map to ensure consistent structure
        const mappedInvoices = invoicesData.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number || inv.invoiceNumber || 'N/A',
          customerName: inv.customer?.name || inv.customerName || 'Unknown',
          dueDate: inv.due_date || inv.dueDate || new Date().toISOString().split('T')[0],
          total: inv.total || 0,
          paidAmount: inv.paid_amount || inv.paidAmount || 0,
          status: inv.status || 'unpaid'
        }))

        setInvoices(mappedInvoices)
      } catch (error) {
        console.error('Error fetching invoices:', error)
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])


  const outstandingInvoices = invoices.filter(i => i?.status !== "paid")

  const filteredInvoices = outstandingInvoices.filter(invoice =>
    (invoice?.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (invoice?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + ((i?.total || 0) - (i?.paidAmount || 0)), 0)

  const ageingData = {
    current: outstandingInvoices.filter(i => {
      const due = new Date(i?.dueDate || new Date())
      const today = new Date()
      return due >= today
    }).reduce((sum, i) => sum + ((i?.total || 0) - (i?.paidAmount || 0)), 0),

    overdue30: outstandingInvoices.filter(i => {
      const due = new Date(i?.dueDate || new Date())
      const today = new Date()
      const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 0 && diff <= 30
    }).reduce((sum, i) => sum + ((i?.total || 0) - (i?.paidAmount || 0)), 0),

    overdue60: outstandingInvoices.filter(i => {
      const due = new Date(i?.dueDate || new Date())
      const today = new Date()
      const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 30 && diff <= 60
    }).reduce((sum, i) => sum + ((i?.total || 0) - (i?.paidAmount || 0)), 0),

    overdue90: outstandingInvoices.filter(i => {
      const due = new Date(i?.dueDate || new Date())
      const today = new Date()
      const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 60
    }).reduce((sum, i) => sum + ((i?.total || 0) - (i?.paidAmount || 0)), 0),
  }

  const customerOutstanding = Array.from(new Set(outstandingInvoices.map(i => i?.customerName).filter(Boolean)))
    .map(name => ({
      name,
      invoices: outstandingInvoices.filter(i => i?.customerName === name).length,
      amount: outstandingInvoices.filter(i => i?.customerName === name).reduce((sum, i) => sum + ((i?.total || 0) - (i?.paidAmount || 0)), 0),
    }))
    .sort((a, b) => b.amount - a.amount)


  if (loading) {
    return (
      <PageLayout title="Outstanding">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Outstanding">

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Outstanding & Ageing</h2>
            <p className="text-muted-foreground">Track receivables and ageing analysis</p>
          </div>
          <Input
            placeholder="Search by customer or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">₹{(ageingData.current / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">Current (Not Due)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-50 p-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">₹{(ageingData.overdue30 / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">1-30 Days Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">₹{(ageingData.overdue60 / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">31-60 Days Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">₹{(ageingData.overdue90 / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">60+ Days Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Invoice Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No outstanding invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const balance = invoice.total - invoice.paidAmount
                      const due = new Date(invoice.dueDate)
                      const today = new Date()
                      const isOverdue = due < today

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell className={isOverdue ? "text-red-600" : ""}>
                            {invoice.dueDate}
                            {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{invoice.total.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium text-amber-600">
                            ₹{balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={invoice.paidAmount > 0 ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800"}>
                              {invoice.paidAmount > 0 ? "Partial" : "Unpaid"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerOutstanding.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No outstanding amounts
                  </p>
                ) : (
                  customerOutstanding.map((customer) => (
                    <div key={customer.name} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>

                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.invoices} invoice(s)</p>
                        </div>
                      </div>
                      <p className="font-medium text-amber-600">
                        ₹{(customer.amount / 100000).toFixed(1)}L
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Outstanding</span>
                  <span className="text-lg font-bold">₹{(totalOutstanding / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
