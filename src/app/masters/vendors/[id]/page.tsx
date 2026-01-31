"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle, Trash2, Star } from "lucide-react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"

interface Vendor {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  gst_number: string | null
  is_approved: boolean
  rating: number
  is_active: boolean
  created_at: string
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [isApproved, setIsApproved] = useState(false)
  const [rating, setRating] = useState("")

  useEffect(() => {
    fetchVendor()
  }, [id])

  const fetchVendor = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/vendors/${id}`)
      const result = await response.json()
      if (response.ok) {
        const v = result.data
        setVendor(v)
        setName(v.name || "")
        setEmail(v.email || "")
        setPhone(v.phone || "")
        setAddress(v.address || "")
        setCity(v.city || "")
        setState(v.state || "")
        setCountry(v.country || "")
        setGstNumber(v.gst_number || "")
        setIsApproved(v.is_approved || false)
        setRating(v.rating?.toString() || "0")
      } else {
        setError(result.error || 'Vendor not found')
      }
    } catch {
      setError('Failed to fetch vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!name.trim()) {
      setError("Company name is required")
      return
    }

    setSaving(true)
    
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          country: country.trim() || null,
          gst_number: gstNumber.trim() || null,
          is_approved: isApproved,
          rating: parseFloat(rating) || 0,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update vendor')
      }

      router.push('/masters/vendors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete vendor')
      }

      router.push('/masters/vendors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vendor')
      setShowDeleteDialog(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Vendor">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!vendor) {
    return (
      <PageLayout title="Vendor">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vendor not found</AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`Vendor - ${vendor.name}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Edit Vendor</h2>
              <p className="text-muted-foreground">Update vendor information</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={vendor.is_active ? "default" : "secondary"}>
              {vendor.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge className={vendor.is_approved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {vendor.is_approved ? "Approved" : "Pending Approval"}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
                <CardDescription>Vendor company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@vendor.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-XX-XXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="GSTIN"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address & Rating</CardTitle>
                <CardDescription>Location and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Star className="h-4 w-4" /> Rating (0-5)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Approved Vendor</Label>
                    <p className="text-xs text-muted-foreground">
                      Required for purchase orders (ISO 8.4)
                    </p>
                  </div>
                  <Switch checked={isApproved} onCheckedChange={setIsApproved} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between gap-3 mt-6">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              disabled={saving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </form>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Vendor</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{vendor.name}"? 
                If this vendor has related purchase orders, it will be deactivated instead.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
