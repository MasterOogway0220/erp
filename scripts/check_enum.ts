import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function checkEnum() {
    const client = new Client({ connectionString })
    await client.connect()
    const res = await client.query(`
        SELECT enumlabel 
        FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'inventory_status';
    `)
    console.log('Enum labels:', res.rows.map(r => r.enumlabel))
    await client.end()
}

checkEnum()
