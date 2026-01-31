
import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

async function listTables() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
    })
    await client.connect()

    const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `)

    console.log('Tables in public schema:')
    res.rows.forEach(row => console.log(`- ${row.table_name}`))

    await client.end()
}

listTables().catch(console.error)
