import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { approveQuotationSchema, isValidStatusTransition } from '@/lib/validations/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // Corrected type
) {
  const { id } = params; // No await needed
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return apiError('Unauthorized', 401);
  }

  const { searchParams } = new URL(request.url);
  const versionParam = searchParams.get('version');
  const requestedVersion = versionParam ? parseInt(versionParam) : undefined;

  // 1. Fetch main quotation record (for customer/enquiry details)
  const { data: quotation, error: fetchQuotationError } = await adminClient
    .from('quotations')
    .select(`
      *,
      customer:customers(id, name, email, address, gst_number),
      enquiry:enquiries(id, enquiry_number)
    `)
    .eq('id', id)
    .single();

  if (fetchQuotationError || !quotation) {
    return apiError('Quotation not found', 404);
  }

  // 2. Fetch the specific version snapshot (either requested or current)
  let versionQuery = adminClient
    .from('quotation_versions')
    .select('*')
    .eq('quotation_id', id);

  if (requestedVersion !== undefined) {
    versionQuery = versionQuery.eq('version_number', requestedVersion);
  } else {
    versionQuery = versionQuery.eq('is_current', true);
  }

  const { data: versionSnapshot, error: fetchSnapshotError } = await versionQuery.single();

  if (fetchSnapshotError || !versionSnapshot) {
      console.error('Error fetching version snapshot:', fetchSnapshotError);
      return apiError(`Quotation version ${requestedVersion !== undefined ? requestedVersion : 'current'} not found`, 404);
  }

  // 3. Fetch all revisions for this quotation
  const { data: allRevisions, error: fetchRevisionsError } = await adminClient
    .from('quotation_versions')
    .select('id, quotation_id, version_number, version_label, changed_at, changed_by')
    .eq('quotation_id', id)
    .order('version_number', { ascending: false });

  if (fetchRevisionsError) {
      console.error('Error fetching all revisions:', fetchRevisionsError);
      // Not a critical error, can proceed without revisions list
  }
  
  // Combine data: main quotation with details from the specific snapshot
  return apiSuccess({
    ...quotation, // Main quotation data
    ...versionSnapshot.quotation_data, // Overwrite main quotation fields with snapshot data
    items: versionSnapshot.line_items,
    terms: versionSnapshot.terms_conditions,
    version_number: versionSnapshot.version_number, // Ensure this reflects the snapshot's version
    revision: versionSnapshot.version_number, // For existing UI compatibility
    revisions: allRevisions || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const body = await request.json()
  const { action, remarks } = body

  const { data: quotation, error: fetchError } = await adminClient
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !quotation) {
    return apiError('Quotation not found', 404)
  }

  const oldData = { ...quotation }
  let newStatus = quotation.status
  let updates: Record<string, unknown> = {}

  switch (action) {
    case 'submit_for_approval':
      if (!isValidStatusTransition('quotation', quotation.status, 'pending_approval')) {
        return apiError(`Cannot submit quotation from status: ${quotation.status}`)
      }
      newStatus = 'pending_approval'
      updates = { status: newStatus }
      break

    case 'approve':
      // ISO 8.2.3: Mandatory remarks for requirements review
      if (!remarks || remarks.trim().length === 0) {
        return apiError('Approval remarks are mandatory for ISO 8.2.3 compliance', 400)
      }
      if (!isValidStatusTransition('quotation', quotation.status, 'approved')) {
        return apiError(`Cannot approve quotation from status: ${quotation.status}`)
      }
      newStatus = 'approved'
      updates = {
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        remarks
      }
      break

    case 'reject':
      // ISO 8.2.3: Mandatory remarks for rejection
      if (!remarks || remarks.trim().length === 0) {
        return apiError('Rejection remarks are mandatory for ISO 8.2.3 compliance', 400)
      }
      if (!isValidStatusTransition('quotation', quotation.status, 'rejected')) {
        return apiError(`Cannot reject quotation from status: ${quotation.status}`)
      }
      newStatus = 'rejected'
      updates = { status: newStatus, remarks }
      break

    case 'send':
      if (!isValidStatusTransition('quotation', quotation.status, 'sent')) {
        return apiError(`Cannot send quotation from status: ${quotation.status}`)
      }
      newStatus = 'sent'
      updates = { status: newStatus }
      break

    default:
      return apiError('Invalid action')
  }

  const { data: updated, error: updateError } = await adminClient
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return apiError(updateError.message)
  }

  await logAuditEvent('quotations', id, 'STATUS_CHANGE', oldData, updated, user.id)

  return apiSuccess(updated)
}

