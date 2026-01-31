"use client"

import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
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
import { ArrowLeft, ArrowRight, FileText, User, Calendar, Package, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, use } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  quoted: "bg-blue-100 text-blue-800",
  converted: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
}

export default function EnquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [enquiry, setEnquiry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchEnquiry()
    }
  }, [params.id])

  const fetchEnquiry = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/enquiries/${params.id}`)
      const result = await response.json()
      if (response.ok) {
        setEnquiry(result.data)
      } else {
        setError(result.error || 'Failed to fetch enquiry')
      }
    } catch (err) {
      setError('An error occurred while fetching enquiry details')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <PageLayout title="Loading Enquiry...">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (error || !enquiry) {
    return (
      <PageLayout title="Enquiry Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-xl font-semibold mb-2">{error || "Enquiry not found"}</p>
          <Button onClick={() => router.push("/sales/enquiries")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Enquiries
          </Button>
        </div>
      </PageLayout>
    )
  }
  
  return (
    <PageLayout title={`Enquiry ${enquiry.enquiry_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/sales/enquiries")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{enquiry.enquiry_number}</h2>
                <Badge className={statusColors[enquiry.status] || "bg-gray-100"}>{enquiry.status}</Badge>
              </div>
              <p className="text-muted-foreground">Customer Enquiry Details</p>
            </div>
          </div>
          {enquiry.status === "open" && (
            <Button asChild>
              <Link href={`/sales/quotations/new?enquiryId=${enquiry.id}`}>
                Create Quotation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{enquiry.customer?.name || "Unknown"}</p>
              {enquiry.customer?.email && <p className="text-sm text-muted-foreground">{enquiry.customer.email}</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{new Date(enquiry.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{enquiry.items?.length || 0} item(s)</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enquiry Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Specifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enquiry.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product?.name || "Unknown Product"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.specifications || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {enquiry.remarks && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{enquiry.remarks}</p>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Audit Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Created at: {new Date(enquiry.created_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
