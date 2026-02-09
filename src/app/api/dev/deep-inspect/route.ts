
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file') || 'PIPES QUOTATION FORMAT (2).xlsx';
    try {
        const filePath = path.join(process.cwd(), 'documents', file);
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const results: any[] = [];
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 20);
            results.push({ sheetName, data });
        }
        return NextResponse.json({ success: true, results });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
