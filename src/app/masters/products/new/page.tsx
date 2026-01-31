"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle, Sparkles, Box, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const categories = ["Pipes", "Flanges", "Valves", "Gaskets", "Fittings", "Other"]

export default function NewProductPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState("")
  const [primaryUomId, setPrimaryUomId] = useState("")
  const [internalMaterialCode, setInternalMaterialCode] = useState("")
  const [customerMaterialCode, setCustomerMaterialCode] = useState("")
  const [hsnCode, setHsnCode] = useState("")
  const [basePrice, setBasePrice] = useState("")
  const [description, setDescription] = useState("")
  const [uoms, setUoms] = useState<any[]>([])

  // Specifications
  const [size, setSize] = useState("")
  const [grade, setGrade] = useState("")
  const [schedule, setSchedule] = useState("")
  const [wallThickness, setWallThickness] = useState("")

  useEffect(() => {
    fetch('/api/uom').then(res => res.json()).then(data => setUoms(data.data || []))
  }, [])

  const generateCodeFromSpecs = () => {
    if (!category) return

    const parts = []
    if (category) parts.push(category.substring(0, 2).toUpperCase())
    if (grade) parts.push(grade.replace(/[^a-zA-Z0-9]/g, ''))
    if (size) parts.push(size.replace(/[^0-9.]/g, ''))
    if (schedule) parts.push(schedule.replace(/[^a-zA-Z0-9]/g, ''))

    if (parts.length > 1) {
      setInternalMaterialCode(parts.join('-'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !code.trim() || !category || !primaryUomId) {
      setError("Please fill all required fields")
      return
    }

    setSaving(true)

    const selectedUom = uoms.find(u => u.id === primaryUomId)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          category,
          unit: selectedUom?.code || "NOS",
          primary_uom_id: primaryUomId,
          internal_material_code: internalMaterialCode.trim() || null,
          customer_material_code: customerMaterialCode.trim() || null,
          hsn_code: hsnCode.trim() || null,
          base_price: parseFloat(basePrice) || 0,
          description: description.trim() || null,
          size: size.trim() || null,
          grade: grade.trim() || null,
          schedule: schedule.trim() || null,
          wall_thickness: parseFloat(wallThickness) || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product')
      }

      router.push('/masters/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout title="New Product">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Product Master</h2>
            <p className="text-muted-foreground">Define business specifications and material codes</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="border-t-4 border-t-primary shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Box className="h-4 w-4" /> Material Identification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Product Display Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Seamless Pipe 100mm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Product Code / SKU *</Label>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Visible Code"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                        Internal Material Code <Sparkles className="h-3 w-3 text-orange-500" />
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] uppercase font-black text-primary"
                        onClick={generateCodeFromSpecs}
                        disabled={!category}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Auto-Construct
                      </Button>
                    </div>
                    <Input
                      value={internalMaterialCode}
                      onChange={(e) => setInternalMaterialCode(e.target.value)}
                      placeholder="Constructed from Specs"
                    />
                    <p className="text-[10px] text-muted-foreground italic font-medium">Standard format: CAT-GRADE-SIZE-SCH</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Customer Ref Code</Label>
                      <Input
                        value={customerMaterialCode}
                        onChange={(e) => setCustomerMaterialCode(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Primary Unit (UOM) *</Label>
                      <Select value={primaryUomId} onValueChange={setPrimaryUomId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UOM" />
                        </SelectTrigger>
                        <SelectContent>
                          {uoms.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-t-4 border-t-orange-500">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-orange-700">Detailed Specifications</CardTitle>
                  <CardDescription>Critical for standard product matching</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Nominal Size</Label>
                    <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 1.5 inch" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Material Grade</Label>
                    <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. SS304L" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Schedule / Class</Label>
                    <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Sch 40" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Wall Thickness (mm)</Label>
                    <Input type="number" value={wallThickness} onChange={(e) => setWallThickness(e.target.value)} placeholder="0.00" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-lg border-t-4 border-t-green-600">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-green-700">Financial & Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">HSN/SAC Code</Label>
                    <Input
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value)}
                      placeholder="8-digit HSN code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Base List Price (INR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">₹</span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Full Specification Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed technical specs for quality certificate..."
                      rows={8}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pb-10">
            <p className="text-[10px] text-muted-foreground font-medium max-w-xs italic">
              * ISO 9001:2015 Traceability Enabled. Internal Material Code is used for physical tagging in warehouse.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim() || !code.trim() || !category || !primaryUomId}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Product Master
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
