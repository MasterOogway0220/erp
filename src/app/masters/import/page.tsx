"use client"

import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

const IMPORT_TYPES = {
    PIPE_SIZES: {
        name: "Pipe Sizes",
        template: "material_type,size_inch,od_mm,schedule,wall_thickness_mm,weight_kg_per_m\nCS,1/2,21.3,Sch 40,2.77,1.27\nCS,3/4,26.7,Sch 40,2.87,1.69",
        endpoint: "/api/pipe-sizes"
    },
    PRODUCT_SPECS: {
        name: "Product Specifications",
        template: "product_name,material,additional_spec,ends,length_range\nSeamless Pipe,ASTM A106 Gr.B,Seamless Carbon Steel,Plain/Beveled,5.8-12m\nWelded Pipe,ASTM A53 Gr.B,ERW Carbon Steel,Plain,6m",
        endpoint: "/api/product-specs"
    },
    CUSTOMERS: {
        name: "Customers",
        template: "name,email,telephone,address,city,state,country,gst_number,currency,opening_balance,credit_limit\nSample Customer,customer@example.com,1234567890,Address 1,Mumbai,Maharashtra,India,27AAAAA0000A1Z5,INR,50000,100000",
        endpoint: "/api/customers"
    },
    PRODUCTS: {
        name: "Products",
        template: "name,code,category,unit,hsn_code,base_price,description\nSteel Pipe 1.5 inch,P-001,Pipes,MTR,7304,1200,Standard quality steel pipe\nFlange 2 inch,F-001,Flanges,NOS,7307,850,Industrial grade flange",
        endpoint: "/api/products"
    }
}

export default function ImportPage() {
    const [importType, setImportType] = useState<keyof typeof IMPORT_TYPES>("PIPE_SIZES")
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result
                const XLSX = require('xlsx')
                const workbook = XLSX.read(bstr, { type: 'binary' })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                const parsedData = XLSX.utils.sheet_to_json(worksheet)

                setData(parsedData)
                setError(null)
                setSuccess(false)
            } catch (err) {
                console.error(err)
                setError("Failed to parse Excel file. Please check the format.")
            }
        }
        reader.readAsBinaryString(file)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        multiple: false
    })

    const handleDownloadTemplate = () => {
        const blob = new Blob([IMPORT_TYPES[importType].template], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${importType.toLowerCase()}_template.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const handleImport = async () => {
        if (data.length === 0) return

        setLoading(true)
        setError(null)
        try {
            const response = await fetch(IMPORT_TYPES[importType].endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: data }),
            })

            const result = await response.json()
            if (!response.ok) {
                throw new Error(result.error || "Failed to import data")
            }

            setSuccess(true)
            setData([])
            toast.success(`Successfully imported ${result.data?.length || data.length} records`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to import data")
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageLayout title="Master Data Import">
            <div className="space-y-6">
                <div className="flex gap-4">
                    {(Object.keys(IMPORT_TYPES) as Array<keyof typeof IMPORT_TYPES>).map((type) => (
                        <Button
                            key={type}
                            variant={importType === type ? "default" : "outline"}
                            onClick={() => {
                                setImportType(type)
                                setData([])
                                setSuccess(false)
                                setError(null)
                            }}
                        >
                            {IMPORT_TYPES[type].name}
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Step 1: Get Template</CardTitle>
                            <CardDescription>
                                Download the CSV template for {IMPORT_TYPES[importType].name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full" onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Template
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Step 2: Upload File</CardTitle>
                            <CardDescription>
                                Upload your completed CSV file
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    Drag & drop CSV file here, or click to select
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-500 text-green-600 bg-green-50">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>Data has been successfully imported.</AlertDescription>
                    </Alert>
                )}

                {data.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Preview ({data.length} records)</CardTitle>
                                <CardDescription>Review the data before finalizing the import</CardDescription>
                            </div>
                            <Button onClick={handleImport} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Confirm Import
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[400px] overflow-auto border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {Object.keys(data[0]).map((header) => (
                                                <TableHead key={header}>{header}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.slice(0, 50).map((row, i) => (
                                            <TableRow key={i}>
                                                {Object.values(row).map((val: any, j) => (
                                                    <TableCell key={j} className="text-xs">
                                                        {val?.toString() || "-"}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {data.length > 50 && (
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Showing first 50 records...
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageLayout>
    )
}
