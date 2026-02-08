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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, FileText, User, Calendar, DollarSign, CheckCircle, X, Clock, Loader2, Send, AlertTriangle, AlertCircle, Printer, History } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DiffDisplay } from "@/components/quotations/DiffDisplay"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
  expired: "bg-orange-100 text-orange-800",
}

export default function QuotationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Dialog states
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showCreateRevisionDialog, setShowCreateRevisionDialog] = useState(false)

  const [approvalRemarks, setApprovalRemarks] = useState("")
  const [rejectionRemarks, setRejectionRemarks] = useState("")
  const [revisionReason, setRevisionReason] = useState("")

  // Email states
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [showCompareDialog, setShowCompareDialog] = useState(false)
  const [selectedVersion1, setSelectedVersion1] = useState<number | undefined>(undefined)
  const [selectedVersion2, setSelectedVersion2] = useState<number | undefined>(undefined)
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchQuotation()
    }
  }, [id])

  useEffect(() => {
    if (quotation) {
      setEmailTo(quotation.buyer?.email || quotation.customer?.email || "")
      setEmailSubject(`Quotation ${quotation.quotation_number} - SteelERP`)
      setEmailMessage(`Dear ${quotation.buyer?.name || 'Customer'},\n\nPlease find attached the quotation ${quotation.quotation_number} for your review.`)
    }
  }, [quotation])

  const handleSendEmail = async () => {
    try {
      setEmailLoading(true)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quotation',
          id: quotation.id,
          to: emailTo,
          subject: emailSubject,
          message: emailMessage
        })
      })

      if (response.ok) {
        setShowSendDialog(false)
        // Also mark as sent in DB
        handleAction("send")
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to send email')
      }
    } catch (err) {
      setError('An error occurred while sending email')
    } finally {
      setEmailLoading(false)
    }
  }

  const fetchQuotation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quotations/${id}`)
      const result = await response.json()
      if (response.ok) {
        setQuotation(result.data)
      } else {
        setError(result.error || 'Failed to fetch quotation')
      }
    } catch (err) {
      setError('An error occurred while fetching quotation details')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, remarks?: string) => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks })
      })

      const result = await response.json()
      if (response.ok) {
        setQuotation(result.data)
        setShowSubmitDialog(false)
        setShowApproveDialog(false)
        setShowRejectDialog(false)
        setShowSendDialog(false)
        // Re-fetch to get updated relations if needed
        fetchQuotation()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to perform action')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateRevision = async () => {
    try {
        setActionLoading(true);
        const response = await fetch(`/api/quotations/${quotation.id}/revisions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ change_reason: revisionReason })
        });

        const result = await response.json();
        if (response.ok) {
            setShowCreateRevisionDialog(false);
            setRevisionReason("");
            fetchQuotation(); // Refresh UI to show new revision
        } else {
            setError(result.error || 'Failed to create revision');
        }
    } catch (err) {
        setError('An error occurred while creating revision');
    } finally {
        setActionLoading(false);
    }
  };

