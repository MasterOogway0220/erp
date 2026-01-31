"use client"

import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, History, TrendingUp, Download, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"

export default function PricingInsightsPage() {
    const [customers, setCustomers] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
    const [selectedProduct, setSelectedProduct] = useState<string>("all")
    const [pricingHistory, setPricingHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [dataLoading, setDataLoading] = useState(true)

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [custRes, prodRes] = await Promise.all([
                    fetch('/api/customers'),
                    fetch('/api/products')
                ])
                const custData = await custRes.json()
                const prodData = await prodRes.json()

                if (custRes.ok) setCustomers(custData.data || [])
                if (prodRes.ok) setProducts(prodData.data || [])
            } catch (err) {
                console.error("Failed to fetch masters", err)
            } finally {
                setDataLoading(false)
            }
        }
        fetchMasters()
    }, [])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            let url = '/api/products/pricing-history?'
            if (selectedCustomer !== "all") url += `customer_id=${selectedCustomer}&`
            if (selectedProduct !== "all") url += `product_id=${selectedProduct}&`

            const res = await fetch(url)
            const data = await res.json()
            if (res.ok) setPricingHistory(data.data || [])
        } catch (err) {
            console.error("Failed to fetch history", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [selectedCustomer, selectedProduct])

    const stats = {
        avgPrice: pricingHistory.length > 0
            ? pricingHistory.reduce((sum, h) => sum + h.quoted_price, 0) / pricingHistory.length
            : 0,
        maxPrice: Math.max(...pricingHistory.map(h => h.quoted_price), 0),
        minPrice: pricingHistory.length > 0 ? Math.min(...pricingHistory.map(h => h.quoted_price)) : 0,
        totalQuotes: pricingHistory.length
    }

    return (
        <PageLayout title="Pricing Insights">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Customers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                {customers.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Product</Label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Products" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Products</SelectItem>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                        <Button variant="outline" className="ml-auto" onClick={() => {
                            const csv = [
                                ["Date", "Customer", "Product", "Quoted Price", "Quantity", "Quotation #", "Status"].join(","),
                                ...pricingHistory.map(h => [
                                    format(new Date(h.quoted_date), 'yyyy-MM-dd'),
                                    h.customer?.name,
                                    h.product?.name,
                                    h.quoted_price,
                                    h.quotation?.items?.find((i: any) => i.product_id === h.product_id)?.quantity || "-",
                                    h.quotation?.quotation_number,
                                    h.quotation?.status
                                ].join(","))
                            ].join("\n")

                            const blob = new Blob([csv], { type: 'text/csv' })
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `pricing_history_${new Date().toISOString().split('T')[0]}.csv`
                            a.click()
                        }}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium">Avg Quoted Price</p>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-bold">₹{stats.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium">Max Price</p>
                                <Badge variant="outline" className="text-green-600 border-green-200">Highest</Badge>
                            </div>
                            <div className="text-2xl font-bold">₹{stats.maxPrice.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium">Min Price</p>
                                <Badge variant="outline" className="text-blue-600 border-blue-200">Lowest</Badge>
                            </div>
                            <div className="text-2xl font-bold">₹{stats.minPrice.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium">Total Quotes</p>
                                <History className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-bold">{stats.totalQuotes}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Historical Transactions
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </CardTitle>
                        <CardDescription>
                            Detailed view of all previous quotations for the selected filters
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quotation #</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pricingHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No transaction history found for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pricingHistory.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell>{format(new Date(h.quoted_date), 'dd MMM yyyy')}</TableCell>
                                            <TableCell className="font-medium">{h.customer?.name}</TableCell>
                                            <TableCell>{h.product?.name}</TableCell>
                                            <TableCell className="font-mono">{h.quotation?.quotation_number}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">₹{h.quoted_price.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">
                                                    {h.quotation?.status?.replace(/_/g, " ")}
                                                </Badge>
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
