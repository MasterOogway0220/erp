// Safe data access utilities for handling API responses

export function safeString(value: any, defaultValue: string = ''): string {
    return value?.toString() || defaultValue
}

export function safeNumber(value: any, defaultValue: number = 0): number {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
}

export function safeArray<T>(value: any): T[] {
    return Array.isArray(value) ? value : []
}

export function safeObject<T>(value: any, defaultValue: T): T {
    return value && typeof value === 'object' ? value : defaultValue
}

// Invoice data normalizer
export function normalizeInvoiceData(inv: any) {
    return {
        id: inv?.id || '',
        invoiceNumber: inv?.invoice_number || inv?.invoiceNumber || 'N/A',
        customerName: inv?.customer?.name || inv?.customerName || 'Unknown',
        dueDate: inv?.due_date || inv?.dueDate || new Date().toISOString().split('T')[0],
        total: safeNumber(inv?.total),
        paidAmount: safeNumber(inv?.paid_amount || inv?.paidAmount),
        status: inv?.status || 'unpaid'
    }
}

// Purchase order data normalizer
export function normalizePurchaseOrderData(po: any) {
    return {
        id: po?.id || '',
        poNumber: po?.po_number || 'N/A',
        vendorId: po?.vendor_id || '',
        vendorName: po?.vendor?.name || 'Unknown',
        items: safeArray(po?.items).map((i: any) => ({
            id: i?.id || '',
            productId: i?.product_id || '',
            productName: i?.product?.name || 'Unknown',
            quantity: safeNumber(i?.quantity),
            receivedQuantity: safeNumber(i?.received_quantity),
            unitPrice: safeNumber(i?.unit_price),
            total: safeNumber(i?.total)
        })),
        subtotal: safeNumber(po?.subtotal),
        tax: safeNumber(po?.tax),
        total: safeNumber(po?.total),
        deliveryDate: po?.delivery_date?.split('T')[0] || '',
        status: po?.status || 'draft',
        revision: safeNumber(po?.revision, 1),
        createdAt: po?.created_at?.split('T')[0] || ''
    }
}

// API response handler
export function handleApiResponse<T>(response: any, normalizer?: (item: any) => T): T[] {
    try {
        const data = Array.isArray(response) ? response : (response?.data || [])
        return normalizer ? data.map(normalizer) : data
    } catch (error) {
        console.error('Error handling API response:', error)
        return []
    }
}
