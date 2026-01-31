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
import { Plus, Package, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Product {
  id: string
  name: string
  code: string
  category: string
  unit: string
  hsn_code: string | null
  base_price: number
  description: string | null
  is_active: boolean
  created_at: string
}

const categories = ["Pipes", "Flanges", "Valves", "Gaskets", "Fittings", "Other"]

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchProducts = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch('/api/products')
      const result = await response.json()
      if (response.ok) {
        setProducts(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch products')
      }
    } catch {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const categoryCount = categories.reduce((acc, cat) => {
    acc[cat] = products.filter(p => p.category === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <PageLayout title="Products">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">Product master with HSN codes</p>
          </div>
          <Link href="/masters/products/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Card key={cat}>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{categoryCount[cat] || 0}</p>
                  <p className="text-xs text-muted-foreground">{cat}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Products ({products.length})</CardTitle>
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
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden sm:table-cell">Internal Code</TableHead>
                    <TableHead className="hidden sm:table-cell">Cust. Code</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">HSN</TableHead>
                    <TableHead className="hidden xl:table-cell">Unit</TableHead>
                    <TableHead className="text-right">Base Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No products found. Add your first product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product: any) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/masters/products/${product.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-medium">{product.name}</span>
                              <p className="text-xs text-muted-foreground sm:hidden">{product.internal_material_code || product.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm hidden sm:table-cell">{product.internal_material_code || "-"}</TableCell>
                        <TableCell className="font-mono text-xs hidden sm:table-cell">{product.customer_material_code || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs hidden lg:table-cell">{product.hsn_code || "-"}</TableCell>
                        <TableCell className="hidden xl:table-cell">{product.uom?.code || product.unit}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(product.base_price || 0).toLocaleString()}
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
