"use client"

import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Ruler, Import } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PipeSize {
    id: string
    material_type: string
    size_inch: string
    od_mm: number
    schedule: string
    wall_thickness_mm: number
    weight_kg_per_m: number
}

export default function PipeSizesPage() {
    const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/pipe-sizes')
            .then(res => res.json())
            .then(data => {
                setPipeSizes(data.data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    return (
        <PageLayout title="Pipe Sizes Master">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Pipe Dimensions</h2>
                        <p className="text-muted-foreground">Standard OD, Wall Thickness and Weight per meter</p>
                    </div>
                    <Link href="/masters/import">
                        <Button variant="outline">
                            <Import className="mr-2 h-4 w-4" /> Import from Excel
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-primary" /> Standards Table
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Size (Inch)</TableHead>
                                        <TableHead>OD (mm)</TableHead>
                                        <TableHead>Schedule</TableHead>
                                        <TableHead>WT (mm)</TableHead>
                                        <TableHead>Weight (kg/m)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pipeSizes.map((ps) => (
                                        <TableRow key={ps.id}>
                                            <TableCell><Badge variant="outline">{ps.material_type}</Badge></TableCell>
                                            <TableCell className="font-medium">{ps.size_inch}</TableCell>
                                            <TableCell>{ps.od_mm}</TableCell>
                                            <TableCell>{ps.schedule}</TableCell>
                                            <TableCell>{ps.wall_thickness_mm}</TableCell>
                                            <TableCell>{ps.weight_kg_per_m}</TableCell>
                                        </TableRow>
                                    ))}
                                    {pipeSizes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No records found. Please import data using the Excel tool.
                                            </TableCell>
                                        </TableRow>
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
