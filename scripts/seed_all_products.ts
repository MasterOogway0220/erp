import pkg from 'pg';
const { Client } = pkg;
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function seedAllProducts() {
    const client = new Client({ connectionString });
    await client.connect();

    const filePath = 'e:/freelance/erp/erp/documents/PRODUCT SPEC MASTER - 1.xlsx';
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        await client.end();
        return;
    }

    console.log('Seeding products from spec master...');

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    let currentCategory = '';

    for (const row of data) {
        if (!row || row.length === 0) continue;

        const col0 = String(row[0] || '').trim();
        const grade = String(row[1] || '').trim();

        if (col0 && !grade) {
            // Likely a category header
            currentCategory = col0;
            continue;
        }

        if (grade) {
            // It's a product
            const name = grade;
            const category = currentCategory || 'Other';

            // Clean name for code
            const cleanGrade = grade.replace(/[^a-zA-Z0-9]/g, '-');
            const catPrefix = category.split(' ')[0].substring(0, 3).toUpperCase();
            const code = `${catPrefix}-${cleanGrade}`;

            const unit = 'MTR'; // Default for pipes
            const hsn = '7304';

            await client.query(`
                INSERT INTO products (name, code, category, unit, hsn_code, is_active)
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT (code) DO NOTHING
            `, [name, code, category, unit, hsn]);
        }
    }

    console.log('Product seeding completed.');
    await client.end();
}

seedAllProducts().catch(console.error);
