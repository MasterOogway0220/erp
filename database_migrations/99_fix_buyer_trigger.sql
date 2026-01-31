-- Fix ambiguous total_amount reference in buyer metrics triggers

CREATE OR REPLACE FUNCTION update_buyer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- We use COALESCE and subqueries to get the latest counts for the buyer
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
        SELECT COALESCE(SUM(so.total_amount), 0) -- Specified so.total_amount
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
                SELECT COALESCE(SUM(so.total_amount), 0) -- Specified so.total_amount
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
