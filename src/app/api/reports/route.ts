import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { searchParams } = new URL(request.url)
  const reportType = searchParams.get('type')
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')
  
  switch (reportType) {
    case 'conversion_ratio':
      return getConversionRatioReport(supabase, fromDate, toDate)
    case 'quotation_analysis':
      return getQuotationAnalysisReport(supabase, fromDate, toDate)
    case 'inventory_ageing':
      return getInventoryAgeingReport(supabase)
    case 'vendor_scorecard':
      return getVendorScorecardReport(supabase, fromDate, toDate)
    case 'payment_ageing':
      return getPaymentAgeingReport(supabase)
    case 'ncr_analysis':
      return getNCRAnalysisReport(supabase, fromDate, toDate)
    case 'delivery_performance':
      return getDeliveryPerformanceReport(supabase, fromDate, toDate)
    default:
      return getDashboardReport(supabase)
  }
}

async function getDashboardReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const [enquiries, quotations, salesOrders, invoices, inventory] = await Promise.all([
    supabase.from('enquiries').select('id, status').then(r => r.data || []),
    supabase.from('quotations').select('id, status, total').then(r => r.data || []),
    supabase.from('sales_orders').select('id, status, total').then(r => r.data || []),
    supabase.from('invoices').select('id, status, total, paid_amount').then(r => r.data || []),
    supabase.from('inventory').select('id, quantity, inspection_status').then(r => r.data || []),
  ])
  
  return apiSuccess({
    enquiries: {
      total: enquiries.length,
      open: enquiries.filter(e => e.status === 'open').length,
      quoted: enquiries.filter(e => e.status === 'quoted').length,
    },
    quotations: {
      total: quotations.length,
      pending: quotations.filter(q => q.status === 'pending_approval').length,
      approved: quotations.filter(q => q.status === 'approved').length,
      value: quotations.reduce((sum, q) => sum + (q.total || 0), 0),
    },
    salesOrders: {
      total: salesOrders.length,
      open: salesOrders.filter(so => so.status === 'open').length,
      value: salesOrders.reduce((sum, so) => sum + (so.total || 0), 0),
    },
    invoices: {
      total: invoices.length,
      outstanding: invoices.reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paid_amount || 0)), 0),
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
    },
    inventory: {
      total: inventory.length,
      pending_qc: inventory.filter(i => i.inspection_status === 'under_inspection').length,
      accepted: inventory.filter(i => i.inspection_status === 'accepted').length,
    },
  })
}

async function getConversionRatioReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, fromDate: string | null, toDate: string | null) {
  let enquiryQuery = supabase.from('enquiries').select('id, status, created_at')
  let quotationQuery = supabase.from('quotations').select('id, status, enquiry_id, created_at')
  let soQuery = supabase.from('sales_orders').select('id, quotation_id, created_at')
  
  if (fromDate) {
    enquiryQuery = enquiryQuery.gte('created_at', fromDate)
    quotationQuery = quotationQuery.gte('created_at', fromDate)
    soQuery = soQuery.gte('created_at', fromDate)
  }
  if (toDate) {
    enquiryQuery = enquiryQuery.lte('created_at', toDate)
    quotationQuery = quotationQuery.lte('created_at', toDate)
    soQuery = soQuery.lte('created_at', toDate)
  }
  
  const [enquiries, quotations, salesOrders] = await Promise.all([
    enquiryQuery.then(r => r.data || []),
    quotationQuery.then(r => r.data || []),
    soQuery.then(r => r.data || []),
  ])
  
  const enquiryToQuotation = enquiries.length > 0 
    ? (quotations.filter(q => q.enquiry_id).length / enquiries.length) * 100 
    : 0
  
  const quotationToOrder = quotations.length > 0 
    ? (salesOrders.length / quotations.length) * 100 
    : 0
  
  return apiSuccess({
    totalEnquiries: enquiries.length,
    totalQuotations: quotations.length,
    totalOrders: salesOrders.length,
    enquiryToQuotationRatio: enquiryToQuotation.toFixed(1),
    quotationToOrderRatio: quotationToOrder.toFixed(1),
    overallConversion: enquiries.length > 0 
      ? ((salesOrders.length / enquiries.length) * 100).toFixed(1) 
      : '0',
  })
}

async function getQuotationAnalysisReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, fromDate: string | null, toDate: string | null) {
  let query = supabase.from('quotations').select('id, status, total, currency, customer_id')
  
  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) query = query.lte('created_at', toDate)
  
  const { data: quotations } = await query
  
  const byStatus = quotations?.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  const approvedValue = quotations?.filter(q => q.status === 'approved' || q.status === 'sent' || q.status === 'accepted').reduce((sum, q) => sum + (q.total || 0), 0) || 0
  const rejectedValue = quotations?.filter(q => q.status === 'rejected').reduce((sum, q) => sum + (q.total || 0), 0) || 0
  
  return apiSuccess({
    total: quotations?.length || 0,
    byStatus,
    approvedValue,
    rejectedValue,
    successRate: quotations?.length ? ((byStatus['approved'] || 0) + (byStatus['sent'] || 0) + (byStatus['accepted'] || 0)) / quotations.length * 100 : 0,
  })
}

async function getInventoryAgeingReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: inventory } = await supabase
    .from('inventory')
    .select('id, product_id, heat_number, quantity, inspection_status, created_at, product:products(name)')
  
  const now = new Date()
  const ageing = inventory?.map(item => {
    const createdAt = new Date(item.created_at)
    const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    
    let bucket = '0-30 days'
    if (daysOld > 90) bucket = '90+ days'
    else if (daysOld > 60) bucket = '61-90 days'
    else if (daysOld > 30) bucket = '31-60 days'
    
    return { ...item, daysOld, bucket }
  }) || []
  
  const byBucket = ageing.reduce((acc, item) => {
    acc[item.bucket] = (acc[item.bucket] || 0) + item.quantity
    return acc
  }, {} as Record<string, number>)
  
  return apiSuccess({
    items: ageing,
    summary: byBucket,
    totalItems: inventory?.length || 0,
    oldStock: ageing.filter(i => i.daysOld > 60).length,
  })
}

