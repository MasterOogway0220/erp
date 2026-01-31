"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Gavel, Loader2, AlertCircle, Edit, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

interface Term {
    id: string
    category: string
    title: string
    default_text: string
    is_active: boolean
}

export default function TermsMasterPage() {
    const [terms, setTerms] = useState<Term[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form states
    const [category, setCategory] = useState("General")
    const [title, setTitle] = useState("")
    const [defaultText, setDefaultText] = useState("")

    const fetchTerms = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/terms')
            const result = await response.json()
            if (response.ok) {
                setTerms(result.data || [])
            } else {
                setError(result.error)
            }
        } catch {
            setError("Failed to fetch terms")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTerms()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const response = await fetch('/api/terms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, title, default_text: defaultText })
            })
            if (response.ok) {
                setIsDialogOpen(false)
                setTitle("")
                setDefaultText("")
                fetchTerms()
            } else {
                const result = await response.json()
                setError(result.error)
            }
        } catch {
            setError("Failed to save term")
        } finally {
            setSaving(false)
        }
    }

    return (
        <PageLayout title="Terms & Conditions Master">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Terms & Conditions</h2>
                        <p className="text-muted-foreground">Manage standard clauses for quotations</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Term
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Term</DialogTitle>
                                <DialogDescription>Create a standard clause that can be selected in quotations.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Payment, Delivery, Warranty" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short name for the term" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Text</Label>
                                    <Textarea value={defaultText} onChange={(e) => setDefaultText(e.target.value)} placeholder="Full text of the clause..." rows={5} required />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Term
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
                            <Gavel className="h-4 w-4" /> Standard Clauses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="w-[40%]">Default Text</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {terms.map((term) => (
                                        <TableRow key={term.id}>
                                            <TableCell><Badge variant="outline">{term.category}</Badge></TableCell>
                                            <TableCell className="font-medium">{term.title}</TableCell>
                                            <TableCell><p className="text-xs line-clamp-2 text-muted-foreground">{term.default_text}</p></TableCell>
                                            <TableCell>
                                                <Badge variant={term.is_active ? "default" : "secondary"}>
                                                    {term.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} />
                                                    <Button variant="ghost" size="sm" className="text-destructive" icon={<Trash2 className="h-4 w-4" />} />
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
