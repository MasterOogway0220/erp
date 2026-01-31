"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore, Payment } from "@/lib/store"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, IndianRupee, CreditCard, Banknote } from "lucide-react"
import { useState } from "react"

const paymentModeLabels: Record<string, string> = {
  cash: "Cash",
  cheque: "Cheque",
  neft: "NEFT",
  rtgs: "RTGS",
  upi: "UPI",
}

export default function PaymentsPage() {
  const { payments, invoices, addPayment, updateInvoice, generateNumber } = useStore()
  const [open, setOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  
  const pendingInvoices = invoices.filter(i => i.status !== "paid")
  
  const handleSubmit = () => {
    if (!selectedInvoice || !amount || !paymentMode || !paymentDate) return
    
    const invoice = invoices.find(i => i.id === selectedInvoice)
    if (!invoice) return
    
    const paymentAmount = parseFloat(amount)
    
    const newPayment: Payment = {
      id: Math.random().toString(36).substring(2, 15),
      receiptNumber: generateNumber("RCP"),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      amount: paymentAmount,
      paymentMode: paymentMode as Payment["paymentMode"],
      referenceNumber,
      paymentDate,
      createdAt: new Date().toISOString().split("T")[0],
    }
    
    addPayment(newPayment)
    
    const newPaidAmount = invoice.paidAmount + paymentAmount
    const newStatus = newPaidAmount >= invoice.total ? "paid" : "partial_paid"
    updateInvoice(invoice.id, { paidAmount: newPaidAmount, status: newStatus })
    
    setOpen(false)
    setSelectedInvoice("")
    setAmount("")
    setPaymentMode("")
    setReferenceNumber("")
    setPaymentDate("")
  }
  
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)
  
  return (
    <PageLayout title="Payments">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payment Receipts</h2>
            <p className="text-muted-foreground">Track customer payments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Invoice</Label>
                  <Select value={selectedInvoice} onValueChange={(val) => {
                    setSelectedInvoice(val)
                    const invoice = invoices.find(i => i.id === val)
                    if (invoice) setAmount((invoice.total - invoice.paidAmount).toString())
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingInvoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} - {invoice.customerName} (Balance: ₹{(invoice.total - invoice.paidAmount).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="rtgs">RTGS</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Transaction / Cheque number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Record Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{(totalCollected / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">Total Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{payments.length}</p>
                  <p className="text-xs text-muted-foreground">Total Receipts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2">
                  <Banknote className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono font-medium">
                        {payment.receiptNumber}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.invoiceNumber}
                      </TableCell>
                      <TableCell>{payment.customerName}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        ₹{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {paymentModeLabels[payment.paymentMode]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.referenceNumber || "-"}
                      </TableCell>
                      <TableCell>{payment.paymentDate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
