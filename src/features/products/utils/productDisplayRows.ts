import { sections } from '@/data/desembreProducts';
import type { ProductViewModel } from '@/features/products/types';
import { groupProductsBySection } from './productTransforms';

export type ProductDisplayRow = ProductViewModel & {
  displayIndex: number;
  sectionLabel?: string;
};

export function buildProductDisplayRows(products: ProductViewModel[]): ProductDisplayRow[] {
  // We use the exact same grouping logic as the web UI
  const grouped = groupProductsBySection(products);
  const rows: ProductDisplayRow[] = [];
  let seq = 0;
  
  for (const [sectionTitle, items] of grouped) {
    const secMeta = sections.find((s) => s.title === sectionTitle);
    
    for (const item of items) {
      seq += 1;
      rows.push({
        ...item,
        displayIndex: seq,
        sectionLabel: secMeta?.vi,
      });
    }
  }
  return rows;
}
