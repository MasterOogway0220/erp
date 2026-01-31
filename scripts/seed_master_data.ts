import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

async function setupAndSeed() {
    const client = new Client({ connectionString })
    await client.connect()

    console.log('Ensuring tables exist...')

    // Create pipe_sizes
    await client.query(`
        CREATE TABLE IF NOT EXISTS pipe_sizes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            material_type VARCHAR(10),
            size_inch VARCHAR(20),
            od_mm DECIMAL(10,2),
            schedule VARCHAR(20),
            wall_thickness_mm DECIMAL(10,3),
            weight_kg_per_m DECIMAL(10,4),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

    // Create units_of_measure
    await client.query(`
        CREATE TABLE IF NOT EXISTS units_of_measure (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            unit_type VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

    // Seed UOM
    await client.query(`
        INSERT INTO units_of_measure (code, name, unit_type) VALUES
        ('KG', 'Kilogram', 'WEIGHT'),
        ('PCS', 'Pieces', 'QUANTITY'),
        ('NOS', 'Numbers', 'QUANTITY'),
        ('MTR', 'Meter', 'LENGTH'),
        ('SET', 'Set', 'QUANTITY'),
        ('TON', 'Ton', 'WEIGHT')
        ON CONFLICT (code) DO NOTHING;
    `)

    console.log('Tables ready. Seeding data...')

    // Pipe Sizes data extracted from documents
    const pipes = [
        ['CS', '1/2', 21.3, 'Sch 10', 2.11, 1.00],
        ['CS', '1/2', 21.3, 'Sch STD', 2.77, 1.27],
        ['CS', '1/2', 21.3, 'Sch 40', 2.77, 1.27],
        ['CS', '1/2', 21.3, 'Sch 80', 3.73, 1.62],
        ['CS', '3/4', 26.7, 'Sch 40', 2.87, 1.69],
        ['CS', '1', 33.4, 'Sch 40', 3.38, 2.50],
        ['CS', '1.5', 48.3, 'Sch 40', 3.68, 4.05],
        ['CS', '2', 60.3, 'Sch 40', 3.91, 5.44],
        ['CS', '3', 88.9, 'Sch 40', 5.49, 11.29],
        ['CS', '4', 114.3, 'Sch 40', 6.02, 16.08],
        ['CS', '6', 168.3, 'Sch 40', 7.11, 28.26],
        ['CS', '8', 219.1, 'Sch 40', 8.18, 42.55],
        ['CS', '10', 273.0, 'Sch 40', 9.27, 60.29],
        ['CS', '12', 323.8, 'Sch 40', 10.31, 79.71],
        ['SS', '1/2', 21.34, 'Sch 10S', 2.11, 1.02],
        ['SS', '3/4', 26.67, 'Sch 10S', 2.11, 1.30],
        ['SS', '1', 33.4, 'Sch 10S', 2.77, 2.12],
        ['SS', '1.5', 48.26, 'Sch 10S', 2.77, 3.15],
        ['SS', '2', 60.33, 'Sch 10S', 2.77, 3.99],
        ['SS', '3', 88.9, 'Sch 10S', 3.05, 6.55],
        ['SS', '4', 114.3, 'Sch 10S', 3.05, 8.49],
        ['SS', '6', 168.28, 'Sch 10S', 3.40, 14.04]
    ]

    for (const p of pipes) {
        await client.query(`
            INSERT INTO pipe_sizes (material_type, size_inch, od_mm, schedule, wall_thickness_mm, weight_kg_per_m)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING;
        `, p)
    }

    console.log('Pipe sizes seeded.')

    // Inventory Seeding (Sample from LATEST)
    // CS,SMLS,ASTM A106 GR.B,,ASME B36.10,"2""NB X SCH 80",BE,5.8-6.1 M,8865P,KF,3.91,10.0
    // We need products first.

    await client.end()
}

setupAndSeed().catch(console.error)
