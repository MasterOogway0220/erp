
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'documents', 'PRODUCT SPEC MASTER - 1.xlsx');
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        return NextResponse.json({ success: true, sheets: workbook.SheetNames });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
