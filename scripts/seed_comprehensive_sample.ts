
import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function seedComprehensive() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
    })
    await client.connect()

    // Get Company
    const companyRes = await client.query("SELECT id FROM companies LIMIT 1")
    const companyId = companyRes.rows[0]?.id

    if (!companyId) {
        console.error('No company found. Run migration first.')
        await client.end()
        return
    }

    console.log('Seeding Customers...')
    const customers = [
        ['Reliance Industries Ltd', 'Mumbai', '27AAACR1234A1Z1'],
        ['ONGC', 'Delhi', '07AAACR1234A1Z2'],
        ['Aramco Overseas Company', 'Dubai', null],
        ['BPCL', 'Mumbai', '27AAACB1234A1Z3'],
        ['IOCL', 'Delhi', '07AAACI1234A1Z4']
    ]

    for (const [name, city, gstin] of customers) {
        await client.query(`
            INSERT INTO customers (name, city, gst_number, company_id, is_active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT DO NOTHING;
        `, [name, city, gstin, companyId])
    }

    console.log('Seeding Buyers...')
    const customerList = await client.query("SELECT id, name FROM customers")
    const buyers = [
        ['Reliance Industries Ltd', 'Karan Shah', 'Purchase Manager', 'karan@reliance.com'],
        ['Reliance Industries Ltd', 'Uttam Sir', 'Operations Head', 'uttam@reliance.com'],
        ['ONGC', 'Amit Kumar', 'Procurement', 'amit@ongc.com'],
        ['Aramco Overseas Company', 'Mohammed bin Ali', 'Supply Chain', 'mohammed@aramco.com']
    ]

    for (const [custName, name, desig, email] of buyers) {
        const cust = customerList.rows.find(c => c.name === custName)
        if (cust) {
            const existing = await client.query("SELECT id FROM buyers WHERE email = $1", [email])
            if (existing.rows.length === 0) {
                await client.query(`
                    INSERT INTO buyers (customer_id, name, designation, email, is_active)
                    VALUES ($1, $2, $3, $4, true);
                `, [cust.id, name, desig, email])
            }
        }
    }

    console.log('Seeding Vendors...')
    const vendors = [
        ['Tata Steel Ltd', 'Jamshedpur', '20AAACT1234A1Z1', 'approved'],
        ['JSW Steel', 'Mumbai', '27AAACJ1234A1Z2', 'approved'],
        ['Jindal Stainless', 'Delhi', '07AAACJ1234A1Z3', 'approved'],
        ['SAIL', 'Kolkata', '19AAACS1234A1Z4', 'approved'],
        ['Vedanta Ltd', 'Goa', '30AAACV1234A1Z5', 'approved']
    ]

    for (const [name, city, gstin, status] of vendors) {
        await client.query(`
            INSERT INTO vendors (name, city, gst_number, is_approved, company_id, is_active)
            VALUES ($1, $2, $3, true, $4, true)
            ON CONFLICT DO NOTHING;
        `, [name, city, gstin, companyId])
    }

    await client.end()
    console.log('Comprehensive seeding completed.')
}

seedComprehensive().catch(console.error)
