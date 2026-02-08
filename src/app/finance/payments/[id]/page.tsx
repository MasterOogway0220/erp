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
import { ArrowLeft, FileText, User, Calendar, DollarSign, CreditCard, Banknote, History } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PaymentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [receipt, setReceipt] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const fetchReceipt = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/payments/${params.id}`)
            const data = await res.json()
            if (res.ok) {
                setReceipt(data.data)
            } else {
                setError(data.error || "Failed to load receipt details")
            }
        } catch (err) {
            setError("An error occurred while fetching data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReceipt()
    }, [params.id])

    if (loading) {
        return (
            <PageLayout title="Loading Receipt">
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground mt-4">Fetching receipt details...</p>
                </div>
            </PageLayout>
        )
    }

    if (error || !receipt) {
        return (
            <PageLayout title="Receipt Not Found">
                <div className="flex flex-col items-center justify-center py-16">
                    {error && (
                        <Alert variant="destructive" className="max-w-md mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <p className="text-muted-foreground mb-4">Payment receipt not found</p>
                    <Button variant="outline" onClick={() => router.push("/finance/payments")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Payments
                    </Button>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout title={`Receipt ${receipt.receipt_number}`}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/finance/payments")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold tracking-tight">{receipt.receipt_number}</h2>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Payment Received</Badge>
                            </div>
                            <p className="text-muted-foreground">Recorded on {new Date(receipt.receipt_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                        Print Receipt
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <User className="h-4 w-4" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">{receipt.customer?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">ID: {receipt.customer?.id.split('-')[0]}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="h-4 w-4" /> Amount
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-bold text-2xl text-primary">
                                ₹{receipt.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 uppercase">{receipt.payment_mode}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <History className="h-4 w-4" /> Reference
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-mono text-sm">{receipt.reference_number || "N/A"}</p>
                            <p className="text-xs text-muted-foreground mt-1">Ref No.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Banknote className="h-4 w-4" /> Bank Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{receipt.bank_details || "No bank details provided"}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Allocation Breakdown</CardTitle>
                                <CardDescription>How this payment was applied to invoices</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Allocated</p>
                                <p className="font-bold">₹{receipt.allocations?.reduce((sum: number, a: any) => sum + Number(a.amount), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice Number</TableHead>
                                    <TableHead>Invoice Date</TableHead>
                                    <TableHead className="text-right">Invoice Total</TableHead>
                                    <TableHead className="text-right">Allocated Amount</TableHead>
                                    <TableHead className="text-center w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receipt.allocations?.map((alloc: any) => (
                                    <TableRow key={alloc.id}>
                                        <TableCell className="font-medium">{alloc.invoice?.invoice_number}</TableCell>
                                        <TableCell>{new Date(alloc.invoice?.invoice_date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">₹{alloc.invoice?.total_amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600">₹{alloc.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/finance/invoices/${alloc.invoice?.id}`}>View</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!receipt.allocations || receipt.allocations.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                            This payment has not been allocated to any specific invoices.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {receipt.remarks && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-muted-foreground">Remarks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{receipt.remarks}</p>
                        </CardContent>
                    </Card>
                )}

                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">System Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1">
                        <p>Created At: {new Date(receipt.created_at).toLocaleString()}</p>
                        <p>Created By: {receipt.created_by?.split('-')[0]}...</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
