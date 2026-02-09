
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

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

files.forEach(file => {
    const filePath = path.join(docsDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`\n\n=== Inspecting: ${file} ===`);
        const workbook = XLSX.readFile(filePath);

        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n--- Sheet: ${sheetName} ---`);
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (data.length > 0) {
                // Log headers and first few rows
                for (let i = 0; i < Math.min(data.length, 15); i++) {
                    if (data[i] && data[i].length > 0) {
                        console.log(`Row ${i}:`, JSON.stringify(data[i]));
                    }
                }

                // For long sheets, log some rows from the middle
                if (data.length > 30) {
                    const mid = Math.floor(data.length / 2);
                    console.log('...');
                    for (let i = mid; i < Math.min(mid + 3, data.length); i++) {
                        if (data[i] && data[i].length > 0) {
                            console.log(`Row ${i}:`, JSON.stringify(data[i]));
                        }
                    }
                }
            }
        });
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
