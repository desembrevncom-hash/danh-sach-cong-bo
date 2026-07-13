import type { ProductRowFromRpc, ProductViewModel } from "./types";
import { resolveBrandId } from "@/config/brands";

export function mapProductRowToViewModel(row: ProductRowFromRpc): ProductViewModel {
  // Round 4: ProductRowFromRpc provides a strict uuid `id`.
  const idValue = row.id;
  
  if (idValue === undefined || idValue === null) {
    throw new Error("Missing product identity from RPC row");
  }

  return {
    id: String(idValue),
    displayNo: Number(row.display_no), // mapped from display_no
    brand: resolveBrandId(row.brand),
    section: row.section ?? "",
    name: row.name ?? "",
    desc: row.desc ?? "",
    image: row.image_url ?? undefined,
    link: row.link_url ?? undefined,
    link2: row.link_url_2 ?? undefined,
    sortOrder: row.sort_order ?? undefined,
  };
}

export function mapProductRowsToViewModels(rows: ProductRowFromRpc[]): ProductViewModel[] {
  return rows.map(mapProductRowToViewModel);
}
