export const BRAND_CONFIG = {
  desembre: {
    id: "desembre",
    label: "Desembre",
    path: "/desembre",
  },
  dermagarden: {
    id: "dermagarden",
    label: "Dermagarden",
    path: "/dermagarden",
  },
} as const;

export type BrandId = keyof typeof BRAND_CONFIG;

export type BrandTheme = {
  id: BrandId;
  name: string;
  website?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  accentColor: string;
  backgroundClass: string;
  otherBrandId: BrandId;
};

export const BRAND_THEMES: Record<BrandId, BrandTheme> = {
  desembre: {
    id: "desembre",
    name: "Desembre",
    website: "www.desembrevn.com",
    eyebrow: "WWW.DESEMBREVN.COM · 2026 CATALOG",
    title: "Danh Sách Công Bố Sản Phẩm Desembre",
    subtitle: "Bộ sưu tập đầy đủ các dòng sản phẩm chăm sóc da chuyên nghiệp Desembre — đã công bố lưu hành tại Việt Nam.",
    accentColor: "bg-accent",
    backgroundClass: "bg-gradient-to-br from-primary/5 to-transparent",
    otherBrandId: "dermagarden",
  },
  dermagarden: {
    id: "dermagarden",
    name: "Dermagarden",
    website: "www.dermagarden.com",
    eyebrow: "WWW.DERMAGARDEN.COM · 2026 CATALOG",
    title: "Danh Sách Công Bố Sản Phẩm Dermagarden",
    subtitle: "Bộ sưu tập đầy đủ các dòng sản phẩm chăm sóc da chuyên nghiệp Dermagarden — đã công bố lưu hành tại Việt Nam.",
    accentColor: "bg-primary",
    backgroundClass: "bg-gradient-to-bl from-primary/5 to-transparent",
    otherBrandId: "desembre",
  },
};

export function resolveBrandId(rawBrandId?: string): BrandId {
  if (rawBrandId === "dermagarden") return "dermagarden";
  return "desembre";
}

export type SectionOption = {
  value: string;
  label: string;
  sort_order?: number;
  active?: boolean;
  brand?: string;
};

export const ALL_SECTION_VALUE = "__ALL__";

export const SECTION_LABELS: Record<string, string> = {
  CLEANSER: "CLEANSER — Làm sạch",
  TONER: "TONER — Cân bằng",
  "CREAM MASK": "CREAM MASK — Mặt nạ kem",
  "PROTECTION CARE": "PROTECTION CARE — Chống nắng",
  CREAM: "CREAM — Kem dưỡng",
  SERUM: "SERUM",
  CONCENTRATE: "CONCENTRATE — Tinh chất cô đặc",
  AMPOULE: "AMPOULE — Dịch chiết TBG / Huyết thanh",
  AMPOULING: "AMPOULING — Huyết thanh",
  ESSENCE: "ESSENCE — Tinh chất",
  GEL: "GEL",
  MASSAGE: "MASSAGE",
  "SHEET MASK": "SHEET MASK — Mặt nạ miếng",
  MODELING: "MODELING — Mặt nạ thạch",
  "THERAPY TREATMENT / SET": "THERAPY TREATMENT / SET — Set chăm sóc chuyên sâu",
};

export function formatSectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section;
}

export const BRAND_SECTION_OPTIONS: Record<BrandId, SectionOption[]> = {
  desembre: [
    { value: "CLEANSER", label: "CLEANSER — Làm sạch" },
    { value: "TONER", label: "TONER — Cân bằng" },
    { value: "CREAM MASK", label: "CREAM MASK — Mặt nạ kem" },
    { value: "PROTECTION CARE", label: "PROTECTION CARE — Chống nắng" },
    { value: "CREAM", label: "CREAM — Kem dưỡng" },
    { value: "SERUM", label: "SERUM" },
    { value: "CONCENTRATE", label: "CONCENTRATE — Tinh chất cô đặc" },
    { value: "AMPOULE", label: "AMPOULE — Dịch chiết TBG" },
    { value: "AMPOULING", label: "AMPOULING — Huyết thanh" },
    { value: "ESSENCE", label: "ESSENCE — Tinh chất" },
    { value: "GEL", label: "GEL" },
    { value: "MASSAGE", label: "MASSAGE" },
    { value: "SHEET MASK", label: "SHEET MASK — Mặt nạ miếng" },
    { value: "MODELING", label: "MODELING — Mặt nạ thạch" },
    { value: "THERAPY TREATMENT / SET", label: "THERAPY TREATMENT / SET — Set chăm sóc chuyên sâu" }
  ],
  dermagarden: [
    { value: "CLEANSER", label: "CLEANSER — Làm sạch" },
    { value: "TONER", label: "TONER — Cân bằng" },
    { value: "CREAM MASK", label: "CREAM MASK — Mặt nạ kem" },
    { value: "PROTECTION CARE", label: "PROTECTION CARE — Chống nắng" },
    { value: "CREAM", label: "CREAM — Kem dưỡng" },
    { value: "SERUM", label: "SERUM" },
    { value: "CONCENTRATE", label: "CONCENTRATE — Tinh chất cô đặc" },
    { value: "AMPOULE", label: "AMPOULE — Dịch chiết TBG / Huyết thanh" },
    { value: "ESSENCE", label: "ESSENCE — Tinh chất" },
    { value: "GEL", label: "GEL" },
    { value: "MASSAGE", label: "MASSAGE" },
    { value: "SHEET MASK", label: "SHEET MASK — Mặt nạ miếng" },
    { value: "MODELING", label: "MODELING — Mặt nạ thạch" },
    { value: "THERAPY TREATMENT / SET", label: "THERAPY TREATMENT / SET — Set chăm sóc chuyên sâu" }
  ]
};

export function getBrandSectionOptions(brand: BrandId): SectionOption[] {
  return BRAND_SECTION_OPTIONS[brand] ?? [];
}

export function isValidSectionForBrand(brand: BrandId, section: string): boolean {
  if (section === ALL_SECTION_VALUE) return true;
  return getBrandSectionOptions(brand).some((item) => item.value === section);
}
