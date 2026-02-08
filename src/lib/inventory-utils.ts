import { createAdminClient } from './supabase/admin'

export interface AllocationSuggestion {
    inventory_id: string
    heat_number: string
    location: string
    available_quantity: number
    allocate_quantity: number
}

/**
 * Suggests stock allocation based on FIFO (First-In-First-Out)
 * REQ-INV-004: Prioritize oldest stock first based on Received Date
 */
export async function getFifoAllocationSuggestions(
    productId: string,
    requiredQuantity: number,
    warehouseId?: string
): Promise<AllocationSuggestion[]> {
    const supabase = createAdminClient()

    let query = supabase
        .from('inventory')
        .select('id, heat_number, location, available_quantity, created_at')
        .eq('product_id', productId)
        .gt('available_quantity', 0)
        .eq('inspection_status', 'accepted') // Only allocate accepted stock
        .order('created_at', { ascending: true }) // FIFO: Oldest first

    if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId)
    }

    const { data, error } = await query

    if (error || !data) return []

    const suggestions: AllocationSuggestion[] = []
    let remainingNeed = requiredQuantity

    for (const item of data) {
        if (remainingNeed <= 0) break

        const available = Number(item.available_quantity)
        const toAllocate = Math.min(available, remainingNeed)

        suggestions.push({
            inventory_id: item.id,
            heat_number: item.heat_number,
            location: item.location,
            available_quantity: available,
            allocate_quantity: toAllocate
        })

        remainingNeed -= toAllocate
    }

    return suggestions
}
