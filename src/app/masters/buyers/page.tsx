"use client"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, User, Mail, Phone, Loader2, AlertCircle, Building2, Star, TrendingUp, BarChart3 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Buyer {
    id: string
    name: string
    designation: string | null
    email: string | null
    mobile: string | null
    customer: {
        id: string
        name: string
    } | null
    is_primary_contact: boolean
    is_active: boolean
    total_enquiries: number
    total_orders: number
    conversion_rate: number
}

export default function BuyersPage() {
    const router = useRouter()
    const [buyers, setBuyers] = useState<Buyer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const fetchBuyers = async () => {
        setLoading(true)
        setError("")
        try {
            const response = await fetch('/api/buyers')
            const result = await response.json()
            if (response.ok) {
                setBuyers(result.data || [])
            } else {
                setError(result.error || 'Failed to fetch buyers')
            }
        } catch {
            setError('Failed to fetch buyers')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBuyers()
    }, [])

    return (
        <PageLayout title="Buyer Master">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Buyer Management</h2>
                        <p className="text-muted-foreground">Monitor buyer performance and conversion rates</p>
                    </div>
                    <Link href="/masters/buyers/new">
                        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Buyer
                        </Button>
                    </Link>
                </div>

                {/* Performance Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-background border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Avg. Conversion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                <span className="text-2xl font-bold">
                                    {buyers.length > 0
                                        ? (buyers.reduce((acc, b) => acc + (Number(b.conversion_rate) || 0), 0) / buyers.length).toFixed(1)
                                        : "0.0"}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-background border-green-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Active Buyers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-green-500" />
                                <span className="text-2xl font-bold">{buyers.filter(b => b.is_active).length}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-background border-purple-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Enquiries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-purple-500" />
                                <span className="text-2xl font-bold">{buyers.reduce((acc, b) => acc + (b.total_enquiries || 0), 0)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base">All Buyers ({buyers.length})</CardTitle>
                        <CardDescription>Click on a buyer to view detailed history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="w-[300px]">Buyer Name</TableHead>
                                        <TableHead>Customer / Company</TableHead>
                                        <TableHead className="text-center">Enq / Orders</TableHead>
                                        <TableHead className="text-center">Conversion</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buyers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                                No buyers found. Map your customer contacts here.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        buyers.map((buyer) => (
                                            <TableRow
                                                key={buyer.id}
                                                className="cursor-pointer hover:bg-muted/40 transition-colors"
                                                onClick={() => router.push(`/masters/buyers/${buyer.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10 shadow-sm">
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            {buyer.is_primary_contact && (
                                                                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-sm border border-white">
                                                                    <Star className="h-2.5 w-2.5 text-white fill-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm flex items-center gap-1.5">
                                                                {buyer.name}
                                                                {buyer.is_primary_contact && (
                                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 font-bold border-none">PRIMARY</Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{buyer.designation || "Contact Person"}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm font-medium">{buyer.customer?.name || "-"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="text-sm font-mono">
                                                        <span className="text-blue-600 font-bold">{buyer.total_enquiries || 0}</span>
                                                        <span className="mx-1.5 text-muted-foreground">/</span>
                                                        <span className="text-green-600 font-bold">{buyer.total_orders || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-sm font-black ${Number(buyer.conversion_rate) > 50 ? 'text-green-600' : Number(buyer.conversion_rate) > 20 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                                            {Number(buyer.conversion_rate || 0).toFixed(1)}%
                                                        </span>
                                                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${Number(buyer.conversion_rate) > 50 ? 'bg-green-500' : Number(buyer.conversion_rate) > 20 ? 'bg-blue-500' : 'bg-muted-foreground/30'}`}
                                                                style={{ width: `${Math.min(Number(buyer.conversion_rate || 0), 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge className={buyer.is_active ? "bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none text-[10px] font-bold" : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-none shadow-none text-[10px] font-bold"}>
                                                        {buyer.is_active ? "ACTIVE" : "INACTIVE"}
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
