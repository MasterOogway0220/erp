import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function seedProducts() {
    const client = new Client({ connectionString })
    await client.connect()

    console.log('Seeding Products...')

    const products = [
        ['ASTM A106 GR. B', 'PIPE-CS-A106-B', 'C.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A106 GR. C', 'PIPE-CS-A106-C', 'C.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A333 GR. 6', 'PIPE-CS-A333-6', 'C.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A312 TP304', 'PIPE-SS-304', 'S.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A312 TP304L', 'PIPE-SS-304L', 'S.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A312 TP316', 'PIPE-SS-316', 'S.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A312 TP316L', 'PIPE-SS-316L', 'S.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A335 GR. P11', 'PIPE-AS-P11', 'A.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A335 GR. P22', 'PIPE-AS-P22', 'A.S. SEAMLESS PIPE', 'MTR', '7304'],
        ['ASTM A335 GR. P91', 'PIPE-AS-P91', 'A.S. SEAMLESS PIPE', 'MTR', '7304'],
    ]

    for (const p of products) {
        await client.query(`
            INSERT INTO products (name, code, category, unit, hsn_code, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (code) DO NOTHING;
        `, p)
    }

    console.log('Products seeded.')
    await client.end()
}

seedProducts().catch(console.error)
