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
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2, Save, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermsConditionsEditor } from "@/components/quotations/TermsConditionsEditor"

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
    const marketType = searchParams.get("market") as "DOMESTIC" | "EXPORT" || "DOMESTIC"
    const enquiryId = searchParams.get("enquiryId")

    // Masters
    const [customers, setCustomers] = useState<any[]>([])
    const [buyers, setBuyers] = useState<any[]>([])
    const [bankDetails, setBankDetails] = useState<any[]>([])
    const [uoms, setUoms] = useState<any[]>([])
    const [currencies, setCurrencies] = useState<any[]>([])
    const [ports, setPorts] = useState<any[]>([])
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
    const [incoterms, setIncoterms] = useState("")
    const [materialOrigin, setMaterialOrigin] = useState("India/Canada")
    const [selectedTesting, setSelectedTesting] = useState<string[]>([])
    const [items, setItems] = useState<NonStandardLineItem[]>([])
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
                const [custRes, uomRes, currRes, portRes, testRes, bankRes] = await Promise.all([
                    fetch('/api/customers'),
                    fetch('/api/uom'),
                    fetch('/api/currencies'),
                    fetch('/api/ports'),
                    fetch('/api/testing-standards'),
                    fetch('/api/bank-details')
                ])

                const [custData, uomData, currData, portData, testData, bankData] = await Promise.all([
                    custRes.json(), uomRes.json(), currRes.json(), portRes.json(), testRes.json(), bankRes.json()
                ])

                setCustomers(custData.data || [])
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

                        const mappedItems: NonStandardLineItem[] = (enqData.data.items || []).map((i: any) => ({
                            id: Math.random().toString(36).substring(2, 9),
                            productName: i.product?.name || "New Product",
                            description: i.specifications || "",
                            quantity: i.quantity || 1,
                            unitPrice: 0,
                            amount: 0,
                            unit: "NOS"
                        }))
                        if (mappedItems.length > 0) setItems(mappedItems)
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

    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id))
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const gst = subtotal * 0.18
    const total = subtotal + gst

    const handleSubmit = async () => {
        if (!customerId) { setError("Please select a customer"); return; }
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
                quotation_type: "NON_STANDARD",
                market_type: marketType,
                currency, exchange_rate: exchangeRate,
                incoterms, material_origin: materialOrigin,
                port_of_loading_id: portOfLoadingId || null,
                port_of_discharge_id: portOfDischargeId || null,
                testing_standards: selectedTesting,
                terms: selectedQuotationTerms,
                items: items.map(item => ({
                    product_name: item.productName,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    uom_id: uoms.find(u => u.code === item.unit)?.id,
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
                <h2 className="text-2xl font-bold">New {marketType} (Non-Std) Quotation</h2>
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
                <CardContent className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="p-4 border rounded-lg bg-accent/5 relative space-y-4">
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Product Name *</Label><Input value={item.productName} onChange={e => updateItem(item.id, "productName", e.target.value)} /></div>
                                <div className="space-y-2"><Label>Specifications / Description</Label><Textarea value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value))} /></div>
                                <div className="space-y-2"><Label>Unit</Label><Select value={item.unit} onValueChange={v => updateItem(item.id, "unit", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{uoms.map(u => <SelectItem key={u.id} value={u.code}>{u.code}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Unit Price</Label><Input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value))} /></div>
                                <div className="text-right font-bold pb-2">{currency} {item.amount.toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
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

export default function NonStandardQuotationPage() {
    return (
        <PageLayout title="New Non-Standard Quotation">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <NonStandardQuotationForm />
            </Suspense>
        </PageLayout>
    )
}