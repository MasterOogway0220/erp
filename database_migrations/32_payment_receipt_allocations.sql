-- Phase 11: Financials & Payment Receipts

-- 1. Payment Receipt Items (Allocations)
-- This allows one receipt to be allocated across multiple invoices
CREATE TABLE IF NOT EXISTS payment_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    receipt_id UUID REFERENCES payment_receipts(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Function to decrement customer outstanding
CREATE OR REPLACE FUNCTION decrement_customer_outstanding(p_customer_id UUID, p_amount DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE customers
    SET current_outstanding = COALESCE(current_outstanding, 0) - p_amount
    WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to process invoice payment
-- Updates paid_amount and status based on allocation
CREATE OR REPLACE FUNCTION process_invoice_payment(p_invoice_id UUID, p_payment_amount DECIMAL)
RETURNS void AS $$
DECLARE
    v_total_amount DECIMAL;
    v_paid_amount DECIMAL;
    v_new_paid_amount DECIMAL;
BEGIN
    SELECT total_amount, paid_amount INTO v_total_amount, v_paid_amount
    FROM invoices WHERE id = p_invoice_id;

    v_new_paid_amount := v_paid_amount + p_payment_amount;

    UPDATE invoices
    SET 
        paid_amount = v_new_paid_amount,
        status = CASE 
            WHEN v_new_paid_amount >= v_total_amount THEN 'paid'
            WHEN v_new_paid_amount > 0 THEN 'partial_paid'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS
ALTER TABLE payment_receipt_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view receipt items of their company" ON payment_receipt_items
    FOR SELECT USING (company_id::text = current_setting('app.current_company_id', true));

-- 6. Add updated_at to payment_receipts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_receipts' AND column_name='updated_at') THEN
        ALTER TABLE payment_receipts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 7. Modtime Trigger
DROP TRIGGER IF EXISTS update_payment_receipts_modtime ON payment_receipts;
CREATE TRIGGER update_payment_receipts_modtime BEFORE UPDATE ON payment_receipts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
