"use client"

import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ClipboardList, Import } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProductSpec {
    id: string
    product_name: string
    material: string
    additional_spec: string
    ends: string
    length_range: string
}

export default function ProductSpecsPage() {
    const [specs, setSpecs] = useState<ProductSpec[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/product-specs')
            .then(res => res.json())
            .then(data => {
                setSpecs(data.data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    return (
        <PageLayout title="Product Specifications Master">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Material Specifications</h2>
                        <p className="text-muted-foreground">Standard grades, lengths and end types for products</p>
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
                            <ClipboardList className="h-4 w-4 text-primary" /> Specifications List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Material / Grade</TableHead>
                                        <TableHead>Ends</TableHead>
                                        <TableHead>Length Range</TableHead>
                                        <TableHead>Additional Specs</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {specs.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.product_name}</TableCell>
                                            <TableCell>{s.material}</TableCell>
                                            <TableCell><Badge variant="outline">{s.ends}</Badge></TableCell>
                                            <TableCell>{s.length_range}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{s.additional_spec}</TableCell>
                                        </TableRow>
                                    ))}
                                    {specs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No specifications found. Use the import tool to seed data.
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
