import { z } from 'zod'

const nullableUuid = z.preprocess(
  (val) => (val === "" ? null : val),
  z.string().uuid().optional().nullable()
)

export const enquiryItemSchema = z.object({
  product_id: nullableUuid,
  quantity: z.number().positive(),
  specifications: z.string().optional().nullable(),
})

export const createEnquirySchema = z.object({
  customer_id: z.string().uuid(),
  buyer_id: nullableUuid, // ISO 8.2.1: Track specific buyer contact
  items: z.array(enquiryItemSchema).min(1, "At least one item is required"),
  remarks: z.string().optional().nullable(),
})


export const quotationItemSchema = z.object({
  product_id: nullableUuid,
  product_spec_id: nullableUuid,
  pipe_size_id: nullableUuid,
  product_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  uom_id: nullableUuid,
  size: z.string().optional(),
  schedule: z.string().optional(),
  wall_thickness: z.number().optional(),
  weight_per_mtr: z.number().optional(),
  total_weight: z.number().optional(),
  auto_calculated_weight: z.number().optional(),
  grade: z.string().optional().nullable(),
  // New Technical Fields
  tag_no: z.string().optional().nullable(),
  dwg_no: z.string().optional().nullable(),
  dimension_tolerance: z.string().optional().nullable(),
  dm_type: z.string().optional().nullable(),
  wt_type: z.string().optional().nullable(),
  length_individual: z.number().optional().nullable(),
  no_of_tubes: z.number().optional().nullable(),
})

export const quotationTermSchema = z.object({
  term_id: z.string().uuid(),
  custom_text: z.string().optional().nullable(),
  display_order: z.number().optional(),
})

export const createQuotationSchema = z.object({
  enquiry_id: nullableUuid,
  customer_id: z.string().uuid(),
  buyer_id: nullableUuid,
  bank_detail_id: nullableUuid, // New field linking to company_bank_details
  project_name: z.string().optional().nullable(),
  quotation_type: z.enum(['STANDARD', 'NON_STANDARD']).default('STANDARD'),
  market_type: z.enum(['DOMESTIC', 'EXPORT']).default('DOMESTIC'),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  currency: z.string().default('INR'),
  exchange_rate: z.number().optional().default(1),
  valid_until: z.string().optional().nullable(),
  validity_days: z.number().optional().default(15),
  remarks: z.string().optional().nullable(),
  terms: z.array(quotationTermSchema).optional(),
  parent_quotation_id: nullableUuid,
  packing_charges: z.number().min(0).optional().default(0),
  freight_charges: z.number().min(0).optional().default(0),
  other_charges: z.number().min(0).optional().default(0),
  total_weight: z.number().min(0).optional().default(0),
  // Export Fields
  port_of_loading_id: nullableUuid,
  port_of_discharge_id: nullableUuid,
  vessel_name: z.string().optional().nullable(),
  enquiry_reference: z.string().optional().nullable(),
  attention: z.string().optional().nullable(),
  incoterms: z.string().optional().nullable(),
  material_origin: z.string().optional().nullable(),
  tt_charges: z.number().optional().nullable(),
  tpi_charges: z.number().optional().nullable(),
  certification: z.string().optional().nullable(),
  part_orders: z.string().optional().nullable(),
  testing_standards: z.array(z.string().uuid()).optional().default([]),
  status: z.enum(['draft', 'pending_approval']).optional().default('draft'),
})
  .refine((data) => {
    // Calculate total from items to ensure it's greater than 0
    const itemsTotal = data.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price * (1 - (item.discount || 0) / 100))
    }, 0)
    const total = itemsTotal + (data.packing_charges || 0) + (data.freight_charges || 0) + (data.other_charges || 0)
    return total > 0
  }, {
    message: "Total amount must be greater than 0. Please check item prices and quantities.",
    path: ["items"]
  })
  .refine((data) => {
    // Exchange rate must be > 0 for non-INR currencies
    if (data.currency && data.currency !== 'INR') {
      return (data.exchange_rate || 0) > 0
    }
    return true
  }, {
    message: "Exchange rate must be greater than 0 for non-INR currencies",
    path: ["exchange_rate"]
  })
  .refine((data) => {
    // Valid until date must be today or in the future
    if (data.valid_until) {
      const validUntil = new Date(data.valid_until)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return validUntil >= today
    }
    return true
  }, {
    message: "Valid until date must be today or in the future",
    path: ["valid_until"]
  })
  .refine((data) => {
    // Domestic quotations must be in INR
    if (data.market_type === 'DOMESTIC') {
      return data.currency === 'INR'
    }
    return true
  }, {
    message: "Domestic quotations must be in INR",
    path: ["currency"]
  })

export const approveQuotationSchema = z.object({
  approved: z.boolean(),
  remarks: z.string().optional().nullable(),
})

export const createSalesOrderSchema = z.object({
  quotation_id: nullableUuid,
  customer_po_number: z.string().min(1, "Customer PO number is required"),
  delivery_date: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
})

export const purchaseOrderItemSchema = z.object({
  product_id: nullableUuid,
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  heat_number: z.string().optional().nullable(),
  so_item_id: nullableUuid,
})

export const createPurchaseOrderSchema = z.object({
  vendor_id: nullableUuid,
  sales_order_id: nullableUuid,
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
  delivery_date: z.string(),
  remarks: z.string().optional().nullable(),
})

export const grnItemSchema = z.object({
  purchase_order_item_id: z.string().uuid(),
  product_id: z.string().uuid(),
  received_quantity: z.number().min(0),
  heat_number: z.string().min(1, "Heat number is required"),
})

