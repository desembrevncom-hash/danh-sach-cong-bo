import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAllProductOverrides, saveProductOverride, saveProductOrder } from './productOverrideService';
import { supabase } from '@/integrations/supabase/client';

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('productOverrideService', () => {
  const mockInvoke = supabase.functions.invoke as import('vitest').Mock;

  beforeEach(() => {
    mockInvoke.mockReset();
    mockFrom.mockReset();
    mockSelect.mockReset();
    (supabase.from as import('vitest').Mock).mockImplementation(mockFrom);
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
    it('calls edge function and returns success for upsert', async () => {
      mockInvoke.mockResolvedValue({ data: { ok: true, row: { productId: "1" } }, error: null, status: 200 });

      const res = await saveProductOverride({ productId: "1", action: 'upsert', name: 'Test' });
      expect(res.ok).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('save-product-override', {
        body: { productId: "1", action: 'upsert', name: 'Test' },
        headers: {},
      });
    });

    it('returns error message from edge function payload on 400', async () => {
      mockInvoke.mockResolvedValue({
        data: { error: 'Custom error from DB' },
        error: null,
        status: 400
      });

      const res = await saveProductOverride({ productId: "1" });
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Custom error from DB');
    });

    it('returns standard error message on 403', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: null,
        status: 403
      });

      const res = await saveProductOverride({ productId: "1" });
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Bạn không có quyền thực hiện thao tác này.');
    });

    it('returns network error message on 500', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: null,
        status: 500
      });

      const res = await saveProductOverride({ productId: "1" });
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Lỗi hệ thống máy chủ.');
    });
  });

  describe('saveProductOrder', () => {
    it('calls edge function for ordering', async () => {
      mockInvoke.mockResolvedValue({ data: { ok: true }, error: null, status: 200 });

      const res = await saveProductOrder({ password: 'pw', section: 'S', ordered_ids: ["1", "2"] });
      expect(res.ok).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('save-product-order', {
        body: { password: 'pw', section: 'S', ordered_ids: ["1", "2"] },
        headers: {},
      });
    });

    it('returns rows from Edge Function response', async () => {
      const mockRows = [
        { productId: "1", sort_order: 1, section: 'CLEANSER' },
        { productId: "2", sort_order: 2, section: 'CLEANSER' },
      ];
      mockInvoke.mockResolvedValue({ data: { ok: true, rows: mockRows }, error: null, status: 200 });

      const result = await saveProductOrder({ password: 'pw', section: 'CLEANSER', ordered_ids: ["1", "2"] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rows).toEqual(mockRows);
      }
    });

    it('surfaces Edge Function error without fallback', async () => {
      mockInvoke.mockResolvedValue({ data: { error: 'Dữ liệu không hợp lệ' }, error: null, status: 400 });

      const result = await saveProductOrder({ password: 'pw', section: '', ordered_ids: [] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Dữ liệu không hợp lệ');
      }
    });
  });
});
