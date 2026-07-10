import type { SectionOption } from "@/config/brands";

interface ProductBase {
  section?: string | null;
  sort_order?: number | null;
  name?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export function sortProductRows<T extends ProductBase>(
  products: T[],
  sections: SectionOption[]
): T[] {
  // Map sections to their sort order
  const sectionOrderMap = new Map<string, number>();
  sections.forEach((sec, index) => {
    const order = sec.sort_order !== undefined && sec.sort_order !== null 
      ? sec.sort_order 
      : index;
    sectionOrderMap.set(sec.value, order);
  });

  return [...products].sort((a, b) => {
    // 1. Sort by section order
    const secA = a.section || "";
    const secB = b.section || "";
    
    const orderA = sectionOrderMap.has(secA) ? sectionOrderMap.get(secA)! : 9999;
    const orderB = sectionOrderMap.has(secB) ? sectionOrderMap.get(secB)! : 9999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 2. Sort by product sort_order within the same section
    const prodOrderA = a.sort_order ?? 9999;
    const prodOrderB = b.sort_order ?? 9999;

    if (prodOrderA !== prodOrderB) {
      return prodOrderA - prodOrderB;
    }

    // 3. Fallback to updated_at (newest first) for stable sorting
    const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;

    if (timeA !== timeB) {
      return timeB - timeA;
    }

    // 4. Ultimate fallback to name alphabetically
    const nameA = a.name || "";
    const nameB = b.name || "";
    return nameA.localeCompare(nameB, "vi");
  });
}