export const createGRNSchema = z.object({
  purchase_order_id: z.string().uuid(),
  items: z.array(grnItemSchema).min(1, "At least one item is required"),
  received_by: z.string().min(1, "Received by is required"),
  mtc_file_url: z.string().url("MTC document is mandatory for ISO 7.5.3 compliance"), // ISO 7.5.3
  remarks: z.string().optional(),
})


export const inspectionSchema = z.object({
  grn_id: nullableUuid,
  inventory_id: nullableUuid,
  result: z.enum(['accepted', 'rejected', 'hold']),
  checklist: z.array(z.object({
    parameter: z.string(),
    specification: z.string(),
    actual_value: z.string(),
    result: z.enum(['pass', 'fail']),
  })).optional().nullable(),
  test_results: z.array(z.object({
    test_standard_id: z.string().uuid(),
    parameter_name: z.string(),
    specification: z.string(),
    actual_value: z.string(),
    result: z.enum(['pass', 'fail']),
    remarks: z.string().optional(),
  })).optional(),
  remarks: z.string().optional(),
})

export const dispatchItemSchema = z.object({
  inventory_id: nullableUuid,
  product_id: nullableUuid,
  sales_order_item_id: nullableUuid,
  quantity: z.number().positive(),
  heat_number: z.string(),
})

export const createDispatchSchema = z.object({
  sales_order_id: nullableUuid,
  items: z.array(dispatchItemSchema).min(1, "At least one item is required"),
  vehicle_number: z.string().optional().nullable(),
  driver_name: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
})

export const createInvoiceSchema = z.object({
  dispatch_id: z.string().uuid(),
  due_date: z.string(),
  remarks: z.string().optional(),
})

export const paymentAllocationSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
})

export const createPaymentReceiptSchema = z.object({
  customer_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_mode: z.enum(['cash', 'cheque', 'neft', 'rtgs', 'upi', 'wire']),
  reference_number: z.string().optional().nullable(),
  receipt_date: z.string(),
  bank_details: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  allocations: z.array(paymentAllocationSchema).min(1, "At least one allocation is required").optional().nullable(),
})

export const statusTransitions: Record<string, Record<string, string[]>> = {
  enquiry: {
    open: ['quoted', 'closed'],
    quoted: ['closed'],
    closed: [],
  },
  quotation: {
    draft: ['pending_approval'],
    pending_approval: ['approved', 'rejected'],
    approved: ['sent'],
    sent: ['accepted', 'rejected', 'expired'],
    accepted: [],
    rejected: [],
    expired: [],
  },
  sales_order: {
    draft: ['open', 'cancelled'],
    open: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['partial_dispatch', 'partially_dispatched', 'ready_for_dispatch', 'cancelled'],
    ready_for_dispatch: ['dispatched', 'cancelled'],
    partial_dispatch: ['completed', 'cancelled'],
    partially_dispatched: ['completed', 'cancelled'],
    dispatched: ['completed'],
    completed: [],
    cancelled: [],
  },
  purchase_order: {
    draft: ['approved'],
    approved: ['sent'],
    sent: ['partial_received', 'received', 'cancelled'],
    partial_received: ['received', 'cancelled'],
    received: ['closed'],
    closed: [],
    cancelled: [],
  },
  grn: {
    pending_inspection: ['inspected'],
    inspected: ['completed'],
    completed: [],
  },
  dispatch: {
    pending: ['dispatched'],
    dispatched: ['delivered'],
    delivered: [],
  },
  invoice: {
    draft: ['sent'],
    sent: ['partial_paid', 'paid', 'overdue'],
    partial_paid: ['paid', 'overdue'],
    paid: [],
    overdue: ['partial_paid', 'paid'],
  },
}

export function isValidStatusTransition(entity: string, currentStatus: string, newStatus: string): boolean {
  const transitions = statusTransitions[entity]
  if (!transitions) return false
  const allowedNext = transitions[currentStatus]
  if (!allowedNext) return false
  return allowedNext.includes(newStatus)
}

// Company Master Schema
export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  company_type: z.enum(['Proprietorship', 'Partnership', 'LLP', 'Limited', 'Pvt Ltd', 'HUF']),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  tan: z.string().optional(),
  cin: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  registered_address_line1: z.string().optional(),
  registered_address_line2: z.string().optional(),
  registered_city: z.string().optional(),
  registered_state: z.string().optional(),
  registered_pincode: z.string().optional(),
  registered_country: z.string().default('India'),
  warehouse_address_line1: z.string().optional(),
  warehouse_address_line2: z.string().optional(),
  warehouse_city: z.string().optional(),
  warehouse_state: z.string().optional(),
  warehouse_pincode: z.string().optional(),
  warehouse_country: z.string().default('India'),
  current_financial_year: z.string().optional(),
})

// Employee Master Schema
export const createEmployeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  employee_code: z.string().optional(),
  email: z.string().email("Invalid email address"),
  mobile: z.string().optional(),
  telephone: z.string().optional(),
  department: z.enum(['Sales', 'Purchase', 'Quality', 'Warehouse', 'Accounts', 'Admin', 'Management']),
  designation: z.string().optional(),
  company_id: z.string().uuid().optional(),
  reporting_manager_id: z.string().uuid().optional().nullable(),
  date_of_joining: z.string().optional().nullable(),
})

// Buyer Master Schema
export const createBuyerSchema = z.object({
  customer_id: z.string().uuid(),
  buyer_name: z.string().min(1, "Buyer name is required").max(100),
  designation: z.string().max(50).optional(),
  email: z.string().email("Invalid email address").optional(),
  mobile: z.string().max(20).optional(),
  opening_balance: z.number().optional(), // Marking optional as it might not be provided on creation
  is_active: z.boolean().default(true),
})

