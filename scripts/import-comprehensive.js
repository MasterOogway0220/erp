const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function readCSV(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}

async function importUOMs() {
    console.log('📏 Importing UOMs...');
    const uoms = [
        { code: 'MTR', name: 'Meters', unit_type: 'LENGTH' },
        { code: 'KGS', name: 'Kilograms', unit_type: 'WEIGHT' },
        { code: 'NOS', name: 'Numbers', unit_type: 'QUANTITY' },
        { code: 'TON', name: 'Metric Tons', unit_type: 'WEIGHT' },
        { code: 'PCS', name: 'Pieces', unit_type: 'QUANTITY' },
    ];
    await supabase.from('units_of_measure').upsert(uoms, { onConflict: 'code' });
}

async function importPipeSizes() {
    console.log('📏 Importing Pipe Sizes...');
    const files = [
        { path: 'documents/csv/pipe_sizes_cs_as.csv', type: 'CS' },
        { path: 'documents/csv/pipe_sizes_ss_ds.csv', type: 'SS' }
    ];

    for (const file of files) {
        if (!fs.existsSync(file.path)) continue;
        const data = readCSV(file.path);
        const items = data.map(row => {
            const findVal = (keywords) => {
                const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().trim() === kw.toLowerCase().trim() || k.toLowerCase().includes(kw.toLowerCase())));
                return row[key];
            };
            return {
                material_type: file.type,
                size_inch: (findVal(['Size']) || '').toString(),
                od_mm: parseFloat(findVal(['OD']) || 0),
                schedule: (findVal(['Schedule', 'SCH']) || '').toString(),
                wall_thickness_mm: parseFloat(findVal(['W.T.', 'Wall Thickness', 'WT']) || 0),
                weight_kg_per_m: parseFloat(findVal(['Weight']) || 0)
            };
        }).filter(i => i.size_inch);
        
        await supabase.from('pipe_sizes').insert(items);
    }
}

async function importProductSpecs() {
    console.log('📋 Importing Product Specifications...');
    const specFile = 'documents/csv/product_specs.csv';
    if (!fs.existsSync(specFile)) return;
    
    const data = readCSV(specFile);
    let currentProductName = "";
    const items = [];

    for (const row of data) {
        const findVal = (keywords) => {
            const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().trim() === kw.toLowerCase().trim() || k.toLowerCase().includes(kw.toLowerCase())));
            return row[key];
        };

        const prodName = findVal(['Product']);
        if (prodName && prodName.trim()) {
            currentProductName = prodName.trim();
        }

        const material = findVal(['Material']);
        if (material && material.trim()) {
            items.push({
                product_name: currentProductName,
                material: material.trim(),
                additional_spec: (findVal(['Additional Spec']) || "").toString().trim(),
                ends: (findVal(['Ends']) || "").toString().trim(),
                length_range: (findVal(['Length']) || "").toString().trim()
            });
        }
    }
    
    if (items.length > 0) {
        const { error } = await supabase.from('product_specifications').insert(items);
        if (error) console.error('Error importing specs:', error.message);
        else console.log(`  ✅ Imported ${items.length} specifications`);
    }
}

async function importInventoryAndProducts() {
    console.log('📦 Importing Inventory and generating Products...');
    const invFile = 'documents/csv/inventory.csv';
    if (!fs.existsSync(invFile)) return;
    
    const data = readCSV(invFile);
    
    for (const row of data) {
        const findVal = (keywords) => {
            const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().trim() === kw.toLowerCase().trim() || k.toLowerCase().includes(kw.toLowerCase())));
            return row[key];
        };

        const form = findVal(['Form']) || '';
        const type = findVal(['Type']) || '';
        const spec = findVal(['Specification']) || '';
        const addSpec = findVal(['Additional']) || '';
        const dim = findVal(['Dimension']) || '';
        const size = findVal(['Size']) || '';
        const ends = findVal(['Ends']) || '';
        const length = findVal(['Length']) || '';
        const heatNo = findVal(['Heat No.']) || '';
        const make = findVal(['Make']) || '';
        const quantity = parseFloat(findVal(['Quantity']) || 0);
        const pieces = parseInt(findVal(['Piece']) || 0);
        const mtcNo = findVal(['MTC No.']) || '';
        const mtcDateRaw = findVal(['MTC Date']);
        const mtcDate = mtcDateRaw ? new Date(mtcDateRaw).toISOString() : null;
        const location = findVal(['Location']) || '';
        const tpi = findVal(['TPI']) || '';

        const cleanSpec = spec.replace(/[^a-zA-Z0-9]/g, '');
        const cleanSize = size.replace(/[^a-zA-Z0-9]/g, '');
        const productCode = `${form}-${type}-${cleanSpec}-${cleanSize}`.toUpperCase();
        
        let { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('code', productCode)
            .maybeSingle();
            
        if (!product) {
            const { data: newProduct, error: createError } = await supabase
                .from('products')
                .insert({
                    name: `${form} ${type} ${spec} ${size}`,
                    code: productCode,
                    category: form === 'CS' ? 'Carbon Steel' : 'Stainless Steel',
                    unit: 'MTR',
                    is_active: true,
                    form,
                    type,
                    specification: spec,
                    additional_spec: addSpec,
                    dimension_standard: dim,
                    size,
                    ends,
                    length_range: length,
                    make
                })
                .select()
                .single();
            
            if (createError) {
                console.error(`Error creating product ${productCode}:`, createError.message);
                continue;
            }
            product = newProduct;
        }
        
        await supabase
            .from('inventory')
            .insert({
                product_id: product.id,
                heat_number: heatNo,
                quantity: quantity,
                available_quantity: quantity,
                location: location,
                mtc_number: mtcNo,
                mtc_date: mtcDate,
                manufacturer: make,
                tpi_agency: tpi,
                inspection_status: 'accepted'
            });
    }
}

async function main() {
    console.log('🚀 Starting Comprehensive Import...');
    try {
        await importUOMs();
        // Skip pipe sizes if they are already imported (avoiding huge duplicates)
        // Actually, I'll just let them duplicate for now as they don't have unique constraint,
        // or I should clear them first.
        // Let's clear them to be clean.
        await supabase.from('pipe_sizes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await importPipeSizes();
        
        await supabase.from('product_specifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await importProductSpecs();
        
        await importInventoryAndProducts();
        console.log('✅ Import completed successfully!');
    } catch (err) {
        console.error('❌ Import failed:', err);
    }
}

main();
