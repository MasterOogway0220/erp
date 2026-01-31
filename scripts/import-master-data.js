/**
 * Master Data Import Script
 * 
 * This script imports data from Excel files in the documents/ folder
 * into the ERP database via API routes.
 * 
 * Usage: node scripts/import-master-data.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';

// Helper to read Excel file
function readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
}

// Helper to make API calls
async function importData(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: data }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Import failed');
        }

        return result;
    } catch (error) {
        console.error(`Error importing to ${endpoint}:`, error.message);
        throw error;
    }
}

// Import Pipe Sizes
async function importPipeSizes() {
    console.log('\n📏 Importing Pipe Sizes...');

    const csAsFile = path.join(__dirname, '../documents/PIPES SIZE MASTER CS & AS PIPES.xlsx');
    const ssDsFile = path.join(__dirname, '../documents/PIPES SIZE MASTER SS & DS PIPES.xlsx');

    let allPipeSizes = [];

    if (fs.existsSync(csAsFile)) {
        const csAsData = readExcelFile(csAsFile);
        console.log(`  - Found ${csAsData.length} CS/AS pipe sizes`);
        allPipeSizes = allPipeSizes.concat(csAsData);
    }

    if (fs.existsSync(ssDsFile)) {
        const ssDsData = readExcelFile(ssDsFile);
        console.log(`  - Found ${ssDsData.length} SS/DS pipe sizes`);
        allPipeSizes = allPipeSizes.concat(ssDsData);
    }

    if (allPipeSizes.length > 0) {
        const result = await importData('/pipe-sizes', allPipeSizes);
        console.log(`  ✅ Imported ${result.data?.length || allPipeSizes.length} pipe sizes`);
    }
}

// Import Product Specifications
async function importProductSpecs() {
    console.log('\n📋 Importing Product Specifications...');

    const specFile = path.join(__dirname, '../documents/PRODUCT SPEC MASTER - 1.xlsx');

    if (fs.existsSync(specFile)) {
        const specs = readExcelFile(specFile);
        console.log(`  - Found ${specs.length} product specifications`);

        const result = await importData('/product-specs', specs);
        console.log(`  ✅ Imported ${result.data?.length || specs.length} specifications`);
    }
}

// Import Inventory Master
async function importInventory() {
    console.log('\n📦 Importing Inventory Master...');

    const invFile = path.join(__dirname, '../documents/INVENTORY MASTER - LATEST.xlsx');

    if (fs.existsSync(invFile)) {
        const inventory = readExcelFile(invFile);
        console.log(`  - Found ${inventory.length} inventory items`);

        // Note: You may need to create an inventory import endpoint
        // For now, we'll log the data structure
        console.log('  ⚠️  Sample inventory record:', inventory[0]);
        console.log('  ℹ️  Inventory import endpoint may need to be created');
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Master Data Import...\n');
    console.log('Make sure the dev server is running on http://localhost:3000\n');

    try {
        await importPipeSizes();
        await importProductSpecs();
        await importInventory();

        console.log('\n✅ Master Data Import Complete!\n');
    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { importPipeSizes, importProductSpecs, importInventory };
