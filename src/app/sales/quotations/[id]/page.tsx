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
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft, ArrowRight, FileText, User, Calendar, DollarSign,
  CheckCircle, X, Clock, Loader2, Send, AlertTriangle, AlertCircle,
  Printer, History, Building2, Anchor, Ship, Globe2
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DiffDisplay } from "@/components/quotations/DiffDisplay"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [hidePrices, setHidePrices] = useState(false)

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
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (quotation && selectedVersion === undefined) {
      setSelectedVersion(quotation.version_number)
    }
  }, [quotation])

  const handleVersionChange = (value: string) => {
    const v = parseInt(value)
    setSelectedVersion(v)
  }

  useEffect(() => {
    if (id) fetchQuotation()
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
        handleAction("send")
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to send email')
      }
    } catch (err) { setError('An error occurred while sending email') } finally { setEmailLoading(false) }
  }

  const fetchQuotation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quotations/${id}`)
      const result = await response.json()
      if (response.ok) setQuotation(result.data)
      else setError(result.error || 'Failed to fetch quotation')
    } catch (err) { setError('An error occurred while fetching quotation details') } finally { setLoading(false) }
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
        setQuotation(result.data); setShowSubmitDialog(false); setShowApproveDialog(false); setShowRejectDialog(false); setShowSendDialog(false); fetchQuotation();
      } else setError(result.error)
    } catch (err) { setError('Failed to perform action') } finally { setActionLoading(false) }
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
      if (response.ok) { setShowCreateRevisionDialog(false); setRevisionReason(""); fetchQuotation(); }
      else setError(result.error || 'Failed to create revision');
    } catch (err) { setError('An error occurred while creating revision'); } finally { setActionLoading(false); }
  };

  const handleCompareVersions = async () => {
    if (selectedVersion1 === undefined || selectedVersion2 === undefined) { setComparisonError('Please select two versions.'); return; }
    setComparisonLoading(true); setComparisonError(null); setComparisonResult(null);
    try {
      const response = await fetch(`/api/quotations/${quotation.id}/versions/compare?v1=${selectedVersion1}&v2=${selectedVersion2}`);
      const result = await response.json();
      if (response.ok) setComparisonResult(result.data);
      else setComparisonError(result.error || 'Failed to fetch comparison');
    } catch (err: any) { setComparisonError('Comparison error: ' + err.message); } finally { setComparisonLoading(false); }
  };

  if (loading) return <PageLayout title="Loading..."><div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></PageLayout>
  if (error || !quotation) return <PageLayout title="Error"><div className="flex flex-col items-center py-20 text-destructive"><AlertCircle className="h-12 w-12 mb-4" /><p>{error || "Quotation not found"}</p></div></PageLayout>

  return (
    <PageLayout title={`Quotation ${quotation.quotation_number}`}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/sales/quotations")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{quotation.quotation_number}</h2>
                <Badge className={statusColors[quotation.status] || "bg-gray-100"}>{quotation.status?.replace(/_/g, " ")}</Badge>
                <Badge variant="outline">Rev {quotation.version_number}</Badge>
                <Badge variant="secondary">{quotation.market_type}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">Created on {new Date(quotation.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" asChild><Link href={`/sales/quotations/${quotation.id}/edit`}>Edit</Link></Button>
            {quotation.status === "draft" && <Button onClick={() => setShowSubmitDialog(true)}>Submit for Approval</Button>}
            {quotation.status === "pending_approval" && (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>Reject</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowApproveDialog(true)}>Approve</Button>
              </div>
            )}
            {quotation.status === "approved" && <Button onClick={() => setShowSendDialog(true)}>Send to Customer</Button>}
            <Button variant="ghost" size="icon" onClick={() => setShowPrintDialog(true)}><Printer className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card><CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Customer</CardHeader><CardContent><p className="font-semibold">{quotation.customer?.name}</p><p className="text-xs text-muted-foreground">Attention: {quotation.attention || 'N/A'}</p></CardContent></Card>
          <Card><CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Project</CardHeader><CardContent><p className="font-semibold">{quotation.project_name || 'N/A'}</p><p className="text-xs text-muted-foreground">Ref: {quotation.enquiry_reference || 'N/A'}</p></CardContent></Card>
          <Card><CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Commercial</CardHeader><CardContent><p className="font-bold text-lg text-primary">{quotation.currency} {quotation.total_amount?.toLocaleString()}</p><p className="text-xs text-muted-foreground">Rate: {quotation.exchange_rate}</p></CardContent></Card>
          <Card><CardHeader className="pb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Validity</CardHeader><CardContent><p className="font-semibold">{new Date(quotation.valid_until).toLocaleDateString()}</p><p className="text-xs text-muted-foreground">{quotation.validity_days} days</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Building2 className="h-4 w-4" /> Bank & Payment Details</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              {quotation.bank_details ? (
                <>
                  <div className="flex justify-between"><span>Bank:</span><span className="font-medium">{quotation.bank_details.bank_name}</span></div>
                  <div className="flex justify-between"><span>A/C No:</span><span className="font-medium font-mono">{quotation.bank_details.account_no}</span></div>
                  <div className="flex justify-between"><span>IFSC/SWIFT:</span><span className="font-medium font-mono">{quotation.bank_details.ifsc_code || quotation.bank_details.swift_code}</span></div>
                </>
              ) : <p className="text-muted-foreground italic">No bank details selected.</p>}
            </CardContent>
          </Card>

          {quotation.market_type === 'EXPORT' && (
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Globe2 className="h-4 w-4" /> Export Logistics</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span>Incoterms:</span><span className="font-medium">{quotation.incoterms || 'N/A'}</span></div>
                <div className="flex justify-between"><span>Port of Loading:</span><span className="font-medium">{quotation.port_of_loading?.name || 'N/A'}</span></div>
                <div className="flex justify-between"><span>Port of Discharge:</span><span className="font-medium">{quotation.port_of_discharge?.name || 'N/A'}</span></div>
                <div className="flex justify-between"><span>Material Origin:</span><span className="font-medium">{quotation.material_origin || 'N/A'}</span></div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-bold">Line Items</CardTitle><Badge variant="outline">{quotation.quotation_type}</Badge></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description & Technical Details</TableHead>
                    <TableHead>Size/Sch</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-semibold">{item.product_name || item.product?.name}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground uppercase">
                          {item.tag_no && <span>Tag: {item.tag_no}</span>}
                          {item.dwg_no && <span>DWG: {item.dwg_no}</span>}
                          {item.dimension_tolerance && <span>Tol: {item.dimension_tolerance}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{item.size || '-'}</div>
                        <div className="text-[10px] text-muted-foreground">Sch {item.schedule} / {item.wall_thickness}mm</div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity} <span className="text-[10px] text-muted-foreground uppercase">{item.uom?.code || 'NOS'}</span></TableCell>
                      <TableCell className="text-right font-mono">{quotation.currency} {item.unit_price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">{quotation.currency} {item.line_total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-8 mt-8 border-t pt-6">
              <div className="flex-1 space-y-4">
                <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Terms & Conditions</h4>
                {quotation.terms?.length > 0 ? (
                  <div className="space-y-4">
                    {quotation.terms.map((term: any, idx: number) => (
                      <div key={term.id} className="text-sm pl-4 border-l-2 border-muted">
                        <p className="font-bold text-xs text-primary mb-1">{idx + 1}. {term.term_details?.title}</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">{term.custom_text || term.term_details?.default_text}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground italic">Standard terms apply.</p>}
              </div>

              <div className="w-full md:w-72 space-y-2 bg-muted/10 p-4 rounded-lg self-start text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span className="font-medium text-base">{quotation.currency} {quotation.subtotal?.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>GST (18%):</span><span>+{quotation.currency} {quotation.tax_amount?.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold border-t pt-2 text-xl text-primary"><span>Total:</span><span>{quotation.currency} {quotation.total_amount?.toLocaleString()}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {quotation.remarks && <Card><CardHeader className="py-2"><CardTitle className="text-xs uppercase text-muted-foreground">Internal Remarks</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{quotation.remarks}</CardContent></Card>}
      </div>

      {/* Dialogs Placeholder */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}><DialogContent><DialogHeader><DialogTitle>Submit for Approval</DialogTitle></DialogHeader><DialogFooter><Button onClick={() => handleAction('submit_for_approval')}>Confirm</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}><DialogContent><DialogHeader><DialogTitle>Approve Quotation</DialogTitle></DialogHeader><DialogFooter><Button onClick={() => handleAction('approve', approvalRemarks)}>Approve</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Options</DialogTitle>
            <DialogDescription>
              Select how you want to print the quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="hide-prices"
              checked={hidePrices}
              onCheckedChange={(checked) => setHidePrices(checked as boolean)}
            />
            <Label htmlFor="hide-prices" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Hide prices and totals (Show "QUOTED" instead)
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              window.open(`/api/documents/quotation/${id}/pdf?price=${!hidePrices}`, '_blank')
              setShowPrintDialog(false)
            }}>
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
