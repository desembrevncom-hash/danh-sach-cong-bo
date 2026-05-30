import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace import paths
  content = content.replace(/@\/hooks\/useEditUnlock/g, '@/features/edit-unlock/hooks/useEditUnlock');
  content = content.replace(/@\/components\/UnlockDialog/g, '@/features/edit-unlock/components/UnlockDialog');
  content = content.replace(/@\/components\/ProductImageCell/g, '@/features/products/components/ProductImageCell');
  content = content.replace(/@\/components\/ProductLinkCell/g, '@/features/products/components/ProductLinkCell');
  content = content.replace(/@\/components\/ProductEditDialog/g, '@/features/products/components/ProductEditDialog');
  content = content.replace(/@\/components\/HistoryPanel/g, '@/features/products/components/HistoryPanel');
  content = content.replace(/@\/components\/ProductPDF/g, '@/features/export-pdf/components/ProductPDF');
  
  // Replace OverrideRow imports with ProductOverrideRow from types
  content = content.replace(/import\s+\{\s*saveProductOverride\s*,\s*type\s+OverrideRow\s*\}\s+from\s+['"]@\/lib\/saveOverride['"]/g, 'import { saveProductOverride } from "@/features/products/services/productOverrideService";\nimport type { ProductOverrideRow as OverrideRow } from "@/features/products/types"');
  
  // If it's importing only OverrideRow from saveOverride
  content = content.replace(/import\s+\{\s*(type\s+)?OverrideRow\s*\}\s+from\s+['"]@\/lib\/saveOverride['"]/g, 'import type { ProductOverrideRow as OverrideRow } from "@/features/products/types"');

  // If it's importing something else from saveOverride
  content = content.replace(/@\/lib\/saveOverride/g, '@/features/products/services/productOverrideService');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
}
