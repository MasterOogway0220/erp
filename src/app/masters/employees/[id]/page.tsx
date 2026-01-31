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
import { ArrowLeft, Loader2, AlertCircle, Save, User, Briefcase, Mail, Phone } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function EmployeeDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [companies, setCompanies] = useState<any[]>([])

    // Form State
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [employeeCode, setEmployeeCode] = useState("")
    const [email, setEmail] = useState("")
    const [mobile, setMobile] = useState("")
    const [department, setDepartment] = useState("")
    const [designation, setDesignation] = useState("")
    const [companyId, setCompanyId] = useState("")
    const [reportingManagerId, setReportingManagerId] = useState("")
    const [dateOfJoining, setDateOfJoining] = useState("")
    const [isActive, setIsActive] = useState(true)

    const [employees, setEmployees] = useState<any[]>([])

    useEffect(() => {
        if (id) {
            fetchEmployee()
            fetchCompanies()
            fetchEmployees()
        }
    }, [id])

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies')
            const result = await res.json()
            if (res.ok) setCompanies(result.data || [])
        } catch (err) {
            console.error("Failed to fetch companies")
        }
    }

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees')
            const result = await res.json()
            if (res.ok) setEmployees(result.data || [])
        } catch (err) {
            console.error("Failed to fetch employees")
        }
    }

    const fetchEmployee = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/employees/${id}`)
            const result = await res.json()
            if (res.ok) {
                const data = result.data
                setFirstName(data.first_name)
                setLastName(data.last_name || "")
                setEmployeeCode(data.employee_code || "")
                setEmail(data.email)
                setMobile(data.mobile || "")
                setDepartment(data.department || "")
                setDesignation(data.designation || "")
                setCompanyId(data.company_id || "")
                setReportingManagerId(data.reporting_manager_id || "")
                setDateOfJoining(data.date_of_joining || "")
                setIsActive(data.is_active)
            } else {
                setError(result.error || "Failed to fetch employee")
            }
        } catch (err) {
            setError("Failed to fetch employee details")
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
                first_name: firstName.trim(),
                last_name: lastName.trim() || null,
                employee_code: employeeCode.trim() || null,
                email: email.trim(),
                mobile: mobile.trim() || null,
                department: department.trim() || null,
                designation: designation.trim() || null,
                company_id: companyId || null,
                reporting_manager_id: reportingManagerId || null,
                date_of_joining: dateOfJoining || null,
                is_active: isActive
            }

            const response = await fetch(`/api/employees/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            setSuccess("Employee details updated successfully!")
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update employee')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <PageLayout title="Loading Employee...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout title={`Employee: ${firstName} ${lastName}`}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{firstName} {lastName}</h2>
                            <p className="text-muted-foreground">{designation} in {department || 'General'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            <User className="h-4 w-4" />
                            <AlertDescription>{success}</AlertDescription>
                        </div>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-primary font-bold uppercase tracking-wider">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">First Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <input className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Last Name</Label>
                                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Employee Code</Label>
                                    <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="EMP001" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Mobile Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-primary font-bold uppercase tracking-wider">Work Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Department</Label>
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Management">Management</SelectItem>
                                            <SelectItem value="Sales">Sales</SelectItem>
                                            <SelectItem value="Purchase">Purchase</SelectItem>
                                            <SelectItem value="Quality Control">Quality Control</SelectItem>
                                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                                            <SelectItem value="Finance">Finance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Designation</Label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Sales Manager" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Reporting Manager</Label>
                                    <Select value={reportingManagerId} onValueChange={setReportingManagerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {employees.filter(e => e.id !== id).map(mgr => (
                                                <SelectItem key={mgr.id} value={mgr.id}>
                                                    {mgr.first_name} {mgr.last_name} ({mgr.department})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Date of Joining</Label>
                                    <Input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Primary Company</Label>
                                    <Select value={companyId} onValueChange={setCompanyId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="active" className="text-sm font-medium">Active Employee</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </PageLayout>
    )
}
