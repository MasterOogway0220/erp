import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
console.log('Connecting to:', connectionString)

async function listAllTables() {
    const client = new Client({
        connectionString,
    })
    await client.connect()

    const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `)

    console.log('Tables:', res.rows.map((r: any) => r.table_name))

    await client.end()
}

listAllTables().catch(console.error)
