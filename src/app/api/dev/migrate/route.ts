
import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Client } = pkg;
import * as path from 'path';
import * as fs from 'fs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    if (!fileName) return NextResponse.json({ error: 'No file specified' }, { status: 400 });

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const filePath = path.join(process.cwd(), 'database_migrations', fileName);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
        }
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        await client.end();
        return NextResponse.json({ success: true, message: `Executed ${fileName}` });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
