"use client"

import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, ShieldCheck, Loader2, Save, Plus, Globe, Landmark } from "lucide-react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SettingsPage() {
    const [companies, setCompanies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/companies')
            const data = await res.json()
            setCompanies(data.data || [])
        } catch (err) {
            console.error('Error fetching settings:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    if (loading) {
        return (
            <PageLayout title="Settings">
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageLayout>
        )
    }

    const primaryCompany = companies[0] || {}

    return (
        <PageLayout title="Global Settings">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
                        <p className="text-muted-foreground">Manage organization profile and ISO compliance standards</p>
                    </div>
                    <Button disabled={saving} onClick={() => { }}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Changes
                    </Button>
                </div>

                <Tabs defaultValue="company" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                        <TabsTrigger value="company" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Company Profile
                        </TabsTrigger>
                        <TabsTrigger value="addresses" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Multi-GSTIN Addresses
                        </TabsTrigger>
                        <TabsTrigger value="compliance" className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> ISO Standards
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="company" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase text-primary">Identity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Organization Legal Name</Label>
                                        <Input defaultValue={primaryCompany.name} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Company Code</Label>
                                            <Input defaultValue={primaryCompany.code} placeholder="e.g. NPS" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Standard Currency</Label>
                                            <Input defaultValue="INR" disabled />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase text-primary">Fiscal Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Current Financial Year</Label>
                                        <Input defaultValue={primaryCompany.current_financial_year} placeholder="e.g. 2024-2025" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>FY Start Month</Label>
                                            <Input defaultValue="April" disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>FY End Month</Label>
                                            <Input defaultValue="March" disabled />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="addresses">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold uppercase text-primary">Taxation Points (Multi-GSTIN)</CardTitle>
                                    <CardDescription>Manage Registered, Branch, and Warehouse locations for GST compliance</CardDescription>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" /> Add Location
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Location / Address</TableHead>
                                            <TableHead>State</TableHead>
                                            <TableHead>GSTIN</TableHead>
                                            <TableHead>Default</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><Badge>Registered</Badge></TableCell>
                                            <TableCell>
                                                <div className="font-medium">Mumbai Head Office</div>
                                                <div className="text-xs text-muted-foreground">123 Business Tower, BKC</div>
                                            </TableCell>
                                            <TableCell>Maharashtra</TableCell>
                                            <TableCell className="font-mono text-xs">27AAACN1234F1Z1</TableCell>
                                            <TableCell><Badge variant="outline" className="bg-green-50 text-green-600">YES</Badge></TableCell>
                                            <TableCell className="text-right"><Button variant="ghost" size="sm">Edit</Button></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Badge variant="secondary">Warehouse</Badge></TableCell>
                                            <TableCell>
                                                <div className="font-medium">Silvassa Plant</div>
                                                <div className="text-xs text-muted-foreground">Plot 45, Industrial Estate</div>
                                            </TableCell>
                                            <TableCell>Dadra & NH</TableCell>
                                            <TableCell className="font-mono text-xs">26AAACN1234F1Z2</TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell className="text-right"><Button variant="ghost" size="sm">Edit</Button></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="compliance">
                        <Card className="border-blue-100 bg-blue-50/20">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-lg">ISO 9001:2018 Policy Alignment</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border shadow-sm">
                                    <Landmark className="h-10 w-10 text-primary p-2 bg-primary/10 rounded" />
                                    <div>
                                        <h4 className="font-bold">Section 7.5.3: Control of Documented Information</h4>
                                        <p className="text-sm text-muted-foreground">All transactional changes are logged with full JSON state diffs in the Audit Log Viewer.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border shadow-sm">
                                    <Globe className="h-10 w-10 text-primary p-2 bg-primary/10 rounded" />
                                    <div>
                                        <h4 className="font-bold">Section 8.2.1: Customer Communication</h4>
                                        <p className="text-sm text-muted-foreground">System enforces unique identification (Material Code Prefix) and revision control for all quotations.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageLayout>
    )
}
