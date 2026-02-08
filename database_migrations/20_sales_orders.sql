-- Phase 3: Sales Order Management

-- Create update_modified_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    quotation_id UUID REFERENCES quotations(id), -- Nullable if created directly
    customer_id UUID REFERENCES customers(id) NOT NULL,
    buyer_id UUID REFERENCES buyers(id) NOT NULL,
    
    order_number VARCHAR(50) NOT NULL, -- Format: SO/24-25/001
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    customer_po_number VARCHAR(100) NOT NULL,
    customer_po_date DATE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, processing, ready_for_dispatch, part_dispatched, dispatched, completed, cancelled
    currency VARCHAR(10) DEFAULT 'INR',
    
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    payment_terms TEXT,
    delivery_terms TEXT,
    
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL, -- Consignee details (REQ-SO-003)
    
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT uq_sales_order_number_company UNIQUE (company_id, order_number)
);

-- 2. Sales Order Items Table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    quotation_item_id UUID, -- Link back to quotation item if applicable
    product_id UUID REFERENCES products(id), -- Nullable for custom items
    
    description TEXT NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    
    uom VARCHAR(20),
    hsn_code VARCHAR(20),
    
    metadata JSONB, -- For generic data storage (specs, size, make etc.)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(sales_order_id);

-- 4. RLS Policies
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales orders of their company" ON sales_orders
    FOR SELECT USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY "Users can create sales orders for their company" ON sales_orders
    FOR INSERT WITH CHECK (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY "Users can update sales orders of their company" ON sales_orders
    FOR UPDATE USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY "Users can view sales order items of their company" ON sales_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_orders 
            WHERE sales_orders.id = sales_order_items.sales_order_id 
            AND sales_orders.company_id::text = current_setting('app.current_company_id', true)
        )
    );

CREATE POLICY "Users can insert sales order items for their company" ON sales_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales_orders 
            WHERE sales_orders.id = sales_order_items.sales_order_id 
            AND sales_orders.company_id::text = current_setting('app.current_company_id', true)
        )
    );

CREATE POLICY "Users can update sales order items for their company" ON sales_order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sales_orders 
            WHERE sales_orders.id = sales_order_items.sales_order_id 
            AND sales_orders.company_id::text = current_setting('app.current_company_id', true)
        )
    );

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS update_sales_orders_modtime ON sales_orders;
CREATE TRIGGER update_sales_orders_modtime
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
