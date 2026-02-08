"use client"

import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Loader2, Calendar, User, Database, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [tableName, setTableName] = useState("all")
    const [search, setSearch] = useState("")

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const url = tableName !== 'all'
                ? `/api/admin/audit-logs?table_name=${tableName}`
                : '/api/admin/audit-logs'

            const res = await fetch(url)
            const data = await res.json()
            setLogs(data.data?.logs || [])
        } catch (err) {
            console.error('Error fetching logs:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [tableName])

    const filteredLogs = logs.filter(l =>
        l.record_id.toLowerCase().includes(search.toLowerCase()) ||
        l.table_name.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
    )

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">CREATE</Badge>
            case 'UPDATE': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">UPDATE</Badge>
            case 'DELETE': return <Badge variant="destructive">DELETE</Badge>
            case 'STATUS_CHANGE': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">STATUS</Badge>
            default: return <Badge variant="outline">{action}</Badge>
        }
    }

    return (
        <PageLayout title="Audit Logs - ISO Traceability">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
                        <p className="text-muted-foreground">ISO 9.1.1 Traceability & System Activity</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-base font-medium">System Mutations</CardTitle>
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search Record ID..."
                                        className="pl-8"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <Select value={tableName} onValueChange={setTableName}>
                                    <SelectTrigger className="w-full md:w-48">
                                        <Database className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="All Tables" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tables</SelectItem>
                                        <SelectItem value="quotations">Quotations</SelectItem>
                                        <SelectItem value="sales_orders">Sales Orders</SelectItem>
                                        <SelectItem value="purchase_orders">Purchase Orders</SelectItem>
                                        <SelectItem value="invoices">Invoices</SelectItem>
                                        <SelectItem value="inventory">Inventory</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Table</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Record ID</TableHead>
                                        <TableHead className="text-right">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                                No logs found matching your criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-xs font-mono">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 opacity-50" />
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                            {log.user?.full_name?.substring(0, 2).toUpperCase() || "SY"}
                                                        </div>
                                                        <span className="text-sm">{log.user?.full_name || "System Agent"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">{log.table_name}</Badge>
                                                </TableCell>
                                                <TableCell>{getActionBadge(log.action)}</TableCell>
                                                <TableCell className="font-mono text-[10px]">{log.record_id}</TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Audit Detail: {log.action} on {log.table_name}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Old Data</h4>
                                                                    <pre className="p-3 bg-red-50 text-red-900 text-[10px] rounded border border-red-100 overflow-auto max-h-96">
                                                                        {JSON.stringify(log.old_data, null, 2) || "NULL"}
                                                                    </pre>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">New Data</h4>
                                                                    <pre className="p-3 bg-green-50 text-green-900 text-[10px] rounded border border-green-100 overflow-auto max-h-96">
                                                                        {JSON.stringify(log.new_data, null, 2) || "NULL"}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
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

import { Button } from "@/components/ui/button"