export async function PUT(
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
  const { change_reason, ...quotationUpdates } = body; // Extract change_reason

  if (!change_reason || change_reason.trim() === '') {
    return apiError('Change reason is mandatory for creating a new version', 400);
  }

  // Validate incoming data - allow partial updates
  const validation = createQuotationSchema.partial().safeParse(quotationUpdates);
  if (!validation.success) {
    return apiError(validation.error.issues[0].message, 400);
  }

  const {
    items, terms, testing_standards, // These need special handling
    ...mainQuotationData // Data for the main quotations table
  } = validation.data;

  // Fetch current quotation details
  const { data: currentQuotation, error: fetchError } = await adminClient
    .from('quotations')
    .select('*') // Select all columns for snapshot
    .eq('id', id)
    .single();

  if (fetchError || !currentQuotation) {
    return apiError('Quotation not found', 404);
  }

  // Get next version number
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

  // Update main quotations table
  const { data: updatedQuotation, error: updateError } = await adminClient
    .from('quotations')
    .update({
      ...mainQuotationData, // Apply updates
      version_number: nextVersionNumber,
      revision: nextVersionNumber,
      is_latest_version: true,
      updated_at: new Date().toISOString(), // Manually update updated_at if not handled by DB trigger
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return apiError(updateError.message);
  }

  // Update related tables (items, terms, testing_standards)
  // --- Items ---
  let processedItems = [];
  if (items) {
    // Delete existing items
    await adminClient.from('quotation_items').delete().eq('quotation_id', id);
    // Insert new items
    processedItems = items.map(item => {
        const lineTotal = (item.quantity || 0) * (item.unit_price || 0) * (1 - (item.discount || 0) / 100)
        return {
            ...item,
            quotation_id: id,
            line_total: lineTotal,
            // Ensure other calculated fields are handled if necessary
        }
    });
    const { error: itemsInsertError } = await adminClient
      .from('quotation_items')
      .insert(processedItems);
    if (itemsInsertError) {
      console.error('Error re-inserting quotation items:', itemsInsertError);
      // Decide rollback strategy: for now, log and continue.
    }
  } else {
    // If items not provided in PUT, fetch current ones for snapshot
    const { data: currentItems } = await adminClient.from('quotation_items').select('*').eq('quotation_id', id);
    processedItems = currentItems || [];
  }


  // --- Terms ---
  let updatedTerms = [];
  if (terms) {
    // Delete existing terms
    await adminClient.from('quotation_terms').delete().eq('quotation_id', id);
    // Insert new terms
    const { data: insertedTerms, error: termsInsertError } = await adminClient
      .from('quotation_terms')
      .insert(terms.map(t => ({ ...t, quotation_id: id })))
      .select();
    if (termsInsertError) {
      console.error('Error re-inserting quotation terms:', termsInsertError);
    } else {
        updatedTerms = insertedTerms;
    }
  } else {
    // If terms not provided in PUT, fetch current ones for snapshot
    const { data: currentTerms } = await adminClient.from('quotation_terms').select('*').eq('quotation_id', id);
    updatedTerms = currentTerms || [];
  }

  // --- Testing Standards ---
  let updatedTestingStandards = [];
  if (testing_standards) {
    // Delete existing
    await adminClient.from('quotation_testing').delete().eq('quotation_id', id);
    // Insert new
    const { data: insertedTesting, error: testingInsertError } = await adminClient
      .from('quotation_testing')
      .insert(testing_standards.map(tid => ({ quotation_id: id, testing_standard_id: tid })))
      .select();
    if (testingInsertError) {
      console.error('Error re-inserting testing standards:', testingInsertError);
    } else {
        updatedTestingStandards = insertedTesting;
    }
  } else {
    // If testing_standards not provided, fetch current ones for snapshot
    const { data: currentTesting } = await adminClient.from('quotation_testing').select('*').eq('quotation_id', id);
    updatedTestingStandards = currentTesting || [];
  }

  // Mark previous version as not current
  await adminClient
    .from('quotation_versions')
    .update({ is_current: false })
    .eq('quotation_id', id)
    .eq('is_current', true); // Only update the one that was previously current


  // Create new version snapshot
  const { error: versionError } = await adminClient
    .from('quotation_versions')
    .insert({
      quotation_id: id,
      version_number: nextVersionNumber,
      version_label: versionLabel,
      quotation_data: {
          ...updatedQuotation, // Header from the updated main table
          // Add other relevant top-level fields for snapshot integrity
      },
      line_items: processedItems, // Use the items from the request body or updated ones
      terms_conditions: updatedTerms,
      // testing_standards: updatedTestingStandards, // Decide if testing standards are part of the version snapshot
      changed_by: user.id, // Or from request body if a specific user is responsible
      change_reason: change_reason,
      is_current: true,
    });

  if (versionError) {
    console.error('Error creating quotation version snapshot:', versionError);
    // Rollback strategy for version creation failure
  }

  await logAuditEvent('quotations', id, 'UPDATE', currentQuotation, updatedQuotation, user.id);

  return apiSuccess(updatedQuotation);
}
