
export interface ProductAttributes {
    category: string; // e.g. PIPE, FITTING
    grade?: string | null;  // e.g. CS, SS
    standard?: string | null; // e.g. A106, A312
    size?: string | null; // e.g. 24"
    schedule?: string | null; // e.g. Sch 40
}

/**
 * Generates a material code following the FORM-PRODUCT-SPEC-SIZE format.
 * Example: PIPE-CS-A106-24SCH40
 */
export function generateMaterialCode(attrs: ProductAttributes): string {
    const form = (attrs.category || 'GEN').toUpperCase();
    const product = (attrs.grade || 'MAT').toUpperCase();
    const spec = (attrs.standard || 'SPEC').replace(/\s+/g, '').toUpperCase();

    // Size + Schedule
    const sizePart = (attrs.size || '').replace(/[\"\s]+/g, '').toUpperCase();
    const schPart = (attrs.schedule || '').replace(/\s+/g, '').toUpperCase();
    const dimension = `${sizePart}${schPart}` || 'SIZE';

    return `${form}-${product}-${spec}-${dimension}`;
}
