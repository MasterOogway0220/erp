import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/api-utils'

// A simple dictionary for demonstration. 
// In a real app, this would query a database or external service.
const PINCODE_MAP: Record<string, { city: string, state: string }> = {
    "400001": { city: "Mumbai", state: "Maharashtra" },
    "400013": { city: "Mumbai", state: "Maharashtra" },
    "110001": { city: "New Delhi", state: "Delhi" },
    "560001": { city: "Bengaluru", state: "Karnataka" },
    "600001": { city: "Chennai", state: "Tamil Nadu" },
    "700001": { city: "Kolkata", state: "West Bengal" },
    "380001": { city: "Ahmedabad", state: "Gujarat" },
    "395003": { city: "Surat", state: "Gujarat" },
    "411001": { city: "Pune", state: "Maharashtra" },
    "500001": { city: "Hyderabad", state: "Telangana" },
    "302001": { city: "Jaipur", state: "Rajasthan" },
}

export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    const pincode = params.code
    const data = PINCODE_MAP[pincode] || { city: "", state: "" }

    return apiSuccess(data)
}
