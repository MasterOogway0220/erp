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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Company {
    id: string
    name: string
}

export default function NewEmployeePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [employeeCode, setEmployeeCode] = useState("")
    const [email, setEmail] = useState("")
    const [mobile, setMobile] = useState("")
    const [telephone, setTelephone] = useState("")
    const [department, setDepartment] = useState<string>("Sales")
    const [designation, setDesignation] = useState("")
    const [companyId, setCompanyId] = useState<string>("")
    const [reportingManagerId, setReportingManagerId] = useState<string>("")
    const [dateOfJoining, setDateOfJoining] = useState("")

    // Data
    const [companies, setCompanies] = useState<Company[]>([])
    const [managers, setManagers] = useState<any[]>([])

    // Fetch dependencies
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [compRes, empRes] = await Promise.all([
                    fetch('/api/companies'),
                    fetch('/api/employees')
                ])
                const compResult = await compRes.json()
                const empResult = await empRes.json()

                if (compRes.ok) setCompanies(compResult.data || [])
                if (empRes.ok) setManagers(empResult.data || [])
            } catch (e) {
                console.error("Failed to fetch dependencies", e)
            }
        }
        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!firstName.trim()) {
            setError("First name is required")
            return
        }
        if (!email.trim()) {
            setError("Email is required")
            return
        }

        setSaving(true)

        try {
            const payload = {
                first_name: firstName.trim(),
                last_name: lastName.trim() || undefined,
                employee_code: employeeCode.trim() || undefined,
                email: email.trim(),
                mobile: mobile.trim() || undefined,
                telephone: telephone.trim() || undefined,
                department,
                designation: designation.trim() || undefined,
                company_id: companyId || undefined,
                reporting_manager_id: reportingManagerId || undefined,
                date_of_joining: dateOfJoining || undefined,
            }

            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create employee')
            }

            router.push('/masters/employees')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create employee')
        } finally {
            setSaving(false)
        }
    }

    return (
        <PageLayout title="New Employee">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add New Employee</h2>
                        <p className="text-muted-foreground">Create a new staff profile</p>
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

                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-base">Personal Details</CardTitle>
                                <CardDescription>Basic employee information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>First Name *</Label>
                                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name</Label>
                                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Employee Code</Label>
                                    <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="EMP001" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile</Label>
                                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telephone</Label>
                                    <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Line number" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-base">Job Role</CardTitle>
                                <CardDescription>Position and access details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sales">Sales</SelectItem>
                                            <SelectItem value="Purchase">Purchase</SelectItem>
                                            <SelectItem value="Quality">Quality Control</SelectItem>
                                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                                            <SelectItem value="Accounts">Accounts</SelectItem>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Management">Management</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Designation</Label>
                                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Sales Manager" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reporting Manager</Label>
                                    <Select value={reportingManagerId} onValueChange={setReportingManagerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {managers.map(mgr => (
                                                <SelectItem key={mgr.id} value={mgr.id}>
                                                    {mgr.first_name} {mgr.last_name} ({mgr.department})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Joining</Label>
                                    <Input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Select value={companyId} onValueChange={setCompanyId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(company => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Which legal entity does this employee belong to?
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving || !firstName.trim() || !email.trim()}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Employee
                        </Button>
                    </div>
                </form>
            </div>
        </PageLayout>
    )
}
