import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
    const docsDir = path.join(process.cwd(), 'documents');
    const files = [
        'EXPORT QUOTATION FORMAT-1.xlsx',
        'INVENTORY MASTER - LATEST.xlsx',
        'PIPES SIZE MASTER CS & AS PIPES.xlsx',
        'PIPES SIZE MASTER SS & DS PIPES.xlsx',
        'PRODUCT SPEC MASTER - 1.xlsx',
        'TESTING MASTER FOR LAB LETTER.xlsx',
        'PIPES QUOTATION FORMAT (2).xlsx'
    ];

    const results: any[] = [];

    for (const file of files) {
        const filePath = path.join(docsDir, file);
        try {
            if (!fs.existsSync(filePath)) {
                results.push({ file, error: 'File does not exist at ' + filePath });
                continue;
            }

            const buffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const fileResults: any = { file, sheets: [] };

            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const rows = data.slice(0, 30);
                fileResults.sheets.push({
                    name: sheetName,
                    rowCount: data.length,
                    sampleRows: rows
                });
            });
            results.push(fileResults);
        } catch (err: any) {
            results.push({ file, error: err.message, stack: err.stack });
        }
    }

    return NextResponse.json(results);
}
