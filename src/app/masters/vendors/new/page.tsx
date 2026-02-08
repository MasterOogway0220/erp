"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewVendorPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [vendorCode, setVendorCode] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("India")
  const [gstNumber, setGstNumber] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [deliveryLeadTime, setDeliveryLeadTime] = useState("")
  const [vendorCategory, setVendorCategory] = useState("Manufacturer")
  const [openingBalance, setOpeningBalance] = useState("0")
  const [isApproved, setIsApproved] = useState(false)
  const [pincode, setPincode] = useState("")

  // Pincode Auto-fill Logic
  useEffect(() => {
    if (pincode.length === 6) {
      fetch(`/api/utils/pincode/${pincode}`)
        .then(res => res.json())
        .then(res => {
          if (res.data.city) {
            setCity(res.data.city)
            setState(res.data.state)
          }
        })
    }
  }, [pincode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Company name is required")
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          vendor_code: vendorCode.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          contact_person: contactPerson.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          country: country.trim() || null,
          gst_number: gstNumber.trim() || null,
          payment_terms: paymentTerms.trim() || null,
          delivery_lead_time: parseInt(deliveryLeadTime) || null,
          vendor_category: vendorCategory || null,
          opening_balance: parseFloat(openingBalance) || 0,
          is_approved: isApproved,
          rating: 0,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create vendor')
      }

      router.push('/masters/vendors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout title="New Vendor">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Add New Vendor</h2>
            <p className="text-muted-foreground">Create a new vendor record</p>
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Vendor Code</Label>
                    <Input
                      value={vendorCode}
                      onChange={(e) => setVendorCode(e.target.value)}
                      placeholder="Unique Vendor Code"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Name of primary contact"
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
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm border-orange-100 bg-orange-50/20">
              <CardHeader>
                <CardTitle className="text-base text-orange-700 font-bold uppercase tracking-tight">ISO Business & Compliance</CardTitle>
                <CardDescription>Procurement and evaluation criteria (ISO 8.4)</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Category</Label>
                  <Select value={vendorCategory} onValueChange={setVendorCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="Trader">Trader / Dealer</SelectItem>
                      <SelectItem value="Service Provider">Service Provider</SelectItem>
                      <SelectItem value="Sub-contractor">Sub-contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Payment Terms</Label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 30 Days"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Lead Time (Days)</Label>
                  <Input
                    type="number"
                    value={deliveryLeadTime}
                    onChange={(e) => setDeliveryLeadTime(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Opening Balance (₹)</Label>
                  <Input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address & Approval</CardTitle>
                <CardDescription>Location and approval status</CardDescription>
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
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Pincode"
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
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Approved Vendor</Label>
                    <p className="text-xs text-muted-foreground">
                      Mark as approved for purchase orders (ISO 8.4)
                    </p>
                  </div>
                  <Switch checked={isApproved} onCheckedChange={setIsApproved} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Vendor
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
