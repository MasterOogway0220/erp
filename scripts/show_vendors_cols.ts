import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function showCols() {
    const client = new Client({ connectionString })
    await client.connect()
    const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'vendors'
        ORDER BY ordinal_position;
    `)
    console.log('Columns:', res.rows.map(r => r.column_name))
    await client.end()
}

showCols()
