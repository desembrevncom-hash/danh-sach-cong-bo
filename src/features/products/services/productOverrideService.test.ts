/**
 * Tests for productOverrideService.ts
 *
 * These tests verify:
 * - No client-side ID allocation (no direct DB query for `no`)
 * - No fallback direct DB writes
 * - saveProductOverride only calls Edge Function
 * - saveProductOrder only calls Edge Function
 * - No original_no in service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — use vi.hoisted() to declare mocks safely
const { mockInvoke, mockFrom } = vi.hoisted(() => {
  const mockInvoke = vi.fn();
  const mockFrom = vi.fn();
  return { mockInvoke, mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: mockInvoke,
    },
  },
}));

import {
  fetchAllProductOverrides,
  saveProductOverride,
  saveProductOrder,
} from '../services/productOverrideService';

describe('productOverrideService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── fetchAllProductOverrides ─────────────────────────────────────────────
  describe('fetchAllProductOverrides', () => {
    it('calls supabase.from("product_overrides").select("*")', async () => {
      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchAllProductOverrides();
      expect(mockFrom).toHaveBeenCalledWith('product_overrides');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result.ok).toBe(true);
    });

    it('returns error when supabase errors', async () => {
      const mockSelect = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchAllProductOverrides();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('DB error');
      }
    });
  });

  // ── saveProductOverride ──────────────────────────────────────────────────
  describe('saveProductOverride', () => {
    it('calls Edge Function "save-product-override" — does NOT query DB directly', async () => {
      mockInvoke.mockResolvedValue({ data: { ok: true, row: { no: 1 } }, error: null });

      await saveProductOverride({ password: 'pw', no: 1, name: 'Test' });

      // Must call Edge Function
      expect(mockInvoke).toHaveBeenCalledWith('save-product-override', expect.anything());

      // Must NOT call supabase.from() for any table (no direct DB writes/reads)
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('create action does NOT do client-side no allocation — passes payload directly to Edge Function', async () => {
      mockInvoke.mockResolvedValue({ data: { ok: true, row: { no: 1001 } }, error: null });

      await saveProductOverride({ password: 'pw', action: 'create', name: 'New', section: 'CLEANSER' });

      // Should only call invoke once, never supabase.from()
      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(mockFrom).not.toHaveBeenCalled();

      // The payload sent to Edge Function must keep action: 'create'
      // (frontend must NOT change it to 'upsert' or pre-allocate no)
      const invokeCall = mockInvoke.mock.calls[0];
      expect(invokeCall[0]).toBe('save-product-override');
      const body = invokeCall[1]?.body;
      expect(body?.action).toBe('create');
      // no should NOT be pre-filled by frontend
      expect(body?.no).toBeUndefined();
    });

    it('returns error from Edge Function without fallback', async () => {
      mockInvoke.mockResolvedValue({ data: { error: 'Mật khẩu không hợp lệ' }, error: null });

      const result = await saveProductOverride({ password: 'wrong', no: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Mật khẩu không hợp lệ');
      }
      // No fallback: supabase.from() must not be called
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns error when network fails — no fallback to direct DB', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: { message: 'Network error' } });

      const result = await saveProductOverride({ password: 'pw', no: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Network error');
      }
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('does NOT include original_no field in SaveProductOverridePayload', async () => {
      mockInvoke.mockResolvedValue({ data: { ok: true, row: { no: 1 } }, error: null });

      const payload = { password: 'pw', no: 1, name: 'Test' };
      // Payload must NOT have original_no
      expect((payload as Record<string, unknown>)['original_no']).toBeUndefined();

      await saveProductOverride(payload);

      const invokedBody = mockInvoke.mock.calls[0][1]?.body;
      expect((invokedBody as Record<string, unknown>)?.['original_no']).toBeUndefined();
    });
  });

  // ── saveProductOrder ─────────────────────────────────────────────────────
  describe('saveProductOrder', () => {
    it('calls Edge Function "save-product-order" only — no direct DB writes', async () => {
      mockInvoke.mockResolvedValue({ data: { ok: true, rows: [] }, error: null });

      await saveProductOrder({ password: 'pw', section: 'CLEANSER', ordered_nos: [1, 2, 3] });

      expect(mockInvoke).toHaveBeenCalledWith('save-product-order', expect.anything());
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns rows from Edge Function response', async () => {
      const mockRows = [
        { no: 1, sort_order: 1, section: 'CLEANSER' },
        { no: 2, sort_order: 2, section: 'CLEANSER' },
      ];
      mockInvoke.mockResolvedValue({ data: { ok: true, rows: mockRows }, error: null });

      const result = await saveProductOrder({ password: 'pw', section: 'CLEANSER', ordered_nos: [1, 2] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rows).toEqual(mockRows);
      }
    });

    it('surfaces Edge Function error without fallback', async () => {
      mockInvoke.mockResolvedValue({ data: { error: 'Dữ liệu không hợp lệ' }, error: null });

      const result = await saveProductOrder({ password: 'pw', section: '', ordered_nos: [] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Dữ liệu không hợp lệ');
      }
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
