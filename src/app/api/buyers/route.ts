import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod'; // Assuming zod is installed and used for validation

// Define the buyer schema based on the provided document
const buyerSchema = z.object({
  customer_id: z.string().uuid(),
  buyer_name: z.string().min(1).max(100),
  designation: z.string().max(50).optional(),
  email: z.string().email(),
  mobile: z.string().max(20),
  opening_balance: z.number(),
  is_active: z.boolean().default(true)
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validatedData = buyerSchema.parse(json);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('buyers')
      .insert([validatedData])
      .select();

    if (error) {
      console.error('Error creating buyer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Unexpected error in POST /api/buyers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerIdSchema = z.string().uuid().optional();
    const parsedCustomerId = customerIdSchema.safeParse(customer_id);

    if (!parsedCustomerId.success) {
      return NextResponse.json({ error: 'Invalid customer_id format' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let query = supabase.from('buyers').select('*');

    if (parsedCustomerId.data) {
      query = query.eq('customer_id', parsedCustomerId.data);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching buyers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/buyers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}