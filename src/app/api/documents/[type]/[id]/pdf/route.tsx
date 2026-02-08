import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotationPDF, PurchaseOrderPDF, InvoicePDF } from '@/lib/pdf-generator';
import React from 'react';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    const supabase = await createClient();
    const { type, id } = await params;
    const { searchParams } = new URL(request.url);
    const showPrice = searchParams.get('showPrice') !== 'false';

    try {
        // 1. Fetch document data based on type
        let data;
        let company;

        // Fetch primary company data (defaulting to first one for now or a system setting)
        const { data: companyData } = await supabase.from('companies').select('*').limit(1).single();
        company = companyData;

        if (type === 'quotation') {
            const { data: quote, error } = await supabase
                .from('quotations')
                .select('*, customer:customers(*), buyer:buyers(*), items:quotation_items(*, product:products(*)), enquiry:enquiries(*), terms:quotation_terms(*)')
                .eq('id', id)
                .single();

            if (error || !quote) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

            const buffer = await renderToBuffer(<QuotationPDF data={quote} showPrice={showPrice} company={company} />);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="Quotation_${quote.quotation_number}.pdf"`,
                },
            });
        }

        if (type === 'purchase-order') {
            const { data: po, error } = await supabase
                .from('purchase_orders')
                .select('*, vendor:vendors(*), items:purchase_order_items(*, product:products(*))')
                .eq('id', id)
                .single();

            if (error || !po) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });

            const buffer = await renderToBuffer(<PurchaseOrderPDF data={po} company={company} />);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="PO_${po.po_number}.pdf"`,
                },
            });
        }

        if (type === 'invoice') {
            const { data: invoice, error } = await supabase
                .from('invoices')
                .select('*, customer:customers(*), items:invoice_items(*, product:products(*)), dispatch:dispatches(*)')
                .eq('id', id)
                .single();

            if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

            const buffer = await renderToBuffer(<InvoicePDF data={invoice} company={company} />);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="Invoice_${invoice.invoice_number}.pdf"`,
                },
            });
        }

        return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
