export type ProductOverrideRow = {
  no: number;
  image_url: string | null;
  link_url: string | null;
  section: string | null;
  name: string | null;
  desc: string | null;
  deleted: boolean;
  is_custom: boolean;
};

export type SaveProductOverridePayload = {
  no?: number;
  original_no?: number;
  password: string;
  action?: "upsert" | "create" | "hard_delete";
  image_data_url?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  section?: string | null;
  name?: string | null;
  desc?: string | null;
  deleted?: boolean;
  is_custom?: boolean;
};

import type { FlatProduct } from "@/data/desembreProducts";

export type ProductActionHandlers = {
  onSetImage: (no: number, src: string | undefined) => Promise<void>;
  onSetLink: (no: number, href: string | undefined) => Promise<void>;
  onEdit: (p: FlatProduct) => void;
  onDelete: (p: FlatProduct) => Promise<void>;
  onRenameSection: (oldTitle: string, rows: FlatProduct[]) => Promise<void>;
};

/**
 * Initial values passed to ProductEditDialog.
 * `no` is undefined for create mode, defined for edit mode.
 */
export type ProductDialogInitial = {
  no?: number;
  section: string;
  name: string;
  desc: string;
};
