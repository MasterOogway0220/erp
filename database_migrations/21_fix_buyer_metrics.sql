-- Phase 3: Fix Buyer Metrics Trigger for Sales Orders

CREATE OR REPLACE FUNCTION update_buyer_metrics_from_so()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_id UUID;
BEGIN
    -- Use buyer_id directly from sales_orders
    v_buyer_id := COALESCE(NEW.buyer_id, OLD.buyer_id);

    IF v_buyer_id IS NOT NULL THEN
        UPDATE buyers SET
            total_orders = (
                SELECT COUNT(*) 
                FROM sales_orders 
                WHERE buyer_id = v_buyer_id
            ),
            total_order_value = (
                SELECT COALESCE(SUM(total_amount), 0) 
                FROM sales_orders
                WHERE buyer_id = v_buyer_id
            ),
            conversion_rate = CASE 
                WHEN (SELECT COUNT(*) FROM quotations WHERE buyer_id = v_buyer_id) > 0 THEN
                    (SELECT COUNT(*) FROM sales_orders WHERE buyer_id = v_buyer_id)::DECIMAL / 
                    (SELECT COUNT(*) FROM quotations WHERE buyer_id = v_buyer_id) * 100
                ELSE 0 
            END
        WHERE id = v_buyer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger just in case (though replacing function is usually enough, ensuring trigger exists is good)
DROP TRIGGER IF EXISTS trg_update_buyer_metrics_so ON sales_orders;
CREATE TRIGGER trg_update_buyer_metrics_so
AFTER INSERT OR UPDATE OR DELETE ON sales_orders
FOR EACH ROW EXECUTE FUNCTION update_buyer_metrics_from_so();
