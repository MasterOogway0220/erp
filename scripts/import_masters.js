const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function importPipeSizes(filePath, materialType) {
    console.log(`Importing ${materialType} from ${filePath}...`);
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Found ${data.length} rows.`);

        // Standardize mapping based on the known columns in the Excel file
        // material_type,size_inch,od_mm,schedule,wall_thickness_mm,weight_kg_per_m
        const items = data.map(row => ({
            material_type: materialType,
            size_inch: row['Size (inch)'] || row['SIZE'] || row['size'] || '',
            od_mm: parseFloat(row['OD (mm)'] || row['OD'] || 0),
            schedule: row['SCH'] || row['Schedule'] || '',
            wall_thickness_mm: parseFloat(row['WT (mm)'] || row['WT'] || row['Wall Thickness'] || 0),
            weight_kg_per_m: parseFloat(row['WEIGHT (kg/m)'] || row['Weight'] || 0)
        })).filter(item => item.size_inch);

        console.log(`Processed ${items.length} items.`);

        const response = await fetch('http://localhost:3000/api/pipe-sizes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Mocking auth might be tricky if it's SSR/Server-side cookies, 
                // but since I'm running locally, I might need to bypass or use a secret key.
                // However, the API route uses createClient which looks for session.
                // Alternatively, I can use a direct database insert script using supabase admin.
            },
            body: JSON.stringify({ items })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('API Error:', err);
        } else {
            console.log('Successfully imported!');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

// Better approach: Direct script with Supabase Admin
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importDirectly(filePath, materialType, table) {
    console.log(`Importing to ${table} from ${filePath}...`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
        console.log('No data found in sheet.');
        return;
    }

    // Log the first row to see actual headers
    console.log('Sample row headers:', Object.keys(data[0]));

    let items = [];
    if (table === 'pipe_sizes') {
        items = data.map(row => {
            // Flexible matching for headers with newlines/spaces
            const findVal = (keywords) => {
                const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
                return row[key];
            };

            return {
                material_type: materialType,
                size_inch: (findVal(['Size']) || '').toString(),
                od_mm: parseFloat(findVal(['OD']) || 0),
                schedule: (findVal(['Schedule', 'SCH']) || '').toString(),
                wall_thickness_mm: parseFloat(findVal(['W.T.', 'Wall Thickness', 'WT']) || 0),
                weight_kg_per_m: parseFloat(findVal(['Weight']) || 0)
            };
        }).filter(i => i.size_inch);
    } else if (table === 'product_specifications') {
        items = data.map(row => {
            const findVal = (keywords) => {
                const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
                return row[key];
            };
            return {
                product_name: findVal(['Product Name', 'NAME']) || '',
                material: findVal(['Material', 'GRADE']) || '',
                additional_spec: findVal(['Specification', 'SPEC']) || '',
                ends: findVal(['Ends']) || '',
                length_range: findVal(['Length']) || ''
            };
        }).filter(i => i.product_name);
    }

    const { error } = await supabase.from(table).insert(items);
    if (error) console.error('Error:', error);
    else console.log(`Imported ${items.length} records into ${table}`);
}

(async () => {
    // Pipe Sizes
    await importDirectly('documents/PIPES SIZE MASTER SS & DS PIPES.xlsx', 'SS', 'pipe_sizes');
    await importDirectly('documents/PIPES SIZE MASTER CS & AS PIPES.xlsx', 'CS', 'pipe_sizes');

    // Product Specs
    await importDirectly('documents/PRODUCT SPEC MASTER - 1.xlsx', '', 'product_specifications');
})();
