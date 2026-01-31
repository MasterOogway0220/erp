
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function verifyCounts() {
    const client = new Client({ connectionString })
    await client.connect()

    const tables = ['pipe_sizes', 'products', 'inventory', 'testing_standards', 'currencies', 'ports'];

    for (const table of tables) {
        const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`${table}: ${res.rows[0].count} rows`);
    }

    await client.end()
}

verifyCounts().catch(console.error)
