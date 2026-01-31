/**
 * Direct Database Import Script
 * 
 * Imports master data directly into Supabase using the service role key
 * 
 * Usage: node scripts/import-data-direct.js
 */

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

// Helper to read CSV file
function readCSVFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
}

// Import UOMs
async function importUOMs() {
    console.log('\n📏 Importing Units of Measure...');

    const uoms = [
        { code: 'MTR', name: 'Meters', unit_type: 'LENGTH' },
        { code: 'KGS', name: 'Kilograms', unit_type: 'WEIGHT' },
        { code: 'NOS', name: 'Numbers', unit_type: 'QUANTITY' },
        { code: 'TON', name: 'Metric Tons', unit_type: 'WEIGHT' },
        { code: 'FT', name: 'Feet', unit_type: 'LENGTH' },
    ];

    const { data, error } = await supabase
        .from('units_of_measure')
        .upsert(uoms, { onConflict: 'code', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error('  ❌ Error:', error.message);
    } else {
        console.log(`  ✅ Imported ${data?.length || uoms.length} UOMs`);
    }
}

// Import Companies
async function importCompanies() {
    console.log('\n🏢 Importing Companies...');

    const companies = [
        {
            name: 'Steel Trading Co.',
            company_type: 'Private Limited',
            registered_address_line1: '123 Industrial Area',
            registered_city: 'Mumbai',
            registered_state: 'Maharashtra',
            registered_pincode: '400001',
            registered_country: 'India',
            gstin: '27AAAAA0000A1Z5',
            pan: 'AAAAA0000A',
            email: 'info@steeltrading.com',
            website: 'www.steeltrading.com',
            telephone: '+91-22-12345678'
        },
        {
            name: 'Global Pipes Ltd.',
            company_type: 'Limited',
            registered_address_line1: '456 Export Zone',
            registered_city: 'Ahmedabad',
            registered_state: 'Gujarat',
            registered_pincode: '380001',
            registered_country: 'India',
            gstin: '24BBBBB0000B1Z5',
            pan: 'BBBBB0000B',
            email: 'contact@globalpipes.com',
            website: 'www.globalpipes.com',
            telephone: '+91-79-87654321'
        }
    ];

    const { data, error } = await supabase
        .from('companies')
        .upsert(companies, { onConflict: 'gstin', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error('  ❌ Error:', error.message);
    } else {
        console.log(`  ✅ Imported ${data?.length || companies.length} companies`);
    }
}

// Import Customers
async function importCustomers() {
    console.log('\n👥 Importing Customers...');

    const customers = [
        { name: 'Reliance Industries Ltd', email: 'procurement@reliance.com', telephone: '+91-22-33445566', address: 'Maker Chambers IV, Nariman Point', city: 'Mumbai', state: 'Maharashtra', country: 'India', gst_number: '27AAAAA1111A1Z5', pan: 'AAAAA1111A', currency: 'INR', opening_balance: 250000, credit_limit: 5000000 },
        { name: 'Larsen & Toubro Ltd', email: 'purchase@lnt.com', telephone: '+91-44-22334455', address: 'L&T House, Ballard Estate', city: 'Chennai', state: 'Tamil Nadu', country: 'India', gst_number: '33BBBBB2222B1Z5', pan: 'BBBBB2222B', currency: 'INR', opening_balance: 180000, credit_limit: 3000000 },
        { name: 'Tata Steel Ltd', email: 'orders@tatasteel.com', telephone: '+91-33-66778899', address: 'Tata Centre, 43 Chowringhee Road', city: 'Kolkata', state: 'West Bengal', country: 'India', gst_number: '19CCCCC3333C1Z5', pan: 'CCCCC3333C', currency: 'INR', opening_balance: 320000, credit_limit: 8000000 },
        { name: 'ONGC Limited', email: 'materials@ongc.in', telephone: '+91-11-44556677', address: 'Jeevan Bharati Tower, Connaught Place', city: 'New Delhi', state: 'Delhi', country: 'India', gst_number: '07DDDDD4444D1Z5', pan: 'DDDDD4444D', currency: 'INR', opening_balance: 0, credit_limit: 10000000 },
        { name: 'Adani Ports', email: 'procurement@adaniports.com', telephone: '+91-79-25556666', address: 'Adani House, Nr Mithakhali Circle', city: 'Ahmedabad', state: 'Gujarat', country: 'India', gst_number: '24EEEEE5555E1Z5', pan: 'EEEEE5555E', currency: 'INR', opening_balance: 150000, credit_limit: 4000000 }
    ];

    const { data, error } = await supabase
        .from('customers')
        .upsert(customers, { onConflict: 'gst_number', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error('  ❌ Error:', error.message);
    } else {
        console.log(`  ✅ Imported ${data?.length || customers.length} customers`);
        return data;
    }
}

// Import Terms & Conditions
async function importTerms() {
    console.log('\n📋 Importing Terms & Conditions...');

    const terms = [
        { category: 'PAYMENT', title: 'Payment Terms - 30 Days', description: 'Payment: 30 days from the date of invoice', is_default: true, is_active: true },
        { category: 'PAYMENT', title: 'Payment Terms - Advance', description: 'Payment: 100% advance against Proforma Invoice', is_default: false, is_active: true },
        { category: 'DELIVERY', title: 'Delivery - Ex-Works', description: 'Delivery: Ex-Works Mumbai. Freight to be borne by buyer.', is_default: true, is_active: true },
        { category: 'DELIVERY', title: 'Delivery - FOR Destination', description: 'Delivery: FOR Destination as per buyer requirement', is_default: false, is_active: true },
        { category: 'VALIDITY', title: 'Validity - 30 Days', description: 'Offer valid for 30 days from quotation date', is_default: true, is_active: true },
        { category: 'WARRANTY', title: 'Standard Warranty', description: 'Material warranty as per mill test certificate. No warranty for workmanship or installation.', is_default: true, is_active: true },
        { category: 'INSPECTION', title: 'Third Party Inspection', description: 'Third party inspection allowed at buyer cost with prior notice', is_default: false, is_active: true },
        { category: 'PACKING', title: 'Standard Packing', description: 'Standard export worthy packing included in price', is_default: true, is_active: true }
    ];

    const { data, error } = await supabase
        .from('terms_conditions')
        .upsert(terms, { onConflict: 'title', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error('  ❌ Error:', error.message);
    } else {
        console.log(`  ✅ Imported ${data?.length || terms.length} terms`);
    }
}

// Import Pipe Sizes
async function importPipeSizes() {
    console.log('\n📏 Importing Pipe Sizes...');

    const csAsFile = path.join(__dirname, '../documents/csv/pipe_sizes_cs_as.csv');
    const ssDsFile = path.join(__dirname, '../documents/csv/pipe_sizes_ss_ds.csv');

    let allPipeSizes = [];

    if (fs.existsSync(csAsFile)) {
        const csAsData = readCSVFile(csAsFile);
        console.log(`  - Found ${csAsData.length} CS/AS pipe sizes`);
        allPipeSizes = allPipeSizes.concat(csAsData);
    }

    if (fs.existsSync(ssDsFile)) {
        const ssDsData = readCSVFile(ssDsFile);
        console.log(`  - Found ${ssDsData.length} SS/DS pipe sizes`);
        allPipeSizes = allPipeSizes.concat(ssDsData);
    }

    if (allPipeSizes.length > 0) {
        const { data, error } = await supabase
            .from('pipe_sizes')
            .insert(allPipeSizes)
            .select();

        if (error) {
            console.error('  ❌ Error:', error.message);
        } else {
            console.log(`  ✅ Imported ${data?.length || allPipeSizes.length} pipe sizes`);
        }
    }
}

// Import Product Specifications
async function importProductSpecs() {
    console.log('\n📋 Importing Product Specifications...');

    const specFile = path.join(__dirname, '../documents/csv/product_specs.csv');

    if (fs.existsSync(specFile)) {
        const specs = readCSVFile(specFile);
        console.log(`  - Found ${specs.length} product specifications`);

        const { data, error } = await supabase
            .from('product_specifications')
            .insert(specs)
            .select();

        if (error) {
            console.error('  ❌ Error:', error.message);
        } else {
            console.log(`  ✅ Imported ${data?.length || specs.length} specifications`);
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Direct Database Import...\n');
    console.log(`📡 Connected to: ${supabaseUrl}\n`);

    try {
        await importUOMs();
        await importCompanies();
        await importCustomers();
        await importTerms();
        await importPipeSizes();
        await importProductSpecs();

        console.log('\n✅ Master Data Import Complete!\n');
        console.log('Next steps:');
        console.log('1. Verify data at http://localhost:3000/masters/pipe-sizes');
        console.log('2. Verify data at http://localhost:3000/masters/product-specs');
        console.log('3. Create sample products and quotations for testing\n');
    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
