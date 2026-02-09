"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle, AlertTriangle, ClipboardCheck, Beaker, Clock, FileCheck } from "lucide-react"
import { useState } from "react"

const inspectionColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  hold: "bg-orange-100 text-orange-800",
}

interface InspectionFormData {
  visualInspection: "pass" | "fail" | ""
  dimensionCheck: "pass" | "fail" | ""
  chemicalMechanicalCheck: "pass" | "fail" | "" // New granular check
  mtcVerification: "pass" | "fail" | ""
  remarks: string
  mtcNumber: string
}

export default function InspectionsPage() {
  const { inventory, grns, updateInventoryItem, addInspection, generateNumber, addNCR } = useStore()
  const [inspectOpen, setInspectOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<typeof inventory[0] | null>(null)
  const [formData, setFormData] = useState<InspectionFormData>({
    visualInspection: "",
    dimensionCheck: "",
    chemicalMechanicalCheck: "",
    mtcVerification: "",
    remarks: "",
    mtcNumber: "",
  })

  const pendingItems = inventory.filter((i: any) => i.inspectionStatus === 'pending')
  const acceptedItems = inventory.filter((i: any) => i.inspectionStatus === 'accepted')
  const rejectedItems = inventory.filter((i: any) => i.inspectionStatus === 'rejected')
  const holdItems = inventory.filter((i: any) => i.inspectionStatus === 'hold')

  const handleStartInspection = (item: typeof inventory[0]) => {
    setSelectedItem(item)
    setFormData({
      visualInspection: "",
      dimensionCheck: "",
      chemicalMechanicalCheck: "",
      mtcVerification: "",
      remarks: "",
      mtcNumber: item.mtcNumber || "",
    })
    setInspectOpen(true)
  }

  const handleInspectionSubmit = (result: 'accepted' | 'rejected' | 'hold') => {
    if (!selectedItem) return

    const allPass = formData.visualInspection === 'pass' &&
      formData.dimensionCheck === 'pass' &&
      formData.chemicalMechanicalCheck === 'pass' &&
      formData.mtcVerification === 'pass'

    updateInventoryItem(selectedItem.id, {
      inspectionStatus: result,
      mtcNumber: formData.mtcNumber,
      availableQuantity: result === 'accepted' ? selectedItem.quantity - selectedItem.reservedQuantity : 0,
    })

    addInspection({
      id: Math.random().toString(36).substring(2, 15),
      grnId: grns.find((g: any) => g.grnNumber === selectedItem.grnNumber)?.id || '',
      grnNumber: selectedItem.grnNumber || '',
      productName: selectedItem.productName,
      heatNumber: selectedItem.heatNumber,
      checklistItems: [
        { parameter: 'Visual Inspection', specification: 'No visible defects', actualValue: formData.visualInspection, result: formData.visualInspection as 'pass' | 'fail' },
        { parameter: 'Dimension Check', specification: 'Within tolerance', actualValue: formData.dimensionCheck, result: formData.dimensionCheck as 'pass' | 'fail' },
        { parameter: 'Chemical & Mechanical', specification: 'Matches grade spec', actualValue: formData.chemicalMechanicalCheck, result: formData.chemicalMechanicalCheck as 'pass' | 'fail' },
        { parameter: 'MTC Verification', specification: 'Certificate matches', actualValue: formData.mtcVerification, result: formData.mtcVerification as 'pass' | 'fail' },
      ],
      overallResult: result,
      inspectedBy: 'QC Inspector',
      inspectedAt: new Date().toISOString().split('T')[0],
      remarks: formData.remarks,
    })

    if (result === 'rejected') {
      addNCR({
        id: Math.random().toString(36).substring(2, 15),
        ncrNumber: generateNumber('NCR'),
        productName: selectedItem.productName,
        heatNumber: selectedItem.heatNumber,
        description: `Material rejected during QC inspection. Reason: ${formData.remarks || 'Failed inspection criteria'}`,
        status: 'open',
        raisedBy: 'QC Inspector',
        createdAt: new Date().toISOString().split('T')[0],
      })
    }

    setInspectOpen(false)
    setSelectedItem(null)
  }

  return (
    <PageLayout title="Inspections">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quality Inspections</h2>
            <p className="text-muted-foreground">Manage incoming material inspections (ISO 8.6)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-50 p-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingItems.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Inspection</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedItems.length}</p>
                  <p className="text-xs text-muted-foreground">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedItems.length}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{holdItems.length}</p>
                  <p className="text-xs text-muted-foreground">On Hold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Pending Inspection Queue
            </CardTitle>
            <CardDescription>Materials awaiting quality inspection from GRN</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead>GRN</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileCheck className="h-8 w-8 text-green-500" />
                        <span>No items pending inspection</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{item.heatNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{item.grnNumber}</TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell>
                        <Badge className={inspectionColors[item.inspectionStatus]}>
                          {item.inspectionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleStartInspection(item)}>
                          <ClipboardCheck className="mr-1 h-3 w-3" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Inspected Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Heat Number</TableHead>
                  <TableHead>GRN</TableHead>
                  <TableHead>MTC</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...acceptedItems, ...rejectedItems, ...holdItems].length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inspection records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...acceptedItems, ...rejectedItems, ...holdItems].map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{item.heatNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{item.grnNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{item.mtcNumber || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell>
                        <Badge className={inspectionColors[item.inspectionStatus]}>
                          {item.inspectionStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Quality Inspection</DialogTitle>
            <DialogDescription>
              Inspect material and record results
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <p className="font-medium">{selectedItem.productName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Heat Number:</span>
                    <p className="font-mono font-medium">{selectedItem.heatNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <p className="font-medium">{selectedItem.quantity}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">GRN:</span>
                    <p className="font-mono text-xs">{selectedItem.grnNumber}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>MTC Number</Label>
                  <Input
                    value={formData.mtcNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, mtcNumber: e.target.value }))}
                    placeholder="Enter Material Test Certificate number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visual Inspection</Label>
                    <Select
                      value={formData.visualInspection}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, visualInspection: val as "pass" | "fail" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dimension Check</Label>
                    <Select
                      value={formData.dimensionCheck}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, dimensionCheck: val as "pass" | "fail" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chemical & Mechanical</Label>
                    <Select
                      value={formData.chemicalMechanicalCheck}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, chemicalMechanicalCheck: val as "pass" | "fail" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>MTC Verification</Label>
                    <Select
                      value={formData.mtcVerification}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, mtcVerification: val as "pass" | "fail" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Remarks / Observations</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Enter any observations or notes..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="destructive"
                  onClick={() => handleInspectionSubmit('rejected')}
                  disabled={!formData.visualInspection || !formData.dimensionCheck || !formData.mtcVerification}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={() => handleInspectionSubmit('hold')}
                  disabled={!formData.visualInspection || !formData.dimensionCheck || !formData.mtcVerification}
                >
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  Hold
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleInspectionSubmit('accepted')}
                  disabled={!formData.visualInspection || !formData.dimensionCheck || !formData.mtcVerification}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Accept
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
