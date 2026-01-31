import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function seedCustomersAndTerms() {
    const client = new Client({ connectionString })
    await client.connect()

    console.log('Seeding Customers and Terms...')

    // 1. Seed Customers
    const customers = [
        ['Uttam Steel Ltd', 'uttam@steel.com', 'Mumbai', '27AAACU1234A1Z5'],
        ['Maharashtra Seamless Ltd', 'info@msl.in', 'Raigad', '27AAACM1234A1Z5'],
        ['Jindal Saw Ltd', 'sales@jindalsaw.com', 'Delhi', '07AAACJ1234A1Z5'],
        ['Ratnamani Metals', 'info@ratnamani.com', 'Ahmedabad', '24AAACR1234A1Z5']
    ]

    for (const c of customers) {
        const res = await client.query('SELECT id FROM customers WHERE name = $1', [c[0]])
        if (res.rows.length === 0) {
            await client.query(`
                INSERT INTO customers (name, email, city, gst_number, is_active, current_outstanding)
                VALUES ($1, $2, $3, $4, true, 0)
            `, c)
            console.log(`Inserted customer: ${c[0]}`)
        }
    }

    // 2. Seed Terms
    const terms = [
        ['Payment', '100% against proforma invoice before dispatch'],
        ['Delivery', 'Within 2-4 weeks from the date of receipt of your technically and commercially clear PO'],
        ['Validity', 'This quotation is valid for 7 days from the date of issue'],
        ['Taxes', 'GST 18% extra as applicable at the time of dispatch'],
        ['Inspection', 'Final inspection at our works. Case to case TPI can be arranged at extra cost.'],
        ['MTC', 'Manufacturer Test Certificate will be provided along with material']
    ]

    for (const t of terms) {
        const res = await client.query('SELECT id FROM terms_conditions WHERE title = $1', [t[0]])
        if (res.rows.length === 0) {
            await client.query(`
                INSERT INTO terms_conditions (category, title, default_text, is_active)
                VALUES ($1, $1, $2, true)
            `, t)
            console.log(`Inserted term: ${t[0]}`)
        }
    }

    console.log('Seeding completed.')
    await client.end()
}

seedCustomersAndTerms().catch(console.error)
