import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function seedInventory() {
    const client = new Client({ connectionString })
    await client.connect()

    console.log('Seeding Inventory Opening stock...')

    const getProduct = async (code: string) => {
        const res = await client.query('SELECT id FROM products WHERE code = $1', [code])
        return res.rows[0]?.id
    }

    const items = [
        {
            productCode: 'PIPE-AS-P22',
            heatNumber: 'E95185 & F27296',
            manufacturer: 'JSL',
            quantity: 8.63,
            available: 8.63,
            location: 'Warehouse A',
            mtc: '3.1 MTC'
        },
        {
            productCode: 'PIPE-CS-A106-B',
            heatNumber: '8865P',
            manufacturer: 'KF',
            quantity: 3.91,
            available: 3.91,
            location: 'Warehouse B',
            mtc: 'Sample MTC'
        }
    ]

    for (const item of items) {
        const productId = await getProduct(item.productCode)
        if (productId) {
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
            `, [productId, item.heatNumber, item.manufacturer, item.quantity, item.available, item.location, item.mtc])
        } else {
            console.warn(`Product not found: ${item.productCode}`)
        }
    }

    console.log('Inventory seeded.')
    await client.end()
}

seedInventory().catch(console.error)
