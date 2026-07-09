const fs = require('fs');

function removeLegacy(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');

  // Remove import
  c = c.replace(/import \{ toLegacyProductNo \} from '@\/features\/products\/utils\/productIdentity';\n/g, '');
  
  // Replace usages
  c = c.replace(/toLegacyProductNo\(p\.id\)/g, 'p.id');
  c = c.replace(/toLegacyProductNo\(row\.id\)/g, 'row.id');
  c = c.replace(/toLegacyProductNo\(id\)/g, 'id');
  c = c.replace(/toLegacyProductNo\(p\.id\)/g, 'p.id');

  // For Record<number, ...> to Record<string, ...>
  if (filePath.includes('CatalogPage.tsx')) {
    c = c.replace(/Record<number, ProductOverrideRow>/g, 'Record<string, ProductOverrideRow>');
    c = c.replace(/\{ no: id \}/g, '{ id: id }');
    c = c.replace(/upsert\(\{ no: id,/g, 'upsert({ id: id,');
  }

  if (filePath.includes('productTransforms.ts')) {
    c = c.replace(/Record<number, ProductOverrideRow>/g, 'Record<string, ProductOverrideRow>');
  }

  if (filePath.includes('useProductActions.ts')) {
    c = c.replace(/Record<number, ProductOverrideRow>/g, 'Record<string, ProductOverrideRow>');
    c = c.replace(/Record<number, Partial<ProductOverrideRow>>/g, 'Record<string, Partial<ProductOverrideRow>>');
  }

  if (filePath.includes('productTransforms.test.ts')) {
    c = c.replace(/Record<number, ProductOverrideRow>/g, 'Record<string, ProductOverrideRow>');
  }

  fs.writeFileSync(filePath, c);
}

removeLegacy('src/features/products/components/ProductCardList.tsx');
removeLegacy('src/features/products/components/ProductTable.tsx');
removeLegacy('src/features/products/components/ProductToolbar.tsx');
removeLegacy('src/features/products/hooks/useProductActions.ts');
removeLegacy('src/features/products/utils/productTransforms.ts');
removeLegacy('src/features/products/utils/productTransforms.test.ts');
removeLegacy('src/pages/CatalogPage.tsx');

// Note: CatalogPage has supabase.from("product_overrides").upsert({ no: toLegacyProductNo(id), ...patch })
// With my replace, it will become upsert({ id: id, ...patch })
