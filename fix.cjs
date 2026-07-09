
const fs = require('fs');
const files = [
  'src/features/products/components/ProductTable.tsx',
  'src/features/products/components/ProductCardList.tsx',
  'src/features/products/components/ProductEditDialog.tsx',
  'src/features/products/components/ProductToolbar.tsx',
  'src/features/products/components/AdminInlineActions.tsx',
  'src/features/products/hooks/useProductActions.ts',
  'src/features/products/utils/productTransforms.ts',
  'src/pages/CatalogPage.tsx'
];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/Number\(\.id\)/g, 'Number(p.id)'); // We will check if it was row or p
  fs.writeFileSync(f, c);
}

