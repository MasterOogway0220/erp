/**
 * Utility for auto-generating internal material codes for products.
 * Format: [CATEGORY]-[MATERIAL]-[SEQUENTIAL_NUMBER]
 * Example: PIPE-CS-0001
 */

export function generateInternalMaterialCode(
  category: string,
  material: string,
  sequence: number
): string {
  const categoryPrefix = category.substring(0, 4).toUpperCase();
  const materialPrefix = material.substring(0, 4).toUpperCase();
  const sequenceStr = sequence.toString().padStart(4, '0');

  return `${categoryPrefix}-${materialPrefix}-${sequenceStr}`;
}
