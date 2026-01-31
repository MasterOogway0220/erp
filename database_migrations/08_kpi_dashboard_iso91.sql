-- Migration: Configurable KPI Dashboard (ISO 9.1)

-- 1. Table for available KPI widgets
CREATE TABLE kpi_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'ENQUIRY_CONVERSION'
  title VARCHAR(100) NOT NULL,
  description TEXT,
  chart_type VARCHAR(20) DEFAULT'bar', -- 'bar', 'line', 'pie', 'stat'
  category VARCHAR(50), -- 'SALES', 'PURCHASE', 'QUALITY', 'INVENTORY'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for user dashboard preferences
CREATE TABLE user_dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  widget_id UUID REFERENCES kpi_widgets(id) NOT NULL,
  position_index INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1, -- 1 = half, 2 = full
  is_visible BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, widget_id)
);

-- 3. Seed initial KPI widgets
INSERT INTO kpi_widgets (key, title, description, chart_type, category) VALUES
('ENQUIRY_CONVERSION', 'Enquiry to Quotation', 'Conversion rate of enquries into quotations', 'stat', 'SALES'),
('QUOTATION_SUCCESS', 'Quotation Success Rate', 'Percentage of quotations converted to Sales Orders', 'pie', 'SALES'),
('INVENTORY_VALUATION', 'Inventory Valuation', 'Total value of stock by category', 'bar', 'INVENTORY'),
('QC_PERFORMANCE', 'QC Inspection Time', 'Average days for material inspection', 'line', 'QUALITY'),
('VENDOR_ON_TIME', 'Vendor On-Time Delivery', 'Performance of vendors based on expected delivery dates', 'bar', 'PURCHASE'),
('NCR_RATIO', 'NCR Ratio', 'Non-conformance reports vs total receipts', 'pie', 'QUALITY'),
('PAYMENT_AGEING', 'Payment Ageing', 'Outstanding invoices by age bracket', 'bar', 'FINANCE');

-- Enable RLS
ALTER TABLE kpi_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Policies for widgets (visible to all users)
CREATE POLICY "Everyone can view KPI widgets" ON kpi_widgets FOR SELECT TO authenticated USING (true);

-- Policies for user configs (users only see their own)
CREATE POLICY "Users can manage their own dashboard configs" ON user_dashboard_configs
  FOR ALL TO authenticated USING (auth.uid() = user_id);
