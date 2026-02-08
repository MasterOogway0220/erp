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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Eye, Search, Filter, Loader2, IndianRupee, Download } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCustomer, setFilterCustomer] = useState("all")
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const customerRes = await fetch('/api/customers')
      const customerData = await customerRes.json()
      setCustomers(customerData.data || [])

      const url = filterCustomer !== 'all'
        ? `/api/payments?customer_id=${filterCustomer}`
        : '/api/payments'

      const res = await fetch(url)
      const data = await res.json()
      setPayments(data.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterCustomer])

  const filteredPayments = payments.filter(p =>
    p.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    p.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.reference_number && p.reference_number.toLowerCase().includes(search.toLowerCase()))
  )

  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <PageLayout title="Payment Receipts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payment Receipts</h2>
            <p className="text-muted-foreground">Track customer inflows and allocations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button asChild>
              <Link href="/finance/payments/new">
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Received (Filtered)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{totalReceived.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receipts Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPayments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">Last receipt: {payments[0]?.receipt_number || "None"}</div>
              <div className="text-xs text-muted-foreground">Verified: {payments.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-base">All Receipts</CardTitle>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search receipts..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
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
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground italic">
                        No payment receipts found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((p) => {
                      const allocatedAmount = p.allocations?.reduce((sum: number, a: any) => sum + Number(a.amount), 0) || 0

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono font-medium">{p.receipt_number}</TableCell>
                          <TableCell>{new Date(p.receipt_date).toLocaleDateString()}</TableCell>
                          <TableCell>{p.customer?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{p.payment_mode}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{p.reference_number || "-"}</TableCell>
                          <TableCell className="text-right font-bold">₹{p.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="text-xs text-muted-foreground">
                              ₹{allocatedAmount.toLocaleString()}
                            </div>
                            {allocatedAmount < p.amount && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[10px] mt-1">
                                Unallocated
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/finance/payments/${p.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
