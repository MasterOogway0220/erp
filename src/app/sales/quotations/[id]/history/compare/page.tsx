"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, ArrowLeftRight, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

function CompareContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const v1Id = searchParams.get('v1')
    const v2Id = searchParams.get('v2')

    const [v1, setV1] = useState<any>(null)
    const [v2, setV2] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            if (!v1Id || !v2Id) {
                setError("Two versions are required for comparison")
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const [res1, res2] = await Promise.all([
                    fetch(`/api/quotations/${v1Id}`),
                    fetch(`/api/quotations/${v2Id}`)
                ])

                const [data1, data2] = await Promise.all([
                    res1.json(),
                    res2.json()
                ])

                if (res1.ok && res2.ok) {
                    setV1(data1.data)
                    setV2(data2.data)
                } else {
                    setError("Failed to fetch version data")
                }
            } catch (err) {
                setError("An error occurred during comparison")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [v1Id, v2Id])

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (error || !v1 || !v2) {
        return (
            <div className="flex flex-col items-center gap-4 p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    // sort so older version is left (v1) usually, but we respect URL order
    // Maybe we should enforce older on left?
    // Let's check dates
    const isV1Older = new Date(v1.created_at) < new Date(v2.created_at)
    const left = isV1Older ? v1 : v2
    const right = isV1Older ? v2 : v1

    const renderDiffParams = (label: string, val1: any, val2: any, formatter: (v: any) => string = String) => {
        const v1Str = formatter(val1)
        const v2Str = formatter(val2)
        const isDiff = v1Str !== v2Str
        return (
            <div className={`grid grid-cols-2 gap-4 py-2 border-b last:border-0 ${isDiff ? "bg-yellow-50" : ""}`}>
                <div className="text-sm">
                    <span className="text-muted-foreground block text-xs">{label}</span>
                    <span className={isDiff ? "line-through text-red-400" : ""}>{v1Str || "-"}</span>
                </div>
                <div className="text-sm">
                    <span className="text-muted-foreground block text-xs">{label}</span>
                    <span className={isDiff ? "font-bold text-green-600" : ""}>{v2Str || "-"}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Version Comparison</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        Comparing <span className="font-bold">Rev {left.revision}</span> <ArrowRight className="h-3 w-3" /> <span className="font-bold">Rev {right.revision}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-gray-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Revision {left.revision}</CardTitle>
                        <p className="text-xs text-muted-foreground">{new Date(left.created_at).toLocaleString()}</p>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Revision {right.revision}</CardTitle>
                        <p className="text-xs text-muted-foreground">{new Date(right.created_at).toLocaleString()}</p>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Metadata Difference</CardTitle></CardHeader>
                <CardContent>
                    {renderDiffParams("Total Amount", left.total_amount, right.total_amount, (v: any) => `${left.currency} ${v?.toLocaleString()}`)}
                    {renderDiffParams("Valid Until", left.valid_until, right.valid_until, (v: any) => v ? new Date(v).toLocaleDateString() : 'N/A')}
                    {renderDiffParams("Status", left.status, right.status)}
                    {renderDiffParams("Packing Charges", left.packing_charges, right.packing_charges)}
                    {renderDiffParams("Freight Charges", left.freight_charges, right.freight_charges)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Line Items (Count: {left.items.length} vs {right.items.length})</CardTitle></CardHeader>
                <CardContent>
                    {/* Naive item comparison by index for now */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            {left.items.map((item: any, i: number) => (
                                <div key={item.id} className="p-2 border rounded mb-2 text-sm bg-gray-50">
                                    <div className="font-bold">{i + 1}. {item.product?.name || item.product_name}</div>
                                    <div>{item.description}</div>
                                    <div className="flex justify-between mt-1 text-xs">
                                        <span>Qty: {item.quantity}</span>
                                        <span>{left.currency} {item.unit_price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                            {right.items.map((item: any, i: number) => (
                                <div key={item.id} className="p-2 border rounded mb-2 text-sm bg-blue-50">
                                    <div className="font-bold">{i + 1}. {item.product?.name || item.product_name}</div>
                                    <div>{item.description}</div>
                                    <div className="flex justify-between mt-1 text-xs">
                                        <span>Qty: {item.quantity}</span>
                                        <span className={left.items[i]?.unit_price !== item.unit_price ? "font-bold text-red-600" : ""}>
                                            {right.currency} {item.unit_price}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ComparePage() {
    return (
        <PageLayout title="Compare Versions">
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <CompareContent />
            </Suspense>
        </PageLayout>
    )
}
