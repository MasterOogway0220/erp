
import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Client } = pkg;

export async function GET() {
    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const counts = {
            pipe_sizes: (await client.query('SELECT COUNT(*) FROM pipe_sizes')).rows[0].count,
            products: (await client.query('SELECT COUNT(*) FROM products')).rows[0].count,
            testing_standards: (await client.query('SELECT COUNT(*) FROM testing_standards')).rows[0].count,
            terms_conditions: (await client.query('SELECT COUNT(*) FROM terms_conditions')).rows[0].count,
            inventory: (await client.query('SELECT COUNT(*) FROM inventory')).rows[0].count
        };
        await client.end();
        return NextResponse.json({ success: true, counts });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
