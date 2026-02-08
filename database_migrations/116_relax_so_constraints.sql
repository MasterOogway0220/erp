-- Migration: Relax constraints on Sales Orders
-- Purpose: Allow manual sales orders and optional buyer contacts
-- Date: 2026-02-08

ALTER TABLE sales_orders ALTER COLUMN quotation_id DROP NOT NULL;
ALTER TABLE sales_orders ALTER COLUMN buyer_id DROP NOT NULL;

-- Also ensure quotations can have null buyer_id for legacy data
ALTER TABLE quotations ALTER COLUMN buyer_id DROP NOT NULL;
