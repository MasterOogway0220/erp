/**
 * Excel to CSV Converter for Master Data
 * 
 * Converts Excel files to CSV format for import via the web UI
 * 
 * Usage: node scripts/convert-excel-to-csv.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertExcelToCSV(inputPath, outputPath) {
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    fs.writeFileSync(outputPath, csv);
    console.log(`✅ Converted: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
}

function main() {
    console.log('🔄 Converting Excel files to CSV...\n');

    const conversions = [
        {
            input: 'documents/PIPES SIZE MASTER CS & AS PIPES.xlsx',
            output: 'documents/csv/pipe_sizes_cs_as.csv'
        },
        {
            input: 'documents/PIPES SIZE MASTER SS & DS PIPES.xlsx',
            output: 'documents/csv/pipe_sizes_ss_ds.csv'
        },
        {
            input: 'documents/PRODUCT SPEC MASTER - 1.xlsx',
            output: 'documents/csv/product_specs.csv'
        },
        {
            input: 'documents/INVENTORY MASTER - LATEST.xlsx',
            output: 'documents/csv/inventory.csv'
        }
    ];

    // Create output directory
    const outputDir = path.join(__dirname, '../documents/csv');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    conversions.forEach(({ input, output }) => {
        const inputPath = path.join(__dirname, '..', input);
        const outputPath = path.join(__dirname, '..', output);

        if (fs.existsSync(inputPath)) {
            convertExcelToCSV(inputPath, outputPath);
        } else {
            console.log(`⚠️  File not found: ${input}`);
        }
    });

    console.log('\n✅ Conversion complete!');
    console.log('\nCSV files are in: documents/csv/');
    console.log('\nNext steps:');
    console.log('1. Go to http://localhost:3000/masters/import');
    console.log('2. Upload the CSV files one by one');
    console.log('3. Review and confirm each import');
}

if (require.main === module) {
    main();
}
