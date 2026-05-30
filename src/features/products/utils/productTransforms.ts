import { sections, type FlatProduct } from "@/data/desembreProducts";
import type { ProductOverrideRow } from "../types";

export function mergeProducts(
  baseProducts: FlatProduct[],
  overrides: Record<number, ProductOverrideRow>
): FlatProduct[] {
  const list: FlatProduct[] = [];
  for (const p of baseProducts) {
    const o = overrides[p.no];
    if (o?.deleted) continue;
    list.push({
      ...p,
      name: o?.name ?? p.name,
      desc: o?.desc ?? p.desc,
      section: o?.section ?? p.section,
      link: o?.link_url ?? p.link,
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
    });
  }
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
