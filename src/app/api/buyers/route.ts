import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api-utils';
import { z } from 'zod';

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    let query = adminClient.from('buyers').select('*');

    if (customerId && customerId !== 'null') {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      return apiError(error.message);
    }

    return apiSuccess(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/buyers:', error);
    return apiError('Internal Server Error', 500);
  }
}