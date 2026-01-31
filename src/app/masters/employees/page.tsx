"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, User, Mail, Phone, Loader2, AlertCircle, Briefcase } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Employee {
    id: string
    first_name: string
    last_name: string | null
    email: string
    mobile: string | null
    department: string | null
    designation: string | null
    company: {
        name: string
    } | null
    is_active: boolean
}

export default function EmployeesPage() {
    const router = useRouter()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const fetchEmployees = async () => {
        setLoading(true)
        setError("")
        try {
            const response = await fetch('/api/employees')
            const result = await response.json()
            if (response.ok) {
                setEmployees(result.data || [])
            } else {
                setError(result.error || 'Failed to fetch employees')
            }
        } catch {
            setError('Failed to fetch employees')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    return (
        <PageLayout title="Employees">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
                        <p className="text-muted-foreground">Manage internal staff and permissions</p>
                    </div>
                    <Link href="/masters/employees/new">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Employee
                        </Button>
                    </Link>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">All Employees ({employees.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                                        <TableHead className="hidden lg:table-cell">Company</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No employees found. Add your first employee.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employees.map((employee) => (
                                            <TableRow
                                                key={employee.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/masters/employees/${employee.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                                                            <div className="text-xs text-muted-foreground">{employee.designation}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                                                        <span>{employee.department || "-"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            {employee.email}
                                                        </div>
                                                        {employee.mobile && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {employee.mobile}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {employee.company?.name || "All Companies"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                                                        {employee.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
