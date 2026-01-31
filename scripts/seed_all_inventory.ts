import pkg from 'pg';
const { Client } = pkg;
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function seedAllInventory() {
    const client = new Client({ connectionString });
    await client.connect();

    const filePath = 'e:/freelance/erp/erp/documents/INVENTORY MASTER - LATEST.xlsx';
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        await client.end();
        return;
    }

    console.log('Seeding inventory from master...');

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Get all products for matching
    const productRes = await client.query('SELECT id, name, code FROM products');
    const products = productRes.rows;

    for (const row of data) {
        if (!row || row.length < 5) continue;

        const cat = String(row[0] || '').trim();
        const grade = String(row[2] || '').trim();
        const size = String(row[5] || '').trim();
        const heatNo = String(row[8] || '').trim();
        const manufacturer = String(row[9] || '').trim();
        const weightStr = String(row[10] || '').trim();
        const qtyStr = String(row[11] || '').trim();

        if (!grade || grade === 'Grade') continue; // Header or empty

        // Find matching product
        // Try exact match on name
        let product = products.find(p => p.name.toLowerCase() === grade.toLowerCase());

        // If not found, try fuzzy match (if product name is part of grade or vice versa)
        if (!product) {
            product = products.find(p => grade.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(grade.toLowerCase()));
        }

        if (product) {
            const quantity = parseFloat(weightStr) || 0;
            const available = quantity;
            const mtc = String(row[14] || '').trim();
            const location = 'Main Warehouse';

            if (quantity > 0) {
                await client.query(`
                    INSERT INTO inventory (
                        product_id, 
                        heat_number, 
                        manufacturer, 
                        quantity, 
                        available_quantity, 
                        rack_location,
                        mtc_number,
                        inspection_status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'accepted')
                `, [product.id, heatNo, manufacturer, quantity, available, location, mtc]);
            }
        } else {
            // If no product found, maybe we should create one? 
            // For now just log it.
            // console.warn(`No product found for grade: ${grade}`);
        }
    }

    console.log('Inventory seeding completed.');
    await client.end();
}

seedAllInventory().catch(console.error);
