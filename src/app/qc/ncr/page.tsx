"use client"

import { PageLayout } from "@/components/page-layout"
import { useStore, NCR } from "@/lib/store"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, AlertTriangle, Eye } from "lucide-react"
import { useState } from "react"

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  under_investigation: "bg-yellow-100 text-yellow-800",
  action_taken: "bg-blue-100 text-blue-800",
  closed: "bg-green-100 text-green-800",
}

export default function NCRPage() {
  const { ncrs, addNCR, updateNCR, generateNumber, products } = useStore()
  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedNCR, setSelectedNCR] = useState<NCR | null>(null)
  const [productName, setProductName] = useState("")
  const [heatNumber, setHeatNumber] = useState("")
  const [description, setDescription] = useState("")
  const [rootCause, setRootCause] = useState("")
  const [correctiveAction, setCorrectiveAction] = useState("")
  
  const handleSubmit = () => {
    if (!productName || !description) return
    
    const newNCR: NCR = {
      id: Math.random().toString(36).substring(2, 15),
      ncrNumber: generateNumber("NCR"),
      productName,
      heatNumber,
      description,
      status: "open",
      raisedBy: "Admin User",
      createdAt: new Date().toISOString().split("T")[0],
    }
    
    addNCR(newNCR)
    setOpen(false)
    setProductName("")
    setHeatNumber("")
    setDescription("")
  }
  
  const handleUpdateNCR = () => {
    if (!selectedNCR) return
    
    updateNCR(selectedNCR.id, {
      rootCause,
      correctiveAction,
      status: correctiveAction ? "action_taken" : "under_investigation",
    })
    setViewOpen(false)
    setRootCause("")
    setCorrectiveAction("")
  }
  
  const handleCloseNCR = (id: string) => {
    updateNCR(id, {
      status: "closed",
      closedBy: "Admin User",
      closedAt: new Date().toISOString().split("T")[0],
    })
  }
  
  return (
    <PageLayout title="NCR">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Non-Conformance Reports</h2>
            <p className="text-muted-foreground">Track and resolve quality issues (ISO 8.7, 10.2)</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                Raise NCR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Raise Non-Conformance Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heat Number (if applicable)</Label>
                  <Input
                    value={heatNumber}
                    onChange={(e) => setHeatNumber(e.target.value)}
                    placeholder="Heat / Batch number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description of Non-Conformance</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-700">
                  Raise NCR
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ncrs.filter(n => n.status === 'open').length}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-50 p-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ncrs.filter(n => n.status === 'under_investigation').length}</p>
                  <p className="text-xs text-muted-foreground">Under Investigation</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ncrs.filter(n => n.status === 'action_taken').length}</p>
                  <p className="text-xs text-muted-foreground">Action Taken</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <AlertTriangle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ncrs.filter(n => n.status === 'closed').length}</p>
                  <p className="text-xs text-muted-foreground">Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All NCRs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NCR Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Heat No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Raised By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ncrs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No NCRs found. Quality is looking good!
                    </TableCell>
                  </TableRow>
                ) : (
                  ncrs.map((ncr) => (
                    <TableRow key={ncr.id}>
                      <TableCell className="font-mono font-medium">
                        {ncr.ncrNumber}
                      </TableCell>
                      <TableCell>{ncr.productName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {ncr.heatNumber || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {ncr.description}
                      </TableCell>
                      <TableCell>{ncr.raisedBy}</TableCell>
                      <TableCell>{ncr.createdAt}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[ncr.status]}>
                          {ncr.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedNCR(ncr)
                              setRootCause(ncr.rootCause || "")
                              setCorrectiveAction(ncr.correctiveAction || "")
                              setViewOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ncr.status === "action_taken" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCloseNCR(ncr.id)}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>NCR Details - {selectedNCR?.ncrNumber}</DialogTitle>
            </DialogHeader>
            {selectedNCR && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Product</Label>
                    <p className="font-medium">{selectedNCR.productName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Heat Number</Label>
                    <p className="font-mono">{selectedNCR.heatNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Raised By</Label>
                    <p>{selectedNCR.raisedBy}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedNCR.status]}>
                      {selectedNCR.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedNCR.description}</p>
                </div>
                
                {selectedNCR.status !== "closed" && (
                  <>
                    <div className="space-y-2">
                      <Label>Root Cause Analysis</Label>
                      <Textarea
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        placeholder="Identify the root cause of the non-conformance..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Corrective Action</Label>
                      <Textarea
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        placeholder="Describe the corrective action taken..."
                        rows={3}
                      />
                    </div>
                    
                    <Button onClick={handleUpdateNCR} className="w-full">
                      Update NCR
                    </Button>
                  </>
                )}
                
                {selectedNCR.status === "closed" && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Root Cause</Label>
                      <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedNCR.rootCause || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Corrective Action</Label>
                      <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedNCR.correctiveAction || "-"}</p>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Closed by: {selectedNCR.closedBy}</span>
                      <span>Closed on: {selectedNCR.closedAt}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
