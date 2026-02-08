const pkg = require('pg');
const { Client } = pkg;
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function checkCounts() {
    const client = new Client({ connectionString });
    await client.connect();

    const tables = [
        'pipe_sizes',
        'product_specifications',
        'customers',
        'buyers',
        'vendors',
        'units_of_measure',
        'testing_standards',
        'currencies',
        'ports'
    ];

    console.log('--- Master Data record Counts ---');
    for (const table of tables) {
        try {
            const res = await client.query(`SELECT count(*) FROM ${table}`);
            console.log(`${table}: ${res.rows[0].count}`);
        } catch (err) {
            console.error(`Error checking ${table}:`, err.message);
        }
    }

    await client.end();
}

checkCounts().catch(console.error);
