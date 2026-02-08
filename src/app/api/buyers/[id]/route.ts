import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const buyerSchema = z.object({
  customer_id: z.string().uuid(),
  buyer_name: z.string().min(1).max(100),
  designation: z.string().max(50).optional(),
  email: z.string().email(),
  mobile: z.string().max(20),
  opening_balance: z.number(),
  is_active: z.boolean().default(true)
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const idSchema = z.string().uuid();
    const parsedId = idSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json({ error: 'Invalid buyer ID format' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', parsedId.data)
      .single();

    if (error) {
      console.error('Error fetching buyer:', error);
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/buyers/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const idSchema = z.string().uuid();
    const parsedId = idSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json({ error: 'Invalid buyer ID format' }, { status: 400 });
    }

    const json = await request.json();
    // Allow partial updates, so use .partial()
    const validatedData = buyerSchema.partial().parse(json);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('buyers')
      .update(validatedData)
      .eq('id', parsedId.data)
      .select(); // Return the updated record

    if (error) {
      console.error('Error updating buyer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    return NextResponse.json(data[0], { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Unexpected error in PUT /api/buyers/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const idSchema = z.string().uuid();
    const parsedId = idSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json({ error: 'Invalid buyer ID format' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error, count } = await supabase
      .from('buyers')
      .delete()
      .eq('id', parsedId.data);

    if (error) {
      console.error('Error deleting buyer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Supabase delete doesn't return the deleted row by default or a count
    // without using .select('count') for example.
    // We can infer success if no error.
    return NextResponse.json({ message: 'Buyer deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/buyers/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}