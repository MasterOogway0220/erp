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
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewCompanyPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

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

    const [financialYear, setFinancialYear] = useState("2025-2026")

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

        if (!name.trim()) {
            setError("Company name is required")
            return
        }

        setSaving(true)

        try {
            const payload = {
                name: name.trim(),
                company_type: companyType,
                gstin: gstin.trim() || undefined,
                pan: pan.trim() || undefined,
                tan: tan.trim() || undefined,
                cin: cin.trim() || undefined,
                email: email.trim() || undefined,
                website: website.trim() || undefined,
                mobile: mobile.trim() || undefined,
                telephone: telephone.trim() || undefined,
                registered_address_line1: regAddress1.trim() || undefined,
                registered_address_line2: regAddress2.trim() || undefined,
                registered_city: regCity.trim() || undefined,
                registered_state: regState.trim() || undefined,
                registered_pincode: regPincode.trim() || undefined,
                registered_country: regCountry.trim() || undefined,
                warehouse_address_line1: sameAsRegistered ? regAddress1 : wareAddress1 || undefined,
                warehouse_address_line2: sameAsRegistered ? regAddress2 : wareAddress2 || undefined,
                warehouse_city: sameAsRegistered ? regCity : wareCity || undefined,
                warehouse_state: sameAsRegistered ? regState : wareState || undefined,
                warehouse_pincode: sameAsRegistered ? regPincode : warePincode || undefined,
                warehouse_country: sameAsRegistered ? regCountry : wareCountry || undefined,
                current_financial_year: financialYear,
            }

            const response = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create company')
            }

            router.push('/masters/companies')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create company')
        } finally {
            setSaving(false)
        }
    }

    return (
        <PageLayout title="New Company">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add New Company</h2>
                        <p className="text-muted-foreground">Create a new company entity record</p>
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

                        {/* Basic Details */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">Company Details</CardTitle>
                                <CardDescription>Legal and contact information</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Company Name *</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter company name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company Type</Label>
                                    <Select value={companyType} onValueChange={setCompanyType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                                            <SelectItem value="Partnership">Partnership</SelectItem>
                                            <SelectItem value="LLP">LLP</SelectItem>
                                            <SelectItem value="Limited">Limited</SelectItem>
                                            <SelectItem value="Pvt Ltd">Pvt Ltd</SelectItem>
                                            <SelectItem value="HUF">HUF</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile</Label>
                                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telephone</Label>
                                    <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="022..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Financial Year</Label>
                                    <Input value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} placeholder="2025-2026" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Legal Identifiers */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">Legal Registration</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>GSTIN</Label>
                                    <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GST Number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>PAN</Label>
                                    <Input value={pan} onChange={(e) => setPan(e.target.value)} placeholder="PAN Number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>TAN</Label>
                                    <Input value={tan} onChange={(e) => setTan(e.target.value)} placeholder="TAN Number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>CIN</Label>
                                    <Input value={cin} onChange={(e) => setCin(e.target.value)} placeholder="CIN Number" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Registered Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Registered Address</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Line 1</Label>
                                    <Input value={regAddress1} onChange={(e) => setRegAddress1(e.target.value)} placeholder="Block/Building" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Line 2</Label>
                                    <Input value={regAddress2} onChange={(e) => setRegAddress2(e.target.value)} placeholder="Street/Area" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input value={regCity} onChange={(e) => setRegCity(e.target.value)} placeholder="City" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pincode</Label>
                                        <Input value={regPincode} onChange={(e) => setRegPincode(e.target.value)} placeholder="Pincode" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input value={regState} onChange={(e) => setRegState(e.target.value)} placeholder="State" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input value={regCountry} onChange={(e) => setRegCountry(e.target.value)} placeholder="Country" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Warehouse Address */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base">Warehouse Address</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="sameAsReg"
                                        checked={sameAsRegistered}
                                        onCheckedChange={handleSameAsRegistered}
                                    />
                                    <label
                                        htmlFor="sameAsReg"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Same as Registered
                                    </label>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Line 1</Label>
                                    <Input value={wareAddress1} onChange={(e) => setWareAddress1(e.target.value)} disabled={sameAsRegistered} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Line 2</Label>
                                    <Input value={wareAddress2} onChange={(e) => setWareAddress2(e.target.value)} disabled={sameAsRegistered} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input value={wareCity} onChange={(e) => setWareCity(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pincode</Label>
                                        <Input value={warePincode} onChange={(e) => setWarePincode(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input value={wareState} onChange={(e) => setWareState(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input value={wareCountry} onChange={(e) => setWareCountry(e.target.value)} disabled={sameAsRegistered} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving || !name.trim()}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Company
                        </Button>
                    </div>
                </form>
            </div>
        </PageLayout>
    )
}
