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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Users, Mail, Phone, MapPin, Loader2, AlertCircle, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  gst_number: string | null
  currency: string
  credit_limit: number
  current_outstanding: number
  is_active: boolean
  material_code_prefix: string | null
  created_at: string
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchCustomers = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch('/api/customers')
      const result = await response.json()
      if (response.ok) {
        setCustomers(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch customers')
      }
    } catch {
      setError('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return (
    <PageLayout title="Customers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
            <p className="text-muted-foreground">Manage customer master data</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => window.location.href = '/api/export?type=customers'} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/masters/customers/new" className="w-full sm:w-auto">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </Link>
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
            <CardTitle className="text-base">All Customers ({customers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">GST Number</TableHead>
                    <TableHead className="hidden xl:table-cell">Material Prefix</TableHead>
                    <TableHead className="hidden xl:table-cell">Credit Limit</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No customers found. Add your first customer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/masters/customers/${customer.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <Users className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(customer.city || customer.state) && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {[customer.city, customer.state].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {customer.gst_number || "-"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell font-bold text-blue-600">
                          {customer.material_code_prefix || "-"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="text-sm">
                            <div>₹{(customer.credit_limit || 0).toLocaleString()}</div>
                            {customer.current_outstanding > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Outstanding: ₹{customer.current_outstanding.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={customer.is_active ? "default" : "secondary"}>
                            {customer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
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
