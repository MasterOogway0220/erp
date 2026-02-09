
import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Client } = pkg;
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const step = searchParams.get('step');
    const logs: string[] = [];
    const connectionString = process.env.DATABASE_URL;
    const docsDir = path.join(process.cwd(), 'documents');

    const client = new Client({ connectionString });
    try {
        await client.connect();

        if (step === 'pipe-sizes') {
            await client.query('TRUNCATE TABLE pipe_sizes CASCADE');
            await loadPipeSizes(client, 'PIPES SIZE MASTER CS & AS PIPES.xlsx', ['CS', 'AS'], logs, docsDir);
            await loadPipeSizes(client, 'PIPES SIZE MASTER SS & DS PIPES.xlsx', ['SS', 'DS'], logs, docsDir);
        } else if (step === 'testing') {
            await client.query('TRUNCATE TABLE testing_standards CASCADE');
            await loadTestingStandards(client, 'TESTING MASTER FOR LAB LETTER.xlsx', logs, docsDir);
        } else if (step === 'products') {
            await client.query('TRUNCATE TABLE products CASCADE');
            // Primary Product Master
            await loadProductsFromXls(client, 'PRODUCT SPEC MASTER - 1.xlsx', logs, docsDir);
            // Also extract products from Solapur Quotation formats
            await loadProductsFromQuotation(client, 'PIPES QUOTATION FORMAT (2).xlsx', logs, docsDir);
        } else if (step === 'inventory') {
            await client.query('TRUNCATE TABLE inventory CASCADE');
            await loadInventory(client, 'INVENTORY MASTER - LATEST.xlsx', logs, docsDir);
        } else if (step === 'terms') {
            await client.query('TRUNCATE TABLE terms_conditions CASCADE');
            await loadStandardTerms(client, logs);
        } else {
            return NextResponse.json({ success: false, error: 'Invalid step' });
        }

        await client.end();
        return NextResponse.json({ success: true, step, logs });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message, logs });
    }
}

async function loadPipeSizes(client: any, fileName: string, materialTypes: string[], logs: string[], docsDir: string) {
    const filePath = path.join(docsDir, fileName);
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    let count = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 4) continue;
        const sizeInch = String(row[0] || '').trim();
        const odMm = parseFloat(row[1]) || 0;
        const schedule = String(row[2] || '').trim();
        const wtMm = parseFloat(row[3]) || 0;
        const weight = parseFloat(row[4]) || 0;
        if (!sizeInch) continue;
        for (const mat of materialTypes) {
            await client.query(`INSERT INTO pipe_sizes (material_type, size_inch, od_mm, schedule, wall_thickness_mm, weight_kg_per_m) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`, [mat, sizeInch, odMm, schedule, wtMm, weight]);
            count++;
        }
    }
    logs.push(`Imported ${count} pipe sizes from ${fileName}`);
}

