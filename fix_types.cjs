const fs = require('fs');

let c = fs.readFileSync('src/features/products/types.ts', 'utf8');

c = c.replace(/export type ProductRowFromRpc = \{[\s\S]*?\};\n/, `export type ProductRowFromRpc = {
  id: string;
  legacy_no?: number | null;
  display_no: number;
  brand?: string;
  section: string;
  name: string;
  desc: string;
  image_url?: string;
  link_url?: string;
  link_url_2?: string;
  is_custom?: boolean;
  sort_order?: number;
  total_count?: number;
};
`);

c = c.replace(/export type ProductViewModel = \{[\s\S]*?\};\n/, `export type ProductViewModel = {
  id: string; // the database identity (from id)
  displayNo: number; // the visual sequence
  brand?: BrandId;
  section: string;
  name: string;
  desc: string;
  image?: string;
  link?: string;
  link2?: string;
  sortOrder?: number | null;
};
`);

c = c.replace(/export type ProductOverrideRow = \{[\s\S]*?\};\n/, `export type ProductOverrideRow = {
  id: string;
  legacyNo?: number;
  image_url: string | null;
  link_url: string | null;
  section: string | null;
  name: string | null;
  desc: string | null;
  deleted: boolean;
  is_custom: boolean;
  sort_order: number | null;
  link_url_2: string | null;
};
`);

c = c.replace(/export type SaveProductOverridePayload = \{[\s\S]*?\};\n/, `export type SaveProductOverridePayload = {
  productId?: string;
  legacyNo?: number; // for transition if needed
  password?: string;
  action?: "upsert" | "create" | "hard_delete";
  image_data_url?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  section?: string | null;
  name?: string | null;
  desc?: string | null;
  deleted?: boolean;
  is_custom?: boolean;
  sort_order?: number | null;
  link_url_2?: string | null;
};
`);

c = c.replace(/export type SaveProductOrderPayload = \{[\s\S]*?\};\n/, `export type SaveProductOrderPayload = {
  password?: string;
  section: string;
  ordered_ids: string[];
};
`);

fs.writeFileSync('src/features/products/types.ts', c);
