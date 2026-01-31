import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function checkConstraints() {
    const client = new Client({ connectionString })
    await client.connect()
    const res = await client.query(`
        SELECT conname, contype, amname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        LEFT JOIN pg_index i ON i.indrelid = t.oid AND i.indisunique
        LEFT JOIN pg_am am ON am.oid = i.indrelid
        WHERE t.relname = 'vendors';
    `)
    // Simpler query for unique indices
    const res2 = await client.query(`
        SELECT
            indexname,
            indexdef
        FROM
            pg_indexes
        WHERE
            tablename = 'vendors';
    `)
    console.log('Indexes for vendors:', res2.rows)
    await client.end()
}

checkConstraints().catch(console.error)
