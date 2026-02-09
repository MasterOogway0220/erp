
const path = require('path');
const fs = require('fs');
// Use absolute path to the module
const XLSX = require(path.join(process.cwd(), 'node_modules', 'xlsx', 'xlsx.js'));

const docsDir = path.join(process.cwd(), 'documents');
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

files.forEach(file => {
    const filePath = path.join(docsDir, file);
    console.log(`\n\n=== Inspecting: ${file} ===`);
    try {
        const workbook = XLSX.readFile(filePath);
        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n--- Sheet: ${sheetName} ---`);
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            for (let i = 0; i < Math.min(data.length, 15); i++) {
                if (data[i] && data[i].length > 0) {
                    console.log(`Row ${i}:`, JSON.stringify(data[i]));
                }
            }

            if (file.toLowerCase().includes('master') && data.length > 20) {
                const mid = Math.floor(data.length / 2);
                console.log('...');
                for (let i = mid; i < Math.min(mid + 3, data.length); i++) {
                    if (data[i] && data[i].length > 0) {
                        console.log(`Row ${i}:`, JSON.stringify(data[i]));
                    }
                }
            }
        });
    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});
