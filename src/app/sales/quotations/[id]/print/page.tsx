"use client"

import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, use, Suspense } from "react"
import { Loader2 } from "lucide-react"

function QuotationPrintContent({ id }: { id: string }) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const showPrice = searchParams.get('price') !== 'false'
    const [quotation, setQuotation] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [company, setCompany] = useState<any>(null)

    useEffect(() => {
        if (id) fetchQuotationAndCompany()
    }, [id])

    const fetchQuotationAndCompany = async () => {
        try {
            setLoading(true)
            const qRes = await fetch(`/api/quotations/${id}`)
            const qData = await qRes.json()

            if (qRes.ok) {
                setQuotation(qData.data)
                // Fetch primary company details (for letterhead)
                const cRes = await fetch('/api/companies')
                const cData = await cRes.json()
                if (cRes.ok && cData.data.length > 0) {
                    setCompany(cData.data[0]) // Assume first company is the primary entity
                }
            }
        } catch (err) {
            console.error("Failed to fetch print data")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    if (!quotation) return <div>Quotation not found</div>

    return (
        <div className="bg-white text-black p-8 max-w-4xl mx-auto print:p-0">
            {/* Header / Letterhead */}
            <div className="flex justify-between border-b-2 border-primary pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">{company?.name || 'STEEL ERP CORP'}</h1>
                    <p className="text-[10px] leading-tight text-gray-600 mt-1 max-w-[300px]">
                        {company?.registered_address_line1}, {company?.registered_city}, {company?.registered_state} - {company?.registered_pincode}<br />
                        GSTIN: {company?.gstin} | PAN: {company?.pan}<br />
                        Email: {company?.email} | Web: {company?.website}
                    </p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-800">QUOTATION</h2>
                    <div className="mt-2 space-y-0.5">
                        <p className="text-xs font-bold">No: <span className="text-primary">{quotation.quotation_number}</span></p>
                        <p className="text-xs">Date: {new Date(quotation.created_at).toLocaleDateString()}</p>
                        <p className="text-xs">Revision: {quotation.revision}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-[8px] pt-1">Valid Until: {new Date(quotation.valid_until).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quotation For</h3>
                    <p className="font-bold text-sm">{quotation.customer?.name}</p>
                    <p className="text-xs text-gray-600 leading-relaxed mt-1">
                        {quotation.customer?.address}<br />
                        {quotation.customer?.city}, {quotation.customer?.state}<br />
                        GST: {quotation.customer?.gst_number}
                    </p>
                </div>
                <div>
                    {quotation.enquiry && (
                        <div className="text-right">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">References</h3>
                            <p className="text-xs">Your Enquiry: <span className="font-bold">{quotation.enquiry.enquiry_number}</span></p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8 border-collapse">
                <thead className="bg-primary/5">
                    <tr className="border-y-2 border-black">
                        <th className="text-left py-3 px-2 text-[10px] font-bold uppercase">#</th>
                        <th className="text-left py-3 px-2 text-[10px] font-bold uppercase">Description / Specifications</th>
                        <th className="text-center py-3 px-2 text-[10px] font-bold uppercase">Qty</th>
                        <th className="text-center py-3 px-2 text-[10px] font-bold uppercase">UOM</th>
                        <th className="text-right py-3 px-2 text-[10px] font-bold uppercase">Unit Price</th>
                        <th className="text-right py-3 px-2 text-[10px] font-bold uppercase">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {quotation.items?.map((item: any, idx: number) => (
                        <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-3 px-2 text-xs">{idx + 1}</td>
                            <td className="py-3 px-2">
                                <p className="font-bold text-xs">{item.product_name || item.product?.name}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                                <p className="text-[9px] font-mono mt-1">Size: {item.size} | Sch: {item.schedule} | WT: {item.wall_thickness}mm</p>
                            </td>
                            <td className="py-3 px-2 text-center text-xs font-bold">{item.quantity}</td>
                            <td className="py-3 px-2 text-center text-[10px]">{item.uom?.code || 'NOS'}</td>
                            <td className="py-3 px-2 text-right text-xs">
                                {showPrice ? (
                                    `${quotation.currency === 'INR' ? '₹' : '$'}${item.unit_price.toLocaleString()}`
                                ) : (
                                    <span className="font-bold text-[9px] uppercase tracking-tighter text-gray-400">QUOTED</span>
                                )}
                            </td>
                            <td className="py-3 px-2 text-right text-xs font-bold">
                                {showPrice ? (
                                    `${quotation.currency === 'INR' ? '₹' : '$'}${item.line_total.toLocaleString()}`
                                ) : (
                                    <span className="font-bold text-[9px] uppercase tracking-tighter text-gray-400">QUOTED</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary Section */}
            <div className="flex justify-between gap-8 mb-12">
                <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b">Terms & Conditions</h4>
                    <div className="space-y-3">
                        {quotation.terms?.map((term: any, idx: number) => (
                            <p key={term.id} className="text-[10px] leading-relaxed">
                                <span className="font-bold mr-1">{idx + 1}.</span> {term.custom_text || term.term_details?.default_text}
                            </p>
                        ))}
                    </div>
                </div>

                <div className="w-64 space-y-2.5">
                    {showPrice ? (
                        <>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-gray-500 font-medium">Subtotal</span>
                                <span className="font-bold text-gray-800">{quotation.currency === 'INR' ? '₹' : '$'}{(quotation.subtotal || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-gray-500 font-medium">Add: Taxes (GST)</span>
                                <span className="font-bold text-gray-800">{quotation.currency === 'INR' ? '₹' : '$'}{(quotation.tax_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-black">
                                <span className="text-xs font-black uppercase">Grand Total</span>
                                <span className="text-lg font-black text-primary">{quotation.currency === 'INR' ? '₹' : '$'}{(quotation.total_amount || 0).toLocaleString()}</span>
                            </div>
                            <p className="text-[8px] text-gray-400 text-right italic font-medium pt-1">Values Inclusive of all charges mentioned above.</p>
                        </>
                    ) : (
                        <div className="p-4 border-2 border-gray-200 rounded-lg text-center bg-gray-50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Value</p>
                            <h3 className="text-xl font-black text-gray-300">AS QUOTED</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Signature Section */}
            <div className="flex justify-between pt-12 items-end">
                <div className="text-[8px] text-gray-400">
                    Generated via SteelERP Pro<br />
                    Internal Ref: {quotation.id.slice(0, 8)}
                </div>
                <div className="text-center w-64">
                    <div className="h-16 w-38 mx-auto border-b border-gray-400 mb-2" />
                    <p className="text-[10px] font-bold uppercase">{company?.name || 'STEEL ERP CORP'}</p>
                    <p className="text-[8px] text-gray-500">Authorized Signatory</p>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print-hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
        .text-primary { color: #2563eb; }
        .bg-primary { background-color: #2563eb; }
      `}</style>
        </div>
    )
}

export default function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <QuotationPrintContent id={id} />
        </Suspense>
    )
}

