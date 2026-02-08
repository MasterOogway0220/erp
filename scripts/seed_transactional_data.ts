
import { Client } from 'pg'
import * as dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config({ path: '.env.local' })

async function seedTransactions() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
    })
    await client.connect()

    // 1. Fetch Master Data
    const companies = (await client.query("SELECT id FROM companies")).rows
    const customers = (await client.query("SELECT id FROM customers")).rows
    const buyers = (await client.query("SELECT id, customer_id FROM buyers")).rows
    const products = (await client.query("SELECT id, name, base_price FROM products LIMIT 50")).rows
    const vendors = (await client.query("SELECT id FROM vendors WHERE is_approved = true")).rows
    const profiles = (await client.query("SELECT id FROM profiles LIMIT 1")).rows
    const employees = (await client.query("SELECT id FROM employees LIMIT 5")).rows

    if (companies.length === 0 || customers.length === 0 || products.length === 0 || profiles.length === 0) {
        console.error('Missing required master data. Seed that first.')
        await client.end()
        return
    }

    const companyId = companies[0].id
    const userId = profiles[0].id
    const empId = employees[0]?.id

    console.log('Cleaning up existing transactional data...')
    const tablesToTruncate = [
        'invoice_items', 'invoices',
        'grn_items', 'grn',
        'purchase_order_items', 'purchase_orders',
        'sales_order_items', 'sales_orders',
        'quotation_items', 'quotation_revisions', 'quotation_terms', 'quotations',
        'enquiry_items', 'enquiries'
    ]
    for (const table of tablesToTruncate) {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`)
    }
    for (let i = 1; i <= 10; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)]
        const buyer = buyers.find(b => b.customer_id === customer.id) || buyers[0]
        const enqId = uuidv4()
        const enqNum = `ENQ-2026-${i.toString().padStart(4, '0')}`

        await client.query(`
            INSERT INTO enquiries (id, enquiry_number, customer_id, buyer_id, status, remarks, created_by, company_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [enqId, enqNum, customer.id, buyer.id, 'open', 'Stock requirement', userId, companyId])

        // Enquiry Items
        const numItems = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numItems; j++) {
            const product = products[Math.floor(Math.random() * products.length)]
            await client.query(`
                INSERT INTO enquiry_items (enquiry_id, product_id, quantity)
                VALUES ($1, $2, $3)
            `, [enqId, product.id, Math.floor(Math.random() * 100) + 10])
        }

        // 2. Some Enquiries lead to Quotations
        if (i <= 7) {
            console.log(`Generating Quotation for ${enqNum}...`)
            const quoteId = uuidv4()
            const quoteNum = `QTN-2026-${i.toString().padStart(4, '0')}`
            const subtotal = Math.floor(Math.random() * 500000) + 50000
            const tax = subtotal * 0.18
            const total = subtotal + tax

            await client.query(`
                INSERT INTO quotations (id, quotation_number, enquiry_id, customer_id, buyer_id, subtotal, tax_amount, total_amount, status, created_by, company_id, valid_until)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', $9, $10, NOW() + interval '30 days')
            `, [quoteId, quoteNum, enqId, customer.id, buyer.id, subtotal, tax, total, userId, companyId])

            // Quotation Items
            await client.query(`
                INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, line_total)
                SELECT $1, product_id, quantity, 1000, quantity * 1000 FROM enquiry_items WHERE enquiry_id = $2
            `, [quoteId, enqId])

            // 3. Some Quotations lead to Sales Orders
            if (i <= 5) {
                console.log(`Generating Sales Order for ${quoteNum}...`)
                const soId = uuidv4()
                const soNum = `SO-2026-${i.toString().padStart(4, '0')}`

                await client.query(`
                    INSERT INTO sales_orders (id, order_number, quotation_id, customer_id, subtotal, tax_amount, total_amount, status, created_by, company_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'in_progress', $8, $9)
                `, [soId, soNum, quoteId, customer.id, subtotal, tax, total, userId, companyId])

                // SO Items
                await client.query(`
                    INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
                    SELECT $1, product_id, quantity, unit_price FROM quotation_items WHERE quotation_id = $2
                `, [soId, quoteId])

                // 4. Some SOs lead to Purchase Orders
                if (i <= 3) {
                    console.log(`Generating Purchase Order for SO ${soNum}...`)
                    const poId = uuidv4()
                    const poNum = `PO-2026-${i.toString().padStart(4, '0')}`
                    const vendor = vendors[Math.floor(Math.random() * vendors.length)]

                    await client.query(`
                        INSERT INTO purchase_orders (id, po_number, vendor_id, sales_order_id, subtotal, tax_amount, total_amount, status, created_by, company_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, 'partial_received', $8, $9)
                    `, [poId, poNum, vendor.id, soId, subtotal * 0.8, (subtotal * 0.8) * 0.18, (subtotal * 0.8) * 1.18, userId, companyId])

                    // PO Items
                    await client.query(`
                        INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
                        SELECT $1, product_id, quantity, unit_price * 0.8 FROM sales_order_items WHERE sales_order_id = $2
                    `, [poId, soId])

                    // 5. Some POs lead to GRN
                    if (i <= 2) {
                        console.log(`Generating GRN for PO ${poNum}...`)
                        const grnId = uuidv4()
                        const grnNum = `GRN-2026-${i.toString().padStart(4, '0')}`

                        await client.query(`
                            INSERT INTO grn (id, grn_number, purchase_order_id, received_date, status, created_by, company_id)
                            VALUES ($1, $2, $3, NOW(), 'inspected', $4, $5)
                        `, [grnId, grnNum, poId, userId, companyId])

                        // GRN Items
                        await client.query(`
                            INSERT INTO grn_items (grn_id, product_id, received_quantity, heat_number)
                            SELECT $1, product_id, quantity, 'HT-' || floor(random()*90000 + 10000) FROM purchase_order_items WHERE purchase_order_id = $2
                        `, [grnId, poId])
                    }
                }

                // 6. Some SOs lead to Invoices
                if (i <= 4) {
                    console.log(`Generating Invoice for SO ${soNum}...`)
                    const invId = uuidv4()
                    const invNum = `INV-2026-${i.toString().padStart(4, '0')}`

                    await client.query(`
                        INSERT INTO invoices (id, invoice_number, sales_order_id, customer_id, total_amount, status, created_by, company_id, due_date)
                        VALUES ($1, $2, $3, $4, $5, 'partial_paid', $6, $7, NOW() + interval '30 days')
                    `, [invId, invNum, soId, customer.id, total, userId, companyId])

                    // Invoice Items
                    await client.query(`
                        INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, line_total)
                        SELECT $1, product_id, quantity, unit_price, quantity * unit_price FROM sales_order_items WHERE sales_order_id = $2
                    `, [invId, soId])
                }
            }
        }
    }

    await client.end()
    console.log('Transactional seeding completed successfully.')
}

seedTransactions().catch(console.error)
