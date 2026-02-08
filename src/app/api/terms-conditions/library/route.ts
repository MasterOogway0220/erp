import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use client for RLS, or adminClient for full access

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return apiError('Unauthorized', 401);
  }

  const { data, error } = await supabase
    .from('terms_conditions_library')
    .select('*')
    .eq('is_active', true)
    .order('term_number', { ascending: true });

  if (error) {
    console.error('Error fetching terms conditions library:', error);
    return apiError(error.message);
  }

  return apiSuccess(data);
}
