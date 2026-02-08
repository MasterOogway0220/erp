"use client"

import { useEffect, useState } from 'react'
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Save,
    Loader2,
    ClipboardCheck,
    FlaskConical,
    Ruler,
    Eye,
    Microscope
} from "lucide-react"
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"

interface TestStandard {
    id: string
    test_name: string
    test_standard: string
    acceptance_criteria: string
}

interface TestResult {
    test_standard_id: string
    test_name: string
    specification: string
    actual_value: string
    result: 'pass' | 'fail'
}

export default function SmartInspectionPage() {
    const { id } = useParams()
    const router = useRouter()
    const [item, setItem] = useState<any>(null)
    const [standards, setStandards] = useState<TestStandard[]>([])
    const [results, setResults] = useState<Record<string, TestResult>>({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [overallResult, setOverallResult] = useState<'accepted' | 'rejected'>('accepted')

    useEffect(() => {
        async function fetchData() {
            try {
                const [itemRes, standardsRes] = await Promise.all([
                    fetch(`/api/inventory?id=${id}`), // Assuming this works for single item
                    fetch('/api/qc/tests')
                ])

                const itemData = await itemRes.json()
                const standardsData = await standardsRes.json()

                if (itemData.success) {
                    // Flatten if it's an array
                    const stockItem = Array.isArray(itemData.data) ? itemData.data.find((i: any) => i.id === id) : itemData.data
                    setItem(stockItem)
                }
                if (standardsData.success) {
                    setStandards(standardsData.data)
                    // Initialize results
                    const initialResults: Record<string, TestResult> = {}
                    standardsData.data.forEach((s: TestStandard) => {
                        initialResults[s.id] = {
                            test_standard_id: s.id,
                            test_name: s.test_name,
                            specification: s.acceptance_criteria || '',
                            actual_value: '',
                            result: 'pass'
                        }
                    })
                    setResults(initialResults)
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleValueChange = (standardId: string, value: string) => {
        setResults(prev => ({
            ...prev,
            [standardId]: { ...prev[standardId], actual_value: value }
        }))
    }

    const handleResultChange = (standardId: string, result: 'pass' | 'fail') => {
        setResults(prev => ({
            ...prev,
            [standardId]: { ...prev[standardId], result }
        }))
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const payload = {
                grn_id: item.grn_id,
                inventory_id: item.id,
                result: overallResult,
                test_results: Object.values(results).filter(r => r.actual_value),
                remarks: `Detailed inspection via Smart Workdesk. Overall: ${overallResult.toUpperCase()}`
            }

            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Inspection recorded successfully')
                router.push(`/inventory/stock/${id}`)
            } else {
                toast.error(data.error || 'Failed to save inspection')
            }
        } catch (error) {
            toast.error('An error occurred while saving')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <PageLayout title="Smart Inspection">Loading...</PageLayout>

    return (
        <PageLayout title="Smart Inspection Workdesk">
            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/inventory/stock/${id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Item Details
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold">{item?.product?.name}</h2>
                            <p className="text-sm text-muted-foreground font-mono">Heat: {item?.heat_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select
                            value={overallResult}
                            onValueChange={(val: any) => setOverallResult(val)}
                        >
                            <SelectTrigger className={`w-36 font-bold uppercase ${overallResult === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Inspection
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5 text-primary" />
                                ISO 9001:2018 Mandatory Test Parameters
                            </CardTitle>
                            <CardDescription>Enter actual values observed during testing</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6 w-[250px]">Test Type</TableHead>
                                        <TableHead>Required Spec</TableHead>
                                        <TableHead className="w-[180px]">Actual Value</TableHead>
                                        <TableHead className="pr-6 text-center">Result</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {standards.map((s) => (
                                        <TableRow key={s.id} className="hover:bg-muted/5">
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-bold text-sm">{s.test_name}</div>
                                                {s.test_standard && <div className="text-[10px] text-muted-foreground uppercase">{s.test_standard}</div>}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">
                                                {s.acceptance_criteria || 'Per Product Std'}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    placeholder="Value"
                                                    className="h-8 text-sm"
                                                    value={results[s.id]?.actual_value || ''}
                                                    onChange={(e) => handleValueChange(s.id, e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="pr-6">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant={results[s.id]?.result === 'pass' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={`h-7 px-2 text-[10px] ${results[s.id]?.result === 'pass' ? 'bg-green-600' : ''}`}
                                                        onClick={() => handleResultChange(s.id, 'pass')}
                                                    >
                                                        PASS
                                                    </Button>
                                                    <Button
                                                        variant={results[s.id]?.result === 'fail' ? 'destructive' : 'outline'}
                                                        size="sm"
                                                        className="h-7 px-2 text-[10px]"
                                                        onClick={() => handleResultChange(s.id, 'fail')}
                                                    >
                                                        FAIL
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4" /> Chemical Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {['C', 'Mn', 'P', 'S', 'Si', 'Cr', 'Ni', 'Mo'].map(elem => (
                                        <div key={elem} className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold uppercase text-muted-foreground">{elem} %</label>
                                            <Input className="h-7 text-xs" placeholder="0.000" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Microscope className="h-4 w-4" /> MTC Extraction
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-3 rounded-md border border-dashed text-center">
                                    <p className="text-[10px] text-muted-foreground mb-2">Drag Mill Test Certificate here</p>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px]">Browse PDF</Button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-muted-foreground">MTC Status:</span>
                                        <Badge variant="outline" className="text-[9px] h-4">Not Uploaded</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-muted-foreground">Calibration:</span>
                                        <span className="font-bold text-green-600">Valid</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
