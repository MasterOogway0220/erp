import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function inspectTable(tableName: string) {
    const client = new Client({ connectionString })
    await client.connect()
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
    `)
    console.log(`Columns for ${tableName}:`, res.rows)
    await client.end()
}

const tableArg = process.argv[2]

if (tableArg) {
    inspectTable(tableArg).catch(console.error)
} else {
    inspectTable('products').catch(console.error)
    inspectTable('inventory').catch(console.error)
    inspectTable('customers').catch(console.error)
}
