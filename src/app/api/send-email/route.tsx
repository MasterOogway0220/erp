import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotationPDF, PurchaseOrderPDF, InvoicePDF } from '@/lib/pdf-generator';
import React from 'react';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        const { type, id, to, subject, message } = await request.json();

        if (!type || !id || !to) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch document data and company data
        const { data: company } = await supabase.from('companies').select('*').limit(1).single();

        let buffer: Buffer;
        let fileName: string;

        if (type === 'quotation') {
            const { data: quote, error } = await supabase
                .from('quotations')
                .select('*, customer:customers(*), buyer:buyers(*), items:quotation_items(*, product:products(*)), enquiry:enquiries(*), terms:quotation_terms(*)')
                .eq('id', id)
                .single();

            if (error || !quote) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

            // @ts-ignore - buffer type mismatch in some environments
            const pdfBuffer = await renderToBuffer(<QuotationPDF data={quote} showPrice={true} company={company} />);
            buffer = Buffer.from(pdfBuffer);
            fileName = `Quotation_${quote.quotation_number}.pdf`;
        } else if (type === 'purchase-order') {
            const { data: po, error } = await supabase
                .from('purchase_orders')
                .select('*, vendor:vendors(*), items:purchase_order_items(*, product:products(*))')
                .eq('id', id)
                .single();

            if (error || !po) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });

            // @ts-ignore
            const pdfBuffer = await renderToBuffer(<PurchaseOrderPDF data={po} company={company} />);
            buffer = Buffer.from(pdfBuffer);
            fileName = `PO_${po.po_number}.pdf`;
        } else if (type === 'invoice') {
            const { data: invoice, error } = await supabase
                .from('invoices')
                .select('*, customer:customers(*), items:invoice_items(*, product:products(*)), dispatch:dispatches(*)')
                .eq('id', id)
                .single();

            if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

            // @ts-ignore
            const pdfBuffer = await renderToBuffer(<InvoicePDF data={invoice} company={company} />);
            buffer = Buffer.from(pdfBuffer);
            fileName = `Invoice_${invoice.invoice_number}.pdf`;
        } else {
            return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
        }

        // 2. Send Email via Resend
        const { data, error } = await resend.emails.send({
            from: 'SteelERP <onboarding@resend.dev>', // Replace with verified domain in production
            to: [to],
            subject: subject || `${type.charAt(0).toUpperCase() + type.slice(1)} from SteelERP`,
            html: `<p>${message || 'Please find the attached document.'}</p><br/><p>Regards,<br/>SteelERP Team</p>`,
            attachments: [
                {
                    filename: fileName,
                    content: buffer,
                },
            ],
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Email Dispatch Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
