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
import { Plus, ArrowRight, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EnquiryItem {
  id: string
  product_id: string
  product?: { name: string }
  quantity: number
  specifications?: string
}

interface Enquiry {
  id: string
  enquiry_number: string
  customer_id: string
  customer?: { name: string }
  items: EnquiryItem[]
  status: string
  remarks?: string
  created_at: string
}

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  quoted: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch('/api/enquiries')
      const result = await response.json()
      if (response.ok) {
        setEnquiries(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch enquiries')
      }
    } catch (err) {
      setError('An error occurred while fetching enquiries')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title="Enquiries">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Customer Enquiries</h2>
            <p className="text-muted-foreground">Manage and track customer enquiries</p>
          </div>
          <Link href="/sales/enquiries/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Enquiry
            </Button>
          </Link>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchEnquiries}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Enquiries ({enquiries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enquiry No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No enquiries found. Create your first enquiry.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enquiries.map((enquiry) => (
                      <TableRow key={enquiry.id}>
                        <TableCell className="font-mono font-medium">
                          {enquiry.enquiry_number}
                        </TableCell>
                        <TableCell>{enquiry.customer?.name || 'Unknown'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {enquiry.items?.map(item => (
                            <div key={item.id} className="text-sm">
                              {item.product?.name || 'Unknown'} x {item.quantity}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[enquiry.status] || "bg-gray-100"}>
                            {enquiry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(enquiry.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/sales/enquiries/${enquiry.id}`}>View</Link>
                            </Button>
                            {enquiry.status === "open" && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/sales/quotations/new?enquiryId=${enquiry.id}`}>
                                  Quote <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </div>
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
