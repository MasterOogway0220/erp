"use client"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle, Save, Trash2, Building2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function CompanyDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Form State
    const [name, setName] = useState("")
    const [companyType, setCompanyType] = useState<string>("Pvt Ltd")
    const [gstin, setGstin] = useState("")
    const [pan, setPan] = useState("")
    const [tan, setTan] = useState("")
    const [cin, setCin] = useState("")
    const [email, setEmail] = useState("")
    const [website, setWebsite] = useState("")
    const [mobile, setMobile] = useState("")
    const [telephone, setTelephone] = useState("")
    const [financialYear, setFinancialYear] = useState("2025-2026")
    const [isActive, setIsActive] = useState(true)

    // Registered Address
    const [regAddress1, setRegAddress1] = useState("")
    const [regAddress2, setRegAddress2] = useState("")
    const [regCity, setRegCity] = useState("")
    const [regState, setRegState] = useState("")
    const [regPincode, setRegPincode] = useState("")
    const [regCountry, setRegCountry] = useState("India")

    // Warehouse Address
    const [sameAsRegistered, setSameAsRegistered] = useState(false)
    const [wareAddress1, setWareAddress1] = useState("")
    const [wareAddress2, setWareAddress2] = useState("")
    const [wareCity, setWareCity] = useState("")
    const [wareState, setWareState] = useState("")
    const [warePincode, setWarePincode] = useState("")
    const [wareCountry, setWareCountry] = useState("India")

    useEffect(() => {
        if (id) fetchCompany()
    }, [id])

    const fetchCompany = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/companies/${id}`)
            const result = await res.json()
            if (res.ok) {
                const data = result.data
                setName(data.name)
                setCompanyType(data.company_type)
                setGstin(data.gstin || "")
                setPan(data.pan || "")
                setTan(data.tan || "")
                setCin(data.cin || "")
                setEmail(data.email || "")
                setWebsite(data.website || "")
                setMobile(data.mobile || "")
                setTelephone(data.telephone || "")
                setRegAddress1(data.registered_address_line1 || "")
                setRegAddress2(data.registered_address_line2 || "")
                setRegCity(data.registered_city || "")
                setRegState(data.registered_state || "")
                setRegPincode(data.registered_pincode || "")
                setRegCountry(data.registered_country || "India")
                setWareAddress1(data.warehouse_address_line1 || "")
                setWareAddress2(data.warehouse_address_line2 || "")
                setWareCity(data.warehouse_city || "")
                setWareState(data.warehouse_state || "")
                setWarePincode(data.warehouse_pincode || "")
                setWareCountry(data.warehouse_country || "India")
                setFinancialYear(data.current_financial_year || "2025-2026")
                setIsActive(data.is_active)
            } else {
                setError(result.error || "Failed to fetch company")
            }
        } catch (err) {
            setError("Failed to fetch company details")
        } finally {
            setLoading(false)
        }
    }

    const handleSameAsRegistered = (checked: boolean) => {
        setSameAsRegistered(checked)
        if (checked) {
            setWareAddress1(regAddress1)
            setWareAddress2(regAddress2)
            setWareCity(regCity)
            setWareState(regState)
            setWarePincode(regPincode)
            setWareCountry(regCountry)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setSaving(true)

        try {
            const payload = {
                name: name.trim(),
                company_type: companyType,
                gstin: gstin.trim() || null,
                pan: pan.trim() || null,
                tan: tan.trim() || null,
                cin: cin.trim() || null,
                email: email.trim() || null,
                website: website.trim() || null,
                mobile: mobile.trim() || null,
                telephone: telephone.trim() || null,
                registered_address_line1: regAddress1.trim() || null,
                registered_address_line2: regAddress2.trim() || null,
                registered_city: regCity.trim() || null,
                registered_state: regState.trim() || null,
                registered_pincode: regPincode.trim() || null,
                registered_country: regCountry.trim() || null,
                warehouse_address_line1: sameAsRegistered ? regAddress1 : wareAddress1.trim() || null,
                warehouse_address_line2: sameAsRegistered ? regAddress2 : wareAddress2.trim() || null,
                warehouse_city: sameAsRegistered ? regCity : wareCity.trim() || null,
                warehouse_state: sameAsRegistered ? regState : wareState.trim() || null,
                warehouse_pincode: sameAsRegistered ? regPincode : warePincode.trim() || null,
                warehouse_country: sameAsRegistered ? regCountry : wareCountry.trim() || null,
                current_financial_year: financialYear,
                is_active: isActive
            }

            const response = await fetch(`/api/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            setSuccess("Company details updated successfully!")
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update company')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <PageLayout title="Loading Company...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout title={`Company: ${name}`}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                            <p className="text-muted-foreground">{companyType} Entity</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="text-destructive hover:bg-destructive/10" disabled={saving}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <AlertDescription>{success}</AlertDescription>
                        </div>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base text-primary font-bold uppercase tracking-wider">Legal & Contact Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-6 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Company Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Type</Label>
                                    <Select value={companyType} onValueChange={setCompanyType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                                            <SelectItem value="Partnership">Partnership</SelectItem>
                                            <SelectItem value="LLP">LLP</SelectItem>
                                            <SelectItem value="Limited">Limited</SelectItem>
                                            <SelectItem value="Pvt Ltd">Pvt Ltd</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Financial Year</Label>
                                    <Input value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">GSTIN</Label>
                                    <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GST Number" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">PAN</Label>
                                    <Input value={pan} onChange={(e) => setPan(e.target.value)} placeholder="PAN" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">CIN</Label>
                                    <Input value={cin} onChange={(e) => setCin(e.target.value)} placeholder="CIN" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Email</Label>
                                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Mobile</Label>
                                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Website</Label>
                                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-primary font-bold uppercase tracking-wider">Registered Address</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">Address Lines</Label>
                                    <Input value={regAddress1} onChange={(e) => setRegAddress1(e.target.value)} placeholder="Line 1" />
                                    <Input className="mt-2" value={regAddress2} onChange={(e) => setRegAddress2(e.target.value)} placeholder="Line 2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">City</Label>
                                        <Input value={regCity} onChange={(e) => setRegCity(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">Pincode</Label>
                                        <Input value={regPincode} onChange={(e) => setRegPincode(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">State</Label>
                                        <Input value={regState} onChange={(e) => setRegState(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">Country</Label>
                                        <Input value={regCountry} onChange={(e) => setRegCountry(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base text-primary font-bold uppercase tracking-wider">Warehouse Address</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="sameAsReg" checked={sameAsRegistered} onCheckedChange={handleSameAsRegistered} />
                                    <label htmlFor="sameAsReg" className="text-xs font-medium leading-none">Same as Reg.</label>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">Address Lines</Label>
                                    <Input value={wareAddress1} onChange={(e) => setWareAddress1(e.target.value)} disabled={sameAsRegistered} />
                                    <Input className="mt-2" value={wareAddress2} onChange={(e) => setWareAddress2(e.target.value)} disabled={sameAsRegistered} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">City</Label>
                                        <Input value={wareCity} onChange={(e) => setWareCity(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">Pincode</Label>
                                        <Input value={warePincode} onChange={(e) => setWarePincode(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">State</Label>
                                        <Input value={wareState} onChange={(e) => setWareState(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">Country</Label>
                                        <Input value={wareCountry} onChange={(e) => setWareCountry(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </PageLayout>
    )
}
