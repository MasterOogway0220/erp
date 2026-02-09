
import pkg from 'pg';
const { Client } = pkg;
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
const docsDir = path.join(process.cwd(), 'documents');

async function loadMasters() {
    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log('--- Starting Master Data Load ---');

        // Clear existing data to ensure only Excel values are used (as per user request)
        await client.query('TRUNCATE TABLE testing_standards CASCADE');

        // 1. Load Pipe Sizes (CS & AS)
        await loadPipeSizes(client, 'PIPES SIZE MASTER CS & AS PIPES.xlsx', ['CS', 'AS']);

        // 2. Load Pipe Sizes (SS & DS)
        await loadPipeSizes(client, 'PIPES SIZE MASTER SS & DS PIPES.xlsx', ['SS', 'DS']);

        // 3. Load Testing Standards
        await loadTestingStandards(client, 'TESTING MASTER FOR LAB LETTER.xlsx');

        // 4. Load Products
        await loadProducts(client, 'PRODUCT SPEC MASTER - 1.xlsx');

        // 5. Load Inventory
        await loadInventory(client, 'INVENTORY MASTER - LATEST.xlsx');

        console.log('--- Master Data Load Completed ---');
    } catch (error) {
        console.error('Error loading masters:', error);
    } finally {
        await client.end();
    }
}

async function loadPipeSizes(client: any, fileName: string, materialTypes: string[]) {
    const filePath = path.join(docsDir, fileName);
    if (!fs.existsSync(filePath)) return;

    console.log(`Loading Pipe Sizes from ${fileName}...`);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 5) continue;

        const sizeInch = String(row[0] || '').trim();
        const odMm = parseFloat(row[1]) || 0;
        const schedule = String(row[2] || '').trim();
        const wallThickness = parseFloat(row[3]) || 0;
        const weight = parseFloat(row[4]) || 0;

        if (!sizeInch) continue;

        for (const mat of materialTypes) {
            await client.query(`
                INSERT INTO pipe_sizes (material_type, size_inch, od_mm, schedule, wall_thickness_mm, weight_kg_per_m)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT DO NOTHING
            `, [mat, sizeInch, odMm, schedule, wallThickness, weight]);
        }
    }
}

async function loadTestingStandards(client: any, fileName: string) {
    const filePath = path.join(docsDir, fileName);
    if (!fs.existsSync(filePath)) return;

    console.log(`Loading Testing Standards from ${fileName}...`);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 1) continue;

        const testName = String(row[0] || '').trim();
        if (!testName) continue;

        await client.query(`
            INSERT INTO testing_standards (name)
            VALUES ($1)
            ON CONFLICT (name) DO NOTHING
        `, [testName]);
    }
}

async function loadProducts(client: any, fileName: string) {
    const filePath = path.join(docsDir, fileName);
    if (!fs.existsSync(filePath)) return;

    console.log(`Loading Products from ${fileName}...`);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 2) continue;

        const name = String(row[0] || '').trim();
        const material = String(row[1] || '').trim();
        const additionalSpec = String(row[2] || '').trim();
        const ends = String(row[3] || '').trim();
        const lengthRange = String(row[4] || '').trim();

        if (!name || !material) continue;

        // Generate a code if not exists
        const code = `PROD-${material.replace(/[^a-zA-Z0-9]/g, '-')}-${name.substring(0, 3).toUpperCase()}`;

        await client.query(`
            INSERT INTO products (name, code, specification, additional_spec, ends, length_range, category, unit, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, 'Pipes', 'Nos', true)
            ON CONFLICT (code) DO UPDATE SET
                specification = EXCLUDED.specification,
                additional_spec = EXCLUDED.additional_spec,
                ends = EXCLUDED.ends,
                length_range = EXCLUDED.length_range,
                unit = EXCLUDED.unit
        `, [name, code, material, additionalSpec, ends, lengthRange]);
    }
}

async function loadInventory(client: any, fileName: string) {
    const filePath = path.join(docsDir, fileName);
    if (!fs.existsSync(filePath)) return;

    console.log(`Loading Inventory from ${fileName}...`);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Get all products to link
    const productRes = await client.query('SELECT id, name, specification FROM products');
    const products = productRes.rows;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 10) continue;

        const form = String(row[0] || '').trim();
        const type = String(row[1] || '').trim();
        const spec = String(row[2] || '').trim();
        const addSpec = String(row[3] || '').trim();
        const dimension = String(row[4] || '').trim();
        const size = String(row[5] || '').trim();
        const ends = String(row[6] || '').trim();
        const length = String(row[7] || '').trim();
        const heatNo = String(row[8] || '').trim();
        const make = String(row[9] || '').trim();
        const quantity = parseFloat(row[10]) || 0;
        const pieces = parseInt(row[11]) || 0;
        const mtcNo = String(row[12] || '').trim();
        const mtcDateRaw = row[13];
        const mtcType = String(row[14] || '').trim();
        const location = String(row[15] || '').trim();
        const tpi = String(row[16] || '').trim();
        const notes = String(row[17] || '').trim();

        if (!spec || quantity === 0) continue;

        // Try to match product by spec
        let product = products.find(p => p.specification === spec);

        if (!product) {
            // Create product on the fly if needed?
            // For now, let's use a generic product or skip
            // console.warn(`Product not found for spec: ${spec}. Skipping.`);
            continue;
        }

        let mtcDate = null;
        if (mtcDateRaw) {
            if (typeof mtcDateRaw === 'number') {
                mtcDate = new Date((mtcDateRaw - 25569) * 86400 * 1000);
            } else {
                mtcDate = new Date(mtcDateRaw);
            }
        }

        await client.query(`
            INSERT INTO inventory (
                product_id, heat_number, manufacturer, quantity, available_quantity, 
                pieces, mtc_number, mtc_date, mtc_type, rack_location, tpi, notes, inspection_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'under_inspection')
        `, [product.id, heatNo, make, quantity, quantity, pieces, mtcNo, mtcDate, mtcType, location, tpi, notes]);
    }
}

loadMasters().catch(console.error);
