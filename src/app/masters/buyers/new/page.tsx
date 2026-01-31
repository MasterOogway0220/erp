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
import { ArrowLeft, Loader2, AlertCircle, User, Building2, Mail, Phone, Briefcase } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Customer {
    id: string
    name: string
}

export default function NewBuyerPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

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

    // Fetch customers for dropdown
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/customers')
                const result = await response.json()
                if (response.ok) {
                    setCustomers(result.data || [])
                }
            } catch (e) {
                console.error("Failed to fetch customers", e)
            }
        }
        fetchCustomers()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!name.trim()) {
            setError("Buyer name is required")
            return
        }
        if (!customerId) {
            setError("Please select a customer/company")
            return
        }

        setSaving(true)

        try {
            const payload = {
                name: name.trim(),
                customer_id: customerId,
                designation: designation.trim() || undefined,
                email: email.trim() || undefined,
                mobile: mobile.trim() || undefined,
                telephone: telephone.trim() || undefined,
                is_primary_contact: isPrimary
            }

            const response = await fetch('/api/buyers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create buyer')
            }

            router.push('/masters/buyers')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create buyer')
        } finally {
            setSaving(false)
        }
    }

    return (
        <PageLayout title="Add New Buyer">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">New Buyer Contact</h2>
                        <p className="text-muted-foreground">Map a contact person to a customer company</p>
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

                        <Card className="md:col-span-1 shadow-sm">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Contact Person
                                </CardTitle>
                                <CardDescription>Basic contact details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name *</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Designation</Label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Purchase Head" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@domain.com" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Mobile</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91..." />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Telephone</Label>
                                            <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="022-..." />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-1 shadow-sm border-primary/10">
                            <CardHeader className="bg-primary/5">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Account Linking
                                </CardTitle>
                                <CardDescription>Connect contact to customer</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Select Customer *</Label>
                                    <Select value={customerId} onValueChange={setCustomerId}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Search and select customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(customer => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground italic">
                                        Quotes and orders for this contact will be linked to this company.
                                    </p>
                                </div>

                                <div className="p-4 rounded-lg bg-yellow-50/50 border border-yellow-100 flex items-start gap-3">
                                    <Checkbox
                                        id="primary"
                                        checked={isPrimary}
                                        onCheckedChange={(checked) => setIsPrimary(!!checked)}
                                        className="mt-1"
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="primary" className="font-bold cursor-pointer">Mark as Primary Contact</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Primary contacts are displayed by default on quotations and letters.
                                            Each customer can only have one primary contact.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-dashed">
                                    <Alert className="bg-blue-50/50 border-blue-100">
                                        <AlertDescription className="text-xs text-blue-700">
                                            Performance metrics (Enquiries, Conversions) will be automatically tracked after creation.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving || !name.trim() || !customerId} className="min-w-[140px]">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
                            Create Buyer
                        </Button>
                    </div>
                </form>
            </div>
        </PageLayout>
    )
}
