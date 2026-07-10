import { describe, it, expect, vi } from 'vitest';
import { mergeProducts, filterProducts, groupProductsBySection, createDefaultOverride } from './productTransforms';
import type { ProductViewModel } from '@/data/desembreProducts';
import type { ProductOverrideRow } from '../types';

describe('productTransforms', () => {
  const baseProducts: ProductViewModel[] = [
    { id: '1', displayNo: 1, name: 'Product A', desc: 'Desc A', section: 'Section 1', link: 'linkA' },
    { id: '2', displayNo: 2, name: 'Product B', desc: 'Desc B', section: 'Section 1', link: 'linkB' },
    { id: '3', displayNo: 3, name: 'Product C', desc: 'Desc C', section: 'Section 2', link: 'linkC' },
  ];

  // ── createDefaultOverride ────────────────────────────────────────────────
  describe('createDefaultOverride', () => {
    it('includes sort_order: null', () => {
      const row = createDefaultOverride('42', 42);
      expect(row.sort_order).toBeNull();
      expect(row.legacyNo).toBe(42);
      expect(row.id).toBe('42');
    });

    it('does NOT include original_no', () => {
      const row = createDefaultOverride('1', 1) as Record<string, unknown>;
      expect('original_no' in row).toBe(false);
    });
  });

  // ── mergeProducts ────────────────────────────────────────────────────────
  describe('mergeProducts', () => {
    it('1. Product có override deleted = true thì không xuất hiện', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '2': { ...createDefaultOverride('2', 2), deleted: true }
      };
      const result = mergeProducts(baseProducts, overrides);
      expect(result).toHaveLength(2);
      expect(result.find(p => p.id === '2')).toBeUndefined();
      expect(result.find(p => p.id === '1')).toBeDefined();
    });

    it('2. Override name, desc, section, link_url ghi đè đúng product gốc', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1': {
          ...createDefaultOverride('1', 1),
          name: 'New Name',
          desc: 'New Desc',
          section: 'New Section',
          link_url: 'new-link'
        }
      };

      const result = mergeProducts(baseProducts, overrides);
      const updatedProduct = result.find(p => p.id === '1');

      expect(updatedProduct?.name).toBe('New Name');
      expect(updatedProduct?.desc).toBe('New Desc');
      expect(updatedProduct?.section).toBe('New Section');
      expect(updatedProduct?.link).toBe('new-link');
    });

    it('3. Product custom có is_custom = true được thêm vào danh sách', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1001': {
          ...createDefaultOverride('1001', 1001),
          is_custom: true,
          name: 'Custom Product',
          section: 'Section Custom'
        }
      };
      const result = mergeProducts(baseProducts, overrides);
      expect(result).toHaveLength(4);
      const custom = result.find(p => p.id === '1001');
      expect(custom).toBeDefined();
      expect(custom?.name).toBe('Custom Product');
      expect(custom?.section).toBe('Section Custom');
    });

    it('7. Không mutate input ban đầu', () => {
      const originalCopy = JSON.parse(JSON.stringify(baseProducts));
      const overrides: Record<string, ProductOverrideRow> = {
        '1': { ...createDefaultOverride('1', 1), name: 'Mutated?' }
      };

      mergeProducts(baseProducts, overrides);
      expect(baseProducts).toEqual(originalCopy);
    });

    it('8. Sửa tên base product không tạo duplicate (chỉ cập nhật tại chỗ)', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1': {
          ...createDefaultOverride('1', 1),
          name: 'Tên Đã Sửa',
        }
      };
      const result = mergeProducts(baseProducts, overrides);
      expect(result).toHaveLength(3); // Giữ nguyên số lượng, không bị duplicate
      const product1 = result.find(p => p.id === '1');
      expect(product1?.name).toBe('Tên Đã Sửa');
    });

    it('9. Sửa tên sản phẩm không làm mất link/image đã cấu hình trước đó', () => {
      const initialOverride: ProductOverrideRow = {
        ...createDefaultOverride('1', 1),
        image_url: 'https://images.com/pic.png',
        link_url: 'https://links.com/abc',
      };

      const updatedOverride: ProductOverrideRow = {
        ...initialOverride,
        name: 'Tên Mới Sau Khi Sửa',
      };

      const result = mergeProducts(baseProducts, { 1: updatedOverride });
      const product1 = result.find(p => p.id === '1');
      expect(product1?.name).toBe('Tên Mới Sau Khi Sửa');
      expect(product1?.image).toBe('https://images.com/pic.png'); // Ảnh được giữ lại
      expect(product1?.link).toBe('https://links.com/abc'); // Link được giữ lại
    });

    it('10. Sửa section không làm mất ảnh/link của sản phẩm', () => {
      const initialOverride: ProductOverrideRow = {
        ...createDefaultOverride('1', 1),
        image_url: 'https://images.com/pic.png',
        link_url: 'https://links.com/abc',
      };

      const updatedOverride: ProductOverrideRow = {
        ...initialOverride,
        section: 'Nhóm Mới Chuyển Đến',
      };

      const result = mergeProducts(baseProducts, { 1: updatedOverride });
      const product1 = result.find(p => p.id === '1');
      expect(product1?.section).toBe('Nhóm Mới Chuyển Đến');
      expect(product1?.image).toBe('https://images.com/pic.png');
      expect(product1?.link).toBe('https://links.com/abc');
    });

    it('11. Thêm custom product không bị duplicate', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1001': {
          ...createDefaultOverride('1001', 1001),
          is_custom: true,
          name: 'Custom Product 1',
          section: 'Section Custom'
        }
      };

      const result = mergeProducts(baseProducts, overrides);
      expect(result).toHaveLength(4); // 3 base + 1 custom
      const customs = result.filter(p => p.id === '1001');
      expect(customs).toHaveLength(1); // Không bị duplicate
    });

    it('12. Xoá custom product xoá đúng row khỏi danh sách', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1001': {
          ...createDefaultOverride('1001', 1001),
          is_custom: true,
          name: 'Custom Product 1',
          section: 'Section Custom'
        }
      };

      const afterAdd = mergeProducts(baseProducts, overrides);
      expect(afterAdd).toHaveLength(4);

      const updatedOverrides = { ...overrides };
      delete updatedOverrides[1001];

      const afterDelete = mergeProducts(baseProducts, updatedOverrides);
      expect(afterDelete).toHaveLength(3); // Trở về 3 sản phẩm ban đầu
      expect(afterDelete.find(p => p.id === '1001')).toBeUndefined();
    });

    it('13. No là immutable, không đổi được ID sản phẩm', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1': {
          ...createDefaultOverride('1', 1),
          name: 'Sửa base 1',
        }
      };
      const result = mergeProducts(baseProducts, overrides);
      const matched = result.find(p => p.id === '1');
      expect(matched?.id).toBe('1'); // no luôn được bảo toàn
    });

    // ── sort_order tests ─────────────────────────────────────────────────
    it('sort_order: sản phẩm có sort_order được sort đúng thứ tự tăng dần trong section', () => {
      // Đặt product B (no=2) lên trước product A (no=1) bằng sort_order
      const overrides: Record<string, ProductOverrideRow> = {
        '1': { ...createDefaultOverride('1', 1), sort_order: 2 },
        '2': { ...createDefaultOverride('2', 2), sort_order: 1 },
      };
      const result = mergeProducts(baseProducts, overrides);
      // Lọc Section 1
      const sec1 = result.filter(p => p.section === 'Section 1');
      expect(sec1[0].id).toBe('2'); // sort_order=1 → đầu tiên
      expect(sec1[1].id).toBe('1'); // sort_order=2 → sau
    });

    it('sort_order: fallback theo default index khi sort_order null', () => {
      // Không có override → phải giữ thứ tự gốc 1, 2 trong Section 1
      const result = mergeProducts(baseProducts, {});
      const sec1 = result.filter(p => p.section === 'Section 1');
      expect(sec1[0].id).toBe('1');
      expect(sec1[1].id).toBe('2');
    });

    it('sort_order: custom product có sort_order null dùng fallback 999', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1001': {
          ...createDefaultOverride('1001', 1001),
          is_custom: true,
          name: 'Custom',
          section: 'Section 1',
          sort_order: null,
        }
      };
      const result = mergeProducts(baseProducts, overrides);
      const custom = result.find(p => p.id === '1001');
      expect(custom).toBeDefined();
      // sort_order null → fallback 999 → cuối section
      const sec1 = result.filter(p => p.section === 'Section 1');
      expect(sec1[sec1.length - 1].id).toBe('1001');
    });

    it('sort_order: merge bảo toàn sort_order từ override', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '3': { ...createDefaultOverride('3', 3), sort_order: 5 }
      };
      const result = mergeProducts(baseProducts, overrides);
      const p3 = result.find(p => p.id === '3');
      expect(p3?.sort_order).toBe(5);
    });

    it('custom product không bị duplicate khi no trùng base product bị deleted', () => {
      // Nếu có base product no=2 bị deleted, và custom no=2 (edge case)
      // thực tế no >= 1000 với custom, nhưng kiểm tra không duplicate trong mọi trường hợp
      const overrides: Record<string, ProductOverrideRow> = {
        '2': { ...createDefaultOverride('2', 2), deleted: true },
        '1001': { ...createDefaultOverride('1001', 1001), is_custom: true, name: 'C', section: 'Section 1' },
      };
      const result = mergeProducts(baseProducts, overrides);
      // no=2 bị xóa, no=1001 được thêm → tổng = 3 (1, 3, 1001)
      expect(result).toHaveLength(3);
      const nos = result.map(p => p.id);
      expect(nos).not.toContain('2');
      expect(nos).toContain('1001');
      // Không có duplicate
      expect(new Set(nos).size).toBe(nos.length);
    });
  });

  // ── filterProducts ───────────────────────────────────────────────────────
  describe('filterProducts', () => {
    it('4. filterProducts lọc đúng theo keyword', () => {
      const result1 = filterProducts(baseProducts, 'product a', 'ALL');
      expect(result1).toHaveLength(1);
      expect(result1[0].id).toBe('1');

      const result2 = filterProducts(baseProducts, 'desc c', 'ALL');
      expect(result2).toHaveLength(1);
      expect(result2[0].id).toBe('3');
    });

    it('5. filterProducts lọc đúng theo section', () => {
      const result1 = filterProducts(baseProducts, '', 'Section 1');
      expect(result1).toHaveLength(2);
      expect(result1.every(p => p.section === 'Section 1')).toBe(true);

      const result2 = filterProducts(baseProducts, '', 'Section 2');
      expect(result2).toHaveLength(1);
      expect(result2[0].id).toBe('3');
    });

    it('Lọc kết hợp keyword và section', () => {
      const result = filterProducts(baseProducts, 'product', 'Section 2');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('7. Không mutate input ban đầu', () => {
      const originalCopy = JSON.parse(JSON.stringify(baseProducts));
      filterProducts(baseProducts, 'product', 'Section 1');
      expect(baseProducts).toEqual(originalCopy);
    });
  });

  // ── groupProductsBySection ───────────────────────────────────────────────
  describe('groupProductsBySection', () => {
    it('6. groupProductsBySection trả về đúng cấu trúc và giữ đúng thứ tự section', () => {
      const result = groupProductsBySection(baseProducts);

      expect(result).toHaveLength(2);

      expect(result[0][0]).toBe('Section 1');
      expect(result[0][1]).toHaveLength(2);
      expect(result[0][1][0].id).toBe('1');
      expect(result[0][1][1].id).toBe('2');

      expect(result[1][0]).toBe('Section 2');
      expect(result[1][1]).toHaveLength(1);
      expect(result[1][1][0].id).toBe('3');
    });

    it('7. Không mutate input ban đầu', () => {
      const originalCopy = JSON.parse(JSON.stringify(baseProducts));
      groupProductsBySection(baseProducts);
      expect(baseProducts).toEqual(originalCopy);
    });
  });

  // ── original_no must NOT exist ───────────────────────────────────────────
  describe('original_no không tồn tại', () => {
    it('ProductOverrideRow không có field original_no', () => {
      const row = createDefaultOverride('1', 1) as Record<string, unknown>;
      expect('original_no' in row).toBe(false);
    });

    it('mergeProducts không dùng original_no để sort', () => {
      // Kết quả merge chỉ dùng sort_order và no, không bao giờ dùng original_no
      const overrides: Record<string, ProductOverrideRow> = {
        '1': { ...createDefaultOverride('1', 1), sort_order: 3 },
        '2': { ...createDefaultOverride('2', 2), sort_order: 1 },
      };
      const result = mergeProducts(baseProducts, overrides);
      for (const p of result) {
        expect((p as Record<string, unknown>)['original_no']).toBeUndefined();
      }
    });
  });

  // ── link_url_2 and link2 support ─────────────────────────────────────────
  describe('hỗ trợ link_url_2 và link2', () => {
    it('createDefaultOverride trả về link_url_2: null', () => {
      const row = createDefaultOverride('1', 1);
      expect(row.link_url_2).toBeNull();
    });

    it('mergeProducts map link_url_2 thành link2 đúng cho base product', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1': {
          ...createDefaultOverride('1', 1),
          link_url_2: 'http://test-link-2'
        }
      };
      const result = mergeProducts(baseProducts, overrides);
      const product1 = result.find(p => p.id === '1');
      expect(product1?.link2).toBe('http://test-link-2');
    });

    it('mergeProducts map link_url_2 thành link2 đúng cho custom product', () => {
      const overrides: Record<string, ProductOverrideRow> = {
        '1005': {
          ...createDefaultOverride('1005', 1005),
          is_custom: true,
          name: 'Custom Prod',
          section: 'Sec Custom',
          link_url_2: 'http://custom-link-2'
        }
      };
      const result = mergeProducts(baseProducts, overrides);
      const customProduct = result.find(p => p.id === '1005');
      expect(customProduct?.link2).toBe('http://custom-link-2');
    });
  });
});
