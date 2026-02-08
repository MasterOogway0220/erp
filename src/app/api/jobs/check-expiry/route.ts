import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/app/api/notifications/route'

export async function GET(request: NextRequest) {
    const adminClient = createAdminClient()

    try {
        // 1. Find approved/sent quotations that have passed their validity date
        const today = new Date().toISOString().split('T')[0]

        const { data: expiredQuotes, error: fetchError } = await adminClient
            .from('quotations')
            .select('id, quotation_number, created_by, valid_until')
            .in('status', ['approved', 'sent'])
            .lt('valid_until', today)
            .eq('is_latest_version', true)

        if (fetchError) throw fetchError

        if (!expiredQuotes || expiredQuotes.length === 0) {
            return NextResponse.json({ message: 'No quotations found for expiry' })
        }

        // 2. Update status to expired
        const expiredIds = expiredQuotes.map(q => q.id)
        const { error: updateError } = await adminClient
            .from('quotations')
            .update({ status: 'expired' })
            .in('id', expiredIds)

        if (updateError) throw updateError

        // 3. Notify creators
        for (const quote of expiredQuotes) {
            if (quote.created_by) {
                await createNotification(
                    quote.created_by,
                    'Quotation Expired',
                    `Quotation ${quote.quotation_number} has expired as it passed its validity date (${quote.valid_until}).`,
                    'warning',
                    'quotation',
                    quote.id
                )
            }
        }

        return NextResponse.json({
            message: `Successfully expired ${expiredQuotes.length} quotations`,
            expired_count: expiredQuotes.length
        })

    } catch (err: any) {
        console.error('Expiry Job Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
