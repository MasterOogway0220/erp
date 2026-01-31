
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const docsDir = '/Users/adi0220/projects/erp_software/documents';
const files = [
    'EXPORT QUOTATION FORMAT-1.xlsx',
    'INVENTORY MASTER - LATEST.xlsx',
    'PIPES SIZE MASTER CS & AS PIPES.xlsx',
    'PIPES SIZE MASTER SS & DS PIPES.xlsx',
    'PRODUCT SPEC MASTER - 1.xlsx',
    'TESTING MASTER FOR LAB LETTER.xlsx'
];

files.forEach(file => {
    const filePath = path.join(docsDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`--- ${file} ---`);
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (data.length > 0) {
            console.log('Headers (Row 0):', data[0]);
            if (data.length > 1) {
                console.log('Sample Data (Row 1):', data[1]);
            }
        }
        console.log('\n');
    } else {
        console.log(`File not found: ${file}`);
    }
});
