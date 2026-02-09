
import pkg from 'pg';
const { Client } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runMigrations() {
    const migrations = [
        'database_migrations/21_quotation_details_v2.sql',
        'database_migrations/22_company_bank_details.sql'
    ];

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        for (const migrationPath of migrations) {
            console.log(`Executing migration: ${migrationPath}`);
            const sql = fs.readFileSync(path.resolve(migrationPath), 'utf8');
            await client.query(sql);
            console.log(`Migration ${migrationPath} executed successfully`);
        }
    } catch (err) {
        console.error('Error executing migrations:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
