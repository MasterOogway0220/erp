"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2, Save, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermsConditionsEditor } from "@/components/quotations/TermsConditionsEditor"

interface PipeSize {
  id: string
  material_type: string
  size_inch: string
  schedule: string
  od_mm: number
  wall_thickness_mm: number
  weight_kg_per_m: number
}

interface ProductSpec {
  id: string
  product_name: string
  material: string
  additional_spec: string
  ends: string
  length_range: string
}

interface StandardLineItem {
  id: string
  materialType: string
  productSpecId: string
  productName: string
  specification: string
  additionalSpec: string
  ends: string
  length: string
  pipeSizeId: string
  size: string
  schedule: string
  od: number
  wt: number
  weightPerMtr: number
  quantity: number
  totalWeight: number
  unitPrice: number
  amount: number
  unit: string
  description?: string
  tagNo?: string
  dwgNo?: string
  dimTolerance?: string
  dmType?: string
  wtType?: string
  lenIndividual?: number
  noOfTubes?: number
}

interface SelectedQuotationTerm {
  term_id: string
  custom_text: string
  display_order: number;
}

function StandardQuotationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const marketType = searchParams.get("market") as "DOMESTIC" | "EXPORT" || "DOMESTIC"
  const enquiryId = searchParams.get("enquiryId")
  const parentQuotationId = searchParams.get("parent_quotation_id")

  // Masters
  const [customers, setCustomers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [bankDetails, setBankDetails] = useState<any[]>([])
  const [productSpecs, setProductSpecs] = useState<ProductSpec[]>([])
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([])
  const [uoms, setUoms] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [filteredDischargePorts, setFilteredDischargePorts] = useState<any[]>([])
  const [testingStandards, setTestingStandards] = useState<any[]>([])

  // Form State
  const [customerId, setCustomerId] = useState("")
  const [buyerId, setBuyerId] = useState("")
  const [bankDetailId, setBankDetailId] = useState("")
  const [projectName, setProjectName] = useState("")
  const [attention, setAttention] = useState("")
  const [enquiryReference, setEnquiryReference] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [validityDays, setValidityDays] = useState(marketType === 'DOMESTIC' ? 15 : 30)
  const [currency, setCurrency] = useState(marketType === 'DOMESTIC' ? "INR" : "USD")
  const [exchangeRate, setExchangeRate] = useState(marketType === 'DOMESTIC' ? 1 : 83)
  const [portOfLoadingId, setPortOfLoadingId] = useState("")
  const [portOfDischargeId, setPortOfDischargeId] = useState("")
  const [vesselName, setVesselName] = useState("")
  const [incoterms, setIncoterms] = useState("")
  const [materialOrigin, setMaterialOrigin] = useState("India/Canada")
  const [certification, setCertification] = useState("EN 10204 3.1")
  const [selectedTesting, setSelectedTesting] = useState<string[]>([])
  const [lineItems, setLineItems] = useState<StandardLineItem[]>([])
  const [selectedQuotationTerms, setSelectedQuotationTerms] = useState<SelectedQuotationTerm[]>([]);

  // UI State
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState("")
  const [showConfirm, setShowConfirm] = useState<'draft' | 'approval' | false>(false)

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [custRes, specRes, pipeRes, uomRes, currRes, portRes, testRes, bankRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/product-specs'),
          fetch('/api/pipe-sizes'),
          fetch('/api/uom'),
          fetch('/api/currencies'),
          fetch('/api/ports'),
          fetch('/api/testing-standards'),
          fetch('/api/bank-details')
        ])

        const [custData, specData, pipeData, uomData, currData, portData, testData, bankData] = await Promise.all([
          custRes.json(), specRes.json(), pipeRes.json(), uomRes.json(), currRes.json(), portRes.json(), testRes.json(), bankRes.json()
        ])

        setCustomers(custData.data || [])
        setProductSpecs(specData.data || [])
        setPipeSizes(pipeData.data || [])
        setUoms(uomData.data || [])
        setCurrencies(currData.data || [])
        setPorts(portData.data || [])
        setTestingStandards(testData.data || [])
        setBankDetails(bankData.data || [])

        if (bankData.data?.length > 0) setBankDetailId(bankData.data[0].id)

        if (enquiryId) {
          const enqRes = await fetch(`/api/enquiries/${enquiryId}`)
          const enqData = await enqRes.json()
          if (enqRes.ok && enqData.data) {
            setCustomerId(enqData.data.customer_id)
            setProjectName(enqData.data.project_name || "")
            setEnquiryReference(enqData.data.enquiry_no || "")
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("Failed to load master data")
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [enquiryId])

  useEffect(() => {
    if (customerId) {
      fetch(`/api/buyers?customer_id=${customerId}`)
        .then(res => res.json())
        .then(data => setBuyers(data.data || []))
        .catch(console.error)
    } else {
      setBuyers([])
    }
  }, [customerId])

  useEffect(() => {
    if (portOfLoadingId) {
      const loadingPort = ports.find(p => p.id === portOfLoadingId)
      if (loadingPort) {
        const filtered = ports.filter(p => p.country === loadingPort.country)
        setFilteredDischargePorts(filtered)
      }
    } else {
      setFilteredDischargePorts(ports)
    }
  }, [portOfLoadingId, ports])

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Math.random().toString(36).substring(2, 9),
      materialType: "CS",
      productSpecId: "",
      productName: "",
      specification: "",
      additionalSpec: "",
      ends: "",
      length: "",
      pipeSizeId: "",
      size: "",
      schedule: "",
      od: 0,
      wt: 0,
      weightPerMtr: 0,
      quantity: 0,
      totalWeight: 0,
      unitPrice: 0,
      amount: 0,
      unit: "MTR",
      description: "",
      tagNo: "",
      dwgNo: "",
      dimTolerance: "As per manufacture",
      dmType: "OD",
      wtType: "MIN",
      lenIndividual: 0,
      noOfTubes: 0
    }])
  }

  const updateItem = (id: string, field: keyof StandardLineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }

      if (field === "materialType") {
        updated.productSpecId = ""; updated.pipeSizeId = ""; updated.size = ""; updated.schedule = ""; updated.weightPerMtr = 0;
      }

      if (field === "productName") {
        updated.specification = ""; updated.additionalSpec = ""; updated.productSpecId = "";
        const prefix = value.split(' ')[0].toUpperCase()
        if (['CS', 'SS', 'AS', 'DS'].includes(prefix)) updated.materialType = prefix
      }

      if (field === "specification") { updated.additionalSpec = ""; updated.productSpecId = ""; }

      if (field === "additionalSpec" || (field === "specification" && value)) {
        const spec = productSpecs.find(s =>
          s.product_name === updated.productName &&
          s.material === (field === "specification" ? value : updated.specification) &&
          s.additional_spec === (field === "additionalSpec" ? value : updated.additionalSpec)
        )
        if (spec) {
          updated.productSpecId = spec.id; updated.ends = spec.ends; updated.length = spec.length_range;
        }
      }

      if (field === "size") { updated.schedule = ""; updated.weightPerMtr = 0; updated.pipeSizeId = ""; }

      if (field === "schedule") {
        const pipe = pipeSizes.find(ps => ps.material_type === updated.materialType && ps.size_inch === updated.size && ps.schedule === value)
        if (pipe) {
          updated.pipeSizeId = pipe.id; updated.od = pipe.od_mm; updated.wt = pipe.wall_thickness_mm; updated.weightPerMtr = pipe.weight_kg_per_m;
        }
      }

      if (["materialType", "productSpecId", "size", "schedule", "productName", "specification", "additionalSpec"].includes(field)) {
        const type = updated.materialType || ""
        const specName = updated.specification || ""
        const simpleSpec = specName.replace("ASTM ", "").split(" ")[0]
        const size = updated.size ? updated.size.replace('"', '') : ""
        const sch = updated.schedule || ""
        if (type && simpleSpec && size && sch) updated.description = `PIPE-${type}-${simpleSpec}-${size}-${sch}`.toUpperCase()
        else updated.description = `${updated.productName} ${updated.size} ${updated.schedule} ${updated.specification}`
      }

      updated.totalWeight = (updated.quantity || 0) * (updated.weightPerMtr || 0)
      updated.amount = (updated.quantity || 0) * (updated.unitPrice || 0)
      return updated
    }))
  }

  const removeItem = (id: string) => setLineItems(lineItems.filter(i => i.id !== id))
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const gst = subtotal * 0.18
  const total = subtotal + gst

  const handleSubmit = async () => {
    if (!customerId) { setError("Please select a customer"); return; }
    if (lineItems.length === 0) { setError("Please add items"); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        status: showConfirm === 'approval' ? 'pending_approval' : 'draft',
        customer_id: customerId,
        buyer_id: buyerId || null,
        bank_detail_id: bankDetailId || null,
        project_name: projectName,
        enquiry_reference: enquiryReference,
        attention: attention,
        quotation_date: date,
        validity_days: validityDays,
        market_type: marketType,
        currency, exchange_rate: exchangeRate,
        incoterms, material_origin: materialOrigin, certification,
        port_of_loading_id: portOfLoadingId || null,
        port_of_discharge_id: portOfDischargeId || null,
        vessel_name: vesselName || null,
        testing_standards: selectedTesting,
        terms: selectedQuotationTerms,
        items: lineItems.map(item => ({
          product_spec_id: item.productSpecId,
          pipe_size_id: item.pipeSizeId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          uom_id: uoms.find(u => u.code === item.unit)?.id,
          auto_calculated_weight: item.totalWeight,
          description: item.description,
          tag_no: item.tagNo,
          dwg_no: item.dwgNo,
          dimension_tolerance: item.dimTolerance,
          dm_type: item.dmType,
          wt_type: item.wtType,
          length_individual: item.lenIndividual,
          no_of_tubes: item.noOfTubes
        }))
      }
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      router.push(`/sales/quotations/${result.data.id}`)
    } catch (err: any) { setError(err.message); setShowConfirm(false); } finally { setLoading(false); }
  }

  if (dataLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/sales/quotations/new')}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        <h2 className="text-2xl font-bold">New {marketType} Quotation</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Header Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Buyer / Contact</Label>
              <Select value={buyerId} onValueChange={setBuyerId} disabled={!customerId}>
                <SelectTrigger><SelectValue placeholder="Select Buyer" /></SelectTrigger>
                <SelectContent>{buyers.map(b => <SelectItem key={b.id} value={b.id}>{b.buyer_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Enquiry Ref</Label><Input value={enquiryReference} onChange={e => setEnquiryReference(e.target.value)} /></div>
            <div className="space-y-2"><Label>Attention</Label><Input value={attention} onChange={e => setAttention(e.target.value)} /></div>
            <div className="space-y-2"><Label>Project</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Validity</Label><Input type="number" value={validityDays} onChange={e => setValidityDays(parseInt(e.target.value))} /></div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Bank Details</Label>
              <Select value={bankDetailId} onValueChange={setBankDetailId}>
                <SelectTrigger><SelectValue placeholder="Select Bank" /></SelectTrigger>
                <SelectContent>{bankDetails.map(b => <SelectItem key={b.id} value={b.id}>{b.bank_name} - {b.account_no}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Commercial & Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {marketType === 'EXPORT' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label>Rate</Label><Input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} /></div>
                </div>
                <div className="space-y-1"><Label>Incoterms</Label><Input value={incoterms} onChange={e => setIncoterms(e.target.value)} placeholder="e.g. CIF Jebel Ali" /></div>
                <div className="space-y-1"><Label>Loading Port</Label><Select value={portOfLoadingId} onValueChange={setPortOfLoadingId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ports.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              </>
            )}
            <div className="border-t pt-2 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{currency} {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span>GST 18%</span><span>{currency} {gst.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{currency} {total.toLocaleString()}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfirm('draft')}>Save Draft</Button>
              <Button onClick={() => setShowConfirm('approval')}>Submit</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Line Items</CardTitle><Button size="sm" onClick={addLineItem}><Plus className="h-4 w-4 mr-2" /> Add</Button></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead className="min-w-[200px]">Product / Spec / Technical</TableHead>
                <TableHead className="w-[100px]">Size/Sch</TableHead>
                <TableHead className="w-[100px]">Qty/Unit</TableHead>
                <TableHead className="w-[120px]">Price/Amount</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Select value={item.materialType} onValueChange={v => updateItem(item.id, "materialType", v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="CS">CS</SelectItem><SelectItem value="SS">SS</SelectItem><SelectItem value="AS">AS</SelectItem><SelectItem value="DS">DS</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="space-y-1">
                    <Select value={item.productName} onValueChange={v => updateItem(item.id, "productName", v)}>
                      <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="Product" /></SelectTrigger>
                      <SelectContent>{Array.from(new Set(productSpecs.map(s => s.product_name))).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={item.specification} onValueChange={v => updateItem(item.id, "specification", v)} disabled={!item.productName}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Grade" /></SelectTrigger>
                      <SelectContent>{Array.from(new Set(productSpecs.filter(s => s.product_name === item.productName).map(s => s.material))).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-1">
                      <Input placeholder="Tag No" className="h-6 text-[10px]" value={item.tagNo} onChange={e => updateItem(item.id, "tagNo", e.target.value)} />
                      <Input placeholder="DWG No" className="h-6 text-[10px]" value={item.dwgNo} onChange={e => updateItem(item.id, "dwgNo", e.target.value)} />
                    </div>
                  </TableCell>
                  <TableCell className="space-y-1">
                    <Select value={item.size} onValueChange={v => updateItem(item.id, "size", v)} disabled={!item.materialType}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{Array.from(new Set(pipeSizes.filter(ps => ps.material_type === item.materialType).map(ps => ps.size_inch))).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={item.schedule} onValueChange={v => updateItem(item.id, "schedule", v)} disabled={!item.size}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{pipeSizes.filter(ps => ps.material_type === item.materialType && ps.size_inch === item.size).map(ps => <SelectItem key={ps.id} value={ps.schedule}>{ps.schedule}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="space-y-1">
                    <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value))} className="h-8" />
                    <Select value={item.unit} onValueChange={v => updateItem(item.id, "unit", v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{uoms.map(u => <SelectItem key={u.id} value={u.code}>{u.code}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right space-y-1">
                    <Input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value))} className="h-8 text-right font-bold" />
                    <div className="text-xs font-medium">{(item.amount || 0).toLocaleString()}</div>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-8 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
        <CardContent>
          <TermsConditionsEditor initialSelectedTerms={selectedQuotationTerms} onTermsChange={setSelectedQuotationTerms} />
        </CardContent>
      </Card>

      <Dialog open={!!showConfirm} onOpenChange={(open) => !open && setShowConfirm(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Quotation</DialogTitle><DialogDescription>Total: {currency} {total.toLocaleString()}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StandardQuotationPage() {
  return (
    <PageLayout title="New Standard Quotation">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <StandardQuotationForm />
      </Suspense>
    </PageLayout>
  )
}