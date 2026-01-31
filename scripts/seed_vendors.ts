import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function seedVendors() {
    const client = new Client({ connectionString })
    await client.connect()

    console.log('Seeding Vendors...')

    const vendors = [
        ['JSL Limited', 'info@jsl.com', '1234567890', 'Gst-JSL'],
        ['Ratnadeep Metals', 'sales@ratnadeep.com', '1234567891', 'Gst-RAT'],
        ['KF Forge', 'contact@kf.com', '1234567892', 'Gst-KF'],
        ['Maharashtra Seamless', 'info@msl.in', '1234567893', 'Gst-MSL'],
        ['ISMT Limited', 'sales@ismt.com', '1234567894', 'Gst-ISMT']
    ]

    for (const v of vendors) {
        // Check if exists
        const exists = await client.query('SELECT id FROM vendors WHERE name = $1', [v[0]])
        if (exists.rows.length === 0) {
            await client.query(`
                INSERT INTO vendors (name, email, phone, gst_number, is_active)
                VALUES ($1, $2, $3, $4, true)
            `, v)
            console.log(`Inserted vendor: ${v[0]}`)
        } else {
            console.log(`Vendor already exists: ${v[0]}`)
        }
    }

    console.log('Vendors seeding completed.')
    await client.end()
}

seedVendors().catch(console.error)
