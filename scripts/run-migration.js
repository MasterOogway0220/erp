const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const sqlFilePath = process.argv[2];
    if (!sqlFilePath) {
        console.error('Please provide a path to the SQL file');
        process.exit(1);
    }

    const sql = fs.readFileSync(path.resolve(sqlFilePath), 'utf8');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log(`Executing migration: ${sqlFilePath}`);
        await client.query(sql);
        console.log('Migration executed successfully');
    } catch (err) {
        console.error('Error executing migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
