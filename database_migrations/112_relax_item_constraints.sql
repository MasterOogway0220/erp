-- Part 3: Relaxing Item Constraints
-- SOLVES: "null value in column 'product_id' of relation 'quotation_items' violates not-null constraint"
-- This allows items to be identified by product_spec_id or product_name without requiring a master product_id.

ALTER TABLE quotation_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE sales_order_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE enquiry_items ALTER COLUMN product_id DROP NOT NULL;
