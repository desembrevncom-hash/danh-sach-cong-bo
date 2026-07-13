import { describe, it, expect } from "vitest";
import { generateHealthAlerts, buildStats } from "./adminHealthAlerts";

describe("generateHealthAlerts", () => {
  it("generates warning when image is missing", () => {
    const products = [
      { id: "1", image_url: null, link_url: "http://example.com" },
    ];
    const stats = buildStats(products);
    const alerts = generateHealthAlerts(stats);
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe("alert-missing-image");
    expect(alerts[0].severity).toBe("warning");
  });

  it("generates warning when primary link is missing", () => {
    const products = [
      { id: "1", image_url: "http://image.com", link_url: null },
    ];
    const stats = buildStats(products);
    const alerts = generateHealthAlerts(stats);
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe("alert-missing-link");
    expect(alerts[0].severity).toBe("warning");
  });

  it("generates info when brand is completely hidden", () => {
    const products = [
      { id: "1", brand: "desembre", image_url: "http://image.com", link_url: "http://example.com", deleted: true },
    ];
    const stats = buildStats(products);
    const alerts = generateHealthAlerts(stats);
    
    // Will contain both hidden-products and brand-hidden alerts
    expect(alerts.some(a => a.id === "alert-brand-hidden-desembre")).toBe(true);
    expect(alerts.some(a => a.id === "alert-hidden-products")).toBe(true);
    const brandAlert = alerts.find(a => a.id === "alert-brand-hidden-desembre");
    expect(brandAlert?.severity).toBe("info");
  });

  it("generates success when no issues", () => {
    const products = [
      { id: "1", image_url: "http://image.com", link_url: "http://example.com", deleted: false },
    ];
    const stats = buildStats(products);
    const alerts = generateHealthAlerts(stats);
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe("alert-success");
    expect(alerts[0].severity).toBe("success");
  });

  it("stable IDs without Math.random", () => {
    const products = [
      { id: "1", image_url: null, link_url: null, deleted: true },
    ];
    const stats1 = buildStats(products);
    const alerts1 = generateHealthAlerts(stats1);
    
    const stats2 = buildStats(products);
    const alerts2 = generateHealthAlerts(stats2);
    
    expect(alerts1.map(a => a.id)).toEqual(alerts2.map(a => a.id));
  });
});
