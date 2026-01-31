"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Factory, Mail, Phone, MapPin, Star, Loader2, AlertCircle, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Vendor {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  gst_number: string | null
  is_approved: boolean
  rating: number
  is_active: boolean
  created_at: string
}

export default function VendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchVendors = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch('/api/vendors')
      const result = await response.json()
      if (response.ok) {
        setVendors(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch vendors')
      }
    } catch {
      setError('Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  return (
    <PageLayout title="Vendors">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Vendors</h2>
            <p className="text-muted-foreground">Manage approved vendor list (ISO 8.4)</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => window.location.href = '/api/export?type=vendors'} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/masters/vendors/new" className="w-full sm:w-auto">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Vendors ({vendors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">GST Number</TableHead>
                    <TableHead className="hidden xl:table-cell">Rating</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No vendors found. Add your first vendor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors.map((vendor) => (
                      <TableRow
                        key={vendor.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/masters/vendors/${vendor.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <Factory className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{vendor.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            {vendor.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {vendor.email}
                              </div>
                            )}
                            {vendor.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {vendor.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {(vendor.city || vendor.state) && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs hidden lg:table-cell">
                          {vendor.gst_number || "-"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {(vendor.rating || 0) > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-sm">{(vendor.rating || 0).toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not rated</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={vendor.is_approved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {vendor.is_approved ? "Approved" : "Pending"}
                          </Badge>
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
