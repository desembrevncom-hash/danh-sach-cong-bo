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

export function resolveBrandId(rawBrandId?: string): BrandId {
  if (rawBrandId === "dermagarden") return "dermagarden";
  return "desembre";
}
