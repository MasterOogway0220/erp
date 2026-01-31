import { z } from 'zod'

export const enquiryItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  specifications: z.string().optional(),
})

export const createEnquirySchema = z.object({
  customer_id: z.string().uuid(),
  buyer_id: z.string().uuid().optional(), // ISO 8.2.1: Track specific buyer contact
  items: z.array(enquiryItemSchema).min(1, "At least one item is required"),
  remarks: z.string().optional(),
})


export const quotationItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  product_spec_id: z.string().uuid().optional().nullable(),
  pipe_size_id: z.string().uuid().optional().nullable(),
  product_name: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  uom_id: z.string().uuid().optional(),
  size: z.string().optional(),
  schedule: z.string().optional(),
  wall_thickness: z.number().optional(),
  weight_per_mtr: z.number().optional(),
  total_weight: z.number().optional(),
  auto_calculated_weight: z.number().optional(),
  grade: z.string().optional(),
})

export const quotationTermSchema = z.object({
  term_id: z.string().uuid(),
  custom_text: z.string().optional(),
  display_order: z.number().optional(),
})

export const createQuotationSchema = z.object({
  enquiry_id: z.string().uuid().optional(),
  customer_id: z.string().uuid(),
  buyer_id: z.string().uuid().optional(),
  project_name: z.string().optional(),
  quotation_type: z.enum(['STANDARD', 'NON_STANDARD']).default('STANDARD'),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  currency: z.string().default('INR'),
  exchange_rate: z.number().optional().default(1),
  valid_until: z.string(),
  validity_days: z.number().optional(),
  remarks: z.string().optional(),
  terms: z.array(quotationTermSchema).optional(),
  parent_quotation_id: z.string().uuid().optional(),
  packing_charges: z.number().min(0).optional().default(0),
  freight_charges: z.number().min(0).optional().default(0),
  other_charges: z.number().min(0).optional().default(0),
  total_weight: z.number().min(0).optional().default(0),
  // Export Fields
  port_of_loading_id: z.string().uuid().optional().nullable(),
  port_of_discharge_id: z.string().uuid().optional().nullable(),
  vessel_name: z.string().optional().nullable(),
  testing_standards: z.array(z.string().uuid()).optional().default([]),
})

export const approveQuotationSchema = z.object({
  approved: z.boolean(),
  remarks: z.string().optional(),
})

export const createSalesOrderSchema = z.object({
  quotation_id: z.string().uuid(),
  customer_po_number: z.string().min(1, "Customer PO number is required"),
  delivery_date: z.string(),
  remarks: z.string().optional(),
})

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  heat_number: z.string().optional(),
})

export const createPurchaseOrderSchema = z.object({
  vendor_id: z.string().uuid(),
  sales_order_id: z.string().uuid().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
  delivery_date: z.string(),
  remarks: z.string().optional(),
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
  grn_id: z.string().uuid(),
  inventory_id: z.string().uuid(),
  result: z.enum(['accepted', 'rejected', 'hold']),
  checklist: z.array(z.object({
    parameter: z.string(),
    specification: z.string(),
    actual_value: z.string(),
    result: z.enum(['pass', 'fail']),
  })),
  remarks: z.string().optional(),
})

export const dispatchItemSchema = z.object({
  inventory_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  heat_number: z.string(),
})

export const createDispatchSchema = z.object({
  sales_order_id: z.string().uuid(),
  items: z.array(dispatchItemSchema).min(1, "At least one item is required"),
  vehicle_number: z.string().optional(),
  driver_name: z.string().optional(),
  remarks: z.string().optional(),
})

export const createInvoiceSchema = z.object({
  dispatch_id: z.string().uuid(),
  due_date: z.string(),
  remarks: z.string().optional(),
})

export const createPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_mode: z.enum(['cash', 'cheque', 'neft', 'rtgs', 'upi']),
  reference_number: z.string().optional(),
  payment_date: z.string(),
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
    open: ['in_progress', 'cancelled'],
    in_progress: ['partial_dispatch', 'completed', 'cancelled'],
    partial_dispatch: ['completed', 'cancelled'],
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
  name: z.string().min(1, "Buyer name is required"),
  designation: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional(),
  telephone: z.string().optional(),
  is_primary_contact: z.boolean().default(false),
})

