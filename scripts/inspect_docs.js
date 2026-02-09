const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

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
        try {
            const workbook = XLSX.readFile(filePath);

            workbook.SheetNames.forEach(sheetName => {
                console.log(`\n--- Sheet: ${sheetName} ---`);
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (data.length > 0) {
                    for (let i = 0; i < Math.min(data.length, 25); i++) {
                        if (data[i] && data[i].length > 0) {
                            console.log(`Row ${i}:`, JSON.stringify(data[i]));
                        }
                    }

                    if (data.length > 50) {
                        const mid = Math.floor(data.length / 2);
                        console.log('...');
                        for (let i = mid; i < Math.min(mid + 5, data.length); i++) {
                            if (data[i] && data[i].length > 0) {
                                console.log(`Row ${i}:`, JSON.stringify(data[i]));
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error(`Error reading ${file}:`, err.message);
        }
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
