import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils';
import { z } from 'zod';

const revisionBodySchema = z.object({
  change_reason: z.string().min(1, 'Change reason is mandatory for creating a new version'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return apiError('Unauthorized', 401);
  }

  const body = await request.json();
  const validation = revisionBodySchema.safeParse(body);

  if (!validation.success) {
    return apiError(validation.error.issues[0].message, 400);
  }

  const { change_reason } = validation.data;

  // 1. Fetch current quotation data from main tables (quotations, items, terms)
  const { data: currentQuotation, error: fetchQuotationError } = await adminClient
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchQuotationError || !currentQuotation) {
    return apiError('Quotation not found', 404);
  }

  const { data: currentItems, error: fetchItemsError } = await adminClient
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', id);

  if (fetchItemsError) {
    console.error('Error fetching current quotation items:', fetchItemsError);
    return apiError('Failed to fetch quotation items', 500);
  }

  const { data: currentTerms, error: fetchTermsError } = await adminClient
    .from('quotation_terms')
    .select('*')
    .eq('quotation_id', id);

  if (fetchTermsError) {
    console.error('Error fetching current quotation terms:', fetchTermsError);
    return apiError('Failed to fetch quotation terms', 500);
  }
  
  // 2. Determine next version number
  const { data: latestVersion, error: latestVersionError } = await adminClient
    .from('quotation_versions')
    .select('version_number')
    .eq('quotation_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (latestVersionError && latestVersionError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching latest version:', latestVersionError);
    return apiError('Failed to determine next version number', 500);
  }

  const nextVersionNumber = (latestVersion?.version_number || 0) + 1;
  const versionLabel = `Rev.${String(nextVersionNumber).padStart(2, '0')}`;

  // 3. Mark previous current version as not current
  await adminClient
    .from('quotation_versions')
    .update({ is_current: false })
    .eq('quotation_id', id)
    .eq('is_current', true);

  // 4. Insert new snapshot
  const { data: newVersion, error: versionError } = await adminClient
    .from('quotation_versions')
    .insert({
      quotation_id: id,
      version_number: nextVersionNumber,
      version_label: versionLabel,
      quotation_data: currentQuotation,
      line_items: currentItems,
      terms_conditions: currentTerms,
      changed_by: user.id,
      change_reason: change_reason,
      is_current: true,
    })
    .select()
    .single();

  if (versionError) {
    console.error('Error creating new quotation version:', versionError);
    return apiError('Failed to create new quotation version', 500);
  }

  // 5. Update main quotation table's version info to reflect this new current version
  const { error: updateMainQuotationError } = await adminClient
    .from('quotations')
    .update({
        version_number: nextVersionNumber,
        revision: nextVersionNumber,
        updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateMainQuotationError) {
      console.error('Error updating main quotation table with new version info:', updateMainQuotationError);
      // Decide if rollback of version creation is needed
  }

  await logAuditEvent('quotations', id, 'CREATE_REVISION', { change_reason }, newVersion, user.id);

  return apiSuccess(newVersion, 201);
}
