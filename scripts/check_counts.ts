
import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkCounts() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
    })
    await client.connect()

    const tables = [
        'companies', 'employees', 'buyers', 'customers', 'vendors',
        'products', 'purchase_orders', 'sales_orders', 'quotations',
        'units_of_measure', 'inventory'
    ]

    console.log('Row counts:')
    for (const table of tables) {
        try {
            const res = await client.query(`SELECT COUNT(*) FROM ${table}`)
            console.log(`${table}: ${res.rows[0].count}`)
        } catch (e) {
            console.log(`${table}: Error or missing`)
        }
    }

    await client.end()
}

checkCounts().catch(console.error)
