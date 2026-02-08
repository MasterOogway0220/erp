"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

interface NonStandardLineItem {
    id: string
    productName: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
    unit: string
}

interface SelectedQuotationTerm {
  term_id: string
  custom_text: string
  display_order: number;
}

function NonStandardQuotationForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const enquiryId = searchParams.get("enquiryId")

    // Masters
    const [customers, setCustomers] = useState<any[]>([])
    const [buyers, setBuyers] = useState<any[]>([])
    const [uoms, setUoms] = useState<any[]>([])
    const [currencies, setCurrencies] = useState<any[]>([])
    const [ports, setPorts] = useState<any[]>([])
    const [testingStandards, setTestingStandards] = useState<any[]>([])

    // Form State
    const [customerId, setCustomerId] = useState("")
    const [buyerId, setBuyerId] = useState("")
    const [projectName, setProjectName] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [validityDays, setValidityDays] = useState(30)
    const [currency, setCurrency] = useState("INR")
    const [exchangeRate, setExchangeRate] = useState(1)
    const [portOfLoadingId, setPortOfLoadingId] = useState("")
    const [portOfDischargeId, setPortOfDischargeId] = useState("")
    const [selectedTesting, setSelectedTesting] = useState<string[]>([])
    const [items, setItems] = useState<NonStandardLineItem[]>([])
    const [remarks, setRemarks] = useState("")
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
                const [custRes, uomRes, currRes, portRes, testRes] = await Promise.all([
                    fetch('/api/customers'),
                    fetch('/api/uom'),
                    fetch('/api/currencies'),
                    fetch('/api/ports'),
                    fetch('/api/testing-standards')
                    // fetch('/api/terms') // No longer needed
                ])

                const [custData, uomData, currData, portData, testData] = await Promise.all([
                    custRes.json(),
                    uomRes.json(),
                    currRes.json(),
                    portRes.json(),
                    testRes.json()
                    // termRes.json() // No longer needed
                ])

                setCustomers(custData.data || [])
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

                        // Map Items
                        const mappedItems: NonStandardLineItem[] = (enqData.data.items || []).map((i: any) => ({
                            id: Math.random().toString(36).substring(2, 9),
                            productName: i.product?.name || "New Product",
                            description: i.specifications || "",
                            quantity: i.quantity || 1,
                            unitPrice: 0,
                            amount: 0,
                            unit: "NOS"
                        }))

                        if (mappedItems.length > 0) {
                            setItems(mappedItems)
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
            productName: "",
            description: "",
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            unit: "NOS"
        }])
    }

    const updateItem = (id: string, field: keyof NonStandardLineItem, value: any) => {
        setItems(items.map(item => {
            if (item.id !== id) return item

            const updated = { ...item, [field]: value }

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
                    quotation_type: "NON_STANDARD",
                    currency: currency,
                    exchange_rate: exchangeRate,
                    port_of_loading_id: portOfLoadingId || null,
                    port_of_discharge_id: portOfDischargeId || null,
                    testing_standards: selectedTesting,
                    remarks: remarks,
                    terms: selectedQuotationTerms.map(st => ({
                      term_id: st.term_id,
                      custom_text: st.custom_text,
                      display_order: st.display_order
                    })),
                    items: items.map(item => ({
                        product_name: item.productName,
                        description: item.description,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        uom_id: uoms.find(u => u.code === item.unit)?.id,
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
                <h2 className="text-2xl font-bold tracking-tight">Non-Standard Quotation - New</h2>
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
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {/* Additional header fields... */}
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
                    </CardContent>
                </Card>

                {/* Summary Card */}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Product Name *</Label>
                                        <Input
                                            value={item.productName}
                                            onChange={e => updateItem(item.id, "productName", e.target.value)}
                                            placeholder="e.g. Gate Valve, Flange, etc."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Description (Rich Text)</Label>
                                        <Textarea
                                            value={item.description}
                                            onChange={e => updateItem(item.id, "description", e.target.value)}
                                            placeholder="Enter detailed technical specs..."
                                        />
                                    </div>
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
                                    {/* Manual Price Input - Explicitly showing this as requested */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">Unit Price</Label>
                                        <Input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value))} className="h-8" />
                                    </div>
                                    <div className="text-right font-bold pb-2">
                                        {currency} {item.amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                                No items added yet. Click "Add Item" to begin.
                            </div>
                        )}
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
                            Create non-standard quotation for {currency} {total.toLocaleString()}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function NonStandardQuotationPage() {
    return (
        <PageLayout title="New Non-Standard Quotation">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <NonStandardQuotationForm />
            </Suspense>
        </PageLayout>
    )
}