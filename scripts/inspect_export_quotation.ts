
import * as XLSX from 'xlsx';
import * as path from 'path';

const docsDir = '/Users/adi0220/projects/erp_software/documents';
const file = 'EXPORT QUOTATION FORMAT-1.xlsx';
const filePath = path.join(docsDir, file);

const workbook = XLSX.readFile(filePath);
console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`--- Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (data.length > 0) {
        console.log('Headers:', data[0]);
        if (data.length > 1) {
            console.log('Sample Data (Row 1):', data[1]);
        }
    }
});
