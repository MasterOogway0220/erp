"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function NewCustomerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("India")
  const [gstNumber, setGstNumber] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [creditLimit, setCreditLimit] = useState("")
  const [openingBalance, setOpeningBalance] = useState("")
  const [openingBalanceDate, setOpeningBalanceDate] = useState("")
  const [pincode, setPincode] = useState("")
  const [materialCodePrefix, setMaterialCodePrefix] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [deliveryTerms, setDeliveryTerms] = useState("")

  // Dispatch Address State
  const [sameAsRegistered, setSameAsRegistered] = useState(false)
  const [dispatchAddress1, setDispatchAddress1] = useState("")
  const [dispatchAddress2, setDispatchAddress2] = useState("")
  const [dispatchCity, setDispatchCity] = useState("")
  const [dispatchState, setDispatchState] = useState("")
  const [dispatchPincode, setDispatchPincode] = useState("")

  const handleSameAsRegistered = (checked: boolean) => {
    setSameAsRegistered(checked)
    if (checked) {
      setDispatchAddress1(address)
      setDispatchCity(city)
      setDispatchState(state)
      setDispatchPincode(pincode)
    }
  }

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

  useEffect(() => {
    if (dispatchPincode.length === 6) {
      fetch(`/api/utils/pincode/${dispatchPincode}`)
        .then(res => res.json())
        .then(res => {
          if (res.data.city) {
            setDispatchCity(res.data.city)
            setDispatchState(res.data.state)
          }
        })
    }
  }, [dispatchPincode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Company name is required")
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
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
          currency,
          credit_limit: parseFloat(creditLimit) || 0,
          opening_balance: parseFloat(openingBalance) || 0,
          opening_balance_date: openingBalanceDate || null,
          pincode: pincode.trim() || null,
          material_code_prefix: materialCodePrefix.trim() || null,
          payment_terms: paymentTerms.trim() || null,
          delivery_terms: deliveryTerms.trim() || null,
          dispatch_addresses: dispatchAddress1 ? [{
            address_line1: dispatchAddress1,
            address_line2: dispatchAddress2 || undefined,
            city: dispatchCity || undefined,
            state: dispatchState || undefined,
            pincode: dispatchPincode || undefined,
            is_primary: true
          }] : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create customer')
      }

      router.push('/masters/customers')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout title="New Customer">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Add New Customer</h2>
            <p className="text-muted-foreground">Create a new customer record</p>
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
                <CardDescription>Customer company details</CardDescription>
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
                    placeholder="email@company.com"
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="GSTIN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address & Credit</CardTitle>
                <CardDescription>Location and financial details</CardDescription>
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
                    <Label>Pincode</Label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Pincode"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Credit Limit</Label>
                    <Input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Opening Balance</Label>
                      <Input
                        type="number"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Balance As On</Label>
                      <Input
                        type="date"
                        value={openingBalanceDate}
                        onChange={(e) => setOpeningBalanceDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card className="md:col-span-2 shadow-sm border-blue-100 bg-blue-50/20">
              <CardHeader>
                <CardTitle className="text-base">Business & Compliance</CardTitle>
                <CardDescription>Material tracking and payment settings</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Material Code Prefix</Label>
                  <Input
                    value={materialCodePrefix}
                    onChange={(e) => setMaterialCodePrefix(e.target.value)}
                    placeholder="e.g. REL-S"
                  />
                  <p className="text-[10px] text-muted-foreground italic">ISO 7.5.3: Unique identification prefix</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Payment Terms</Label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 30 Days Net"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Delivery Terms</Label>
                  <Input
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    placeholder="e.g. Ex-Works Mumbai"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Primary Dispatch Address</CardTitle>
                    <CardDescription>Default shipping location for goods</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sameAsRegistered"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={sameAsRegistered}
                      onChange={(e) => handleSameAsRegistered(e.target.checked)}
                    />
                    <Label htmlFor="sameAsRegistered" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Same as Registered Address
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={dispatchAddress1}
                    onChange={(e) => setDispatchAddress1(e.target.value)}
                    placeholder="Street, Building, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={dispatchAddress2}
                    onChange={(e) => setDispatchAddress2(e.target.value)}
                    placeholder="Area, Landmark, etc."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={dispatchCity}
                      onChange={(e) => setDispatchCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={dispatchState}
                      onChange={(e) => setDispatchState(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      value={dispatchPincode}
                      onChange={(e) => setDispatchPincode(e.target.value)}
                      placeholder="Pincode"
                    />
                  </div>
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
              Create Customer
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
