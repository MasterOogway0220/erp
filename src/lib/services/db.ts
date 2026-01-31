import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function generateDocumentNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear()
  
  const { data, error } = await supabase
    .from('sequence_counters')
    .select('*')
    .eq('id', prefix)
    .single()
  
  if (error || !data) {
    const newValue = 1
    await supabase
      .from('sequence_counters')
      .upsert({ id: prefix, prefix, current_value: newValue, year })
    return `${prefix}-${year}-${String(newValue).padStart(4, '0')}`
  }
  
  if (data.year !== year) {
    await supabase
      .from('sequence_counters')
      .update({ current_value: 1, year })
      .eq('id', prefix)
    return `${prefix}-${year}-0001`
  }
  
  const newValue = data.current_value + 1
  await supabase
    .from('sequence_counters')
    .update({ current_value: newValue, updated_at: new Date().toISOString() })
    .eq('id', prefix)
  
  return `${prefix}-${year}-${String(newValue).padStart(4, '0')}`
}

export const customersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async create(customer: {
    name: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    country?: string
    gst_number?: string
    currency?: string
  }) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    return { data, error }
  },
  
  async update(id: string, updates: Partial<{
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    country: string
    gst_number: string
    currency: string
    is_active: boolean
  }>) {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const vendorsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getApproved() {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('name')
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async create(vendor: {
    name: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    country?: string
    gst_number?: string
    is_approved?: boolean
  }) {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single()
    return { data, error }
  },
  
  async update(id: string, updates: Partial<{
    name: string
    email: string
    phone: string
    address: string
    is_approved: boolean
    rating: number
    is_active: boolean
  }>) {
    const { data, error } = await supabase
      .from('vendors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const productsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async create(product: {
    name: string
    code: string
    category: string
    unit: string
    hsn_code?: string
    base_price?: number
    description?: string
  }) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    return { data, error }
  },
  
  async update(id: string, updates: Partial<{
    name: string
    code: string
    category: string
    unit: string
    hsn_code: string
    base_price: number
    description: string
    is_active: boolean
  }>) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const enquiriesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('enquiries')
      .select(`
        *,
        customer:customers(id, name),
        items:enquiry_items(
          *,
          product:products(id, name, code)
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('enquiries')
      .select(`
        *,
        customer:customers(*),
        items:enquiry_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async getOpen() {
    const { data, error } = await supabase
      .from('enquiries')
      .select(`
        *,
        customer:customers(id, name),
        items:enquiry_items(
          *,
          product:products(id, name, code)
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async create(enquiry: {
    customer_id: string
    remarks?: string
    items: { product_id: string; quantity: number; specifications?: string }[]
  }) {
    const enquiry_number = await generateDocumentNumber('ENQ')
    
    const { data: enquiryData, error: enquiryError } = await supabase
      .from('enquiries')
      .insert({
        enquiry_number,
        customer_id: enquiry.customer_id,
        remarks: enquiry.remarks,
        status: 'open',
      })
      .select()
      .single()
    
    if (enquiryError) return { data: null, error: enquiryError }
    
    const itemsToInsert = enquiry.items.map(item => ({
      enquiry_id: enquiryData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      specifications: item.specifications,
    }))
    
    const { error: itemsError } = await supabase
      .from('enquiry_items')
      .insert(itemsToInsert)
    
    if (itemsError) return { data: null, error: itemsError }
    
    return { data: enquiryData, error: null }
  },
  
  async updateStatus(id: string, status: 'open' | 'quoted' | 'closed') {
    const { data, error } = await supabase
      .from('enquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const quotationsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customer:customers(id, name),
        enquiry:enquiries(id, enquiry_number),
        items:quotation_items(
          *,
          product:products(id, name, code)
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customer:customers(*),
        enquiry:enquiries(*),
        items:quotation_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async getApproved() {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customer:customers(id, name),
        items:quotation_items(
          *,
          product:products(id, name, code)
        )
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async create(quotation: {
    enquiry_id: string
    customer_id: string
    currency: string
    exchange_rate: number
    valid_until: string
    items: { product_id: string; quantity: number; unit_price: number; discount_percent?: number }[]
  }) {
    const quotation_number = await generateDocumentNumber('QTN')
    
    const subtotal = quotation.items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100)
      return sum + lineTotal
    }, 0)
    const tax_amount = subtotal * 0.18
    const total_amount = subtotal + tax_amount
    
    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .insert({
        quotation_number,
        enquiry_id: quotation.enquiry_id,
        customer_id: quotation.customer_id,
        currency: quotation.currency,
        exchange_rate: quotation.exchange_rate,
        valid_until: quotation.valid_until,
        subtotal,
        tax_amount,
        total_amount,
        status: 'draft',
      })
      .select()
      .single()
    
    if (quotationError) return { data: null, error: quotationError }
    
    const itemsToInsert = quotation.items.map(item => ({
      quotation_id: quotationData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent || 0,
      line_total: item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100),
    }))
    
    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsToInsert)
    
    if (itemsError) return { data: null, error: itemsError }
    
    await supabase
      .from('enquiries')
      .update({ status: 'quoted' })
      .eq('id', quotation.enquiry_id)
    
    return { data: quotationData, error: null }
  },
  
  async updateStatus(id: string, status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'expired', userId?: string) {
    const updates: Record<string, unknown> = { 
      status, 
      updated_at: new Date().toISOString() 
    }
    
    if (status === 'approved' && userId) {
      updates.approved_by = userId
      updates.approved_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('quotations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const salesOrdersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(id, name),
        quotation:quotations(id, quotation_number),
        items:sales_order_items(
          *,
          product:products(id, name, code)
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        quotation:quotations(*),
        items:sales_order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async create(order: {
    quotation_id: string
    customer_po_number?: string
    delivery_date: string
  }) {
    const { data: quotation, error: qError } = await supabase
      .from('quotations')
      .select(`
        *,
        items:quotation_items(*)
      `)
      .eq('id', order.quotation_id)
      .eq('status', 'approved')
      .single()
    
    if (qError || !quotation) {
      return { data: null, error: new Error('Quotation must be approved to create Sales Order') }
    }
    
    const so_number = await generateDocumentNumber('SO')
    
    const { data: soData, error: soError } = await supabase
      .from('sales_orders')
      .insert({
        so_number,
        quotation_id: quotation.id,
        customer_id: quotation.customer_id,
        customer_po_number: order.customer_po_number,
        currency: quotation.currency,
        subtotal: quotation.subtotal,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
        delivery_date: order.delivery_date,
        status: 'open',
      })
      .select()
      .single()
    
    if (soError) return { data: null, error: soError }
    
    const itemsToInsert = quotation.items.map((item: { product_id: string; quantity: number; unit_price: number }) => ({
      sales_order_id: soData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      delivered_quantity: 0,
    }))
    
    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(itemsToInsert)
    
    if (itemsError) return { data: null, error: itemsError }
    
    return { data: soData, error: null }
  },
  
  async updateStatus(id: string, status: 'open' | 'in_progress' | 'partial_dispatch' | 'completed' | 'cancelled') {
    const { data, error } = await supabase
      .from('sales_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const purchaseOrdersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:vendors(id, name),
        items:purchase_order_items(
          *,
          product:products(id, name, code)
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:vendors(*),
        items:purchase_order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async create(po: {
    vendor_id: string
    sales_order_id?: string
    delivery_date: string
    items: { product_id: string; quantity: number; unit_price: number }[]
  }) {
    const po_number = await generateDocumentNumber('PO')
    
    const subtotal = po.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const tax_amount = subtotal * 0.18
    const total_amount = subtotal + tax_amount
    
    const { data: poData, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number,
        vendor_id: po.vendor_id,
        sales_order_id: po.sales_order_id,
        delivery_date: po.delivery_date,
        subtotal,
        tax_amount,
        total_amount,
        status: 'draft',
      })
      .select()
      .single()
    
    if (poError) return { data: null, error: poError }
    
    const itemsToInsert = po.items.map(item => ({
      purchase_order_id: poData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      received_quantity: 0,
    }))
    
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsToInsert)
    
    if (itemsError) return { data: null, error: itemsError }
    
    return { data: poData, error: null }
  },
  
  async updateStatus(id: string, status: 'draft' | 'approved' | 'sent' | 'partial_received' | 'received' | 'cancelled') {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const inventoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(id, name, code, category, unit)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getAccepted() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(id, name, code, category, unit)
      `)
      .eq('inspection_status', 'accepted')
      .gt('quantity', 0)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(*)
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
}

export const grnService = {
  async getAll() {
    const { data, error } = await supabase
      .from('grn')
      .select(`
        *,
        purchase_order:purchase_orders(id, po_number, vendor:vendors(id, name)),
        items:grn_items(
          *,
          product:products(id, name, code)
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async create(grn: {
    purchase_order_id: string
    received_date: string
    items: { product_id: string; po_item_id?: string; received_quantity: number; heat_number: string }[]
  }) {
    const grn_number = await generateDocumentNumber('GRN')
    
    const { data: grnData, error: grnError } = await supabase
      .from('grn')
      .insert({
        grn_number,
        purchase_order_id: grn.purchase_order_id,
        received_date: grn.received_date,
        status: 'pending_inspection',
      })
      .select()
      .single()
    
    if (grnError) return { data: null, error: grnError }
    
    const itemsToInsert = grn.items.map(item => ({
      grn_id: grnData.id,
      product_id: item.product_id,
      po_item_id: item.po_item_id,
      received_quantity: item.received_quantity,
      heat_number: item.heat_number,
      inspection_status: 'under_inspection',
    }))
    
    const { data: grnItems, error: itemsError } = await supabase
      .from('grn_items')
      .insert(itemsToInsert)
      .select()
    
    if (itemsError) return { data: null, error: itemsError }
    
    const inventoryItems = grn.items.map((item, index) => ({
      product_id: item.product_id,
      grn_item_id: grnItems?.[index]?.id,
      heat_number: item.heat_number,
      quantity: item.received_quantity,
      reserved_quantity: 0,
      inspection_status: 'under_inspection',
    }))
    
    await supabase.from('inventory').insert(inventoryItems)
    
    return { data: grnData, error: null }
  },
}

export const invoicesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(id, name),
        sales_order:sales_orders(id, so_number),
        items:invoice_items(
          *,
          product:products(id, name, code)
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        sales_order:sales_orders(*),
        items:invoice_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  
  async create(invoice: {
    sales_order_id: string
    dispatch_id?: string
    due_date: string
    items: { product_id: string; quantity: number; unit_price: number; heat_number?: string }[]
  }) {
    const { data: so } = await supabase
      .from('sales_orders')
      .select('customer_id, currency')
      .eq('id', invoice.sales_order_id)
      .single()
    
    if (!so) return { data: null, error: new Error('Sales Order not found') }
    
    const invoice_number = await generateDocumentNumber('INV')
    
    const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const cgst = subtotal * 0.09
    const sgst = subtotal * 0.09
    const total_amount = subtotal + cgst + sgst
    
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number,
        sales_order_id: invoice.sales_order_id,
        dispatch_id: invoice.dispatch_id,
        customer_id: so.customer_id,
        currency: so.currency,
        subtotal,
        cgst,
        sgst,
        igst: 0,
        total_amount,
        due_date: invoice.due_date,
        status: 'draft',
        paid_amount: 0,
      })
      .select()
      .single()
    
    if (invoiceError) return { data: null, error: invoiceError }
    
    const itemsToInsert = invoice.items.map(item => ({
      invoice_id: invoiceData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      heat_number: item.heat_number,
    }))
    
    await supabase.from('invoice_items').insert(itemsToInsert)
    
    return { data: invoiceData, error: null }
  },
  
  async updateStatus(id: string, status: 'draft' | 'sent' | 'partial_paid' | 'paid' | 'overdue') {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

export const paymentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(id, invoice_number, customer:customers(id, name))
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async create(payment: {
    invoice_id: string
    amount: number
    payment_mode: 'cash' | 'cheque' | 'neft' | 'rtgs' | 'upi'
    reference_number?: string
    payment_date: string
  }) {
    const receipt_number = await generateDocumentNumber('RCP')
    
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        receipt_number,
        invoice_id: payment.invoice_id,
        amount: payment.amount,
        payment_mode: payment.payment_mode,
        reference_number: payment.reference_number,
        payment_date: payment.payment_date,
      })
      .select()
      .single()
    
    if (paymentError) return { data: null, error: paymentError }
    
    const { data: invoice } = await supabase
      .from('invoices')
      .select('paid_amount, total_amount')
      .eq('id', payment.invoice_id)
      .single()
    
    if (invoice) {
      const newPaidAmount = (invoice.paid_amount || 0) + payment.amount
      const newStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 'partial_paid'
      
      await supabase
        .from('invoices')
        .update({ paid_amount: newPaidAmount, status: newStatus })
        .eq('id', payment.invoice_id)
    }
    
    return { data: paymentData, error: null }
  },
}

export const ncrService = {
  async getAll() {
    const { data, error } = await supabase
      .from('ncr')
      .select(`
        *,
        product:products(id, name, code)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },
  
  async create(ncr: {
    product_id?: string
    heat_number?: string
    description: string
    grn_id?: string
    inventory_id?: string
  }) {
    const ncr_number = await generateDocumentNumber('NCR')
    
    const { data, error } = await supabase
      .from('ncr')
      .insert({
        ncr_number,
        product_id: ncr.product_id,
        heat_number: ncr.heat_number,
        description: ncr.description,
        grn_id: ncr.grn_id,
        inventory_id: ncr.inventory_id,
        status: 'open',
      })
      .select()
      .single()
    
    return { data, error }
  },
  
  async update(id: string, updates: {
    root_cause?: string
    corrective_action?: string
    status?: 'open' | 'under_investigation' | 'action_taken' | 'closed'
  }) {
    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
    
    if (updates.status === 'closed') {
      updateData.closed_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('ncr')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },
}

export const dashboardService = {
  async getStats() {
    const [
      { count: totalCustomers },
      { count: totalVendors },
      { count: openEnquiries },
      { count: pendingQuotations },
      { count: activeSalesOrders },
      { count: openNCRs },
      { data: invoices },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('quotations').select('*', { count: 'exact', head: true }).in('status', ['draft', 'pending_approval']),
      supabase.from('sales_orders').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'partial_dispatch']),
      supabase.from('ncr').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
      supabase.from('invoices').select('total_amount, paid_amount'),
    ])
    
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0
    const totalOutstanding = invoices?.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0) || 0
    
    return {
      totalCustomers: totalCustomers || 0,
      totalVendors: totalVendors || 0,
      openEnquiries: openEnquiries || 0,
      pendingQuotations: pendingQuotations || 0,
      activeSalesOrders: activeSalesOrders || 0,
      openNCRs: openNCRs || 0,
      totalRevenue,
      totalOutstanding,
    }
  },
  
  async getRecentOrders() {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    return { data, error }
  },
}
