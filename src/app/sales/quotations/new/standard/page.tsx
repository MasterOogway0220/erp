"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermsConditionsEditor } from "@/components/quotations/TermsConditionsEditor" // Import TermsConditionsEditor

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
}

interface Term {
  id: string
  title: string
  description?: string
  default_text?: string
  category: string
}

interface SelectedQuotationTerm {
  term_id: string
  custom_text: string
  display_order: number;
}

function StandardQuotationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const enquiryId = searchParams.get("enquiryId")
  const parentQuotationId = searchParams.get("parent_quotation_id")

  // Masters
  const [customers, setCustomers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [productSpecs, setProductSpecs] = useState<ProductSpec[]>([])
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([])
  const [uoms, setUoms] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [filteredDischargePorts, setFilteredDischargePorts] = useState<any[]>([])
  const [testingStandards, setTestingStandards] = useState<any[]>([])
  // const [terms, setTerms] = useState<Term[]>([]) // No longer needed directly here, managed by editor

  // Form State
  const [customerId, setCustomerId] = useState("")
  const [buyerId, setBuyerId] = useState("")
  const [projectName, setProjectName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [validityDays, setValidityDays] = useState(15)
  const [currency, setCurrency] = useState("INR")
  const [exchangeRate, setExchangeRate] = useState(1)
  const [portOfLoadingId, setPortOfLoadingId] = useState("")
  const [portOfDischargeId, setPortOfDischargeId] = useState("")
  const [vesselName, setVesselName] = useState("")
  const [selectedTesting, setSelectedTesting] = useState<string[]>([])
  const [lineItems, setLineItems] = useState<StandardLineItem[]>([]) // Renamed for clarity with items
  const [selectedQuotationTerms, setSelectedQuotationTerms] = useState<SelectedQuotationTerm[]>([]); // New state for selected terms

  // UI State
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [custRes, specRes, pipeRes, uomRes, currRes, portRes, testRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/product-specs'),
          fetch('/api/pipe-sizes'),
          fetch('/api/uom'),
          fetch('/api/currencies'),
          fetch('/api/ports'),
          fetch('/api/testing-standards'),
          // fetch('/api/terms') // No longer needed
        ])

        const [custData, specData, pipeData, uomData, currData, portData, testData] = await Promise.all([
          custRes.json(),
          specRes.json(),
          pipeRes.json(),
          uomRes.json(),
          currRes.json(),
          portRes.json(),
          testRes.json(),
          // termRes.json() // No longer needed
        ])

        const loadedPipeSizes = pipeData.data || []
        const loadedSpecs = specData.data || []

        setCustomers(custData.data || [])
        setProductSpecs(loadedSpecs)
        setPipeSizes(loadedPipeSizes)
        setUoms(uomData.data || [])
        setCurrencies(currData.data || [])
        setPorts(portData.data || [])
        setTestingStandards(testData.data || [])
        // setTerms(termData.data || []) // No longer needed

        if (enquiryId) {
          const enqRes = await fetch(`/api/enquiries/${enquiryId}`)
          const enqData = await enqRes.json()
          if (enqRes.ok && enqData.data) {
            setCustomerId(enqData.data.customer_id)
            setProjectName(enqData.data.project_name || "")

            // Map Enquiry Items to Standard Line Items
            const mappedItems: StandardLineItem[] = (enqData.data.items || []).map((i: any) => ({
              id: Math.random().toString(36).substring(2, 9),
              materialType: "CS", // Default
              productSpecId: "", // User to select
              productName: i.product?.name || "",
              specification: i.specifications || "",
              additionalSpec: "",
              ends: "",
              length: "",
              pipeSizeId: "",
              size: "",
              schedule: "",
              od: 0,
              wt: 0,
              weightPerMtr: 0,
              quantity: i.quantity || 0,
              totalWeight: 0,
              unitPrice: 0,
              amount: 0,
              unit: "MTR",
              description: i.specifications || (i.product?.name ? `PIPE-${i.product.name}` : "")
            }))

            if (mappedItems.length > 0) {
              setLineItems(mappedItems)
            }
          }
        }

        if (parentQuotationId) {
          const qRes = await fetch(`/api/quotations/${parentQuotationId}`) // Assuming detail API exists or list endpoint supports ID
          if (qRes.ok) {
            const result = await qRes.json()
            const q = result.data
            if (q) {
              setCustomerId(q.customer_id)
              setBuyerId(q.buyer_id || "")
              setProjectName(q.project_name || "")
              setCurrency(q.currency)
              setExchangeRate(q.exchange_rate)
              setValidityDays(30) // Default or calc
              // Map items
              const mappedItems: StandardLineItem[] = (q.items || []).map((i: any) => {
                const pipe = loadedPipeSizes.find((p: any) => p.id === i.pipe_size_id)
                const spec = loadedSpecs.find((s: any) => s.id === i.product_spec_id)

                return {
                  id: Math.random().toString(36).substring(2, 9),
                  materialType: pipe?.material_type || "CS",
                  productSpecId: i.product_spec_id,
                  productName: spec?.product_name || "",
                  specification: spec?.additional_spec || "",
                  ends: "",
                  length: "",
                  pipeSizeId: "",
                  size: pipe?.size_inch || "",
                  schedule: pipe?.schedule || "",
                  od: pipe?.od_mm || 0,
                  wt: pipe?.wall_thickness_mm || 0,
                  weightPerMtr: pipe?.weight_kg_per_m || 0,
                  quantity: i.quantity,
                  totalWeight: i.total_weight,
                  unitPrice: i.unit_price,
                  amount: i.line_total,
                  unit: i.uom || "MTR",
                  description: i.description
                }
              })
              setLineItems(mappedItems)
              // Map Terms (Assumes terms fetched)
              if (q.terms) {
                setSelectedQuotationTerms(q.terms.map((t: any) => ({
                  term_id: t.term_id,
                  custom_text: t.custom_text || t.term_details?.default_text || "",
                  display_order: t.display_order
                })))
              }
            }
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
  }, [enquiryId, parentQuotationId])

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

  // Port cascading filter - filter discharge ports by loading port country
  useEffect(() => {
    if (portOfLoadingId) {
      const loadingPort = ports.find(p => p.id === portOfLoadingId)
      if (loadingPort) {
        const filtered = ports.filter(p => p.country === loadingPort.country)
        setFilteredDischargePorts(filtered)
        // Reset discharge port if it's not in the filtered list
        if (portOfDischargeId && !filtered.find(p => p.id === portOfDischargeId)) {
          setPortOfDischargeId("")
        }
      }
    } else {
      setFilteredDischargePorts(ports)
    }
  }, [portOfLoadingId, ports, portOfDischargeId])

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
      description: ""
    }])
  }

  const updateItem = (id: string, field: keyof StandardLineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id !== id) return item

      const updated = { ...item, [field]: value }

      // Reset dependent fields if material type changes
      if (field === "materialType") {
        updated.productSpecId = ""
        updated.pipeSizeId = ""
        updated.size = ""
        updated.schedule = ""
        updated.weightPerMtr = 0
      }

      // Cascading logic for Product Spec
      if (field === "productSpecId") {
        const spec = productSpecs.find(s => s.id === value)
        if (spec) {
          updated.productName = spec.product_name
          updated.specification = spec.material
          updated.additionalSpec = spec.additional_spec
          updated.ends = spec.ends
          updated.length = spec.length_range
        }
      }

      // Cascading logic for Size selection
      if (field === "size") {
        updated.schedule = ""
        updated.weightPerMtr = 0
        updated.pipeSizeId = ""
      }

      // Cascading logic for Schedule selection (Auto-fills OD, WT, Weight)
      if (field === "schedule") {
        const pipe = pipeSizes.find(ps =>
          ps.material_type === updated.materialType &&
          ps.size_inch === updated.size &&
          ps.schedule === value
        )
        if (pipe) {
          updated.pipeSizeId = pipe.id
          updated.od = pipe.od_mm
          updated.wt = pipe.wall_thickness_mm
          updated.weightPerMtr = pipe.weight_kg_per_m
        }
      }

      // Material Code Auto-Generation (KP-6)
      // Format: TYPE-SPEC-SIZE-SCH (e.g. CS-A106-24-SCH40)
      if (field === "materialType" || field === "productSpecId" || field === "size" || field === "schedule") {
        const type = updated.materialType || ""
        const specName = updated.specification || "" // e.g. ASTM A106
        // Extract simple spec name (A106)
        const simpleSpec = specName.replace("ASTM ", "").split(" ")[0]
        const size = updated.size ? updated.size.replace('"', '') : ""
        const sch = updated.schedule || ""

        if (type && simpleSpec && size && sch) {
          updated.description = `PIPE-${type}-${simpleSpec}-${size}-${sch}`.toUpperCase()
        } else {
          // Fallback description
          updated.description = `${updated.productName} ${updated.size} ${updated.schedule} ${updated.specification}`
        }
      }

      // CRITICAL FIX: Always recalculate weight and amount to prevent zero total bug
      updated.totalWeight = (updated.quantity || 0) * (updated.weightPerMtr || 0)
      updated.amount = (updated.quantity || 0) * (updated.unitPrice || 0)

      return updated
    }))
  }

  const removeItem = (id: string) => {
    setLineItems(lineItems.filter(i => i.id !== id))
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const gst = subtotal * 0.18
  const total = subtotal + gst

  const handleSubmit = async () => {
    // Pre-submit validation
    if (!customerId) {
      setError("Please select a customer")
      return
    }

    if (lineItems.length === 0) {
      setError("Please add at least one item")
      return
    }

    if (total <= 0) {
      setError("Total amount must be greater than 0. Please check item prices and quantities.")
      return
    }

    if (currency !== 'INR' && exchangeRate <= 0) {
      setError("Exchange rate must be greater than 0 for non-INR currencies")
      return
    }

    // Check if all items have valid prices
    const invalidItems = lineItems.filter(item => item.unitPrice <= 0 || item.quantity <= 0)
    if (invalidItems.length > 0) {
      setError("All items must have valid quantity and unit price greater than 0")
      return
    }

    setLoading(true)
    setError("")
    try {
      const payload = {
        customer_id: customerId,
        buyer_id: buyerId || null,
        parent_quotation_id: parentQuotationId || null,
        enquiry_id: enquiryId || null,
        project_name: projectName,
        quotation_date: date,
        validity_days: validityDays,
        quotation_type: "STANDARD",
        currency: currency,
        exchange_rate: exchangeRate,
        port_of_loading_id: portOfLoadingId || null,
        port_of_discharge_id: portOfDischargeId || null,
        vessel_name: vesselName || null,
        testing_standards: selectedTesting,
        terms: selectedQuotationTerms.map(st => ({
          term_id: st.term_id,
          custom_text: st.custom_text,
          display_order: st.display_order
        })),
        items: lineItems.map(item => ({
          product_spec_id: item.productSpecId,
          pipe_size_id: item.pipeSizeId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          uom_id: uoms.find(u => u.code === item.unit)?.id,
          auto_calculated_weight: item.totalWeight,
          description: item.description || `${item.productName} ${item.size} ${item.schedule} ${item.specification}`
        }))
      }

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to save quotation")

      router.push(`/sales/quotations/${result.data.id}`)
    } catch (err: any) {
      setError(err.message)
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/sales/quotations/new')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Standard Quotation - New</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Header Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Buyer / Contact Person</Label>
              <Select value={buyerId} onValueChange={setBuyerId} disabled={!customerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Buyer" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map(b => <SelectItem key={b.id} value={b.id}>{b.buyer_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project details" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Validity (Days)</Label>
                <Input type="number" value={validityDays} onChange={e => setValidityDays(parseInt(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Export & Commercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => {
                  setCurrency(v);
                  const curr = currencies.find(c => c.code === v);
                  if (v === 'INR') setExchangeRate(1);
                  else if (v === 'USD') setExchangeRate(83);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => <SelectItem key={c.id} value={c.code}>{c.code} - {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exchange Rate</Label>
                <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Port of Loading</Label>
              <Select value={portOfLoadingId} onValueChange={setPortOfLoadingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Port of Discharge</Label>
              <Select value={portOfDischargeId} onValueChange={setPortOfDischargeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Port" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDischargePorts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Testing & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {testingStandards.map(ts => (
                <div key={ts.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={ts.id}
                    checked={selectedTesting.includes(ts.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTesting([...selectedTesting, ts.id])
                      else setSelectedTesting(selectedTesting.filter(id => id !== ts.id))
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor={ts.id} className="text-sm cursor-pointer">{ts.name}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{currency} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%):</span>
              <span className="font-medium">{currency} {gst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{currency} {total.toLocaleString()}</span>
            </div>
            <Button className="w-full mt-4" size="lg" onClick={() => setShowConfirm(true)} disabled={lineItems.length === 0}>
              <Save className="mr-2 h-4 w-4" /> Save Quotation
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Line Items</CardTitle>
          <Button size="sm" onClick={addLineItem} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="min-w-[200px]">Product</TableHead>
                  <TableHead className="w-[80px]">Size</TableHead>
                  <TableHead className="w-[80px]">Sch</TableHead>
                  <TableHead className="w-[80px]">OD/WT</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[80px]">Unit</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[100px] text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="align-top">
                      <Select value={item.materialType} onValueChange={v => updateItem(item.id, "materialType", v)}>
                        <SelectTrigger className="h-8 w-full p-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CS">CS</SelectItem>
                          <SelectItem value="SS">SS</SelectItem>
                          <SelectItem value="AS">AS</SelectItem>
                          <SelectItem value="DS">DS</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top">
                      <Select value={item.productSpecId} onValueChange={v => updateItem(item.id, "productSpecId", v)}>
                        <SelectTrigger className="h-8 w-full p-2 text-xs">
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productSpecs.map(s => <SelectItem key={s.id} value={s.id}>{s.product_name} - {s.material}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[200px]">
                        {item.productName} {item.description}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Select value={item.size} onValueChange={v => updateItem(item.id, "size", v)} disabled={!item.materialType}>
                        <SelectTrigger className="h-8 w-full p-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set(pipeSizes.filter(ps => ps.material_type === item.materialType).map(ps => ps.size_inch))).map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top">
                      <Select value={item.schedule} onValueChange={v => updateItem(item.id, "schedule", v)} disabled={!item.size}>
                        <SelectTrigger className="h-8 w-full p-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pipeSizes
                            .filter(ps => ps.material_type === item.materialType && ps.size_inch === item.size)
                            .map(ps => <SelectItem key={ps.id} value={ps.schedule}>{ps.schedule}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      <div>OD: {item.od}</div>
                      <div>WT: {item.wt}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value))}
                        className="h-8 px-2 text-right"
                      />
                      <div className="text-[10px] text-muted-foreground mt-1 text-right">
                        {item.totalWeight.toFixed(1)} kg
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Select value={item.unit} onValueChange={v => updateItem(item.id, "unit", v)}>
                        <SelectTrigger className="h-8 w-full p-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {uoms.map(u => <SelectItem key={u.id} value={u.code}>{u.code}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value))}
                        className="h-8 px-2 text-right"
                      />
                    </TableCell>
                    <TableCell className="align-top text-right font-medium">
                      {item.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lineItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground border-dashed">
                      No items added. Click "Add Item" to start.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <TermsConditionsEditor
            initialSelectedTerms={selectedQuotationTerms}
            onTermsChange={setSelectedQuotationTerms}
          />
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this standard quotation for a total of {currency} {total.toLocaleString()}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Save
            </Button>
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