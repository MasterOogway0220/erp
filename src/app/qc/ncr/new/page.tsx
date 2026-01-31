"use client"

import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewNCRPage() {
  const router = useRouter()
  
  const [products, setProducts] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  
  const [productId, setProductId] = useState("")
  const [productName, setProductName] = useState("")
  const [heatNumber, setHeatNumber] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    fetchProducts()
  }, [])
  
  const fetchProducts = async () => {
    try {
      setDataLoading(true)
      const response = await fetch('/api/products')
      const result = await response.json()
      setProducts(result.data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setDataLoading(false)
    }
  }
  
  const handleProductChange = (value: string) => {
    setProductId(value)
    const product = products.find(p => p.id === value)
    if (product) {
      setProductName(product.name)
    }
  }
  
  const handleSubmit = async () => {
    setError("")
    
    if (!productName && !productId) {
      setError("Please select a product or enter product name")
      return
    }
    
    if (!description.trim()) {
      setError("Please enter a description of the non-conformance")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch("/api/ncr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId || undefined,
          product_name: productName,
          heat_number: heatNumber || undefined,
          description,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to create NCR")
      }
      
      router.push("/qc/ncr")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create NCR")
    } finally {
      setLoading(false)
    }
  }
  
  if (dataLoading) {
    return (
      <PageLayout title="Raise NCR">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }
  
  return (
    <PageLayout title="Raise NCR">
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Raise NCR</h2>
            <p className="text-muted-foreground">Report a non-conformance issue</p>
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
            <CardTitle className="text-base">NCR Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={productId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Product Name (if not in list)</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Heat Number (optional)</Label>
              <Input
                value={heatNumber}
                onChange={(e) => setHeatNumber(e.target.value)}
                placeholder="e.g. HT-2026-001"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description of Non-Conformance *</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the quality issue, defect, or non-conformance in detail..."
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Raise NCR
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
