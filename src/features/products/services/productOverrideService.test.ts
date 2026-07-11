import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAllProductOverrides, saveProductOverride, saveProductOrder } from './productOverrideService';
import { supabase } from '@/integrations/supabase/client';

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock the env variables used in productOverrideService.ts
vi.stubEnv('VITE_SUPABASE_URL', 'https://mock-project.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key');

describe('productOverrideService', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockSelect.mockReset();
    (supabase.from as import('vitest').Mock).mockImplementation(mockFrom);
    
    global.fetch = vi.fn();
  });

  describe('fetchAllProductOverrides', () => {
    it('calls supabase.from("product_overrides").select("*")', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });

      const result = await fetchAllProductOverrides();
      expect(mockFrom).toHaveBeenCalledWith('product_overrides');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result.ok).toBe(true);
    });

    it('returns error when supabase errors', async () => {
      mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await fetchAllProductOverrides();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('DB error');
      }
    });
  });

  describe('saveProductOverride', () => {
    const payload = { productId: "1", action: 'upsert' as const, name: 'Test' };

    it('returns error when accessToken is missing', async () => {
      const res = await saveProductOverride(payload, '');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }
    });

    it('calls edge function via fetch and returns success', async () => {
      (global.fetch as import('vitest').Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ row: { productId: "1" } }),
      });

      const res = await saveProductOverride(payload, 'mock-access-token');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.row).toEqual({ productId: "1" });
      }
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/functions/v1/save-product-override'), expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          "Authorization": "Bearer mock-access-token",
          "apikey": expect.any(String),
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(payload),
        signal: expect.any(AbortSignal),
      }));
    });

    it('handles 401 error', async () => {
      (global.fetch as import('vitest').Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      const res = await saveProductOverride(payload, 'mock-access-token');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('Phiên đăng nhập hết hạn hoặc bạn cần đăng nhập Admin.');
      }
    });

    it('handles 403 error', async () => {
      (global.fetch as import('vitest').Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      const res = await saveProductOverride(payload, 'mock-access-token');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('Bạn không có quyền thực hiện thao tác này.');
      }
    });

    it('handles 400 error from edge payload', async () => {
      (global.fetch as import('vitest').Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Custom validation error' }),
      });

      const res = await saveProductOverride(payload, 'mock-access-token');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('Custom validation error');
      }
    });

    it('handles 500 error', async () => {
      (global.fetch as import('vitest').Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const res = await saveProductOverride(payload, 'mock-access-token');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('Lỗi hệ thống máy chủ.');
      }
    });

    it('handles AbortError timeout', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      (global.fetch as import('vitest').Mock).mockRejectedValue(abortError);

      const res = await saveProductOverride(payload, 'mock-access-token');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('Lưu sản phẩm quá lâu. Vui lòng thử lại.');
      }
    });
  });

  describe('saveProductOrder', () => {
    const payload = { password: 'pw', section: 'S', ordered_ids: ["1", "2"] };

    it('calls edge function via fetch and returns success', async () => {
      const mockRows = [{ productId: "1", sort_order: 1, section: 'S' }];
      (global.fetch as import('vitest').Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ rows: mockRows }),
      });

      const res = await saveProductOrder(payload, 'mock-access-token');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.rows).toEqual(mockRows);
      }
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/functions/v1/save-product-order'), expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          "Authorization": "Bearer mock-access-token",
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(payload),
      }));
    });

    it('handles 400 error', async () => {
      (global.fetch as import('vitest').Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid data' }),
      });

      const res = await saveProductOrder(payload, 'mock-access-token');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('Invalid data');
      }
    });
  });
});
