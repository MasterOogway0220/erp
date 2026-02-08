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
import { ArrowLeft, ArrowRight, FileText, User, Calendar, Package, Loader2, AlertCircle, CheckCircle, XCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 border-yellow-200",
  quoted: "bg-blue-100 text-blue-800 border-blue-200",
  converted: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function EnquiryDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [enquiry, setEnquiry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchEnquiry()
    }
  }, [id])

  const fetchEnquiry = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/enquiries/${id}`)
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

  const handleUpdateStatus = async (status: string) => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchEnquiry()
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to update status')
      }
    } catch (err) {
      setError('An error occurred while updating status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEnquiry = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/sales/enquiries')
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to delete enquiry')
      }
    } catch (err) {
      setError('An error occurred while deleting enquiry')
    } finally {
      setActionLoading(false)
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
                <Badge className={statusColors[enquiry.status] || "bg-gray-100"}>
                  {enquiry.status?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Received on {new Date(enquiry.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enquiry.status === "open" && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10" disabled={actionLoading}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will close the enquiry and mark it as deleted. This action cannot be easily undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteEnquiry} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" onClick={() => handleUpdateStatus('closed')} disabled={actionLoading}>
                  <XCircle className="mr-2 h-4 w-4" /> Close Enquiry
                </Button>
                <Button asChild>
                  <Link href={`/sales/quotations/new?enquiryId=${enquiry.id}`}>
                    Create Quotation <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
            {enquiry.status === "closed" && (
              <Button variant="outline" onClick={() => handleUpdateStatus('open')} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" /> Re-open Enquiry
              </Button>
            )}
            {enquiry.status === "quoted" && (
              <Button variant="outline" asChild>
                <Link href={`/sales/quotations?enquiryId=${enquiry.id}`}>
                  View Quotations <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
              Customer Details
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-primary" />
                <p className="font-bold">{enquiry.customer?.name || "Unknown"}</p>
              </div>
              {enquiry.customer?.email && <p className="text-sm text-muted-foreground pl-6">{enquiry.customer.email}</p>}
              {enquiry.customer?.address && <p className="text-sm text-muted-foreground pl-6 mt-1">{enquiry.customer.address}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
              Buyer / Contact
            </CardHeader>
            <CardContent>
              {enquiry.buyer ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <p className="font-bold">{enquiry.buyer.buyer_name}</p>
                  </div>
                  {enquiry.buyer.email && <p className="text-sm text-muted-foreground pl-6">{enquiry.buyer.email}</p>}
                  {enquiry.buyer.mobile && <p className="text-sm text-muted-foreground pl-6 mt-1">{enquiry.buyer.mobile}</p>}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific buyer identified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
              Project / Reference
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <p className="font-bold">{enquiry.project_name || "Direct Enquiry"}</p>
              </div>
              <p className="text-sm text-muted-foreground pl-6 mt-1">Source: Enquiry Form</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20">
            <CardTitle className="text-base font-bold">Enquiry Items & Requirements</CardTitle>
            <Badge variant="outline" className="font-mono">{enquiry.items?.length || 0} Items</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="pl-6">Product Requirement</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="pl-6">Specifications / Grades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enquiry.items?.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-muted/5">
                    <TableCell className="pl-6">
                      <div className="font-bold">{item.product?.name || "Requirement"}</div>
                      {item.product?.code && <div className="text-[10px] font-mono text-muted-foreground">{item.product.code}</div>}
                    </TableCell>
                    <TableCell className="text-center font-bold">{item.quantity} {item.uom?.code || 'Units'}</TableCell>
                    <TableCell className="pl-6">
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.specifications || "No special regular standards requested"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!enquiry.items || enquiry.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                      No line items found for this enquiry.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {enquiry.remarks && (
          <Card className="bg-blue-50/30 border-blue-100">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-blue-700">Client Remarks & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{enquiry.remarks}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