async function getVendorScorecardReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, fromDate: string | null, toDate: string | null) {
  const { data: vendors } = await supabase.from('vendors').select('id, name, rating, is_approved')
  
  let poQuery = supabase.from('purchase_orders').select('id, vendor_id, status, delivery_date, created_at')
  let grnQuery = supabase.from('grn').select('id, purchase_order_id, received_date')
  
  if (fromDate) {
    poQuery = poQuery.gte('created_at', fromDate)
    grnQuery = grnQuery.gte('created_at', fromDate)
  }
  if (toDate) {
    poQuery = poQuery.lte('created_at', toDate)
    grnQuery = grnQuery.lte('created_at', toDate)
  }
  
  const [pos, grns] = await Promise.all([
    poQuery.then(r => r.data || []),
    grnQuery.then(r => r.data || []),
  ])
  
  const vendorScores = vendors?.map(vendor => {
    const vendorPOs = pos.filter(po => po.vendor_id === vendor.id)
    const vendorGRNs = grns.filter(grn => 
      vendorPOs.some(po => po.id === grn.purchase_order_id)
    )
    
    let onTimeDeliveries = 0
    vendorGRNs.forEach(grn => {
      const po = vendorPOs.find(p => p.id === grn.purchase_order_id)
      if (po && new Date(grn.received_date) <= new Date(po.delivery_date)) {
        onTimeDeliveries++
      }
    })
    
    const onTimeRate = vendorGRNs.length > 0 ? (onTimeDeliveries / vendorGRNs.length) * 100 : 0
    
    return {
      vendor: vendor.name,
      rating: vendor.rating,
      totalPOs: vendorPOs.length,
      completedDeliveries: vendorGRNs.length,
      onTimeDeliveryRate: onTimeRate.toFixed(1),
      isApproved: vendor.is_approved,
    }
  }) || []
  
  return apiSuccess(vendorScores)
}

async function getPaymentAgeingReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, customer_id, total, paid_amount, due_date, status, customer:customers(name)')
    .in('status', ['sent', 'partial_paid', 'overdue'])
  
  const now = new Date()
  const ageing = invoices?.map(inv => {
    const dueDate = new Date(inv.due_date)
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const outstanding = (inv.total || 0) - (inv.paid_amount || 0)
    
    let bucket = 'Current'
    if (daysOverdue > 90) bucket = '90+ days'
    else if (daysOverdue > 60) bucket = '61-90 days'
    else if (daysOverdue > 30) bucket = '31-60 days'
    else if (daysOverdue > 0) bucket = '1-30 days'
    
    return { ...inv, outstanding, daysOverdue, bucket }
  }) || []
  
  const byBucket = ageing.reduce((acc, inv) => {
    acc[inv.bucket] = (acc[inv.bucket] || 0) + inv.outstanding
    return acc
  }, {} as Record<string, number>)
  
  return apiSuccess({
    invoices: ageing,
    summary: byBucket,
    totalOutstanding: ageing.reduce((sum, i) => sum + i.outstanding, 0),
    overdueCount: ageing.filter(i => i.daysOverdue > 0).length,
  })
}

async function getNCRAnalysisReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, fromDate: string | null, toDate: string | null) {
  let query = supabase.from('ncr').select('id, status, description, created_at, product_id')
  
  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) query = query.lte('created_at', toDate)
  
  const { data: ncrs } = await query
  
  const byStatus = ncrs?.reduce((acc, ncr) => {
    acc[ncr.status] = (acc[ncr.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  return apiSuccess({
    total: ncrs?.length || 0,
    byStatus,
    openNCRs: byStatus['open'] || 0,
    closedNCRs: byStatus['closed'] || 0,
  })
}

async function getDeliveryPerformanceReport(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, fromDate: string | null, toDate: string | null) {
  let query = supabase.from('sales_orders').select('id, delivery_date, status, created_at, customer:customers(name)')
  let dispatchQuery = supabase.from('dispatches').select('id, sales_order_id, dispatch_date, status')
  
  if (fromDate) {
    query = query.gte('created_at', fromDate)
    dispatchQuery = dispatchQuery.gte('created_at', fromDate)
  }
  if (toDate) {
    query = query.lte('created_at', toDate)
    dispatchQuery = dispatchQuery.lte('created_at', toDate)
  }
  
  const [salesOrders, dispatches] = await Promise.all([
    query.then(r => r.data || []),
    dispatchQuery.then(r => r.data || []),
  ])
  
  let onTime = 0
  let late = 0
  
  salesOrders.forEach(so => {
    const soDispatches = dispatches.filter(d => d.sales_order_id === so.id && d.status === 'dispatched')
    if (soDispatches.length > 0) {
      const lastDispatch = soDispatches[soDispatches.length - 1]
      if (new Date(lastDispatch.dispatch_date) <= new Date(so.delivery_date)) {
        onTime++
      } else {
        late++
      }
    }
  })
  
  const total = onTime + late
  
  return apiSuccess({
    totalOrders: salesOrders.length,
    dispatchedOrders: total,
    onTimeDeliveries: onTime,
    lateDeliveries: late,
    onTimeRate: total > 0 ? ((onTime / total) * 100).toFixed(1) : '0',
  })
}