async function loadTestingStandards(client: any, fileName: string, logs: string[], docsDir: string) {
    const filePath = path.join(docsDir, fileName);
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    let count = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 1) continue;
        const name = String(row[0] || '').trim();
        if (!name) continue;
        await client.query(`INSERT INTO testing_standards (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
        count++;
    }
    logs.push(`Imported ${count} testing standards`);
}

async function loadProductsFromXls(client: any, fileName: string, logs: string[], docsDir: string) {
    const filePath = path.join(docsDir, fileName);
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let totalCount = 0;
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        let sheetCount = 0;
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 2) continue;
            const name = String(row[0] || '').trim();
            const material = String(row[1] || '').trim();
            const addSpec = String(row[2] || '').trim();
            const ends = String(row[3] || '').trim();
            const len = String(row[4] || '').trim();
            if (!name || name === 'Product Name' || material === 'Material') continue;
            const code = `PROD-${material.replace(/[^a-zA-Z0-9]/g, '-')}-${name.substring(0, 3).toUpperCase()}-${sheetName.replace(/\s/g, '_')}-${i}`;
            await client.query(`INSERT INTO products (name, code, specification, additional_spec, ends, length_range, category, unit, is_active) VALUES ($1, $2, $3, $4, $5, $6, 'Pipes', 'Nos', true) ON CONFLICT (code) DO NOTHING`, [name, code, material, addSpec, ends, len]);
            sheetCount++;
        }
        logs.push(`Imported ${sheetCount} products from sheet: ${sheetName}`);
        totalCount += sheetCount;
    }
}

async function loadProductsFromQuotation(client: any, fileName: string, logs: string[], docsDir: string) {
    const filePath = path.join(docsDir, fileName);
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let totalCount = 0;
    for (const sheetName of workbook.SheetNames) {
        if (!sheetName.startsWith('Solapur')) continue;
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        let sheetCount = 0;
        for (let i = 5; i < data.length; i++) { // Start from data row
            const row = data[i];
            if (!row || row.length < 5 || row[0] === 'Total') continue;
            const item = String(row[3] || '').trim();
            const material = String(row[4] || '').trim();
            if (!item || !material) continue;
            const code = `PROD-${material.replace(/[^a-zA-Z0-9]/g, '-')}-${item.substring(0, 3).toUpperCase()}-${sheetName.replace(/\s/g, '_')}-${i}`;
            await client.query(`INSERT INTO products (name, code, specification, category, unit, is_active) VALUES ($1, $2, $3, 'Pipes', 'Nos', true) ON CONFLICT (code) DO NOTHING`, [item, code, material]);
            sheetCount++;
        }
        logs.push(`Imported ${sheetCount} products from Solapur sheet: ${sheetName}`);
        totalCount += sheetCount;
    }
}

async function loadInventory(client: any, fileName: string, logs: string[], docsDir: string) {
    const filePath = path.join(docsDir, fileName);
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    const productRes = await client.query('SELECT id, name, specification FROM products');
    const products = productRes.rows;
    let count = 0;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 10) continue;
        const form = String(row[0] || '').trim();
        const type = String(row[1] || '').trim();
        const spec = String(row[2] || '').trim();
        const heat = String(row[8] || '').trim();
        const make = String(row[9] || '').trim();
        const qty = parseFloat(row[10]) || 0;
        const pieces = parseInt(row[11]) || 0;

        if (!spec || qty === 0) continue;

        let product = products.find(p => p.specification === spec);

        // Lenient match: check if spec is part of any product spec
        if (!product) {
            product = products.find(p => spec.includes(p.specification) || p.specification.includes(spec));
        }

        // Auto-create product if still not found
        if (!product) {
            const name = type || form || 'Pipe';
            const code = `AUTO-${spec.replace(/[^a-zA-Z0-9]/g, '-')}`;
            // Check if this auto-product was already created in this run
            const existingRes = await client.query('SELECT id FROM products WHERE code = $1', [code]);
            if (existingRes.rows.length > 0) {
                product = { id: existingRes.rows[0].id };
            } else {
                const res = await client.query(`INSERT INTO products (name, code, specification, category, unit, is_active) VALUES ($1, $2, $3, 'Pipes', 'Nos', true) ON CONFLICT (code) DO UPDATE SET specification = EXCLUDED.specification RETURNING id`, [name, code, spec]);
                product = { id: res.rows[0].id };
                logs.push(`Auto-created product for spec: ${spec}`);
            }
        }

        await client.query(`INSERT INTO inventory (product_id, heat_number, manufacturer, quantity, available_quantity, pieces, inspection_status) VALUES ($1, $2, $3, $4, $4, $5, 'under_inspection')`, [product.id, heat, make, qty, pieces]);
        count++;
    }
    logs.push(`Imported ${count} inventory batches`);
}

async function loadStandardTerms(client: any, logs: string[]) {
    const terms = [
        { category: 'PRICE', title: 'Price Basis', description: 'Ex-work, Navi Mumbai, India/Jebel Ali, UAE' },
        { category: 'DELIVERY', title: 'Delivery Timeline', description: 'As above, ex-works, after receipt of PO' },
        { category: 'PAYMENT', title: 'Standard Payment', description: '100% within 30 Days from date of dispatch' },
        { category: 'VALIDITY', title: 'Offer Validity', description: '6 Days, subject to stock remain unsold' },
        { category: 'PACKING', title: 'Packing', description: 'Inclusive' },
        { category: 'FREIGHT', title: 'Freight', description: 'Extra at actual / To your account' },
        { category: 'INSURANCE', title: 'Insurance', description: 'Extra at actual / To your account' },
        { category: 'CERTIFICATION', title: 'Certification', description: 'EN 10204 3.1' },
        { category: 'PAYMENT', title: 'T/T Charges', description: 'To your account, Full Invoice amount to be remitted' },
        { category: 'INSPECTION', title: 'Third Party Inspection', description: 'If any required that all charges Extra At Actual' },
        { category: 'TESTING', title: 'Testing Charges', description: 'If any required that all charges Extra At Actual' },
        { category: 'ORIGIN', title: 'Material Origin', description: 'India/Canada' },
        { category: 'TOLERANCE', title: 'Qty. Tolerance', description: '-0 / +1 Random Length' },
        { category: 'TOLERANCE', title: 'Dimension Tolerance', description: 'As per manufacture' },
        { category: 'OTHER', title: 'Part Orders', description: 'Subject reconfirm with N-PIPE' }
    ];
    for (const t of terms) {
        await client.query(`INSERT INTO terms_conditions (category, title, description, is_default, is_active) VALUES ($1, $2, $3, true, true)`, [t.category, t.title, t.description]);
    }
    logs.push(`Imported ${terms.length} standard terms`);
}
