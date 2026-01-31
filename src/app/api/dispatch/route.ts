import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
        .from('dispatches')
        .select('*, customer:customers(*), items:dispatch_items(*, product:products(*))')
        .order('created_at', { ascending: false })

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const {
        sales_order_id,
        dispatch_date,
        vehicle_number,
        driver_name,
        warehouse_id,
        items, // Array of { inventory_id, quantity, product_id }
        remarks
    } = body

    if (!sales_order_id || !items || items.length === 0 || !warehouse_id) {
        return apiError('Missing required fields', 400)
    }

    // 1. Create Dispatch Header
    const { data: dispatch, error: dError } = await supabase
        .from('dispatches')
        .insert({
            sales_order_id,
            dispatch_date: dispatch_date || new Date().toISOString(),
            vehicle_number,
            driver_name,
            warehouse_id,
            status: 'dispatched',
            remarks
        })
        .select()
        .single()

    if (dError) return apiError(dError.message)

    // 2. Process Items
    for (const item of items) {
        // Add Dispatch Item
        const { error: diError } = await supabase
            .from('dispatch_items')
            .insert({
                dispatch_id: dispatch.id,
                product_id: item.product_id,
                quantity: item.quantity,
                inventory_id: item.inventory_id
            })

        if (diError) console.error('Error adding dispatch item:', diError)

        // Deduct from Inventory
        const { data: invItem } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('id', item.inventory_id)
            .single()

        if (invItem) {
            const { error: invUpdateError } = await supabase
                .from('inventory')
                .update({
                    quantity: Math.max(0, invItem.quantity - item.quantity)
                })
                .eq('id', item.inventory_id)

            if (invUpdateError) console.error('Error updating inventory:', invUpdateError)
        }

        // Update Sales Order Item delivered_quantity
        const { data: soItem } = await supabase
            .from('sales_order_items')
            .select('delivered_quantity')
            .eq('sales_order_id', sales_order_id)
            .eq('product_id', item.product_id)
            .single()

        if (soItem) {
            await supabase
                .from('sales_order_items')
                .update({ delivered_quantity: (soItem.delivered_quantity || 0) + item.quantity })
                .eq('sales_order_id', sales_order_id)
                .eq('product_id', item.product_id)
        }
    }

    // 3. Update Sales Order Status
    const { data: allSoItems } = await supabase
        .from('sales_order_items')
        .select('quantity, delivered_quantity')
        .eq('sales_order_id', sales_order_id)

    if (allSoItems) {
        const totalOrdered = allSoItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalDelivered = allSoItems.reduce((sum, item) => sum + (item.delivered_quantity || 0), 0)

        let newStatus = 'partial_dispatch'
        if (totalDelivered >= totalOrdered) newStatus = 'completed'

        await supabase
            .from('sales_orders')
            .update({ status: newStatus })
            .eq('id', sales_order_id)
    }

    return apiSuccess(dispatch, 201)
}
