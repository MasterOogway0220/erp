"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2, ArrowLeft } from "lucide-react"

interface VendorEvaluationFormProps {
    params: Promise<{ id: string }>
}

export default function VendorEvaluationPage({ params }: VendorEvaluationFormProps) {
    const router = useRouter()
    const [vendorId, setVendorId] = useState<string>("")
    const [vendor, setVendor] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [qualityScore, setQualityScore] = useState(0)
    const [deliveryScore, setDeliveryScore] = useState(0)
    const [pricingScore, setPricingScore] = useState(0)
    const [communicationScore, setCommunicationScore] = useState(0)
    const [remarks, setRemarks] = useState("")

    const [previousEvaluations, setPreviousEvaluations] = useState<any[]>([])

    useEffect(() => {
        params.then(p => {
            setVendorId(p.id)
            fetchVendor(p.id)
            fetchPreviousEvaluations(p.id)
        })
    }, [])

    const fetchVendor = async (id: string) => {
        try {
            const res = await fetch(`/api/vendors/${id}`)
            const data = await res.json()
            if (data.success) {
                setVendor(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch vendor")
        } finally {
            setLoading(false)
        }
    }

    const fetchPreviousEvaluations = async (id: string) => {
        try {
            const res = await fetch(`/api/vendor-evaluations?vendor_id=${id}`)
            const data = await res.json()
            if (data.success) {
                setPreviousEvaluations(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch evaluations")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!qualityScore || !deliveryScore || !pricingScore || !communicationScore) {
            alert("Please provide all scores")
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/vendor-evaluations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vendor_id: vendorId,
                    quality_score: qualityScore,
                    delivery_score: deliveryScore,
                    pricing_score: pricingScore,
                    communication_score: communicationScore,
                    remarks,
                }),
            })

            const data = await res.json()
            if (data.success) {
                alert("Evaluation submitted successfully")
                router.push(`/vendors/${vendorId}`)
            } else {
                alert(data.error || "Failed to submit evaluation")
            }
        } catch (error) {
            alert("Failed to submit evaluation")
        } finally {
            setSubmitting(false)
        }
    }

    const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="focus:outline-none"
                    >
                        <Star
                            className={`h-8 w-8 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                        />
                    </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">{value}/5</span>
            </div>
        )
    }

    const overallScore = qualityScore && deliveryScore && pricingScore && communicationScore
        ? ((qualityScore + deliveryScore + pricingScore + communicationScore) / 4).toFixed(2)
        : "0.00"

    if (loading) {
        return (
            <PageLayout title="Vendor Evaluation">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout
            title={`Evaluate Vendor: ${vendor?.name || ""}`}
            description="ISO 8.4.1: External Provider Evaluation"
        >
            <div className="mb-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vendor Evaluation Form</CardTitle>
                            <CardDescription>
                                Rate the vendor on a scale of 1-5 stars for each criterion
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label>Quality Score</Label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Product quality, conformance to specifications, defect rate
                                    </p>
                                    <StarRating value={qualityScore} onChange={setQualityScore} />
                                </div>

                                <div>
                                    <Label>Delivery Score</Label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        On-time delivery, lead time adherence, packaging quality
                                    </p>
                                    <StarRating value={deliveryScore} onChange={setDeliveryScore} />
                                </div>

                                <div>
                                    <Label>Pricing Score</Label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Competitive pricing, payment terms, price stability
                                    </p>
                                    <StarRating value={pricingScore} onChange={setPricingScore} />
                                </div>

                                <div>
                                    <Label>Communication Score</Label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Responsiveness, documentation, technical support
                                    </p>
                                    <StarRating value={communicationScore} onChange={setCommunicationScore} />
                                </div>

                                <div>
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Additional comments about this evaluation..."
                                        rows={4}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div>
                                        <p className="text-sm text-gray-600">Overall Score</p>
                                        <p className="text-3xl font-bold text-primary">{overallScore}/5.00</p>
                                    </div>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Evaluation
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Previous Evaluations</CardTitle>
                            <CardDescription>Historical performance scores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {previousEvaluations.length === 0 ? (
                                <p className="text-sm text-gray-500">No previous evaluations</p>
                            ) : (
                                <div className="space-y-4">
                                    {previousEvaluations.map((evaluation) => (
                                        <div key={evaluation.id} className="border-b pb-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(evaluation.evaluation_date).toLocaleDateString()}
                                                </span>
                                                <span className="text-lg font-bold text-primary">
                                                    {evaluation.overall_score}/5
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>Quality: {evaluation.quality_score}/5</div>
                                                <div>Delivery: {evaluation.delivery_score}/5</div>
                                                <div>Pricing: {evaluation.pricing_score}/5</div>
                                                <div>Comm: {evaluation.communication_score}/5</div>
                                            </div>
                                            {evaluation.remarks && (
                                                <p className="text-xs text-gray-600 mt-2 italic">{evaluation.remarks}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    )
}
