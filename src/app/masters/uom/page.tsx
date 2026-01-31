"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Scale, Loader2, AlertCircle, Edit, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

interface UOM {
    id: string
    code: string
    name: string
    description: string | null
    is_active: boolean
}

export default function UOMMasterPage() {
    const [uoms, setUoms] = useState<UOM[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form states
    const [code, setCode] = useState("")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    const fetchUoms = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/uom')
            const result = await response.json()
            if (response.ok) {
                setUoms(result.data || [])
            } else {
                setError(result.error)
            }
        } catch {
            setError("Failed to fetch units of measure")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUoms()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const response = await fetch('/api/uom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, name, description })
            })
            if (response.ok) {
                setIsDialogOpen(false)
                setCode("")
                setName("")
                setDescription("")
                fetchUoms()
            } else {
                const result = await response.json()
                setError(result.error)
            }
        } catch {
            setError("Failed to save unit of measure")
        } finally {
            setSaving(false)
        }
    }

    return (
        <PageLayout title="Unit of Measure Master">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Units of Measure</h2>
                        <p className="text-muted-foreground">Manage measurement types for products</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add UOM
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New UOM</DialogTitle>
                                <DialogDescription>Create a measurement unit like KGS, MTR, PCS, etc.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Unit Code (SKU Suffix)</Label>
                                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. KGS, MTR, PCS" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kilograms, Meters, Pieces" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Usage details..." />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save UOM
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Scale className="h-4 w-4" /> Configured Units
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {uoms.map((uom) => (
                                        <TableRow key={uom.id}>
                                            <TableCell className="font-mono font-bold">{uom.code}</TableCell>
                                            <TableCell className="font-medium">{uom.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{uom.description || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={uom.is_active ? "default" : "secondary"}>
                                                    {uom.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
