-- Week 1: Foundation & Master Enhancements

-- 1. Employee Enhancements
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50) UNIQUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_joining DATE;

-- 2. Buyer Enhancements
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS is_primary_contact BOOLEAN DEFAULT false;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS total_enquiries INTEGER DEFAULT 0;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS total_quotations INTEGER DEFAULT 0;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS total_order_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0;

-- 3. Customer Enhancements
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS material_code_prefix VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(200);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS delivery_terms VARCHAR(200);

-- 4. Buyer Performance Triggers
CREATE OR REPLACE FUNCTION update_buyer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- We use COALESCE and subqueries to get the latest counts for the buyer
  -- This handles both increments and decrements (if a quote/order is deleted)
  UPDATE buyers SET
    total_enquiries = (SELECT COUNT(*) FROM enquiries WHERE buyer_id = COALESCE(NEW.buyer_id, OLD.buyer_id)),
    total_quotations = (SELECT COUNT(*) FROM quotations WHERE buyer_id = COALESCE(NEW.buyer_id, OLD.buyer_id)),
    total_orders = (
        SELECT COUNT(*) 
        FROM sales_orders so 
        JOIN quotations q ON so.quotation_id = q.id 
        WHERE q.buyer_id = COALESCE(NEW.buyer_id, OLD.buyer_id)
    ),
    total_order_value = (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM sales_orders so
        JOIN quotations q ON so.quotation_id = q.id
        WHERE q.buyer_id = COALESCE(NEW.buyer_id, OLD.buyer_id)
    ),
    conversion_rate = CASE 
        WHEN (SELECT COUNT(*) FROM quotations WHERE buyer_id = COALESCE(NEW.buyer_id, OLD.buyer_id)) > 0 THEN
            (SELECT COUNT(*) FROM sales_orders so 
             JOIN quotations q ON so.quotation_id = q.id 
             WHERE q.buyer_id = COALESCE(NEW.buyer_id, OLD.buyer_id))::DECIMAL / 
            (SELECT COUNT(*) FROM quotations WHERE buyer_id = COALESCE(NEW.buyer_id, OLD.buyer_id)) * 100
        ELSE 0 
    END
  WHERE id = COALESCE(NEW.buyer_id, OLD.buyer_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for Quotations
DROP TRIGGER IF EXISTS trg_update_buyer_metrics_quotations ON quotations;
CREATE TRIGGER trg_update_buyer_metrics_quotations
AFTER INSERT OR UPDATE OR DELETE ON quotations
FOR EACH ROW EXECUTE FUNCTION update_buyer_metrics();

-- Note: Since Sales Orders link to Quotations (which link to Buyers), 
-- changes in sales_orders should also trigger an update for the buyer.
-- However, we need to find the buyer_id from the quotation.

CREATE OR REPLACE FUNCTION update_buyer_metrics_from_so()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_id UUID;
BEGIN
    -- Find the buyer_id from the linked quotation
    SELECT buyer_id INTO v_buyer_id 
    FROM quotations 
    WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);

    IF v_buyer_id IS NOT NULL THEN
        UPDATE buyers SET
            total_orders = (
                SELECT COUNT(*) 
                FROM sales_orders so 
                JOIN quotations q ON so.quotation_id = q.id 
                WHERE q.buyer_id = v_buyer_id
            ),
            total_order_value = (
                SELECT COALESCE(SUM(total_amount), 0) 
                FROM sales_orders so
                JOIN quotations q ON so.quotation_id = q.id
                WHERE q.buyer_id = v_buyer_id
            ),
            conversion_rate = CASE 
                WHEN (SELECT COUNT(*) FROM quotations WHERE buyer_id = v_buyer_id) > 0 THEN
                    (SELECT COUNT(*) FROM sales_orders so 
                     JOIN quotations q ON so.quotation_id = q.id 
                     WHERE q.buyer_id = v_buyer_id)::DECIMAL / 
                    (SELECT COUNT(*) FROM quotations WHERE buyer_id = v_buyer_id) * 100
                ELSE 0 
            END
        WHERE id = v_buyer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_buyer_metrics_so ON sales_orders;
CREATE TRIGGER trg_update_buyer_metrics_so
AFTER INSERT OR UPDATE OR DELETE ON sales_orders
FOR EACH ROW EXECUTE FUNCTION update_buyer_metrics_from_so();
