export interface ProductData {
  form_type: string;
  product_type: string;
  specification: string;
  size: string;
  // Add other properties that might be needed to derive material code in future
}

export function generateMaterialCode(product: ProductData): string {
  const form = product.form_type.substring(0, 4).toUpperCase(); // PIPE
  const productType = product.product_type.split(' ')
    .map(w => w[0]).join(''); // C.S. SEAMLESS PIPE -> CSP
  const spec = product.specification.replace(/[^A-Z0-9]/g, ''); // A106
  const size = product.size.replace(/[^0-9]/g, ''); // 24" NB X Sch 40 -> 2440
  
  return `${form}-${productType}-${spec}-${size}`;
  // Example: PIPE-CSP-A106-2440
}