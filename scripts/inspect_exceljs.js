const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function inspect() {
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

    for (const file of files) {
        const filePath = path.join(docsDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`\n\n=== Inspecting: ${file} ===`);
            try {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);

                workbook.eachSheet((worksheet, sheetId) => {
                    console.log(`\n--- Sheet: ${worksheet.name} ---`);

                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                        if (rowNumber <= 20 || (rowNumber > worksheet.rowCount / 2 && rowNumber <= worksheet.rowCount / 2 + 3)) {
                            console.log(`Row ${rowNumber}:`, JSON.stringify(row.values));
                        }
                        if (rowNumber === 21 && worksheet.rowCount > 21) {
                            console.log('...');
                        }
                    });
                });
            } catch (err) {
                console.error(`Error reading ${file}:`, err.message);
            }
        } else {
            console.log(`File not found: ${filePath}`);
        }
    }
}

inspect();
