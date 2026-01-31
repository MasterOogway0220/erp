
import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function seedData() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
    })
    await client.connect()

    console.log('Seeding Companies...')
    const companyRes = await client.query(`
        INSERT INTO companies (name, company_type, gstin, email, is_active)
        VALUES ('Steel Master ERP Solutions', 'Pvt Ltd', '27AAAAA0000A1Z5', 'info@steelerp.com', true)
        ON CONFLICT DO NOTHING
        RETURNING id;
    `)

    const companyId = companyRes.rows[0]?.id || (await client.query("SELECT id FROM companies LIMIT 1")).rows[0]?.id;

    if (companyId) {
        console.log(`Seeding Employees for company ${companyId}...`)
        await client.query(`
            INSERT INTO employees (full_name, first_name, last_name, email, department, designation, company_id, employee_code, is_active)
            VALUES 
            ('Admin User', 'Admin', 'User', 'admin@steelerp.com', 'Management', 'System Administrator', '${companyId}', 'EMP001', true),
            ('John Doe', 'John', 'Doe', 'john@steelerp.com', 'Sales', 'Sales Manager', '${companyId}', 'EMP002', true)
            ON CONFLICT DO NOTHING;
        `)

        console.log('Approving some vendors...')
        await client.query(`
            UPDATE vendors SET is_approved = true WHERE is_approved IS NOT TRUE;
        `)

        console.log('Linking products to company...')
        await client.query(`
            UPDATE products SET company_id = '${companyId}' WHERE company_id IS NULL;
        `)

        console.log('Linking customers to company...')
        await client.query(`
            UPDATE customers SET company_id = '${companyId}' WHERE company_id IS NULL;
        `)
    }

    await client.end()
    console.log('Seeding completed successfully.')
}

seedData().catch(console.error)
