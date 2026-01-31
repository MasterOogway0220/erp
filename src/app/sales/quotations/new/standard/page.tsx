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
}

function StandardQuotationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const enquiryId = searchParams.get("enquiryId")

  // Masters
  const [customers, setCustomers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [productSpecs, setProductSpecs] = useState<ProductSpec[]>([])
  const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([])
  const [uoms, setUoms] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [testingStandards, setTestingStandards] = useState<any[]>([])

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
  const [items, setItems] = useState<StandardLineItem[]>([])

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
          fetch('/api/testing-standards')
        ])

        const [custData, specData, pipeData, uomData, currData, portData, testData] = await Promise.all([
          custRes.json(),
          specRes.json(),
          pipeRes.json(),
          uomRes.json(),
          currRes.json(),
          portRes.json(),
          testRes.json()
        ])

        setCustomers(custData.data || [])
        setProductSpecs(specData.data || [])
        setPipeSizes(pipeData.data || [])
        setUoms(uomData.data || [])
        setCurrencies(currData.data || [])
        setPorts(portData.data || [])
        setTestingStandards(testData.data || [])

        if (enquiryId) {
          const enqRes = await fetch(`/api/enquiries/${enquiryId}`)
          const enqData = await enqRes.json()
          if (enqRes.ok && enqData.data) {
            setCustomerId(enqData.data.customer_id)
            setProjectName(enqData.data.project_name || "")
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

  const addLineItem = () => {
    setItems([...items, {
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
      unit: "MTR"
    }])
  }

  const updateItem = (id: string, field: keyof StandardLineItem, value: any) => {
    setItems(items.map(item => {
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

      // Calculations
      if (field === "quantity" || field === "schedule" || field === "size" || field === "materialType") {
        updated.totalWeight = (updated.quantity || 0) * (updated.weightPerMtr || 0)
      }

      if (field === "quantity" || field === "unitPrice") {
        updated.amount = (updated.quantity || 0) * (updated.unitPrice || 0)
      }

      return updated
    }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const gst = subtotal * 0.18
  const total = subtotal + gst

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          buyer_id: buyerId || null,
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
          items: items.map(item => ({
            product_spec_id: item.productSpecId,
            pipe_size_id: item.pipeSizeId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            uom_id: uoms.find(u => u.code === item.unit)?.id,
            auto_calculated_weight: item.totalWeight,
            description: `${item.productName} ${item.size} ${item.schedule} ${item.specification}`
          }))
        })
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
                  {buyers.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
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
                  {ports.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
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
            <Button className="w-full mt-4" size="lg" onClick={() => setShowConfirm(true)} disabled={items.length === 0}>
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
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg bg-accent/5 relative space-y-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Material Type</Label>
                    <Select value={item.materialType} onValueChange={v => updateItem(item.id, "materialType", v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CS">CS (Carbon Steel)</SelectItem>
                        <SelectItem value="SS">SS (Stainless Steel)</SelectItem>
                        <SelectItem value="AS">AS (Alloy Steel)</SelectItem>
                        <SelectItem value="DS">DS (Duplex Steel)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Product</Label>
                    <Select value={item.productSpecId} onValueChange={v => updateItem(item.id, "productSpecId", v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productSpecs
                          // Relaxed filtering: if material matches broadly or is generic
                          .filter(s => {
                            if (!item.materialType) return true;
                            // Match if spec material contains the type (e.g. "ASTM A106" vs "CS") is hard.
                            // Better to show all and let user pick, or filter loosely.
                            // For now, let's allow all since the mapping is not 1:1 in the seed data
                            return true;
                          })
                          .map(s => <SelectItem key={s.id} value={s.id}>{s.product_name} - {s.material}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Size</Label>
                    <Select value={item.size} onValueChange={v => updateItem(item.id, "size", v)} disabled={!item.materialType}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(pipeSizes.filter(ps => ps.material_type === item.materialType).map(ps => ps.size_inch))).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Schedule</Label>
                    <Select value={item.schedule} onValueChange={v => updateItem(item.id, "schedule", v)} disabled={!item.size}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipeSizes
                          .filter(ps => ps.material_type === item.materialType && ps.size_inch === item.size)
                          .map(ps => <SelectItem key={ps.id} value={ps.schedule}>{ps.schedule}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-3 rounded text-xs">
                  <div><span className="text-muted-foreground">OD:</span> {item.od} mm</div>
                  <div><span className="text-muted-foreground">WT:</span> {item.wt} mm</div>
                  <div><span className="text-muted-foreground">Weight:</span> {item.weightPerMtr} kg/m</div>
                  <div><span className="text-muted-foreground">Total Weight:</span> <span className="font-bold">{item.totalWeight.toFixed(2)} kg</span></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value))} className="h-8" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Unit</Label>
                    <Select value={item.unit} onValueChange={v => updateItem(item.id, "unit", v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.map(u => <SelectItem key={u.id} value={u.code}>{u.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Unit Price</Label>
                    <Input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value))} className="h-8" />
                  </div>
                  <div className="text-right font-bold pb-2">
                    ₹{item.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                No items added yet. Click "Add Item" to begin your quotation.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this standard quotation for a total of ₹{total.toLocaleString()}?
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
