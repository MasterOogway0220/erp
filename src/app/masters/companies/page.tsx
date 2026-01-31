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
import { Plus, Users, Mail, Phone, MapPin, Loader2, AlertCircle, Building2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Company {
    id: string
    name: string
    company_type: string
    gstin: string | null
    email: string | null
    mobile: string | null
    registered_city: string | null
    registered_state: string | null
    is_active: boolean
    created_at: string
}

export default function CompaniesPage() {
    const router = useRouter()
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const fetchCompanies = async () => {
        setLoading(true)
        setError("")
        try {
            const response = await fetch('/api/companies')
            const result = await response.json()
            if (response.ok) {
                setCompanies(result.data || [])
            } else {
                setError(result.error || 'Failed to fetch companies')
            }
        } catch {
            setError('Failed to fetch companies')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    return (
        <PageLayout title="Companies">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Company Management</h2>
                        <p className="text-muted-foreground">Manage multi-entity company details</p>
                    </div>
                    <Link href="/masters/companies/new">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Company
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
                        <CardTitle className="text-base">All Companies ({companies.length})</CardTitle>
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
                                        <TableHead>Company Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                                        <TableHead className="hidden lg:table-cell">Location</TableHead>
                                        <TableHead className="hidden xl:table-cell">GSTIN</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No companies found. Add your first company.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        companies.map((company) => (
                                            <TableRow
                                                key={company.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/masters/companies/${company.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                            <Building2 className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium">{company.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{company.company_type.replace('_', ' ')}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="space-y-1">
                                                        {company.email && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Mail className="h-3 w-3" />
                                                                {company.email}
                                                            </div>
                                                        )}
                                                        {company.mobile && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {company.mobile}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {(company.registered_city || company.registered_state) && (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                                            {[company.registered_city, company.registered_state].filter(Boolean).join(", ")}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell font-mono text-xs">
                                                    {company.gstin || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={company.is_active ? "default" : "secondary"}>
                                                        {company.is_active ? "Active" : "Inactive"}
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
