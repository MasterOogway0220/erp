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
import { Plus, Check, X, Send, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTablePagination } from "@/components/DataTablePagination"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800",
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showHistory, setShowHistory] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchQuotations()
  }, [currentPage, pageSize])

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quotations?page=${currentPage}&pageSize=${pageSize}`)
      const result = await response.json()

      if (response.ok) {
        setQuotations(result.data?.map((q: any) => ({
          id: q.id,
          quotationNumber: q.quotation_number,
          customerId: q.customer_id,
          customerName: q.customer?.name || 'Unknown',
          items: q.items?.map((i: any) => ({
            id: i.id,
            productId: i.product_id,
            productName: i.product?.name || 'Unknown',
            quantity: i.quantity,
            unitPrice: i.unit_price,
            discount: i.discount_percent,
            total: i.line_total
          })) || [],
          subtotal: q.subtotal,
          tax: q.tax_amount,
          total: q.total_amount,
          currency: q.currency,
          exchangeRate: q.exchange_rate,
          validUntil: q.valid_until,
          revision: q.version_number || q.revision || 1, // Use version_number
          isLatest: q.is_latest_version,
          status: q.status,
          createdAt: q.created_at?.split('T')[0]
        })) || [])

        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalCount(result.pagination.totalCount)
        }
      } else {
        setError(result.error || 'Failed to fetch quotations')
      }
    } catch (err) {
      setError('An error occurred while fetching data')
    } finally {
      setLoading(false)
    }
  }

  const [selectedQuotation, setSelectedQuotation] = useState<{ id: string, action: string } | null>(null)
  const [remarks, setRemarks] = useState("")
  const [processing, setProcessing] = useState(false)

  const openActionDialog = (id: string, action: string) => {
    // specific actions needing remarks
    if (action === 'approve' || action === 'reject') {
      setSelectedQuotation({ id, action })
      setRemarks("")
    } else {
      handleUpdateStatus(id, action)
    }
  }

  const handleUpdateStatus = async (id: string, action: string, actionRemarks?: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks: actionRemarks })
      })
      if (response.ok) {
        fetchQuotations()
        setSelectedQuotation(null)
      } else {
        const result = await response.json()
        alert(result.error || `Failed to ${action} quotation`)
      }
    } catch (err) {
      alert(`Error updating quotation status`)
    } finally {
      setProcessing(false)
    }
  }

  const filteredQuotations = showHistory
    ? quotations
    : quotations.filter(q => q.isLatest !== false)

  if (loading) {
    return (
      <PageLayout title="Quotations">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Quotations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quotations</h2>
            <p className="text-muted-foreground">Create and manage customer quotations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "Hide History" : "Show History"}
            </Button>
            <Button asChild>
              <Link href="/sales/quotations/new">
                <Plus className="mr-2 h-4 w-4" />
                New Quotation
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              {showHistory ? "All Quotations (History)" : "Active Quotations"} ({totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              {/* ... table headers ... */}
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No quotations found. Create your first quotation.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id} className={!quotation.isLatest ? "opacity-60 bg-muted/50" : ""}>
                      <TableCell className="font-mono font-medium">
                        {quotation.quotationNumber}
                        <Badge variant="outline" className="ml-2 text-xs">
                          Rev {quotation.revision}
                        </Badge>
                        {!quotation.isLatest && <span className="ml-2 text-xs text-muted-foreground">(Old)</span>}
                      </TableCell>
                      <TableCell>{quotation.customerName}</TableCell>
                      <TableCell>
                        {quotation.currency === "INR" ? "₹" : "$"}
                        {quotation.total?.toLocaleString()}
                      </TableCell>
                      <TableCell>{quotation.createdAt}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[quotation.status] || "bg-gray-100"}>
                          {quotation.status?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Revise Button */}
                          {quotation.isLatest && (
                            <Button variant="ghost" size="sm" asChild title="Create Revision">
                              <Link href={`/sales/quotations/new?parent_quotation_id=${quotation.id}`}>
                                Revise
                              </Link>
                            </Button>
                          )}

                          {quotation.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(quotation.id, 'submit_for_approval')}
                            >
                              Submit
                            </Button>
                          )}
                          {quotation.status === "pending_approval" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                onClick={() => openActionDialog(quotation.id, 'approve')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                                onClick={() => openActionDialog(quotation.id, 'reject')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {quotation.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(quotation.id, 'send')}
                            >
                              <Send className="h-3 w-3 mr-1" /> Send
                            </Button>
                          )}
                          {(quotation.status === "sent" || quotation.status === "approved") && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/sales/orders/new?quotationId=${quotation.id}`}>
                                Convert <ArrowRight className="ml-1 h-3 w-3" />
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

            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedQuotation} onOpenChange={(open) => !open && setSelectedQuotation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedQuotation?.action === 'approve' ? 'Approve Quotation' : 'Reject Quotation'}
            </DialogTitle>
            <DialogDescription>
              Please provide remarks for this action (Mandatory for ISO 8.2.3).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Enter remarks..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQuotation(null)}>Cancel</Button>
            <Button
              onClick={() => selectedQuotation && handleUpdateStatus(selectedQuotation.id, selectedQuotation.action, remarks)}
              disabled={processing || !remarks.trim()}
              variant={selectedQuotation?.action === 'reject' ? "destructive" : "default"}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedQuotation?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
} // End Component
