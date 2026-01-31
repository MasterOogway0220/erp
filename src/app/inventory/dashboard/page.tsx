"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Package, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react"

export default function InventoryDashboardPage() {
    const [inventory, setInventory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        form: "",
        type: "",
        heatNumber: "",
        qcStatus: "",
        location: "",
    })

    // Summary stats
    const [stats, setStats] = useState({
        totalValue: 0,
        underQC: 0,
        accepted: 0,
        rejected: 0,
    })

    useEffect(() => {
        fetchInventory()
    }, [filters])

    const fetchInventory = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filters.form) params.append("form", filters.form)
            if (filters.type) params.append("type", filters.type)
            if (filters.heatNumber) params.append("heat_number", filters.heatNumber)
            if (filters.qcStatus) params.append("qc_status", filters.qcStatus)
            if (filters.location) params.append("location", filters.location)

            const res = await fetch(`/api/inventory?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setInventory(data.data)
                calculateStats(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch inventory")
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (items: any[]) => {
        const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0)
        const underQC = items.filter((i) => i.qc_status === "UNDER_INSPECTION").length
        const accepted = items.filter((i) => i.qc_status === "ACCEPTED").length
        const rejected = items.filter((i) => i.qc_status === "REJECTED").length

        setStats({ totalValue, underQC, accepted, rejected })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return "bg-green-50 border-green-200"
            case "UNDER_INSPECTION":
                return "bg-yellow-50 border-yellow-200"
            case "REJECTED":
                return "bg-red-50 border-red-200"
            default:
                return "bg-gray-50 border-gray-200"
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted
                    </Badge>
                )
            case "UNDER_INSPECTION":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Under QC
                    </Badge>
                )
            case "REJECTED":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <PageLayout title="Inventory Dashboard">
            <div className="mb-4">
                <p className="text-sm text-gray-600">Real-time inventory visibility with QC status tracking (Point 11)</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{inventory.length} items</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Under QC Inspection</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.underQC}</div>
                        <p className="text-xs text-muted-foreground">Pending inspection</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accepted & Ready</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                        <p className="text-xs text-muted-foreground">Ready to dispatch</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected Items</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Requires action</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        <div>
                            <Label>Form</Label>
                            <Select value={filters.form} onValueChange={(v) => setFilters({ ...filters, form: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Forms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Forms</SelectItem>
                                    <SelectItem value="CS">CS (Carbon Steel)</SelectItem>
                                    <SelectItem value="SS">SS (Stainless Steel)</SelectItem>
                                    <SelectItem value="AS">AS (Alloy Steel)</SelectItem>
                                    <SelectItem value="DS">DS (Duplex Steel)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Type</Label>
                            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Types</SelectItem>
                                    <SelectItem value="SMLS">SMLS (Seamless)</SelectItem>
                                    <SelectItem value="WELDED">Welded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Heat Number</Label>
                            <Input
                                placeholder="Search heat number..."
                                value={filters.heatNumber}
                                onChange={(e) => setFilters({ ...filters, heatNumber: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>QC Status</Label>
                            <Select value={filters.qcStatus} onValueChange={(v) => setFilters({ ...filters, qcStatus: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                    <SelectItem value="UNDER_INSPECTION">Under Inspection</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Location</Label>
                            <Input
                                placeholder="Rack/Location..."
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Items</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Form</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Specification</TableHead>
                                        <TableHead>Dimension</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Ends</TableHead>
                                        <TableHead>Length</TableHead>
                                        <TableHead>Heat No.</TableHead>
                                        <TableHead>Make</TableHead>
                                        <TableHead>Qty (Mtr)</TableHead>
                                        <TableHead>Pieces</TableHead>
                                        <TableHead>MTC No.</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>QC Status</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={15} className="text-center text-gray-500">
                                                No inventory items found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inventory.map((item) => (
                                            <TableRow key={item.id} className={`border-l-4 ${getStatusColor(item.qc_status)}`}>
                                                <TableCell className="font-medium">{item.form}</TableCell>
                                                <TableCell>{item.type}</TableCell>
                                                <TableCell className="text-xs">{item.specification}</TableCell>
                                                <TableCell>{item.dimension}</TableCell>
                                                <TableCell>{item.size}</TableCell>
                                                <TableCell>{item.ends}</TableCell>
                                                <TableCell>{item.length}</TableCell>
                                                <TableCell className="font-mono text-xs font-bold">{item.heat_number}</TableCell>
                                                <TableCell>{item.make}</TableCell>
                                                <TableCell className="text-right">{item.quantity_mtr}</TableCell>
                                                <TableCell className="text-right">{item.pieces}</TableCell>
                                                <TableCell className="text-xs">{item.mtc_number}</TableCell>
                                                <TableCell className="font-medium">{item.location}</TableCell>
                                                <TableCell>{getStatusBadge(item.qc_status)}</TableCell>
                                                <TableCell className="text-xs text-gray-600">{item.notes}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PageLayout>
    )
}
