"use client"

import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Loader2, Save, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermsConditionsEditor } from "@/components/quotations/TermsConditionsEditor"

function EditQuotationForm() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  // Masters
  const [customers, setCustomers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [bankDetails, setBankDetails] = useState<any[]>([])
  const [uoms, setUoms] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  // Form State
  const [quotation, setQuotation] = useState<any>(null)
  const [marketType, setMarketType] = useState<"DOMESTIC" | "EXPORT">("DOMESTIC")
  const [customerId, setCustomerId] = useState("")
  const [buyerId, setBuyerId] = useState("")
  const [bankDetailId, setBankDetailId] = useState("")
  const [attention, setAttention] = useState("")
  const [enquiryReference, setEnquiryReference] = useState("")
  const [projectName, setProjectName] = useState("")
  const [date, setDate] = useState("")
  const [validityDays, setValidityDays] = useState(15)
  const [currency, setCurrency] = useState("INR")
  const [exchangeRate, setExchangeRate] = useState(1)
  const [items, setItems] = useState<any[]>([])
  const [selectedTerms, setSelectedTerms] = useState<any[]>([])
  const [changeReason, setChangeReason] = useState("Updated specifications/pricing")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, uomRes, currRes, bankRes, qRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/uom'),
          fetch('/api/currencies'),
          fetch('/api/bank-details'),
          fetch(`/api/quotations/${params.id}`)
        ])
        const [custData, uomData, currData, bankData, qData] = await Promise.all([
          custRes.json(), uomRes.json(), currRes.json(), bankRes.json(), qRes.json()
        ])

        setCustomers(custData.data || [])
        setUoms(uomData.data || [])
        setCurrencies(currData.data || [])
        setBankDetails(bankData.data || [])

        if (qRes.ok && qData.data) {
          const q = qData.data
          setQuotation(q)
          setMarketType(q.market_type)
          setCustomerId(q.customer_id)
          setBuyerId(q.buyer_id || "")
          setBankDetailId(q.bank_detail_id || "")
          setAttention(q.attention || "")
          setEnquiryReference(q.enquiry_reference || "")
          setProjectName(q.project_name || "")
          setDate(q.quotation_date?.split('T')[0] || new Date().toISOString().split('T')[0])
          setValidityDays(q.validity_days)
          setCurrency(q.currency)
          setExchangeRate(q.exchange_rate)
          setItems(q.items?.map((i: any) => ({
            id: i.id,
            productId: i.product_id,
            productName: i.product_name || i.product?.name,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            unit: i.uom?.code || i.unit,
            amount: i.line_total,
            tag_no: i.tag_no,
            dwg_no: i.dwg_no,
            dimension_tolerance: i.dimension_tolerance,
            dm_type: i.dm_type,
            wt_type: i.wt_type,
            length_individual: i.length_individual,
            no_of_tubes: i.no_of_tubes
          })) || [])
          setSelectedTerms(q.terms?.map((t: any) => ({
            term_id: t.terms_id,
            custom_text: t.custom_text,
            display_order: t.display_order
          })) || [])
        }
      } catch (err) { setError("Failed to load data") } finally { setLoading(false) }
    }
    fetchData()
  }, [params.id])

  useEffect(() => {
    if (customerId) {
      fetch(`/api/buyers?customer_id=${customerId}`).then(r => r.json()).then(d => setBuyers(d.data || []))
    }
  }, [customerId])

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === "quantity" || field === "unitPrice") updated.amount = (updated.quantity || 0) * (updated.unitPrice || 0)
      return updated
    }))
  }

  const handleSave = async () => {
    if (!changeReason) { setError("Please provide a reason for the change"); return; }
    setActionLoading(true); setError("");
    try {
      const payload = {
        change_reason: changeReason,
        customer_id: customerId,
        buyer_id: buyerId || null,
        bank_detail_id: bankDetailId || null,
        attention, enquiry_reference: enquiryReference,
        project_name: projectName,
        validity_days: validityDays,
        currency, exchange_rate: exchangeRate,
        items: items.map(i => ({
          product_id: i.productId, product_name: i.productName,
          description: i.description, quantity: i.quantity, unit_price: i.unit_price,
          uom_id: uoms.find(u => u.code === i.unit)?.id,
          tag_no: i.tag_no, dwg_no: i.dwg_no,
          dimension_tolerance: i.dimension_tolerance, dm_type: i.dm_type,
          wt_type: i.wt_type, length_individual: i.length_individual,
          no_of_tubes: i.no_of_tubes
        })),
        terms: selectedTerms
      }
      const res = await fetch(`/api/quotations/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push(`/sales/quotations/${params.id}`)
    } catch (err: any) { setError(err.message) } finally { setActionLoading(false) }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        <h2 className="text-2xl font-bold">Edit Quotation: {quotation?.quotation_number}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Header Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Customer</Label><Select value={customerId} onValueChange={setCustomerId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Buyer</Label><Select value={buyerId} onValueChange={setBuyerId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{buyers.map(b => <SelectItem key={b.id} value={b.id}>{b.buyer_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Enquiry Ref</Label><Input value={enquiryReference} onChange={e => setEnquiryReference(e.target.value)} /></div>
            <div className="space-y-1"><Label>Attention</Label><Input value={attention} onChange={e => setAttention(e.target.value)} /></div>
            <div className="space-y-1"><Label>Bank Details</Label><Select value={bankDetailId} onValueChange={setBankDetailId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{bankDetails.map(b => <SelectItem key={b.id} value={b.id}>{b.bank_name} ({b.account_no})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Validity (Days)</Label><Input type="number" value={validityDays} onChange={e => setValidityDays(parseInt(e.target.value))} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revision Control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Reason for Change *</Label><Textarea value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="Why are you updating this?" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Ex Rate</Label><Input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} /></div>
            </div>
            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
            <Button className="w-full" onClick={handleSave} disabled={actionLoading}>{actionLoading ? "Saving..." : "Update Quotation"}</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Details</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}<div className="text-[10px] text-muted-foreground uppercase flex gap-2"><span>Tag: {item.tag_no}</span><span>DWG: {item.dwg_no}</span></div></TableCell>
                  <TableCell><Input className="h-7 text-xs" value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} /></TableCell>
                  <TableCell className="text-right w-24"><Input type="number" className="text-right" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value))} /></TableCell>
                  <TableCell className="text-right w-32"><Input type="number" className="text-right" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value))} /></TableCell>
                  <TableCell className="text-right font-bold">{currency} {item.amount?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
        <CardContent><TermsConditionsEditor initialSelectedTerms={selectedTerms} onTermsChange={setSelectedTerms} /></CardContent>
      </Card>
    </div>
  )
}

export default function EditQuotationPage() {
  return (
    <PageLayout title="Edit Quotation">
      <Suspense fallback={<Loader2 className="animate-spin" />}><EditQuotationForm /></Suspense>
    </PageLayout>
  )
}
