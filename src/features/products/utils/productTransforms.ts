import { sections, type FlatProduct } from "@/data/desembreProducts";
import type { ProductOverrideRow } from "../types";

export function mergeProducts(
  baseProducts: FlatProduct[],
  overrides: Record<number, ProductOverrideRow>
): FlatProduct[] {
  // 1. Group base products by section to calculate their default baseline sort order
  const baseProductsBySection: Record<string, FlatProduct[]> = {};
  for (const p of baseProducts) {
    if (!baseProductsBySection[p.section]) {
      baseProductsBySection[p.section] = [];
    }
    baseProductsBySection[p.section].push(p);
  }

  const list: FlatProduct[] = [];
  
  for (const p of baseProducts) {
    const o = overrides[p.no];
    if (o?.deleted) continue;

    // Default index is its 1-indexed order within its own section group
    const sectionList = baseProductsBySection[p.section] || [];
    const defaultIdx = sectionList.findIndex((item) => item.no === p.no);
    const defaultSort = defaultIdx !== -1 ? defaultIdx + 1 : 999;

    list.push({
      ...p,
      name: o?.name ?? p.name,
      desc: o?.desc ?? p.desc,
      section: o?.section ?? p.section,
      link: o?.link_url ?? p.link,
      image: o?.image_url ?? p.image,
      sort_order: o?.sort_order !== undefined && o?.sort_order !== null ? o.sort_order : defaultSort,
    });
  }
  
  // Custom products (no >= 1000)
  for (const o of Object.values(overrides)) {
    if (!o.is_custom || o.deleted) continue;
    const sec = sections.find((s) => s.title === (o.section ?? ""));
    list.push({
      no: o.no,
      name: o.name ?? "(Chưa có tên)",
      desc: o.desc ?? "",
      section: o.section ?? "OTHER",
      sectionVi: sec?.vi,
      link: o.link_url ?? undefined,
      image: o.image_url ?? undefined,
      sort_order: o.sort_order !== undefined && o.sort_order !== null ? o.sort_order : 999,
    });
  }

  // Sort by section order (matching static sections array) then by sort_order
  const sectionTitles = sections.map((s) => s.title);
  list.sort((a, b) => {
    const secA = sectionTitles.indexOf(a.section);
    const secB = sectionTitles.indexOf(b.section);
    
    // If one is in "OTHER" or custom section not in main sections list, put at the end
    const idxA = secA === -1 ? 999 : secA;
    const idxB = secB === -1 ? 999 : secB;
    
    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });

  return list;
}

export function filterProducts(
  products: FlatProduct[],
  query: string,
  section: string
): FlatProduct[] {
  const q = query.trim().toLowerCase();
  return products.filter((p) => {
    const matchesSection = section === "ALL" || p.section === section;
    const matchesQuery =
      !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    return matchesSection && matchesQuery;
  });
}

export function groupProductsBySection(
  products: FlatProduct[]
): [string, FlatProduct[]][] {
  const map = new Map<string, FlatProduct[]>();
  for (const p of products) {
    const arr = map.get(p.section) ?? [];
    arr.push(p);
    map.set(p.section, arr);
  }
  return Array.from(map.entries());
}

export function createDefaultOverride(no: number): ProductOverrideRow {
  return {
    no,
    image_url: null,
    link_url: null,
    section: null,
    name: null,
    desc: null,
    deleted: false,
    is_custom: false,
  };
}
