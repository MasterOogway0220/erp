"use client"

import { useEffect, useState } from 'react'
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    FileText,
    Download,
    Eye,
    History,
    ShieldCheck,
    Calendar,
    Factory
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

export default function MTCRepositoryPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [mtcs, setMtcs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mocking fetch - in reality, would call an API
        setTimeout(() => {
            setMtcs([
                { id: '1', heat_number: 'HT-2024-001', issuer: 'JSW Steel', issue_date: '2024-01-15', file_url: '#', status: 'VERIFIED' },
                { id: '2', heat_number: 'HT-2024-002', issuer: 'Tata Steel', issue_date: '2024-01-20', file_url: '#', status: 'VERIFIED' },
                { id: '3', heat_number: 'HT-2024-003', issuer: 'Essar', issue_date: '2024-02-01', file_url: '#', status: 'PENDING' },
            ])
            setLoading(false)
        }, 500)
    }, [])

    const filteredMtcs = mtcs.filter(m =>
        m.heat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.issuer.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <PageLayout title="MTC Repository">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Mill Test Certificate Repository</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            ISO 7.5.3: Mandatory Document Control & Traceability
                        </p>
                    </div>
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Upload New MTC
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{mtcs.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">Verified Heat Nos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-800">{mtcs.filter(m => m.status === 'VERIFIED').length}</div>
                        </CardContent>
                    </Card>
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Heat Number or Manufacturer..."
                                className="pl-10 h-12 text-lg shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <History className="h-4 w-4" /> Certification History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Heat Number</TableHead>
                                    <TableHead>Manufacturer</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMtcs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No certificates found for "{searchTerm}"
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMtcs.map((mtc) => (
                                        <TableRow key={mtc.id}>
                                            <TableCell className="font-mono font-bold">{mtc.heat_number}</TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                <Factory className="h-3 w-3 text-muted-foreground" />
                                                {mtc.issuer}
                                            </TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {mtc.issue_date}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={mtc.status === 'VERIFIED' ? 'default' : 'secondary'}
                                                    className={mtc.status === 'VERIFIED' ? 'bg-green-600' : ''}
                                                >
                                                    {mtc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" title="View Document">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Download PDF">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
