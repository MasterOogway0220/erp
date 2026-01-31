import pkg from 'pg';
const { Client } = pkg;
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function seedAllPipeSizes() {
    const client = new Client({ connectionString });
    await client.connect();

    const baseDir = 'e:/freelance/erp/erp/documents';
    const files = [
        { name: 'PIPES SIZE MASTER CS & AS PIPES.xlsx', material: 'CS' },
        { name: 'PIPES SIZE MASTER SS & DS PIPES.xlsx', material: 'SS' }
    ];

    console.log('Seeding all pipe sizes...');

    for (const f of files) {
        const filePath = path.join(baseDir, f.name);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Headers are likely on row 1 or 2. Let's find them.
        let dataStarted = false;
        for (const row of data) {
            if (row.length < 3) continue;

            // Check if it's a data row (size, od, sch etc)
            const size = String(row[0]).trim();
            const od = parseFloat(String(row[1]));

            if (size.includes('"') || size.includes('/') || !isNaN(od)) {
                if (isNaN(od)) continue; // Not a data row yet

                // Process row
                const size_inch = size.replace(/"/g, '');
                const od_mm = od;
                const schedule = String(row[2]).trim();
                const wall_thickness_mm = parseFloat(String(row[3]));
                const weight_kg_per_m = parseFloat(String(row[4]));

                if (!isNaN(wall_thickness_mm)) {
                    await client.query(`
                        INSERT INTO pipe_sizes (material_type, size_inch, od_mm, schedule, wall_thickness_mm, weight_kg_per_m)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT DO NOTHING
                    `, [f.material, size_inch, od_mm, schedule, wall_thickness_mm, weight_kg_per_m]);
                }
            }
        }
        console.log(`Processed ${f.name}`);
    }

    console.log('All pipe sizes seeded.');
    await client.end();
}

seedAllPipeSizes().catch(console.error);
