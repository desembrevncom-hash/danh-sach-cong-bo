export type AdminHealthAlertSeverity = "success" | "info" | "warning" | "error";

export type AdminHealthAlert = {
  id: string;
  title: string;
  message: string;
  severity: AdminHealthAlertSeverity;
  brand?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type ProductInput = {
  id: string;
  image_url?: string | null;
  link_url?: string | null;
  deleted?: boolean;
  brand?: string | null;
};

export type DashboardStats = {
  total: number;
  visible: number;
  hidden: number;
  missingImage: number;
  missingPrimaryLink: number;
  brands: Record<string, { total: number; visible: number }>;
};

export function buildStats(products: ProductInput[]): DashboardStats {
  const stats: DashboardStats = {
    total: products.length,
    visible: 0,
    hidden: 0,
    missingImage: 0,
    missingPrimaryLink: 0,
    brands: {},
  };

  products.forEach((p) => {
    const isVisible = !p.deleted;
    const brand = p.brand || "desembre";

    if (isVisible) stats.visible++;
    else stats.hidden++;

    if (!p.image_url) stats.missingImage++;
    if (!p.link_url) stats.missingPrimaryLink++;

    if (!stats.brands[brand]) {
      stats.brands[brand] = { total: 0, visible: 0 };
    }
    stats.brands[brand].total++;
    if (isVisible) stats.brands[brand].visible++;
  });

  return stats;
}

/**
 * Sinh cảnh báo sức khỏe dữ liệu (Health Alerts) tự động từ DashboardStats.
 */
export function generateHealthAlerts(stats: DashboardStats): AdminHealthAlert[] {
  const alerts: AdminHealthAlert[] = [];

  // 1. Missing Image
  if (stats.missingImage > 0) {
    alerts.push({
      id: "alert-missing-image",
      severity: "warning",
      title: "Có sản phẩm thiếu hình ảnh",
      message: `${stats.missingImage} sản phẩm chưa có hình ảnh.`,
    });
  }

  // 2. Missing Primary Link
  if (stats.missingPrimaryLink > 0) {
    alerts.push({
      id: "alert-missing-link",
      severity: "warning",
      title: "Có sản phẩm thiếu link công bố",
      message: `${stats.missingPrimaryLink} sản phẩm chưa có link công bố.`,
    });
  }

  // 3. Brand completely hidden
  Object.entries(stats.brands).forEach(([brandName, brandStats]) => {
    if (brandStats.total > 0 && brandStats.visible === 0) {
      alerts.push({
        id: `alert-brand-hidden-${brandName}`,
        severity: "info",
        title: `${brandName} đang bị ẩn toàn bộ`,
        message: "Khách truy cập sẽ không thấy sản phẩm nào của thương hiệu này.",
        brand: brandName,
      });
    }
  });

  // 4. Hidden products
  if (stats.hidden > 0) {
    alerts.push({
      id: "alert-hidden-products",
      severity: "info",
      title: "Có sản phẩm đang ẩn",
      message: `${stats.hidden} sản phẩm đang bị ẩn khỏi catalog public.`,
    });
  }

  // 5. Success
  if (alerts.length === 0) {
    alerts.push({
      id: "alert-success",
      severity: "success",
      title: "Danh mục đang ổn định",
      message: "Không phát hiện vấn đề dữ liệu nghiêm trọng.",
    });
  }

  return alerts;
}
