"use client"

import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, History, Eye, User, Calendar, Clock, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    pending_approval: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    sent: "bg-blue-100 text-blue-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-orange-100 text-orange-800",
}

export default function QuotationHistoryPage() {
    const params = useParams()
    const router = useRouter()
    const [historyData, setHistoryData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedVersions, setSelectedVersions] = useState<string[]>([])

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/quotations/${params.id}/history`)
                const result = await response.json()
                if (response.ok) {
                    setHistoryData(result.data)
                } else {
                    setError(result.error || 'Failed to fetch revision history')
                }
            } catch (err) {
                setError('An error occurred while fetching history')
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [params.id])

    const toggleVersionSelection = (versionId: string) => {
        if (selectedVersions.includes(versionId)) {
            setSelectedVersions(selectedVersions.filter(id => id !== versionId))
        } else {
            if (selectedVersions.length >= 2) {
                // Replace the first one (optional behavior, or just block)
                setSelectedVersions([selectedVersions[1], versionId])
            } else {
                setSelectedVersions([...selectedVersions, versionId])
            }
        }
    }

    const handleCompare = () => {
        if (selectedVersions.length === 2) {
            router.push(`/sales/quotations/${selectedVersions[0]}/history/compare?v1=${selectedVersions[0]}&v2=${selectedVersions[1]}`)
        }
    }

    if (loading) {
        return (
            <PageLayout title="Revision History">
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout title="Quotation History">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Revision History</h2>
                            <p className="text-muted-foreground">
                                Timeline of all revisions for {historyData[0]?.quotation_number}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleCompare}
                        disabled={selectedVersions.length !== 2}
                        variant={selectedVersions.length === 2 ? "default" : "secondary"}
                    >
                        Compare Selected ({selectedVersions.length}/2)
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Document Versions
                        </CardTitle>
                        <CardDescription>
                            Select two versions to compare changes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Select</TableHead>
                                    <TableHead>Revision</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyData.map((rev) => (
                                    <TableRow key={rev.id} className={rev.id === params.id ? "bg-muted/50" : ""}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300"
                                                checked={selectedVersions.includes(rev.id)}
                                                onChange={() => toggleVersionSelection(rev.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">Rev {rev.revision}</span>
                                                {rev.id === params.id && (
                                                    <Badge variant="outline" className="text-[10px]">Current View</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{new Date(rev.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[rev.status]}>
                                                {rev.status.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{rev.creator?.full_name || 'System'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {rev.currency === "INR" ? "₹" : "$"}{rev.total.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/sales/quotations/${rev.id}`}>
                                                    <Eye className="h-4 w-4 mr-1" /> View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
