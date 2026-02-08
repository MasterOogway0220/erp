"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle, Trash2, Plus, MapPin, Save, Landmark, History, CreditCard, FileText, Eye } from "lucide-react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DispatchAddress {
  id?: string
  address_line1: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: string
  is_primary: boolean
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  gst_number: string | null
  currency: string
  credit_limit: number
  is_active: boolean
  opening_balance_date: string | null
  current_outstanding: number
  pincode: string | null
  material_code_prefix: string | null
  payment_terms: string | null
  delivery_terms: string | null
  dispatch_addresses?: DispatchAddress[]
}

interface LedgerEntry {
  id: string
  date: string
  description: string
  reference: string
  type: 'invoice' | 'payment' | 'balance'
  debit: number
  credit: number
  balance: number
  mode?: string
  status?: string
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [availableTerms, setAvailableTerms] = useState<any[]>([])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [creditLimit, setCreditLimit] = useState("")
  const [openingBalance, setOpeningBalance] = useState("")
  const [openingBalanceDate, setOpeningBalanceDate] = useState("")
  const [pincode, setPincode] = useState("")
  const [materialCodePrefix, setMaterialCodePrefix] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [deliveryTerms, setDeliveryTerms] = useState("")
  const [defaultTermsId, setDefaultTermsId] = useState("")
  const [dispatchAddresses, setDispatchAddresses] = useState<DispatchAddress[]>([])

  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)

  useEffect(() => {
    fetchCustomer()
    fetchTerms()
  }, [id])

  const fetchTerms = async () => {
    try {
      const response = await fetch('/api/terms')
      const result = await response.json()
      if (response.ok) setAvailableTerms(result.data || [])
    } catch {
      console.error("Failed to fetch terms")
    }
  }

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${id}`)
      const result = await response.json()
      if (response.ok) {
        const c = result.data
        setCustomer(c)
        setName(c.name || "")
        setEmail(c.email || "")
        setPhone(c.phone || "")
        setAddress(c.address || "")
        setCity(c.city || "")
        setState(c.state || "")
        setCountry(c.country || "")
        setGstNumber(c.gst_number || "")
        setCurrency(c.currency || "INR")
        setCreditLimit(c.credit_limit?.toString() || "0")
        setOpeningBalance(c.opening_balance?.toString() || "0")
        setOpeningBalanceDate(c.opening_balance_date || "")
        setPincode(c.pincode || "")
        setMaterialCodePrefix(c.material_code_prefix || "")
        setPaymentTerms(c.payment_terms || "")
        setDeliveryTerms(c.delivery_terms || "")
        setDefaultTermsId(c.default_terms_id || "none")
        setDispatchAddresses(c.dispatch_addresses || [])
      } else {
        setError(result.error || 'Customer not found')
      }
    } catch {
      setError('Failed to fetch customer')
    } finally {
      setLoading(false)
    }
  }

  const fetchLedger = async () => {
    try {
      setLedgerLoading(true)
      const response = await fetch(`/api/customers/${id}/ledger`)
      const result = await response.json()
      if (response.ok) {
        setLedger(result.data.ledger || [])
      }
    } catch (err) {
      console.error("Failed to fetch ledger", err)
    } finally {
      setLedgerLoading(false)
    }
  }

  const handleAddAddress = () => {
    setDispatchAddresses([...dispatchAddresses, {
      address_line1: "",
      city: "",
      state: "",
      is_primary: dispatchAddresses.length === 0
    }])
  }

  const handleUpdateAddress = (index: number, field: keyof DispatchAddress, value: any) => {
    const newAddresses = [...dispatchAddresses]
    if (field === 'is_primary' && value === true) {
      newAddresses.forEach((addr, i) => addr.is_primary = i === index)
    } else {
      (newAddresses[index] as any)[field] = value
    }
    setDispatchAddresses(newAddresses)
  }

  const handleRemoveAddress = (index: number) => {
    setDispatchAddresses(dispatchAddresses.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!name.trim()) {
      setError("Company name is required")
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/customers/${id}`, {
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
          currency,
          credit_limit: parseFloat(creditLimit) || 0,
          opening_balance: parseFloat(openingBalance) || 0,
          opening_balance_date: openingBalanceDate || null,
          pincode: pincode.trim() || null,
          material_code_prefix: materialCodePrefix.trim() || null,
          payment_terms: paymentTerms.trim() || null,
          delivery_terms: deliveryTerms.trim() || null,
          default_terms_id: defaultTermsId === "none" ? null : defaultTermsId,
          dispatch_addresses: dispatchAddresses
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update customer')
      }

      setSuccess("Customer updated successfully!")
      setCustomer(result.data)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete customer')
      }

      router.push('/masters/customers')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer')
      setShowDeleteDialog(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Customer">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!customer) {
    return (
      <PageLayout title="Customer">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Customer not found</AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`Customer - ${customer.name}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
              <p className="text-muted-foreground">Manage customer profile and addresses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={customer.is_active ? "default" : "secondary"}>
              {customer.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="profile">Customer Profile</TabsTrigger>
            <TabsTrigger value="ledger" onClick={() => fetchLedger()}>Financial Ledger</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Company Name *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">GST Number</Label>
                        <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="AED">AED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Default T&C Set</Label>
                      <Select value={defaultTermsId} onValueChange={setDefaultTermsId}>
                        <SelectTrigger><SelectValue placeholder="Select Default T&C" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Default T&C</SelectItem>
                          {availableTerms.map(term => (
                            <SelectItem key={term.id} value={term.id}>{term.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Registered Address & Financials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Registered Address</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">City</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Pincode</Label>
                        <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">State</Label>
                        <Input value={state} onChange={(e) => setState(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Country</Label>
                        <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                          <Landmark className="h-3 w-3" /> Opening Balance
                        </Label>
                        <Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Balance As On</Label>
                        <Input type="date" value={openingBalanceDate} onChange={(e) => setOpeningBalanceDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Credit Limit</Label>
                      <Input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex justify-between items-center mt-4">
                      <span className="text-xs font-bold uppercase text-muted-foreground">Current Outstanding</span>
                      <span className="text-lg font-bold text-primary">₹{(customer.current_outstanding || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 shadow-sm border-blue-100 bg-blue-50/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Business & Compliance</CardTitle>
                    <CardDescription>Material tracking and payment settings</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-6 pt-2">
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
              </div>


              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Dispatch Addresses</CardTitle>
                    <CardDescription>Additional shipping locations for this customer</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddAddress}>
                    <Plus className="h-4 w-4 mr-2" /> Add Address
                  </Button>
                </CardHeader>
                <CardContent>
                  {dispatchAddresses.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed">
                      <MapPin className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                      <p className="text-sm text-muted-foreground">No additional dispatch addresses defined.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address Line</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Pincode</TableHead>
                          <TableHead className="w-24">Primary</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dispatchAddresses.map((addr, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Input
                                value={addr.address_line1}
                                onChange={(e) => handleUpdateAddress(idx, 'address_line1', e.target.value)}
                                placeholder="Street address"
                              />
                            </TableCell>
                            <TableCell><Input value={addr.city} onChange={(e) => handleUpdateAddress(idx, 'city', e.target.value)} /></TableCell>
                            <TableCell><Input value={addr.state} onChange={(e) => handleUpdateAddress(idx, 'state', e.target.value)} /></TableCell>
                            <TableCell><Input value={addr.pincode} onChange={(e) => handleUpdateAddress(idx, 'pincode', e.target.value)} /></TableCell>
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                checked={addr.is_primary}
                                onChange={(e) => handleUpdateAddress(idx, 'is_primary', e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleRemoveAddress(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between gap-3 mt-6 pb-12">
                <Button
                  type="button"
                  variant="destructive"
                  className="opacity-50 hover:opacity-100"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={saving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Customer
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="ledger">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-bold uppercase tracking-wider text-primary">Customer Ledger</CardTitle>
                  <CardDescription>Chronological history of invoices and payments</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Total Outstanding</p>
                  <p className="text-xl font-bold text-primary">₹{(customer.current_outstanding || 0).toLocaleString()}</p>
                </div>
              </CardHeader>
              <CardContent>
                {ledgerLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Debit (₹)</TableHead>
                        <TableHead className="text-right">Credit (₹)</TableHead>
                        <TableHead className="text-right">Balance (₹)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                            No transactions found for this customer.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ledger.map((entry) => (
                          <TableRow key={entry.id} className={entry.type === 'balance' ? "bg-muted/30 font-medium" : ""}>
                            <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {entry.type === 'invoice' && <FileText className="h-3 w-3 text-blue-500" />}
                                {entry.type === 'payment' && <CreditCard className="h-3 w-3 text-green-500" />}
                                {entry.type === 'balance' && <History className="h-3 w-3 text-muted-foreground" />}
                                {entry.description}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{entry.reference}</TableCell>
                            <TableCell className="text-right">{entry.debit > 0 ? entry.debit.toLocaleString() : "-"}</TableCell>
                            <TableCell className="text-right">{entry.credit > 0 ? entry.credit.toLocaleString() : "-"}</TableCell>
                            <TableCell className="text-right font-bold">₹{entry.balance.toLocaleString()}</TableCell>
                            <TableCell>
                              {entry.type !== 'balance' && (
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/finance/${entry.type === 'invoice' ? 'invoices' : 'payments'}/${entry.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{customer.name}"?
                This action cannot be undone if there are no related transactions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div >
    </PageLayout >
  )
}
