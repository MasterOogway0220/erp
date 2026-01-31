import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data, error } = await supabase.from('units_of_measure').select('*').limit(1)
    if (error) {
        console.error('Error fetching units_of_measure:', error)
    } else {
        console.log('units_of_measure data:', data)
    }

    const { data: pipeData, error: pipeError } = await supabase.from('pipe_sizes').select('*').limit(1)
    if (pipeError) {
        console.error('Error fetching pipe_sizes:', pipeError)
    } else {
        console.log('pipe_sizes data:', pipeData)
    }
}

check()
