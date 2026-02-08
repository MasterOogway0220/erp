import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api-utils';
import { z } from 'zod';

// Helper function for deep comparison and diff generation
function generateJsonDiff(obj1: any, obj2: any, keyIdentifier: string = 'id'): any {
    const diff: any = {};
    const keys1 = new Set(Object.keys(obj1 || {}));
    const keys2 = new Set(Object.keys(obj2 || {}));

    // Find added keys
    for (const key of keys2) {
        if (!keys1.has(key)) {
            diff[key] = {
                type: 'added',
                newValue: obj2[key],
            };
        }
    }

    // Find removed keys and changed keys
    for (const key of keys1) {
        if (!keys2.has(key)) {
            diff[key] = {
                type: 'removed',
                oldValue: obj1[key],
            };
        } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
            // For complex objects, recursively diff or mark as changed
            if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object' && obj1[key] !== null && obj2[key] !== null) {
                // Special handling for arrays of objects (like line_items or terms)
                if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
                    const arrayDiff = compareArrayOfObjects(obj1[key], obj2[key], keyIdentifier);
                    if (Object.keys(arrayDiff).length > 0) {
                        diff[key] = {
                            type: 'array_changed',
                            changes: arrayDiff,
                        };
                    }
                } else {
                    const subDiff = generateJsonDiff(obj1[key], obj2[key], keyIdentifier);
                    if (Object.keys(subDiff).length > 0) {
                        diff[key] = {
                            type: 'object_changed',
                            changes: subDiff,
                        };
                    }
                }
            } else {
                diff[key] = {
                    type: 'changed',
                    oldValue: obj1[key],
                    newValue: obj2[key],
                };
            }
        }
    }
    return diff;
}

function compareArrayOfObjects(arr1: any[], arr2: any[], keyIdentifier: string): any {
    const diff: any = {};
    const map1 = new Map(arr1.map(item => [item[keyIdentifier], item]));
    const map2 = new Map(arr2.map(item => [item[keyIdentifier], item]));

    // Added items
    for (const [key, item2] of map2) {
        if (!map1.has(key)) {
            diff[`added_${key}`] = { type: 'added', newValue: item2 };
        }
    }

    // Removed or changed items
    for (const [key, item1] of map1) {
        if (!map2.has(key)) {
            diff[`removed_${key}`] = { type: 'removed', oldValue: item1 };
        } else {
            const item2 = map2.get(key);
            if (JSON.stringify(item1) !== JSON.stringify(item2)) {
                const itemChanges = generateJsonDiff(item1, item2);
                if (Object.keys(itemChanges).length > 0) {
                    diff[`changed_${key}`] = { type: 'changed', changes: itemChanges };
                }
            }
        }
    }
    return diff;
}


export async function GET(
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

  const { searchParams } = new URL(request.url);
  const v1Param = searchParams.get('v1');
  const v2Param = searchParams.get('v2');

  const versionSchema = z.string().transform(Number).pipe(z.number().int().min(0));
  const parsedV1 = versionSchema.safeParse(v1Param);
  const parsedV2 = versionSchema.safeParse(v2Param);

  if (!parsedV1.success || !parsedV2.success) {
    return apiError('Invalid version numbers (v1, v2) provided.', 400);
  }

  const v1 = parsedV1.data;
  const v2 = parsedV2.data;

  // Fetch both versions
  const { data: versions, error: fetchVersionsError } = await adminClient
    .from('quotation_versions')
    .select('*')
    .eq('quotation_id', id)
    .in('version_number', [v1, v2]);

  if (fetchVersionsError) {
    console.error('Error fetching quotation versions:', fetchVersionsError);
    return apiError('Failed to fetch quotation versions for comparison', 500);
  }

  const version1 = versions?.find(v => v.version_number === v1);
  const version2 = versions?.find(v => v.version_number === v2);

  if (!version1 || !version2) {
    return apiError('One or both specified quotation versions not found.', 404);
  }

  // Generate diff
  const diff = {
    quotation_data: generateJsonDiff(version1.quotation_data, version2.quotation_data),
    line_items: generateJsonDiff(version1.line_items, version2.line_items, 'id'), // Assuming line items have an 'id'
    terms_conditions: generateJsonDiff(version1.terms_conditions, version2.terms_conditions, 'term_id'), // Assuming terms have a 'term_id'
  };

  return apiSuccess({
    version1: {
      version_number: version1.version_number,
      version_label: version1.version_label,
      changed_at: version1.changed_at,
      changed_by: version1.changed_by,
    },
    version2: {
      version_number: version2.version_number,
      version_label: version2.version_label,
      changed_at: version2.changed_at,
      changed_by: version2.changed_by,
    },
    diff: diff,
  });
}
