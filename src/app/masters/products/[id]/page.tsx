"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Package, History, Info, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [pricingHistory, setPricingHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [productRes, historyRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch(`/api/products/pricing-history?product_id=${id}`)
        ])

        const productData = await productRes.json()
        const historyData = await historyRes.json()

        if (productRes.ok) setProduct(productData.data)
        if (historyRes.ok) setPricingHistory(historyData.data || [])

        if (!productRes.ok) setError(productData.error || "Failed to fetch product")
      } catch (err) {
        setError("Failed to fetch product details")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive opacity-50 mb-4" />
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="text-muted-foreground">{error || "Product not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <PageLayout title={product.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{product.internal_material_code || product.code}</p>
          </div>
          <Button variant="outline">Edit Product</Button>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing History</TabsTrigger>
            <TabsTrigger value="stock">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" /> Attributes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium">{product.category}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Primary Unit</dt>
                      <dd className="font-medium">{product.uom?.name} ({product.uom?.code})</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">HSN Code</dt>
                      <dd className="font-medium">{product.hsn_code || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Internal Code</dt>
                      <dd className="font-medium font-mono">{product.internal_material_code || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Customer Code</dt>
                      <dd className="font-medium font-mono">{product.customer_material_code || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Base Price</dt>
                      <dd className="font-medium">₹{product.base_price?.toLocaleString()}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 pt-6 border-t font-sm">
                    <h4 className="font-medium mb-1">Description / Specifications</h4>
                    <p className="text-muted-foreground">{product.description || "No description provided."}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" /> Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Monthly Avg Price</p>
                    <p className="text-2xl font-bold">₹{product.base_price?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Quotes</span>
                      <span>{pricingHistory.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Orders</span>
                      <span>0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Historical Prices
                </CardTitle>
                <CardDescription>Track how the price has changed in previous quotations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Quotation #</TableHead>
                      <TableHead className="text-right">Quoted Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No pricing history found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pricingHistory.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell>{new Date(h.quoted_date).toLocaleDateString()}</TableCell>
                          <TableCell>{h.customer?.name}</TableCell>
                          <TableCell className="font-mono">{h.quotation?.quotation_number}</TableCell>
                          <TableCell className="text-right font-medium">₹{h.quoted_price?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {h.quotation?.status || "Draft"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
