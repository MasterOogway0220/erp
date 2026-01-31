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
import { ArrowLeft, Loader2, AlertCircle, User, Building2, Mail, Phone, Briefcase, BarChart3, TrendingUp, Save, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

interface Customer {
    id: string
    name: string
}

export default function EditBuyerPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Data
    const [customers, setCustomers] = useState<Customer[]>([])

    // Form State
    const [name, setName] = useState("")
    const [customerId, setCustomerId] = useState("")
    const [designation, setDesignation] = useState("")
    const [email, setEmail] = useState("")
    const [mobile, setMobile] = useState("")
    const [telephone, setTelephone] = useState("")
    const [isPrimary, setIsPrimary] = useState(false)
    const [isActive, setIsActive] = useState(true)

    // Stats (ReadOnly)
    const [stats, setStats] = useState({
        enquiries: 0,
        orders: 0,
        value: 0,
        conversion: 0
    })

    useEffect(() => {
        if (id) {
            fetchData()
        }
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [custRes, buyerRes] = await Promise.all([
                fetch('/api/customers'),
                fetch(`/api/buyers/${id}`)
            ])

            const custResult = await custRes.json()
            const buyerResult = await buyerRes.json()

            if (custRes.ok) setCustomers(custResult.data || [])

            if (buyerRes.ok) {
                const data = buyerResult.data
                setName(data.name)
                setCustomerId(data.customer_id)
                setDesignation(data.designation || "")
                setEmail(data.email || "")
                setMobile(data.mobile || "")
                setTelephone(data.telephone || "")
                setIsPrimary(data.is_primary_contact)
                setIsActive(data.is_active)
                setStats({
                    enquiries: data.total_enquiries || 0,
                    orders: data.total_orders || 0,
                    value: data.total_order_value || 0,
                    conversion: data.conversion_rate || 0
                })
            } else {
                setError(buyerResult.error || "Failed to fetch buyer")
            }
        } catch (err) {
            setError("Failed to fetch data")
        } finally {
            setLoading(false)
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
                customer_id: customerId,
                designation: designation.trim() || null,
                email: email.trim() || null,
                mobile: mobile.trim() || null,
                telephone: telephone.trim() || null,
                is_primary_contact: isPrimary,
                is_active: isActive
            }

            const response = await fetch(`/api/buyers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            setSuccess("Buyer details updated successfully!")
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update buyer')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <PageLayout title="Loading Buyer...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout title={`Buyer: ${name}`}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                            <p className="text-muted-foreground">{designation || "Contact Person"} at {customers.find(c => c.id === customerId)?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Performance Stats Cards (ReadOnly) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-600 uppercase">Enquiries</span>
                                <BarChart3 className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-black mt-1 text-blue-900">{stats.enquiries}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50/50 border-green-100">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-green-600 uppercase">Orders</span>
                                <TrendingUp className="h-4 w-4 text-green-400" />
                            </div>
                            <div className="text-2xl font-black mt-1 text-green-900">{stats.orders}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50/50 border-purple-100">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-purple-600 uppercase">Order Value</span>
                                <Building2 className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="text-xl font-black mt-1 text-purple-900">₹{stats.value.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-50/50 border-orange-100">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-orange-600 uppercase">Conversion</span>
                                <Star className="h-4 w-4 text-orange-400 text-yellow-500 fill-yellow-500" />
                            </div>
                            <div className="text-2xl font-black mt-1 text-orange-900">{stats.conversion.toFixed(1)}%</div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <Card className="shadow-sm">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-base">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Designation</Label>
                                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Mobile</Label>
                                        <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Telephone</Label>
                                        <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-base text-primary font-bold">Relationship Management</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Linked Customer</Label>
                                    <Select value={customerId} onValueChange={setCustomerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="p-4 rounded-lg bg-yellow-50/50 border border-yellow-100 flex items-start gap-3">
                                    <Checkbox
                                        id="primary"
                                        checked={isPrimary}
                                        onCheckedChange={(checked) => setIsPrimary(!!checked)}
                                        className="mt-1"
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="primary" className="font-bold cursor-pointer">Primary Contact</Label>
                                        <p className="text-xs text-muted-foreground italic">
                                            The primary contact is used as the default attention person on documents.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="active" className="text-sm font-medium">Active Relationship</Label>
                                </div>

                                <p className="text-xs text-muted-foreground pt-4 border-t border-dashed">
                                    Note: Changing the customer will migrate all performance history (Enquiries/Orders) to the new customer context.
                                </p>
                            </CardContent>
                        </Card>

                    </div>
                </form>
            </div>
        </PageLayout>
    )
}
