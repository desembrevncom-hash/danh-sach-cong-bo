import type { BrandId } from "@/config/brands";

export type ProductRowFromRpc = {
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

export type ProductViewModel = {
  /** The stable identity (UUID) from product_identities.id */
  id: string;
  /** The UI presentation sequence number */
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

export type ProductMutationPayload = {
  productId: string; // The database identity
  brand?: BrandId;
};

export type ProductOverrideRow = {
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

export type SaveProductOverridePayload = {
  productId?: string;
  brand?: string; // Add brand field
  legacyNo?: number; // for transition if needed
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

export type SaveProductOrderPayload = {
  section: string;
  ordered_ids: string[];
};

export type ProductActionHandlers = {
  onSetImage: (id: string, src: string | undefined) => Promise<void>;
  onSetLink: (id: string, href: string | undefined, isLink2?: boolean) => Promise<void>;
  onEdit: (p: ProductViewModel) => void;
  onDelete: (p: ProductViewModel) => Promise<void>;
  onRenameSection: (oldTitle: string, rows: ProductViewModel[]) => Promise<void>;
  onReorderProduct: (section: string, orderedIds: string[]) => Promise<void>;
};

/**
 * Initial values passed to ProductEditDialog.
 * `id` is undefined for create mode, defined for edit mode.
 */
export type ProductDialogInitial = {
  id?: string;
  section: string;
  name: string;
  desc: string;
  sort_order?: number | null;
};
