
import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

async function inspectTable(tableName: string) {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
    })
    await client.connect()

    console.log(`\n--- Inspecting Table: ${tableName} ---`)

    // Columns
    const colRes = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
    `)
    console.log('Columns:')
    console.table(colRes.rows)

    // Foreign Keys
    const fkRes = await client.query(`
        SELECT
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='${tableName}';
    `)
    console.log('Foreign Keys:')
    console.table(fkRes.rows)

    await client.end()
}

const table = process.argv[2]
if (table) {
    inspectTable(table).catch(console.error)
} else {
    console.log('Please provide a table name')
}
