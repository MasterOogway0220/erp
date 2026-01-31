"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowRight, Package, FileText, ArrowLeft, Loader2 } from "lucide-react"

function QuotationTypeSelectionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const enquiryId = searchParams.get("enquiryId")
  const [quotationType, setQuotationType] = useState<"STANDARD" | "NON_STANDARD">("STANDARD")

  const handleNext = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (quotationType === "STANDARD") {
      router.push(`/sales/quotations/new/standard?${params.toString()}`)
    } else {
      router.push(`/sales/quotations/new/non-standard?${params.toString()}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Select Quotation Type</h2>
          <p className="text-muted-foreground">Choose the appropriate format for your quotation</p>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Quotation Path</CardTitle>
          <CardDescription>
            Select the type of items you are quoting to use the specialized entry form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={quotationType}
            onValueChange={(v: any) => setQuotationType(v)}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <RadioGroupItem
                value="STANDARD"
                id="standard"
                className="peer sr-only"
              />
              <Label
                htmlFor="standard"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
              >
                <Package className="mb-3 h-10 w-10 text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold">Standard Quotation</p>
                  <p className="text-xs text-muted-foreground">
                    For Pipes, Fittings, Flanges. Uses master data and auto-calculates weights.
                  </p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="NON_STANDARD"
                id="non-standard"
                className="peer sr-only"
              />
              <Label
                htmlFor="non-standard"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
              >
                <FileText className="mb-3 h-10 w-10 text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold">Non-Standard Quotation</p>
                  <p className="text-xs text-muted-foreground">
                    For Valves, Instruments, and others. Supports rich-text descriptions.
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleNext} className="w-full md:w-auto px-12 h-11 text-base font-semibold">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function QuotationTypeSelectionPage() {
  return (
    <PageLayout title="Create Quotation">
      <Suspense fallback={<div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <QuotationTypeSelectionForm />
      </Suspense>
    </PageLayout>
  )
}