const handleCompareVersions = async () => {
    if (selectedVersion1 === undefined || selectedVersion2 === undefined) {
        setComparisonError('Please select two versions to compare.');
        return;
    }
    if (selectedVersion1 === selectedVersion2) {
        setComparisonError('Please select two different versions to compare.');
        return;
    }

    setComparisonLoading(true);
    setComparisonError(null);
    setComparisonResult(null);

    try {
        const response = await fetch(`/api/quotations/${quotation.id}/versions/compare?v1=${selectedVersion1}&v2=${selectedVersion2}`);
        const result = await response.json();
        if (response.ok) {
            setComparisonResult(result.data);
        } else {
            setComparisonError(result.error || 'Failed to fetch comparison');
        }
    } catch (err: any) {
        setComparisonError('An error occurred while fetching comparison: ' + err.message);
    } finally {
        setComparisonLoading(false);
    }
};

  if (loading) {
    return (
      <PageLayout title="Loading Quotation...">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (error || !quotation) {
    return (
      <PageLayout title="Quotation Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-xl font-semibold mb-2">{error || "Quotation not found"}</p>
          <Button onClick={() => router.push("/sales/quotations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotations
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`Quotation ${quotation.quotation_number}`}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/sales/quotations")} className="print:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowPrintDialog(true)} title="Print" className="print:hidden">
              <Printer className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{quotation.quotation_number}</h2>
                <Badge className={statusColors[quotation.status] || "bg-gray-100"}>
                  {quotation.status?.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline">Rev {quotation.version_number}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground text-sm">Quotation Details</p>
                {quotation.revisions && quotation.revisions.length > 0 && (
                  <div className="flex items-center gap-1 ml-4 print:hidden">
                    <History className="h-3 w-3 text-muted-foreground" />
                    <Select value={selectedVersion?.toString()} onValueChange={handleVersionChange}>
                      <SelectTrigger className="w-[120px] h-7 text-xs">
                        <SelectValue placeholder="Select Version" />
                      </SelectTrigger>
                      <SelectContent>
                        {quotation.revisions.map((rev: any) => (
                          <SelectItem key={rev.version_number} value={rev.version_number.toString()}>
                            Rev {rev.version_number} ({new Date(rev.changed_at).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            {quotation.status !== "draft" && (
              <Dialog open={showCreateRevisionDialog} onOpenChange={setShowCreateRevisionDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    Create Revision
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Revision</DialogTitle>
                    <DialogDescription>
                      Create a new version snapshot of this quotation. This will allow you to track changes and revert if needed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="revisionReason">Reason for Revision *</Label>
                      <Textarea
                        id="revisionReason"
                        value={revisionReason}
                        onChange={(e) => setRevisionReason(e.target.value)}
                        placeholder="e.g., Customer requested price change, updated specifications, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateRevisionDialog(false)} disabled={actionLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRevision} disabled={actionLoading || !revisionReason.trim()}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Revision
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="ml-2">
                        <History className="mr-2 h-4 w-4" />
                        Compare Versions
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Compare Quotation Versions</DialogTitle>
                        <DialogDescription>Select two versions to view their differences.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="version1">Version 1</Label>
                            <Select
                                value={selectedVersion1?.toString()}
                                onValueChange={(value) => setSelectedVersion1(parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Version 1" />
                                </SelectTrigger>
                                <SelectContent>
                                    {quotation.revisions.map((rev: any) => (
                                        <SelectItem key={rev.version_number} value={rev.version_number.toString()}>
                                            Rev {rev.version_number} ({new Date(rev.changed_at).toLocaleDateString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="version2">Version 2</Label>
                            <Select
                                value={selectedVersion2?.toString()}
                                onValueChange={(value) => setSelectedVersion2(parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Version 2" />
                                </SelectTrigger>
                                <SelectContent>
                                    {quotation.revisions.map((rev: any) => (
                                        <SelectItem key={rev.version_number} value={rev.version_number.toString()}>
                                            Rev {rev.version_number} ({new Date(rev.changed_at).toLocaleDateString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleCompareVersions} disabled={comparisonLoading || selectedVersion1 === undefined || selectedVersion2 === undefined}>
                        {comparisonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Show Differences
                    </Button>

                    {comparisonError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{comparisonError}</AlertDescription>
                        </Alert>
                    )}

                    {comparisonResult && (
                        <div className="mt-6 space-y-4 max-h-96 overflow-y-auto p-4 border rounded-md bg-gray-50">
                            <h3 className="text-lg font-semibold">Differences:</h3>
                            <DiffDisplay data={comparisonResult.diff} />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCompareDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button variant="outline" asChild>
              <Link href={`/sales/quotations/${quotation.id}/edit`}>
                Edit Quotation
              </Link>
            </Button>
            {quotation.status === "draft" && (
              <Button onClick={() => setShowSubmitDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            )}
            {quotation.status === "pending_approval" && (
              <>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setShowRejectDialog(true)}>
                  <X className="mr-1 h-4 w-4" /> Reject
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowApproveDialog(true)}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </Button>
              </>
            )}
            {quotation.status === "approved" && (
              <Button onClick={() => setShowSendDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send to Customer
              </Button>
            )}
            {(quotation.status === "approved" || quotation.status === "sent") && (
              <Button asChild>
                <Link href={`/sales/orders/new?quotationId=${quotation.id}`}>
                  Create Sales Order <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              Customer
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-base">{quotation.customer?.name || "Unknown"}</p>
              {quotation.customer?.gst_number && <p className="text-xs text-muted-foreground mt-1">GST: {quotation.customer.gst_number}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              Total Amount
            </CardHeader>
            <CardContent>
              <p className="font-bold text-lg text-primary">
                {quotation.currency === "INR" ? "₹" : "$"}{(quotation.total_amount || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              Valid Until
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : "N/A"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              Created
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{new Date(quotation.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>

        {quotation.enquiry && (
          <Card className="print:hidden">
            <CardHeader className="py-3 items-center flex flex-row justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Linked Enquiry: {quotation.enquiry.enquiry_number}</span>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/sales/enquiries/${quotation.enquiry_id}`}>View Enquiry</Link>
              </Button>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Quotation Items</CardTitle>
            <Badge variant="outline">{quotation.quotation_type || 'STANDARD'}</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Item Description</TableHead>
                  {quotation.quotation_type === 'STANDARD' && (
                    <>
                      <TableHead>Size</TableHead>
                      <TableHead>Sch/WT</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold">{item.product_name || item.product?.name || "Product"}</div>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    </TableCell>
                    {quotation.quotation_type === 'STANDARD' && (
                      <>
                        <TableCell>{item.size || '-'}</TableCell>
                        <TableCell>
                          {item.schedule || item.wall_thickness ? (
                            <span className="text-xs">
                              {item.schedule ? `Sch ${item.schedule}` : ''}
                              {item.schedule && item.wall_thickness ? ' / ' : ''}
                              {item.wall_thickness ? `${item.wall_thickness}mm` : ''}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right whitespace-nowrap">
                      {item.quantity} <span className="text-[10px] text-muted-foreground ml-0.5">{item.uom?.code || item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {quotation.currency === "INR" ? "₹" : "$"}{item.unit_price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {quotation.currency === "INR" ? "₹" : "$"}{item.line_total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col md:flex-row justify-between gap-8 mt-8 border-t pt-6">
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Terms & Conditions
                </h4>
                {quotation.terms && quotation.terms.length > 0 ? (
                  <div className="space-y-4">
                    {quotation.terms.map((term: any, idx: number) => (
                      <div key={term.id} className="text-sm">
                        <p className="font-bold text-xs text-primary mb-1">{idx + 1}. {term.term_details?.title || 'Term'}</p>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-muted">
                          {term.custom_text || term.term_details?.default_text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic pl-4 border-l-2 border-muted">
                    Standard company terms and conditions apply.
                  </p>
                )}
              </div>

              <div className="w-full md:w-72 space-y-3 bg-muted/20 p-4 rounded-lg self-start">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{quotation.currency === "INR" ? "₹" : "$"}{(quotation.subtotal || 0).toLocaleString()}</span>
                </div>
                {quotation.packing_charges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Packing Charges:</span>
                    <span className="font-medium text-orange-600">+{quotation.currency === "INR" ? "₹" : "$"}{quotation.packing_charges.toLocaleString()}</span>
                  </div>
                )}
                {quotation.freight_charges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Freight Charges:</span>
                    <span className="font-medium text-orange-600">+{quotation.currency === "INR" ? "₹" : "$"}{quotation.freight_charges.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%):</span>
                  <span className="font-medium">+{quotation.currency === "INR" ? "₹" : "$"}{(quotation.tax_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-muted-foreground/20 pt-3 text-xl text-primary">
                  <span>Grand Total:</span>
                  <span>{quotation.currency === "INR" ? "₹" : "$"}{(quotation.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {quotation.remarks && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">Remarks / Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.remarks}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>
              This quotation will be submitted for management approval. Once approved, you can send it to the customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={() => handleAction("submit_for_approval")} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Quotation</DialogTitle>
            <DialogDescription>
              You are about to approve quotation {quotation.quotation_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Approval Remarks (Optional)</Label>
              <Textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Add any notes for this approval..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve", approvalRemarks)} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Explain why this quotation is being rejected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleAction("reject", rejectionRemarks)} disabled={actionLoading || !rejectionRemarks.trim()}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quotation via Email</DialogTitle>
            <DialogDescription>
              Deliver this quotation directly to the customer's inbox with the professional PDF attached.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                value={emailTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailTo(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={emailMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-xs">
                A professional PDF version will be automatically attached to this email.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={emailLoading}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={emailLoading || !emailTo}>
              {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Quotation</DialogTitle>
            <DialogDescription>
              Select the format you wish to print or export.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              variant="outline"
              className="justify-start h-16"
              onClick={() => window.open(`/api/documents/quotation/${id}/pdf?showPrice=true`, '_blank')}
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Download Professional PDF (With Price)</div>
                  <div className="text-[10px] text-muted-foreground">High-quality PDF with company banner and ISO standards.</div>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-16"
              onClick={() => window.open(`/api/documents/quotation/${id}/pdf?showPrice=false`, '_blank')}
            >
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Download Estimate PDF (Without Price)</div>
                  <div className="text-[10px] text-muted-foreground">PDF for internal use or basic item verification.</div>
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="justify-start h-12 text-muted-foreground"
              onClick={() => window.open(`/sales/quotations/${id}/print?price=true`, '_blank')}
            >
              <Printer className="mr-2 h-4 w-4" />
              Old Browser Print Format
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPrintDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
